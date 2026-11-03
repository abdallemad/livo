"use client"

import { useMutation } from "@tanstack/react-query"
import { API_ROUTES } from "@/constants/api-routes"
import { api } from "@/lib/api-client"
import type { AssistantChatValues } from "@/schemas/ai-assistant.schema"
import type { AssistantReply } from "@/types/ai-assistant"

/**
 * One Livo AI Assistant turn (docs/ai-assistant-feature.md). The conversation is kept in the panel's state, not in the
 * query cache — it's per tab and never stored. Failures (429 / 503) surface as `ApiError` with a friendly message.
 */
export function useAssistantChat() {
  return useMutation({
    mutationFn: (values: AssistantChatValues) => api.post<AssistantReply>(API_ROUTES.assistantChat, values),
  })
}
