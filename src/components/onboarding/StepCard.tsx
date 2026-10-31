"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useFocusOnMount } from "@/hooks/use-focus-on-mount"

interface StepCardProps {
  title: string
  description?: string
  children: React.ReactNode
  /** Footer actions; build them with <StepActions />. */
  footer: React.ReactNode
}

/** One wizard step: heading (focused on mount so screen readers announce the new step, NF-11), body, footer. */
export function StepCard({ title, description, children, footer }: StepCardProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  return (
    <Card className="gap-6 px-4 py-6 md:px-8 md:py-8">
      <div className="space-y-1">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold outline-none md:text-3xl">
          {title}
        </h1>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
      {children}
      <div className="border-t pt-5">{footer}</div>
    </Card>
  )
}

interface StepActionsProps {
  onBack?: () => void
  onPrimary: () => void
  primaryLabel: string
  pending?: boolean
  /** Optional steps: skip without saving. */
  onSkip?: () => void
  /** Providers: save what's typed and leave; the wizard resumes here next time. */
  onSaveAndExit?: () => void
}

/** Back at the start, primary at the end; one clear action per step (NF-06). */
export function StepActions({ onBack, onPrimary, primaryLabel, pending, onSkip, onSaveAndExit }: StepActionsProps) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
      {onBack ? (
        <Button type="button" variant="ghost" size="lg" onClick={onBack} disabled={pending}>
          <ArrowRight data-icon="inline-start" aria-hidden />
          رجوع
        </Button>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:ms-auto sm:flex-row">
        {onSaveAndExit ? (
          <Button type="button" variant="outline" size="lg" onClick={onSaveAndExit} disabled={pending}>
            احفظ وكمّل بعدين
          </Button>
        ) : null}
        {onSkip ? (
          <Button type="button" variant="outline" size="lg" onClick={onSkip} disabled={pending}>
            تخطّى
          </Button>
        ) : null}
        <Button type="button" size="lg" onClick={onPrimary} loading={pending}>
          {primaryLabel}
          <ArrowLeft data-icon="inline-end" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
