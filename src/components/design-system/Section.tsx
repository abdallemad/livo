import { cn } from "@/lib/utils"

interface SectionProps {
  id: string
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

/** One block of the living style guide (`/design-system-preview`). */
export function Section({ id, title, description, children, className }: SectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-24 space-y-6 border-b py-12 last:border-b-0", className)}>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
        {description ? <p className="max-w-prose text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

export function Demo({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className={cn("flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4 md:p-6", className)}>{children}</div>
    </div>
  )
}

/** Renders children under BOTH themes side by side (the `.dark` class scopes tokens and `dark:` variants). */
export function ThemePair({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="light rounded-lg border bg-background p-4 text-foreground">
        <p className="mb-3 text-sm text-muted-foreground">فاتح</p>
        {children}
      </div>
      <div className="dark rounded-lg border bg-background p-4 text-foreground">
        <p className="mb-3 text-sm text-muted-foreground">داكن</p>
        {children}
      </div>
    </div>
  )
}
