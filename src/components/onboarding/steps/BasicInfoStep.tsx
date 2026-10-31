"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Camera } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { Ltr } from "@/components/shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSaveBasicInfo } from "@/hooks/use-onboarding"
import { applyApiErrors } from "@/lib/form-errors"
import { compressImage } from "@/lib/image-compress"
import { basicInfoStepSchema, type BasicInfoStepInput, type BasicInfoStepValues } from "@/schemas/onboarding.schema"
import { formatPhone } from "@/utils/format"
import { StepActions, StepCard } from "../StepCard"
import type { StepProps } from "./types"

const FIELDS = ["name", "email", "cityId", "areaId"] as const

/**
 * Step 2: name, email, photo, city, area. The phone was verified by Clerk at
 * sign-up and is only shown. The photo goes straight to Clerk (the source of
 * identity, CLAUDE.md §5); saving the step copies its URL into our DB.
 */
export function BasicInfoStep({ state, onBack, onAdvance, onDirtyChange }: StepProps) {
  const isProvider = state.role === "PROVIDER"
  const save = useSaveBasicInfo()
  const { user } = useUser()
  const [photoBusy, setPhotoBusy] = useState(false)

  const form = useForm<BasicInfoStepInput, unknown, BasicInfoStepValues>({
    resolver: zodResolver(basicInfoStepSchema),
    defaultValues: state.basic,
  })
  const { register, control, handleSubmit, setValue, setError, formState } = form
  const cityId = useWatch({ control, name: "cityId" })
  const name = useWatch({ control, name: "name" })
  const areas = state.options.cities.find((c) => c.id === cityId)?.areas ?? []

  useEffect(() => onDirtyChange(formState.isDirty), [formState.isDirty, onDirtyChange])

  const submit = (intent: "next" | "exit") =>
    handleSubmit((values) => {
      if (isProvider && !values.areaId) {
        setError("areaId", { message: "اختار المنطقة اللي بتشتغل فيها أكتر." }, { shouldFocus: true })
        return
      }
      save.mutate(values, {
        onSuccess: () => onAdvance(intent),
        onError: (error) => applyApiErrors(error, setError, FIELDS),
      })
    })()

  const changePhoto = async (file: File | undefined) => {
    if (!file || !user) return
    setPhotoBusy(true)
    try {
      const blob = await compressImage(file, 512)
      await user.setProfileImage({ file: blob })
      toast.success("تم تغيير الصورة")
    } catch {
      toast.error("الصورة ما اترفعتش. جرّب صورة تانية.")
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <StepCard
      title="عرّفنا بنفسك"
      description={isProvider ? "البيانات دي هتظهر في ملفك للعملاء (من غير رقمك أو إيميلك)." : "عشان مزود الخدمة يعرف يتعامل معاك."}
      footer={
        <StepActions
          onBack={onBack}
          onPrimary={() => submit("next")}
          onSaveAndExit={isProvider ? () => submit("exit") : undefined}
          primaryLabel="التالي"
          pending={save.isPending}
        />
      }
    >
      <form className="grid gap-5" onSubmit={(e) => (e.preventDefault(), submit("next"))} noValidate>
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {user?.hasImage ? <AvatarImage src={user.imageUrl} alt="" /> : null}
            <AvatarFallback className="text-xl">{(name || "؟").slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <Button type="button" variant="outline" loading={photoBusy} render={<label htmlFor="ob-photo" />} nativeButton={false}>
              <Camera data-icon="inline-start" aria-hidden />
              {user?.hasImage ? "غيّر الصورة" : "ضيف صورة"}
            </Button>
            <span className="text-sm text-muted-foreground">اختياري</span>
            <input
              id="ob-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => void changePhoto(e.target.files?.[0])}
            />
          </div>
        </div>

        <FormField id="ob-name" label="الاسم بالكامل" error={formState.errors.name?.message}>
          <Input id="ob-name" autoComplete="name" aria-invalid={!!formState.errors.name} aria-describedby="ob-name-msg" {...register("name")} />
        </FormField>

        <FormField id="ob-phone" label="رقم الموبايل" helper="اتأكدنا منه وقت التسجيل.">
          <div id="ob-phone" className="flex h-11 items-center rounded-md border bg-muted px-3 text-muted-foreground" aria-describedby="ob-phone-msg">
            {state.phone ? <Ltr>{formatPhone(state.phone)}</Ltr> : "—"}
          </div>
        </FormField>

        <FormField id="ob-email" label="الإيميل" optional error={formState.errors.email?.message}>
          <Input
            id="ob-email"
            type="email"
            dir="ltr"
            inputMode="email"
            autoComplete="email"
            className="text-start"
            aria-invalid={!!formState.errors.email}
            aria-describedby="ob-email-msg"
            {...register("email")}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="ob-city" label="المدينة" error={formState.errors.cityId?.message}>
            <Controller
              control={control}
              name="cityId"
              render={({ field }) => (
                <OptionSelect
                  id="ob-city"
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v)
                    setValue("areaId", "", { shouldDirty: true })
                  }}
                  options={state.options.cities}
                  placeholder="اختار المدينة"
                  invalid={!!formState.errors.cityId}
                />
              )}
            />
          </FormField>
          <FormField
            id="ob-area"
            label={isProvider ? "المنطقة اللي بتشتغل فيها أكتر" : "المنطقة"}
            optional={!isProvider}
            error={formState.errors.areaId?.message}
          >
            <Controller
              control={control}
              name="areaId"
              render={({ field }) => (
                <OptionSelect
                  id="ob-area"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={areas}
                  placeholder={cityId ? "اختار المنطقة" : "اختار المدينة الأول"}
                  disabled={!cityId}
                  invalid={!!formState.errors.areaId}
                />
              )}
            />
          </FormField>
        </div>
      </form>
    </StepCard>
  )
}
