import { cn } from "@/lib/utils"

/**
 * Isolates an LTR run (phone, order id, email, brand name) so that, if the UI
 * is ever switched back to RTL, digits and punctuation don't scramble
 * (docs/DESIGN-SYSTEM.md §6.5).
 */
export function Ltr({ className, ...props }: React.ComponentProps<"bdi">) {
  return <bdi dir="ltr" className={cn("tabular-nums", className)} {...props} />
}
