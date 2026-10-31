import type { Metadata } from "next"
import { SignUp } from "@clerk/nextjs"

export const metadata: Metadata = { title: "Create account", robots: { index: false, follow: false } }

export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <SignUp />
    </main>
  )
}
