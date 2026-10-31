-- 2026-10-31 — baseline: Role enum, User, File. Idempotent and additive.
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'PROVIDER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id"        TEXT PRIMARY KEY,
  "role"      "Role" NOT NULL DEFAULT 'CUSTOMER',
  "email"     TEXT,
  "phone"     TEXT,
  "name"      TEXT,
  "imageUrl"  TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

CREATE TABLE IF NOT EXISTS "File" (
  "id"         TEXT PRIMARY KEY,
  "key"        TEXT NOT NULL,
  "mimeType"   TEXT NOT NULL,
  "size"       INTEGER NOT NULL,
  "sha256"     TEXT NOT NULL,
  "uploadedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "File_key_key" ON "File"("key");
CREATE INDEX IF NOT EXISTS "File_uploadedBy_idx" ON "File"("uploadedBy");
