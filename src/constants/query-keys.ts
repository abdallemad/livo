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
}
