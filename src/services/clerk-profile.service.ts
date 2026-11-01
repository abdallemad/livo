import "server-only"
import { clerkClient } from "@clerk/nextjs/server"

/**
 * Mirrors the user's name to Clerk (the UI reads identity from Clerk — CLAUDE.md §5) and returns
 * Clerk's current photo URL so it can be copied into `User.avatarUrl`. The photo itself is uploaded
 * straight to Clerk from the browser. Best effort: a Clerk hiccup never loses the user's save.
 * Shared by onboarding and the settings pages.
 */
export async function syncNameToClerk(userId: string, name: string): Promise<string | null> {
  const [firstName, ...rest] = name.split(/\s+/)
  try {
    const client = await clerkClient()
    const updated = await client.users.updateUser(userId, { firstName, lastName: rest.join(" ") || undefined })
    return updated.hasImage ? updated.imageUrl : null
  } catch (error) {
    console.error("[clerk] could not sync name", error)
    return null
  }
}
