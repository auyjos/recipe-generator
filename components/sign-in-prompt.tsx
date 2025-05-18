"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookMarked, ChefHat, Lock } from "lucide-react"

interface SignInPromptProps {
  currentPath: string
}

export default function SignInPrompt({ currentPath }: SignInPromptProps) {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold mb-4">My Recipes</h1>
        <p className="text-muted-foreground text-lg">Your personal collection of saved recipes</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4"
            >
              <Lock className="h-8 w-8 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl">Sign in to view your recipes</CardTitle>
            <CardDescription className="text-base mt-2">
              Create an account or sign in to save and access your favorite recipes
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <ChefHat className="h-8 w-8 text-primary/70 mb-3" />
                <h3 className="font-medium text-base mb-2">Generate Recipes</h3>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Create custom recipes based on your preferences and dietary needs
                </p>
                <Link href="/generate" className="mt-auto">
                  <Button variant="outline" size="sm">
                    Try It Now
                  </Button>
                </Link>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <BookMarked className="h-8 w-8 text-primary/70 mb-3" />
                <h3 className="font-medium text-base mb-2">Save Favorites</h3>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Build your personal cookbook by saving recipes you love
                </p>
                <Link href={`/auth?redirectedFrom=${encodeURIComponent(currentPath)}`} className="mt-auto">
                  <Button variant="outline" size="sm">
                    Sign In Required
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-2 pb-6">
            <Link href={`/auth?redirectedFrom=${encodeURIComponent(currentPath)}`}>
              <Button size="lg" className="px-8">
                Sign In or Create Account
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 text-center"
      >
        <p className="text-muted-foreground">
          You can still{" "}
          <Link href="/generate" className="text-primary hover:underline">
            generate recipes
          </Link>{" "}
          without signing in.
        </p>
      </motion.div>
    </div>
  )
}
