"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import RecipeCard from "@/components/recipe-card"
import SignInPrompt from "@/components/sign-in-prompt"
import { convertToNutritionData } from "@/utils/nutrition-helpers"
import type { EnhancedNutritionData } from "@/components/enhanced-nutritional-info"

type Recipe = {
  id: string
  title: string
  calories: number
  cooking_time: string
  ingredients: string[]
  instructions: string[]
  created_at: string
  markdown?: string
  nutrition_data?: any
  meal_type?: string // Added to match the new database column
}

export default function MyRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const supabase = createClient()
  const pathname = usePathname()

  useEffect(() => {
    async function checkAuthAndFetchRecipes() {
      setLoading(true)
      setError(null)

      try {
        // Check authentication status
        const {
          data: { session },
        } = await supabase.auth.getSession()

        setIsAuthenticated(!!session)

        // If not authenticated, don't try to fetch recipes
        if (!session) {
          setLoading(false)
          return
        }

        // Fetch recipes if authenticated
        const { data, error } = await supabase
          .from("favorite_recipes")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        // Process the data to handle missing fields
        const processedData = data.map((recipe: any) => ({
          id: recipe.id,
          title: recipe.title || "Untitled Recipe",
          calories: recipe.calories || 0,
          cooking_time: recipe.cooking_time || "Unknown",
          ingredients: recipe.ingredients || [],
          instructions: recipe.instructions || [],
          created_at: recipe.created_at,
          // Include markdown and nutrition_data if they exist
          ...(recipe.markdown && { markdown: recipe.markdown }),
          ...(recipe.nutrition_data && { nutrition_data: recipe.nutrition_data }),
          // Include meal_type if it exists
          ...(recipe.meal_type && { meal_type: recipe.meal_type }),
        }))

        console.log(
          "Fetched recipes with nutrition data:",
          processedData.map((r) => r.nutrition_data),
        )
        setRecipes(processedData)
      } catch (err: any) {
        console.error("Error fetching recipes:", err)
        setError(err.message || "Failed to load recipes")
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchRecipes()
  }, [supabase])

  const deleteRecipe = async (id: string) => {
    setDeleting(id)

    try {
      const { error } = await supabase.from("favorite_recipes").delete().eq("id", id)

      if (error) {
        throw error
      }

      setRecipes(recipes.filter((recipe) => recipe.id !== id))
    } catch (err: any) {
      console.error("Error deleting recipe:", err)
      setError(err.message || "Failed to delete recipe")
    } finally {
      setDeleting(null)
    }
  }

  // Ensure nutrition data has the correct structure
  const normalizeNutritionData = (data: any): EnhancedNutritionData => {
    if (!data) {
      return { calories: 0 }
    }

    // If data already has the correct structure with macronutrients
    if (data.macronutrients) {
      return data as EnhancedNutritionData
    }

    // If data has direct properties (old format)
    if (data.protein !== undefined || data.carbs !== undefined || data.fat !== undefined) {
      return {
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
        fiber: data.fiber || 0,
        sugar: data.sugar || 0,
        vitamins: data.vitamins || {},
        minerals: data.minerals || {},
      } as EnhancedNutritionData
    }

    // Default fallback
    return {
      calories: data.calories || 0,
      macronutrients: {
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
      },
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show sign-in prompt for unauthenticated users
  if (!isAuthenticated) {
    return <SignInPrompt currentPath={pathname} />
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show empty state
  if (recipes.length === 0) {
    return (
      <motion.div
        className="max-w-3xl mx-auto text-center py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6">My Recipes</h1>
        <p className="text-muted-foreground mb-8">You haven't saved any recipes yet.</p>
        <Link href="/generate">
          <Button className="group">
            <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            Generate Your First Recipe
          </Button>
        </Link>
      </motion.div>
    )
  }

  // Show recipes list
  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">My Recipes</h1>
        <Link href="/generate">
          <Button size="sm" className="group">
            <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            New Recipe
          </Button>
        </Link>
      </motion.div>

      <div className="grid gap-6">
        <AnimatePresence>
          {recipes.map((recipe, index) => {
            // Normalize the nutrition data for display
            const normalizedNutritionData = normalizeNutritionData(recipe.nutrition_data)
            console.log(`Recipe ${recipe.id} normalized nutrition data:`, normalizedNutritionData)

            return (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <RecipeCard
                  id={recipe.id}
                  title={recipe.title}
                  calories={recipe.calories}
                  cooking_time={recipe.cooking_time}
                  ingredients={recipe.ingredients}
                  instructions={recipe.instructions}
                  created_at={recipe.created_at}
                  onDelete={() => deleteRecipe(recipe.id)}
                  isDeleting={deleting === recipe.id}
                  markdown={recipe.markdown}
                  nutritionData={convertToNutritionData(recipe.nutrition_data)}
                  enhancedNutritionData={normalizedNutritionData}
                  mealType={recipe.meal_type} // Use the meal_type from the database
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
