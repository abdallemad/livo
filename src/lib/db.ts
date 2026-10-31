import "server-only"
import { PrismaClient } from "@prisma/client"
import { getDatabaseUrl } from "./database-url"

/**
 * ONE PrismaClient per process, kept on `globalThis` in every environment
 * (production included) so separately bundled chunks share a single pool.
 * Only repositories (`src/repositories`) may import this.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })

globalForPrisma.prisma = db
