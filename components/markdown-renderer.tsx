"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Card } from "@/components/ui/card"

interface MarkdownRendererProps {
  markdown: string
}

export default function MarkdownRenderer({ markdown }: MarkdownRendererProps) {
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Card className="p-6 prose dark:prose-invert max-w-none">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </Card>
  )
}
