-- 2026-11-01: onboarding groundwork (docs/onboarding-feature.md). Additive and idempotent.
-- User.roleSelectedAt / onboardingCompletedAt / cityId (+ FK to City, SET NULL) and CustomerInterest.

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cityId" TEXT,
ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "roleSelectedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CustomerInterest" (
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerInterest_pkey" PRIMARY KEY ("userId","categoryId")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomerInterest_categoryId_idx" ON "CustomerInterest"("categoryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_cityId_idx" ON "User"("cityId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "CustomerInterest" ADD CONSTRAINT "CustomerInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "CustomerInterest" ADD CONSTRAINT "CustomerInterest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
