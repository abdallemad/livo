"use client"

import { useEffect, useRef } from "react"
import { animate, useInView, useReducedMotion } from "motion/react"
import { formatNumber } from "@/utils/format"

/**
 * A number that counts up from 0 the first time it scrolls into view (docs/landing-page.md "Motion"). The server HTML
 * already holds the real, formatted number (crawlers, no-JS, reduced motion), so nothing is ever shown wrong.
 */
export function CountUp({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || !inView || reduce) return
    const factor = 10 ** decimals
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = formatNumber(Math.round(v * factor) / factor)
      },
    })
    return () => controls.stop()
  }, [inView, reduce, value, decimals])

  return (
    <span ref={ref} className={className}>
      {formatNumber(value)}
    </span>
  )
}
