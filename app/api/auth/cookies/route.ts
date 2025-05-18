import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    // Filter out sensitive data but keep names and basic properties
    const sanitizedCookies = allCookies.map((cookie) => ({
      name: cookie.name,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
      maxAge: cookie.maxAge,
      expires: cookie.expires,
      // Don't include the actual value for security
      valueLength: cookie.value ? cookie.value.length : 0,
      hasValue: !!cookie.value,
    }))

    return NextResponse.json({
      cookieCount: allCookies.length,
      cookies: sanitizedCookies,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    })
  } catch (error: any) {
    console.error("Cookie debug error:", error)
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
