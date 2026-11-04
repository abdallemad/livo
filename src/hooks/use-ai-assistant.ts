"use client"

import { useMutation } from "@tanstack/react-query"
import { ASSISTANT_MODES } from "@/constants/ai-assistant"
import { api } from "@/lib/api-client"
import type { AssistantChatValues } from "@/schemas/ai-assistant.schema"
import type { AssistantMode, AssistantReply } from "@/types/ai-assistant"

/**
 * One Livo AI Assistant turn (docs/ai-assistant-feature.md) for the given mode — public, customer or provider, each
 * with its own endpoint. The conversation is kept in the panel's state, not in the query cache — it's per tab and never
 * stored. Failures (429 / 503) surface as `ApiError` with a friendly message.
 */
export function useAssistantChat(mode: AssistantMode) {
  return useMutation({
    mutationFn: (values: AssistantChatValues) => api.post<AssistantReply>(ASSISTANT_MODES[mode].endpoint, values),
  })
}
