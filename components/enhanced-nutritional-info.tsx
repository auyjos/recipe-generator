"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type EnhancedNutritionData = {
  calories: number
  macronutrients: {
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
}

interface EnhancedNutritionalInfoProps {
  data: EnhancedNutritionData
  isLoading?: boolean
  error?: string | null
}

export default function EnhancedNutritionalInfo({
  data,
  isLoading = false,
  error = null,
}: EnhancedNutritionalInfoProps) {
  const [expanded, setExpanded] = useState(false)

  // Calculate macronutrient percentages
  const { protein, carbs, fat } = data.macronutrients
  const totalMacros = protein + carbs + fat
  const proteinPercentage = Math.round((protein / totalMacros) * 100)
  const carbsPercentage = Math.round((carbs / totalMacros) * 100)
  const fatPercentage = Math.round((fat / totalMacros) * 100)

  // Group micronutrients for better display
  const vitaminGroups = data.vitamins
    ? Object.entries(data.vitamins).reduce(
        (acc, [key, value], index) => {
          const groupIndex = Math.floor(index / 3)
          if (!acc[groupIndex]) acc[groupIndex] = []
          acc[groupIndex].push({ name: key, value })
          return acc
        },
        [] as Array<Array<{ name: string; value: number }>>,
      )
    : []

  const mineralGroups = data.minerals
    ? Object.entries(data.minerals).reduce(
        (acc, [key, value], index) => {
          const groupIndex = Math.floor(index / 3)
          if (!acc[groupIndex]) acc[groupIndex] = []
          acc[groupIndex].push({ name: key, value })
          return acc
        },
        [] as Array<Array<{ name: string; value: number }>>,
      )
    : []

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
                          <span className="font-medium">{data.macronutrients.fiber}g</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Sugar: </span>
                          <span className="font-medium">{data.macronutrients.sugar}g</span>
                        </div>
                        {data.macronutrients.saturatedFat !== undefined && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Saturated Fat: </span>
                            <span className="font-medium">{data.macronutrients.saturatedFat}g</span>
                          </div>
                        )}
                        {data.macronutrients.cholesterol !== undefined && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Cholesterol: </span>
                            <span className="font-medium">{data.macronutrients.cholesterol}mg</span>
                          </div>
                        )}
                        {data.macronutrients.sodium !== undefined && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Sodium: </span>
                            <span className="font-medium">{data.macronutrients.sodium}mg</span>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="vitamins" className="pt-4">
                      {data.vitamins && Object.keys(data.vitamins).length > 0 ? (
                        <div className="space-y-4">
                          {vitaminGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="grid grid-cols-3 gap-2">
                              {group.map(({ name, value }) => (
                                <div key={name} className="flex flex-col items-center">
                                  <Badge variant="outline" className="mb-1 px-2 py-1">
                                    {value}%
                                  </Badge>
                                  <span className="text-xs text-center">{name}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          <Info className="h-5 w-5 mx-auto mb-2" />
                          <p className="text-sm">Vitamin information not available</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="minerals" className="pt-4">
                      {data.minerals && Object.keys(data.minerals).length > 0 ? (
                        <div className="space-y-4">
                          {mineralGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="grid grid-cols-3 gap-2">
                              {group.map(({ name, value }) => (
                                <div key={name} className="flex flex-col items-center">
                                  <Badge variant="outline" className="mb-1 px-2 py-1">
                                    {value}%
                                  </Badge>
                                  <span className="text-xs text-center">{name}</span>
                                </div>
                              ))}
                            </div>
                          ))}
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
    </Card>
  )
}
