"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeDebug() {
  const { theme, resolvedTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed bottom-4 right-4 bg-card p-4 rounded-md shadow-lg border z-50 text-xs">
      <h3 className="font-bold mb-2">Theme Debug</h3>
      <ul className="space-y-1">
        <li>Theme: {theme || "undefined"}</li>
        <li>Resolved Theme: {resolvedTheme || "undefined"}</li>
        <li>System Theme: {systemTheme || "undefined"}</li>
        <li>HTML Class: {document.documentElement.classList.contains("dark") ? "dark" : "light"}</li>
      </ul>
    </div>
  )
}
