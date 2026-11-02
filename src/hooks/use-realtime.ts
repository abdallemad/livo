"use client"

import { useEffect, useRef } from "react"
import { getPusherClient } from "@/lib/pusher-client"

/** Components listening per channel, so the last one to leave unsubscribes (several may share a channel). */
const listeners = new Map<string, number>()

/**
 * Listen to one Pusher event on a private channel while mounted (docs/realtime-feature.md). `channel = null` (or Pusher
 * not configured) does nothing — callers keep their polling fallback. The handler may change every render.
 */
export function useChannelEvent<T>(channel: string | null, event: string, handler: (data: T) => void) {
  const latest = useRef(handler)
  useEffect(() => {
    latest.current = handler
  })

  useEffect(() => {
    const pusher = getPusherClient()
    if (!pusher || !channel) return
    const sub = pusher.subscribe(channel)
    listeners.set(channel, (listeners.get(channel) ?? 0) + 1)
    const onEvent = (data: T) => latest.current(data)
    sub.bind(event, onEvent)
    return () => {
      sub.unbind(event, onEvent)
      const left = (listeners.get(channel) ?? 1) - 1
      if (left <= 0) {
        listeners.delete(channel)
        pusher.unsubscribe(channel)
      } else listeners.set(channel, left)
    }
  }, [channel, event])
}
