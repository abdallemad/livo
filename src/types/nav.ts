import type { LucideIcon } from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Active only on an exact match (dashboard roots like `/account`). */
  exact?: boolean
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}
