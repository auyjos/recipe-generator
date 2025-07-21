"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MacroInputProps {
    readonly protein: number
    readonly carbs: number
    readonly fat: number
    readonly onProteinChange: (value: number) => void
    readonly onCarbsChange: (value: number) => void
    readonly onFatChange: (value: number) => void
    readonly className?: string
}

export function MacroInput({
    protein,
    carbs,
    fat,
    onProteinChange,
    onCarbsChange,
    onFatChange,
    className,
}: MacroInputProps) {
    const [errors, setErrors] = useState<{
        protein?: string
        carbs?: string
        fat?: string
    }>({})

    const totalCalories = protein * 4 + carbs * 4 + fat * 9

    const validateMacro = (value: number, type: "protein" | "carbs" | "fat") => {
        if (value < 5) {
            return `Minimum 5g required for ${type}`
        }
        if (value > 200) {
            return `Maximum 200g allowed for ${type}`
        }
        return null
    }

    const handleProteinChange = (value: string) => {
        const numValue = Number(value) || 0
        onProteinChange(numValue)
        const error = validateMacro(numValue, "protein")
        setErrors(prev => ({ ...prev, protein: error || undefined }))
    }

    const handleCarbsChange = (value: string) => {
        const numValue = Number(value) || 0
        onCarbsChange(numValue)
        const error = validateMacro(numValue, "carbs")
        setErrors(prev => ({ ...prev, carbs: error || undefined }))
    }

    const handleFatChange = (value: string) => {
        const numValue = Number(value) || 0
        onFatChange(numValue)
        const error = validateMacro(numValue, "fat")
        setErrors(prev => ({ ...prev, fat: error || undefined }))
    }

    const getCalorieColor = () => {
        if (totalCalories < 100) return "text-red-500"
        if (totalCalories > 2000) return "text-red-500"
        if (totalCalories < 300) return "text-orange-500"
        if (totalCalories > 1500) return "text-orange-500"
        return "text-green-600"
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Macro Targets</CardTitle>
                <CardDescription>
                    Set your precise macro targets for protein, carbs, and fat
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    {/* Protein Input */}
                    <div className="space-y-2">
                        <Label htmlFor="protein">Protein (g)</Label>
                        <Input
                            id="protein"
                            type="number"
                            min="5"
                            max="200"
                            value={protein || ""}
                            onChange={(e) => handleProteinChange(e.target.value)}
                            className={errors.protein ? "border-red-500" : ""}
                        />
                        {errors.protein && (
                            <p className="text-xs text-red-500">{errors.protein}</p>
                        )}
                        <div className="text-xs text-muted-foreground">
                            {protein * 4} kcal
                        </div>
                    </div>

                    {/* Carbs Input */}
                    <div className="space-y-2">
                        <Label htmlFor="carbs">Carbs (g)</Label>
                        <Input
                            id="carbs"
                            type="number"
                            min="5"
                            max="200"
                            value={carbs || ""}
                            onChange={(e) => handleCarbsChange(e.target.value)}
                            className={errors.carbs ? "border-red-500" : ""}
                        />
                        {errors.carbs && (
                            <p className="text-xs text-red-500">{errors.carbs}</p>
                        )}
                        <div className="text-xs text-muted-foreground">
                            {carbs * 4} kcal
                        </div>
                    </div>

                    {/* Fat Input */}
                    <div className="space-y-2">
                        <Label htmlFor="fat">Fat (g)</Label>
                        <Input
                            id="fat"
                            type="number"
                            min="5"
                            max="200"
                            value={fat || ""}
                            onChange={(e) => handleFatChange(e.target.value)}
                            className={errors.fat ? "border-red-500" : ""}
                        />
                        {errors.fat && (
                            <p className="text-xs text-red-500">{errors.fat}</p>
                        )}
                        <div className="text-xs text-muted-foreground">
                            {fat * 9} kcal
                        </div>
                    </div>
                </div>

                {/* Total Calories Display */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">Total Calories:</span>
                    <Badge variant="outline" className={getCalorieColor()}>
                        {totalCalories} kcal
                    </Badge>
                </div>

                {/* Macro Distribution */}
                <div className="space-y-2">
                    <Label className="text-sm">Macro Distribution</Label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                            <div className="font-medium">Protein</div>
                            <div className="text-muted-foreground">
                                {totalCalories > 0 ? Math.round((protein * 4 / totalCalories) * 100) : 0}%
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="font-medium">Carbs</div>
                            <div className="text-muted-foreground">
                                {totalCalories > 0 ? Math.round((carbs * 4 / totalCalories) * 100) : 0}%
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="font-medium">Fat</div>
                            <div className="text-muted-foreground">
                                {totalCalories > 0 ? Math.round((fat * 9 / totalCalories) * 100) : 0}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="space-y-2">
                    <Label className="text-sm">Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            className="text-xs p-2 border rounded hover:bg-accent transition-colors"
                            onClick={() => {
                                onProteinChange(40)
                                onCarbsChange(40)
                                onFatChange(20)
                            }}
                        >
                            Balanced (500 cal)
                        </button>
                        <button
                            type="button"
                            className="text-xs p-2 border rounded hover:bg-accent transition-colors"
                            onClick={() => {
                                onProteinChange(40)
                                onCarbsChange(30)
                                onFatChange(15)
                            }}
                        >
                            High Protein (415 cal)
                        </button>
                        <button
                            type="button"
                            className="text-xs p-2 border rounded hover:bg-accent transition-colors"
                            onClick={() => {
                                onProteinChange(25)
                                onCarbsChange(15)
                                onFatChange(25)
                            }}
                        >
                            Low Carb (385 cal)
                        </button>
                        <button
                            type="button"
                            className="text-xs p-2 border rounded hover:bg-accent transition-colors"
                            onClick={() => {
                                onProteinChange(35)
                                onCarbsChange(60)
                                onFatChange(10)
                            }}
                        >
                            High Carb (470 cal)
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
