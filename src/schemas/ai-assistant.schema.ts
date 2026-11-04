import { z } from "zod"
import { ASSISTANT_LIMITS } from "@/utils/ai-assistant"

/**
 * `POST /api/assistant/chat` (docs/ai-assistant-feature.md). The client sends the visible conversation; it can't
 * send a `system` turn or claim a role — the viewer's role comes from the session, the instructions from the server.
 */
export const assistantMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  text: z.string().trim().min(1).max(ASSISTANT_LIMITS.messageMax, `Keep it under ${ASSISTANT_LIMITS.messageMax} characters.`),
})

export const assistantChatSchema = z.object({
  messages: z
    .array(assistantMessageSchema)
    .min(1, "Write a message.")
    .max(ASSISTANT_LIMITS.historyMax)
    .refine((m) => m[m.length - 1]?.role === "user", "The last message must be yours."),
  /** The dashboard page the panel is open on; resolved to a known section on the server, never prompted verbatim. */
  path: z.string().trim().max(300).optional(),
})
export type AssistantChatValues = z.infer<typeof assistantChatSchema>

/**
 * What Gemini must answer (sent as its JSON response schema, then re-validated here — model output is untrusted).
 * Lenient on purpose: bad optional fields are dropped, not fatal.
 */
export const assistantModelReplySchema = z.object({
  reply: z.string().trim().min(1),
  /** A link key from the mode's table; an unknown key is dropped when mapping (utils/ai-assistant.ts). */
  action: z.string().trim().catch("none"),
  categorySlug: z.string().trim().nullish().catch(null),
  estimatedPrice: z.string().trim().nullish().catch(null),
  tips: z.array(z.string().trim()).catch([]).default([]),
  quickReplies: z.array(z.string().trim()).catch([]).default([]),
  draft: z.string().trim().nullish().catch(null),
})
export type AssistantModelReply = z.infer<typeof assistantModelReplySchema>
