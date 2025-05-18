"use client"

import type React from "react"

import { Coffee, UtensilsCrossed, Soup, Cookie } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export type MealType = "breakfast" | "lunch" | "dinner" | "snack"

interface MealTypeSelectorProps {
  selectedMealType: MealType
  onSelect: (mealType: MealType) => void
}

interface MealTypeOption {
  value: MealType
  label: string
  icon: React.ReactNode
  description: string
}

const mealTypeOptions: MealTypeOption[] = [
  {
    value: "breakfast",
    label: "Breakfast",
    icon: <Coffee className="h-5 w-5" />,
    description: "Morning meals to start your day",
  },
  {
    value: "lunch",
    label: "Lunch",
    icon: <UtensilsCrossed className="h-5 w-5" />,
    description: "Midday meals to keep you going",
  },
  {
    value: "dinner",
    label: "Dinner",
    icon: <Soup className="h-5 w-5" />,
    description: "Evening meals to end your day",
  },
  {
    value: "snack",
    label: "Snack",
    icon: <Cookie className="h-5 w-5" />,
    description: "Light bites between meals",
  },
]

export default function MealTypeSelector({ selectedMealType, onSelect }: MealTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base">Meal Type</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {mealTypeOptions.map((option) => (
          <div key={option.value} className="relative">
            <input
              type="radio"
              name="meal-type"
              id={`meal-type-${option.value}`}
              className="peer sr-only"
              checked={selectedMealType === option.value}
              onChange={() => onSelect(option.value)}
            />
            <label
              htmlFor={`meal-type-${option.value}`}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer",
                "transition-all duration-200 hover:border-primary/50",
                "peer-checked:border-primary peer-checked:bg-primary/5",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
              )}
            >
              <div className="mb-2">{option.icon}</div>
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-muted-foreground text-center mt-1">{option.description}</div>

              {selectedMealType === option.value && (
                <motion.div
                  layoutId="meal-type-check"
                  className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
