"use client"

/**
 * Browser speech helpers for the assistant (docs/ai-assistant-feature.md): read a reply aloud (Speech Synthesis) and
 * dictate a question (Web Speech Recognition — Chrome, Edge, Safari). Both are feature-detected; the buttons simply
 * don't render where the browser lacks them. Audio never touches our server.
 */

/** Arabic script → Egyptian Arabic voice, otherwise English. */
export const speechLang = (text: string) => (/[؀-ۿ]/.test(text) ? "ar-EG" : "en-US")

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window

export function speak(text: string, onEnd: () => void) {
  if (!canSpeak()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = speechLang(text)
  utterance.onend = onEnd
  utterance.onerror = onEnd
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel()
}

/** The slice of the (still prefixed in some browsers) SpeechRecognition API we use — not in TypeScript's DOM lib. */
export interface Recognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  start(): void
  stop(): void
}

type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const canListen = () => recognitionCtor() !== null

export function createRecognition(lang: string): Recognition | null {
  const Ctor = recognitionCtor()
  if (!Ctor) return null
  const r = new Ctor()
  r.lang = lang
  r.interimResults = true
  r.continuous = false
  return r
}
