import { NextRequest, NextResponse } from 'next/server';
import { openrouter } from '@/lib/ai/openrouter';
import { z } from 'zod';
import { prompts } from '@/lib/prompts'; // Import from our new module
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/utils/logger';
import { APP_CONFIG } from '@/lib/config/constants';
import type { OpenRouterMessageContent } from '@/lib/types';

// Rate limiting setup using Vercel's Upstash integration env vars
let ratelimit: Ratelimit | null = null;

if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(
      APP_CONFIG.RATE_LIMIT.IMAGE_ANALYSIS_REQUESTS_PER_MINUTE,
      APP_CONFIG.RATE_LIMIT.RATE_LIMIT_WINDOW
    ),
  });
}

// Zod schema for request validation - supports both single and multiple images
const analyzeImageSchema = z
  .object({
    image: z.string().min(1, 'Image data is required').optional(),
    images: z.array(z.string().min(1)).optional(),
  })
  .refine(data => data.image || (data.images && data.images.length > 0), {
    message: 'Either image or images array is required',
  });

// Type for the API response
interface AnalyzeImageResponse {
  mealSummary: string;
  ingredients: {
    name: string;
    isOrganic: boolean;
  }[];
}

interface AnalyzeImageErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
  };
}

export async function POST(request: NextRequest) {
  logger.info('Image analysis request received');

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
    // Rate limiting check - only if Redis is configured
    if (ratelimit) {
      const forwardedFor = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const ip = forwardedFor?.split(',')[0] ?? realIp ?? '127.0.0.1';

      const { success } = await ratelimit.limit(ip);

      if (!success) {
        return NextResponse.json(
          {
            error: {
              message: 'Too many requests. Please wait before trying again.',
              code: 'RATE_LIMIT_EXCEEDED',
              statusCode: 429,
            },
          },
          { status: 429 }
        );
      }
    }

    // Parse and validate the request body
    const body = await request.json();
    const validatedData = analyzeImageSchema.parse(body);

    // Handle both single image and multiple images
    const images: string[] =
      validatedData.images ||
      (validatedData.image ? [validatedData.image] : []);

    // Validate all images have correct format
    for (const img of images) {
      if (!img.startsWith('data:image/')) {
        return NextResponse.json(
          {
            error: {
              message: 'Invalid image format. Expected base64 data URL.',
              code: 'INVALID_IMAGE_FORMAT',
              statusCode: 400,
            },
          } as AnalyzeImageErrorResponse,
          { status: 400 }
        );
      }
    }

    // Limit number of images to prevent abuse
    if (images.length > APP_CONFIG.IMAGE.MAX_IMAGES_PER_REQUEST) {
      return NextResponse.json(
        {
          error: {
            message: `Too many images. Maximum ${APP_CONFIG.IMAGE.MAX_IMAGES_PER_REQUEST} images allowed per request.`,
            code: 'TOO_MANY_IMAGES',
            statusCode: 400,
          },
        } as AnalyzeImageErrorResponse,
        { status: 400 }
      );
    }

    // Log before API call
    logger.debug('Calling OpenRouter API with image data', {
      imageCount: images.length,
      promptLength: prompts.imageAnalysis.length,
    });

    // Build content array with text prompt followed by all images
    const contentArray: OpenRouterMessageContent[] = [
      {
        type: 'text',
        text:
          images.length > 1
            ? `${prompts.imageAnalysis}\n\nNote: Multiple images provided. Please analyze all images together as they represent the same meal from different angles.`
            : prompts.imageAnalysis,
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

    // Parse the AI response as JSON with markdown fallback
    let aiResponse: {
      mealSummary: string;
      ingredients: { name: string; isOrganic: boolean }[];
    };
    try {
      aiResponse = JSON.parse(aiResponseText);
    } catch {
      // If direct JSON parsing fails, try to extract JSON from markdown
      try {
        const jsonMatch = aiResponseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          aiResponse = JSON.parse(jsonMatch[1]);
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

    // Validate that we got the expected structure
    if (
      typeof aiResponse !== 'object' ||
      typeof aiResponse.mealSummary !== 'string' ||
      !Array.isArray(aiResponse.ingredients)
    ) {
      throw new Error('AI response was not in the expected format');
    }

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
