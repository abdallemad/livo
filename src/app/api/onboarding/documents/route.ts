import { created, parseUpload, toErrorResponse } from "@/lib/api-route"
import { ValidationError } from "@/lib/errors"
import { MAX_PDF_BYTES } from "@/constants/upload"
import { documentTypeSchema } from "@/schemas/onboarding.schema"
import { requireUser } from "@/services/auth.service"
import { uploadDocument } from "@/services/onboarding.service"

/**
 * POST /api/onboarding/documents — provider step 4 (PR-02), multipart:
 * `type` + `file`. Stored in the PRIVATE bucket; no public route ever serves it.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const { file, fields } = await parseUpload(request, MAX_PDF_BYTES)
    const type = documentTypeSchema.safeParse(fields.type)
    if (!type.success) throw new ValidationError("راجع البيانات.", { type: ["اختار نوع المستند."] })
    return created(await uploadDocument(user.id, type.data, file))
  } catch (error) {
    return toErrorResponse(error, "تعذّر رفع المستند.")
  }
}
