"use client"

import { m } from "motion/react"

/**
 * Two soft brand glows (violet, coral — the website's `.orb`s) drifting slowly behind the hero (docs/landing-page.md "Motion"). Decorative only:
 * `aria-hidden`, no pointer events, clipped by the hero; still for reduced-motion visitors (`MotionConfig`).
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <m.div
        className="absolute -top-24 -start-24 size-80 rounded-full bg-violet/30 blur-3xl md:size-[28rem]"
        animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <m.div
        className="absolute -end-20 top-10 size-72 rounded-full bg-coral/25 blur-3xl md:size-96"
        animate={{ x: [0, -36, 0], y: [0, 24, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}
