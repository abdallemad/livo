"use client"

import { useEffect } from "react"
import { Info } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useFocusOnMount } from "@/hooks/use-focus-on-mount"
import { FirstServiceForm } from "../FirstServiceForm"
import { StepActions } from "../StepCard"
import type { StepProps } from "./types"

/**
 * Provider step 5. Quote-only trades (e.g. finishing) can't hold a
 * fixed-price service, so those providers get an explanation and continue
 * (the server derives this step as done for them).
 */
export function FirstServiceStep({ state, onBack, onAdvance, onDirtyChange }: StepProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const canOfferFixed = state.options.categories.some(
    (c) => c.allowsFixedPrice && state.profile?.categoryIds.includes(c.id)
  )
  useEffect(() => {
    if (!canOfferFixed) onDirtyChange(false)
  }, [canOfferFixed, onDirtyChange])

  return (
    <Card className="gap-6 px-4 py-6 md:px-8 md:py-8">
      <div className="space-y-1">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold outline-none md:text-3xl">
          Your first service
        </h1>
        <p className="text-muted-foreground">
          A fixed-price service customers can book right away. It will be visible to customers after we review your profile.
        </p>
      </div>
      {canOfferFixed ? (
        <FirstServiceForm state={state} onBack={onBack} onSaved={onAdvance} onDirtyChange={onDirtyChange} />
      ) : (
        <>
          <p className="flex items-start gap-2 rounded-md bg-info/10 px-4 py-3 text-info">
            <Info className="mt-1 size-5 shrink-0" aria-hidden />
            Your specialties work with quotes, so you don’t need to add a fixed-price service now. You’ll get customer requests and can send quotes on them.
          </p>
          <div className="border-t pt-5">
            <StepActions onBack={onBack} onPrimary={() => onAdvance("next")} primaryLabel="Next" />
          </div>
        </>
      )}
    </Card>
  )
}
