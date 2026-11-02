"use client"

import PusherJS from "pusher-js"
import { API_ROUTES } from "@/constants/api-routes"

/**
 * The browser's one Pusher connection (docs/realtime-feature.md), created on first use and shared by every component.
 * `null` when `NEXT_PUBLIC_PUSHER_KEY` / `…_CLUSTER` aren't set — callers then fall back to polling. Private channels are
 * signed by `POST /api/realtime/auth` (same-origin cookie session, so the CSRF guard lets it through).
 */
let client: PusherJS | null | undefined

export function getPusherClient(): PusherJS | null {
  if (client !== undefined) return client
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  client = key && cluster ? new PusherJS(key, { cluster, forceTLS: true, channelAuthorization: { endpoint: API_ROUTES.realtimeAuth, transport: "ajax" } }) : null
  return client
}
