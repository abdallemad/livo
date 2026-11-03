"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Bot, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SITE_NAME } from "@/constants/site"
import { Spinner } from "@/components/ui/spinner"

// Loaded on first open only, so public pages don't ship the chat code up front.
const AssistantPanel = dynamic(() => import("./AssistantPanel").then((m) => m.AssistantPanel), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center">
      <Spinner />
    </div>
  ),
})

const HINT_SEEN_KEY = "livo:assistant-hint-seen"
const HINT_DELAY_MS = 4000
const HINT_VISIBLE_MS = 8000

/**
 * Floating "Ask Livo" button (docs/ai-assistant-feature.md) — a client island, so the cached public pages stay static.
 * Opens the assistant in a side sheet. A one-line hint appears once per browser session after a few seconds and hides
 * itself. The panel mounts only while open, so nothing is fetched until the visitor asks a question.
 */
export function AssistantLauncher() {
  const [open, setOpen] = useState(false)
  const [hint, setHint] = useState(false)

  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem(HINT_SEEN_KEY) === "1"
    } catch {
      seen = false
    }
    if (seen) return
    const show = setTimeout(() => {
      setHint(true)
      try {
        sessionStorage.setItem(HINT_SEEN_KEY, "1")
      } catch {
        // Storage blocked: the hint may show again next visit — harmless.
      }
    }, HINT_DELAY_MS)
    const hide = setTimeout(() => setHint(false), HINT_DELAY_MS + HINT_VISIBLE_MS)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [])

  const openPanel = () => {
    setHint(false)
    setOpen(true)
  }

  return (
    <>
      <div className="fixed end-4 bottom-4 z-40 flex items-end gap-2 sm:end-6 sm:bottom-6 print:hidden">
        {hint && !open ? (
          <div
            role="status"
            className="relative mb-1 max-w-56 animate-in rounded-xl border bg-popover p-3 pe-8 text-sm text-popover-foreground shadow-lg fade-in slide-in-from-bottom-2"
          >
            Not sure what you need? Ask the {SITE_NAME} Assistant to diagnose the problem and estimate the cost.
            <button
              type="button"
              onClick={() => setHint(false)}
              className="absolute end-1.5 top-1.5 rounded-sm p-1 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ) : null}
        <Button
          size="icon-lg"
          onClick={openPanel}
          className="size-14 rounded-full shadow-lg ring-4 ring-primary/15"
          aria-label={`Ask the ${SITE_NAME} Assistant`}
          aria-haspopup="dialog"
        >
          <Bot className="size-6" aria-hidden />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md data-[side=right]:sm:max-w-md">
          <SheetHeader className="border-b pe-12">
            <SheetTitle className="flex items-center gap-2">
              <Bot className="size-5 text-primary" aria-hidden /> {SITE_NAME} Assistant
            </SheetTitle>
            <SheetDescription>Diagnose a problem, estimate the cost, find the right service.</SheetDescription>
          </SheetHeader>
          {open ? <AssistantPanel onNavigate={() => setOpen(false)} /> : null}
        </SheetContent>
      </Sheet>
    </>
  )
}
