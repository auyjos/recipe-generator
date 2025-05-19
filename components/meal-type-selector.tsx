"use client"

import type React from "react"
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

// Custom cartoon-style SVG icons
const BreakfastIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 5 -3 10 -12 10" />
    <path d="M19 8c0 5 -3 10 -12 10" />
    <path d="M3 10a2 2 0 0 0 2 2h14a2 2 0 0 0 2 -2v-1a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2z" />
    <path d="M3 7v3" />
    <path d="M21 7v3" />
    <rect x="7" y="2" width="10" height="5" rx="2" />
    <path d="M7 3v4" />
    <path d="M17 3v4" />
  </svg>
)

const LunchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 7h18c0 4.4-3.6 8-8 8h-2c-4.4 0-8-3.6-8-8z" />
    <path d="M7 7v7" />
    <path d="M17 7v7" />
    <path d="M5 22h14" />
    <path d="M5 22v-3c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v3" />
    <path d="M12 2v5" />
    <path d="M10 4h4" />
  </svg>
)

const DinnerIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
    <path d="M7 12h1" />
    <path d="M16 12h1" />
    <path d="M12 7v1" />
    <path d="M12 16v1" />
    <path d="M3 7h3" />
    <path d="M18 7h3" />
    <path d="M3 17h3" />
    <path d="M18 17h3" />
  </svg>
)

const SnackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 12c.3 1.3 0 2.7-1 3.5 1.7 1.3 2 3.5 1 5.5-3 0-4-2-4-2 0-1.7.7-3 2-4 .3-.3 1-1 1-3Z" />
    <path d="M14 12.5c-2.3 1.5-3 5.5-3 5.5 1-3 0-5 0-5 0-4 1-5 2-5s2 1 2 5c0 0 .2 1.2-1 4.5" />
    <path d="M7 16c-1 .4-2 1-2 2 0 1.5 2 3 6 3s6-1.5 6-3c0-1-.7-1.5-1.5-2" />
    <path d="M5 9c-1.5 0-3 1.5-3 3s3 3 3 3" />
    <path d="M19 9c1.5 0 3 1.5 3 3s-3 3-3 3" />
    <path d="M5 9c0-3.5 5.5-4 7-2 1.5-2 7-1.5 7 2-1.5-1.5-3-1.5-4-1-1-0.5-2.5-0.5-4 1-2-1.5-4.5-1-6 0Z" />
  </svg>
)

const mealTypeOptions: MealTypeOption[] = [
  {
    value: "breakfast",
    label: "Breakfast",
    icon: <BreakfastIcon />,
    description: "Morning meals to start your day",
  },
  {
    value: "lunch",
    label: "Lunch",
    icon: <LunchIcon />,
    description: "Midday meals to keep you going",
  },
  {
    value: "dinner",
    label: "Dinner",
    icon: <DinnerIcon />,
    description: "Evening meals to end your day",
  },
  {
    value: "snack",
    label: "Snack",
    icon: <SnackIcon />,
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
              <div className="mb-2 p-3 rounded-full bg-primary/10 text-primary">{option.icon}</div>
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-muted-foreground text-center mt-1">{option.description}</div>

              {selectedMealType === option.value && (
                <motion.div
                  layoutId="meal-type-check"
                  className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary-foreground"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </motion.div>
              )}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
