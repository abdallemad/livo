/** Pure formatters. Currency is EGP and the locale Arabic-Egypt (SRS A2/A3). */
const currency = new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP", maximumFractionDigits: 0 })
const date = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" })

export const formatPrice = (amount: number | string) => currency.format(Number(amount))
export const formatDate = (value: Date | string) => date.format(new Date(value))
