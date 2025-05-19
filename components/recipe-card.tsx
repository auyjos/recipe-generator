"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Flame, Save, Trash2, ChevronDown, ChevronUp, AlertTriangle, Info } from "lucide-react"
import UnitToggle from "./unit-toggle"
import { convertIngredients } from "@/utils/unit-conversion"
import LoginPrompt from "./login-prompt"
import { createDefaultNutrition } from "@/utils/nutrition-helpers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { extractIngredientsWithQuantities, validateNutritionalData } from "@/utils/ingredient-parser"

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
  nutritionData?: any
  enhancedNutritionData?: any
  isAuthenticated?: boolean
  currentPath?: string
  markdown?: string
  isNutritionLoading?: boolean
  nutritionError?: string | null
  mealType?: string
  passIngredientsToNutrition?: boolean
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
  enhancedNutritionData,
  isAuthenticated = true,
  currentPath = "/generate",
  markdown,
  isNutritionLoading = false,
  nutritionError = null,
  mealType = "Snack",
  passIngredientsToNutrition = false,
}: RecipeProps) {
  const [currentUnits, setCurrentUnits] = useState<"metric" | "imperial">("metric")
  const [displayedIngredients, setDisplayedIngredients] = useState(ingredients)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showNutrition, setShowNutrition] = useState(false)
  const [activeNutritionTab, setActiveNutritionTab] = useState("macros")
  const [validationWarning, setValidationWarning] = useState<string | null>(null)

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

  // Process nutrition data
  // First, use provided nutrition data or create default based on calories
  const displayNutritionData = nutritionData || createDefaultNutrition(calories)

  // Then, normalize the enhanced data structure
  const enhancedData = enhancedNutritionData || {
    calories,
    macronutrients: {
      protein: displayNutritionData.protein || 0,
      carbs: displayNutritionData.carbs || 0,
      fat: displayNutritionData.fat || 0,
      fiber: displayNutritionData.fiber || 0,
      sugar: displayNutritionData.sugar || 0,
    },
    vitamins: displayNutritionData.vitamins || {},
    minerals: displayNutritionData.minerals || {},
  }

  // Extract macronutrient data
  const protein = enhancedData.macronutrients?.protein || enhancedData.protein || 0
  const carbs = enhancedData.macronutrients?.carbs || enhancedData.carbs || 0
  const fat = enhancedData.macronutrients?.fat || enhancedData.fat || 0
  const fiber = enhancedData.macronutrients?.fiber || enhancedData.fiber || 0
  const sugar = enhancedData.macronutrients?.sugar || enhancedData.sugar || 0
  const saturatedFat = enhancedData.macronutrients?.saturatedFat
  const cholesterol = enhancedData.macronutrients?.cholesterol
  const sodium = enhancedData.macronutrients?.sodium

  // Calculate macronutrient percentages
  const totalMacros = protein + carbs + fat
  const proteinPercentage = totalMacros > 0 ? Math.round((protein / totalMacros) * 100) : 33
  const carbsPercentage = totalMacros > 0 ? Math.round((carbs / totalMacros) * 100) : 34
  const fatPercentage = totalMacros > 0 ? Math.round((fat / totalMacros) * 100) : 33

  // Process micronutrient data
  const vitamins = enhancedData.vitamins || {}
  const minerals = enhancedData.minerals || {}

  // Sort vitamins and minerals by value (highest first)
  const sortedVitamins = Object.entries(vitamins)
    .sort(([, valueA], [, valueB]) => Number(valueB) - Number(valueA))
    .map(([name, value]) => ({ name, value: Number(value) }))

  const sortedMinerals = Object.entries(minerals)
    .sort(([, valueA], [, valueB]) => Number(valueB) - Number(valueA))
    .map(([name, value]) => ({ name, value: Number(value) }))

  // Validate nutritional data against ingredients if needed
  if (passIngredientsToNutrition && ingredients.length > 0 && calories > 0) {
    const ingredientsWithQuantities = extractIngredientsWithQuantities(ingredients)

    if (ingredientsWithQuantities.length > 0) {
      const isValid = validateNutritionalData(ingredientsWithQuantities, calories, protein, carbs, fat)

      if (!isValid && !validationWarning) {
        setValidationWarning("The nutritional information may not accurately reflect the ingredient quantities.")
      } else if (isValid && validationWarning) {
        setValidationWarning(null)
      }
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="recipe-card border-2"
      >
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
            <Button
              variant="ghost"
              className="w-full flex justify-between items-center text-foreground hover:bg-muted"
              onClick={() => setShowNutrition(!showNutrition)}
            >
              <span className="font-semibold">{showNutrition ? "Hide" : "Show"} Nutritional Information</span>
              {showNutrition ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </Button>

            <AnimatePresence>
              {showNutrition && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    {/* Nutrition Header */}
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-semibold text-primary">Nutrition Facts</h4>
                      <div className="text-lg font-bold">{calories} kcal</div>
                    </div>

                    {/* Validation Warning */}
                    {validationWarning && (
                      <div className="flex items-center gap-2 text-amber-500 text-xs p-2 bg-amber-500/10 rounded-md mb-4">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>{validationWarning}</span>
                      </div>
                    )}

                    {/* Loading State */}
                    {isNutritionLoading && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                        <span className="text-sm">Loading nutritional data...</span>
                      </div>
                    )}

                    {/* Error State */}
                    {nutritionError && (
                      <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
                        {nutritionError}
                      </div>
                    )}

                    {/* Nutrition Content */}
                    {!isNutritionLoading && !nutritionError && (
                      <>
                        {/* Macronutrient Visual Breakdown */}
                        <div className="mb-6">
                          <h5 className="text-sm font-medium mb-3">Macronutrient Breakdown</h5>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-full h-20 flex items-end justify-center mb-1">
                                <div
                                  className="w-8 bg-blue-500 rounded-t-md"
                                  style={{ height: `${Math.min(100, proteinPercentage)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-blue-400">Protein: {protein}g</span>
                              <span className="text-xs text-muted-foreground">({proteinPercentage}%)</span>
                            </div>

                            <div className="flex flex-col items-center">
                              <div className="w-full h-20 flex items-end justify-center mb-1">
                                <div
                                  className="w-8 bg-green-500 rounded-t-md"
                                  style={{ height: `${Math.min(100, carbsPercentage)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-green-400">Carbs: {carbs}g</span>
                              <span className="text-xs text-muted-foreground">({carbsPercentage}%)</span>
                            </div>

                            <div className="flex flex-col items-center">
                              <div className="w-full h-20 flex items-end justify-center mb-1">
                                <div
                                  className="w-8 bg-red-500 rounded-t-md"
                                  style={{ height: `${Math.min(100, fatPercentage)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-red-400">Fat: {fat}g</span>
                              <span className="text-xs text-muted-foreground">({fatPercentage}%)</span>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Nutritional Information Tabs */}
                        <Tabs
                          defaultValue="macros"
                          value={activeNutritionTab}
                          onValueChange={setActiveNutritionTab}
                          className="mt-4"
                        >
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="macros">Macronutrients</TabsTrigger>
                            <TabsTrigger value="vitamins">Vitamins</TabsTrigger>
                            <TabsTrigger value="minerals">Minerals</TabsTrigger>
                          </TabsList>

                          {/* Macronutrients Tab */}
                          <TabsContent value="macros" className="space-y-4 pt-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Protein ({protein}g)</span>
                                <span className="text-sm font-medium">{Math.round(protein * 2)}%</span>
                              </div>
                              <Progress
                                value={Math.min(100, protein * 2)}
                                className="h-2"
                                indicatorClassName="bg-blue-500"
                              />

                              <div className="flex justify-between items-center">
                                <span className="text-sm">Carbohydrates ({carbs}g)</span>
                                <span className="text-sm font-medium">{Math.round(carbs / 3)}%</span>
                              </div>
                              <Progress
                                value={Math.min(100, carbs / 3)}
                                className="h-2"
                                indicatorClassName="bg-green-500"
                              />

                              <div className="flex justify-between items-center">
                                <span className="text-sm">Fat ({fat}g)</span>
                                <span className="text-sm font-medium">{Math.round(fat * 1.5)}%</span>
                              </div>
                              <Progress
                                value={Math.min(100, fat * 1.5)}
                                className="h-2"
                                indicatorClassName="bg-red-500"
                              />

                              <div className="flex justify-between items-center">
                                <span className="text-sm">Fiber ({fiber}g)</span>
                                <span className="text-sm font-medium">{Math.round(fiber * 4)}%</span>
                              </div>
                              <Progress
                                value={Math.min(100, fiber * 4)}
                                className="h-2"
                                indicatorClassName="bg-purple-500"
                              />

                              {sugar > 0 && (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">Sugar ({sugar}g)</span>
                                    <span className="text-sm font-medium">{Math.round(sugar / 3)}%</span>
                                  </div>
                                  <Progress
                                    value={Math.min(100, sugar / 3)}
                                    className="h-2"
                                    indicatorClassName="bg-pink-500"
                                  />
                                </>
                              )}

                              {/* Additional macronutrients if available */}
                              {saturatedFat !== undefined && (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">Saturated Fat ({saturatedFat}g)</span>
                                    <span className="text-sm font-medium">{Math.round(saturatedFat * 5)}%</span>
                                  </div>
                                  <Progress
                                    value={Math.min(100, saturatedFat * 5)}
                                    className="h-2"
                                    indicatorClassName="bg-orange-500"
                                  />
                                </>
                              )}

                              {cholesterol !== undefined && (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">Cholesterol ({cholesterol}mg)</span>
                                    <span className="text-sm font-medium">{Math.round(cholesterol / 3)}%</span>
                                  </div>
                                  <Progress
                                    value={Math.min(100, cholesterol / 3)}
                                    className="h-2"
                                    indicatorClassName="bg-yellow-500"
                                  />
                                </>
                              )}

                              {sodium !== undefined && (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm">Sodium ({sodium}mg)</span>
                                    <span className="text-sm font-medium">{Math.round(sodium / 23)}%</span>
                                  </div>
                                  <Progress
                                    value={Math.min(100, sodium / 23)}
                                    className="h-2"
                                    indicatorClassName="bg-cyan-500"
                                  />
                                </>
                              )}
                            </div>
                          </TabsContent>

                          {/* Vitamins Tab */}
                          <TabsContent value="vitamins" className="pt-4">
                            {sortedVitamins.length > 0 ? (
                              <div className="space-y-4">
                                {sortedVitamins.map(({ name, value }) => (
                                  <TooltipProvider key={`vitamin-${name}`}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="space-y-1">
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm">
                                              {name.length <= 3 ? `Vitamin ${name}` : name}
                                            </span>
                                            <span className="text-sm font-medium">{value}%</span>
                                          </div>
                                          <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                                              style={{ width: `${Math.min(100, value)}%` }}
                                            />
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">
                                          {value}% of daily recommended {name.length <= 3 ? `Vitamin ${name}` : name}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                                <div className="text-xs text-muted-foreground text-center mt-2">
                                  Percentage of daily recommended intake
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground py-4">
                                <Info className="h-5 w-5 mx-auto mb-2" />
                                <p className="text-sm">Vitamin information not available</p>
                              </div>
                            )}
                          </TabsContent>

                          {/* Minerals Tab */}
                          <TabsContent value="minerals" className="pt-4">
                            {sortedMinerals.length > 0 ? (
                              <div className="space-y-4">
                                {sortedMinerals.map(({ name, value }) => (
                                  <TooltipProvider key={`mineral-${name}`}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="space-y-1">
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm">{name}</span>
                                            <span className="text-sm font-medium">{value}%</span>
                                          </div>
                                          <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                              className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                                              style={{ width: `${Math.min(100, value)}%` }}
                                            />
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">
                                          {value}% of daily recommended {name}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                                <div className="text-xs text-muted-foreground text-center mt-2">
                                  Percentage of daily recommended intake
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground py-4">
                                <Info className="h-5 w-5 mx-auto mb-2" />
                                <p className="text-sm">Mineral information not available</p>
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>

                        {/* Micronutrient Highlights */}
                        {(sortedVitamins.length > 0 || sortedMinerals.length > 0) && (
                          <div className="mt-6 pt-4 border-t border-border">
                            <h5 className="text-sm font-medium mb-3">Micronutrient Highlights</h5>
                            <div className="flex flex-wrap gap-2">
                              {sortedVitamins
                                .filter((v) => v.value >= 25)
                                .slice(0, 3)
                                .map(({ name, value }) => (
                                  <Badge
                                    key={`highlight-vit-${name}`}
                                    variant="outline"
                                    className="bg-blue-500/10 border-blue-500/30"
                                  >
                                    {name.length <= 3 ? `Vit. ${name}` : name} {value}%
                                  </Badge>
                                ))}
                              {sortedMinerals
                                .filter((m) => m.value >= 20)
                                .slice(0, 3)
                                .map(({ name, value }) => (
                                  <Badge
                                    key={`highlight-min-${name}`}
                                    variant="outline"
                                    className="bg-green-500/10 border-green-500/30"
                                  >
                                    {name} {value}%
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-4">
                          * Percent Daily Values are based on a 2,000 calorie diet.
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <LoginPrompt isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} redirectPath={currentPath} />
    </>
  )
}
