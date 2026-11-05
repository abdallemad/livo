-- 2026-11-05: external cover photo for fixed-price services (docs/service-images-feature.md). Additive and idempotent.
-- A stock / demo image URL (Unsplash, Lorem Picsum) shown on cards and the service page when the provider has not
-- uploaded a photo yet. Uploaded photos (`File` rows under uploads/services/) always win.

-- AlterTable
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
