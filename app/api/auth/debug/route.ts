import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()

    // Get all cookies for debugging
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(
      (cookie) => cookie.name.includes("supabase") || cookie.name.includes("sb-"),
    )

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          errorDetails: error,
          cookies: {
            count: supabaseCookies.length,
            names: supabaseCookies.map((c) => c.name),
          },
        },
        { status: 400 },
      )
    }

    // Return session info but redact sensitive data
    return NextResponse.json({
      authenticated: !!data.session,
      user: data.session
        ? {
            id: data.session.user.id,
            email: data.session.user.email,
            lastSignInAt: data.session.user.last_sign_in_at,
          }
        : null,
      sessionExpires: data.session?.expires_at,
      cookies: {
        count: supabaseCookies.length,
        names: supabaseCookies.map((c) => c.name),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    })
  } catch (error: any) {
    console.error("Auth debug error:", error)
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
