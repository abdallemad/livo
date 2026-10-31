/**
 * `npm run build`: sets NEXT_DEPLOYMENT_ID (version-skew protection), runs
 * `next build --webpack`, then prepares the standalone output.
 */
import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import { resolveDeploymentId } from "./deployment-id.mjs"
import { prepareStandalone } from "./prepare-standalone.mjs"

const deploymentId = resolveDeploymentId()
console.log(`[build] NEXT_DEPLOYMENT_ID=${deploymentId}`)

// Run Next's CLI with this Node binary directly: no shell, same on Windows and Linux.
const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next")
const result = spawnSync(process.execPath, [nextBin, "build", "--webpack"], {
  stdio: "inherit",
  env: { ...process.env, NEXT_DEPLOYMENT_ID: deploymentId },
})

if (result.status !== 0) process.exit(result.status ?? 1)

prepareStandalone()
