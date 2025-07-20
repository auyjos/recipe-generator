import { NextResponse } from "next/server"
import { generateMockRecipe } from "./mock"
import type { MealType } from "@/components/meal-type-selector"
import logger from "@/utils/logger"

// Create a system prompt that guides Claude to generate recipes in a structured format
const SYSTEM_PROMPT = `
You are a professional chef assistant that creates recipes based on user ingredients, preferences, and meal type.
Please generate a **single-serving** recipe with precise measurements.

Always format your response in markdown with the following structure:
# [Recipe Title]

## Ingredients
- [Ingredient 1 with EXACT quantity in grams] (e.g., 100g chicken breast)
- [Ingredient 2 with EXACT quantity in grams]
...

## Instructions
1. [Step 1]
2. [Step 2]
...

## Nutrition (Estimated)
- Calories: [calories] kcal
- Protein: [protein]g
- Carbs: [carbs]g
- Fat: [fat]g

## Cooking Time
[cooking time] minutes

IMPORTANT GUIDELINES:
1. ALWAYS specify ingredient quantities in grams for ALL ingredients when possible
2. Don't add any type of oil unless the user specifies it.
2. Ensure the nutritional information is mathematically consistent with the ingredient quantities
3. The total calories should approximately equal: (protein × 4) + (carbs × 4) + (fat × 9)
4. Be creative but practical, focusing on recipes that are delicious and achievable
5. Suggest a cooking time that is realistic for the recipe
6. For liquids, use milliliters (ml) instead of grams when appropriate
7. **If the provided ingredients sum to less than the target calories**, suggest **additional ingredients** that complement the existing ones—specifying their quantities—so that the total calories falls within ±5% of the target.
8. Respect any stated preferences or dietary restrictions when adding ingredients.
`

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    const { ingredients, preferences, mealType, calories } = body

    // Enhanced debug logging
    logger.api.start("GENERATE RECIPE", {
      ingredients,
      preferences,
      mealType,
      calories
    })

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length < 3) {
      return NextResponse.json({ success: false, error: "At least 3 ingredients are required" }, { status: 400 })
    }

    // Format the ingredients into a string
    const ingredientsString = ingredients.join(", ")

    // Create a user message that includes all the relevant information
    const userMessage = `
    I want to make a ${mealType} recipe with these ingredients: ${ingredientsString}.
    
    Additional preferences: ${preferences || "None"}
    
    Target calories: approximately ${calories} kcal per serving.
    If your calorie total from the listed ingredients is below this, feel free to suggest extra complementary ingredients (with quantities) to meet the target.

    Please create a recipe that uses these ingredients and meets my preferences.
    `

    try {
      // Make a fetch request to Anthropic API instead of using the SDK
      // This ensures we're using server-side fetch and not browser fetch
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        logger.error("❌ Anthropic API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(`Anthropic API error: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      logger.api.success("Anthropic API Success Response:", {
        status: response.status,
        contentLength: data.content?.[0]?.text?.length || 0,
        contentPreview: data.content?.[0]?.text?.substring(0, 200) + "..."
      })
      const markdownResponse = data.content[0].text

      if (logger.isDev()) {
        logger.log("📄 Full Markdown Response:")
        logger.log("=".repeat(50))
        logger.log(markdownResponse)
        logger.log("=".repeat(50))
      }

      // Parse the markdown to extract structured data
      const recipe = parseRecipeMarkdown(markdownResponse)

      logger.recipe.generation("Parsed Recipe Data:", recipe)

      // 1) Validate the macros actually sum to target calories
      const { calories: reportedCals = 0, protein = 0, carbs = 0, fat = 0 } = recipe
      const computedCals = protein * 4 + carbs * 4 + fat * 9
      const tolerance = calories * 0.03

      if (Math.abs(computedCals - calories) > tolerance) {
        logger.warn(`⚠️ Calorie mismatch: computed ${computedCals} kcal vs target ${calories} kcal`)

        // 2) Build a "please adjust" corrective prompt
        const correctionMessage = `
        The nutrition in the recipe you just returned sums to ${computedCals} kcal,
        which is outside the ±${Math.round(tolerance)} kcal margin of the target ${calories} kcal.
        Please adjust ingredient quantities (or add a small complementary ingredient)
        so that (protein×4 + carbs×4 + fat×9) exactly matches ${calories} kcal.
        Keep the same markdown structure and only send me the corrected recipe.
        `

        try {
          // 3) Re-call Claude with that correction request
          const correctionResp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.ANTHROPIC_API_KEY || "",
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1024,
              system: SYSTEM_PROMPT,
              messages: [
                { role: "user", content: userMessage },
                { role: "assistant", content: markdownResponse },
                { role: "user", content: correctionMessage },
              ],
            }),
          })

          if (correctionResp.ok) {
            const correctionData = await correctionResp.json()
            const correctedMarkdown = correctionData.content[0].text
            const correctedRecipe = parseRecipeMarkdown(correctedMarkdown)

            // Verify the correction worked
            const correctedComputedCals = (correctedRecipe.protein || 0) * 4 + (correctedRecipe.carbs || 0) * 4 + (correctedRecipe.fat || 0) * 9

            logger.recipe.generation("Corrected Recipe:", {
              ...correctedRecipe,
              originalComputedCals: computedCals,
              correctedComputedCals,
              targetCals: calories,
              improvementMade: Math.abs(correctedComputedCals - calories) < Math.abs(computedCals - calories)
            })

            const finalRecipe = {
              ...correctedRecipe,
              markdown: correctedMarkdown,
            }

            logger.recipe.generation("Final Corrected Recipe Response:", finalRecipe)
            logger.api.end("GENERATE RECIPE")

            return NextResponse.json({
              success: true,
              recipe: finalRecipe,
              corrected: true,
              originalCalories: computedCals,
              targetCalories: calories
            })
          } else {
            logger.warn("Correction request failed, using original recipe")
          }
        } catch (correctionError) {
          logger.error("Error during recipe correction:", correctionError)
          // Fall through to use original recipe
        }
      }

      // If it was in-tolerance or correction failed, just return the original:
      const finalRecipe = {
        ...recipe,
        markdown: markdownResponse,
      }

      logger.recipe.generation("Final Recipe Response:", finalRecipe)
      logger.api.end("GENERATE RECIPE")

      return NextResponse.json({
        success: true,
        recipe: finalRecipe,
      })
    } catch (apiError: any) {
      logger.error("Anthropic API error:", apiError)

      // If the API call fails, use the mock generator as a fallback
      logger.warn("Using mock recipe generator as fallback")
      const mockRecipe = generateMockRecipe(ingredients, preferences, mealType as MealType, calories)

      return NextResponse.json({
        success: true,
        recipe: mockRecipe,
        isMock: true,
        apiError: apiError.message,
      })
    }
  } catch (error: any) {
    logger.error("Error in generate-recipe route:", error)

    // Ensure we always return a valid JSON response
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate recipe",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}

// Helper function to parse the markdown response into structured data
function parseRecipeMarkdown(markdown: string) {
  // Default values
  let title = "Generated Recipe"
  let ingredients: string[] = []
  let instructions: string[] = []
  let calories: number | undefined
  let protein: number | undefined
  let carbs: number | undefined
  let fat: number | undefined
  let cooking_time: string | undefined

  try {
    // Extract title (first h1)
    const titleMatch = markdown.match(/# (.+)/)
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim()
    }

    // Extract ingredients
    const ingredientsSection = markdown.match(/## Ingredients\s+([\s\S]*?)(?=##|$)/)
    if (ingredientsSection && ingredientsSection[1]) {
      ingredients = ingredientsSection[1]
        .split("\n")
        .filter((line) => line.trim().startsWith("-"))
        .map((line) => line.replace("-", "").trim())
    }

    // Extract instructions
    const instructionsSection = markdown.match(/## Instructions\s+([\s\S]*?)(?=##|$)/)
    if (instructionsSection && instructionsSection[1]) {
      instructions = instructionsSection[1]
        .split("\n")
        .filter((line) => /^\d+\./.test(line.trim()))
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    }

    // Extract calories
    const caloriesMatch = markdown.match(/Calories:\s*(\d+)\s*kcal/)
    if (caloriesMatch && caloriesMatch[1]) {
      calories = Number.parseInt(caloriesMatch[1], 10)
    }

    // Extract protein
    const proteinMatch = markdown.match(/Protein:\s*(\d+(?:\.\d+)?)\s*g/)
    if (proteinMatch && proteinMatch[1]) {
      protein = Number.parseFloat(proteinMatch[1])
    }

    // Extract carbs
    const carbsMatch = markdown.match(/Carbs:\s*(\d+(?:\.\d+)?)\s*g/)
    if (carbsMatch && carbsMatch[1]) {
      carbs = Number.parseFloat(carbsMatch[1])
    }

    // Extract fat
    const fatMatch = markdown.match(/Fat:\s*(\d+(?:\.\d+)?)\s*g/)
    if (fatMatch && fatMatch[1]) {
      fat = Number.parseFloat(fatMatch[1])
    }

    // Extract cooking time
    const cookingTimeMatch = markdown.match(/## Cooking Time\s+(\d+)\s*minutes/)
    if (cookingTimeMatch && cookingTimeMatch[1]) {
      cooking_time = `${cookingTimeMatch[1]} minutes`
    }
  } catch (error) {
    logger.error("Error parsing markdown:", error)
    // If parsing fails, we'll return the default values
  }

  return {
    title,
    ingredients,
    instructions,
    calories,
    protein,
    carbs,
    fat,
    cooking_time,
  }
}
