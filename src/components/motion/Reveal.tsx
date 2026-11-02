"use client"

import { m, type Variants } from "motion/react"

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Fade + rise when scrolled into view, once (docs/landing-page.md "Motion"). `scale` for a gentle zoom-in (final CTA).
 * Needs `MotionProvider` above it.
 */
export function Reveal({ children, delay = 0, y = 24, scale = false, className }: { children: React.ReactNode; delay?: number; y?: number; scale?: boolean; className?: string }) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y, ...(scale ? { scale: 0.96 } : {}) }}
      whileInView={{ opacity: 1, y: 0, ...(scale ? { scale: 1 } : {}) }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </m.div>
  )
}

const list: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.08 } } }
const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

/** A `<ul>` / `<ol>` whose `StaggerItem`s appear one after another when the list scrolls into view. */
export function StaggerList({ as = "ul", children, className }: { as?: "ul" | "ol"; children: React.ReactNode; className?: string }) {
  const List = as === "ol" ? m.ol : m.ul
  return (
    <List className={className} variants={list} initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.15 }}>
      {children}
    </List>
  )
}

/** An `<li>` inside a `StaggerList`; lifts a little on hover. */
export function StaggerItem({ children, className, lift = false }: { children: React.ReactNode; className?: string; lift?: boolean }) {
  return (
    <m.li className={className} variants={item} {...(lift ? { whileHover: { y: -4 }, transition: { type: "spring", stiffness: 300, damping: 22 } } : {})}>
      {children}
    </m.li>
  )
}
