"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronDown, ChevronUp, Loader2, AlertTriangle, Info } from "lucide-react"

// Define the nutrition data structure that we expect from the API
export type NutritionApiData = {
  calories: number
  macronutrients?: {
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    saturatedFat?: number
    unsaturatedFat?: number
    cholesterol?: number
    sodium?: number
  }
  vitamins?: Record<string, number>
  minerals?: Record<string, number>
  dailyValues?: Record<string, number>
  servingSize?: string
  servings?: number
}

interface NutritionDisplayProps {
  nutritionData: NutritionApiData | null
  isLoading?: boolean
  error?: string | null
  validationWarning?: string | null
}

export default function NutritionDisplay({
  nutritionData,
  isLoading = false,
  error = null,
  validationWarning = null,
}: NutritionDisplayProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState("macros")
  const [dataPresent, setDataPresent] = useState(false)

  // Check if we have valid nutrition data
  useEffect(() => {
    console.log("NutritionDisplay received data:", nutritionData ? "present" : "null/undefined")
    if (nutritionData && typeof nutritionData === "object" && "calories" in nutritionData) {
      console.log("Valid nutrition data detected, setting dataPresent to true")
      setDataPresent(true)
    } else {
      console.log("No valid nutrition data, setting dataPresent to false")
      setDataPresent(false)
    }
  }, [nutritionData])

  // Early return if no data and not loading
  if (!dataPresent && !isLoading && !error) {
    return (
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Nutritional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            <Info className="h-5 w-5 mx-auto mb-2" />
            <p className="text-sm">No nutritional information available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Extract macronutrient data safely with fallbacks
  const calories = nutritionData?.calories || 0
  const protein = nutritionData?.macronutrients?.protein || 0
  const carbs = nutritionData?.macronutrients?.carbs || 0
  const fat = nutritionData?.macronutrients?.fat || 0
  const fiber = nutritionData?.macronutrients?.fiber || 0
  const sugar = nutritionData?.macronutrients?.sugar || 0
  const saturatedFat = nutritionData?.macronutrients?.saturatedFat
  const cholesterol = nutritionData?.macronutrients?.cholesterol
  const sodium = nutritionData?.macronutrients?.sodium

  // Calculate macronutrient percentages
  const totalMacros = protein + carbs + fat
  const proteinPercentage = totalMacros > 0 ? Math.round((protein / totalMacros) * 100) : 33
  const carbsPercentage = totalMacros > 0 ? Math.round((carbs / totalMacros) * 100) : 34
  const fatPercentage = totalMacros > 0 ? Math.round((fat / totalMacros) * 100) : 33

  // Process micronutrient data
  const vitamins = nutritionData?.vitamins || {}
  const minerals = nutritionData?.minerals || {}

  // Sort vitamins and minerals by value (highest first)
  const sortedVitamins = Object.entries(vitamins)
    .sort(([, valueA], [, valueB]) => Number(valueB) - Number(valueA))
    .map(([name, value]) => ({ name, value: Number(value) }))

  const sortedMinerals = Object.entries(minerals)
    .sort(([, valueA], [, valueB]) => Number(valueB) - Number(valueA))
    .map(([name, value]) => ({ name, value: Number(value) }))

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
        ) : isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span>Loading nutritional information...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Calories</span>
              <span className="text-lg font-bold">{calories} kcal</span>
            </div>

            {validationWarning && (
              <div className="flex items-center gap-2 text-amber-500 text-xs p-2 bg-amber-500/10 rounded-md">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{validationWarning}</span>
              </div>
            )}

            {nutritionData?.servingSize && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Serving Size</span>
                <span>
                  {nutritionData.servingSize} ({nutritionData.servings || 1} servings)
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
                  <Tabs defaultValue="macros" value={activeTab} onValueChange={setActiveTab} className="mt-4">
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
                        <Progress value={Math.min(100, protein * 2)} className="h-2" indicatorClassName="bg-blue-500" />

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Carbohydrates ({carbs}g)</span>
                          <span className="text-sm font-medium">{Math.round(carbs / 3)}%</span>
                        </div>
                        <Progress value={Math.min(100, carbs / 3)} className="h-2" indicatorClassName="bg-green-500" />

                        <div className="flex justify-between items-center">
                          <span className="text-sm">Fat ({fat}g)</span>
                          <span className="text-sm font-medium">{Math.round(fat * 1.5)}%</span>
                        </div>
                        <Progress value={Math.min(100, fat * 1.5)} className="h-2" indicatorClassName="bg-red-500" />

                        {fiber > 0 && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Fiber ({fiber}g)</span>
                              <span className="text-sm font-medium">{Math.round(fiber * 4)}%</span>
                            </div>
                            <Progress
                              value={Math.min(100, fiber * 4)}
                              className="h-2"
                              indicatorClassName="bg-purple-500"
                            />
                          </>
                        )}

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
                                      <span className="text-sm">{name.length <= 3 ? `Vitamin ${name}` : name}</span>
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

                  {nutritionData?.dailyValues && Object.keys(nutritionData.dailyValues).length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Daily Values</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {Object.entries(nutritionData.dailyValues).map(([nutrient, value]) => (
                          <div key={nutrient} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{nutrient}</span>
                            <span>{value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-4">
                    * Percent Daily Values are based on a 2,000 calorie diet.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>

      {!expanded && !isLoading && !error && dataPresent && (sortedVitamins.length > 0 || sortedMinerals.length > 0) && (
        <div className="px-6 pb-4">
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">Micronutrient Highlights</h4>
          <div className="flex flex-wrap gap-2">
            {sortedVitamins
              .filter((v) => v.value >= 25)
              .slice(0, 3)
              .map(({ name, value }) => (
                <Badge key={`vit-${name}`} variant="outline" className="bg-blue-500/10 border-blue-500/30">
                  {name.length <= 3 ? `Vit. ${name}` : name} {value}%
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
