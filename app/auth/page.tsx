"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Bug } from "lucide-react"
import Link from "next/link"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectedFrom") || "/"
  const errorParam = searchParams.get("error")
  const supabase = createClient()

  // Prevent hydration errors
  useEffect(() => {
    setIsClient(true)

    // Check for error in URL params
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [errorParam])

  // Check if user is already logged in
  useEffect(() => {
    if (!isClient) return

    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Session check error:", error)
          return
        }

        if (session) {
          router.push(redirectTo)
        }
      } catch (err) {
        console.error("Unexpected error checking session:", err)
      }
    }

    checkSession()
  }, [isClient, redirectTo, router, supabase.auth])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setDebugInfo(null)

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user?.identities?.length === 0) {
        setError("This email is already registered. Please sign in instead.")
      } else {
        setSuccess("Check your email for the confirmation link.")
      }

      if (debugMode) {
        setDebugInfo({
          operation: "signUp",
          result: data,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during sign up")
      console.error("Sign up error:", error)

      if (debugMode) {
        setDebugInfo({
          operation: "signUp",
          error: {
            message: error.message,
            code: error.code,
            status: error.status,
          },
          timestamp: new Date().toISOString(),
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setDebugInfo(null)

    try {
      // First, check if we can connect to Supabase
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (debugMode) {
          console.log("Current session before sign in:", session ? "Exists" : "None")
        }
      } catch (sessionError) {
        console.error("Failed to check session before sign in:", sessionError)
        if (debugMode) {
          setDebugInfo({
            operation: "checkSession",
            error: sessionError,
            timestamp: new Date().toISOString(),
          })
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Successful login
      if (debugMode) {
        setDebugInfo({
          operation: "signIn",
          result: {
            success: true,
            user: data.user
              ? {
                  id: data.user.id,
                  email: data.user.email,
                }
              : null,
            sessionExists: !!data.session,
          },
          timestamp: new Date().toISOString(),
        })

        // Don't redirect immediately in debug mode
        setSuccess("Sign in successful! Debug mode enabled - redirect paused.")
      } else {
        router.push(redirectTo)
      }
    } catch (error: any) {
      if (error.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.")
      } else {
        setError(error.message || "Failed to sign in")
      }
      console.error("Sign in error:", error)

      if (debugMode) {
        setDebugInfo({
          operation: "signIn",
          error: {
            message: error.message,
            code: error.code,
            status: error.status,
          },
          timestamp: new Date().toISOString(),
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleDebugMode = () => {
    setDebugMode(!debugMode)
    setDebugInfo(null)
  }

  if (!isClient) {
    return null // Prevent hydration errors
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <Tabs defaultValue="signin">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <Button variant="ghost" size="icon" onClick={toggleDebugMode} title="Toggle Debug Mode">
                <Bug className={`h-4 w-4 ${debugMode ? "text-red-500" : "text-muted-foreground"}`} />
              </Button>
            </div>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
            <TabsList className="grid w-full grid-cols-2 mt-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-700 dark:text-green-400">{success}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {debugMode && debugInfo && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h3 className="text-sm font-medium mb-2">Debug Information:</h3>
                <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}

            {debugMode && success && (
              <div className="mt-4">
                <Button variant="outline" className="w-full" onClick={() => router.push(redirectTo)}>
                  Continue to {redirectTo}
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>

            {debugMode && (
              <div className="w-full">
                <Link href="/auth-test" className="text-xs text-primary hover:underline">
                  Go to Authentication Test Page
                </Link>
              </div>
            )}
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  )
}
