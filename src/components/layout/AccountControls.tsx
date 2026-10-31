"use client"

import Link from "next/link"
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs"
import { LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useViewer } from "@/hooks/use-viewer"
import type { Role } from "@prisma/client"

/** Where each role's dashboard lives (docs/SITEMAP.md §1). */
const DASHBOARD_BY_ROLE: Record<Role, { href: string; label: string }> = {
  CUSTOMER: { href: "/account", label: "حسابي" },
  PROVIDER: { href: "/provider", label: "لوحة المزود" },
  ADMIN: { href: "/admin", label: "لوحة الإدارة" },
}

/**
 * Per-visitor header controls as a client island, so the layouts above stay
 * static. Until Clerk resolves we render a same-size placeholder: cached HTML
 * never shows "Sign in" to a signed-in user and nothing shifts.
 * The dashboard link only decides what is *shown*; every zone is gated server-side.
 */
export function AccountControls() {
  const { isLoaded, isSignedIn } = useAuth()
  const { data: viewer } = useViewer()

  if (!isLoaded) return <div aria-hidden className="h-11 w-28" />

  if (!isSignedIn) {
    return (
      <div className="flex h-11 w-28 items-center justify-end">
        <SignInButton mode="modal">
          <Button variant="outline">تسجيل الدخول</Button>
        </SignInButton>
      </div>
    )
  }

  // Unfinished onboarding: the only useful place to go is back into the wizard.
  const dashboard = viewer
    ? viewer.onboardingCompleted
      ? DASHBOARD_BY_ROLE[viewer.role]
      : { href: "/onboarding", label: "كمّل تسجيلك" }
    : null

  return (
    <div className="flex h-11 w-28 items-center justify-end gap-1">
      {dashboard ? (
        <Button size="icon" variant="ghost" render={<Link href={dashboard.href} aria-label={dashboard.label} />}>
          <LayoutDashboard />
        </Button>
      ) : null}
      <UserButton />
    </div>
  )
}
