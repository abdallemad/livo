-- 2026-11-02: admin moderation of fixed-price services (AD-02, docs/admin-catalog-feature.md). Additive and idempotent.
-- An admin can hide a listing independently of the provider's own `isActive` switch.

-- AlterTable
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "hiddenByAdminAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "hiddenByAdminReason" TEXT;
