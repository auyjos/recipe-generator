import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl    // We're no longer redirecting users automatically
    // Instead, we'll just add the session to the request for pages to use
    const supabase = await createClient()

    try {
      // Wrap in try/catch to handle auth errors gracefully
      await supabase.auth.getSession()
    } catch (error) {
      console.error("Auth error in middleware:", error)
      // Continue anyway - we'll handle auth state in the components
    }

    // Continue to the requested page
    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.next()
  }
}

// We're still watching these routes to potentially add more middleware functionality later
export const config = {
  matcher: ["/my-recipes/:path*"],
}
