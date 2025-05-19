"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

export default function RecipeNavbar() {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true)
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          if (error.name === "AuthApiError" && error.message.includes("refresh_token")) {
            await supabase.auth.signOut()
          }
          return
        }

        setUser(session?.user || null)
      } catch (error) {
        console.error("Error in auth setup:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Force dark theme to match design
    setTheme("dark")
  }, [supabase.auth, setTheme])

  return (
    <header className="border-b border-[#1E293B] bg-[#0A0F1D] py-3">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary mr-2" fill="currentColor">
            <path d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm.5-9.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm-5 0c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z" />
          </svg>
          <span className="font-bold text-xl">
            Recipe<span className="text-primary">Craft</span>
          </span>
        </Link>

        <div className="flex-1 flex justify-center">
          <Link href="/generate" className="text-primary hover:text-primary/80 font-medium">
            Recipe Generator
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full bg-[#1E293B] text-foreground"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {!loading &&
            (user ? (
              <Link href="/my-recipes">
                <Button variant="outline" className="border-[#1E293B] bg-[#1E293B] hover:bg-[#2D3A4F]">
                  My Recipes
                </Button>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth">
                  <Button variant="ghost" className="text-foreground hover:bg-[#1E293B]">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth?tab=signup">
                  <Button className="bg-primary hover:bg-primary/90">Sign Up</Button>
                </Link>
              </div>
            ))}
        </div>
      </div>
    </header>
  )
}
