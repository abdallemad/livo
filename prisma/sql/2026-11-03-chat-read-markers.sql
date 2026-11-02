-- 2026-11-03: chat read markers (docs/messages-feature.md — unread counts). Additive and idempotent.
-- When each side of a booking last read its chat; a message from the other side after this time is unread.

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "customerLastReadAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "providerLastReadAt" TIMESTAMP(3);
