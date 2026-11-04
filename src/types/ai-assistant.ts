/**
 * Livo AI Assistant contracts shared by the chat route and the browser (docs/ai-assistant-feature.md).
 * The conversation lives only in the visitor's tab — nothing is stored in the database.
 */
export type AssistantRole = "user" | "assistant"

/**
 * Where the assistant runs: `public` on the marketing pages (anyone), `customer` in `/account` (grounded in the
 * customer's own requests and bookings), `provider` in `/provider` (grounded in the provider's work).
 */
export type AssistantMode = "public" | "customer" | "provider"

export interface AssistantMessage {
  role: AssistantRole
  text: string
}

/** A next step the assistant suggests. `href` is built on the server from a fixed link table — never by the model. */
export interface AssistantAction {
  /** The link key from the mode's table (`book_service`, `new_request`, `quotes`, …). */
  kind: string
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
  /** Ready-to-use text the user can copy (a quote message, a service description, a reply to a customer…), or null. */
  draft: string | null
}
