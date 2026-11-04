"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowRight, Check, Copy, Lightbulb, Mic, MicOff, RotateCcw, Send, Sparkles, Square, Volume2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ASSISTANT_MODES } from "@/constants/ai-assistant"
import { useAssistantChat } from "@/hooks/use-ai-assistant"
import type { AssistantMessage, AssistantMode, AssistantReply } from "@/types/ai-assistant"
import { ASSISTANT_LIMITS } from "@/utils/ai-assistant"
import { canListen, canSpeak, createRecognition, speak, speechLang, stopSpeaking, type Recognition } from "./speech"

/** A message in the panel: the visitor's text, or the assistant's full reply (action, tips, quick replies). */
type Turn = { id: number; role: "user"; text: string } | { id: number; role: "assistant"; text: string; reply: AssistantReply }

const noop = () => () => {}
/** Browser-only capability, read without a hydration mismatch (false on the server). */
const useBrowserSupport = (check: () => boolean) => useSyncExternalStore(noop, check, () => false)

/** Ready-to-paste text the assistant wrote (quote message, service description, reply…) with a Copy button. */
function DraftCard({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="rounded-xl border border-dashed bg-muted/40 p-3 text-sm">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Draft — edit before sending</span>
        <Button variant="ghost" size="xs" onClick={copy} aria-live="polite">
          {copied ? <Check data-icon="inline-start" aria-hidden /> : <Copy data-icon="inline-start" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p dir="auto" className="whitespace-pre-wrap">
        {text}
      </p>
    </div>
  )
}

/**
 * The Livo AI Assistant conversation (docs/ai-assistant-feature.md): messages, a typing indicator, the suggested next
 * step as a real link, tips, a copyable draft, tappable quick replies, read-aloud per reply and voice input. `mode`
 * picks the endpoint and the opening copy (public / customer / provider). The conversation lives in this component only.
 */
export function AssistantPanel({ mode, onNavigate }: { mode: AssistantMode; onNavigate: () => void }) {
  const config = ASSISTANT_MODES[mode]
  const chat = useAssistantChat(mode)
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState("")
  const [speakingId, setSpeakingId] = useState<number | null>(null)
  const [listening, setListening] = useState(false)
  const nextId = useRef(0)
  const recognition = useRef<Recognition | null>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const speechOut = useBrowserSupport(canSpeak)
  const speechIn = useBrowserSupport(canListen)

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end", behavior: "smooth" })
  }, [turns.length, chat.isPending])

  // Stop talking / listening when the panel closes.
  useEffect(
    () => () => {
      stopSpeaking()
      recognition.current?.stop()
    },
    [],
  )

  const send = (raw: string) => {
    const text = raw.trim().slice(0, ASSISTANT_LIMITS.messageMax)
    if (!text || chat.isPending) return
    const userTurn: Turn = { id: nextId.current++, role: "user", text }
    const history: AssistantMessage[] = [...turns, userTurn]
      .slice(-ASSISTANT_LIMITS.historyMax)
      .map((t) => ({ role: t.role, text: t.text }))
    setTurns((prev) => [...prev, userTurn])
    setDraft("")
    chat.mutate(
      { messages: history },
      {
        onSuccess: (reply) => setTurns((prev) => [...prev, { id: nextId.current++, role: "assistant", text: reply.reply, reply }]),
        // Give the text back so a retry is one tap.
        onError: () => {
          setTurns((prev) => prev.filter((t) => t.id !== userTurn.id))
          setDraft(text)
        },
      },
    )
  }

  const reset = () => {
    stopSpeaking()
    setSpeakingId(null)
    setTurns([])
    chat.reset()
    input.current?.focus()
  }

  const toggleSpeak = (turn: Turn) => {
    if (speakingId === turn.id) {
      stopSpeaking()
      setSpeakingId(null)
      return
    }
    setSpeakingId(turn.id)
    speak(turn.text, () => setSpeakingId((id) => (id === turn.id ? null : id)))
  }

  const toggleListen = () => {
    if (listening) {
      recognition.current?.stop()
      return
    }
    // Dictate in Arabic when the draft is Arabic or the browser is set to Arabic, otherwise English.
    const r = createRecognition(speechLang(draft) === "ar-EG" || navigator.language.startsWith("ar") ? "ar-EG" : "en-US")
    if (!r) return
    const base = draft ? `${draft.trimEnd()} ` : ""
    r.onresult = (event) => {
      const heard = Array.from(event.results, (res) => res[0]?.transcript ?? "").join("")
      setDraft((base + heard).slice(0, ASSISTANT_LIMITS.messageMax))
    }
    r.onend = () => {
      setListening(false)
      recognition.current = null
    }
    r.onerror = () => setListening(false)
    recognition.current = r
    setListening(true)
    r.start()
  }

  const last = turns.at(-1)
  const quickReplies = !chat.isPending && last?.role === "assistant" ? last.reply.quickReplies : []

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4" role="log" aria-live="polite" aria-label="Conversation">
        {turns.length === 0 ? (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border bg-muted/40 p-4 text-sm">
              <p className="font-medium">{config.welcomeTitle}</p>
              <p className="mt-1 text-muted-foreground">{config.welcome}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.starters.map((s) => (
                <Button key={s} variant="outline" size="sm" className="h-auto whitespace-normal py-1.5 text-start" onClick={() => send(s)}>
                  <bdi>{s}</bdi>
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        {turns.map((t) =>
          t.role === "user" ? (
            <div key={t.id} className="flex justify-end">
              <p dir="auto" className="max-w-[85%] rounded-2xl rounded-ee-sm bg-primary px-3.5 py-2 text-sm whitespace-pre-wrap text-primary-foreground">
                {t.text}
              </p>
            </div>
          ) : (
            <div key={t.id} className="flex max-w-[92%] flex-col gap-2">
              <div className="rounded-2xl rounded-es-sm border bg-card px-3.5 py-2.5 text-sm">
                <p dir="auto" className="whitespace-pre-wrap">
                  {t.text}
                </p>
                {t.reply.estimatedPrice ? (
                  <Badge variant="secondary" className="mt-2">
                    Estimate: <bdi>{t.reply.estimatedPrice}</bdi>
                  </Badge>
                ) : null}
                {t.reply.tips.length ? (
                  <ul className="mt-2.5 space-y-1.5 border-t pt-2.5" aria-label="Tips">
                    {t.reply.tips.map((tip) => (
                      <li key={tip} dir="auto" className="flex gap-2 text-muted-foreground">
                        <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-commit" aria-hidden />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {t.reply.draft ? <DraftCard text={t.reply.draft} /> : null}
              <div className="flex flex-wrap items-center gap-2">
                {t.reply.action ? (
                  <Button size="sm" render={<Link href={t.reply.action.href} onClick={onNavigate} />}>
                    {t.reply.action.label}
                    <ArrowRight className="rtl:-scale-x-100" data-icon="inline-end" aria-hidden />
                  </Button>
                ) : null}
                {speechOut ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => toggleSpeak(t)}
                    aria-label={speakingId === t.id ? "Stop reading" : "Read aloud"}
                    aria-pressed={speakingId === t.id}
                  >
                    {speakingId === t.id ? <Square aria-hidden /> : <Volume2 aria-hidden />}
                  </Button>
                ) : null}
              </div>
            </div>
          ),
        )}

        {chat.isPending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Thinking…
          </div>
        ) : null}

        {chat.isError ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {chat.error.message}
          </p>
        ) : null}

        {quickReplies.length ? (
          <div className="flex flex-wrap gap-2" aria-label="Suggested replies">
            {quickReplies.map((q) => (
              <Button key={q} variant="outline" size="xs" className="h-auto rounded-full py-1 whitespace-normal" onClick={() => send(q)}>
                <bdi>{q}</bdi>
              </Button>
            ))}
          </div>
        ) : null}
        <div ref={bottom} />
      </div>

      <form
        className="border-t p-3"
        onSubmit={(e) => {
          e.preventDefault()
          send(draft)
        }}
      >
        <div className="flex items-end gap-2">
          <Textarea
            ref={input}
            value={draft}
            dir="auto"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send(draft)
              }
            }}
            maxLength={ASSISTANT_LIMITS.messageMax}
            rows={1}
            placeholder={listening ? "Listening…" : config.placeholder}
            aria-label="Your message"
            className="max-h-32 min-h-11 resize-none"
          />
          {speechIn ? (
            <Button
              type="button"
              variant={listening ? "destructive" : "outline"}
              size="icon"
              onClick={toggleListen}
              aria-label={listening ? "Stop voice input" : "Speak your message"}
              aria-pressed={listening}
            >
              {listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}
            </Button>
          ) : null}
          <Button type="submit" size="icon" disabled={!draft.trim() || chat.isPending} aria-label="Send">
            <Send className="rtl:-scale-x-100" aria-hidden />
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sparkles className="size-3" aria-hidden /> {config.disclaimer}
          </span>
          {turns.length ? (
            <Button type="button" variant="ghost" size="xs" onClick={reset}>
              <RotateCcw data-icon="inline-start" aria-hidden /> New chat
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  )
}

