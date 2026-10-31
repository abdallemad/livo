"use client"

import Link from "next/link"
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs"
import { LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsAdmin } from "@/hooks/use-viewer"

/**
 * Per-visitor header controls as a client island, so the layouts above stay
 * static. Until Clerk resolves we render a same-size placeholder: cached HTML
 * never shows "Sign in" to a signed-in user and nothing shifts.
 */
export function AccountControls() {
  const { isLoaded, isSignedIn } = useAuth()
  const isAdmin = useIsAdmin()

  if (!isLoaded) return <div aria-hidden className="h-8 w-24" />

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button size="sm">تسجيل الدخول</Button>
      </SignInButton>
    )
  }

  return (
    <div className="flex h-8 w-24 items-center justify-end gap-2">
      {isAdmin ? (
        <Button size="icon-sm" variant="ghost" render={<Link href="/admin" aria-label="لوحة الإدارة" />}>
          <LayoutDashboard />
        </Button>
      ) : null}
      <UserButton />
    </div>
  )
}
