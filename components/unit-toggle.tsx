"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface UnitToggleProps {
  onToggle: (system: "metric" | "imperial") => void
  defaultSystem?: "metric" | "imperial"
}

export default function UnitToggle({ onToggle, defaultSystem = "metric" }: UnitToggleProps) {
  const [system, setSystem] = useState<"metric" | "imperial">(defaultSystem)

  const handleToggle = () => {
    const newSystem = system === "metric" ? "imperial" : "metric"
    setSystem(newSystem)
    onToggle(newSystem)
  }

  return (
    <div className="flex items-center bg-muted rounded-md p-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          if (system !== "metric") {
            setSystem("metric")
            onToggle("metric")
          }
        }}
        className={`relative px-3 py-1 h-7 rounded-sm ${
          system === "metric" ? "text-primary bg-background" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Metric
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          if (system !== "imperial") {
            setSystem("imperial")
            onToggle("imperial")
          }
        }}
        className={`relative px-3 py-1 h-7 rounded-sm ${
          system === "imperial" ? "text-primary bg-background" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Imperial
      </Button>
    </div>
  )
}
