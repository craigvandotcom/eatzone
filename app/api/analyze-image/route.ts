import { NextRequest, NextResponse } from 'next/server';
import { openrouter } from '@/lib/ai/openrouter';
import { z } from 'zod';
import { prompts } from '@/lib/prompts'; // Import from our new module
import { getRateLimiter } from '@/lib/rate-limit';
import { sanitizeAIPrompt } from '@/lib/security/sanitization';
import {
  validateImageAnalysisRequest,
  createValidationErrorResponse,
} from '@/lib/middleware/request-validation';
import { logger } from '@/lib/utils/logger';
import { aiPerformanceMonitor } from '@/lib/monitoring/ai-performance';
import type { OpenRouterMessageContent } from '@/lib/types';

// Zod schema for request validation - supports both single and multiple images
const analyzeImageSchema = z
  .object({
    image: z.string().min(1, 'Image data is required').optional(),
    images: z.array(z.string().min(1)).optional(),
  })
  .refine(data => data.image || (data.images && data.images.length > 0), {
    message: 'Either image or images array is required',
  });

// Types for AI response transformation
interface RawAIIngredient {
  name: string;
  isOrganic?: boolean;
  organic?: boolean;
}

interface RawAIResponse {
  mealSummary?: string;
  meal_summary?: string;
  ingredients?: RawAIIngredient[];
}

// Zod schema for AI response validation with fallback handling
const aiResponseSchema = z.preprocess(
  (data: unknown) => {
    if (!data || typeof data !== 'object') return data;

    const rawData = data as RawAIResponse;
    const transformed: {
      mealSummary?: string;
      ingredients?: Array<{ name: string; isOrganic: boolean }>;
    } = {};

    // Handle mealSummary vs meal_summary
    if (rawData.mealSummary) {
      transformed.mealSummary = rawData.mealSummary;
    } else if (rawData.meal_summary) {
      transformed.mealSummary = rawData.meal_summary;
    }

    // Handle ingredients array
    if (Array.isArray(rawData.ingredients)) {
      transformed.ingredients = rawData.ingredients.map(
        (ingredient: RawAIIngredient) => ({
          name: ingredient.name,
          // Handle isOrganic vs organic
          isOrganic:
            ingredient.isOrganic !== undefined
              ? ingredient.isOrganic
              : (ingredient.organic ?? false),
        })
      );
    }

    return transformed;
  },
  z.object({
    mealSummary: z.string().min(1, 'Meal summary is required'),
    ingredients: z.array(
      z.object({
        name: z.string().min(1, 'Ingredient name is required'),
        isOrganic: z.boolean(),
      })
    ),
  })
);

// Type for the API response
type AnalyzeImageResponse = z.infer<typeof aiResponseSchema>;

interface AnalyzeImageErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
  };
}

export async function POST(request: NextRequest) {
  logger.info('Image analysis request received');

  // Start performance monitoring
  const performanceId = aiPerformanceMonitor.startRequest('image-analysis');

  try {
    // Log environment check
    if (!process.env.OPENROUTER_API_KEY) {
      logger.error('OPENROUTER_API_KEY is not configured');
      return NextResponse.json(
        {
          error: {
            message: 'AI service not configured. Please contact support.',
            code: 'SERVICE_NOT_CONFIGURED',
            statusCode: 503,
          },
        },
        { status: 503 }
      );
    }

    // Log prompt availability
    if (!prompts?.imageAnalysis) {
      logger.error('Image analysis prompt not loaded');
      return NextResponse.json(
        {
          error: {
            message: 'AI service configuration error.',
            code: 'PROMPT_NOT_LOADED',
            statusCode: 500,
          },
        },
        { status: 500 }
      );
    }
    // Rate limiting check - always enforced (Redis or memory fallback)
    const rateLimiter = getRateLimiter();
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] ?? realIp ?? '127.0.0.1';

    const rateLimitResult = await rateLimiter.limitImageAnalysis(ip);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for image analysis', {
        ip,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      });

      return NextResponse.json(
        {
          error: {
            message: 'Too many requests. Please wait before trying again.',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429,
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '10',
            'X-RateLimit-Remaining':
              rateLimitResult.remaining?.toString() || '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
          },
        }
      );
    }

    // Comprehensive request validation (size, format, count)
    const requestValidationResult = await validateImageAnalysisRequest(request);
    if (!requestValidationResult.isValid) {
      return createValidationErrorResponse(requestValidationResult);
    }

    // Parse the validated data
    const body = requestValidationResult.data;
    const validatedData = analyzeImageSchema.parse(body);

    // Handle both single image and multiple images
    const images: string[] =
      validatedData.images ||
      (validatedData.image ? [validatedData.image] : []);

    // Log before API call
    logger.debug('Calling OpenRouter API with image data', {
      imageCount: images.length,
      promptLength: prompts.imageAnalysis.length,
    });

    // Sanitize the AI prompt to prevent injection attacks
    const basePrompt = sanitizeAIPrompt(prompts.imageAnalysis);
    const multiImageNote =
      images.length > 1
        ? '\n\nNote: Multiple images provided. Please analyze all images together as they represent the same meal from different angles.'
        : '';

    // Build content array with sanitized text prompt followed by all images
    const contentArray: OpenRouterMessageContent[] = [
      {
        type: 'text',
        text: basePrompt + multiImageNote,
      },
      ...images.map(img => ({
        type: 'image_url' as const,
        image_url: {
          url: img,
        },
      })),
    ];

    // Call OpenRouter with vision model - single request with all images
    const response = await openrouter.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'user',
          content: contentArray,
        },
      ],
      max_tokens: 400, // Slightly increased for multi-image analysis
      temperature: 0.1, // Low temperature for more consistent results
    });

    const aiResponseText = response.choices[0]?.message?.content;

    if (!aiResponseText) {
      throw new Error('No response from AI model');
    }

    // Log the actual AI response for debugging
    logger.debug('AI Response received', {
      responseLength: aiResponseText.length,
    });

    // Parse and validate the AI response with robust error handling
    let rawAiResponse: unknown;
    try {
      rawAiResponse = JSON.parse(aiResponseText);
    } catch {
      // If direct JSON parsing fails, try to extract JSON from markdown
      try {
        const jsonMatch = aiResponseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          rawAiResponse = JSON.parse(jsonMatch[1]);
          logger.debug('Successfully extracted JSON from markdown wrapper');
        } else {
          throw new Error('No JSON found in response');
        }
      } catch {
        logger.error('Failed to parse AI response as JSON', undefined, {
          rawResponse: aiResponseText.substring(0, 200) + '...',
        });
        throw new Error(
          `AI response was not valid JSON. Response: "${aiResponseText}"`
        );
      }
    }

    // Validate AI response structure with zod
    const aiValidationResult = aiResponseSchema.safeParse(rawAiResponse);
    if (!aiValidationResult.success) {
      logger.error('AI response validation failed', undefined, {
        errors: aiValidationResult.error.issues,
        rawResponse: rawAiResponse,
      });
      throw new Error(
        `AI response validation failed: ${aiValidationResult.error.issues
          .map(issue => `${issue.path.join('.')} - ${issue.message}`)
          .join(', ')}`
      );
    }

    const aiResponse = aiValidationResult.data;

    // Server-side validation and normalization process
    const normalizedIngredients = aiResponse.ingredients
      .map(ingredient => {
        if (
          typeof ingredient !== 'object' ||
          typeof ingredient.name !== 'string' ||
          typeof ingredient.isOrganic !== 'boolean'
        ) {
          return null;
        }
        return {
          name: ingredient.name.trim().toLowerCase(),
          isOrganic: ingredient.isOrganic,
        };
      })
      .filter(
        (ingredient): ingredient is { name: string; isOrganic: boolean } =>
          ingredient !== null && ingredient.name.length > 0
      );

    // Remove duplicates based on name
    const uniqueIngredients = normalizedIngredients.filter(
      (ingredient, index, array) =>
        array.findIndex(item => item.name === ingredient.name) === index
    );

    // Record successful performance metrics
    aiPerformanceMonitor.endRequest(performanceId, {
      service: 'image-analysis',
      success: true,
      model: 'openai/gpt-4o',
      requestSize: JSON.stringify(images).length,
      responseSize: aiResponseText.length,
      tokenUsage: {
        prompt: 0, // OpenRouter doesn't provide this in the current response
        completion: aiResponseText.length,
        total: aiResponseText.length,
      },
    });

    // Return standardized response
    return NextResponse.json(
      {
        mealSummary: aiResponse.mealSummary.trim(),
        ingredients: uniqueIngredients,
      } as AnalyzeImageResponse,
      { status: 200 }
    );
  } catch (error) {
    // Enhanced error logging
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name,
    };

    logger.error('Error in analyze-image API', error, errorDetails);

    // Record error in performance metrics
    aiPerformanceMonitor.endRequest(performanceId, {
      service: 'image-analysis',
      success: false,
      error: errorDetails.message,
      model: 'openai/gpt-4o',
    });

    // Handle different types of errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request data',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
          },
        } as AnalyzeImageErrorResponse,
        { status: 400 }
      );
    }

    // Handle OpenRouter API errors more specifically
    if (error instanceof Error) {
      // Check for specific OpenRouter errors
      if (
        error.message.includes('401') ||
        error.message.includes('Unauthorized')
      ) {
        return NextResponse.json(
          {
            error: {
              message: 'AI service authentication failed',
              code: 'AI_AUTH_ERROR',
              statusCode: 503,
            },
          } as AnalyzeImageErrorResponse,
          { status: 503 }
        );
      }

      if (error.message.includes('API') || error.message.includes('fetch')) {
        return NextResponse.json(
          {
            error: {
              message: 'AI service temporarily unavailable',
              code: 'AI_SERVICE_ERROR',
              statusCode: 503,
            },
          } as AnalyzeImageErrorResponse,
          { status: 503 }
        );
      }
    }

    // Generic server error
    return NextResponse.json(
      {
        error: {
          message: 'An unexpected error occurred during image analysis',
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500,
        },
      } as AnalyzeImageErrorResponse,
      { status: 500 }
    );
  }
}
