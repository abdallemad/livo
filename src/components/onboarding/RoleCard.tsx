"use client"

import type { LucideIcon } from "lucide-react"
import { CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface RoleCardProps {
  value: "CUSTOMER" | "PROVIDER"
  title: string
  description: string
  icon: LucideIcon
  checked: boolean
  onSelect: () => void
  name: string
}

/** A big selectable card backed by a real radio input (keyboard arrows + screen readers work as a radio group). */
export function RoleCard({ value, title, description, icon: Icon, checked, onSelect, name }: RoleCardProps) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col gap-3 rounded-xl border-2 bg-card p-5 transition-colors md:p-6",
        "has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2",
        checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="sr-only" />
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full",
          checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="font-heading text-xl font-semibold">{title}</span>
      <span className="text-muted-foreground">{description}</span>
      {checked ? <CheckCircle2 className="absolute end-4 top-4 size-6 text-primary" aria-hidden /> : null}
    </label>
  )
}
