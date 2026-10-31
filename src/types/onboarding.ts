import type { OnboardingStep } from "@/constants/onboarding"

/**
 * What the onboarding wizard receives from `GET /api/onboarding`. Stable DTOs,
 * never Prisma rows. Only the signed-in user's OWN data is in here — no other
 * user's phone or email ever leaves the server (SY-04 / BR-02).
 */

export interface OnboardingOptionDto {
  id: string
  name: string
}

export interface OnboardingCityDto extends OnboardingOptionDto {
  areas: OnboardingOptionDto[]
}

export interface OnboardingCategoryDto extends OnboardingOptionDto {
  /** Parent category name, so sub-categories read "سباكة · تركيب السخانات". */
  parentName: string | null
  /** FIXED-only categories can't be requested as quotes, QUOTE-only can't hold fixed-price services. */
  allowsFixedPrice: boolean
}

export interface OnboardingFileDto {
  id: string
  mimeType: string
  sizeBytes: number
  /** Owner-only preview route (short-lived signed redirect). Never a public URL. */
  previewUrl: string
}

export interface OnboardingDocumentDto extends OnboardingFileDto {
  type: "NATIONAL_ID" | "SELFIE" | "CERTIFICATE" | "OTHER"
}

export interface OnboardingStateDto {
  role: "CUSTOMER" | "PROVIDER" | null
  completed: boolean
  steps: OnboardingStep[]
  currentStep: OnboardingStep
  doneSteps: OnboardingStep[]
  /** Provider only: DRAFT until submitted. */
  verificationStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | null

  /** The user's own verified phone, shown read-only (E.164). */
  phone: string | null
  basic: { name: string; email: string; cityId: string; areaId: string }
  address: { areaId: string; street: string; details: string } | null
  interests: string[]
  profile: { bio: string; yearsExperience: number | null; categoryIds: string[]; areaIds: string[] } | null
  documents: OnboardingDocumentDto[]
  service: {
    id: string
    title: string
    categoryId: string
    description: string
    price: number
    durationMinutes: number
    images: OnboardingFileDto[]
  } | null
  /** Uploaded service images not yet attached to a saved service (resume after refresh). */
  pendingServiceImages: OnboardingFileDto[]

  options: { cities: OnboardingCityDto[]; categories: OnboardingCategoryDto[] }
}

export interface OnboardingFinishDto {
  role: "CUSTOMER" | "PROVIDER"
  /** Where to send the user next. */
  redirectTo: string
}
