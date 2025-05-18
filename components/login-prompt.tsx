"use client"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LoginPromptProps {
  isOpen: boolean
  onClose: () => void
  redirectPath?: string
}

export default function LoginPrompt({ isOpen, onClose, redirectPath = "/generate" }: LoginPromptProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to save recipes</DialogTitle>
          <DialogDescription>Create an account or sign in to save this recipe to your collection.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-center">
            <motion.div
              className="rounded-full bg-primary/10 p-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
                initial={{ rotate: -30 }}
                animate={{ rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </motion.svg>
            </motion.div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Your recipe has been generated successfully! Sign in to save it to your collection and access it anytime.
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="sm:w-auto w-full">
            Continue as Guest
          </Button>
          <Link href={`/auth?redirectedFrom=${encodeURIComponent(redirectPath)}`} className="sm:w-auto w-full">
            <Button className="w-full">Sign In or Register</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
