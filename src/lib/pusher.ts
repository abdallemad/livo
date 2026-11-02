import "server-only"
import Pusher from "pusher"
import { getPusherEnv } from "@/config/env"
import { REALTIME_EVENTS, type LiveNotification, userChannel } from "@/constants/realtime"

/**
 * Server side of Pusher Channels (docs/realtime-feature.md). One lazy client. **Publishing is best effort**: the database
 * row is the fact, a push only makes it appear sooner — so a missing config or a Pusher outage is logged and never
 * fails the request that triggered it. Call it **after** the transaction commits, never inside one.
 */
let client: Pusher | null | undefined

function getPusher(): Pusher | null {
  if (client !== undefined) return client
  const env = getPusherEnv()
  client = env ? new Pusher({ appId: env.appId, key: env.key, secret: env.secret, cluster: env.cluster, useTLS: true }) : null
  return client
}

export const isRealtimeConfigured = () => getPusher() !== null

export async function publish(channel: string, event: string, data: unknown): Promise<void> {
  const pusher = getPusher()
  if (!pusher) return
  try {
    await pusher.trigger(channel, event, data)
  } catch (e) {
    console.error("[realtime] publish failed", { channel, event }, e)
  }
}

/** A toast for one user, wherever they are in the dashboard. */
export const pushNotification = (userId: string, n: LiveNotification) => publish(userChannel(userId), REALTIME_EVENTS.notification, n)

/** Sign a subscription the caller has already checked (`realtime.service.ts`). `null` when Pusher isn't configured. */
export function signSubscription(socketId: string, channel: string): Pusher.ChannelAuthResponse | null {
  return getPusher()?.authorizeChannel(socketId, channel) ?? null
}
