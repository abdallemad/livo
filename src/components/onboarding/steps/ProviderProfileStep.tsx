"use client"

import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckboxChips } from "@/components/forms/CheckboxChips"
import { FormField } from "@/components/forms/FormField"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  PROVIDER_BIO_MAX,
  PROVIDER_BIO_MIN,
  PROVIDER_MAX_AREAS,
  PROVIDER_MAX_CATEGORIES,
} from "@/constants/onboarding"
import { useSaveProviderProfile } from "@/hooks/use-onboarding"
import { applyApiErrors } from "@/lib/form-errors"
import {
  providerProfileStepSchema,
  type ProviderProfileStepInput,
  type ProviderProfileStepValues,
} from "@/schemas/onboarding.schema"
import { StepActions, StepCard } from "../StepCard"
import type { StepProps } from "./types"

const FIELDS = ["bio", "yearsExperience", "categoryIds", "areaIds"] as const

/** Provider step 3 (PR-01): bio, years, trades, coverage areas within the chosen city. */
export function ProviderProfileStep({ state, onBack, onAdvance, onDirtyChange }: StepProps) {
  const save = useSaveProviderProfile()
  const areas = state.options.cities.find((c) => c.id === state.basic.cityId)?.areas ?? []
  const categories = state.options.categories.map((c) => ({
    id: c.id,
    label: c.name,
    hint: c.parentName,
  }))
  const form = useForm<ProviderProfileStepInput, unknown, ProviderProfileStepValues>({
    resolver: zodResolver(providerProfileStepSchema),
    defaultValues: {
      bio: state.profile?.bio ?? "",
      yearsExperience: state.profile?.yearsExperience ?? "",
      categoryIds: state.profile?.categoryIds ?? [],
      areaIds: state.profile?.areaIds.length ? state.profile.areaIds : state.basic.areaId ? [state.basic.areaId] : [],
    },
  })
  const { register, control, handleSubmit, setError, formState } = form
  const bioLength = (useWatch({ control, name: "bio" }) ?? "").trim().length

  useEffect(() => onDirtyChange(formState.isDirty), [formState.isDirty, onDirtyChange])

  const submit = (intent: "next" | "exit") =>
    handleSubmit((values) =>
      save.mutate(values, {
        onSuccess: () => onAdvance(intent),
        onError: (error) => applyApiErrors(error, setError, FIELDS),
      })
    )()

  return (
    <StepCard
      title="ملفك المهني"
      description="ده اللي العملاء هيشوفوه قبل ما يختاروك."
      footer={
        <StepActions
          onBack={onBack}
          onPrimary={() => submit("next")}
          onSaveAndExit={() => submit("exit")}
          primaryLabel="التالي"
          pending={save.isPending}
        />
      }
    >
      <form className="grid gap-6" onSubmit={(e) => (e.preventDefault(), submit("next"))} noValidate>
        <FormField
          id="ob-bio"
          label="نبذة عن شغلك"
          error={formState.errors.bio?.message}
          helper={
            <span className="tabular-nums">
              {bioLength} / {PROVIDER_BIO_MAX} — اكتب {PROVIDER_BIO_MIN} حرف على الأقل: خبرتك، نوع الشغل، وبتتميّز في إيه.
            </span>
          }
        >
          <Textarea
            id="ob-bio"
            rows={5}
            maxLength={PROVIDER_BIO_MAX}
            placeholder="مثال: سباك بخبرة 10 سنين في الشقق والفيلات، بشتغل بخامات مضمونة وبنضّف بعد الشغل."
            aria-invalid={!!formState.errors.bio}
            aria-describedby="ob-bio-msg"
            {...register("bio")}
          />
        </FormField>

        <FormField id="ob-years" label="سنين الخبرة" error={formState.errors.yearsExperience?.message} className="sm:max-w-48">
          <Input
            id="ob-years"
            type="number"
            inputMode="numeric"
            min={0}
            dir="ltr"
            className="text-start tabular-nums"
            aria-invalid={!!formState.errors.yearsExperience}
            aria-describedby="ob-years-msg"
            {...register("yearsExperience")}
          />
        </FormField>

        <FormField
          id="ob-categories"
          label="تخصصاتك"
          error={formState.errors.categoryIds?.message}
          helper={`اختار لحد ${PROVIDER_MAX_CATEGORIES} تخصصات.`}
        >
          <Controller
            control={control}
            name="categoryIds"
            render={({ field }) => (
              <CheckboxChips
                id="ob-categories"
                legend="التخصصات"
                options={categories}
                value={field.value ?? []}
                onChange={field.onChange}
                max={PROVIDER_MAX_CATEGORIES}
                invalid={!!formState.errors.categoryIds}
              />
            )}
          />
        </FormField>

        <FormField
          id="ob-areas"
          label="المناطق اللي بتشتغل فيها"
          error={formState.errors.areaIds?.message}
          helper="هتوصلك طلبات من المناطق دي بس."
        >
          <Controller
            control={control}
            name="areaIds"
            render={({ field }) => (
              <CheckboxChips
                id="ob-areas"
                legend="المناطق"
                options={areas.map((a) => ({ id: a.id, label: a.name }))}
                value={field.value ?? []}
                onChange={field.onChange}
                max={PROVIDER_MAX_AREAS}
                invalid={!!formState.errors.areaIds}
              />
            )}
          />
        </FormField>
      </form>
    </StepCard>
  )
}
