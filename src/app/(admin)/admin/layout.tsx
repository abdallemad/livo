import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ADMIN_NAV } from "@/constants/nav"
import { getCurrentUser } from "@/services/auth.service"

/**
 * Admin shell — layer 2 of 3. The proxy already 404s non-admins, but Next
 * renders segments in parallel, so the layout re-checks before any output.
 * Dynamic by design (reads the session).
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser()
  if (user?.role !== "ADMIN") notFound()

  return (
    <div className="flex h-dvh overflow-hidden">
      <aside className="hidden w-56 shrink-0 border-e p-4 md:block">
        <nav className="flex flex-col gap-1 text-sm">
          {ADMIN_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 hover:bg-muted">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
