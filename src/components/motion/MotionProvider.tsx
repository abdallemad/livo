"use client"

import { domAnimation, LazyMotion, MotionConfig } from "motion/react"

/**
 * Wraps an animated page (docs/landing-page.md "Motion"). `LazyMotion` + `domAnimation` loads only the animation
 * features the `m.*` components use (a fraction of the full `motion` bundle; `strict` fails loudly if a full `motion.*`
 * component sneaks in). `reducedMotion="user"`: visitors who ask the OS for less motion get no movement, only fades.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
