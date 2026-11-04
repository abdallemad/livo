"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { Bot } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { ASSISTANT_MODES } from "@/constants/ai-assistant"
import type { AssistantMode } from "@/types/ai-assistant"
import { resolveAssistantSection } from "@/utils/ai-assistant"

// Loaded on first open only, so pages don't ship the chat code up front.
const AssistantPanel = dynamic(() => import("./AssistantPanel").then((m) => m.AssistantPanel), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center">
      <Spinner />
    </div>
  ),
})

/**
 * The assistant's side sheet, shared by the public floating button and the dashboard header button
 * (docs/ai-assistant-feature.md). The panel mounts only while open; closing it forgets the conversation.
 */
export function AssistantSheet({ mode, open, onOpenChange }: { mode: AssistantMode; open: boolean; onOpenChange: (open: boolean) => void }) {
  const config = ASSISTANT_MODES[mode]
  const pathname = usePathname()
  const section = mode === "public" ? null : resolveAssistantSection(mode, pathname)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b pe-12">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="size-5 text-primary" aria-hidden /> {config.title}
            {section && !section.exact ? <span className="font-normal text-muted-foreground">· {section.label}</span> : null}
          </SheetTitle>
          <SheetDescription>{config.description}</SheetDescription>
        </SheetHeader>
        {open ? <AssistantPanel mode={mode} onNavigate={() => onOpenChange(false)} /> : null}
      </SheetContent>
    </Sheet>
  )
}
