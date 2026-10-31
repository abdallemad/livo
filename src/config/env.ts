import "server-only"
import { z } from "zod"

/**
 * Server env, validated on first use (not at import) so `next build` and tests
 * that never touch a given integration don't need its secrets.
 * Placeholders are documented in `.env.example`.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_SERVER_URL: z.url().optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | undefined

export function getServerEnv(): ServerEnv {
  cached ??= serverEnvSchema.parse(process.env)
  return cached
}
