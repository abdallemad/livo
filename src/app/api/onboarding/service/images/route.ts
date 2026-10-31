import { created, parseUpload, toErrorResponse } from "@/lib/api-route"
import { MAX_IMAGE_BYTES } from "@/constants/upload"
import { requireUser } from "@/services/auth.service"
import { uploadServiceImage } from "@/services/onboarding.service"

/** POST /api/onboarding/service/images — one service image (multipart `file`), attached when the service is saved. */
export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const { file } = await parseUpload(request, MAX_IMAGE_BYTES)
    return created(await uploadServiceImage(user.id, file))
  } catch (error) {
    return toErrorResponse(error, "Couldn't upload the photo.")
  }
}
