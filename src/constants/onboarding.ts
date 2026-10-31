/**
 * Onboarding limits and step lists (docs/onboarding-feature.md). One place so
 * the Zod schemas, the service rules and the UI hints can't disagree.
 */

/** Bio length for the provider's professional profile (PR-01). */
export const PROVIDER_BIO_MIN = 30
export const PROVIDER_BIO_MAX = 600
export const PROVIDER_MAX_YEARS = 60
export const PROVIDER_MAX_CATEGORIES = 6
export const PROVIDER_MAX_AREAS = 15

/** Fixed-price service bounds in EGP (PR-05). Upper bound stops typos like an extra zero. */
export const SERVICE_PRICE_MIN = 50
export const SERVICE_PRICE_MAX = 100_000
export const SERVICE_TITLE_MIN = 5
export const SERVICE_TITLE_MAX = 80
export const SERVICE_DESCRIPTION_MIN = 20
export const SERVICE_DESCRIPTION_MAX = 1_000
export const SERVICE_DURATION_MIN = 15
export const SERVICE_DURATION_MAX = 24 * 60
export const SERVICE_MAX_IMAGES = 5
/** Suggested durations for the select; any value within the bounds is accepted. */
export const SERVICE_DURATION_OPTIONS = [30, 60, 90, 120, 180, 240, 360, 480] as const

export const NAME_MIN = 2
export const NAME_MAX = 60
export const MAX_CUSTOMER_INTERESTS = 8
export const MAX_CERTIFICATES = 3

/** Bump when the provider terms change; stored in the audit log on submit. */
export const PROVIDER_TERMS_VERSION = "2026-11-01"

export const ONBOARDING_STEPS = {
  CUSTOMER: ["role", "basic", "address", "interests"],
  PROVIDER: ["role", "basic", "profile", "documents", "service", "review"],
} as const

export type CustomerStep = (typeof ONBOARDING_STEPS.CUSTOMER)[number]
export type ProviderStep = (typeof ONBOARDING_STEPS.PROVIDER)[number]
export type OnboardingStep = CustomerStep | ProviderStep

/** Step titles for the progress bar. */
export const STEP_LABELS: Record<OnboardingStep, string> = {
  role: "Account type",
  basic: "Your details",
  address: "Address",
  interests: "Your interests",
  profile: "Your professional profile",
  documents: "Verification",
  service: "First service",
  review: "Review",
}
