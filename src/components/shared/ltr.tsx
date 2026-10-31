import { cn } from "@/lib/utils"

/**
 * Isolates an LTR run (phone, order id, email, Latin brand name) inside RTL
 * text so digits and punctuation don't scramble (docs/DESIGN-SYSTEM.md §6.5).
 */
export function Ltr({ className, ...props }: React.ComponentProps<"bdi">) {
  return <bdi dir="ltr" className={cn("tabular-nums", className)} {...props} />
}
