"use client"

import { useEffect } from "react"
import { LockKeyhole } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { MAX_CERTIFICATES } from "@/constants/onboarding"
import { useDeleteDocument, useUploadDocument } from "@/hooks/use-onboarding"
import type { DocumentType } from "@/schemas/onboarding.schema"
import type { OnboardingDocumentDto } from "@/types/onboarding"
import { ImageUploader } from "@/components/forms/ImageUploader"
import { StepActions, StepCard } from "../StepCard"
import type { StepProps } from "./types"

const SLOTS: { type: DocumentType; label: string; helper: string; max: number; pdf?: boolean; capture?: "user" | "environment" }[] = [
  { type: "NATIONAL_ID", label: "ID photo", helper: "The front side, clear and without flash.", max: 1, capture: "environment" },
  { type: "SELFIE", label: "Selfie", helper: "A photo of your face in good lighting.", max: 1, capture: "user" },
  { type: "CERTIFICATE", label: "Certificates", helper: `Optional, up to ${MAX_CERTIFICATES} (photo or PDF).`, max: MAX_CERTIFICATES, pdf: true },
]

/**
 * Provider step 4 (PR-02). Each file uploads on its own as soon as it's
 * picked (nothing to lose on a weak connection), into the PRIVATE bucket.
 */
export function DocumentsStep({ state, onBack, onAdvance, onDirtyChange }: StepProps) {
  const upload = useUploadDocument()
  const remove = useDeleteDocument()
  const has = (type: DocumentType) => state.documents.some((d) => d.type === type)

  // Uploads save immediately, so this step never holds unsaved edits.
  useEffect(() => onDirtyChange(false), [onDirtyChange])

  const next = (intent: "next" | "exit") => {
    if (intent === "next" && (!has("NATIONAL_ID") || !has("SELFIE"))) {
      toast.error("Upload a photo of your ID and a selfie to continue.")
      return
    }
    onAdvance(intent)
  }

  return (
    <StepCard
      title="Verify your account"
      description="We review these only to confirm your identity. Customers never see them."
      footer={
        <StepActions onBack={onBack} onPrimary={() => next("next")} onSaveAndExit={() => next("exit")} primaryLabel="Next" />
      }
    >
      <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
        <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden />
        Documents are stored privately, and only the review team can open them.
      </p>
      <div className="grid gap-6">
        {SLOTS.map((slot) => {
          const files = state.documents.filter((d) => d.type === slot.type)
          return (
            <FormField key={slot.type} id={`ob-doc-${slot.type}`} label={slot.label} optional={slot.type === "CERTIFICATE"} helper={slot.helper}>
              <ImageUploader
                id={`ob-doc-${slot.type}`}
                label="Upload file"
                files={files}
                maxFiles={slot.max}
                allowPdf={slot.pdf}
                capture={slot.capture}
                upload={(file, onProgress) =>
                  upload.mutateAsync({ file, type: slot.type, onProgress }).catch((error: Error) => {
                    toast.error(error.message)
                    throw error
                  })
                }
                remove={(file) => remove.mutateAsync((file as OnboardingDocumentDto).id)}
              />
            </FormField>
          )
        })}
      </div>
    </StepCard>
  )
}
