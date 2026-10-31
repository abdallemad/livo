import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { toast } from "sonner"
import { ApiError } from "@/lib/api-client"

/**
 * Replays an API route's `fieldErrors` into react-hook-form (CLAUDE.md §9).
 * Errors for fields the form doesn't have, or with no field at all, become a
 * toast, so nothing the server says is silently dropped.
 */
export function applyApiErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: readonly Path<T>[]) {
  if (error instanceof ApiError && error.fieldErrors) {
    let shown = false
    for (const [field, messages] of Object.entries(error.fieldErrors)) {
      if (!messages?.length) continue
      if ((fields as readonly string[]).includes(field)) {
        setError(field as Path<T>, { type: "server", message: messages[0] }, { shouldFocus: !shown })
        shown = true
      } else {
        toast.error(messages[0])
        shown = true
      }
    }
    if (shown) return
  }
  toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.")
}
