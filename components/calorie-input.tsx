"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface CalorieInputProps {
  value: number
  onChange: (value: number) => void
  onNutritionRequest?: (calories: number) => void
  isLoading?: boolean
  min?: number
  max?: number
  step?: number
}

export default function CalorieInput({
  value,
  onChange,
  onNutritionRequest,
  isLoading = false,
  min = 100,
  max = 1000,
  step = 50,
}: CalorieInputProps) {
  const [inputValue, setInputValue] = useState(value.toString())
  const [debouncedValue, setDebouncedValue] = useState(value)
  const [isTyping, setIsTyping] = useState(false)

  // Update input value when slider value changes
  useEffect(() => {
    if (!isTyping) {
      setInputValue(value.toString())
    }
  }, [value, isTyping])

  // Debounce the input value to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(Number.parseInt(inputValue) || min)
      setIsTyping(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [inputValue, min])

  // Trigger onChange and nutrition request when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue)
      onNutritionRequest?.(debouncedValue)
    }
  }, [debouncedValue, onChange, onNutritionRequest, value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTyping(true)
    setInputValue(e.target.value)
  }

  const handleInputBlur = () => {
    let newValue = Number.parseInt(inputValue) || min

    // Clamp the value between min and max
    newValue = Math.max(min, Math.min(max, newValue))

    setInputValue(newValue.toString())
    setDebouncedValue(newValue)
    setIsTyping(false)
  }

  const handleSliderChange = (values: number[]) => {
    const newValue = values[0]
    setInputValue(newValue.toString())
    onChange(newValue)
    onNutritionRequest?.(newValue)
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="calories">Calories (approx.)</Label>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          <div className="relative w-20">
            <Input
              id="calories-input"
              type="number"
              min={min}
              max={max}
              step={step}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              className="pr-8 text-right"
              aria-label="Calorie input"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kcal</span>
          </div>
        </div>
      </div>
      <Slider
        id="calories-slider"
        min={min}
        max={max}
        step={step}
        value={[Number.parseInt(inputValue) || min]}
        onValueChange={handleSliderChange}
        className="py-4"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min} kcal</span>
        <span>{max} kcal</span>
      </div>
    </div>
  )
}
