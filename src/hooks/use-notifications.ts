"use client"

import { useAuth } from "@clerk/nextjs"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { notificationKeys } from "@/constants/query-keys"
import { api } from "@/lib/api-client"
import type { MarkNotificationsReadValues, NotificationListQuery } from "@/schemas/notification.schema"
import type { NotificationList } from "@/types/notification"

/**
 * The notification centre (SY-02; docs/notifications-feature.md): the header bell and `/account/notifications`.
 * Live: `RealtimeNotifications` invalidates `notificationKeys.all` on every push, so the badge and the list update at
 * once; a 60 s poll is the fallback when Pusher isn't configured. Runs only once Clerk reports a session.
 */
export function useNotifications(query: NotificationListQuery) {
  const { isLoaded, isSignedIn } = useAuth()
  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => api.get<NotificationList>(API_ROUTES.notifications, query),
    enabled: isLoaded && !!isSignedIn,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  })
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: MarkNotificationsReadValues) => api.patch<{ updated: number }>(API_ROUTES.notificationsRead, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
