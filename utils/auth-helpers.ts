import { createClient } from "@/utils/supabase/server"

export async function getUser() {
  const supabase = createClient()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting user session:", error)
      return null
    }

    return session?.user || null
  } catch (error) {
    console.error("Unexpected error getting user:", error)
    return null
  }
}

export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  return user
}
