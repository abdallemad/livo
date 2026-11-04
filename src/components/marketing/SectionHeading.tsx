import { AnimatedTitle } from "@/components/motion/AnimatedTitle"
import { cn } from "@/lib/utils"

/**
 * Section title in the marketing website's style (`.sh`): a huge outlined "ghost" word behind a centred heading and
 * an optional lead line. The ghost word is decorative (`aria-hidden`); the heading keeps the real text and its id for
 * `aria-labelledby`. `tone="onDark"` lightens it for navy / gradient bands. Needs `MotionProvider` above it.
 */
export function SectionHeading({
  id,
  title,
  ghost,
  lead,
  align = "center",
  tone = "default",
  as = "h2",
  className,
}: {
  id?: string
  title: string
  /** One short word drawn huge and outlined behind the title, e.g. "Trust". */
  ghost?: string
  lead?: React.ReactNode
  align?: "center" | "start"
  tone?: "default" | "onDark"
  as?: "h1" | "h2"
  className?: string
}) {
  const center = align === "center"
  return (
    <div
      className={cn(
        "relative flex min-h-[clamp(86px,11vw,170px)] items-center overflow-hidden",
        center ? "justify-center text-center" : "justify-start text-start",
        className,
      )}
    >
      {ghost ? (
        <span
          aria-hidden
          className={cn(
            "ghost-text absolute top-1/2 -translate-y-1/2 text-[clamp(56px,13.5vw,200px)]",
            center ? "start-1/2 -translate-x-1/2 rtl:translate-x-1/2" : "-start-2",
            tone === "onDark" && "[-webkit-text-stroke-color:rgb(255_255_255/0.18)]",
          )}
        >
          {ghost}
        </span>
      ) : null}
      <div className={cn("relative max-w-2xl px-2.5", center && "mx-auto")}>
        <AnimatedTitle
          as={as}
          id={id}
          text={title}
          className={cn(
            "font-bold tracking-tight",
            as === "h1" ? "text-[clamp(28px,4vw,52px)] leading-[1.08]" : "text-[clamp(24px,3.4vw,40px)] leading-[1.15]",
            tone === "onDark" && "text-white",
          )}
        />
        {lead ? (
          <p className={cn("mt-2 text-[clamp(14.5px,1.3vw,17px)]", tone === "onDark" ? "text-[#c9cee8]" : "text-muted-foreground")}>
            {lead}
          </p>
        ) : null}
      </div>
    </div>
  )
}
