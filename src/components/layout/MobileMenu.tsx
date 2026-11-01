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
              <h2 id={`m-nav-${g.id}`} className="px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {g.label}
              </h2>
              <ul>
                {g.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={close} className="flex h-11 items-center rounded-md px-3 text-base hover:bg-accent">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {g.categories.length ? (
                <ul className="mt-1 grid grid-cols-2 gap-x-1">
                  {g.categories.map((c) => (
                    <li key={c.href}>
                      <Link href={c.href} onClick={close} className="flex h-10 items-center rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
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
