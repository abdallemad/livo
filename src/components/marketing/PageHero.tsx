import { cn } from "@/lib/utils"

/**
 * Inner-page hero in the marketing website's style (`.pgh`): optional breadcrumb, a huge outlined "ghost" word behind
 * the centred H1, and a lead line, over the soft lavender page wash. Server-safe (no motion), so static pages stay
 * static. The ghost word is decorative (`aria-hidden`).
 */
export function PageHero({
  title,
  ghost,
  lead,
  crumbs,
  children,
  className,
}: {
  title: string
  /** One short word drawn huge behind the title; defaults to the title's first word. */
  ghost?: string
  lead?: React.ReactNode
  /** Breadcrumb element (e.g. `<Crumbs />`), shown centred above the title. */
  crumbs?: React.ReactNode
  /** Extra content under the lead (meta line, actions). */
  children?: React.ReactNode
  className?: string
}) {
  const word = ghost ?? title.split(/\s+/)[0]
  return (
    <header className={cn("relative isolate overflow-hidden bg-page-gradient", className)}>
      <span aria-hidden className="drift absolute -start-[20vw] -top-[30vw] -z-10 size-[60vw] rounded-full bg-[radial-gradient(circle_closest-side,rgb(123_47_247/0.16),transparent)]" />
      <span aria-hidden className="drift absolute -end-[15vw] top-0 -z-10 size-[45vw] rounded-full bg-[radial-gradient(circle_closest-side,rgb(255_61_90/0.14),transparent)] [animation-duration:30s]" />
      <div className="mx-auto max-w-6xl px-4 pt-[clamp(26px,4vw,56px)] pb-10 text-center md:px-6 md:pb-14">
        {crumbs ? <div className="mb-2 flex justify-center [&_ol]:justify-center">{crumbs}</div> : null}
        <div className="relative flex min-h-[clamp(86px,11vw,170px)] items-center justify-center overflow-hidden">
          <span aria-hidden className="ghost-text absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(56px,13.5vw,200px)] rtl:translate-x-1/2">
            {word}
          </span>
          <h1 className="relative max-w-3xl px-2.5 text-[clamp(28px,4vw,52px)] leading-[1.08] font-bold tracking-tight text-balance">{title}</h1>
        </div>
        {lead ? <p className="mx-auto mt-2 max-w-2xl text-[clamp(15px,1.3vw,18px)] text-muted-foreground">{lead}</p> : null}
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    </header>
  )
}
