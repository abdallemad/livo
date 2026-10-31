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
      title="Your address"
      description="We'll use it when you book so you don't have to type it every time. The provider sees it only after the booking is confirmed."
      footer={
        <StepActions
          onBack={onBack}
          onSkip={() => {
            onDirtyChange(false)
            onAdvance("next")
          }}
          onPrimary={submit}
          primaryLabel="Save address"
          pending={save.isPending}
        />
      }
    >
      <form className="grid gap-5" onSubmit={(e) => (e.preventDefault(), submit())} noValidate>
        <FormField id="ob-addr-area" label="Area" error={formState.errors.areaId?.message}>
          <Controller
            control={control}
            name="areaId"
            render={({ field }) => (
              <OptionSelect
                id="ob-addr-area"
                value={field.value}
                onChange={field.onChange}
                options={areas}
                placeholder="Choose the area"
                invalid={!!formState.errors.areaId}
              />
            )}
          />
        </FormField>
        <FormField id="ob-street" label="Street" error={formState.errors.street?.message}>
          <Input
            id="ob-street"
            autoComplete="street-address"
            placeholder="e.g. Abbas El Akkad St."
            aria-invalid={!!formState.errors.street}
            aria-describedby="ob-street-msg"
            {...register("street")}
          />
        </FormField>
        <FormField
          id="ob-details"
          label="Address details"
          optional
          helper="Building number, floor, apartment, or a landmark."
          error={formState.errors.details?.message}
        >
          <Textarea id="ob-details" rows={3} aria-describedby="ob-details-msg" {...register("details")} />
        </FormField>
      </form>
    </StepCard>
  )
}
