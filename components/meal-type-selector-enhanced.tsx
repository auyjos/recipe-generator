"use client"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export type MealType = "breakfast" | "lunch" | "dinner" | "snack"

interface MealTypeSelectorProps {
  selectedMealType: MealType
  onSelect: (mealType: MealType) => void
}

export default function MealTypeSelector({ selectedMealType, onSelect }: MealTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base">Meal Type</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Breakfast Option */}
        <div className="relative">
          <input
            type="radio"
            name="meal-type"
            id="meal-type-breakfast"
            className="peer sr-only"
            checked={selectedMealType === "breakfast"}
            onChange={() => onSelect("breakfast")}
          />
          <label
            htmlFor="meal-type-breakfast"
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer",
              "transition-all duration-200 hover:border-primary/50",
              "peer-checked:border-primary peer-checked:bg-primary/5",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
            )}
          >
            <div className="mb-2 p-3 rounded-full bg-primary/10 text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Egg */}
                <ellipse cx="12" cy="11" rx="5" ry="6" fill="#FFDD67" />
                <ellipse cx="12" cy="11" rx="2" ry="2.5" fill="white" />
                {/* Toast */}
                <rect x="4" y="14" width="16" height="6" rx="1" fill="#D4A76A" />
                <rect x="6" y="15" width="12" height="4" rx="0.5" fill="#F3D9A4" />
                {/* Plate */}
                <ellipse cx="12" cy="18" rx="10" ry="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="font-medium text-sm">Breakfast</div>
            <div className="text-xs text-muted-foreground text-center mt-1">Morning meals to start your day</div>

            {selectedMealType === "breakfast" && (
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

        {/* Lunch Option */}
        <div className="relative">
          <input
            type="radio"
            name="meal-type"
            id="meal-type-lunch"
            className="peer sr-only"
            checked={selectedMealType === "lunch"}
            onChange={() => onSelect("lunch")}
          />
          <label
            htmlFor="meal-type-lunch"
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer",
              "transition-all duration-200 hover:border-primary/50",
              "peer-checked:border-primary peer-checked:bg-primary/5",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
            )}
          >
            <div className="mb-2 p-3 rounded-full bg-primary/10 text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Sandwich */}
                <path d="M4 8h16v2H4V8z" fill="#F3D9A4" />
                <path d="M4 10h16v2H4v-2z" fill="#8FD28F" />
                <path d="M4 12h16v2H4v-2z" fill="#FF9F7A" />
                <path d="M4 14h16v2H4v-2z" fill="#F3D9A4" />
                {/* Toothpick */}
                <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth="1" />
                {/* Plate */}
                <ellipse cx="12" cy="18" rx="10" ry="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="font-medium text-sm">Lunch</div>
            <div className="text-xs text-muted-foreground text-center mt-1">Midday meals to keep you going</div>

            {selectedMealType === "lunch" && (
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

        {/* Dinner Option */}
        <div className="relative">
          <input
            type="radio"
            name="meal-type"
            id="meal-type-dinner"
            className="peer sr-only"
            checked={selectedMealType === "dinner"}
            onChange={() => onSelect("dinner")}
          />
          <label
            htmlFor="meal-type-dinner"
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer",
              "transition-all duration-200 hover:border-primary/50",
              "peer-checked:border-primary peer-checked:bg-primary/5",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
            )}
          >
            <div className="mb-2 p-3 rounded-full bg-primary/10 text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Plate */}
                <circle cx="12" cy="12" r="8" fill="#F0F0F0" stroke="currentColor" strokeWidth="1.5" />
                {/* Food */}
                <circle cx="12" cy="12" r="4" fill="#FF9F7A" />
                <circle cx="9" cy="10" r="1.5" fill="#8FD28F" />
                <circle cx="15" cy="10" r="1.5" fill="#8FD28F" />
                {/* Fork and knife */}
                <line x1="5" y1="6" x2="5" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <line x1="3" y1="6" x2="7" y2="6" stroke="currentColor" strokeWidth="1.5" />
                <line x1="19" y1="6" x2="19" y2="12" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="font-medium text-sm">Dinner</div>
            <div className="text-xs text-muted-foreground text-center mt-1">Evening meals to end your day</div>

            {selectedMealType === "dinner" && (
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

        {/* Snack Option */}
        <div className="relative">
          <input
            type="radio"
            name="meal-type"
            id="meal-type-snack"
            className="peer sr-only"
            checked={selectedMealType === "snack"}
            onChange={() => onSelect("snack")}
          />
          <label
            htmlFor="meal-type-snack"
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer",
              "transition-all duration-200 hover:border-primary/50",
              "peer-checked:border-primary peer-checked:bg-primary/5",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
            )}
          >
            <div className="mb-2 p-3 rounded-full bg-primary/10 text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Popcorn container */}
                <path d="M6 8h12v10H6V8z" fill="#FF5555" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 12h12" stroke="white" strokeWidth="1" />
                <path d="M6 10h12" stroke="white" strokeWidth="1" />
                {/* Popcorn pieces */}
                <circle cx="9" cy="6" r="1.5" fill="#FFFF99" />
                <circle cx="12" cy="5" r="1.5" fill="#FFFF99" />
                <circle cx="15" cy="6" r="1.5" fill="#FFFF99" />
                <circle cx="8" cy="9" r="1" fill="#FFFF99" />
                <circle cx="12" cy="9" r="1" fill="#FFFF99" />
                <circle cx="16" cy="9" r="1" fill="#FFFF99" />
              </svg>
            </div>
            <div className="font-medium text-sm">Snack</div>
            <div className="text-xs text-muted-foreground text-center mt-1">Light bites between meals</div>

            {selectedMealType === "snack" && (
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
      </div>
    </div>
  )
}
