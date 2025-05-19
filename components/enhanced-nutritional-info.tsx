"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info, ChevronDown, ChevronUp, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { extractIngredientsWithQuantities, validateNutritionalData } from "@/utils/ingredient-parser"

export type EnhancedNutritionData = {
  calories: number
  macronutrients?: {
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
    saturatedFat?: number
    unsaturatedFat?: number
    cholesterol?: number
    sodium?: number
  }
  vitamins?: {
    [key: string]: number
  }
  minerals?: {
    [key: string]: number
  }
  dailyValues?: {
    [key: string]: number
  }
  servingSize?: string
  servings?: number
  // For backward compatibility with older saved recipes
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  sugar?: number
}

interface EnhancedNutritionalInfoProps {
  data: EnhancedNutritionData
  ingredients?: string[]
  isLoading?: boolean
  error?: string | null
}

export default function EnhancedNutritionalInfo({
  data,
  ingredients = [],
  isLoading = false,
  error = null,
}: EnhancedNutritionalInfoProps) {
  const [expanded, setExpanded] = useState(false)
  const [validationWarning, setValidationWarning] = useState<string | null>(null)

  // Handle both new format (with macronutrients object) and old format (with direct properties)
  const protein = data.macronutrients?.protein ?? data.protein ?? 0
  const carbs = data.macronutrients?.carbs ?? data.carbs ?? 0
  const fat = data.macronutrients?.fat ?? data.fat ?? 0
  const fiber = data.macronutrients?.fiber ?? data.fiber ?? 0
  const sugar = data.macronutrients?.sugar ?? data.sugar ?? 0

  // Calculate macronutrient percentages
  const totalMacros = protein + carbs + fat
  const proteinPercentage = totalMacros > 0 ? Math.round((protein / totalMacros) * 100) : 33
  const carbsPercentage = totalMacros > 0 ? Math.round((carbs / totalMacros) * 100) : 34
  const fatPercentage = totalMacros > 0 ? Math.round((fat / totalMacros) * 100) : 33

  // Sort vitamins and minerals by value (highest first)
  const sortedVitamins = data.vitamins
    ? Object.entries(data.vitamins)
        .sort(([, valueA], [, valueB]) => valueB - valueA)
        .map(([name, value]) => ({ name, value }))
    : []

  const sortedMinerals = data.minerals
    ? Object.entries(data.minerals)
        .sort(([, valueA], [, valueB]) => valueB - valueA)
        .map(([name, value]) => ({ name, value }))
    : []

  // Group micronutrients for better display (3 per row)
  const vitaminGroups = sortedVitamins.reduce(
    (acc, item, index) => {
      const groupIndex = Math.floor(index / 3)
      if (!acc[groupIndex]) acc[groupIndex] = []
      acc[groupIndex].push(item)
      return acc
    },
    [] as Array<Array<{ name: string; value: number }>>,
  )

  const mineralGroups = sortedMinerals.reduce(
    (acc, item, index) => {
      const groupIndex = Math.floor(index / 3)
      if (!acc[groupIndex]) acc[groupIndex] = []
      acc[groupIndex].push(item)
      return acc
    },
    [] as Array<Array<{ name: string; value: number }>>,
  )

  // Validate nutritional data against ingredients
  useEffect(() => {
    if (ingredients.length > 0 && data.calories > 0) {
      const ingredientsWithQuantities = extractIngredientsWithQuantities(ingredients)

      if (ingredientsWithQuantities.length > 0) {
        const isValid = validateNutritionalData(ingredientsWithQuantities, data.calories, protein, carbs, fat)

        if (!isValid) {
          setValidationWarning("The nutritional information may not accurately reflect the ingredient quantities.")
        } else {
          setValidationWarning(null)
        }
      }
    }
  }, [ingredients, data.calories, protein, carbs, fat])

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>Nutritional Information</span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse nutritional details" : "Expand nutritional details"}
            className="h-8 w-8 p-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-destructive text-sm py-2">{error}</div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Calories</span>
              <span className="text-lg font-bold">{data.calories} kcal</span>
            </div>

            {validationWarning && (
              <div className="flex items-center gap-2 text-amber-500 text-xs p-2 bg-amber-500/10 rounded-md">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{validationWarning}</span>
              </div>
            )}

            {data.servingSize && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Serving Size</span>
                <span>
                  {data.servingSize} ({data.servings || 1} servings)
                </span>
              </div>
            )}

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <Tabs defaultValue="macros">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="macros">Macronutrients</TabsTrigger>
                      <TabsTrigger value="vitamins">Vitamins</TabsTrigger>
                      <TabsTrigger value="minerals">Minerals</TabsTrigger>
                    </TabsList>

                    <TabsContent value="macros" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Protein</span>
                          <span>
                            {protein}g ({proteinPercentage}%)
                          </span>
                        </div>
                        <Progress value={proteinPercentage} className="h-2" indicatorClassName="bg-blue-500" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Carbohydrates</span>
                          <span>
                            {carbs}g ({carbsPercentage}%)
                          </span>
                        </div>
                        <Progress value={carbsPercentage} className="h-2" indicatorClassName="bg-green-500" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Fat</span>
                          <span>
                            {fat}g ({fatPercentage}%)
                          </span>
                        </div>
                        <Progress value={fatPercentage} className="h-2" indicatorClassName="bg-yellow-500" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Fiber: </span>
                          <span className="font-medium">{fiber}g</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Sugar: </span>
                          <span className="font-medium">{sugar}g</span>
                        </div>
                        {data.macronutrients?.saturatedFat !== undefined && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Saturated Fat: </span>
                            <span className="font-medium">{data.macronutrients.saturatedFat}g</span>
                          </div>
                        )}
                        {data.macronutrients?.cholesterol !== undefined && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Cholesterol: </span>
                            <span className="font-medium">{data.macronutrients.cholesterol}mg</span>
                          </div>
                        )}
                        {data.macronutrients?.sodium !== undefined && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Sodium: </span>
                            <span className="font-medium">{data.macronutrients.sodium}mg</span>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="vitamins" className="pt-4">
                      {sortedVitamins.length > 0 ? (
                        <div className="space-y-4">
                          {vitaminGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="grid grid-cols-3 gap-2">
                              {group.map(({ name, value }) => (
                                <TooltipProvider key={name}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex flex-col items-center">
                                        <div className="relative w-full h-1 bg-muted mb-2 rounded-full overflow-hidden">
                                          <div
                                            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                                            style={{ width: `${Math.min(100, value)}%` }}
                                          />
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className={`mb-1 px-2 py-1 ${value >= 25 ? "border-blue-500 bg-blue-500/10" : ""}`}
                                        >
                                          {value}%
                                        </Badge>
                                        <span className="text-xs text-center">
                                          {name.length > 3 ? `Vit. ${name}` : `Vitamin ${name}`}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        {value}% of daily recommended{" "}
                                        {name.length > 3 ? `Vitamin ${name}` : `Vitamin ${name}`}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                            </div>
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

                    <TabsContent value="minerals" className="pt-4">
                      {sortedMinerals.length > 0 ? (
                        <div className="space-y-4">
                          {mineralGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="grid grid-cols-3 gap-2">
                              {group.map(({ name, value }) => (
                                <TooltipProvider key={name}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex flex-col items-center">
                                        <div className="relative w-full h-1 bg-muted mb-2 rounded-full overflow-hidden">
                                          <div
                                            className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                                            style={{ width: `${Math.min(100, value)}%` }}
                                          />
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className={`mb-1 px-2 py-1 ${value >= 25 ? "border-green-500 bg-green-500/10" : ""}`}
                                        >
                                          {value}%
                                        </Badge>
                                        <span className="text-xs text-center">{name}</span>
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
                            </div>
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

                  {data.dailyValues && Object.keys(data.dailyValues).length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Daily Values</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {Object.entries(data.dailyValues).map(([nutrient, value]) => (
                          <div key={nutrient} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{nutrient}</span>
                            <span>{value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      {!expanded && (sortedVitamins.length > 0 || sortedMinerals.length > 0) && (
        <div className="px-6 pb-4">
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">Micronutrient Highlights</h4>
          <div className="flex flex-wrap gap-2">
            {sortedVitamins
              .filter((v) => v.value >= 25)
              .slice(0, 3)
              .map(({ name, value }) => (
                <Badge key={`vit-${name}`} variant="outline" className="bg-blue-500/10 border-blue-500/30">
                  Vit. {name} {value}%
                </Badge>
              ))}
            {sortedMinerals
              .filter((m) => m.value >= 20)
              .slice(0, 3)
              .map(({ name, value }) => (
                <Badge key={`min-${name}`} variant="outline" className="bg-green-500/10 border-green-500/30">
                  {name} {value}%
                </Badge>
              ))}
          </div>
        </div>
      )}
    </Card>
  )
}
