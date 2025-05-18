import { NextResponse } from "next/server"

// Create a system prompt for nutritional analysis
const SYSTEM_PROMPT = `
You are a nutrition expert assistant. Your task is to provide detailed nutritional information for recipes based on their ingredients, preferences, and calorie target.

Always respond with a JSON object containing the following structure:
{
  "calories": number,
  "macronutrients": {
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number,
    "sugar": number,
    "saturatedFat": number,
    "unsaturatedFat": number,
    "cholesterol": number,
    "sodium": number
  },
  "vitamins": {
    "A": number,
    "C": number,
    "D": number,
    "E": number,
    "K": number,
    "B1": number,
    "B2": number,
    "B3": number,
    "B6": number,
    "B12": number,
    "Folate": number
  },
  "minerals": {
    "Calcium": number,
    "Iron": number,
    "Magnesium": number,
    "Phosphorus": number,
    "Potassium": number,
    "Sodium": number,
    "Zinc": number,
    "Copper": number,
    "Manganese": number,
    "Selenium": number
  },
  "servingSize": string,
  "servings": number
}

All values should be realistic estimates based on the ingredients and calorie target. Vitamin and mineral values should be percentage of daily recommended values.
`

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    const { ingredients, preferences, mealType, calories } = body

    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json({ success: false, error: "Ingredients are required" }, { status: 400 })
    }

    // Format the ingredients into a string
    const ingredientsString = ingredients.join(", ")

    // Create a user message that includes all the relevant information
    const userMessage = `
    Provide detailed nutritional information for a ${mealType} recipe with these ingredients: ${ingredientsString}.
    
    Additional preferences: ${preferences || "None"}
    
    Target calories: approximately ${calories} kcal per serving.
    
    Please provide a comprehensive nutritional breakdown including macronutrients, vitamins, and minerals.
    `

    try {
      // Make a fetch request to Anthropic API
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
      const content = data.content[0].text

      // Parse the JSON response
      try {
        // Extract JSON from the response (in case it includes markdown formatting)
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
        const nutritionData = JSON.parse(jsonString.replace(/```/g, "").trim())

        return NextResponse.json({
          success: true,
          nutritionData,
        })
      } catch (parseError) {
        console.error("Error parsing nutrition data:", parseError)
        // Fallback to generating mock nutrition data
        return NextResponse.json({
          success: true,
          nutritionData: generateMockNutritionData(calories),
          isMock: true,
        })
      }
    } catch (apiError: any) {
      console.error("Anthropic API error:", apiError)

      // If the API call fails, generate mock nutrition data
      return NextResponse.json({
        success: true,
        nutritionData: generateMockNutritionData(calories),
        isMock: true,
        apiError: apiError.message,
      })
    }
  } catch (error: any) {
    console.error("Error in nutrition route:", error)

    // Ensure we always return a valid JSON response
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get nutritional information",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}

// Helper function to generate mock nutrition data
function generateMockNutritionData(calories: number) {
  // Calculate macronutrients based on a typical distribution
  const protein = Math.round((calories * 0.25) / 4) // 25% of calories from protein
  const carbs = Math.round((calories * 0.45) / 4) // 45% of calories from carbs
  const fat = Math.round((calories * 0.3) / 9) // 30% of calories from fat
  const fiber = Math.round(calories / 100) // Rough estimate
  const sugar = Math.round((calories * 0.1) / 4) // 10% of calories from sugar
  const saturatedFat = Math.round(fat * 0.3) // 30% of fat is saturated
  const unsaturatedFat = fat - saturatedFat
  const cholesterol = Math.round(calories / 5) // Rough estimate
  const sodium = Math.round(calories * 1.5) // Rough estimate

  // Generate random percentages for vitamins and minerals
  const generateRandomPercentages = (count: number) => {
    const result: Record<string, number> = {}
    const keys = Array.from({ length: count }, (_, i) => i)
    keys.forEach((i) => {
      result[i.toString()] = Math.round(Math.random() * 30) + 5 // 5-35%
    })
    return result
  }

  // Map vitamin and mineral names
  const vitaminNames = ["A", "C", "D", "E", "K", "B1", "B2", "B3", "B6", "B12", "Folate"]
  const mineralNames = [
    "Calcium",
    "Iron",
    "Magnesium",
    "Phosphorus",
    "Potassium",
    "Sodium",
    "Zinc",
    "Copper",
    "Manganese",
    "Selenium",
  ]

  // Generate random vitamin and mineral percentages
  const vitaminPercentages = generateRandomPercentages(vitaminNames.length)
  const mineralPercentages = generateRandomPercentages(mineralNames.length)

  // Map the random percentages to named vitamins and minerals
  const vitamins: Record<string, number> = {}
  vitaminNames.forEach((name, i) => {
    vitamins[name] = vitaminPercentages[i.toString()]
  })

  const minerals: Record<string, number> = {}
  mineralNames.forEach((name, i) => {
    minerals[name] = mineralPercentages[i.toString()]
  })

  return {
    calories,
    macronutrients: {
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      saturatedFat,
      unsaturatedFat,
      cholesterol,
      sodium,
    },
    vitamins,
    minerals,
    servingSize: "1 serving",
    servings: 1,
  }
}
