"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AuthTest() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [cookieInfo, setCookieInfo] = useState<any>(null)
  const [testCookieResult, setTestCookieResult] = useState<any>(null)
  const [debugLoading, setDebugLoading] = useState(false)
  const [cookieLoading, setCookieLoading] = useState(false)
  const [testCookieLoading, setTestCookieLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkSession() {
      try {
        setLoading(true)
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        setSessionInfo({
          hasSession: !!data.session,
          user: data.session?.user
            ? {
                id: data.session.user.id,
                email: data.session.user.email,
              }
            : null,
          expiresAt: data.session?.expires_at,
        })
      } catch (err: any) {
        setError(err.message || "Failed to check session")
        console.error("Session check error:", err)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [supabase.auth])

  const fetchDebugInfo = async () => {
    try {
      setDebugLoading(true)
      const response = await fetch("/api/auth/debug")
      const data = await response.json()
      setDebugInfo(data)
    } catch (err: any) {
      console.error("Debug fetch error:", err)
      setError(err.message || "Failed to fetch debug info")
    } finally {
      setDebugLoading(false)
    }
  }

  const fetchCookieInfo = async () => {
    try {
      setCookieLoading(true)
      const response = await fetch("/api/auth/cookies")
      const data = await response.json()
      setCookieInfo(data)
    } catch (err: any) {
      console.error("Cookie fetch error:", err)
      setError(err.message || "Failed to fetch cookie info")
    } finally {
      setCookieLoading(false)
    }
  }

  const setTestCookie = async () => {
    try {
      setTestCookieLoading(true)
      const response = await fetch("/api/auth/test-cookie")
      const data = await response.json()
      setTestCookieResult(data)
    } catch (err: any) {
      console.error("Test cookie error:", err)
      setError(err.message || "Failed to set test cookie")
    } finally {
      setTestCookieLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      // Refresh the page to clear any cached state
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Failed to sign out")
      console.error("Sign out error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Test</CardTitle>
        <CardDescription>Check your authentication status and debug information</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="session">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="session">Session</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
          </TabsList>

          <TabsContent value="session" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Client-Side Session Status:</h3>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking session...</span>
                </div>
              ) : (
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">{JSON.stringify(sessionInfo, null, 2)}</pre>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>

              {sessionInfo?.hasSession && (
                <Button variant="destructive" onClick={signOut} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing Out...
                    </>
                  ) : (
                    "Sign Out"
                  )}
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="debug" className="space-y-4">
            <div className="flex justify-end mb-2">
              <Button variant="outline" onClick={fetchDebugInfo} disabled={debugLoading} size="sm">
                {debugLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Fetch Debug Info"
                )}
              </Button>
            </div>

            {debugInfo && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Server-Side Debug Info:</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-80">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cookies" className="space-y-4">
            <div className="flex justify-between mb-2">
              <Button variant="outline" onClick={fetchCookieInfo} disabled={cookieLoading} size="sm">
                {cookieLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Fetch Cookie Info"
                )}
              </Button>

              <Button variant="outline" onClick={setTestCookie} disabled={testCookieLoading} size="sm">
                {testCookieLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Setting...
                  </>
                ) : (
                  "Set Test Cookie"
                )}
              </Button>
            </div>

            {testCookieResult && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Test Cookie Result:</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(testCookieResult, null, 2)}
                </pre>
              </div>
            )}

            {cookieInfo && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Cookie Information:</h3>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-80">
                  {JSON.stringify(cookieInfo, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
