/**
 * Livo AI Assistant contracts shared by the chat route and the browser (docs/ai-assistant-feature.md).
 * The conversation lives only in the visitor's tab — nothing is stored in the database.
 */
export type AssistantRole = "user" | "assistant"

export interface AssistantMessage {
  role: AssistantRole
  text: string
}

export type AssistantActionKind = "book_service" | "request_quote" | "browse"

/** A next step the assistant suggests. `href` is built on the server from a real, active category — never by the model. */
export interface AssistantAction {
  kind: AssistantActionKind
  label: string
  href: string
}

export interface AssistantReply {
  reply: string
  action: AssistantAction | null
  /** Rough price guidance in EGP, as text ("250–400 EGP"), or null when the model can't tell. */
  estimatedPrice: string | null
  tips: string[]
  quickReplies: string[]
}
