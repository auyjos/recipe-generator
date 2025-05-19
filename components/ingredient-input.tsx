"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface IngredientInputProps {
  ingredients: string[]
  setIngredients: (ingredients: string[]) => void
  minIngredients?: number
}

export default function IngredientInput({ ingredients, setIngredients, minIngredients = 3 }: IngredientInputProps) {
  const [currentIngredient, setCurrentIngredient] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus the input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const addIngredient = () => {
    setError(null)

    // Trim the ingredient and check if it's empty
    const trimmedIngredient = currentIngredient.trim()
    if (!trimmedIngredient) {
      setError("Please enter an ingredient")
      return
    }

    // Check if the ingredient already exists
    if (ingredients.includes(trimmedIngredient)) {
      setError("This ingredient is already in your list")
      return
    }

    // Add the ingredient
    setIngredients([...ingredients, trimmedIngredient])
    setCurrentIngredient("")

    // Focus the input again
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const removeIngredient = (index: number) => {
    const newIngredients = [...ingredients]
    newIngredients.splice(index, 1)
    setIngredients(newIngredients)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addIngredient()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            ref={inputRef}
            placeholder="Add an ingredient (e.g., chicken, rice, tomatoes)"
            value={currentIngredient}
            onChange={(e) => setCurrentIngredient(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
        </div>
        <Button type="button" onClick={addIngredient} size="icon" variant="outline" className="shrink-0">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add ingredient</span>
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {ingredients.length < minIngredients && (
        <p className="text-xs text-muted-foreground">
          Please add at least {minIngredients} ingredients ({minIngredients - ingredients.length} more needed)
        </p>
      )}

      <div className="flex flex-wrap gap-2 min-h-[40px]">
        <AnimatePresence>
          {ingredients.map((ingredient, index) => (
            <motion.div
              key={`${ingredient}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-muted text-foreground px-3 py-1.5 rounded-md flex items-center gap-1">
                {ingredient}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 rounded-full hover:bg-muted ml-1"
                  onClick={() => removeIngredient(index)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {ingredient}</span>
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
