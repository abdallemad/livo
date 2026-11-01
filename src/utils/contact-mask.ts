/**
 * Hides phone numbers, emails and chat links in customer-written text shown to a provider before
 * the booking is confirmed (SY-04, BR-02, business analysis R1 — leakage). Pure and tested.
 * Handles Western and Arabic-Indic digits, `+20` / `00` prefixes and spaced or dashed numbers.
 */
export const HIDDEN_CONTACT = "[hidden until the booking is confirmed]"

const DIGIT = "[0-9\\u0660-\\u0669\\u06F0-\\u06F9]"
// 8+ digits, optionally separated by spaces / dashes / dots / brackets (Egyptian mobiles are 11 digits).
const PHONE = new RegExp(`(?:\\+|00)?(?:${DIGIT}[\\s\\-.()]{0,2}){7,}${DIGIT}`, "g")
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/g
const LINKS = /\b(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com|t\.me|m\.me)\/\S*/gi

export function maskContactDetails(text: string): { text: string; masked: boolean } {
  let masked = false
  const hide = () => {
    masked = true
    return HIDDEN_CONTACT
  }
  const out = text.replace(LINKS, hide).replace(EMAIL, hide).replace(PHONE, hide)
  return { text: out, masked }
}
