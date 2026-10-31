/**
 * Pure formatters — the ONLY way prices, numbers, dates and phones reach the UI
 * (docs/DESIGN-SYSTEM.md §3). English-Egypt locale with **Western digits**
 * (`numberingSystem: "latn"`, open decision #2). Currency renders as
 * `350 EGP` — number first, then symbol. Never concatenate by hand.
 */
const LOCALE = "en-EG"
const number = new Intl.NumberFormat(LOCALE, { numberingSystem: "latn", maximumFractionDigits: 2 })
const date = new Intl.DateTimeFormat(LOCALE, { numberingSystem: "latn", dateStyle: "medium" })
const dateTime = new Intl.DateTimeFormat(LOCALE, { numberingSystem: "latn", dateStyle: "medium", timeStyle: "short" })
const time = new Intl.DateTimeFormat(LOCALE, { numberingSystem: "latn", timeStyle: "short" })

export const CURRENCY_SYMBOL = "EGP"

export const formatNumber = (value: number | string) => number.format(Number(value))

/** `formatPrice(350)` → `"350 EGP"`. Rendered inside an LTR-safe span by `PriceTag`. */
export const formatPrice = (amount: number | string) => `${formatNumber(amount)} ${CURRENCY_SYMBOL}`

export const formatDate = (value: Date | string) => date.format(new Date(value))
export const formatDateTime = (value: Date | string) => dateTime.format(new Date(value))
export const formatTime = (value: Date | string) => time.format(new Date(value))

/** Egyptian mobile `01012345678` / `+201012345678` → `+20 101 234 5678`. Unknown shapes pass through. */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "")
  const local = digits.startsWith("20") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits
  if (local.length !== 10) return value
  return `+20 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
}
