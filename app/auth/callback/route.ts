import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const error = requestUrl.searchParams.get("error")
    const error_description = requestUrl.searchParams.get("error_description")

    // Log the full URL for debugging (excluding the code for security)
    const debugUrl = new URL(request.url)
    if (debugUrl.searchParams.has("code")) {
      debugUrl.searchParams.set("code", "[REDACTED]")
    }
    console.log("Auth callback URL:", debugUrl.toString())

    if (error) {
      console.error("Auth callback error:", error, error_description)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth?error=${encodeURIComponent(error_description || "Authentication error")}`,
      )
    }

    if (!code) {
      console.error("Auth callback missing code parameter")
      return NextResponse.redirect(
        `${requestUrl.origin}/auth?error=${encodeURIComponent("Missing authentication code")}`,
      )
    }

    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError)
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent(exchangeError.message)}`)
    }

    // Log successful authentication (without sensitive details)
    console.log("Authentication successful, user ID:", data?.session?.user.id)

    // Redirect to home page or a success page
    const redirectTo = requestUrl.searchParams.get("redirectTo") || "/"
    return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`)
  } catch (error: any) {
    console.error("Auth callback unexpected error:", error)
    return NextResponse.redirect(
      `${new URL(request.url).origin}/auth?error=${encodeURIComponent(error.message || "An unexpected error occurred")}`,
    )
  }
}
