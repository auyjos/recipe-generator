// Utility functions for parsing ingredients and calculating nutritional values

type IngredientWithQuantity = {
  name: string
  quantity: number
  unit: string
  originalText: string
}

/**
 * Parse ingredient text to extract quantity, unit, and name
 */
export function parseIngredient(ingredientText: string): IngredientWithQuantity | null {
  // Match patterns like "100g chicken", "2 tbsp oil", "1/2 cup flour"
  const quantityRegex = /^(?:(\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)\s*([a-zA-Z]+)?\s+)?(.+)$/
  const match = ingredientText.trim().match(quantityRegex)

  if (!match) return null

  const [, quantityStr, unit = "", name = ""] = match

  // If no quantity was found, return null
  if (!quantityStr) return null

  // Convert fraction to decimal if needed
  let quantity: number
  if (quantityStr.includes("/")) {
    const [numerator, denominator] = quantityStr.split("/").map((n) => Number.parseFloat(n.trim()))
    quantity = numerator / denominator
  } else {
    quantity = Number.parseFloat(quantityStr)
  }

  return {
    name: name.trim(),
    quantity,
    unit: unit.toLowerCase().trim(),
    originalText: ingredientText,
  }
}

/**
 * Extract all ingredients with quantities from a list of ingredient strings
 */
export function extractIngredientsWithQuantities(ingredients: string[]): IngredientWithQuantity[] {
  return ingredients
    .map(parseIngredient)
    .filter((ingredient): ingredient is IngredientWithQuantity => ingredient !== null)
}

/**
 * Estimate calories based on ingredient quantities
 * This is a simplified calculation and should be replaced with a more accurate method
 */
export function estimateCaloriesFromIngredients(ingredients: IngredientWithQuantity[]): number {
  // Simplified calorie estimation based on common ingredients
  // In a real app, this would use a food database
  const calorieEstimates: Record<string, number> = {
    // Proteins (calories per gram)
    chicken: 1.65,
    beef: 2.5,
    fish: 1.3,
    tofu: 0.76,
    eggs: 1.55,

    // Carbs (calories per gram)
    rice: 1.3,
    pasta: 1.31,
    bread: 2.65,
    flour: 3.64,
    potato: 0.77,

    // Fats (calories per gram)
    oil: 8.84,
    butter: 7.17,
    olive: 8.84,

    // Vegetables (calories per gram)
    carrot: 0.41,
    broccoli: 0.34,
    spinach: 0.23,
    tomato: 0.18,

    // Fruits (calories per gram)
    apple: 0.52,
    banana: 0.89,
    orange: 0.47,

    // Dairy (calories per gram)
    milk: 0.42,
    cheese: 4.02,
    yogurt: 0.59,

    // Nuts and seeds (calories per gram)
    almonds: 5.76,
    walnuts: 6.54,
    chia: 4.86,
  }

  let totalCalories = 0

  for (const ingredient of ingredients) {
    // Find the closest matching ingredient in our database
    const matchingIngredient = Object.keys(calorieEstimates).find((key) => ingredient.name.toLowerCase().includes(key))

    if (matchingIngredient) {
      // Convert to grams if needed
      let quantityInGrams = ingredient.quantity

      // Handle common unit conversions
      if (ingredient.unit === "kg") {
        quantityInGrams *= 1000
      } else if (ingredient.unit === "oz") {
        quantityInGrams *= 28.35
      } else if (ingredient.unit === "lb") {
        quantityInGrams *= 453.59
      } else if (ingredient.unit === "cup") {
        // Rough estimate - cups vary by ingredient
        quantityInGrams *= 240
      } else if (ingredient.unit === "tbsp") {
        quantityInGrams *= 15
      } else if (ingredient.unit === "tsp") {
        quantityInGrams *= 5
      }

      // Calculate calories
      const caloriesPerGram = calorieEstimates[matchingIngredient]
      const ingredientCalories = quantityInGrams * caloriesPerGram
      totalCalories += ingredientCalories
    }
  }

  // Return rounded calories, with a minimum of 100
  return Math.max(100, Math.round(totalCalories))
}

/**
 * Validate nutritional data against ingredient quantities
 * Returns true if the data seems consistent, false otherwise
 */
export function validateNutritionalData(
  ingredients: IngredientWithQuantity[],
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
): boolean {
  // Estimate calories from ingredients
  const estimatedCalories = estimateCaloriesFromIngredients(ingredients)

  // Check if the estimated calories are within 30% of the reported calories
  const calorieRatio = Math.abs(estimatedCalories - calories) / calories

  // Calculate macronutrient calories
  const proteinCalories = protein * 4
  const carbCalories = carbs * 4
  const fatCalories = fat * 9
  const macroCalories = proteinCalories + carbCalories + fatCalories

  // Check if macronutrient calories are within 10% of total calories
  const macroRatio = Math.abs(macroCalories - calories) / calories

  return calorieRatio <= 0.3 && macroRatio <= 0.1
}
