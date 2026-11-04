"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ASSISTANT_MODES } from "@/constants/ai-assistant"
import type { DashboardAssistantMode } from "@/constants/ai-assistant-sections"
import { AssistantSheet } from "./AssistantSheet"

/**
 * The dashboard entry point to the assistant (docs/ai-assistant-feature.md): a tinted "Ask AI" pill in the top bar, next
 * to the notification bell — not a floating button, which would cover the mobile bottom tabs. `customer` in `/account`,
 * `provider` in `/provider`, `admin` in `/admin`; each is grounded in that dashboard's data and the current page.
 */
export function AssistantHeaderButton({ mode }: { mode: DashboardAssistantMode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="ghost"
        className="gap-1.5 rounded-full bg-primary/10 font-semibold text-primary hover:bg-primary/15 max-sm:size-10 max-sm:px-0"
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
