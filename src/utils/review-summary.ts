import { maskContactDetails } from "./contact-mask"

/**
 * Reviews a provider received (PR-13, SY-05, BR-04; docs/provider-schedule-reviews-feature.md) — pure, tested.
 */

/** Star counts 5 → 1 with their share of the total (visible reviews only — hidden ones don't count). */
export function ratingDistribution(counts: Partial<Record<number, number>>) {
  const total = [1, 2, 3, 4, 5].reduce((s, r) => s + (counts[r] ?? 0), 0)
  return [5, 4, 3, 2, 1].map((rating) => {
    const count = counts[rating] ?? 0
    return { rating, count, percent: total ? Math.round((count / total) * 100) : 0 }
  })
}

export const REPLY_MIN = 2
export const REPLY_MAX = 500

/**
 * Why this reply can't be posted, or `null`. Replies are public (shown under the review on the
 * profile), so phone numbers, emails and chat links are refused — leakage to every visitor (SY-04, R1).
 */
export function replyProblem(text: string): string | null {
  const t = text.trim()
  if (t.length < REPLY_MIN) return "Write a reply first."
  if (t.length > REPLY_MAX) return `Keep your reply under ${REPLY_MAX} characters.`
  if (maskContactDetails(t).masked) return "Replies are public: don't include phone numbers, emails or chat links."
  return null
}

/** A provider can't reply to a review Livo has hidden (AD-08) — it isn't shown to anyone. */
export const replyBlockedReason = (isHidden: boolean) => (isHidden ? "Livo hid this review, so it isn't shown and can't be replied to." : null)
