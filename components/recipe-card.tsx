"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Clock, Flame, Save, Trash2 } from "lucide-react"
import UnitToggle from "./unit-toggle"
import type { NutritionData } from "./nutritional-info"
import EnhancedNutritionalInfo, { type EnhancedNutritionData } from "./enhanced-nutritional-info"
import { convertIngredients } from "@/utils/unit-conversion"
import LoginPrompt from "./login-prompt"
import { createDefaultNutrition } from "@/utils/nutrition-helpers"

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
  nutritionData?: NutritionData
  enhancedNutritionData?: EnhancedNutritionData
  isAuthenticated?: boolean
  currentPath?: string
  markdown?: string
  isNutritionLoading?: boolean
  nutritionError?: string | null
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
}: RecipeProps) {
  const [currentUnits, setCurrentUnits] = useState<"metric" | "imperial">("metric")
  const [displayedIngredients, setDisplayedIngredients] = useState(ingredients)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleUnitToggle = (system: "metric" | "imperial") => {
    setCurrentUnits(system)
    setDisplayedIngredients(convertIngredients(ingredients, system))
  }

  const handleSaveClick = () => {
    if (isAuthenticated) {
      onSave && onSave()
    } else {
      setShowLoginPrompt(true)
    }
  }

  // Use provided nutrition data or create default based on calories
  const displayNutritionData = nutritionData || createDefaultNutrition(calories)

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl md:text-2xl">{title}</CardTitle>
                <CardDescription className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    {calories} kcal
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {cooking_time}
                  </Badge>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {onSave && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSaveClick}
                    disabled={isSaving}
                    aria-label={isAuthenticated ? "Save recipe" : "Sign in to save recipe"}
                    className="relative group"
                  >
                    {isAuthenticated ? (
                      <Save className="h-4 w-4" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span className="absolute -bottom-8 right-0 bg-foreground text-background text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Sign in to save
                        </span>
                      </>
                    )}
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    disabled={isDeleting}
                    aria-label="Delete recipe"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-sm">Recipe Details</h3>
              <UnitToggle onToggle={handleUnitToggle} />
            </div>

            <Tabs defaultValue="ingredients" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
              </TabsList>

              <TabsContent value="ingredients" className="space-y-4">
                <ul className="list-disc pl-5 space-y-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentUnits}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {displayedIngredients.map((ingredient, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="leading-relaxed"
                        >
                          {ingredient}
                        </motion.li>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </ul>
              </TabsContent>

              <TabsContent value="instructions" className="space-y-4">
                <ol className="list-decimal pl-5 space-y-3">
                  {instructions.map((instruction, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="leading-relaxed"
                    >
                      {instruction}
                    </motion.li>
                  ))}
                </ol>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardContent className="pt-2">
            {enhancedNutritionData ? (
              <EnhancedNutritionalInfo
                data={enhancedNutritionData}
                isLoading={isNutritionLoading}
                error={nutritionError}
              />
            ) : (
              nutritionData && (
                <div className="text-sm text-muted-foreground">
                  <p>Basic nutrition information available</p>
                </div>
              )
            )}
          </CardContent>

          {created_at && (
            <CardFooter className="text-xs text-muted-foreground pt-2">
              Saved on {new Date(created_at).toLocaleDateString()}
            </CardFooter>
          )}
        </Card>
      </motion.div>

      <LoginPrompt isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} redirectPath={currentPath} />
    </>
  )
}
