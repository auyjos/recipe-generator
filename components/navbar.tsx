"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/supabase-js"
import { Loader2, Menu } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [signOutLoading, setSignOutLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true)
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
          return
        }

        setUser(session?.user || null)

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("Auth state changed:", event)
          setUser(session?.user || null)
        })

        return () => {
          authListener.subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error in auth setup:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase.auth])

  const handleSignOut = async () => {
    try {
      setSignOutLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("Error signing out:", error)
        return
      }

      // Force a hard refresh to clear any cached state
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Unexpected error during sign out:", error)
    } finally {
      setSignOutLoading(false)
    }
  }

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Generate Recipe", href: "/generate" },
    {
      name: "My Recipes",
      href: "/my-recipes",
      requiresAuth: true,
    },
  ]

  return (
    <motion.header
      className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-sm"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold relative group">
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Recipe Generator
          </span>
          <motion.span
            className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary"
            whileHover={{ width: "100%" }}
            transition={{ duration: 0.3 }}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <AnimatePresence>
            {navItems.map((item) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={item.href}
                  className={`text-sm relative group ${
                    pathname === item.href
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.name}
                  {item.requiresAuth && !user && (
                    <span className="absolute -top-1 -right-3 w-2 h-2 bg-primary rounded-full" />
                  )}
                  {pathname === item.href && (
                    <motion.span
                      className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary"
                      layoutId="navbar-underline"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />

          {loading ? (
            <Button variant="ghost" size="icon" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          ) : user ? (
            <Button variant="outline" onClick={handleSignOut} disabled={signOutLoading} className="hidden md:flex">
              {signOutLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing Out
                </>
              ) : (
                "Sign Out"
              )}
            </Button>
          ) : (
            <Link href="/auth" className="hidden md:block">
              <Button>Sign In</Button>
            </Link>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col h-full">
                <div className="flex flex-col gap-4 py-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-sm px-2 py-1.5 rounded-md flex items-center justify-between ${
                        pathname === item.href
                          ? "font-medium bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{item.name}</span>
                      {item.requiresAuth && !user && <span className="w-2 h-2 bg-primary rounded-full" />}
                    </Link>
                  ))}
                </div>
                <div className="mt-auto">
                  {!loading &&
                    (user ? (
                      <Button variant="outline" onClick={handleSignOut} disabled={signOutLoading} className="w-full">
                        {signOutLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Signing Out
                          </>
                        ) : (
                          "Sign Out"
                        )}
                      </Button>
                    ) : (
                      <Link href="/auth" className="w-full">
                        <Button className="w-full">Sign In</Button>
                      </Link>
                    ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  )
}
