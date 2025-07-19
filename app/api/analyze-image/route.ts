import { NextRequest, NextResponse } from "next/server";
import { openrouter } from "@/lib/ai/openrouter";
import { z } from "zod";

// Zod schema for request validation
const analyzeImageSchema = z.object({
  image: z.string().min(1, "Image data is required"),
});

// Type for the API response
interface AnalyzeImageResponse {
  ingredients: string[];
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
              text: `You are an expert food ingredient analyst. Your task is to analyze the provided image and return a list of ingredients as a JSON array of strings. The image could be a photo of a MEAL or a photo of a TEXT-BASED INGREDIENT LABEL/LIST. INSTRUCTIONS: If the image shows a MEAL, identify the primary food items/ingredients. If the image shows a TEXT-BASED INGREDIENT LABEL/LIST, extract every ingredient from the text, cleaning them up. All ingredients in the final array must be singular and in lowercase US English (translate if necessary). CRITICAL: You MUST respond with ONLY a JSON array of strings. If the image is unclear or you cannot identify ingredients, return an empty JSON array: []. Do not include any explanation. Example: ["apple","banana","carrot"]`,
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

    // Parse the AI response as JSON
    let rawIngredients: string[];
    try {
      rawIngredients = JSON.parse(aiResponse);
    } catch {
      // If JSON parsing fails, try to extract ingredients from text
      console.error(
        "Failed to parse AI response as JSON. Raw response:",
        aiResponse
      );
      throw new Error(
        `AI response was not valid JSON. Response: "${aiResponse}"`
      );
    }

    // Validate that we got an array
    if (!Array.isArray(rawIngredients)) {
      throw new Error("AI response was not an array");
    }

    // Server-side normalization process
    const normalizedIngredients = rawIngredients
      .map(ingredient => {
        if (typeof ingredient !== "string") {
          return null;
        }
        return ingredient.trim().toLowerCase();
      })
      .filter(
        (ingredient): ingredient is string =>
          ingredient !== null && ingredient.length > 0
      );

    // Remove duplicates
    const uniqueIngredients = [...new Set(normalizedIngredients)];

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
