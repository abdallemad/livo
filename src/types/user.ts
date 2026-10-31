import type { Role } from "@prisma/client"

/** What the browser learns about the signed-in user (`GET /api/me`). */
export interface ViewerDto {
  id: string
  role: Role
  /** False until the onboarding wizard is finished (admins: always true). Decides where to send the user. */
  onboardingCompleted: boolean
}
