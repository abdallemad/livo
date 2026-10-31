import { randomBytes } from "node:crypto"

/** 12 random bytes as hex — a fresh `NEXT_DEPLOYMENT_ID` per build unless one is provided. */
export function resolveDeploymentId(env = process.env) {
  const provided = env.NEXT_DEPLOYMENT_ID?.trim()
  return provided || randomBytes(12).toString("hex")
}
