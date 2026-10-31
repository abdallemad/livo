import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { SITE_LOGO, SITE_NAME } from "@/constants/site"

/**
 * Minimal shell for the onboarding wizard: logo, theme toggle, centred
 * content. No marketing nav or sidebar, so the only way forward is the
 * wizard. Reads NOTHING from the request (CLAUDE.md §4.1 rule 1): gating
 * lives in src/proxy.ts and every /api/onboarding route re-checks the session.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Image src={SITE_LOGO} alt="" width={32} height={32} />
            {SITE_NAME}
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:py-10">{children}</main>
    </div>
  )
}
