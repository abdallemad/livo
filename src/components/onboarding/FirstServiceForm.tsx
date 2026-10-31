"use client"

import { useEffect, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormField } from "@/components/forms/FormField"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  SERVICE_DESCRIPTION_MAX,
  SERVICE_DURATION_OPTIONS,
  SERVICE_MAX_IMAGES,
  SERVICE_PRICE_MAX,
  SERVICE_PRICE_MIN,
} from "@/constants/onboarding"
import { useDeleteServiceImage, useSaveFirstService, useUploadServiceImage } from "@/hooks/use-onboarding"
import { applyApiErrors } from "@/lib/form-errors"
import { firstServiceStepSchema, type FirstServiceStepInput, type FirstServiceStepValues } from "@/schemas/onboarding.schema"
import type { OnboardingFileDto, OnboardingStateDto } from "@/types/onboarding"
import { ImageUploader } from "./ImageUploader"
import { formatDuration, ServicePreviewCard } from "./ServicePreviewCard"
import { StepActions } from "./StepCard"

const FIELDS = ["title", "categoryId", "description", "price", "durationMinutes", "imageIds"] as const

interface FirstServiceFormProps {
  state: OnboardingStateDto
  onBack?: () => void
  onSaved: (intent: "next" | "exit") => void
  onDirtyChange: (dirty: boolean) => void
}

/**
 * Provider step 5 form (PR-05) with a live preview. Category choices are
 * limited to the provider's own trades that allow fixed prices; the server
 * re-checks that.
 */
export function FirstServiceForm({ state, onBack, onSaved, onDirtyChange }: FirstServiceFormProps) {
  const save = useSaveFirstService()
  const uploadImage = useUploadServiceImage()
  const deleteImage = useDeleteServiceImage()
  const [images, setImages] = useState<OnboardingFileDto[]>([
    ...(state.service?.images ?? []),
    ...state.pendingServiceImages,
  ].slice(0, SERVICE_MAX_IMAGES))

  const myCategories = state.options.categories.filter(
    (c) => c.allowsFixedPrice && state.profile?.categoryIds.includes(c.id)
  )
  const form = useForm<FirstServiceStepInput, unknown, FirstServiceStepValues>({
    resolver: zodResolver(firstServiceStepSchema),
    defaultValues: {
      title: state.service?.title ?? "",
      categoryId: state.service?.categoryId ?? (myCategories.length === 1 ? myCategories[0].id : ""),
      description: state.service?.description ?? "",
      price: state.service?.price ?? "",
      durationMinutes: state.service?.durationMinutes ?? 60,
      imageIds: images.map((i) => i.id),
    },
  })
  const { register, control, handleSubmit, setError, setValue, formState } = form
  const values = useWatch({ control })
  const savedImageIds = (state.service?.images ?? []).map((i) => i.id).join()
  const dirty = formState.isDirty || images.map((i) => i.id).join() !== savedImageIds

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])

  const syncImages = (next: OnboardingFileDto[]) => {
    setImages(next)
    setValue("imageIds", next.map((i) => i.id), { shouldDirty: true })
  }

  const submit = (intent: "next" | "exit") =>
    handleSubmit((v) =>
      save.mutate(v, {
        onSuccess: () => onSaved(intent),
        onError: (error) => applyApiErrors(error, setError, FIELDS),
      })
    )()

  const price = Number(values.price)
  const duration = Number(values.durationMinutes)

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <form className="grid gap-5" onSubmit={(e) => (e.preventDefault(), submit("next"))} noValidate>
          <FormField id="ob-svc-title" label="اسم الخدمة" error={formState.errors.title?.message} helper="مثال: تركيب سخان غاز، تنظيف شقة لحد 120 متر.">
            <Input id="ob-svc-title" aria-invalid={!!formState.errors.title} aria-describedby="ob-svc-title-msg" {...register("title")} />
          </FormField>

          <FormField id="ob-svc-category" label="التصنيف" error={formState.errors.categoryId?.message}>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <OptionSelect
                  id="ob-svc-category"
                  value={field.value}
                  onChange={field.onChange}
                  options={myCategories.map((c) => ({ id: c.id, name: c.parentName ? `${c.parentName} · ${c.name}` : c.name }))}
                  placeholder="اختار من تخصصاتك"
                  invalid={!!formState.errors.categoryId}
                />
              )}
            />
          </FormField>

          <FormField
            id="ob-svc-desc"
            label="وصف الخدمة"
            error={formState.errors.description?.message}
            helper="الخدمة بتشمل إيه، وإيه اللي مش داخل في السعر (زي الخامات)."
          >
            <Textarea
              id="ob-svc-desc"
              rows={4}
              maxLength={SERVICE_DESCRIPTION_MAX}
              aria-invalid={!!formState.errors.description}
              aria-describedby="ob-svc-desc-msg"
              {...register("description")}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="ob-svc-price"
              label="السعر (ج.م)"
              error={formState.errors.price?.message}
              helper={`من ${SERVICE_PRICE_MIN} لـ ${SERVICE_PRICE_MAX.toLocaleString("en")} ج.م`}
            >
              <Input
                id="ob-svc-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                dir="ltr"
                className="text-start tabular-nums"
                aria-invalid={!!formState.errors.price}
                aria-describedby="ob-svc-price-msg"
                {...register("price")}
              />
            </FormField>
            <FormField id="ob-svc-duration" label="المدة المتوقعة" error={formState.errors.durationMinutes?.message}>
              <Controller
                control={control}
                name="durationMinutes"
                render={({ field }) => (
                  <OptionSelect
                    id="ob-svc-duration"
                    value={String(field.value ?? "")}
                    onChange={(v) => field.onChange(Number(v))}
                    options={SERVICE_DURATION_OPTIONS.map((m) => ({ id: String(m), name: formatDuration(m) }))}
                    placeholder="اختار المدة"
                    invalid={!!formState.errors.durationMinutes}
                  />
                )}
              />
            </FormField>
          </div>

          <FormField
            id="ob-svc-images"
            label="صور من شغلك"
            optional
            error={formState.errors.imageIds?.message}
            helper={`لحد ${SERVICE_MAX_IMAGES} صور. الصورة الأولى هي اللي هتظهر في الكارت.`}
          >
            <ImageUploader
              id="ob-svc-images"
              label="ضيف صور"
              files={images}
              maxFiles={SERVICE_MAX_IMAGES}
              upload={(file, onProgress) => uploadImage.mutateAsync({ file, onProgress })}
              remove={(file) => deleteImage.mutateAsync(file.id)}
              onUploaded={(file) => syncImages([...images, file])}
              onRemoved={(file) => syncImages(images.filter((i) => i.id !== file.id))}
            />
          </FormField>
        </form>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-sm font-medium text-muted-foreground">كده هتظهر للعملاء</p>
          <ServicePreviewCard
            title={values.title ?? ""}
            providerName={state.basic.name}
            categoryName={myCategories.find((c) => c.id === values.categoryId)?.name ?? null}
            price={Number.isFinite(price) ? price : null}
            durationMinutes={Number.isFinite(duration) ? duration : null}
            imageUrl={images[0]?.previewUrl ?? null}
          />
        </div>
      </div>
      <div className="border-t pt-5">
        <StepActions
          onBack={onBack}
          onPrimary={() => submit("next")}
          onSaveAndExit={() => submit("exit")}
          primaryLabel="احفظ الخدمة"
          pending={save.isPending}
        />
      </div>
    </>
  )
}
