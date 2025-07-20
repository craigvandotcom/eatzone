import { NextRequest, NextResponse } from "next/server";
import { openrouter } from "@/lib/ai/openrouter";
import { prompts } from "@/lib/prompts";
import { z } from "zod";

const zoneIngredientsSchema = z.object({
  ingredients: z.array(z.string()).min(1),
});

const zonedIngredientSchema = z.object({
  name: z.string(),
  zone: z.enum(["green", "yellow", "red"]),
  foodGroup: z.enum([
    "vegetable", "fruit", "protein", "grain", "dairy", "fat", "other"
  ]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredients } = zoneIngredientsSchema.parse(body);

    const fullPrompt = `${prompts.ingredientZoning}\n\nInput: ${JSON.stringify(ingredients)}`;

    const response = await openrouter.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet", // Better for structured JSON
      messages: [{ role: "user", content: fullPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 1024,
      temperature: 0.1,
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) throw new Error("No response from AI model");

    const parsedResponse = JSON.parse(aiResponse);
    // Assuming the AI returns an object like { ingredients: [...] }
    const validatedIngredients = z.array(zonedIngredientSchema).parse(parsedResponse.ingredients);

    return NextResponse.json({ ingredients: validatedIngredients });

  } catch (error) {
    console.error("Error in zone-ingredients API:", error);
    // Add robust error handling here
    return NextResponse.json(
      { error: "Failed to zone ingredients" },
      { status: 500 }
    );
  }
}
