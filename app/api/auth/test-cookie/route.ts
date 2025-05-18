import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()

    // Set a test cookie
    const testCookieValue = `test-${Date.now()}`
    cookieStore.set({
      name: "auth-test-cookie",
      value: testCookieValue,
      path: "/",
      maxAge: 60 * 5, // 5 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    return NextResponse.json({
      success: true,
      message: "Test cookie set successfully",
      cookieName: "auth-test-cookie",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Test cookie error:", error)
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
