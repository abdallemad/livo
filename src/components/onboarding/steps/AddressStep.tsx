"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormField } from "@/components/forms/FormField"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSaveAddress } from "@/hooks/use-onboarding"
import { applyApiErrors } from "@/lib/form-errors"
import { addressStepSchema, type AddressStepInput, type AddressStepValues } from "@/schemas/onboarding.schema"
import { StepActions, StepCard } from "../StepCard"
import type { StepProps } from "./types"

const FIELDS = ["areaId", "street", "details"] as const

/** Customer step 3 (optional): the default address used when booking. Skippable. */
export function AddressStep({ state, onBack, onAdvance, onDirtyChange }: StepProps) {
  const save = useSaveAddress()
  const areas = state.options.cities.find((c) => c.id === state.basic.cityId)?.areas ?? []
  const form = useForm<AddressStepInput, unknown, AddressStepValues>({
    resolver: zodResolver(addressStepSchema),
    defaultValues: state.address ?? { areaId: state.basic.areaId, street: "", details: "" },
  })
  const { register, control, handleSubmit, setError, formState } = form

  useEffect(() => onDirtyChange(formState.isDirty), [formState.isDirty, onDirtyChange])

  const submit = () =>
    handleSubmit((values) =>
      save.mutate(values, {
        onSuccess: () => onAdvance("next"),
        onError: (error) => applyApiErrors(error, setError, FIELDS),
      })
    )()

  return (
    <StepCard
      title="عنوانك"
      description="هنستخدمه وقت الحجز عشان ما تكتبوش كل مرة. بيظهر لمزود الخدمة بعد تأكيد الحجز بس."
      footer={
        <StepActions
          onBack={onBack}
          onSkip={() => {
            onDirtyChange(false)
            onAdvance("next")
          }}
          onPrimary={submit}
          primaryLabel="احفظ العنوان"
          pending={save.isPending}
        />
      }
    >
      <form className="grid gap-5" onSubmit={(e) => (e.preventDefault(), submit())} noValidate>
        <FormField id="ob-addr-area" label="المنطقة" error={formState.errors.areaId?.message}>
          <Controller
            control={control}
            name="areaId"
            render={({ field }) => (
              <OptionSelect
                id="ob-addr-area"
                value={field.value}
                onChange={field.onChange}
                options={areas}
                placeholder="اختار المنطقة"
                invalid={!!formState.errors.areaId}
              />
            )}
          />
        </FormField>
        <FormField id="ob-street" label="الشارع" error={formState.errors.street?.message}>
          <Input
            id="ob-street"
            autoComplete="street-address"
            placeholder="مثال: شارع عباس العقاد"
            aria-invalid={!!formState.errors.street}
            aria-describedby="ob-street-msg"
            {...register("street")}
          />
        </FormField>
        <FormField
          id="ob-details"
          label="تفاصيل العنوان"
          optional
          helper="رقم العمارة، الدور، الشقة، أو علامة مميزة."
          error={formState.errors.details?.message}
        >
          <Textarea id="ob-details" rows={3} aria-describedby="ob-details-msg" {...register("details")} />
        </FormField>
      </form>
    </StepCard>
  )
}
