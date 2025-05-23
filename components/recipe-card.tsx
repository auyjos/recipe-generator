"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Flame, Save, Trash2 } from "lucide-react"
import UnitToggle from "./unit-toggle"
import { convertIngredients } from "@/utils/unit-conversion"
import LoginPrompt from "./login-prompt"
import NutritionDisplay, { type NutritionApiData } from "./nutrition-display"

export type RecipeProps = {
  id?: string
  title: string
  calories: number
  cooking_time: string
  ingredients: string[]
  instructions: string[]
  created_at?: string
  onSave?: () => void
  onDelete?: () => void
  isSaving?: boolean
  isDeleting?: boolean
  nutritionData?: NutritionApiData | null
  isAuthenticated?: boolean
  currentPath?: string
  markdown?: string
  isNutritionLoading?: boolean
  nutritionError?: string | null
  mealType?: string
  validationWarning?: string | null
  passIngredientsToNutrition?: boolean
  className?: string
}

export default function RecipeCard({
  id,
  title,
  calories,
  cooking_time,
  ingredients,
  instructions,
  created_at,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  nutritionData,
  isAuthenticated = true,
  currentPath = "/generate",
  markdown,
  isNutritionLoading = false,
  nutritionError = null,
  mealType = "Snack",
  validationWarning = null,
  passIngredientsToNutrition = false,
  className = "",
}: RecipeProps) {
  const [currentUnits, setCurrentUnits] = useState<"metric" | "imperial">("metric")
  const [displayedIngredients, setDisplayedIngredients] = useState(ingredients)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // Add debug logging to help track when nutrition data is received:

  // Add this near the top of the component, after the useState declarations
  useEffect(() => {
    if (nutritionData) {
      console.log(
        "RecipeCard received nutrition data:",
        nutritionData.calories ? `${nutritionData.calories} calories` : "no calories",
      )
    }
  }, [nutritionData])

  // Handle unit conversion for ingredients
  const handleUnitToggle = (system: "metric" | "imperial") => {
    setCurrentUnits(system)
    setDisplayedIngredients(convertIngredients(ingredients, system))
  }

  // Handle save button click with authentication check
  const handleSaveClick = () => {
    if (isAuthenticated) {
      onSave && onSave()
    } else {
      setShowLoginPrompt(true)
    }
  }

  return (
    <>
      <motion.div layout className={`recipe-card border-2 ${className}`}>
        <div className="p-6">
          {/* Recipe Header */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-primary">{title}</h2>
            <div className="flex items-center gap-2">
              {onSave && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  aria-label={isAuthenticated ? "Save recipe" : "Sign in to save recipe"}
                  className="relative group text-foreground hover:text-primary"
                >
                  <Save className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  disabled={isDeleting}
                  aria-label="Delete recipe"
                  className="text-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Recipe Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
              <Flame className="h-3 w-3 text-primary" />
              {calories} calories
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
              <Clock className="h-3 w-3 text-primary" />
              {cooking_time}
            </Badge>
            {mealType && (
              <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                {mealType}
              </Badge>
            )}
          </div>

          {/* Ingredients Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-primary">Ingredients</h3>
              <UnitToggle onToggle={handleUnitToggle} defaultSystem="metric" />
            </div>

            <ul className="space-y-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentUnits}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {displayedIngredients.map((ingredient, index) => {
                    // Check if ingredient has quantity in grams
                    const hasGramMatch = /(\d+\.?\d*)\s?g\b/i.test(ingredient)

                    return (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start"
                      >
                        <span className="ingredient-dot"></span>
                        <span className={hasGramMatch ? "font-medium" : ""}>{ingredient}</span>
                      </motion.li>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            </ul>
          </div>

          {/* Instructions Section */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-primary mb-4">Instructions</h3>
            <ol className="space-y-3">
              {instructions.map((instruction, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start"
                >
                  <span className="instruction-number">{index + 1}</span>
                  <span>{instruction}</span>
                </motion.li>
              ))}
            </ol>
          </div>

          {/* Nutritional Information Section */}
          <div className="border-t border-border pt-4">
            <NutritionDisplay
              nutritionData={nutritionData}
              isLoading={isNutritionLoading}
              error={nutritionError}
              validationWarning={validationWarning}
            />
          </div>
        </div>
      </motion.div>

      <LoginPrompt isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} redirectPath={currentPath} />
    </>
  )
}
