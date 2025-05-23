/**
 * Safely logs objects to the console, handling circular references
 * and limiting the depth of nested objects
 */
export function safeLog(label: string, obj: any, maxDepth = 2) {
  try {
    // Create a safe copy of the object with limited depth
    const safeObj = JSON.parse(
      JSON.stringify(obj, function (key, value) {
        if (this === value || maxDepth <= 0) {
          return "[Circular or Max Depth]"
        }
        if (typeof value === "object" && value !== null) {
          maxDepth--
        }
        return value
      }),
    )

    console.log(`${label}:`, safeObj)
    return true
  } catch (error) {
    console.log(`${label}: [Error logging object: ${error.message}]`)
    return false
  }
}

/**
 * Validates nutrition data structure to ensure it has the required fields
 */
export function validateNutritionData(data: any): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  if (!data) {
    return { valid: false, issues: ["Nutrition data is null or undefined"] }
  }

  if (typeof data !== "object") {
    return { valid: false, issues: [`Nutrition data is not an object, got ${typeof data}`] }
  }

  // Check required fields
  if (!("calories" in data)) {
    issues.push("Missing calories field")
  } else if (typeof data.calories !== "number") {
    issues.push(`Calories should be a number, got ${typeof data.calories}`)
  }

  // Check macronutrients
  if (!("macronutrients" in data)) {
    issues.push("Missing macronutrients object")
  } else if (typeof data.macronutrients !== "object") {
    issues.push(`Macronutrients should be an object, got ${typeof data.macronutrients}`)
  } else {
    // Check required macronutrients
    const requiredMacros = ["protein", "carbs", "fat"]
    for (const macro of requiredMacros) {
      if (!(macro in data.macronutrients)) {
        issues.push(`Missing ${macro} in macronutrients`)
      } else if (typeof data.macronutrients[macro] !== "number") {
        issues.push(`${macro} should be a number, got ${typeof data.macronutrients[macro]}`)
      }
    }
  }

  return { valid: issues.length === 0, issues }
}
