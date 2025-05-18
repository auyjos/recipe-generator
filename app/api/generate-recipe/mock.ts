import type { MealType } from "@/components/meal-type-selector"

// This function generates a mock recipe when the real API fails
export function generateMockRecipe(ingredients: string[], preferences: string, mealType: MealType, calories: number) {
  // Generate a title based on the meal type and ingredients
  const mainIngredient = ingredients[0] || "Delicious"
  const secondaryIngredient = ingredients.length > 1 ? ingredients[1] : ""

  const mealTypeNames = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
  }

  const adjectives = [
    "Tasty",
    "Delicious",
    "Savory",
    "Hearty",
    "Homemade",
    "Classic",
    "Quick",
    "Easy",
    "Gourmet",
    "Healthy",
    "Fresh",
    "Flavorful",
  ]

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]

  let title = `${randomAdjective} ${mealTypeNames[mealType]} ${mainIngredient}`
  if (secondaryIngredient) {
    title += ` with ${secondaryIngredient}`
  }

  // Generate cooking time
  const cookingTime = `${Math.floor(Math.random() * 30 + 15)} minutes`

  // Generate instructions based on ingredients
  const instructions = [
    `Prepare all ingredients. Wash and chop ${ingredients[0]}.`,
    `Heat a pan over medium heat with a tablespoon of oil.`,
    ingredients.length > 1 ? `Add ${ingredients[0]} and cook for 5 minutes.` : `Cook ${ingredients[0]} until done.`,
    ingredients.length > 1 ? `Add ${ingredients[1]} and continue cooking for 3 minutes.` : `Season to taste.`,
    ingredients.length > 2
      ? `Stir in ${ingredients[2]} and cook for another 2 minutes.`
      : `Adjust seasoning if needed.`,
    `Season with salt and pepper to taste.`,
    `Serve hot and enjoy your meal!`,
  ]

  // Generate a markdown representation
  const markdown = `
# ${title}

## Ingredients
${ingredients.map((ing) => `- ${ing}`).join("\n")}
- Salt and pepper to taste
- 2 tablespoons cooking oil

## Instructions
1. ${instructions[0]}
2. ${instructions[1]}
3. ${instructions[2]}
4. ${instructions[3]}
5. ${instructions[4]}
6. ${instructions[5]}
7. ${instructions[6]}

## Nutrition (Estimated)
- Calories: ${calories} kcal
- Protein: ${Math.round((calories * 0.2) / 4)}g
- Carbs: ${Math.round((calories * 0.5) / 4)}g
- Fat: ${Math.round((calories * 0.3) / 9)}g

## Cooking Time
${cookingTime.split(" ")[0]} minutes
`

  return {
    title,
    ingredients: [...ingredients, "Salt and pepper to taste", "2 tablespoons cooking oil"],
    instructions,
    calories,
    cooking_time: cookingTime,
    markdown,
  }
}
