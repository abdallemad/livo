"use client"

import { m, type Variants } from "motion/react"
import { cn } from "@/lib/utils"

const container: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.06 } } }
const word: Variants = {
  hidden: { opacity: 0, y: "0.5em", filter: "blur(6px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

/**
 * Section title text animation (docs/landing-page.md "Motion"): when the heading scrolls into view, its words rise in
 * one after another. Plays once. Needs `MotionProvider` above it.
 *
 * The heading's text stays in the server HTML (crawlers, no-JS); `aria-label` gives screen readers the whole title once.
 */
export function AnimatedTitle({ as = "h2", text, id, className }: { as?: "h1" | "h2" | "h3"; text: string; id?: string; className?: string }) {
  const Heading = as === "h1" ? m.h1 : as === "h3" ? m.h3 : m.h2
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <Heading id={id} aria-label={text} className={cn("text-balance", className)} variants={container} initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.6 }}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} aria-hidden>
          <m.span className="inline-block" variants={word}>
            {w}
          </m.span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Heading>
  )
}
