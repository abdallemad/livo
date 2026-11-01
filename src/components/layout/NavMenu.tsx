"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { activeGroupId, type ResolvedNavGroup } from "@/utils/nav"

/** Delay before a hovered-out menu closes, so moving the pointer diagonally into the panel doesn't drop it. */
const CLOSE_DELAY_MS = 150

/**
 * Desktop header navigation (docs/navigation.md): one trigger per group; the panel opens on **hover**, on keyboard focus
 * and on click/tap (touch has no hover), closes on pointer-leave, Escape, focus leaving the group, or following a link.
 *
 * Every panel is always rendered, so all links are in the server HTML for crawlers; a closed panel is `invisible`
 * (out of the tab order and the accessibility tree), not unmounted.
 */
export function NavMenu({ groups }: { groups: ResolvedNavGroup[] }) {
  const pathname = usePathname()
  const active = activeGroupId(groups, pathname)
  const [open, setOpen] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }
  const show = (id: string) => {
    cancelClose()
    setOpen(id)
  }
  const hideSoon = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(null), CLOSE_DELAY_MS)
  }

  return (
    <nav aria-label="Main navigation" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {groups.map((g) => {
          const isOpen = open === g.id
          const panelId = `nav-panel-${g.id}`
          const wide = g.categories.length > 0
          return (
            <li
              key={g.id}
              className="relative"
              onPointerEnter={(e) => e.pointerType === "mouse" && show(g.id)}
              onPointerLeave={(e) => e.pointerType === "mouse" && hideSoon()}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen((cur) => (cur === g.id ? null : cur))
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape" && isOpen) {
                  setOpen(null)
                  ;(e.currentTarget.querySelector("button") as HTMLButtonElement | null)?.focus()
                }
              }}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-current={active === g.id ? "true" : undefined}
                onClick={() => (isOpen ? setOpen(null) : show(g.id))}
                className={cn(
                  "flex h-11 items-center gap-1 rounded-md px-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  (isOpen || active === g.id) && "text-foreground",
                  active === g.id && "font-medium",
                )}
              >
                {g.label}
                <ChevronDown className={cn("size-4 transition-transform motion-reduce:transition-none", isOpen && "rotate-180")} aria-hidden />
              </button>

              {/* pt-2 keeps the hover area continuous between the trigger and the panel. */}
              <div
                id={panelId}
                className={cn(
                  "absolute start-0 top-full z-50 pt-2 transition-[opacity,translate] duration-150 motion-reduce:transition-none",
                  isOpen ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-1 opacity-0",
                )}
              >
                <div className={cn("grid gap-4 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg", wide ? "w-[36rem] grid-cols-[1fr_13rem]" : "w-80")}>
                  <ul className="grid content-start gap-1">
                    {g.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(null)}
                          aria-current={pathname === item.href ? "page" : undefined}
                          className="block rounded-lg px-3 py-2 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none aria-[current=page]:bg-accent"
                        >
                          <span className="block font-medium">{item.label}</span>
                          {item.description ? <span className="block text-sm text-muted-foreground">{item.description}</span> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {wide ? (
                    <div className="border-s ps-4">
                      <p className="px-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Popular categories</p>
                      <ul className="grid gap-0.5">
                        {g.categories.map((c) => (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              onClick={() => setOpen(null)}
                              aria-current={pathname === c.href ? "page" : undefined}
                              className="flex h-9 items-center rounded-md px-2 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none aria-[current=page]:bg-accent aria-[current=page]:font-medium"
                            >
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
