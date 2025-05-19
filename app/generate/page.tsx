"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertDescription, Alert } from "@/components/ui/alert"
import RecipeCard from "@/components/recipe-card"
import type { User } from "@supabase/supabase-js"
import IngredientInput from "@/components/ingredient-input"
import type { MealType } from "@/components/meal-type-selector"
import { enhancedToBasicNutrition, createDefaultNutrition } from "@/utils/nutrition-helpers"
// Import icons individually to avoid potential loading issues
import { Loader2 } from "lucide-react"
import { Sparkles } from "lucide-react"

// Update the imports to include the enhanced MealTypeSelector component
import MealTypeSelector from "@/components/meal-type-selector-enhanced"

type Recipe = {
  title: string
  calories: number
  cooking_time: string
  ingredients: string[]
  instructions: string[]
  nutritionData: any
  enhancedNutritionData?: any
  markdown?: string
  mealType?: string
}

export default function GenerateRecipePage() {
  const [preferences, setPreferences] = useState("")
  const [ingredients, setIngredients] = useState<string[]>([])
  const [mealType, setMealType] = useState<MealType>("snack")
  const [calories, setCalories] = useState(200)
  const [loading, setLoading] = useState(false)
  const [nutritionLoading, setNutritionLoading] = useState(false)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nutritionError, setNutritionError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [enhancedNutrition, setEnhancedNutrition] = useState<any | null>(null)
  const [dietaryExclusions, setDietaryExclusions] = useState<string[]>([])
  const [exclusionInput, setExclusionInput] = useState("")

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }

    checkAuth()
  }, [supabase.auth])

  // Generate recipe using AI
  const generateRecipe = async () => {
    setLoading(true)
    setError(null)
    setSaveSuccess(false)

    try {
      // Call the API route to generate a recipe
      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients,
          preferences:
            preferences +
            (dietaryExclusions.length > 0 ? `. Exclude: ${dietaryExclusions.join(", ")}` : "") +
            ". Please provide ingredient quantities in grams where possible for accuracy.",
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

      // Create initial nutrition data from the generated recipe
      const generatedRecipe = result.recipe
      const initialNutritionData = createDefaultNutrition(generatedRecipe.calories || calories)

      // Set the recipe with the generated data
      setRecipe({
        title: generatedRecipe.title,
        calories: generatedRecipe.calories || calories,
        cooking_time: generatedRecipe.cooking_time || `${Math.floor(Math.random() * 30 + 15)} minutes`,
        ingredients: generatedRecipe.ingredients,
        instructions: generatedRecipe.instructions,
        nutritionData: initialNutritionData,
        markdown: generatedRecipe.markdown,
        mealType: getMealTypeLabel(mealType),
      })

      // Get enhanced nutritional information
      fetchNutritionData(generatedRecipe.ingredients, preferences, mealType, generatedRecipe.calories || calories)
    } catch (err: any) {
      console.error("Recipe generation error:", err)
      setError(err.message || "Failed to generate recipe. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Fetch nutritional data from the API
  const fetchNutritionData = async (
    recipeIngredients: string[] = ingredients,
    recipePreferences: string = preferences,
    recipeMealType: MealType = mealType,
    recipeCalories: number = calories,
  ) => {
    if (recipeIngredients.length === 0) return

    setNutritionLoading(true)
    setNutritionError(null)

    try {
      const response = await fetch("/api/nutrition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients: recipeIngredients,
          preferences: recipePreferences,
          mealType: recipeMealType,
          calories: recipeCalories,
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

      if (!result.success || !result.nutritionData) {
        throw new Error(result.error || "Failed to get nutritional information")
      }

      const enhancedData = result.nutritionData

      // Ensure vitamins and minerals are properly structured
      if (enhancedData.vitamins) {
        // Make sure vitamin values are numbers
        Object.entries(enhancedData.vitamins).forEach(([key, value]) => {
          enhancedData.vitamins[key] = typeof value === "number" ? value : Number.parseInt(value as string) || 0
        })
      }

      if (enhancedData.minerals) {
        // Make sure mineral values are numbers
        Object.entries(enhancedData.minerals).forEach(([key, value]) => {
          enhancedData.minerals[key] = typeof value === "number" ? value : Number.parseInt(value as string) || 0
        })
      }

      setEnhancedNutrition(enhancedData)

      // Convert enhanced nutrition data to basic format for the recipe card
      const basicNutritionData = enhancedToBasicNutrition(enhancedData)

      // Update the recipe with the new nutrition data
      if (recipe) {
        setRecipe({
          ...recipe,
          nutritionData: basicNutritionData,
          enhancedNutritionData: enhancedData,
        })
      }
    } catch (err: any) {
      console.error("Nutrition data error:", err)
      setNutritionError(err.message || "Failed to get nutritional information")
    } finally {
      setNutritionLoading(false)
    }
  }

  const saveRecipe = async () => {
    if (!recipe) return

    setSaving(true)
    setError(null)
    setSaveSuccess(false)

    try {
      // Check if user is authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setError("Please sign in to save recipes")
        setSaving(false)
        return
      }

      // Prioritize enhanced nutrition data from the component over Anthropic data
      const nutritionDataToSave = enhancedNutrition || recipe.enhancedNutritionData || recipe.nutritionData

      // Include nutritional data in the saved recipe
      const recipeData = {
        user_id: session.user.id,
        title: recipe.title,
        calories: recipe.calories,
        cooking_time: recipe.cooking_time,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        markdown: recipe.markdown,
        // Save the enhanced nutrition data
        nutrition_data: nutritionDataToSave,
        // Now we can include the meal_type since the column has been added
        meal_type: recipe.mealType || getMealTypeLabel(mealType),
      }

      const { error } = await supabase.from("favorite_recipes").insert(recipeData)

      if (error) {
        console.error("Database error:", error)
        if (error.code === "23505") {
          setError("You already saved this recipe")
        } else {
          setError(`Failed to save recipe: ${error.message}`)
        }
      } else {
        setSaveSuccess(true)
      }
    } catch (err: any) {
      console.error("Save recipe error:", err)
      setError(`Failed to save recipe: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const getMealTypeLabel = (type: MealType): string => {
    switch (type) {
      case "breakfast":
        return "Breakfast"
      case "lunch":
        return "Lunch"
      case "dinner":
        return "Dinner"
      case "snack":
        return "Snack"
      default:
        return "Snack"
    }
  }

  const addDietaryExclusion = () => {
    if (exclusionInput.trim() && !dietaryExclusions.includes(exclusionInput.trim())) {
      setDietaryExclusions([...dietaryExclusions, exclusionInput.trim()])
      setExclusionInput("")
    }
  }

  const removeDietaryExclusion = (exclusion: string) => {
    setDietaryExclusions(dietaryExclusions.filter((item) => item !== exclusion))
  }

  const addQuickExclusion = (exclusion: string) => {
    if (!dietaryExclusions.includes(exclusion)) {
      setDietaryExclusions([...dietaryExclusions, exclusion])
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipe Preferences Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="recipe-form p-6">
            <h2 className="text-2xl font-bold mb-2">Create Your Recipe</h2>
            <p className="text-muted-foreground mb-6">
              Choose how you want to generate your recipe and enter your preferences.
            </p>

            {/* API Info */}
            <div className="bg-muted border border-primary/30 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div>
                  <p className="text-primary font-medium">API Status</p>
                  <p className="text-sm text-muted-foreground">
                    Using Anthropic API to generate recipes with AI assistance.
                  </p>
                </div>
              </div>
            </div>

            {/* Target Calories */}
            <div className="mb-6">
              <Label htmlFor="calories" className="block mb-2">
                Target Calories
              </Label>
              <Input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                min={100}
                max={1000}
                step={50}
                className="bg-background border-input focus:border-primary"
              />
            </div>

            {/* Meal Type */}
            <div className="mb-6">
              <MealTypeSelector selectedMealType={mealType} onSelect={setMealType} />
            </div>

            {/* Ingredients */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <Label>Ingredients</Label>
                <Button variant="outline" size="sm" className="text-xs">
                  Use My Ingredients
                </Button>
              </div>
              <IngredientInput ingredients={ingredients} setIngredients={setIngredients} minIngredients={3} />
            </div>

            {/* Dietary Exclusions */}
            <div className="mb-6">
              <Label className="block mb-2">Dietary Exclusions (optional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Add ingredients or dietary restrictions you want to exclude from your recipe.
              </p>

              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add dietary exclusion (e.g., nuts, dairy)"
                  value={exclusionInput}
                  onChange={(e) => setExclusionInput(e.target.value)}
                  className="bg-background border-input focus:border-primary"
                  onKeyDown={(e) => e.key === "Enter" && addDietaryExclusion()}
                />
                <Button type="button" onClick={addDietaryExclusion} variant="outline">
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => addQuickExclusion("Gluten")}
                >
                  + Gluten
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => addQuickExclusion("Dairy")}
                >
                  + Dairy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => addQuickExclusion("Eggs")}
                >
                  + Eggs
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => addQuickExclusion("Soy")}
                >
                  + Soy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => addQuickExclusion("Shellfish")}
                >
                  + Shellfish
                </Button>
              </div>

              {dietaryExclusions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {dietaryExclusions.map((exclusion) => (
                    <div
                      key={exclusion}
                      className="bg-destructive/20 text-destructive px-2 py-1 rounded-md text-xs flex items-center"
                    >
                      {exclusion}
                      <button
                        type="button"
                        className="ml-2 text-destructive hover:text-destructive/80"
                        onClick={() => removeDietaryExclusion(exclusion)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preferences */}
            <div className="mb-6">
              <Label htmlFor="preferences" className="block mb-2">
                Additional Preferences
              </Label>
              <Textarea
                id="preferences"
                placeholder="Describe what you're looking for (e.g., quick and easy, vegetarian, spicy, etc.)"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="min-h-[80px] resize-none bg-background border-input focus:border-primary"
              />
            </div>

            <Button
              onClick={generateRecipe}
              disabled={loading || ingredients.length < 3}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Recipe
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Recipe Result */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saveSuccess && (
            <Alert className="mb-4 bg-green-900/30 border-green-600/30">
              <AlertDescription className="text-green-400">Recipe saved to your favorites!</AlertDescription>
            </Alert>
          )}

          {recipe ? (
            <RecipeCard
              title={recipe.title}
              calories={recipe.calories}
              cooking_time={recipe.cooking_time}
              ingredients={recipe.ingredients}
              instructions={recipe.instructions}
              onSave={saveRecipe}
              isSaving={saving}
              nutritionData={recipe.nutritionData}
              enhancedNutritionData={enhancedNutrition || recipe.enhancedNutritionData}
              isAuthenticated={!!user}
              currentPath={pathname}
              markdown={recipe.markdown}
              isNutritionLoading={nutritionLoading}
              nutritionError={nutritionError}
              mealType={recipe.mealType}
              passIngredientsToNutrition={true}
            />
          ) : (
            <div className="recipe-card flex items-center justify-center p-12 text-center h-full">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Your recipe will appear here</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  Fill out your preferences, add ingredients, and click "Generate Recipe" to see the result.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
