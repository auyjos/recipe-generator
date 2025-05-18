// Conversion factors
const CONVERSION_FACTORS = {
  // Weight
  g_to_oz: 0.03527396,
  oz_to_g: 28.3495,
  kg_to_lb: 2.20462,
  lb_to_kg: 0.453592,

  // Volume
  ml_to_floz: 0.033814,
  floz_to_ml: 29.5735,
  l_to_cup: 4.22675,
  cup_to_l: 0.236588,

  // Temperature
  c_to_f: (c: number) => (c * 9) / 5 + 32,
  f_to_c: (f: number) => ((f - 32) * 5) / 9,
}

// Regex patterns to identify units
const UNIT_PATTERNS = {
  metric: /(\d+(?:\.\d+)?)\s*(g|kg|ml|l|°c|c)\b/gi,
  imperial: /(\d+(?:\.\d+)?)\s*(oz|lb|floz|cup|°f|f)\b/gi,
}

// Convert a single value between units
export function convertValue(value: number, fromUnit: string, toUnit: string): number | null {
  const fromLower = fromUnit.toLowerCase()
  const toLower = toUnit.toLowerCase()

  // Handle temperature conversions separately
  if (fromLower === "c" && toLower === "f") {
    return CONVERSION_FACTORS.c_to_f(value)
  }
  if (fromLower === "f" && toLower === "c") {
    return CONVERSION_FACTORS.f_to_c(value)
  }

  // Handle other conversions
  const conversionKey = `${fromLower}_to_${toLower}` as keyof typeof CONVERSION_FACTORS
  const factor = CONVERSION_FACTORS[conversionKey]

  if (typeof factor === "number") {
    return value * factor
  }

  return null // Conversion not supported
}

// Convert text containing measurements
export function convertMeasurementsInText(text: string, toSystem: "metric" | "imperial"): string {
  const pattern = toSystem === "metric" ? UNIT_PATTERNS.imperial : UNIT_PATTERNS.metric

  return text.replace(pattern, (match, value, unit) => {
    const numValue = Number.parseFloat(value)

    // Define unit conversions based on target system
    const unitConversions: Record<string, { targetUnit: string; conversionKey: keyof typeof CONVERSION_FACTORS }> = {
      // To metric
      oz: { targetUnit: "g", conversionKey: "oz_to_g" },
      lb: { targetUnit: "kg", conversionKey: "lb_to_kg" },
      floz: { targetUnit: "ml", conversionKey: "floz_to_ml" },
      cup: { targetUnit: "ml", conversionKey: "cup_to_l" },
      f: { targetUnit: "C", conversionKey: "f_to_c" },

      // To imperial
      g: { targetUnit: "oz", conversionKey: "g_to_oz" },
      kg: { targetUnit: "lb", conversionKey: "kg_to_lb" },
      ml: { targetUnit: "fl oz", conversionKey: "ml_to_floz" },
      l: { targetUnit: "cups", conversionKey: "l_to_cup" },
      c: { targetUnit: "F", conversionKey: "c_to_f" },
    }

    const unitLower = unit.toLowerCase()
    const conversion = unitConversions[unitLower]

    if (!conversion) return match

    const factor = CONVERSION_FACTORS[conversion.conversionKey]
    let convertedValue: number

    if (typeof factor === "function") {
      convertedValue = factor(numValue)
    } else {
      convertedValue = numValue * factor
    }

    // Format the result
    return `${convertedValue.toFixed(1)} ${conversion.targetUnit}`
  })
}

// Convert an array of ingredients
export function convertIngredients(ingredients: string[], toSystem: "metric" | "imperial"): string[] {
  return ingredients.map((ingredient) => convertMeasurementsInText(ingredient, toSystem))
}

// Detect if text has convertible measurements
export function hasConvertibleMeasurements(text: string): boolean {
  return UNIT_PATTERNS.metric.test(text) || UNIT_PATTERNS.imperial.test(text)
}
