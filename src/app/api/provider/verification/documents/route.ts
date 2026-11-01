import { created, parseUpload, toErrorResponse } from "@/lib/api-route"
import { ValidationError } from "@/lib/errors"
import { MAX_PDF_BYTES } from "@/constants/upload"
import { verificationDocumentTypeSchema } from "@/schemas/provider-account.schema"
import { requireProvider } from "@/services/auth.service"
import { uploadVerificationDocument } from "@/services/provider-verification.service"

/**
 * POST /api/provider/verification/documents — multipart `type` + `file` (PR-02). Allowed per status by
 * `utils/verification.ts`; stored privately like onboarding documents.
 */
export async function POST(request: Request) {
  try {
    const user = await requireProvider()
    const { file, fields } = await parseUpload(request, MAX_PDF_BYTES)
    const type = verificationDocumentTypeSchema.safeParse(fields.type)
    if (!type.success) throw new ValidationError("Please check your details.", { type: ["Choose the document type."] })
    return created(await uploadVerificationDocument(user.id, type.data, file))
  } catch (error) {
    return toErrorResponse(error, "Couldn't upload the document.")
  }
}
