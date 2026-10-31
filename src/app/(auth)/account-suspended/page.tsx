import type { Metadata } from "next"
import Link from "next/link"
import { Ban } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Where the zone gate sends a suspended account (AD-03, `utils/zone-access.ts`).
 * Static: it reads nothing about the visitor, so it can't leak the reason — the
 * reason is in the user's notifications and with support.
 */
export const metadata: Metadata = { title: "Account suspended", robots: { index: false, follow: false } }

export default function AccountSuspendedPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md space-y-4 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Ban className="size-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold">Your account is suspended</h1>
        <p className="text-muted-foreground">
          You can still browse the site, but you can&apos;t use your dashboard, book or send quotes until our team
          re-activates your account. Contact us if you think this is a mistake.
        </p>
        <div className="flex justify-center gap-2">
          <Button render={<Link href="/contact" />}>Contact support</Button>
          <Button variant="outline" render={<Link href="/" />}>
            Back to home
          </Button>
        </div>
      </div>
    </main>
  )
}
