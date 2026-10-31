"use client"

import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { AccountMenu } from "./AccountMenu"

/**
 * Per-visitor header controls as a client island, so the layouts above stay
 * static. Until Clerk resolves we render a same-size placeholder: cached HTML
 * never shows "Sign in" to a signed-in user and nothing shifts.
 *
 * "Sign in" is a real link to the `/sign-in` page (header + footer shell),
 * not Clerk's modal. Signed-in visitors get `AccountMenu` (dashboard by role,
 * dark mode, sign out) instead of Clerk's `<UserButton>`.
 */
export function AccountControls() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return <div aria-hidden className="h-11 w-28" />

  if (!isSignedIn) {
    return (
      <div className="flex h-11 w-28 items-center justify-end">
        <Button variant="outline" render={<Link href="/sign-in" />}>
          Sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-11 w-28 items-center justify-end">
      <AccountMenu />
    </div>
  )
}
