import type { Role } from "@prisma/client"

/** What the browser learns about the signed-in user (`GET /api/me`). */
export interface ViewerDto {
  id: string
  role: Role
}
