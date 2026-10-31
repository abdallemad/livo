"use client"

import { useSyncExternalStore } from "react"

/** Matches Tailwind's `md` breakpoint. Used by the sidebar to switch to a sheet. */
const MOBILE_QUERY = "(max-width: 767px)"

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

/** `false` on the server and during hydration, then the real value. */
export function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  )
}
