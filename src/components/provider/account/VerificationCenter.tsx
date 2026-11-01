"use client"

import Link from "next/link"
import { ExternalLink, FileText, Info, LockKeyhole, Send, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { ImageUploader } from "@/components/forms/ImageUploader"
import { HistoryCard } from "@/components/admin/shared/HistoryCard"
import { ConfirmDialog, MetaBadge, PageHeader } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PROVIDER_STATUS } from "@/constants/status"
import { useDeleteVerificationDocument, useProviderVerification, useResubmitVerification, useUploadVerificationDocument } from "@/hooks/use-provider-account"
import type { DocumentType } from "@/schemas/onboarding.schema"
import type { ProviderVerification, VerificationDocumentDto } from "@/types/provider-account"
import { formatDateTime } from "@/utils/format"
import { DOCUMENT_LABEL } from "@/utils/verification"

const SLOTS: { type: DocumentType; title: string; help: string; capture?: "user" }[] = [
  { type: "NATIONAL_ID", title: "National ID", help: "A clear photo of the front of your ID card, all four corners visible." },
  { type: "SELFIE", title: "Selfie", help: "A clear photo of your face, so we can match it with your ID.", capture: "user" },
  { type: "CERTIFICATE", title: "Certificates (optional)", help: "Trade or training certificates. A photo or a PDF." },
]

/** Read-only list (under review, suspended, or identity on an active account): open each through its signed link. */
function ReadOnlyDocs({ docs }: { docs: VerificationDocumentDto[] }) {
  if (!docs.length) return <p className="text-sm text-muted-foreground">None uploaded.</p>
  return (
    <ul className="flex flex-wrap gap-2">
      {docs.map((d) => (
        <li key={d.id}>
          <Button variant="outline" size="sm" render={<a href={d.previewUrl} target="_blank" rel="noreferrer" />}>
            <FileText data-icon="inline-start" aria-hidden />
            {DOCUMENT_LABEL[d.type]} · {formatDateTime(d.uploadedAt)}
            <ExternalLink data-icon="inline-end" aria-hidden />
          </Button>
        </li>
      ))}
    </ul>
  )
}

function DocumentSlot({ slot, docs, editable, max }: { slot: (typeof SLOTS)[number]; docs: VerificationDocumentDto[]; editable: boolean; max: number }) {
  const upload = useUploadVerificationDocument(slot.type)
  const remove = useDeleteVerificationDocument()
  const id = `doc-${slot.type.toLowerCase()}`
  return (
    <FormField id={id} label={slot.title} helper={editable ? slot.help : undefined}>
      {editable ? (
        <ImageUploader
          id={id}
          label={docs.length ? "Replace" : "Upload"}
          files={docs}
          maxFiles={max}
          allowPdf={slot.type === "CERTIFICATE"}
          capture={slot.capture}
          upload={(file, onProgress) => upload.mutateAsync({ file, onProgress }).then((d) => { toast.success(`${DOCUMENT_LABEL[slot.type]} uploaded`); return d })}
          remove={(file) => remove.mutateAsync(file.id)}
        />
      ) : (
        <ReadOnlyDocs docs={docs} />
      )}
    </FormField>
  )
}

/**
 * `/provider/verification` (PR-02, PR-03; docs/provider-verification-settings-feature.md): the account's
 * status in plain words, the admin's reason when rejected or suspended, the documents (editable only
 * when the status allows — `utils/verification.ts`), "Send for review again" after a rejection, and the
 * history of submissions and decisions. First snapshot from the server.
 */
export function VerificationCenter({ initialData }: { initialData: ProviderVerification }) {
  const { data } = useProviderVerification(initialData)
  const resubmit = useResubmitVerification()
  const meta = PROVIDER_STATUS[data.status]
  const byType = (t: DocumentType) => data.documents.filter((d) => d.type === t)

  return (
    <div className="space-y-6">
      <PageHeader title="Account verification" description="Your account status and the documents we checked." actions={<MetaBadge meta={meta} className="h-8 px-3 text-sm" />} />

      <Alert variant={data.status === "APPROVED" ? "success" : data.status === "PENDING" || data.status === "DRAFT" ? "warning" : "destructive"}>
        <ShieldCheck aria-hidden />
        <AlertTitle>{meta.label}</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{data.statusText}</p>
          {data.reason ? (
            <p>
              <span className="font-medium">{data.status === "SUSPENDED" ? "Why:" : "What to fix:"}</span> {data.reason}
            </p>
          ) : null}
          {data.reviewedAt ? <p className="text-xs">Last decision {formatDateTime(data.reviewedAt)}</p> : null}
          {data.access.continueOnboarding ? (
            <Button size="sm" render={<Link href="/onboarding" />}>
              Finish signing up
            </Button>
          ) : null}
          {data.status === "SUSPENDED" ? (
            <Button size="sm" variant="outline" render={<Link href="/contact" />}>
              Contact support
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your documents</CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <LockKeyhole className="size-4 shrink-0" aria-hidden />
            Private: only you and Livo&apos;s review team can see them. Customers never do.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {data.status === "APPROVED" ? (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              Your ID and selfie are verified and locked. You can still add or remove certificates.
            </p>
          ) : null}
          {SLOTS.map((slot) => (
            <DocumentSlot
              key={slot.type}
              slot={slot}
              docs={byType(slot.type)}
              editable={slot.type === "CERTIFICATE" ? data.access.canEditCertificates : data.access.canEditIdentity}
              max={slot.type === "CERTIFICATE" ? data.maxCertificates : 1}
            />
          ))}
        </CardContent>
      </Card>

      {data.access.canResubmit ? (
        <Card className="border-primary/30">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>Fixed everything? Send your application so we can check it again.</p>
            {data.resubmitBlockedReason ? (
              <Tooltip>
                <TooltipTrigger render={<span tabIndex={0} />}>
                  <Button size="lg" disabled>
                    <Send data-icon="inline-start" aria-hidden />
                    Send for review again
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-64">{data.resubmitBlockedReason}</TooltipContent>
              </Tooltip>
            ) : (
              <ConfirmDialog
                trigger={
                  <Button size="lg" disabled={resubmit.isPending}>
                    <Send data-icon="inline-start" aria-hidden />
                    Send for review again
                  </Button>
                }
                title="Send your application for review again?"
                description="Our team checks your documents again and lets you know. You can't change them while it's being reviewed."
                confirmLabel="Send for review"
                cancelLabel="Not yet"
                destructive={false}
                onConfirm={() => resubmit.mutate(undefined, { onSuccess: () => toast.success("Sent for review"), onError: (e) => toast.error(e.message) })}
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      <HistoryCard entries={data.history} />
    </div>
  )
}
