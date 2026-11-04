import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border-2 border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[transform,background-color,box-shadow,color,border-color] duration-150 outline-none hover:not-disabled:-translate-y-0.5 select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-0 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** Navy pill (website `.btn.p`). */
        default: "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90",
        /** White pill with a navy outline (website `.btn.s`). */
        outline:
          "border-primary/85 bg-card text-foreground hover:bg-soft aria-expanded:bg-soft dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-accent hover:text-violet aria-expanded:bg-accent dark:hover:text-foreground",
        ghost:
          "hover:not-disabled:translate-y-0 hover:bg-soft hover:text-violet aria-expanded:bg-soft aria-expanded:text-violet dark:hover:bg-muted dark:hover:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-violet underline-offset-4 hover:not-disabled:translate-y-0 hover:underline dark:text-primary",
        /** Brand-gradient commitment action (book, accept, pay, release) — website `.btn.pk`. Max ONE per screen — docs/DESIGN-SYSTEM.md §2. */
        commit:
          "btn-shine bg-brand-gradient bg-origin-border text-white shadow-glow hover:shadow-[0_22px_34px_-14px_rgb(196_43_155/0.8)] focus-visible:ring-violet/40",
      },
      size: {
        /** 44px — the floor for touch targets (§4). */
        default:
          "h-11 gap-2 px-5 has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3",
        /** 28px — dense inline chips only; never a primary control. */
        xs: "h-7 gap-1 px-2.5 border text-xs has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3",
        /** 36px — admin tables / toolbars only. */
        sm: "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2",
        /** 52px — hero and mobile primary actions. */
        lg: "h-13 gap-2 px-7 text-base has-data-[icon=inline-end]:pe-5 has-data-[icon=inline-start]:ps-5 [&_svg:not([class*='size-'])]:size-5",
        icon: "size-11",
        "icon-xs": "size-7 border [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-13 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
  /**
   * Async state: shows a spinner, disables the button and keeps its width
   * (the label stays in the layout, just invisible) so nothing shifts.
   */
  loading?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  children,
  render,
  nativeButton,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      render={render}
      // `render={<Link />}` swaps the <button> for an <a>: tell Base UI so it adds
      // role/keyboard semantics instead of warning. Pass `nativeButton` to override.
      nativeButton={nativeButton ?? !render}
      className={cn(buttonVariants({ variant, size, className }), loading && "relative")}
      {...props}
    >
      {loading ? (
        <>
          <span className="invisible inline-flex items-center gap-[inherit]">{children}</span>
          <Loader2 aria-hidden className="absolute animate-spin" />
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
