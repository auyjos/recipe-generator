import type { NutritionData } from "@/components/nutritional-info"
import type { EnhancedNutritionData } from "@/components/enhanced-nutritional-info"

// Convert EnhancedNutritionData to NutritionData
export function enhancedToBasicNutrition(enhanced: EnhancedNutritionData): NutritionData {
  return {
    calories: enhanced.calories,
    protein: enhanced.macronutrients.protein,
    carbs: enhanced.macronutrients.carbs,
    fat: enhanced.macronutrients.fat,
    fiber: enhanced.macronutrients.fiber,
    sugar: enhanced.macronutrients.sugar,
    vitamins: enhanced.vitamins,
    minerals: enhanced.minerals,
  }
}

// Create default NutritionData based on calories
export function createDefaultNutrition(calories: number): NutritionData {
  return {
    calories,
    protein: Math.round((calories * 0.2) / 4), // 20% of calories from protein
    carbs: Math.round((calories * 0.5) / 4), // 50% of calories from carbs
    fat: Math.round((calories * 0.3) / 9), // 30% of calories from fat
    fiber: Math.round((calories * 0.05) / 2), // Estimated fiber
    sugar: Math.round((calories * 0.1) / 4), // Estimated sugar
  }
}

// Convert any nutrition data format to NutritionData
export function convertToNutritionData(data: any): NutritionData {
  // If it's null or undefined, create default
  if (!data) {
    return createDefaultNutrition(500)
  }

  // If it's already in NutritionData format
  if (data.protein !== undefined && data.carbs !== undefined && data.fat !== undefined) {
    return data as NutritionData
  }

  // If it's in EnhancedNutritionData format
  if (data.macronutrients) {
    return enhancedToBasicNutrition(data as EnhancedNutritionData)
  }

  // If it has calories but not in a recognized format
  if (data.calories) {
    return createDefaultNutrition(data.calories)
  }

  // Fallback
  return createDefaultNutrition(500)
}
