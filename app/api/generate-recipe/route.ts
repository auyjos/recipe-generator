import { NextResponse } from "next/server"
import { generateMockRecipe } from "./mock"
import type { MealType } from "@/components/meal-type-selector"

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
2. Ensure the nutritional information is mathematically consistent with the ingredient quantities
3. The total calories should approximately equal: (protein × 4) + (carbs × 4) + (fat × 9)
4. Be creative but practical, focusing on recipes that are delicious and achievable
5. Suggest a cooking time that is realistic for the recipe
6. For liquids, use milliliters (ml) instead of grams when appropriate
`

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    const { ingredients, preferences, mealType, calories } = body

    // Debug logging
    console.log("🔍 API Route Debug - Received request:")
    console.log("Ingredients:", ingredients)
    console.log("Preferences:", preferences)
    console.log("Meal Type:", mealType)
    console.log("Calories:", calories)

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
          model: "claude-3-haiku-20240307",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(`Anthropic API error: ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      const markdownResponse = data.content[0].text

      // Parse the markdown to extract structured data
      const recipe = parseRecipeMarkdown(markdownResponse)

      return NextResponse.json({
        success: true,
        recipe: {
          ...recipe,
          markdown: markdownResponse,
        },
      })
    } catch (apiError: any) {
      console.error("Anthropic API error:", apiError)

      // If the API call fails, use the mock generator as a fallback
      console.log("Using mock recipe generator as fallback")
      const mockRecipe = generateMockRecipe(ingredients, preferences, mealType as MealType, calories)

      return NextResponse.json({
        success: true,
        recipe: mockRecipe,
        isMock: true,
        apiError: apiError.message,
      })
    }
  } catch (error: any) {
    console.error("Error in generate-recipe route:", error)

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

    // Extract cooking time
    const cookingTimeMatch = markdown.match(/## Cooking Time\s+(\d+)\s*minutes/)
    if (cookingTimeMatch && cookingTimeMatch[1]) {
      cooking_time = `${cookingTimeMatch[1]} minutes`
    }
  } catch (error) {
    console.error("Error parsing markdown:", error)
    // If parsing fails, we'll return the default values
  }

  return {
    title,
    ingredients,
    instructions,
    calories,
    cooking_time,
  }
}
