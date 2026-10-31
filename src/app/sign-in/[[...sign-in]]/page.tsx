import type { Metadata } from "next"
import { SignIn } from "@clerk/nextjs"

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } }

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <SignIn />
    </main>
  )
}
