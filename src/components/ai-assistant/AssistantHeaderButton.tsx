"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ASSISTANT_MODES } from "@/constants/ai-assistant"
import { AssistantSheet } from "./AssistantSheet"

/**
 * The dashboard entry point to the assistant (docs/ai-assistant-feature.md): a header button next to the notification
 * bell — not a floating button, which would cover the mobile bottom tabs. `customer` in `/account`, `provider` in
 * `/provider`; each mode is grounded in that user's own dashboard on the server.
 */
export function AssistantHeaderButton({ mode }: { mode: "customer" | "provider" }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="ghost"
        className="gap-1.5 text-primary max-sm:size-11 max-sm:px-0"
        onClick={() => setOpen(true)}
        aria-label={`Open the ${ASSISTANT_MODES[mode].title}`}
        aria-haspopup="dialog"
      >
        <Sparkles aria-hidden />
        <span className="max-sm:hidden">Ask AI</span>
      </Button>
      <AssistantSheet mode={mode} open={open} onOpenChange={setOpen} />
    </>
  )
}
