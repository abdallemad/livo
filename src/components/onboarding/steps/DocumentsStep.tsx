"use client"

import { useEffect } from "react"
import { LockKeyhole } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { MAX_CERTIFICATES } from "@/constants/onboarding"
import { useDeleteDocument, useUploadDocument } from "@/hooks/use-onboarding"
import type { DocumentType } from "@/schemas/onboarding.schema"
import type { OnboardingDocumentDto } from "@/types/onboarding"
import { ImageUploader } from "../ImageUploader"
import { StepActions, StepCard } from "../StepCard"
import type { StepProps } from "./types"

const SLOTS: { type: DocumentType; label: string; helper: string; max: number; pdf?: boolean; capture?: "user" | "environment" }[] = [
  { type: "NATIONAL_ID", label: "صورة البطاقة", helper: "الوش، واضحة ومن غير فلاش.", max: 1, capture: "environment" },
  { type: "SELFIE", label: "صورة شخصية", helper: "صورة لوشّك في إضاءة كويسة.", max: 1, capture: "user" },
  { type: "CERTIFICATE", label: "الشهادات", helper: `اختياري، لحد ${MAX_CERTIFICATES} (صورة أو PDF).`, max: MAX_CERTIFICATES, pdf: true },
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
      toast.error("ارفع صورة البطاقة وصورتك الشخصية عشان تكمّل.")
      return
    }
    onAdvance(intent)
  }

  return (
    <StepCard
      title="وثّق حسابك"
      description="بنراجع البيانات دي بس عشان نتأكد من هويتك. العملاء ما بيشوفوهاش."
      footer={
        <StepActions onBack={onBack} onPrimary={() => next("next")} onSaveAndExit={() => next("exit")} primaryLabel="التالي" />
      }
    >
      <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
        <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden />
        المستندات بتتحفظ في مكان خاص، وفريق المراجعة بس اللي يقدر يفتحها.
      </p>
      <div className="grid gap-6">
        {SLOTS.map((slot) => {
          const files = state.documents.filter((d) => d.type === slot.type)
          return (
            <FormField key={slot.type} id={`ob-doc-${slot.type}`} label={slot.label} optional={slot.type === "CERTIFICATE"} helper={slot.helper}>
              <ImageUploader
                id={`ob-doc-${slot.type}`}
                label="ارفع الملف"
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
