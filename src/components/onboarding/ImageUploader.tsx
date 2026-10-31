"use client"

import { useState } from "react"
import { useDropzone, type Accept } from "react-dropzone"
import { FileText, ImagePlus, RotateCcw, Trash2, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { compressImage } from "@/lib/image-compress"
import { cn } from "@/lib/utils"
import type { OnboardingFileDto } from "@/types/onboarding"

interface PendingUpload {
  key: string
  file: File
  /** Local object URL so the user sees the photo while it uploads. */
  previewUrl: string | null
  progress: number
  failed: boolean
}

interface ImageUploaderProps {
  id: string
  label: string
  files: OnboardingFileDto[]
  maxFiles: number
  /** Allow PDFs (certificates). Images are always allowed. */
  allowPdf?: boolean
  /** Opens the front camera on phones (selfie). */
  capture?: "user" | "environment"
  upload: (file: Blob, onProgress: (fraction: number) => void) => Promise<OnboardingFileDto>
  remove: (file: OnboardingFileDto) => Promise<void>
  onUploaded?: (file: OnboardingFileDto) => void
  onRemoved?: (file: OnboardingFileDto) => void
  invalid?: boolean
  disabled?: boolean
}

const IMAGE_ACCEPT: Accept = { "image/jpeg": [], "image/png": [], "image/webp": [] }

/**
 * Drop zone + thumbnails for onboarding uploads (NF-08): compresses images
 * in the browser, shows per-file progress, keeps failed files with a retry
 * button instead of losing them on a weak connection. Thumbnails use the
 * owner-only preview route; nothing here is a public URL.
 */
export function ImageUploader({
  id,
  label,
  files,
  maxFiles,
  allowPdf,
  capture,
  upload,
  remove,
  onUploaded,
  onRemoved,
  invalid,
  disabled,
}: ImageUploaderProps) {
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [removing, setRemoving] = useState<string | null>(null)
  const slotsLeft = maxFiles - files.length - pending.filter((p) => !p.failed).length
  const full = slotsLeft <= 0

  const start = async (item: PendingUpload) => {
    const update = (patch: Partial<PendingUpload>) =>
      setPending((list) => list.map((p) => (p.key === item.key ? { ...p, ...patch } : p)))
    update({ progress: 0, failed: false })
    try {
      const blob = await compressImage(item.file)
      const saved = await upload(blob, (fraction) => update({ progress: fraction }))
      setPending((list) => list.filter((p) => p.key !== item.key))
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      onUploaded?.(saved)
    } catch {
      update({ failed: true })
    }
  }

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: allowPdf ? { ...IMAGE_ACCEPT, "application/pdf": [] } : IMAGE_ACCEPT,
    disabled: disabled || full,
    multiple: maxFiles > 1,
    noClick: true,
    onDrop: (accepted) => {
      const items = accepted.slice(0, Math.max(slotsLeft, 0)).map((file) => ({
        key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        progress: 0,
        failed: false,
      }))
      setPending((list) => [...list, ...items])
      items.forEach((item) => void start(item))
    },
  })

  const handleRemove = async (file: OnboardingFileDto) => {
    setRemoving(file.id)
    try {
      await remove(file)
      onRemoved?.(file)
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {(files.length > 0 || pending.length > 0) && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((file) => (
            <li key={file.id} className="relative overflow-hidden rounded-lg border bg-muted">
              <Thumb src={file.previewUrl} pdf={file.mimeType === "application/pdf"} />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute end-2 top-2 shadow-md"
                aria-label="امسح الملف"
                loading={removing === file.id}
                disabled={disabled}
                onClick={() => void handleRemove(file)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
          {pending.map((item) => (
            <li key={item.key} className="relative overflow-hidden rounded-lg border bg-muted">
              <Thumb src={item.previewUrl} pdf={!item.previewUrl} dimmed />
              <div className="absolute inset-x-2 bottom-2 flex flex-col gap-1 rounded-md bg-card/95 p-2 shadow-md">
                {item.failed ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-destructive">الرفع ما كملش</span>
                    <div className="flex gap-1">
                      <Button type="button" size="icon-sm" variant="outline" aria-label="جرّب تاني" onClick={() => void start(item)}>
                        <RotateCcw />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label="الغِ"
                        onClick={() => setPending((list) => list.filter((p) => p.key !== item.key))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      جارٍ الرفع… <bdi dir="ltr">{Math.round(item.progress * 100)}%</bdi>
                    </span>
                    <Progress value={Math.round(item.progress * 100)} aria-label="نسبة الرفع" />
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <div
          {...getRootProps({
            className: cn(
              "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed bg-card px-4 py-8 text-center transition-colors",
              isDragActive && "border-primary bg-primary/5",
              invalid && "border-destructive/60",
              disabled && "opacity-50"
            ),
          })}
        >
          <input {...getInputProps({ id, capture, "aria-describedby": `${id}-msg` } as React.InputHTMLAttributes<HTMLInputElement>)} />
          <UploadCloud className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">{isDragActive ? "سيب الملف هنا" : allowPdf ? "صورة أو PDF" : "صور JPG أو PNG أو WebP"}</p>
          <Button type="button" variant="outline" onClick={open} disabled={disabled}>
            <ImagePlus data-icon="inline-start" aria-hidden />
            {label}
          </Button>
        </div>
      )}
    </div>
  )
}

function Thumb({ src, pdf, dimmed }: { src: string | null; pdf?: boolean; dimmed?: boolean }) {
  return (
    <div className={cn("flex aspect-[4/3] items-center justify-center", dimmed && "opacity-70")}>
      {pdf || !src ? (
        <FileText className="size-10 text-muted-foreground" aria-label="ملف PDF" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- owner-only signed preview / local blob URL, not optimisable by next/image
        <img src={src} alt="" className="size-full object-cover" loading="lazy" />
      )}
    </div>
  )
}
