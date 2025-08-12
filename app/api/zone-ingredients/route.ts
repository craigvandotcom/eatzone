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
  zone: z.enum(['green', 'yellow', 'red']),
  category: z.string().optional(), // Main classification (e.g., "Proteins", "Vegetables")
  group: z.string(), // Primary classification (e.g., "Low-Sugar Berries", "Quality Animal Proteins")
});

// Type for AI response
type AIIngredientResponse = {
  name: string;
  zone?: string;
  category?: string;
  group: string;
};

type AIResponse = {
  ingredients?: AIIngredientResponse[];
};

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
    const validationResult = await validateAndParseJSON(request, 1024 * 1024); // 1MB limit
    if (!validationResult.isValid) {
      return createValidationErrorResponse(validationResult);
    }

    const { ingredients } = zoneIngredientsSchema.parse(validationResult.data);

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
      model: 'anthropic/claude-3.5-sonnet', // Better for structured JSON
      messages: [{ role: 'user', content: fullPrompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1024,
      temperature: 0.1,
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) throw new Error('No response from AI model');

    // Log the actual AI response for debugging
    logger.debug('AI Response received', { responseLength: aiResponse.length });

    const parsedResponse = JSON.parse(aiResponse) as AIResponse;

    logger.debug('Parsed AI response', {
      ingredientCount: parsedResponse.ingredients?.length,
    });

    // Normalize AI response - only convert zone to lowercase
    const normalizedIngredients = parsedResponse.ingredients?.map(
      (ingredient: AIIngredientResponse) => ({
        name: ingredient.name,
        zone: ingredient.zone?.toLowerCase(), // Convert to lowercase
        category: ingredient.category, // Main classification
        group: ingredient.group, // Primary classification
      })
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
      model: 'anthropic/claude-3.5-sonnet',
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
      model: 'anthropic/claude-3.5-sonnet',
    });

    return NextResponse.json(
      { error: 'Failed to zone ingredients' },
      { status: 500 }
    );
  }
}
