import { NextRequest, NextResponse } from "next/server";
import { openrouter } from "@/lib/ai/openrouter";
import { prompts } from "@/lib/prompts";
import { z } from "zod";
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
    limiter: Ratelimit.slidingWindow(20, "60 s"), // 20 requests per minute
  });
}

const zoneIngredientsSchema = z.object({
  ingredients: z.array(z.string()).min(1),
});

const zonedIngredientSchema = z.object({
  name: z.string(),
  zone: z.enum(["green", "yellow", "red"]),
  foodGroup: z.string(), // Accept any string from AI
});

// No mapping needed - use AI categories directly

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

    const body = await request.json();
    const { ingredients } = zoneIngredientsSchema.parse(body);

    logger.debug("Zoning request received", { ingredientCount: ingredients.length });

    const fullPrompt = `${prompts.ingredientZoning}\n\nInput: ${JSON.stringify(ingredients)}`;

    logger.debug("Calling OpenRouter for ingredient zoning");

    const response = await openrouter.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet", // Better for structured JSON
      messages: [{ role: "user", content: fullPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 1024,
      temperature: 0.1,
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) throw new Error("No response from AI model");

    // Log the actual AI response for debugging
    logger.debug("AI Response received", { responseLength: aiResponse.length });

    const parsedResponse = JSON.parse(aiResponse);

    logger.debug("Parsed AI response", { ingredientCount: parsedResponse.ingredients?.length });

    // Normalize AI response - only convert zone to lowercase
    const normalizedIngredients = parsedResponse.ingredients?.map(
      (ingredient: any) => ({
        name: ingredient.name,
        zone: ingredient.zone?.toLowerCase(), // Convert to lowercase
        foodGroup: ingredient.foodGroup, // Use AI category directly
      })
    );

    const validatedIngredients = z
      .array(zonedIngredientSchema)
      .parse(normalizedIngredients);

    logger.debug("Final validated response", {
      ingredientCount: validatedIngredients.length,
    });

    return NextResponse.json({ ingredients: validatedIngredients });
  } catch (error) {
    logger.error("Error in zone-ingredients API", error);
    // Add robust error handling here
    return NextResponse.json(
      { error: "Failed to zone ingredients" },
      { status: 500 }
    );
  }
}
