import "server-only"
import { GoogleGenAI } from "@google/genai"
import { getGeminiEnv } from "@/config/env"
import { ServiceUnavailableError } from "@/lib/errors"

/**
 * One lazily created Gemini client for the Livo AI Assistant (docs/ai-assistant-feature.md). Missing
 * `GEMINI_API_KEY` → 503 instead of a crash, so the rest of the app runs without the assistant.
 * The key is read through `config/env.ts` — never `process.env` directly — and never reaches the browser.
 */
let client: GoogleGenAI | undefined

export function isGeminiConfigured(): boolean {
  return getGeminiEnv() !== null
}

export function getGemini(): { client: GoogleGenAI; models: string[] } {
  const env = getGeminiEnv()
  if (!env) throw new ServiceUnavailableError("The Livo assistant isn't available right now. Try again later.")
  client ??= new GoogleGenAI({ apiKey: env.apiKey })
  return { client, models: env.models }
}
