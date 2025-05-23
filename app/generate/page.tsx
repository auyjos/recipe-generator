"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
// Import icons individually to avoid potential loading issues
import { Loader2, Sparkles, RefreshCw } from "lucide-react"

// Update the imports to include the enhanced MealTypeSelector component
import MealTypeSelector from "@/components/meal-type-selector-enhanced"
import type { NutritionApiData } from "@/components/nutrition-display"

type Recipe = {
  id?: string // Add an ID for tracking recipe instances
  title: string
  calories: number
  cooking_time: string
  ingredients: string[]
  instructions: string[]
  nutritionData: NutritionApiData | null
  markdown?: string
  mealType?: string
  validationWarning?: string | null
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
  const [regenerating, setRegenerating] = useState(false)
  const [recipeKey, setRecipeKey] = useState<number>(1) // Key for forcing re-render
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [dietaryExclusions, setDietaryExclusions] = useState<string[]>([])
  const [exclusionInput, setExclusionInput] = useState("")
  const recipeRef = useRef<HTMLDivElement>(null)

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

  // Scroll to recipe when it's generated
  useEffect(() => {
    if (recipe && recipeRef.current && !loading) {
      // Use a small timeout to ensure the DOM has updated
      const timer = setTimeout(() => {
        recipeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [recipe, loading])

  // Generate recipe using AI
  const generateRecipe = async (isRegeneration = false) => {
    // Set appropriate loading states
    setLoading(true)
    setError(null)
    setSaveSuccess(false)

    // Preserve the existing recipe ID during regeneration
    const recipeId = isRegeneration && recipe ? recipe.id : Date.now().toString()

    if (isRegeneration) {
      setRegenerating(true)
      // Keep the old recipe visible but show it's being regenerated
    } else {
      // Clear the old recipe immediately for a fresh generation
      setRecipe(null)
    }

    // Clear nutrition data and errors
    setNutritionError(null)

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

      // Create the new recipe object with the preserved ID
      const generatedRecipe = result.recipe
      const newRecipe = {
        id: recipeId, // Use the preserved ID
        title: generatedRecipe.title,
        calories: generatedRecipe.calories || calories,
        cooking_time: generatedRecipe.cooking_time || `${Math.floor(Math.random() * 30 + 15)} minutes`,
        ingredients: generatedRecipe.ingredients,
        instructions: generatedRecipe.instructions,
        nutritionData: null, // Initialize with null, will be populated by fetchNutritionData
        markdown: generatedRecipe.markdown,
        mealType: getMealTypeLabel(mealType),
      }

      // Update the recipe state with the new recipe
      setRecipe(newRecipe)

      // Increment the key to force a re-render of the recipe card
      setRecipeKey((prev) => prev + 1)

      // Get enhanced nutritional information
      fetchNutritionData(
        generatedRecipe.ingredients,
        preferences,
        mealType,
        generatedRecipe.calories || calories,
        recipeId, // Pass the preserved ID
      )
    } catch (err: any) {
      console.error("Recipe generation error:", err)
      setError(err.message || "Failed to generate recipe. Please try again.")
    } finally {
      setLoading(false)
      setRegenerating(false)
    }
  }

  // Regenerate recipe with same parameters
  const handleRegenerate = () => {
    generateRecipe(true)
  }

  // Fetch nutritional data from the API
  const fetchNutritionData = async (
    recipeIngredients: string[] = ingredients,
    recipePreferences: string = preferences,
    recipeMealType: MealType = mealType,
    recipeCalories: number = calories,
    recipeId?: string,
  ) => {
    if (recipeIngredients.length === 0) return

    setNutritionLoading(true)
    setNutritionError(null)

    try {
      console.log(`Fetching nutrition data for recipe ID: ${recipeId}`)

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
      console.log("Nutrition API response:", result.success, result.isMock ? "mock data" : "real data")

      if (!result.success) {
        throw new Error(result.error || "Failed to get nutritional information")
      }

      // Store the nutrition data directly without transformations
      const nutritionData = result.nutritionData
      console.log("Received nutrition data:", nutritionData ? "data present" : "missing data")

      if (!nutritionData) {
        throw new Error("No nutrition data received from API")
      }

      // Get the current recipe state to ensure we're working with the latest data
      setRecipe((prevRecipe) => {
        // If there's no recipe, we can't update it
        if (!prevRecipe) return null

        // Check if the recipe ID matches the one we're expecting
        // For the first generation, recipeId will match prevRecipe.id
        // For subsequent generations, we've preserved the ID so they should also match
        if (!recipeId || prevRecipe.id === recipeId) {
          console.log(`Updating recipe ${prevRecipe.id} with nutrition data`)
          return {
            ...prevRecipe,
            nutritionData,
          }
        }

        // If IDs don't match, log it but don't discard the current recipe
        console.log(`ID mismatch: Recipe ID ${prevRecipe.id} vs Nutrition data ID ${recipeId}`)
        return prevRecipe
      })
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

      // Include nutritional data in the saved recipe
      const recipeData = {
        user_id: session.user.id,
        title: recipe.title,
        calories: recipe.calories,
        cooking_time: recipe.cooking_time,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        markdown: recipe.markdown,
        // Save the nutrition data directly
        nutrition_data: recipe.nutritionData,
        // Include the meal_type
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
              onClick={() => generateRecipe(false)}
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
          ref={recipeRef}
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

          <AnimatePresence mode="wait">
            {recipe ? (
              <motion.div
                key={`recipe-${recipeKey}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className={regenerating ? "opacity-50 pointer-events-none" : ""}
              >
                <div className="relative">
                  {regenerating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
                      <div className="bg-card p-4 rounded-lg shadow-lg flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>Regenerating recipe...</span>
                      </div>
                    </div>
                  )}

                  <RecipeCard
                    title={recipe.title}
                    calories={recipe.calories}
                    cooking_time={recipe.cooking_time}
                    ingredients={recipe.ingredients}
                    instructions={recipe.instructions}
                    onSave={saveRecipe}
                    isSaving={saving}
                    nutritionData={recipe.nutritionData}
                    isAuthenticated={!!user}
                    currentPath={pathname}
                    markdown={recipe.markdown}
                    isNutritionLoading={nutritionLoading}
                    nutritionError={nutritionError}
                    mealType={recipe.mealType}
                  />

                  {/* Regenerate button */}
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={handleRegenerate}
                      disabled={loading || regenerating}
                      className="flex items-center gap-2"
                    >
                      {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Regenerate Recipe
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="recipe-card flex items-center justify-center p-12 text-center h-full"
              >
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Your recipe will appear here</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    Fill out your preferences, add ingredients, and click "Generate Recipe" to see the result.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
