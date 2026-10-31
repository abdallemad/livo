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
