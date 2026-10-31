import { AppFooter } from "@/components/layout/AppFooter"
import { AppHeader } from "@/components/layout/AppHeader"

/**
 * `/sign-in` and `/sign-up`: the marketing header + footer around Clerk's
 * embedded forms, so signing in feels like part of the site (not a modal).
 * Its own group because these pages are `noindex` and have no ISR data.
 * Reads nothing from the request (CLAUDE.md §4.1).
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppHeader />
      {children}
      <AppFooter />
    </>
  )
}
