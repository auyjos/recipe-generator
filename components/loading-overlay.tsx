"use client"

import { Loader2 } from "lucide-react"

interface LoadingOverlayProps {
  message?: string
  isVisible: boolean
}

export default function LoadingOverlay({ message = "Loading...", isVisible }: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-50 rounded-lg">
      <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-foreground font-medium">{message}</span>
      </div>
    </div>
  )
}
