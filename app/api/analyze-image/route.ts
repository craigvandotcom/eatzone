import { NextRequest, NextResponse } from "next/server";
import { openrouter } from "@/lib/ai/openrouter";
import { z } from "zod";
import { prompts } from "@/lib/prompts"; // Import from our new module
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/utils/logger";

// Rate limiting setup using Vercel's Upstash integration env vars
let ratelimit: Ratelimit | null = null;

if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests per minute for image analysis
  });
}

// Zod schema for request validation
const analyzeImageSchema = z.object({
  image: z.string().min(1, "Image data is required"),
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
  try {
    // Rate limiting check - only if Redis is configured
    if (ratelimit) {
      const forwardedFor = request.headers.get("x-forwarded-for");
      const realIp = request.headers.get("x-real-ip");
      const ip = forwardedFor?.split(",")[0] ?? realIp ?? "127.0.0.1";

      const { success } = await ratelimit.limit(ip);

      if (!success) {
        return NextResponse.json(
          {
            error: {
              message: "Too many requests. Please wait before trying again.",
              code: "RATE_LIMIT_EXCEEDED",
              statusCode: 429,
            },
          },
          { status: 429 }
        );
      }
    }

    // Parse and validate the request body
    const body = await request.json();
    const { image } = analyzeImageSchema.parse(body);

    // Validate image format
    if (!image.startsWith("data:image/")) {
      return NextResponse.json(
        {
          error: {
            message: "Invalid image format. Expected base64 data URL.",
            code: "INVALID_IMAGE_FORMAT",
            statusCode: 400,
          },
        } as AnalyzeImageErrorResponse,
        { status: 400 }
      );
    }

    // Call OpenRouter with vision model
    const response = await openrouter.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompts.imageAnalysis, // Use the imported prompt
            },
            {
              type: "image_url",
              image_url: {
                url: image,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.1, // Low temperature for more consistent results
    });

    const aiResponseText = response.choices[0]?.message?.content;

    if (!aiResponseText) {
      throw new Error("No response from AI model");
    }

    // Log the actual AI response for debugging
    logger.debug("AI Response received", {
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
          logger.debug("Successfully extracted JSON from markdown wrapper");
        } else {
          throw new Error("No JSON found in response");
        }
      } catch {
        logger.error("Failed to parse AI response as JSON", undefined, {
          rawResponse: aiResponseText.substring(0, 200) + "...",
        });
        throw new Error(
          `AI response was not valid JSON. Response: "${aiResponseText}"`
        );
      }
    }

    // Validate that we got the expected structure
    if (
      typeof aiResponse !== "object" ||
      typeof aiResponse.mealSummary !== "string" ||
      !Array.isArray(aiResponse.ingredients)
    ) {
      throw new Error("AI response was not in the expected format");
    }

    // Server-side validation and normalization process
    const normalizedIngredients = aiResponse.ingredients
      .map(ingredient => {
        if (
          typeof ingredient !== "object" ||
          typeof ingredient.name !== "string" ||
          typeof ingredient.isOrganic !== "boolean"
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
    logger.error("Error in analyze-image API", error);

    // Handle different types of errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            message: "Invalid request data",
            code: "VALIDATION_ERROR",
            statusCode: 400,
          },
        } as AnalyzeImageErrorResponse,
        { status: 400 }
      );
    }

    // Handle OpenRouter API errors
    if (error instanceof Error && error.message.includes("API")) {
      return NextResponse.json(
        {
          error: {
            message: "AI service temporarily unavailable",
            code: "AI_SERVICE_ERROR",
            statusCode: 503,
          },
        } as AnalyzeImageErrorResponse,
        { status: 503 }
      );
    }

    // Generic server error
    return NextResponse.json(
      {
        error: {
          message: "An unexpected error occurred during image analysis",
          code: "INTERNAL_SERVER_ERROR",
          statusCode: 500,
        },
      } as AnalyzeImageErrorResponse,
      { status: 500 }
    );
  }
}
