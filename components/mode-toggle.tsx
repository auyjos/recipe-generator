"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Only render the toggle on the client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Use the resolved theme to determine the current theme
  const currentTheme = resolvedTheme || theme

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="relative">
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {currentTheme === "dark" ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Dark mode</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Light mode</span>
            </motion.div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <span className="mr-2 h-4 w-4">💻</span>
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
