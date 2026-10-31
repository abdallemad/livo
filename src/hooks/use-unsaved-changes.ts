"use client"

import { useCallback, useEffect } from "react"

const MESSAGE = "You have unsaved changes. Are you sure you want to leave?"

/**
 * Warns before losing unsaved form edits (CLAUDE.md §9): the browser's own
 * prompt on reload/close, and `confirmLeave()` for in-app exits (Back, "save
 * and exit"), since the App Router has no navigation-blocking API.
 */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  return useCallback(() => !dirty || window.confirm(MESSAGE), [dirty])
}
