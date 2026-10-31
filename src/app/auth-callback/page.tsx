import type { Metadata } from "next"
import { AuthCallback } from "@/components/auth/AuthCallback"

export const metadata: Metadata = { robots: { index: false, follow: false } }

/** Clerk's sign-in/up fallback redirect lands here to create the DB user once. */
export default function AuthCallbackPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <AuthCallback />
    </main>
  )
}
