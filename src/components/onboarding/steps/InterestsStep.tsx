"use client"

import { useEffect, useState } from "react"
import { CheckboxChips } from "@/components/forms/CheckboxChips"
import { FormField } from "@/components/forms/FormField"
import { MAX_CUSTOMER_INTERESTS } from "@/constants/onboarding"
import { useFinishCustomer } from "@/hooks/use-onboarding"
import { applyApiErrors } from "@/lib/form-errors"
import type { OnboardingFinishDto } from "@/types/onboarding"
import { StepActions, StepCard } from "../StepCard"
import type { StepProps } from "./types"

interface InterestsStepProps extends StepProps {
  onFinished: (result: OnboardingFinishDto) => void
}

/** Customer final step (optional picks): interests, then finish onboarding. Skipping still finishes. */
export function InterestsStep({ state, onBack, onDirtyChange, onFinished }: InterestsStepProps) {
  const finish = useFinishCustomer()
  const [selected, setSelected] = useState<string[]>(state.interests)
  const [error, setError] = useState<string>()
  // Top-level trades only: sub-categories would make this list long on a phone.
  const options = state.options.categories.filter((c) => !c.parentName).map((c) => ({ id: c.id, label: c.name }))
  const dirty = selected.join() !== state.interests.join()

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])

  const submit = (categoryIds: string[]) =>
    finish.mutate(
      { categoryIds },
      {
        onSuccess: (result) => {
          onDirtyChange(false)
          onFinished(result)
        },
        onError: (e) =>
          applyApiErrors(e, (_field, err) => setError(err.message), ["categoryIds"] as const),
      }
    )

  return (
    <StepCard
      title="إيه أكتر حاجات ممكن تحتاجها؟"
      description="هنرتّب لك الخدمات على حسب اختيارك. تقدر تتخطّى الخطوة دي."
      footer={
        <StepActions
          onBack={onBack}
          onSkip={() => submit([])}
          onPrimary={() => submit(selected)}
          primaryLabel="خلّص التسجيل"
          pending={finish.isPending}
        />
      }
    >
      <FormField id="ob-interests" label="اختار اللي يناسبك" optional error={error} helper={`لحد ${MAX_CUSTOMER_INTERESTS} اختيارات.`}>
        <CheckboxChips
          id="ob-interests"
          legend="الاهتمامات"
          options={options}
          value={selected}
          onChange={(v) => {
            setSelected(v)
            setError(undefined)
          }}
          max={MAX_CUSTOMER_INTERESTS}
          invalid={!!error}
        />
      </FormField>
    </StepCard>
  )
}
