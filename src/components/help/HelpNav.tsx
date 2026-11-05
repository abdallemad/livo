import Link from "next/link"
import { HELP_NAV, type HelpPath } from "@/constants/help"
import { cn } from "@/lib/utils"

/**
 * Pill bar linking the Help pages (docs/help-pages-feature.md). The active page comes in as a prop — no
 * `usePathname()`, so it stays a Server Component and every link is a real `<a>` in the static HTML.
 * Scrolls sideways on narrow phones instead of wrapping.
 */
export function HelpNav({ active, className }: { active: HelpPath; className?: string }) {
  return (
    <nav aria-label="Help pages" className={cn("relative z-10 mx-auto -mt-6 max-w-full px-4 md:px-6", className)}>
      <ul className="mx-auto flex w-max max-w-full gap-1 overflow-x-auto rounded-full border bg-card/95 p-1.5 shadow-card backdrop-blur [scrollbar-width:none]">
        {HELP_NAV.map((l) => {
          const current = l.href === active
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  current ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-soft hover:text-violet dark:hover:bg-muted dark:hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
