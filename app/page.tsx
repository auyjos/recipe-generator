"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { motion } from "framer-motion"
import { ChefHat, Utensils, BookMarked, UserCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"

export default function Home() {
  const [authInitialized, setAuthInitialized] = useState(false)

  // Initialize auth silently to handle any token errors
  useEffect(() => {
    const initAuth = async () => {
      try {
        const supabase = createClient()
        await supabase.auth.getSession()
      } catch (error) {
        console.error("Auth initialization error:", error)
        // Continue anyway - we'll handle auth state in the navbar
      } finally {
        setAuthInitialized(true)
      }
    }

    initAuth()
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  // Don't render until auth is initialized to prevent flashing
  if (!authInitialized) {
    return null
  }

  return (
    <div className="flex flex-col items-center justify-center max-w-3xl mx-auto py-12 text-center">
      <motion.h1
        className="text-4xl font-bold tracking-tight sm:text-5xl mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Your Personal Recipe Generator
      </motion.h1>

      <motion.p
        className="text-xl text-muted-foreground mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Generate custom recipes based on your preferences, save your favorites, and build your personal cookbook.
      </motion.p>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-12"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <Card className="h-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 hover:border-primary/50">
            <CardContent className="p-6 flex flex-col items-center h-full">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ChefHat className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Generate Recipes</h2>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Create custom recipes tailored to your dietary preferences and available ingredients.
                <span className="block mt-2 text-xs font-medium text-primary">No account required!</span>
              </p>
              <Link href="/generate" className="mt-auto">
                <Button className="w-full group">
                  Start Generating
                  <motion.span
                    className="ml-2"
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    →
                  </motion.span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full transform transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 hover:border-primary/50">
            <CardContent className="p-6 flex flex-col items-center h-full">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BookMarked className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Save Favorites</h2>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Build your personal cookbook by saving recipes you love for easy access later.
                <span className="block mt-2 text-xs font-medium">
                  <UserCheck className="inline h-3 w-3 mr-1" />
                  Account required
                </span>
              </p>
              <Link href="/my-recipes" className="mt-auto">
                <Button variant="outline" className="w-full group">
                  View My Recipes
                  <motion.span
                    className="ml-2"
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    →
                  </motion.span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              icon: <ChefHat className="h-5 w-5" />,
              title: "Generate",
              description: "Enter your preferences and dietary requirements to generate custom recipes.",
              badge: "No login required",
            },
            {
              step: "2",
              icon: <Utensils className="h-5 w-5" />,
              title: "Customize",
              description: "Adjust ingredients and instructions to match your taste and available items.",
              badge: null,
            },
            {
              step: "3",
              icon: <BookMarked className="h-5 w-5" />,
              title: "Save",
              description: "Save your favorite recipes to your personal cookbook for future reference.",
              badge: "Account required",
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              className="p-6 border rounded-lg bg-card hover:bg-accent/50 transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  {item.step}
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">{item.icon}</div>
              </div>
              <h3 className="font-medium mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              {item.badge && (
                <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
