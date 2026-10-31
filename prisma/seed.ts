/**
 * Seed data for local development. Run with `npm run db:seed`.
 * Node strips the types natively (22.18+). Never seed `User` rows: their ids
 * are Clerk ids and a fake one would collide with a real sign-in.
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  // Add reference data (service categories, areas…) here as features land.
  console.log("[seed] nothing to seed yet")
}

main()
  .catch((error) => {
    console.error("[seed] failed", error)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
