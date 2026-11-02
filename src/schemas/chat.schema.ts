import { z } from "zod"
import { MESSAGE_MAX } from "@/utils/chat"

/** `POST /api/me/messages/[bookingId]` and `/api/provider/messages/[bookingId]` — docs/messages-feature.md. */
export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Write a message.").max(MESSAGE_MAX, `Keep it under ${MESSAGE_MAX} characters.`),
  /** Client-made id so the sender's optimistic bubble and the pushed copy are recognised as the same message. */
  clientId: z.string().trim().max(64).optional(),
})
export type SendMessageValues = z.infer<typeof sendMessageSchema>
