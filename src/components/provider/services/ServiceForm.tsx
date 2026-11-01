"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { ImageUploader } from "@/components/forms/ImageUploader"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { formatDuration, ServicePreviewCard } from "@/components/onboarding/ServicePreviewCard"
import { PageHeader } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { SERVICE_DESCRIPTION_MAX, SERVICE_DURATION_OPTIONS, SERVICE_MAX_IMAGES, SERVICE_PRICE_MAX, SERVICE_PRICE_MIN } from "@/constants/onboarding"
import { useDeletePendingServiceImage, useSaveService, useUploadServiceImage } from "@/hooks/use-provider-catalog"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { applyApiErrors } from "@/lib/form-errors"
import { serviceFormSchema, type ServiceFormInput, type ServiceFormValues } from "@/schemas/provider-catalog.schema"
import type { ProviderServiceFormData, UploadedFileDto } from "@/types/provider-catalog"

const FIELDS = ["title", "categoryId", "description", "price", "durationMinutes", "imageIds"] as const

/**
 * Add / edit a fixed-price service (PR-05, docs/provider-services-portfolio-feature.md) with a live
 * preview of the customer's card. Same fields and rules as onboarding step 5. Photos removed here
 * that were already saved are only dropped when the form is saved, so leaving without saving never
 * loses a photo.
 */
export function ServiceForm({ data }: { data: ProviderServiceFormData }) {
  const router = useRouter()
  const service = data.service
  const save = useSaveService(service?.id ?? null)
  const uploadImage = useUploadServiceImage()
  const deletePending = useDeletePendingServiceImage()
  const saved = new Set(service?.images.map((i) => i.id) ?? [])
  const [images, setImages] = useState<UploadedFileDto[]>((service ? service.images : data.pendingImages).slice(0, SERVICE_MAX_IMAGES))
  // Keep the current category selectable even if it's no longer one of the provider's open ones.
  const categories =
    service && !data.categories.some((c) => c.id === service.categoryId)
      ? [...data.categories, { id: service.categoryId, name: service.category, parentName: null }]
      : data.categories

  const form = useForm<ServiceFormInput, unknown, ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: service?.title ?? "",
      categoryId: service?.categoryId ?? (categories.length === 1 ? categories[0].id : ""),
      description: service?.description ?? "",
      price: service?.price ?? "",
      durationMinutes: service?.durationMinutes ?? 60,
      imageIds: images.map((i) => i.id),
    },
  })
  const { register, control, handleSubmit, setError, setValue, formState } = form
  const values = useWatch({ control })
  const dirty = formState.isDirty && !save.isSuccess
  const confirmLeave = useUnsavedChanges(dirty)

  const syncImages = (next: UploadedFileDto[]) => {
    setImages(next)
    setValue("imageIds", next.map((i) => i.id), { shouldDirty: true })
  }

  const submit = handleSubmit((v) =>
    save.mutate(v, {
      onSuccess: () => {
        toast.success(service ? "Service saved" : "Service added")
        router.push("/provider/services")
      },
      onError: (error) => applyApiErrors(error, setError, FIELDS),
    }),
  )

  const price = Number(values.price)
  const duration = Number(values.durationMinutes)
  const back = (
    <Button variant="ghost" size="sm" className="-ms-2" render={<Link href="/provider/services" onClick={(e) => !confirmLeave() && e.preventDefault()} />}>
      <ArrowLeft data-icon="inline-start" className="rtl:-scale-x-100" aria-hidden />
      My services
    </Button>
  )

  return (
    <div className="space-y-6">
      {back}
      <PageHeader
        title={service ? "Edit service" : "Add a service"}
        description={service ? "Changes show to customers as soon as you save." : "A job you do often, at a clear price. Customers can book it right away."}
      />

      {service?.visibility === "HIDDEN_BY_ADMIN" ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden />
          <AlertTitle>Livo has hidden this service</AlertTitle>
          <AlertDescription>
            {service.hiddenByAdminReason ?? "It doesn't follow the listing rules."} Saving changes doesn&apos;t make it visible again — contact support to have it reviewed.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <form id="service-form" className="grid gap-5" onSubmit={submit} noValidate>
          <FormField id="svc-title" label="Service name" error={formState.errors.title?.message} helper="e.g. Gas water heater installation, cleaning an apartment up to 120 m².">
            <Input id="svc-title" aria-invalid={!!formState.errors.title} aria-describedby="svc-title-msg" {...register("title")} />
          </FormField>

          <FormField id="svc-category" label="Category" error={formState.errors.categoryId?.message}>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <OptionSelect
                  id="svc-category"
                  value={field.value}
                  onChange={field.onChange}
                  options={categories.map((c) => ({ id: c.id, name: c.parentName ? `${c.parentName} · ${c.name}` : c.name }))}
                  placeholder="Choose from your specialties"
                  invalid={!!formState.errors.categoryId}
                />
              )}
            />
          </FormField>

          <FormField id="svc-desc" label="Service description" error={formState.errors.description?.message} helper="What the service includes, and what isn't in the price (like materials).">
            <Textarea id="svc-desc" rows={5} maxLength={SERVICE_DESCRIPTION_MAX} aria-invalid={!!formState.errors.description} aria-describedby="svc-desc-msg" {...register("description")} />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="svc-price" label="Price (EGP)" error={formState.errors.price?.message} helper={`From ${SERVICE_PRICE_MIN} to ${SERVICE_PRICE_MAX.toLocaleString("en")} EGP`}>
              <Input
                id="svc-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                dir="ltr"
                className="text-start tabular-nums"
                aria-invalid={!!formState.errors.price}
                aria-describedby="svc-price-msg"
                {...register("price")}
              />
            </FormField>
            <FormField id="svc-duration" label="Estimated duration" error={formState.errors.durationMinutes?.message}>
              <Controller
                control={control}
                name="durationMinutes"
                render={({ field }) => (
                  <OptionSelect
                    id="svc-duration"
                    value={String(field.value ?? "")}
                    onChange={(v) => field.onChange(Number(v))}
                    options={SERVICE_DURATION_OPTIONS.map((m) => ({ id: String(m), name: formatDuration(m) }))}
                    placeholder="Choose the duration"
                    invalid={!!formState.errors.durationMinutes}
                  />
                )}
              />
            </FormField>
          </div>

          <FormField
            id="svc-images"
            label="Photos of your work"
            optional
            error={formState.errors.imageIds?.message}
            helper={`Up to ${SERVICE_MAX_IMAGES} photos. The first photo is the one shown on the card.`}
          >
            <ImageUploader
              id="svc-images"
              label="Add photos"
              files={images}
              maxFiles={SERVICE_MAX_IMAGES}
              upload={(file, onProgress) => uploadImage.mutateAsync({ file, onProgress })}
              // A saved photo leaves only when the form is saved; an unsaved upload is deleted now.
              remove={async (file) => {
                if (!saved.has(file.id)) await deletePending.mutateAsync(file.id)
              }}
              onUploaded={(file) => syncImages([...images, file])}
              onRemoved={(file) => syncImages(images.filter((i) => i.id !== file.id))}
            />
          </FormField>
        </form>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-sm font-medium text-muted-foreground">This is how customers will see it</p>
          <ServicePreviewCard
            title={values.title ?? ""}
            providerName={data.providerName}
            categoryName={categories.find((c) => c.id === values.categoryId)?.name ?? null}
            price={Number.isFinite(price) ? price : null}
            durationMinutes={Number.isFinite(duration) ? duration : null}
            imageUrl={images[0]?.previewUrl ?? null}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button variant="outline" size="lg" render={<Link href="/provider/services" onClick={(e) => !confirmLeave() && e.preventDefault()} />}>
          Cancel
        </Button>
        <Button type="submit" form="service-form" size="lg" disabled={save.isPending}>
          {save.isPending ? <Spinner data-icon="inline-start" /> : null}
          {service ? "Save changes" : "Add service"}
        </Button>
      </div>
    </div>
  )
}
