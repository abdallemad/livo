import { BadgeCheck, HandCoins, LifeBuoy, LockKeyhole, ReceiptText, Star, type LucideIcon } from "lucide-react"
import type { TrustIconKey } from "@/constants/trust"

/** Icons for the trust copy in `constants/trust.ts` (copy stays in constants; icons are a UI concern). */
export const TRUST_ICONS: Record<TrustIconKey, LucideIcon> = {
  verified: BadgeCheck,
  payment: HandCoins,
  price: ReceiptText,
  reviews: Star,
  support: LifeBuoy,
  privacy: LockKeyhole,
}
