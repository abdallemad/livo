"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, BellRing, Clock, MapPin, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { ImageUploader } from "@/components/forms/ImageUploader"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { PageHeader } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useCreateRequest, useDeleteRequestPhoto, useUploadRequestPhoto } from "@/hooks/use-customer"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { applyApiErrors } from "@/lib/form-errors"
import { cn } from "@/lib/utils"
import { newRequestSchema, type NewRequestInput, type NewRequestValues } from "@/schemas/customer.schema"
import type { NewRequestFormData, RequestPhotoDto } from "@/types/customer"
import { REQUEST_BUDGET_MIN, REQUEST_DESCRIPTION_MAX, REQUEST_MAX_PHOTOS, REQUEST_TITLE_MAX } from "@/utils/new-request"

const FIELDS = ["categoryId", "title", "description", "sizeM2", "addressId", "areaId", "budget", "preferredDate", "imageIds"] as const

type Where = "address" | "area"

/**
 * `/account/requests/new` (CU-03, Flow 2; docs/customer-new-request-feature.md): describe the job, add photos, choose the
 * category, where it is, an optional budget and date. Sending opens the request right away and notifies matching providers.
 * Uploaded photos survive a refresh (they're listed as pending until sent).
 */
export function NewRequestForm({ data }: { data: NewRequestFormData }) {
  const router = useRouter()
  const create = useCreateRequest()
  const uploadPhoto = useUploadRequestPhoto()
  const deletePhoto = useDeleteRequestPhoto()
  const [photos, setPhotos] = useState<RequestPhotoDto[]>(data.pendingPhotos)
  const defaultAddress = data.addresses.find((a) => a.isDefault) ?? data.addresses[0]
  const [where, setWhere] = useState<Where>(defaultAddress ? "address" : "area")

  const form = useForm<NewRequestInput, unknown, NewRequestValues>({
    resolver: zodResolver(newRequestSchema),
    defaultValues: {
      categoryId: data.preselectedCategoryId ?? "",
      title: "",
      description: "",
      sizeM2: "",
      addressId: defaultAddress?.id ?? "",
      areaId: "",
      budget: "",
      preferredDate: "",
      imageIds: photos.map((p) => p.id),
    },
  })
  const { register, control, handleSubmit, setError, setValue, formState } = form
  const description = useWatch({ control, name: "description" }) ?? ""
  const confirmLeave = useUnsavedChanges(formState.isDirty && !create.isSuccess)

  const syncPhotos = (next: RequestPhotoDto[]) => {
    setPhotos(next)
    setValue("imageIds", next.map((p) => p.id), { shouldDirty: true })
  }

  const chooseWhere = (next: Where) => {
    setWhere(next)
    // Only one of the two is sent; the other is cleared so the service never has to pick.
    if (next === "address") setValue("areaId", "")
    else setValue("addressId", "")
  }

  const submit = handleSubmit((v) =>
    create.mutate(v, {
      onSuccess: ({ notified }) => {
        toast.success("Request sent", {
          description: notified > 0 ? `We told ${notified} matching provider${notified === 1 ? "" : "s"}. Quotes will show in My requests.` : "Quotes will show in My requests as providers reply.",
        })
        router.push("/account/requests")
      },
      onError: (error) => applyApiErrors(error, setError, FIELDS),
    }),
  )

  const noPlace = data.addresses.length === 0 && data.areas.length === 0
  const errors = formState.errors

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ms-2" render={<Link href="/account/requests" onClick={(e) => !confirmLeave() && e.preventDefault()} />}>
        <ArrowLeft data-icon="inline-start" className="rtl:-scale-x-100" aria-hidden />
        My requests
      </Button>
      <PageHeader title="Request a quote" description="Describe the job once — verified providers near you send their prices, and you choose." />

      {data.categories.length === 0 ? (
        <Alert>
          <AlertTitle>No categories take quote requests right now</AlertTitle>
          <AlertDescription>
            You can still book a fixed-price job from <Link href="/services" className="underline underline-offset-4">Services</Link>.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <form id="new-request-form" className="grid gap-5" onSubmit={submit} noValidate>
          <FormField id="req-category" label="What kind of job is it?" error={errors.categoryId?.message}>
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <OptionSelect
                  id="req-category"
                  value={field.value}
                  onChange={field.onChange}
                  options={data.categories.map((c) => ({ id: c.id, name: c.parentName ? `${c.parentName} · ${c.name}` : c.name }))}
                  placeholder="Choose a category"
                  invalid={!!errors.categoryId}
                />
              )}
            />
          </FormField>

          <FormField id="req-title" label="Title" error={errors.title?.message} helper="e.g. Paint a 3-room apartment, fix a leaking kitchen sink.">
            <Input id="req-title" maxLength={REQUEST_TITLE_MAX} aria-invalid={!!errors.title} aria-describedby="req-title-msg" {...register("title")} />
          </FormField>

          <FormField
            id="req-desc"
            label="Describe the job"
            error={errors.description?.message}
            helper={
              <span className="flex w-full justify-between gap-3">
                <span>What needs doing, materials, access. Don&apos;t add your phone number — you&apos;ll get the provider&apos;s once you book.</span>
                <span className="shrink-0 tabular-nums">
                  {description.length}/{REQUEST_DESCRIPTION_MAX}
                </span>
              </span>
            }
          >
            <Textarea id="req-desc" rows={6} maxLength={REQUEST_DESCRIPTION_MAX} aria-invalid={!!errors.description} aria-describedby="req-desc-msg" {...register("description")} />
          </FormField>

          <FormField id="req-size" label="Approximate size (m²)" optional error={errors.sizeM2?.message} helper="Helps providers price painting, flooring, cleaning and finishing.">
            <Input id="req-size" type="number" inputMode="numeric" min={1} dir="ltr" className="text-start tabular-nums sm:max-w-48" aria-invalid={!!errors.sizeM2} aria-describedby="req-size-msg" {...register("sizeM2")} />
          </FormField>

          <FormField
            id="req-photos"
            label="Photos"
            optional
            error={errors.imageIds?.message}
            helper={`Up to ${REQUEST_MAX_PHOTOS} photos. Only you and Livo can open them.`}
          >
            <ImageUploader
              id="req-photos"
              label="Add photos"
              files={photos}
              maxFiles={REQUEST_MAX_PHOTOS}
              upload={(file, onProgress) => uploadPhoto.mutateAsync({ file, onProgress })}
              remove={(file) => deletePhoto.mutateAsync(file.id)}
              onUploaded={(file) => syncPhotos([...photos, file])}
              onRemoved={(file) => syncPhotos(photos.filter((p) => p.id !== file.id))}
            />
          </FormField>

          <fieldset className="grid gap-3">
            <legend className="mb-2 text-base font-medium">Where is the job?{data.city ? <span className="font-normal text-muted-foreground"> · {data.city}</span> : null}</legend>
            {noPlace ? (
              <Alert>
                <MapPin aria-hidden />
                <AlertTitle>Add an address first</AlertTitle>
                <AlertDescription>
                  Providers need to know the area. <Link href="/account/addresses" className="underline underline-offset-4">Add an address</Link>, then come back.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {data.addresses.length > 0 && data.areas.length > 0 ? (
                  <div role="radiogroup" aria-label="Location" className="inline-flex w-fit rounded-lg border p-1">
                    {(
                      [
                        ["address", "My address"],
                        ["area", "Just the area"],
                      ] as const
                    ).map(([id, text]) => (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={where === id}
                        onClick={() => chooseWhere(id)}
                        className={cn("h-9 rounded-md px-3 text-sm transition-colors", where === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                ) : null}

                {where === "address" && data.addresses.length > 0 ? (
                  <FormField id="req-address" label="Address" error={errors.addressId?.message} helper="Providers see only the area until you book.">
                    <Controller
                      control={control}
                      name="addressId"
                      render={({ field }) => (
                        <OptionSelect id="req-address" value={field.value ?? ""} onChange={field.onChange} options={data.addresses.map((a) => ({ id: a.id, name: a.label }))} placeholder="Choose an address" invalid={!!errors.addressId} />
                      )}
                    />
                  </FormField>
                ) : (
                  <FormField id="req-area" label="Area" error={errors.areaId?.message ?? errors.addressId?.message} helper="You can add the exact address after you book.">
                    <Controller
                      control={control}
                      name="areaId"
                      render={({ field }) => (
                        <OptionSelect id="req-area" value={field.value ?? ""} onChange={field.onChange} options={data.areas} placeholder="Choose an area" invalid={!!(errors.areaId ?? errors.addressId)} />
                      )}
                    />
                  </FormField>
                )}
              </>
            )}
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="req-budget" label="Budget (EGP)" optional error={errors.budget?.message} helper={`A rough figure helps providers; from ${REQUEST_BUDGET_MIN} EGP.`}>
              <Input id="req-budget" type="number" inputMode="decimal" min={REQUEST_BUDGET_MIN} dir="ltr" className="text-start tabular-nums" aria-invalid={!!errors.budget} aria-describedby="req-budget-msg" {...register("budget")} />
            </FormField>
            <FormField id="req-date" label="Preferred date" optional error={errors.preferredDate?.message} helper="When you'd like the work to start.">
              <Input id="req-date" type="date" min={data.today} max={data.maxDate} dir="ltr" className="text-start" aria-invalid={!!errors.preferredDate} aria-describedby="req-date-msg" {...register("preferredDate")} />
            </FormField>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="lg" disabled={create.isPending || data.categories.length === 0 || noPlace}>
              {create.isPending ? <Spinner data-icon="inline-start" /> : null}
              Send request
            </Button>
            <p className="text-sm text-muted-foreground">Open for {data.expiryDays} days. You can cancel it any time before you accept a quote.</p>
          </div>
        </form>

        <Card className="lg:sticky lg:top-4 lg:self-start">
          <CardHeader>
            <CardTitle className="text-base">What happens next</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <BellRing className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>Verified providers who cover your area and this category are notified.</span>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>Quotes arrive in My requests with a price, duration and message. Compare and accept one.</span>
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>Your phone number and exact address stay private until you book.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
