"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { customerKeys, providerKeys } from "@/constants/query-keys"
import { bookingChannel, REALTIME_EVENTS } from "@/constants/realtime"
import { api } from "@/lib/api-client"
import type { SendMessageValues } from "@/schemas/chat.schema"
import type { ChatMessageDto, ChatThreadDto, ConversationDto } from "@/types/chat"
import { mergeMessage, type ChatSide } from "@/utils/chat"
import { useChannelEvent } from "./use-realtime"

/**
 * Booking chat (CU-06, PR-09; docs/messages-feature.md), for either side. Live through Pusher when configured
 * (`thread.realtime`), otherwise the thread polls every 10 s. Sending shows the bubble at once (optimistic, matched
 * back by `clientId`), and the pushed copy never duplicates it.
 */
const routes = (side: ChatSide) => (side === "CUSTOMER" ? API_ROUTES.customer : API_ROUTES.provider)
const keys = (side: ChatSide) => (side === "CUSTOMER" ? customerKeys : providerKeys)
const POLL_MS = 10_000

export function useConversations(side: ChatSide, initialData: ConversationDto[]) {
  return useQuery({ queryKey: keys(side).conversations(), queryFn: () => api.get<ConversationDto[]>(routes(side).messages), initialData, refetchInterval: 30_000 })
}

export function useThread(side: ChatSide, initialData: ChatThreadDto) {
  const queryClient = useQueryClient()
  const key = keys(side).thread(initialData.bookingId)
  const query = useQuery({
    queryKey: key,
    queryFn: () => api.get<ChatThreadDto>(routes(side).thread(initialData.bookingId)),
    initialData,
    refetchInterval: initialData.realtime ? false : POLL_MS,
  })
  useChannelEvent<ChatMessageDto>(bookingChannel(initialData.bookingId), REALTIME_EVENTS.message, (m) => {
    queryClient.setQueryData<ChatThreadDto>(key, (t) => (t ? { ...t, messages: mergeMessage(t.messages, m) } : t))
  })
  return query
}

export function useSendMessage(side: ChatSide, bookingId: string, me: string) {
  const queryClient = useQueryClient()
  const key = keys(side).thread(bookingId)
  return useMutation({
    mutationFn: (values: SendMessageValues) => api.post<ChatMessageDto>(routes(side).thread(bookingId), values),
    onMutate: (values) => {
      const pending: ChatMessageDto = { id: `pending-${values.clientId}`, bookingId, senderId: me, body: values.body, createdAt: new Date().toISOString(), clientId: values.clientId ?? null }
      queryClient.setQueryData<ChatThreadDto>(key, (t) => (t ? { ...t, messages: mergeMessage(t.messages, pending) } : t))
    },
    onSuccess: (m) => queryClient.setQueryData<ChatThreadDto>(key, (t) => (t ? { ...t, messages: mergeMessage(t.messages, m) } : t)),
    onError: (_e, values) =>
      queryClient.setQueryData<ChatThreadDto>(key, (t) => (t ? { ...t, messages: t.messages.filter((x) => x.clientId !== values.clientId) } : t)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys(side).conversations() }),
  })
}
