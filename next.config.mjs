/**
 * The ONE Next.js config file for this project (see CLAUDE.md §4.3 / §16 —
 * never add a second `next.config.ts`).
 *
 * Cache Components is intentionally OFF: the storefront relies on route-segment
 * `revalidate` exports (ISR), which Cache Components removes. Switching models
 * changes rendering rules app-wide, so do it deliberately, not casually.
 */
import { UPLOAD_BODY_LIMIT } from "./src/constants/upload-limit.mjs"

const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim()

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  // A CDN must not keep expired HTML for a year (default); match the ISR window.
  expireTime: 3600,
  ...(process.env.NEXT_DEPLOYMENT_ID ? { deploymentId: process.env.NEXT_DEPLOYMENT_ID } : {}),
  images: {
    remotePatterns: [
      new URL("https://img.clerk.com/**"),
      ...(r2PublicUrl ? [new URL(`${r2PublicUrl.replace(/\/$/, "")}/**`)] : []),
    ],
  },
  experimental: {
    cpus: 2,
    // == DB pool limit; keeps builds from exhausting connections.
    staticGenerationMaxConcurrency: 2,
    // Must be >= the largest upload accepted by an API route or uploads truncate.
    proxyClientMaxBodySize: UPLOAD_BODY_LIMIT,
  },
  async redirects() {
    return [
      // { source: "/old-path", destination: "/new-path", permanent: true },
    ]
  },
}

export default nextConfig
