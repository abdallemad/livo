import { MAX_IMAGE_BYTES } from "@/constants/upload"
import { created, parseUpload, toErrorResponse } from "@/lib/api-route"
import { requireRole } from "@/services/auth.service"
import { uploadRequestPhoto } from "@/services/new-request.service"

/**
 * POST /api/me/requests/images — one photo for a new quote request (multipart `file`), validated by magic bytes and
 * stored privately; attached when the request is sent (docs/customer-new-request-feature.md).
 */
export async function POST(request: Request) {
  try {
    const user = await requireRole("CUSTOMER")
    const { file } = await parseUpload(request, MAX_IMAGE_BYTES)
    return created(await uploadRequestPhoto(user.id, file))
  } catch (error) {
    return toErrorResponse(error, "Couldn't upload the photo.")
  }
}
