"use client"

import { useEffect, useRef } from "react"

/**
 * Moves keyboard/screen-reader focus to an element when it mounts (wizard
 * step headings, NF-11). Done on mount rather than by the parent, because
 * animated step transitions mount the next step only after the old one exits.
 */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])
  return ref
}
