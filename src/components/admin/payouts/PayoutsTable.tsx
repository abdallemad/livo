"use client"

import Link from "next/link"
import { AlertCircle, Banknote, CheckCircle2, Hourglass, Send, Wallet, XCircle } from "lucide-react"
import { toast } from "sonner"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { ReasonDialog } from "@/components/admin/shared/ReasonDialog"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { ConfirmDialog, EmptyState, MetaBadge, PageHeader, StatCard } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PAYOUT_STATUS } from "@/constants/status"
import { useAdminPayouts, useDecidePayout } from "@/hooks/use-admin-money"
import { useUrlQuery } from "@/hooks/use-url-query"
import { cn } from "@/lib/utils"
import { ADMIN_PAYOUT_STATUSES, payoutListQuerySchema } from "@/schemas/admin.schema"
import type { AdminPayoutListItem } from "@/types/admin"
import { formatDate, formatDateTime, formatNumber, formatPhone, formatPrice } from "@/utils/format"
import { MarkPaidDialog } from "./MarkPaidDialog"

const ALL = "ALL"
const COLUMNS = 6

/** A button that is disabled with the rule's sentence as a tooltip (DESIGN-SYSTEM: never a silent disabled button). */
function Guarded({ reason, children }: { reason: string | null; children: React.ReactElement }) {
  if (!reason) return children
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} />}>{children}</TooltipTrigger>
      <TooltipContent className="max-w-64">{reason}</TooltipContent>
    </Tooltip>
  )
}

function PayoutActions({ p }: { p: AdminPayoutListItem }) {
  const decide = useDecidePayout()
  const amount = formatPrice(p.amount)
  const destination = `${p.destinationType === "BANK" ? "bank account" : "wallet"} ${p.destinationRef}`

  if (p.status !== "REQUESTED" && p.status !== "APPROVED") return null

  return (
    <div className="flex flex-wrap justify-end gap-1">
      {p.status === "REQUESTED" ? (
        <Guarded reason={p.approveBlockedReason}>
          <ConfirmDialog
            trigger={
              <Button size="sm" disabled={!!p.approveBlockedReason || decide.isPending}>
                Approve
              </Button>
            }
            title={`Approve ${amount} for ${p.providerName}?`}
            description={`This reserves ${amount} of their balance. Send the money to ${destination}, then mark the payout as paid.`}
            confirmLabel="Approve payout"
            cancelLabel="Cancel"
            destructive={false}
            onConfirm={() =>
              decide.mutate(
                { id: p.id, status: "APPROVED" },
                { onSuccess: () => toast.success("Payout approved"), onError: (e) => toast.error(e.message) },
              )
            }
          />
        </Guarded>
      ) : (
        <Guarded reason={p.markPaidBlockedReason}>
          <MarkPaidDialog
            trigger={
              <Button size="sm" disabled={!!p.markPaidBlockedReason || decide.isPending}>
                Mark paid
              </Button>
            }
            title={`Mark ${amount} to ${p.providerName} as sent?`}
            description={`Only after you have transferred ${amount} to ${destination}. This deducts it from their wallet and notifies them.`}
            pending={decide.isPending}
            onSubmit={(values) =>
              decide.mutateAsync({ id: p.id, status: "PAID", ...values }).then(() => toast.success("Payout marked as paid"))
            }
          />
        </Guarded>
      )}
      {p.canReject ? (
        <ReasonDialog
          trigger={
            <Button size="sm" variant="ghost" className="text-destructive" disabled={decide.isPending}>
              Reject
            </Button>
          }
          title={`Reject ${p.providerName}'s payout of ${amount}?`}
          description="Nothing leaves their wallet. They are notified with your reason and can request again."
          confirmLabel="Reject payout"
          pending={decide.isPending}
          onSubmit={(reason) => decide.mutateAsync({ id: p.id, status: "REJECTED", reason }).then(() => toast.success("Payout rejected"))}
        />
      ) : null}
    </div>
  )
}

/**
 * `/admin/payouts` (AD-07, docs/admin-commission-payouts-feature.md): provider withdrawal
 * requests with each provider's wallet (balance, reserved, available), filterable by status and
 * search; approve / reject / mark paid. Rules in `utils/payout-rules.ts`. Filters live in the URL.
 */
export function PayoutsTable() {
  const { query, hrefWith, setQuery } = useUrlQuery(payoutListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useAdminPayouts(query)
  const statusOptions = [
    { id: ALL, name: "Any status" },
    ...ADMIN_PAYOUT_STATUSES.map((s) => ({
      id: s,
      name: data ? `${PAYOUT_STATUS[s].label} (${formatNumber(data.counts[s])})` : PAYOUT_STATUS[s].label,
    })),
  ]
  const filtered = !!(query.q || query.status)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payout requests"
        description="Providers asking to withdraw their earnings. Approve what their wallet covers, send the money, then mark it paid."
        actions={isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
      />

      <section aria-label="Payout totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data ? (
          <>
            <Link href={hrefWith({ status: "REQUESTED" })} className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <StatCard label="Waiting for a decision" value={formatPrice(data.amounts.REQUESTED)} icon={Hourglass} hint={`${formatNumber(data.counts.REQUESTED)} requests`} className="h-full hover:bg-accent/40" />
            </Link>
            <Link href={hrefWith({ status: "APPROVED" })} className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <StatCard label="Approved, to send" value={formatPrice(data.amounts.APPROVED)} icon={CheckCircle2} hint={`${formatNumber(data.counts.APPROVED)} payouts`} className="h-full hover:bg-accent/40" />
            </Link>
            <StatCard label="Paid out" value={formatPrice(data.amounts.PAID)} icon={Send} hint={`${formatNumber(data.counts.PAID)} payouts, all time`} />
            <StatCard label="Rejected" value={formatNumber(data.counts.REJECTED)} icon={XCircle} hint={`${formatPrice(data.amounts.REJECTED)} requested`} />
          </>
        ) : isError ? null : (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 w-full" />)
        )}
      </section>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchBox value={query.q} onSearch={(q) => setQuery({ q })} placeholder="Provider name, phone or account" label="Search payouts" />
            <div className="sm:w-60 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:text-sm">
              <OptionSelect
                id="filter-status"
                value={query.status ?? ALL}
                onChange={(v) => setQuery({ status: v === ALL ? undefined : v })}
                options={statusOptions}
                placeholder="Status"
              />
            </div>
            {filtered ? (
              <Button size="sm" variant="ghost" render={<Link href={hrefWith({ q: undefined, status: undefined })} />}>
                Clear filters
              </Button>
            ) : null}
          </div>

          {isError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load payout requests"
              description={error.message}
              action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-end">Amount</TableHead>
                  <TableHead>Send to</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={COLUMNS}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS} className="h-28 text-center text-muted-foreground">
                      <Banknote className="mx-auto mb-1 size-5" aria-hidden />
                      {filtered ? "No payouts match these filters." : "No payout requests yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((p) => {
                    const short = p.wallet ? p.amount > p.wallet.available : false
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link href={`/admin/providers/${p.providerId}`} className="font-medium hover:underline">
                            {p.providerName}
                          </Link>
                          {p.providerPhone ? (
                            <bdi dir="ltr" className="block text-xs text-muted-foreground tabular-nums">
                              {formatPhone(p.providerPhone)}
                            </bdi>
                          ) : null}
                          <span className="block text-xs text-muted-foreground">requested {formatDate(p.createdAt)}</span>
                        </TableCell>
                        <TableCell className="text-end font-medium tabular-nums">
                          <bdi dir="ltr">{formatPrice(p.amount)}</bdi>
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="secondary">{p.destinationType === "BANK" ? "Bank" : p.destinationType === "WALLET" ? "Wallet" : p.destinationType}</Badge>
                          <span className="block font-mono text-xs text-muted-foreground">{p.destinationRef}</span>
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {p.wallet ? (
                            <>
                              <span className={cn("flex items-center gap-1", short && "text-destructive")}>
                                <Wallet className="size-3.5" aria-hidden />
                                <bdi dir="ltr">{formatPrice(p.wallet.available)}</bdi> available
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                balance <bdi dir="ltr">{formatPrice(p.wallet.balance)}</bdi>
                                {p.wallet.reservedByOthers > 0 ? (
                                  <>
                                    {" "}· reserved <bdi dir="ltr">{formatPrice(p.wallet.reservedByOthers)}</bdi>
                                  </>
                                ) : null}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-64">
                          <MetaBadge meta={PAYOUT_STATUS[p.status]} />
                          {p.processedAt ? (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {formatDateTime(p.processedAt)}
                              {p.processedBy ? ` · ${p.processedBy}` : ""}
                            </span>
                          ) : null}
                          {p.rejectionReason ? (
                            <span className="mt-1 line-clamp-2 text-xs whitespace-normal text-muted-foreground" title={p.rejectionReason}>
                              {p.rejectionReason}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-end">
                          <PayoutActions p={p} />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}

          {data && data.total > 0 ? (
            <ListPagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(page) => hrefWith({ page })} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
