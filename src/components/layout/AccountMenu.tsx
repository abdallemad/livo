"use client"

import Link from "next/link"
import { useClerk, useUser } from "@clerk/nextjs"
import { useQueryClient } from "@tanstack/react-query"
import { LayoutDashboard, LogOut, Moon, UserRoundPen } from "lucide-react"
import { useTheme } from "next-themes"
import type { Role } from "@prisma/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useViewer } from "@/hooks/use-viewer"

/** Where each role's dashboard lives (docs/SITEMAP.md §1). */
const DASHBOARD_BY_ROLE: Record<Role, { href: string; label: string }> = {
  CUSTOMER: { href: "/account", label: "My dashboard" },
  PROVIDER: { href: "/provider", label: "Provider dashboard" },
  ADMIN: { href: "/admin", label: "Admin dashboard" },
}

function initials(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  return parts.length ? parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") : "?"
}

/**
 * The signed-in user's menu (replaces Clerk's `<UserButton>` modal).
 * Name/email/avatar come from Clerk; the role (and so which ONE dashboard link
 * is shown) comes from `GET /api/me`. The link only decides what is *shown* —
 * every zone is still gated server-side (CLAUDE.md §5).
 */
export function AccountMenu() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { resolvedTheme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const { data: viewer, isPending } = useViewer()

  // Unfinished onboarding: the only useful place to go is back into the wizard.
  const dashboard = viewer
    ? viewer.onboardingCompleted
      ? DASHBOARD_BY_ROLE[viewer.role]
      : { href: "/onboarding", label: "Finish signing up" }
    : null

  const name = user?.fullName || user?.primaryPhoneNumber?.phoneNumber || "Your account"
  const email = user?.primaryEmailAddress?.emailAddress

  async function handleSignOut() {
    // Drop the viewer's cached data so the next person on this browser never sees it.
    queryClient.clear()
    await signOut({ redirectUrl: "/" })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button size="icon" variant="ghost" className="rounded-full" aria-label="Open account menu" />}
      >
        <Avatar>
          {user?.imageUrl ? <AvatarImage src={user.imageUrl} alt="" /> : null}
          <AvatarFallback>{initials(user?.fullName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5">
            <span className="block truncate text-sm font-medium text-foreground">{name}</span>
            {email ? <span className="block truncate text-xs font-normal">{email}</span> : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {dashboard ? (
            <DropdownMenuItem className="min-h-9" render={<Link href={dashboard.href} />}>
              {viewer?.onboardingCompleted ? <LayoutDashboard aria-hidden /> : <UserRoundPen aria-hidden />}
              {dashboard.label}
            </DropdownMenuItem>
          ) : isPending ? (
            <div className="px-1.5 py-1">
              <Skeleton className="h-7 w-full" />
            </div>
          ) : null}
          <DropdownMenuCheckboxItem
            className="min-h-9"
            checked={resolvedTheme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            closeOnClick={false}
          >
            <Moon aria-hidden />
            Dark mode
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-9" variant="destructive" onClick={handleSignOut}>
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
