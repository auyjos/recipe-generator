"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDescription, Alert } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import RecipeCard from "@/components/recipe-card"
import { MacroInput } from "@/components/macro-input"
import type { User } from "@supabase/supabase-js"
import IngredientInput from "@/components/ingredient-input"
import type { MealType } from "@/components/meal-type-selector"
// Import icons individually to avoid potential loading issues
import { Loader2, Sparkles, RefreshCw, RotateCcw } from "lucide-react"
import logger from "@/utils/logger"

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
  const [mealType, setMealType] = useState<MealType>("breakfast")
  const [calories, setCalories] = useState(400)
  // Add new state for checkbox preferences
  const [nutritionalGoals, setNutritionalGoals] = useState({
    highProtein: false,
    highVolume: false,
    highFiber: false,
    lowCarb: false,
    lowFat: false,
    quickAndEasy: false
  })
  // Add state for calorie validation
  const [calorieError, setCalorieError] = useState<string | null>(null)
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
  const [recipeIdCounter, setRecipeIdCounter] = useState<number>(1) // Counter for unique IDs
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [dietaryExclusions, setDietaryExclusions] = useState<string[]>([])
  const [exclusionInput, setExclusionInput] = useState("")
  // Advanced mode state
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [macroTargets, setMacroTargets] = useState({
    protein: 30,
    carbs: 40,
    fat: 20
  })
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
    const recipeId = isRegeneration && recipe ? recipe.id : `recipe-${recipeIdCounter}`

    if (isRegeneration) {
      setRegenerating(true)
      // Keep the old recipe visible but show it's being regenerated
    } else {
      // Clear the old recipe immediately for a fresh generation
      setRecipe(null)
      // Increment counter for new recipes to ensure unique IDs
      setRecipeIdCounter(prev => prev + 1)
    }// Clear nutrition data and errors
    setNutritionError(null)

    try {      // Build preferences string from checkboxes
      const selectedGoals = Object.entries(nutritionalGoals)
        .filter(([_, selected]) => selected)
        .map(([goal, _]) => {
          switch (goal) {
            case 'highProtein': return 'high in protein'
            case 'highVolume': return 'high volume/low calorie density'
            case 'highFiber': return 'high in fiber'
            case 'lowCarb': return 'low carb'
            case 'lowFat': return 'low fat'
            case 'quickAndEasy': return 'quick and easy to prepare'
            default: return goal
          }
        })

      const builtPreferences = selectedGoals.length > 0
        ? `Make this recipe ${selectedGoals.join(', ')}.`
        : ''

      // Combine with any additional preferences and dietary exclusions
      const finalPreferences = [
        builtPreferences,
        preferences,
        dietaryExclusions.length > 0 ? `Exclude: ${dietaryExclusions.join(", ")}` : "",
        "Please provide ingredient quantities in grams where possible for accuracy."
      ].filter(Boolean).join(" ")

      // Debug logging
      logger.recipe.generation("Recipe Generation Debug:", {
        nutritionalGoals,
        selectedGoals,
        builtPreferences,
        finalPreferences
      })

      const requestPayload = {
        ingredients,
        preferences: finalPreferences,
        mealType,
        calories,
      }

      logger.api.start("FRONTEND: Calling Generate Recipe API", requestPayload)

      // Call the API route to generate a recipe
      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      })

      logger.api.response("API Response Status:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error("❌ API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        })
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `Server error: ${response.status}`)
        } catch (jsonError) {
          throw new Error(`Server error: ${errorText || response.statusText || response.status}`)
        }
      }

      const result = await response.json()
      logger.api.success("Successful API Response:", {
        success: result.success,
        hasRecipe: !!result.recipe,
        isMock: result.isMock || false,
        recipeTitle: result.recipe?.title || "No title",
        recipeCalories: result.recipe?.calories || "No calories",
        ingredientCount: result.recipe?.ingredients?.length || 0,
        instructionCount: result.recipe?.instructions?.length || 0,
        hasMarkdown: !!result.recipe?.markdown
      })

      if (result.isMock) {
        logger.warn("⚠️  Using mock recipe due to API failure:", result.apiError)
      }

      if (!result.success || !result.recipe) {
        throw new Error(result.error || "Failed to generate recipe")
      }

      // Create the new recipe object with the preserved ID
      const generatedRecipe = result.recipe
      logger.recipe.generation("Creating recipe object from API response:", {
        generatedRecipe,
        recipeId,
        calories,
        mealType
      })

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

      logger.recipe.generation("Final recipe object created:", newRecipe)

      // Update the recipe state and ingredients with the new/corrected recipe
      setRecipe(newRecipe)
      setIngredients(newRecipe.ingredients)
      logger.log("✅ Recipe state and ingredients updated successfully")

      // Increment the key to force a re-render of the recipe card
      setRecipeKey((prev) => prev + 1)

      logger.recipe.nutrition("Starting nutrition data fetch for recipe:", recipeId)
      // Get enhanced nutritional information
      fetchNutritionData(
        newRecipe.ingredients,
        preferences,
        mealType,
        newRecipe.calories || calories,
        recipeId, // Pass the preserved ID
      )
    } catch (err: any) {
      logger.error("Recipe generation error:", err)
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

  // Generate recipe based on macro targets
  const generateMacroRecipe = async (isRegeneration = false) => {
    setLoading(true)
    setError(null)
    setSaveSuccess(false)

    // Preserve the existing recipe ID during regeneration
    const recipeId = isRegeneration && recipe ? recipe.id : `macro-recipe-${recipeIdCounter}`

    if (isRegeneration) {
      setRegenerating(true)
    } else {
      setRecipe(null)
      setRecipeIdCounter(prev => prev + 1)
    }

    setNutritionError(null)

    try {
      const finalPreferences = [
        preferences,
        dietaryExclusions.length > 0 ? `Exclude: ${dietaryExclusions.join(", ")}` : "",
      ].filter(Boolean).join(" ")

      const requestPayload = {
        protein: macroTargets.protein,
        carbs: macroTargets.carbs,
        fat: macroTargets.fat,
        preferences: finalPreferences,
        mealType,
      }

      logger.api.start("FRONTEND: Calling Generate Macro Recipe API", requestPayload)

      const response = await fetch("/api/generate-recipe-macros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `Server error: ${response.status}`)
        } catch {
          throw new Error(`Server error: ${errorText || response.statusText || response.status}`)
        }
      }

      const result = await response.json()

      if (!result.success || !result.recipe) {
        throw new Error(result.error || "Failed to generate macro-based recipe")
      }

      const generatedRecipe = result.recipe
      const targetCalories = macroTargets.protein * 4 + macroTargets.carbs * 4 + macroTargets.fat * 9

      const newRecipe = {
        id: recipeId,
        title: generatedRecipe.title,
        calories: generatedRecipe.calories || targetCalories,
        cooking_time: generatedRecipe.cooking_time || `${Math.floor(Math.random() * 30 + 15)} minutes`,
        ingredients: generatedRecipe.ingredients,
        instructions: generatedRecipe.instructions,
        nutritionData: null,
        markdown: generatedRecipe.markdown,
        mealType: getMealTypeLabel(mealType),
      }

      setRecipe(newRecipe)
      setIngredients(newRecipe.ingredients)
      setRecipeKey((prev) => prev + 1)

      // Get enhanced nutritional information
      fetchNutritionData(
        newRecipe.ingredients,
        finalPreferences,
        mealType,
        newRecipe.calories || targetCalories,
        recipeId,
      )
    } catch (err: any) {
      logger.error("Macro recipe generation error:", err)
      setError(err.message || "Failed to generate macro-based recipe. Please try again.")
    } finally {
      setLoading(false)
      setRegenerating(false)
    }
  }

  // Handle macro recipe regeneration
  const handleMacroRegenerate = () => {
    generateMacroRecipe(true)
  }

  // Fetch nutritional data from the API
  const fetchNutritionData = async (
    recipeIngredients: string[] = ingredients,
    recipePreferences: string = preferences,
    recipeMealType: MealType = mealType,
    recipeCalories: number = calories,
    recipeId?: string,
  ) => {
    logger.api.start("NUTRITION API", {
      ingredients: recipeIngredients,
      preferences: recipePreferences,
      mealType: recipeMealType,
      calories: recipeCalories,
      recipeId: recipeId
    })

    if (recipeIngredients.length === 0) {
      logger.warn("⚠️  No ingredients provided, skipping nutrition fetch")
      return setNutritionLoading(true)
    }

    setNutritionLoading(true)
    setNutritionError(null)

    try {
      const nutritionPayload = {
        ingredients: recipeIngredients,
        preferences: recipePreferences,
        mealType: recipeMealType,
        calories: recipeCalories,
      }

      logger.api.request("Nutrition API Request:", nutritionPayload)

      const response = await fetch("/api/nutrition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nutritionPayload),
      })

      logger.api.response("Nutrition API Response Status:", {
        status: response.status,
        statusText: response.statusText
      })

      if (!response.ok) {
        const errorText = await response.text()
        logger.error("❌ Nutrition API Error:", {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        })
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `Server error: ${response.status}`)
        } catch (jsonError) {
          throw new Error(`Server error: ${errorText || response.statusText || response.status}`)
        }
      }

      const result = await response.json()

      logger.api.success("Nutrition API Success Response:", {
        success: result.success,
        hasNutritionData: !!result.nutritionData,
        calories: result.nutritionData?.calories || "No calories",
        hasMacronutrients: !!result.nutritionData?.macronutrients,
        hasVitamins: !!result.nutritionData?.vitamins,
        hasMinerals: !!result.nutritionData?.minerals
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to get nutritional information")
      }

      // Store the nutrition data directly without transformations
      const nutritionData = result.nutritionData
      logger.recipe.nutrition("Raw nutrition data from API:", {
        nutritionData,
        hasData: nutritionData ? "data present" : "missing data"
      })

      if (!nutritionData) {
        throw new Error("No nutrition data received from API")
      }

      // Get the current recipe state to ensure we're working with the latest data
      setRecipe((prevRecipe) => {
        logger.recipe.update("Updating recipe with nutrition data:", {
          previousRecipeId: prevRecipe?.id || "No previous recipe",
          expectedRecipeId: recipeId || "No expected ID",
          nutritionDataStructure: {
            calories: nutritionData.calories,
            hasMacronutrients: !!nutritionData.macronutrients,
            hasVitamins: !!nutritionData.vitamins,
            hasMinerals: !!nutritionData.minerals
          }
        })

        // If there's no recipe, we can't update it
        if (!prevRecipe) {
          logger.warn("⚠️  No previous recipe to update with nutrition data")
          return null
        }

        // Check if the recipe ID matches the one we're expecting
        // For the first generation, recipeId will match prevRecipe.id
        // For subsequent generations, we've preserved the ID so they should also match
        if (!recipeId || prevRecipe.id === recipeId) {
          logger.log(`✅ Updating recipe ${prevRecipe.id} with nutrition data`)
          const updatedRecipe = {
            ...prevRecipe,
            nutritionData,
          }
          logger.recipe.update("Updated recipe object:", updatedRecipe)
          return updatedRecipe
        }

        // If IDs don't match, log it but don't discard the current recipe
        logger.warn(`⚠️  ID mismatch: Recipe ID ${prevRecipe.id} vs Nutrition data ID ${recipeId}`)
        return prevRecipe
      })

      logger.api.end("NUTRITION API")
    } catch (err: any) {
      logger.error("Nutrition data error:", err)
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
        logger.error("Database error:", error)
        if (error.code === "23505") {
          setError("You already saved this recipe")
        } else {
          setError(`Failed to save recipe: ${error.message}`)
        }
      } else {
        setSaveSuccess(true)
      }
    } catch (err: any) {
      logger.error("Save recipe error:", err)
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

  // Handle checkbox changes
  const handleGoalChange = (goal: keyof typeof nutritionalGoals) => {
    setNutritionalGoals(prev => ({
      ...prev,
      [goal]: !prev[goal]
    }))
  }
  // Handle calorie input with validation
  const handleCalorieChange = (value: string) => {
    // Allow empty input for better UX
    if (value === "") {
      setCalories(0)
      setCalorieError("Please enter a calorie target")
      return
    }

    const numValue = Number(value)

    // Check if it's a valid number
    if (isNaN(numValue)) {
      setCalorieError("Please enter a valid number")
      return
    }

    // Check range
    if (numValue < 100) {
      setCalorieError(`Too low - minimum is 100 calories (you entered ${numValue})`)
      setCalories(numValue) // Still update the value for user feedback
      return
    }

    if (numValue > 2000) {
      setCalorieError(`Too high - maximum is 2000 calories (you entered ${numValue})`)
      setCalories(numValue) // Still update the value for user feedback
      return
    }

    // Valid calorie range
    setCalorieError(null)
    setCalories(numValue)
  }

  // Helper for calorie input border color
  const getCalorieBorderClass = () => {
    if (calorieError) return "border-red-500 focus:border-red-500"
    if (calories >= 100 && calories <= 2000) return "border-green-500 focus:border-green-500"
    return ""
  }

  // Clear All functionality
  const clearAllInputs = () => {
    // Reset all form inputs to their default values
    setIngredients([])
    setMealType("breakfast")
    setCalories(400)
    setNutritionalGoals({
      highProtein: false,
      highVolume: false,
      highFiber: false,
      lowCarb: false,
      lowFat: false,
      quickAndEasy: false
    })
    setPreferences("")
    setDietaryExclusions([])
    setExclusionInput("")

    // Clear validation and error states
    setCalorieError(null)
    setError(null)
    setSaveSuccess(false)

    // Clear generated recipe and related states
    setRecipe(null)
    setNutritionError(null)
    setRecipeKey(prev => prev + 1) // Force re-render if needed
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

            {/* Recipe Generation Mode Toggle */}
            <div className="mb-6 p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="advanced-mode" className="text-base font-medium">
                    {isAdvancedMode ? "Advanced Mode" : "Ingredient Mode"}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {isAdvancedMode
                      ? "Generate recipes based on precise macro targets"
                      : "Generate recipes based on available ingredients"
                    }
                  </p>
                </div>
                <Switch
                  id="advanced-mode"
                  checked={isAdvancedMode}
                  onCheckedChange={setIsAdvancedMode}
                />
              </div>
            </div>

            {/* Conditional Rendering based on mode */}
            {isAdvancedMode ? (
              // Advanced Mode: Macro Targets
              <>
                <MacroInput
                  protein={macroTargets.protein}
                  carbs={macroTargets.carbs}
                  fat={macroTargets.fat}
                  onProteinChange={(value) => setMacroTargets(prev => ({ ...prev, protein: value }))}
                  onCarbsChange={(value) => setMacroTargets(prev => ({ ...prev, carbs: value }))}
                  onFatChange={(value) => setMacroTargets(prev => ({ ...prev, fat: value }))}
                  className="mb-6"
                />
              </>
            ) : (
              // Standard Mode: Ingredients and Calories
              <>
                {/* Target Calories */}
                <div className="mb-6">
                  <Label htmlFor="calories" className="block mb-2">
                    Target Calories
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    How many calories should this recipe have? (100-2000 kcal)
                  </p>
                  <Input
                    id="calories"
                    type="number"
                    min="100"
                    max="2000"
                    step="50"
                    value={calories || ""}
                    onChange={(e) => handleCalorieChange(e.target.value)}
                    className={
                      calorieError
                        ? "border-red-500 focus:border-red-500"
                        : getCalorieBorderClass()
                    }
                  />
                  {calorieError && <p className="text-red-500 text-xs mt-1">{calorieError}</p>}
                </div>

                {/* Ingredients */}
                <div className="mb-6">
                  <Label className="block mb-2">Ingredients</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Add at least 3 ingredients you'd like to use in your recipe
                  </p>
                  <IngredientInput
                    ingredients={ingredients}
                    setIngredients={setIngredients}
                    placeholder="Enter an ingredient (e.g., chicken breast, rice, broccoli)"
                  />
                </div>
              </>
            )}

            {/* Meal Type */}
            <div className="mb-6">
              <MealTypeSelector selectedMealType={mealType} onSelect={setMealType} />
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
            </div>            {/* Nutritional Goals */}
            <div className="mb-6">
              <Label className="block mb-3">
                Nutritional Goals
              </Label>
              <p className="text-xs text-muted-foreground mb-4">
                Select your nutritional preferences for this recipe.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="highProtein"
                    checked={nutritionalGoals.highProtein}
                    onCheckedChange={() => handleGoalChange('highProtein')}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor="highProtein"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    High Protein
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="highVolume"
                    checked={nutritionalGoals.highVolume}
                    onCheckedChange={() => handleGoalChange('highVolume')}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor="highVolume"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    High Volume
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="highFiber"
                    checked={nutritionalGoals.highFiber}
                    onCheckedChange={() => handleGoalChange('highFiber')}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor="highFiber"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    High Fiber
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="lowCarb"
                    checked={nutritionalGoals.lowCarb}
                    onCheckedChange={() => handleGoalChange('lowCarb')}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor="lowCarb"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Low Carb
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="lowFat"
                    checked={nutritionalGoals.lowFat}
                    onCheckedChange={() => handleGoalChange('lowFat')}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor="lowFat"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Low Fat
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="quickAndEasy"
                    checked={nutritionalGoals.quickAndEasy}
                    onCheckedChange={() => handleGoalChange('quickAndEasy')}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor="quickAndEasy"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Quick & Easy
                  </Label>
                </div>
              </div>

              {/* Visual feedback - shows selected preferences as styled tags */}
              {Object.values(nutritionalGoals).some(Boolean) && (
                <div className="mt-4 p-3 bg-muted/50 border border-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Selected preferences:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(nutritionalGoals)
                      .filter(([_, selected]) => selected)
                      .map(([goal, _]) => {
                        const label = (() => {
                          switch (goal) {
                            case 'highProtein': return 'High Protein'
                            case 'highVolume': return 'High Volume'
                            case 'highFiber': return 'High Fiber'
                            case 'lowCarb': return 'Low Carb'
                            case 'lowFat': return 'Low Fat'
                            case 'quickAndEasy': return 'Quick & Easy'
                            default: return goal
                          }
                        })()
                        return (
                          <span
                            key={goal}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                          >
                            {label}
                          </span>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="mb-6">
              <Label htmlFor="additionalNotes" className="block mb-2">
                Additional Notes (optional)
              </Label>
              <Textarea
                id="additionalNotes"
                placeholder="Any other specific requirements or preferences..."
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="min-h-[60px] resize-none bg-background border-input focus:border-primary"
                rows={2}
              />
            </div>
            <Button
              onClick={() => isAdvancedMode ? generateMacroRecipe(false) : generateRecipe(false)}
              disabled={
                loading ||
                (isAdvancedMode
                  ? macroTargets.protein < 5 || macroTargets.carbs < 5 || macroTargets.fat < 5
                  : ingredients.length < 3 || !!calorieError || calories < 100 || calories > 2000)
              }
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isAdvancedMode ? "Generate Macro Recipe" : "Generate Recipe"}
                </>
              )}
            </Button>
            {/* Clear All button */}
            <div className="mt-4">
              <Button
                onClick={clearAllInputs}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>
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

                  {/* Regenerate button */}
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={isAdvancedMode ? handleMacroRegenerate : handleRegenerate}
                      disabled={loading || regenerating}
                      className="flex items-center gap-2"
                    >
                      {regenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Regenerate Recipe
                    </Button>
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
                    isAuthenticated={!!user}
                    currentPath={pathname}
                    markdown={recipe.markdown}
                    isNutritionLoading={nutritionLoading}
                    nutritionError={nutritionError}
                    mealType={recipe.mealType}
                  />


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
