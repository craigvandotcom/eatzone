import { NextRequest, NextResponse } from 'next/server';
import { openrouter } from '@/lib/ai/openrouter';
import { prompts } from '@/lib/prompts';
import { z } from 'zod';
import { getRateLimiter } from '@/lib/rate-limit';
import {
  sanitizeAIPrompt,
  sanitizeStringArray,
} from '@/lib/security/sanitization';
import {
  validateAndParseJSON,
  createValidationErrorResponse,
} from '@/lib/middleware/request-validation';
import { aiPerformanceMonitor } from '@/lib/monitoring/ai-performance';
import { logger } from '@/lib/utils/logger';

const zoneIngredientsSchema = z.object({
  ingredients: z.array(z.string()).min(1),
});

const zonedIngredientSchema = z.object({
  name: z.string(),
  zone: z.enum(['green', 'yellow', 'red', 'unzoned']),
  category: z.string().optional(), // Main classification (e.g., "Proteins", "Vegetables")
  group: z.string(), // Primary classification (e.g., "Low-Sugar Berries", "Quality Animal Proteins")
});

// Zod schemas for AI response validation
const aiIngredientResponseSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  zone: z.string().optional(),
  category: z.string().optional(),
  group: z.string().min(1, 'Group is required'),
});

const aiResponseSchema = z.object({
  ingredients: z.array(aiIngredientResponseSchema).optional(),
});

// Type for AI response
type AIIngredientResponse = z.infer<typeof aiIngredientResponseSchema>;

// No mapping needed - use AI categories directly

export async function POST(request: NextRequest) {
  // Start performance monitoring
  const performanceId = aiPerformanceMonitor.startRequest('ingredient-zoning');

  try {
    // Rate limiting check - always enforced (Redis or memory fallback)
    const rateLimiter = getRateLimiter();
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] ?? realIp ?? '127.0.0.1';

    const rateLimitResult = await rateLimiter.limitGeneric(ip, 20, 60 * 1000); // 20 requests per minute

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for ingredient zoning', {
        ip,
        remaining: rateLimitResult.remaining,
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
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining':
              rateLimitResult.remaining?.toString() || '0',
          },
        }
      );
    }

    // Validate and parse request with size limits
    const requestValidationResult = await validateAndParseJSON(request, 1024 * 1024); // 1MB limit
    if (!requestValidationResult.isValid) {
      return createValidationErrorResponse(requestValidationResult);
    }

    const { ingredients } = zoneIngredientsSchema.parse(requestValidationResult.data);

    // Sanitize ingredients array
    const sanitizedIngredients = sanitizeStringArray(ingredients);

    logger.debug('Zoning request received', {
      ingredientCount: sanitizedIngredients.length,
      originalCount: ingredients.length,
    });

    if (sanitizedIngredients.length === 0) {
      return NextResponse.json(
        {
          error: {
            message: 'No valid ingredients provided after sanitization',
            code: 'INVALID_INGREDIENTS',
            statusCode: 400,
          },
        },
        { status: 400 }
      );
    }

    // Sanitize the AI prompt and use sanitized ingredients
    const basePrompt = sanitizeAIPrompt(prompts.ingredientZoning);
    const fullPrompt = `${basePrompt}\n\nInput: ${JSON.stringify(sanitizedIngredients)}`;

    logger.debug('Calling OpenRouter for ingredient zoning');

    const response = await openrouter.chat.completions.create({
      model: 'anthropic/claude-3.7-sonnet', // Better for structured JSON with improved reasoning
      messages: [{ role: 'user', content: fullPrompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1024,
      temperature: 0.1,
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) throw new Error('No response from AI model');

    // Log the actual AI response for debugging
    logger.debug('AI Response received', { responseLength: aiResponse.length });

    // Parse and validate AI response with robust error handling
    let rawAiResponse: unknown;
    try {
      rawAiResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      logger.error('Failed to parse AI response JSON', parseError, {
        rawResponse: aiResponse.substring(0, 200) + '...',
      });
      throw new Error('AI returned invalid JSON response');
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

    const parsedResponse = aiValidationResult.data;

    logger.debug('Parsed AI response', {
      ingredientCount: parsedResponse.ingredients?.length,
    });

    // Ensure we have ingredients array
    if (
      !parsedResponse.ingredients ||
      parsedResponse.ingredients.length === 0
    ) {
      logger.warn('AI response contained no ingredients');
      return NextResponse.json({ ingredients: [] });
    }

    // Normalize AI response with proper zone handling
    const normalizedIngredients = parsedResponse.ingredients.map(
      (ingredient: AIIngredientResponse) => {
        // Convert zone to lowercase, default to 'unzoned' if not provided or invalid
        let normalizedZone: 'green' | 'yellow' | 'red' | 'unzoned' = 'unzoned'; // Safe default
        if (ingredient.zone && typeof ingredient.zone === 'string') {
          const lowerZone = ingredient.zone.toLowerCase().trim();
          if (['green', 'yellow', 'red', 'unzoned'].includes(lowerZone)) {
            normalizedZone = lowerZone as
              | 'green'
              | 'yellow'
              | 'red'
              | 'unzoned';
          }
        }

        return {
          name: ingredient.name,
          zone: normalizedZone,
          category: ingredient.category, // Main classification
          group: ingredient.group, // Primary classification
        };
      }
    );

    const validatedIngredients = z
      .array(zonedIngredientSchema)
      .parse(normalizedIngredients);

    logger.debug('Final validated response', {
      ingredientCount: validatedIngredients.length,
    });

    // Record successful performance metrics
    aiPerformanceMonitor.endRequest(performanceId, {
      service: 'ingredient-zoning',
      success: true,
      model: 'anthropic/claude-3.7-sonnet',
      requestSize: JSON.stringify(sanitizedIngredients).length,
      responseSize: aiResponse.length,
    });

    return NextResponse.json({ ingredients: validatedIngredients });
  } catch (error) {
    logger.error('Error in zone-ingredients API', error);

    // Record error in performance metrics
    aiPerformanceMonitor.endRequest(performanceId, {
      service: 'ingredient-zoning',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      model: 'anthropic/claude-3.7-sonnet',
    });

    return NextResponse.json(
      { error: 'Failed to zone ingredients' },
      { status: 500 }
    );
  }
}
