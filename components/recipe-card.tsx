"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Clock, Flame, Save, Trash2, FileText } from "lucide-react"
import UnitToggle from "./unit-toggle"
import NutritionalInfo, { type NutritionData } from "./nutritional-info"
import { convertIngredients } from "@/utils/unit-conversion"
import LoginPrompt from "./login-prompt"
import MarkdownRenderer from "./markdown-renderer"

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
  isAuthenticated?: boolean
  currentPath?: string
  markdown?: string
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
}: RecipeProps) {
  const [currentUnits, setCurrentUnits] = useState<"metric" | "imperial">("metric")
  const [displayedIngredients, setDisplayedIngredients] = useState(ingredients)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [viewMode, setViewMode] = useState<"standard" | "markdown">(markdown ? "standard" : "standard")

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

  // Default nutrition data if not provided
  const defaultNutrition: NutritionData = nutritionData || {
    calories,
    protein: Math.round((calories * 0.2) / 4), // 20% of calories from protein
    carbs: Math.round((calories * 0.5) / 4), // 50% of calories from carbs
    fat: Math.round((calories * 0.3) / 9), // 30% of calories from fat
    fiber: Math.round((calories * 0.05) / 2), // Estimated fiber
    sugar: Math.round((calories * 0.1) / 4), // Estimated sugar
    vitamins: {
      "Vitamin A": 15,
      "Vitamin C": 25,
      "Vitamin D": 10,
      "Vitamin E": 8,
    },
    minerals: {
      Calcium: 12,
      Iron: 18,
      Potassium: 10,
      Magnesium: 15,
    },
  }

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
                {markdown && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode(viewMode === "standard" ? "markdown" : "standard")}
                    aria-label={viewMode === "standard" ? "View markdown" : "View standard"}
                    className="relative"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
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

          {viewMode === "markdown" && markdown ? (
            <CardContent>
              <MarkdownRenderer markdown={markdown} />
            </CardContent>
          ) : (
            <>
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
                <NutritionalInfo data={defaultNutrition} />
              </CardContent>
            </>
          )}

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
