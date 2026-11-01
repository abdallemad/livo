"use client"

import Link from "next/link"
import { useClerk } from "@clerk/nextjs"
import { KeyRound, LogOut, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Account actions for any signed-in user: Clerk's own sign-in & security dialog (mobile number, sessions),
 * sign out, and account deletion (AU-07) — via support until self-service deletion is designed (it must settle
 * bookings, wallet and payouts, anonymise data and delete the Clerk user). Zone-specific rows go in `children`.
 */
export function AccountActionsCard({ children }: { children?: React.ReactNode }) {
  const { openUserProfile, signOut } = useClerk()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Account</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {children}
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2">
          <span className="flex items-center gap-2">
            <KeyRound className="size-5 text-muted-foreground" aria-hidden />
            Sign-in and security (mobile number, sessions)
          </span>
          <Button variant="outline" onClick={() => openUserProfile()}>
            Manage
          </Button>
        </div>
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2">
          <span className="flex items-center gap-2">
            <LogOut className="size-5 text-muted-foreground" aria-hidden />
            Sign out on this device
          </span>
          <Button variant="outline" onClick={() => void signOut({ redirectUrl: "/" })}>
            Sign out
          </Button>
        </div>
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2">
          <span className="flex items-center gap-2">
            <Trash2 className="size-5 text-muted-foreground" aria-hidden />
            Delete your account
          </span>
          <Button variant="ghost" render={<Link href="/contact" />}>
            Contact support
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

