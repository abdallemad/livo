import { created, parseUpload, toErrorResponse } from "@/lib/api-route"
import { MAX_IMAGE_BYTES } from "@/constants/upload"
import { SERVICE_PHOTOS_CAP } from "@/constants/provider-catalog"
import { requireProvider } from "@/services/auth.service"
import { uploadProviderImage } from "@/services/provider-catalog.service"

/**
 * POST /api/provider/services/images — one photo (multipart `file`), validated by magic bytes and stored
 * privately; attached to the service when the form is saved (docs/provider-services-portfolio-feature.md).
 */
export async function POST(request: Request) {
  try {
    const user = await requireProvider()
    const { file } = await parseUpload(request, MAX_IMAGE_BYTES)
    return created(await uploadProviderImage(user.id, "service", file, SERVICE_PHOTOS_CAP))
  } catch (error) {
    return toErrorResponse(error, "Couldn't upload the photo.")
  }
}
