"use client"

import Link from "next/link"
import { AlertCircle, ReceiptText } from "lucide-react"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { EmptyState, PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useProviderEarnings } from "@/hooks/use-provider-wallet"
import { useUrlQuery } from "@/hooks/use-url-query"
import { cn } from "@/lib/utils"
import { LEDGER_TYPES, ledgerQuerySchema } from "@/schemas/provider-wallet.schema"
import { formatPrice } from "@/utils/format"
import { LEDGER_HELP, LEDGER_LABEL } from "@/utils/provider-wallet"
import { formatZonedDateTime } from "@/utils/zoned-time"
import { WalletSummary } from "./WalletSummary"

const ALL = "ALL"
const TYPE_OPTIONS = [{ id: ALL, name: "All movements" }, ...LEDGER_TYPES.map((t) => ({ id: t, name: LEDGER_LABEL[t] }))]
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${formatPrice(Math.abs(n))}`

/**
 * `/provider/earnings` (PR-11, docs/provider-earnings-payouts-feature.md): what's due, what's on hold,
 * what was received, the commission, this month vs last, and every wallet movement with the balance
 * after it. Filters live in the URL.
 */
export function EarningsBoard() {
  const { query, hrefWith, setQuery } = useUrlQuery(ledgerQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useProviderEarnings(query)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings"
        description={
          data
            ? `This month you earned ${formatPrice(data.summary.thisMonth)} (last month ${formatPrice(data.summary.lastMonth)}), after Livo's commission.`
            : "What you've earned, what's on the way, and every movement in your wallet."
        }
        actions={
          <>
            {isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
            <Button size="lg" variant="commit" render={<Link href="/provider/payouts" />}>
              Request a payout
            </Button>
          </>
        }
      />

      {isError ? (
        <EmptyState icon={AlertCircle} title="Couldn't load your earnings" description={error.message} action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>} />
      ) : isPending ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <>
          <WalletSummary s={data.summary} />

          <Card>
            <CardHeader className="sm:flex sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="text-lg">Wallet movements</CardTitle>
                <CardDescription>Every amount added to or taken from your wallet, newest first.</CardDescription>
              </div>
              <div className="sm:w-60 [&_[data-slot=select-trigger]]:h-11">
                <OptionSelect id="filter-type" value={query.type ?? ALL} onChange={(v) => setQuery({ type: v === ALL ? undefined : v })} options={TYPE_OPTIONS} placeholder="Type" />
              </div>
            </CardHeader>
            <CardContent>
              {data.ledger.items.length === 0 ? (
                <EmptyState
                  icon={ReceiptText}
                  title={query.type ? "Nothing of this type yet" : "No movements yet"}
                  description={query.type ? undefined : "Your share of each online job appears here once the customer confirms it's done."}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>What</TableHead>
                      <TableHead className="text-end">Amount</TableHead>
                      <TableHead className="text-end">Balance after</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.ledger.items.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm whitespace-nowrap tabular-nums">{formatZonedDateTime(e.createdAt)}</TableCell>
                        <TableCell className="max-w-80 whitespace-normal">
                          <span className="block font-medium" title={LEDGER_HELP[e.type]}>
                            {LEDGER_LABEL[e.type]}
                          </span>
                          {e.booking ? (
                            <Link href={`/provider/bookings/${e.booking.id}`} className="block text-sm text-muted-foreground hover:underline">
                              {e.booking.title} · <span className="tabular-nums">{e.booking.number}</span>
                            </Link>
                          ) : null}
                          {e.note ? <span className="block text-xs text-muted-foreground">{e.note}</span> : null}
                        </TableCell>
                        <TableCell className={cn("text-end font-semibold tabular-nums", e.amount > 0 ? "text-success" : e.amount < 0 ? "text-destructive" : "")}>
                          <bdi dir="ltr">{signed(e.amount)}</bdi>
                        </TableCell>
                        <TableCell className="text-end text-muted-foreground tabular-nums">
                          <bdi dir="ltr">{formatPrice(e.balanceAfter)}</bdi>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {data.ledger.total > 0 ? (
                <ListPagination page={data.ledger.page} pageCount={data.ledger.pageCount} total={data.ledger.total} hrefFor={(page) => hrefWith({ page })} />
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
