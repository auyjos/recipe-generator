"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info } from "lucide-react"

export type NutritionData = {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  vitamins?: {
    [key: string]: number
  }
  minerals?: {
    [key: string]: number
  }
}

interface NutritionalInfoProps {
  data: NutritionData
}

export default function NutritionalInfo({ data }: NutritionalInfoProps) {
  const [expanded, setExpanded] = useState(false)

  // Calculate macronutrient percentages
  const totalMacros = data.protein + data.carbs + data.fat
  const proteinPercentage = Math.round((data.protein / totalMacros) * 100)
  const carbsPercentage = Math.round((data.carbs / totalMacros) * 100)
  const fatPercentage = Math.round((data.fat / totalMacros) * 100)

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center text-lg">
          <span>Nutritional Information</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse nutritional details" : "Expand nutritional details"}
          >
            <Info size={18} />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Calories</span>
            <span className="text-lg font-bold">{data.calories} kcal</span>
          </div>

          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: expanded ? "auto" : 0,
              opacity: expanded ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Tabs defaultValue="macros">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="macros">Macronutrients</TabsTrigger>
                <TabsTrigger value="micros">Micronutrients</TabsTrigger>
              </TabsList>

              <TabsContent value="macros" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Protein</span>
                    <span>
                      {data.protein}g ({proteinPercentage}%)
                    </span>
                  </div>
                  <Progress value={proteinPercentage} className="h-2" indicatorClassName="bg-blue-500" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Carbohydrates</span>
                    <span>
                      {data.carbs}g ({carbsPercentage}%)
                    </span>
                  </div>
                  <Progress value={carbsPercentage} className="h-2" indicatorClassName="bg-green-500" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fat</span>
                    <span>
                      {data.fat}g ({fatPercentage}%)
                    </span>
                  </div>
                  <Progress value={fatPercentage} className="h-2" indicatorClassName="bg-yellow-500" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Fiber: </span>
                    <span className="font-medium">{data.fiber}g</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Sugar: </span>
                    <span className="font-medium">{data.sugar}g</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="micros" className="pt-4">
                <div className="grid grid-cols-2 gap-y-2">
                  {data.vitamins &&
                    Object.entries(data.vitamins).map(([vitamin, value]) => (
                      <div key={vitamin} className="text-sm">
                        <span className="text-muted-foreground">{vitamin}: </span>
                        <span className="font-medium">{value}%</span>
                      </div>
                    ))}

                  {data.minerals &&
                    Object.entries(data.minerals).map(([mineral, value]) => (
                      <div key={mineral} className="text-sm">
                        <span className="text-muted-foreground">{mineral}: </span>
                        <span className="font-medium">{value}%</span>
                      </div>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
