import { NextRequest, NextResponse } from "next/server";
import { openrouter } from "@/lib/ai/openrouter";
import { z } from "zod";
import { prompts } from "@/lib/prompts"; // Import from our new module

// Zod schema for request validation
const analyzeImageSchema = z.object({
  image: z.string().min(1, "Image data is required"),
});

// Type for the API response
interface AnalyzeImageResponse {
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

    const aiResponse = response.choices[0]?.message?.content;

    // Log the actual AI response for debugging
    console.log("AI Response:", aiResponse);
    if (!aiResponse) {
      throw new Error("No response from AI model");
    }

    // Parse the AI response as JSON with markdown fallback
    let rawIngredients: { name: string; isOrganic: boolean }[];
    try {
      rawIngredients = JSON.parse(aiResponse);
    } catch {
      // If direct JSON parsing fails, try to extract JSON from markdown
      try {
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          rawIngredients = JSON.parse(jsonMatch[1]);
          console.log("Successfully extracted JSON from markdown wrapper");
        } else {
          throw new Error("No JSON found in response");
        }
      } catch {
        console.error(
          "Failed to parse AI response as JSON. Raw response:",
          aiResponse
        );
        throw new Error(
          `AI response was not valid JSON. Response: "${aiResponse}"`
        );
      }
    }

    // Validate that we got an array
    if (!Array.isArray(rawIngredients)) {
      throw new Error("AI response was not an array");
    }

    // Server-side validation and normalization process
    const normalizedIngredients = rawIngredients
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
        ingredients: uniqueIngredients,
      } as AnalyzeImageResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in analyze-image API:", error);

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
