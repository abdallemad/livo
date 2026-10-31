"use client"

import Link from "next/link"
import { AlertTriangle, ExternalLink, FileText, ImageIcon, Star } from "lucide-react"
import type { DocumentType } from "@prisma/client"
import { DetailField } from "@/components/admin/shared/DetailField"
import { HistoryCard } from "@/components/admin/shared/HistoryCard"
import { PageHeader, ProviderStatusBadge, UserStatusBadge } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAdminProvider } from "@/hooks/use-admin-providers"
import type { AdminProviderDetail } from "@/types/admin"
import { formatDate, formatDateTime, formatNumber, formatPhone, formatPrice } from "@/utils/format"
import { ProviderDecisionActions } from "./ProviderDecisionActions"

const DOCUMENT_LABEL: Record<DocumentType, string> = {
  NATIONAL_ID: "National ID",
  SELFIE: "Selfie",
  CERTIFICATE: "Certificate",
  OTHER: "Other document",
}

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

/**
 * `/admin/providers/[id]` (AD-01): everything needed to decide — identity,
 * documents (private, opened through the admin-only signed-link route),
 * services, track record and the decision history — plus the actions that
 * fit the current status. Refetches after every decision.
 */
export function ProviderReview({ initialData }: { initialData: AdminProviderDetail }) {
  const { data: p } = useAdminProvider(initialData.id, initialData)

  return (
    <div className="space-y-6">
      <PageHeader
        title={p.name}
        description={`Provider in ${p.city} · joined ${formatDate(p.joinedAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ProviderStatusBadge status={p.verificationStatus} />
            <ProviderDecisionActions id={p.id} name={p.name} status={p.verificationStatus} size="default" />
          </div>
        }
      />

      {(p.verificationStatus === "REJECTED" || p.verificationStatus === "SUSPENDED") && p.rejectionReason ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden />
          <AlertTitle>{p.verificationStatus === "REJECTED" ? "Application rejected" : "Provider suspended"}</AlertTitle>
          <AlertDescription>
            “{p.rejectionReason}”
            {p.reviewedAt ? ` — ${p.reviewedBy ?? "an admin"}, ${formatDateTime(p.reviewedAt)}` : null}
          </AlertDescription>
        </Alert>
      ) : null}
      {p.userStatus !== "ACTIVE" ? (
        <Alert variant="warning">
          <AlertTriangle aria-hidden />
          <AlertTitle>The whole account is {p.userStatus.toLowerCase()}</AlertTitle>
          <AlertDescription>
            This user can&apos;t sign in to any dashboard. Manage it on the{" "}
            <Link href={`/admin/users/${p.id}`} className="underline">
              user page
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}
      {p.underReview ? (
        <Alert variant="warning">
          <Star aria-hidden />
          <AlertTitle>Flagged for low ratings</AlertTitle>
          <AlertDescription>The average rating fell below the threshold after enough bookings (BR-04).</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <DetailField label="Phone">{p.phone ? <bdi dir="ltr">{formatPhone(p.phone)}</bdi> : "—"}</DetailField>
                <DetailField label="Email">{p.email ?? "—"}</DetailField>
                <DetailField label="Specialties">
                  {p.categories.length ? (
                    <span className="flex flex-wrap gap-1">
                      {p.categories.map((c) => (
                        <Badge key={c} variant="secondary">
                          {c}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    "—"
                  )}
                </DetailField>
                <DetailField label="Service areas">{p.areas.length ? p.areas.join(", ") : `All of ${p.city}`}</DetailField>
                <DetailField label="Experience">
                  {p.yearsExperience !== null ? `${formatNumber(p.yearsExperience)} years` : "Not given"}
                </DetailField>
                <DetailField label="Account">
                  <span className="flex items-center gap-2">
                    <UserStatusBadge status={p.userStatus} />
                    <Link href={`/admin/users/${p.id}`} className="text-sm text-primary hover:underline">
                      User page
                    </Link>
                  </span>
                </DetailField>
                <DetailField label="About" className="sm:col-span-2">
                  <span className="whitespace-pre-line">{p.bio || "No bio yet."}</span>
                </DetailField>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verification documents</CardTitle>
              <CardDescription>Private. Each link opens a copy that expires after 5 minutes.</CardDescription>
            </CardHeader>
            <CardContent>
              {p.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {p.documents.map((d) => (
                    <li key={d.id}>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          {d.mimeType === "application/pdf" ? <FileText className="size-5" aria-hidden /> : <ImageIcon className="size-5" aria-hidden />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{DOCUMENT_LABEL[d.type]}</span>
                          <span className="block text-xs text-muted-foreground">
                            {d.mimeType === "application/pdf" ? "PDF" : "Image"} · {formatSize(d.sizeBytes)} · {formatDate(d.uploadedAt)}
                          </span>
                        </span>
                        <ExternalLink className="size-4 text-muted-foreground" aria-hidden />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Services</CardTitle>
              <CardDescription>Fixed-price services. They&apos;re public only while the provider is active.</CardDescription>
            </CardHeader>
            <CardContent>
              {p.services.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-end">Price</TableHead>
                      <TableHead className="text-end">Photos</TableHead>
                      <TableHead>Listing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {p.services.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="max-w-64 whitespace-normal font-medium">{s.title}</TableCell>
                        <TableCell>{s.category}</TableCell>
                        <TableCell className="text-end tabular-nums">
                          <bdi dir="ltr">{formatPrice(s.price)}</bdi>
                        </TableCell>
                        <TableCell className="text-end tabular-nums">{s.imageCount}</TableCell>
                        <TableCell>
                          <Badge variant={s.isActive ? "success" : "neutral"}>{s.isActive ? "On" : "Off"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Track record</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <DetailField label="Rating">
                  {p.ratingCount ? (
                    <span className="flex items-center gap-1 tabular-nums">
                      <Star className="size-4 fill-commit text-commit" aria-hidden />
                      {p.ratingAvg.toFixed(1)} ({formatNumber(p.ratingCount)})
                    </span>
                  ) : (
                    "No reviews"
                  )}
                </DetailField>
                <DetailField label="Completed jobs">{formatNumber(p.completedCount)}</DetailField>
                <DetailField label="Portfolio items">{formatNumber(p.portfolioCount)}</DetailField>
                <DetailField label="Last decision">{p.reviewedAt ? formatDate(p.reviewedAt) : "—"}</DetailField>
              </dl>
            </CardContent>
          </Card>
          <HistoryCard entries={p.history} />
        </div>
      </div>
    </div>
  )
}
