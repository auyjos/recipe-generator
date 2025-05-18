"use server"

// Define the recipe response type
export type GeneratedRecipe = {
  title: string
  calories?: number
  cooking_time?: string
  ingredients: string[]
  instructions: string[]
  markdown: string // The full markdown response
}

export async function generateRecipeWithAI({
  ingredients,
  preferences,
  mealType,
  calories,
}: {
  ingredients: string[]
  preferences: string
  mealType: string
  calories: number
}) {
  try {
    // Call our own API route instead of using the Anthropic SDK directly
    const response = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/generate-recipe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ingredients,
        preferences,
        mealType,
        calories,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(errorJson.error || `Server error: ${response.status}`)
      } catch (jsonError) {
        throw new Error(`Server error: ${errorText || response.statusText || response.status}`)
      }
    }

    const result = await response.json()

    if (!result.success || !result.recipe) {
      throw new Error(result.error || "Failed to generate recipe")
    }

    return {
      success: true,
      recipe: result.recipe,
      isMock: result.isMock,
    }
  } catch (error: any) {
    console.error("Error generating recipe:", error)
    return {
      success: false,
      error: error.message || "Failed to generate recipe",
    }
  }
}
