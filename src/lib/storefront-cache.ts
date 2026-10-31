import "server-only"
import { revalidatePath } from "next/cache"

/**
 * The single switch that marks every cached public page stale after a write.
 * Call it from every successful public-facing mutation route (admin/provider).
 * Coarse on purpose: edits are rare and regeneration is lazy.
 */
export function revalidateStorefront(): void {
  revalidatePath("/", "layout")
  revalidatePath("/sitemap.xml")
  // Add `revalidateTag(TAG, { expire: 0 })` here for any `unstable_cache` data tags.
}
