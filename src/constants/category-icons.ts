import {
  Bath,
  Brush,
  Droplets,
  Hammer,
  House,
  KeyRound,
  Lamp,
  PaintRoller,
  Shovel,
  Snowflake,
  Sofa,
  Sparkles,
  Trees,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react"

/**
 * `Category.iconKey` → icon. Categories are data (NF-09), but the icon must be
 * one the bundle ships, so the admin picks from this list. Keys match the seed.
 */
export const CATEGORY_ICONS = {
  droplets: Droplets,
  zap: Zap,
  sparkles: Sparkles,
  "paint-roller": PaintRoller,
  snowflake: Snowflake,
  hammer: Hammer,
  wrench: Wrench,
  brush: Brush,
  bath: Bath,
  lamp: Lamp,
  sofa: Sofa,
  house: House,
  "key-round": KeyRound,
  shovel: Shovel,
  trees: Trees,
  truck: Truck,
} satisfies Record<string, LucideIcon>

export type CategoryIconKey = keyof typeof CATEGORY_ICONS
export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS) as [CategoryIconKey, ...CategoryIconKey[]]

export const categoryIcon = (key: string | null | undefined): LucideIcon | null =>
  key && key in CATEGORY_ICONS ? CATEGORY_ICONS[key as CategoryIconKey] : null

export const CATEGORY_TYPE_LABEL = {
  FIXED: "Fixed price",
  QUOTE: "Quotes",
  BOTH: "Fixed price + quotes",
} as const

export const CATEGORY_TYPE_HELP = {
  FIXED: "Providers list services with a set price; customers book directly.",
  QUOTE: "Customers post a project request and compare provider quotes.",
  BOTH: "Both fixed-price services and quote requests.",
} as const
