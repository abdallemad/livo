import { ONBOARDING_STEPS, PROVIDER_BIO_MIN, type OnboardingStep } from "@/constants/onboarding"

/**
 * Pure onboarding state machine (docs/onboarding-feature.md). The service
 * loads a snapshot from the DB and this decides where the user is — the
 * client never tells the server which step it's on. Pure so it's unit-tested.
 */

export type OnboardingRole = "CUSTOMER" | "PROVIDER"

export interface OnboardingSnapshot {
  role: "CUSTOMER" | "PROVIDER" | "ADMIN"
  roleSelectedAt: Date | null
  onboardingCompletedAt: Date | null
  name: string
  cityId: string | null
  hasDefaultAddress: boolean
  interestsCount: number
  provider: {
    verificationStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
    bio: string | null
    yearsExperience: number | null
    categoriesCount: number
    areasCount: number
    documentTypes: string[]
    servicesCount: number
    /** At least one chosen category allows fixed-price services (type FIXED or BOTH). */
    canOfferFixedPrice: boolean
  } | null
}

export interface OnboardingState {
  /** null until the user picks a role in step 1. */
  role: OnboardingRole | null
  completed: boolean
  steps: readonly OnboardingStep[]
  /** First step that still needs input; the wizard opens here. */
  currentStep: OnboardingStep
  /** Steps whose required data is saved (optional steps count once visited/saved). */
  doneSteps: OnboardingStep[]
}

export const REQUIRED_DOCUMENTS = ["NATIONAL_ID", "SELFIE"] as const

function stepDone(step: OnboardingStep, s: OnboardingSnapshot): boolean {
  const p = s.provider
  switch (step) {
    case "role":
      return s.roleSelectedAt !== null
    case "basic":
      // Providers also need a primary area, stored as their first ProviderArea.
      return s.name.trim().length > 0 && s.cityId !== null && (s.role !== "PROVIDER" || (p?.areasCount ?? 0) > 0)
    case "address":
      return s.hasDefaultAddress
    case "interests":
      return s.interestsCount > 0
    case "profile":
      return (
        !!p &&
        (p.bio?.trim().length ?? 0) >= PROVIDER_BIO_MIN &&
        p.yearsExperience !== null &&
        p.categoriesCount > 0 &&
        p.areasCount > 0
      )
    case "documents":
      return !!p && REQUIRED_DOCUMENTS.every((t) => p.documentTypes.includes(t))
    case "service":
      // Quote-only trades (e.g. finishing) can't hold a fixed-price service; don't trap those providers.
      return !!p && (p.servicesCount > 0 || (p.categoriesCount > 0 && !p.canOfferFixedPrice))
    case "review":
      return !!p && p.verificationStatus !== "DRAFT"
  }
}

/** Steps a customer may leave empty; the wizard lets them skip, and "done" doesn't depend on them. */
export const OPTIONAL_STEPS: readonly OnboardingStep[] = ["address", "interests"]

export function deriveOnboardingState(s: OnboardingSnapshot): OnboardingState {
  // Admins are set by hand and never onboard; treat them as done.
  if (s.role === "ADMIN") {
    return { role: null, completed: true, steps: [], currentStep: "role", doneSteps: [] }
  }
  const role: OnboardingRole | null = s.roleSelectedAt ? s.role : null
  const steps = role ? ONBOARDING_STEPS[role] : (["role"] as const)
  const doneSteps = steps.filter((step) => stepDone(step, s))
  const completed = s.onboardingCompletedAt !== null
  // Required steps first: an optional step never blocks the user.
  const currentStep =
    steps.find((step) => !doneSteps.includes(step) && !OPTIONAL_STEPS.includes(step)) ??
    steps.find((step) => !doneSteps.includes(step)) ??
    steps[steps.length - 1]
  return { role, completed, steps, currentStep, doneSteps }
}

/**
 * May the user save `step` now? Rejects editing after completion, steps of the
 * other role, and jumping past a required step that isn't done yet.
 */
export function assertStepEditable(
  state: OnboardingState,
  step: OnboardingStep
): { ok: true } | { ok: false; reason: "COMPLETED" | "WRONG_ROLE" | "LOCKED" } {
  if (state.completed) return { ok: false, reason: "COMPLETED" }
  if (step === "role") return { ok: true }
  if (!state.role || !state.steps.includes(step)) return { ok: false, reason: "WRONG_ROLE" }
  const index = state.steps.indexOf(step)
  const blocked = state.steps
    .slice(0, index)
    .some((s) => !OPTIONAL_STEPS.includes(s) && !state.doneSteps.includes(s))
  return blocked ? { ok: false, reason: "LOCKED" } : { ok: true }
}

/** Every required step of the role is done, so the user may finish (customer) or submit (provider). */
export function canFinish(state: OnboardingState): boolean {
  if (!state.role || state.completed) return false
  const finalStep = state.steps[state.steps.length - 1]
  return state.steps
    .filter((s) => s !== finalStep && !OPTIONAL_STEPS.includes(s))
    .every((s) => state.doneSteps.includes(s))
}

/** Where a signed-in user belongs after sign-in (`/auth-callback`). */
export function homeFor(viewer: { role: "CUSTOMER" | "PROVIDER" | "ADMIN"; onboardingCompleted: boolean }): string {
  if (viewer.role === "ADMIN") return "/admin"
  if (!viewer.onboardingCompleted) return "/onboarding"
  return viewer.role === "PROVIDER" ? "/provider" : "/account"
}
