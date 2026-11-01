/**
 * Central TanStack Query key factories. One `xxxKeys` object per feature so
 * invalidation (`queryClient.invalidateQueries({ queryKey: xxxKeys.all })`)
 * never misses a cached variant.
 */
export const viewerKeys = {
  all: ["viewer"] as const,
  me: () => [...viewerKeys.all, "me"] as const,
}

export const onboardingKeys = {
  all: ["onboarding"] as const,
  state: () => [...onboardingKeys.all, "state"] as const,
}

export const providerKeys = {
  all: ["provider"] as const,
  dashboard: () => [...providerKeys.all, "dashboard"] as const,
  requests: () => [...providerKeys.all, "requests"] as const,
  requestList: (query: object) => [...providerKeys.requests(), "list", query] as const,
  quotes: () => [...providerKeys.all, "quotes"] as const,
  quoteList: (query: object) => [...providerKeys.quotes(), "list", query] as const,
  bookings: () => [...providerKeys.all, "bookings"] as const,
  bookingList: (query: object) => [...providerKeys.bookings(), "list", query] as const,
  booking: (id: string) => [...providerKeys.bookings(), "detail", id] as const,
  services: () => [...providerKeys.all, "services"] as const,
  service: (id: string) => [...providerKeys.services(), "detail", id] as const,
  portfolio: () => [...providerKeys.all, "portfolio"] as const,
  schedule: () => [...providerKeys.all, "schedule"] as const,
  earnings: (query: object) => [...providerKeys.all, "earnings", query] as const,
  payouts: (query: object) => [...providerKeys.all, "payouts", query] as const,
  reviews: () => [...providerKeys.all, "reviews"] as const,
  reviewList: (query: object) => [...providerKeys.reviews(), "list", query] as const,
}

export const adminKeys = {
  all: ["admin"] as const,
  dashboard: () => [...adminKeys.all, "dashboard"] as const,
  providers: () => [...adminKeys.all, "providers"] as const,
  providerList: (query: object) => [...adminKeys.providers(), "list", query] as const,
  provider: (id: string) => [...adminKeys.providers(), "detail", id] as const,
  users: () => [...adminKeys.all, "users"] as const,
  userList: (query: object) => [...adminKeys.users(), "list", query] as const,
  user: (id: string) => [...adminKeys.users(), "detail", id] as const,
  categories: () => [...adminKeys.all, "categories"] as const,
  services: () => [...adminKeys.all, "services"] as const,
  serviceList: (query: object) => [...adminKeys.services(), "list", query] as const,
  requests: () => [...adminKeys.all, "requests"] as const,
  requestList: (query: object) => [...adminKeys.requests(), "list", query] as const,
  request: (id: string) => [...adminKeys.requests(), "detail", id] as const,
  bookings: () => [...adminKeys.all, "bookings"] as const,
  bookingList: (query: object) => [...adminKeys.bookings(), "list", query] as const,
  booking: (id: string) => [...adminKeys.bookings(), "detail", id] as const,
  payments: () => [...adminKeys.all, "payments"] as const,
  paymentList: (query: object) => [...adminKeys.payments(), "list", query] as const,
  payouts: () => [...adminKeys.all, "payouts"] as const,
  payoutList: (query: object) => [...adminKeys.payouts(), "list", query] as const,
  commission: () => [...adminKeys.all, "commission"] as const,
  disputes: () => [...adminKeys.all, "disputes"] as const,
  disputeList: (query: object) => [...adminKeys.disputes(), "list", query] as const,
  dispute: (id: string) => [...adminKeys.disputes(), "detail", id] as const,
  reviews: () => [...adminKeys.all, "reviews"] as const,
  reviewList: (query: object) => [...adminKeys.reviews(), "list", query] as const,
}
