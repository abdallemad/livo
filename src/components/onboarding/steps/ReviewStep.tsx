"use client"

import Link from "next/link"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, CheckCircle2, Pencil } from "lucide-react"
import { PriceTag } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { type OnboardingStep } from "@/constants/onboarding"
import { useSubmitProvider } from "@/hooks/use-onboarding"
import { applyApiErrors } from "@/lib/form-errors"
import { submitStepSchema, type SubmitStepValues } from "@/schemas/onboarding.schema"
import type { OnboardingFinishDto } from "@/types/onboarding"
import { formatDuration } from "../ServicePreviewCard"
import { StepActions, StepCard } from "../StepCard"
import type { StepProps } from "./types"

interface ReviewStepProps extends StepProps {
  onEdit: (step: OnboardingStep) => void
  onFinished: (result: OnboardingFinishDto) => void
}

/** Provider step 6: everything at a glance, edit links, terms, submit for review (DRAFT → PENDING). */
export function ReviewStep({ state, onBack, onEdit, onFinished }: ReviewStepProps) {
  const submit = useSubmitProvider()
  const form = useForm<SubmitStepValues>({
    resolver: zodResolver(submitStepSchema),
    defaultValues: { acceptTerms: false },
  })
  const { control, handleSubmit, formState, setError } = form

  const city = state.options.cities.find((c) => c.id === state.basic.cityId)
  const areaName = (id: string) => city?.areas.find((a) => a.id === id)?.name ?? ""
  const categoryName = (id: string) => state.options.categories.find((c) => c.id === id)?.name ?? ""
  const has = (type: string) => state.documents.some((d) => d.type === type)
  const certificates = state.documents.filter((d) => d.type === "CERTIFICATE").length

  const onSubmit = () =>
    handleSubmit((values) =>
      submit.mutate(values, {
        onSuccess: onFinished,
        onError: (error) => applyApiErrors(error, setError, ["acceptTerms"] as const),
      })
    )()

  return (
    <StepCard
      title="Review your profile before sending it"
      description="Make sure everything is correct. Once you send it, we'll review it and let you know."
      footer={<StepActions onBack={onBack} onPrimary={onSubmit} primaryLabel="Send your profile for review" pending={submit.isPending} />}
    >
      <div className="grid gap-4">
        <Section title="Your details" onEdit={() => onEdit("basic")}>
          <p className="font-medium">{state.basic.name}</p>
          <p className="text-muted-foreground">
            {city?.name}
            {state.basic.areaId ? ` · ${areaName(state.basic.areaId)}` : ""}
          </p>
        </Section>

        <Section title="Your professional profile" onEdit={() => onEdit("profile")}>
          <p className="line-clamp-3">{state.profile?.bio}</p>
          <p className="text-muted-foreground">
            Experience <span className="tabular-nums">{state.profile?.yearsExperience ?? 0}</span> years
          </p>
          <div className="flex flex-wrap gap-1.5">
            {state.profile?.categoryIds.map((id) => (
              <Badge key={id} variant="secondary">
                {categoryName(id)}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{state.profile?.areaIds.map(areaName).join(", ")}</p>
        </Section>

        <Section title="Verification" onEdit={() => onEdit("documents")}>
          <DocLine ok={has("NATIONAL_ID")} label="ID photo" />
          <DocLine ok={has("SELFIE")} label="Selfie" />
          <p className="text-sm text-muted-foreground">
            Certificates: <span className="tabular-nums">{certificates}</span>
          </p>
        </Section>

        <Section title="First service" onEdit={() => onEdit("service")}>
          {state.service ? (
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="font-medium">{state.service.title}</p>
                <p className="text-sm text-muted-foreground">{formatDuration(state.service.durationMinutes)}</p>
              </div>
              <PriceTag amount={state.service.price} kind="fixed" />
            </div>
          ) : (
            <p className="text-muted-foreground">Your specialties use quotes, so there’s no fixed-price service.</p>
          )}
        </Section>

        <Controller
          control={control}
          name="acceptTerms"
          render={({ field }) => (
            <div className="flex flex-col gap-1">
              <Label className="flex min-h-11 items-start gap-3 text-base font-normal">
                <Checkbox
                  className="mt-1 size-5"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-invalid={!!formState.errors.acceptTerms}
                  aria-describedby="ob-terms-msg"
                />
                <span>
                  I have read and agree to the{" "}
                  <Link href="/terms" target="_blank" className="font-medium text-primary underline underline-offset-4">
                    Terms of use
                  </Link>
                  , and confirm that the details and documents I uploaded are correct.
                </span>
              </Label>
              <p id="ob-terms-msg" aria-live="polite" className="flex min-h-5 items-center gap-1 text-sm text-destructive">
                {formState.errors.acceptTerms ? <AlertCircle className="size-4" aria-hidden /> : null}
                {formState.errors.acceptTerms?.message}
              </p>
            </div>
          )}
        />
      </div>
    </StepCard>
  )
}

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${title}`}>
          <Pencil data-icon="inline-start" aria-hidden />
          Edit
        </Button>
      </div>
      {children}
    </section>
  )
}

function DocLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <p className={ok ? "flex items-center gap-2" : "flex items-center gap-2 text-destructive"}>
      {ok ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <AlertCircle className="size-4" aria-hidden />}
      {label}
      {ok ? null : " — Missing"}
    </p>
  )
}
