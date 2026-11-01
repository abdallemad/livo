"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { ImageUploader } from "@/components/forms/ImageUploader"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { PORTFOLIO_DESCRIPTION_MAX, PORTFOLIO_MAX_IMAGES } from "@/constants/provider-catalog"
import { useDeletePendingPortfolioImage, useSavePortfolioItem, useUploadPortfolioImage } from "@/hooks/use-provider-catalog"
import { applyApiErrors } from "@/lib/form-errors"
import { portfolioItemSchema, type PortfolioItemInput, type PortfolioItemValues } from "@/schemas/provider-catalog.schema"
import type { PortfolioItemDto, UploadedFileDto } from "@/types/provider-catalog"

const FIELDS = ["title", "description", "imageIds"] as const

/**
 * Add / edit one portfolio item (PR-04): a title, an optional description and 1–6 photos.
 * Saved photos removed here only go when the item is saved; unsaved uploads are deleted at once.
 */
export function PortfolioItemDialog({ item, pendingImages, trigger }: { item: PortfolioItemDto | null; pendingImages: UploadedFileDto[]; trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false)
  const save = useSavePortfolioItem(item?.id ?? null)
  const upload = useUploadPortfolioImage()
  const deletePending = useDeletePendingPortfolioImage()
  const startImages = () => (item ? item.images : pendingImages).slice(0, PORTFOLIO_MAX_IMAGES)
  const [images, setImages] = useState<UploadedFileDto[]>(startImages)
  const saved = new Set(item?.images.map((i) => i.id) ?? [])

  const form = useForm<PortfolioItemInput, unknown, PortfolioItemValues>({
    resolver: zodResolver(portfolioItemSchema),
    defaultValues: { title: item?.title ?? "", description: item?.description ?? "", imageIds: startImages().map((i) => i.id) },
  })
  const { register, handleSubmit, setError, setValue, formState, reset } = form

  const syncImages = (next: UploadedFileDto[]) => {
    setImages(next)
    setValue("imageIds", next.map((i) => i.id), { shouldDirty: true, shouldValidate: formState.isSubmitted })
  }

  const submit = handleSubmit((values) =>
    save.mutate(values, {
      onSuccess: () => {
        toast.success(item ? "Portfolio item saved" : "Added to your portfolio")
        setOpen(false)
      },
      onError: (error) => applyApiErrors(error, setError, FIELDS),
    }),
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          const start = startImages()
          setImages(start)
          reset({ title: item?.title ?? "", description: item?.description ?? "", imageIds: start.map((i) => i.id) })
        }
        setOpen(next)
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{item ? "Edit portfolio item" : "Add past work"}</DialogTitle>
            <DialogDescription>Photos of a job you did. Customers see them on your profile.</DialogDescription>
          </DialogHeader>
          <FormField id="pf-title" label="What was the job?" error={formState.errors.title?.message} helper="e.g. Full bathroom tiling, 6 m²">
            <Input id="pf-title" aria-invalid={!!formState.errors.title} aria-describedby="pf-title-msg" {...register("title")} />
          </FormField>
          <FormField id="pf-desc" label="Details" optional error={formState.errors.description?.message} helper="Materials, size, how long it took.">
            <Textarea id="pf-desc" rows={3} maxLength={PORTFOLIO_DESCRIPTION_MAX} aria-invalid={!!formState.errors.description} aria-describedby="pf-desc-msg" {...register("description")} />
          </FormField>
          <FormField id="pf-images" label="Photos" error={formState.errors.imageIds?.message} helper={`1 to ${PORTFOLIO_MAX_IMAGES} photos. The first one is the cover.`}>
            <ImageUploader
              id="pf-images"
              label="Add photos"
              files={images}
              maxFiles={PORTFOLIO_MAX_IMAGES}
              invalid={!!formState.errors.imageIds}
              upload={(file, onProgress) => upload.mutateAsync({ file, onProgress })}
              remove={async (file) => {
                if (!saved.has(file.id)) await deletePending.mutateAsync(file.id)
              }}
              onUploaded={(file) => syncImages([...images, file])}
              onRemoved={(file) => syncImages(images.filter((i) => i.id !== file.id))}
            />
          </FormField>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <Spinner data-icon="inline-start" /> : null}
              {item ? "Save changes" : "Add to portfolio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
