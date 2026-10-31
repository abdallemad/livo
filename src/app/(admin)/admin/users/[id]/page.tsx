import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { UserDetail } from "@/components/admin/users/UserDetail"
import { getUserDetail } from "@/services/admin-user.service"

/**
 * /admin/users/[id] — one account (docs/SITEMAP.md §5, AD-03). First snapshot read on the
 * server (service called directly — CLAUDE.md §2 exception; the admin layout enforced the
 * role) and handed to the client as `initialData`; suspend / activate go through
 * `PATCH /api/admin/users/[id]/status` and refetch it.
 */
const load = cache(getUserDetail)

export async function generateMetadata({ params }: PageProps<"/admin/users/[id]">): Promise<Metadata> {
  const user = await load((await params).id)
  return { title: user ? user.name : "User not found" }
}

export default async function AdminUserDetailPage({ params }: PageProps<"/admin/users/[id]">) {
  const user = await load((await params).id)
  if (!user) notFound()
  return <UserDetail initialData={user} />
}
