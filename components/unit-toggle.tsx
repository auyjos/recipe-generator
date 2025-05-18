"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Scale } from "lucide-react"

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
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="relative px-8 h-9"
      aria-label={`Switch to ${system === "metric" ? "imperial" : "metric"} units`}
    >
      <Scale size={14} className="mr-2" />
      <span className="relative z-10">{system === "metric" ? "Metric" : "Imperial"}</span>
      <motion.div
        className="absolute inset-0 bg-primary/10 rounded-md"
        initial={false}
        animate={{
          x: system === "metric" ? 0 : "100%",
          width: "50%",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    </Button>
  )
}
