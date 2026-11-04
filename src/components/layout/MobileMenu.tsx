"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { ResolvedNavGroup } from "@/utils/nav"

/**
 * Public header nav on small screens — a Sheet from the inline start (§5 Overlays), with the same groups as the desktop
 * dropdowns (docs/navigation.md), each under its own heading. Categories are a compact two-column list.
 */
export function MobileMenu({ groups }: { groups: ResolvedNavGroup[] }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="icon" variant="ghost" className="md:hidden" aria-label="Menu" />}>
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Main navigation" className="space-y-5 px-2 pb-6">
          {groups.map((g) => (
            <section key={g.id} aria-labelledby={`m-nav-${g.id}`}>
              <h2 id={`m-nav-${g.id}`} className="px-3 pb-1 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                {g.label}
              </h2>
              <ul>
                {g.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={close} className="flex h-12 items-center rounded-2xl px-3 text-base font-semibold transition-colors hover:bg-soft hover:text-violet dark:hover:bg-muted dark:hover:text-primary">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {g.categories.length ? (
                <ul className="mt-1 grid grid-cols-2 gap-1">
                  {g.categories.map((c) => (
                    <li key={c.href}>
                      <Link href={c.href} onClick={close} className="flex h-10 items-center rounded-xl bg-soft px-3 text-sm font-medium text-foreground transition-colors hover:text-violet dark:bg-muted dark:hover:text-primary">
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
