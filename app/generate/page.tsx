"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Sparkles } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import RecipeCard from "@/components/recipe-card"
import type { NutritionData } from "@/components/nutritional-info"
import type { User } from "@supabase/supabase-js"
import IngredientInput from "@/components/ingredient-input"
import MealTypeSelector, { type MealType } from "@/components/meal-type-selector"
import { Separator } from "@/components/ui/separator"
import CalorieInput from "@/components/calorie-input"
import type { EnhancedNutritionData } from "@/components/enhanced-nutritional-info"
import { enhancedToBasicNutrition, createDefaultNutrition } from "@/utils/nutrition-helpers"

type Recipe = {
  title: string
  calories: number
  cooking_time: string
  ingredients: string[]
  instructions: string[]
  nutritionData: NutritionData
  enhancedNutritionData?: EnhancedNutritionData
  markdown?: string
}

export default function GenerateRecipePage() {
  const [preferences, setPreferences] = useState("")
  const [ingredients, setIngredients] = useState<string[]>([])
  const [mealType, setMealType] = useState<MealType>("dinner")
  const [calories, setCalories] = useState(500)
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
  const [enhancedNutrition, setEnhancedNutrition] = useState<EnhancedNutritionData | null>(null)

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)

      // Set up auth state change listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null)
      })

      return () => {
        subscription.unsubscribe()
      }
    }

    checkAuth()
  }, [supabase.auth])

  // Generate recipe using AI
  const generateRecipe = async () => {
    // Validate inputs
    if (ingredients.length < 3) {
      setError("Please add at least 3 ingredients")
      return
    }

    if (!preferences.trim()) {
      setError("Please enter your preferences")
      return
    }

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
          preferences,
          mealType,
          calories,
        }),
      })

      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text()
        try {
          // Try to parse as JSON first
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `Server error: ${response.status}`)
        } catch (jsonError) {
          // If it's not valid JSON, use the text
          throw new Error(`Server error: ${errorText || response.statusText || response.status}`)
        }
      }

      // Parse the JSON response
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

  // Handle calorie change
  const handleCalorieChange = (newCalories: number) => {
    setCalories(newCalories)
  }

  // Request nutrition data when calories change
  const handleNutritionRequest = (newCalories: number) => {
    if (recipe) {
      fetchNutritionData(recipe.ingredients, preferences, mealType, newCalories)
    } else if (ingredients.length >= 3) {
      fetchNutritionData(ingredients, preferences, mealType, newCalories)
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
      }

      console.log("Saving recipe with nutrition data:", nutritionDataToSave)

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

  const isFormValid = ingredients.length >= 3 && preferences.trim() !== ""

  return (
    <div className="max-w-6xl mx-auto">
      <motion.h1
        className="text-3xl font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Generate Recipe
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipe Preferences Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="overflow-hidden border-2 hover:border-primary/20 transition-all duration-300 h-full">
            <CardHeader>
              <CardTitle>Recipe Preferences</CardTitle>
              <CardDescription>Tell us what kind of recipe you'd like to generate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="preferences">Description</Label>
                <Textarea
                  id="preferences"
                  placeholder="Describe what you're looking for (e.g., quick and easy, vegetarian, spicy, etc.)"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="min-h-[80px] resize-none transition-all duration-200 focus:border-primary"
                />
              </div>

              <Separator />

              <MealTypeSelector selectedMealType={mealType} onSelect={setMealType} />

              <Separator />

              <div className="space-y-2">
                <Label>Ingredients (minimum 3)</Label>
                <IngredientInput ingredients={ingredients} setIngredients={setIngredients} minIngredients={3} />
              </div>

              <Separator />

              <CalorieInput
                value={calories}
                onChange={handleCalorieChange}
                onNutritionRequest={handleNutritionRequest}
                isLoading={nutritionLoading}
              />
            </CardContent>
            <CardFooter>
              <Button
                onClick={generateRecipe}
                disabled={loading || !isFormValid}
                className="w-full transition-all duration-300 relative overflow-hidden group"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                    Generate Recipe
                  </>
                )}
                <motion.span
                  className="absolute inset-0 bg-white/20 rounded-md"
                  initial={{ x: "-100%" }}
                  animate={loading ? { x: "0%" } : { x: "-100%" }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, ease: "linear" }}
                />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Recipe Result */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col gap-4"
        >
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saveSuccess && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <AlertTitle className="text-green-800 dark:text-green-300">Success</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                Recipe saved to your favorites!
              </AlertDescription>
            </Alert>
          )}

          {recipe ? (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Generated Recipe</h2>
              </div>

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
              />
            </>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg p-12 text-center">
              <div className="space-y-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary/70" />
                </div>
                <h3 className="text-lg font-medium">Your recipe will appear here</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  Fill out your preferences, add at least 3 ingredients, and click "Generate Recipe" to see the result.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
