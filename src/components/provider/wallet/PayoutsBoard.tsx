"use client"

import Link from "next/link"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, Banknote, Info, Landmark, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { EmptyState, MetaBadge, PageHeader } from "@/components/shared"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { PAYOUT_STATUS } from "@/constants/status"
import { useProviderPayouts, useRequestPayout } from "@/hooks/use-provider-wallet"
import { useUrlQuery } from "@/hooks/use-url-query"
import { applyApiErrors } from "@/lib/form-errors"
import { cn } from "@/lib/utils"
import { payoutRequestSchema, providerPayoutListQuerySchema, type PayoutRequestInput, type PayoutRequestValues } from "@/schemas/provider-wallet.schema"
import type { ProviderPayouts } from "@/types/provider-wallet"
import { formatDate, formatPrice } from "@/utils/format"
import { PAYOUT_MIN } from "@/utils/provider-wallet"
import { WalletSummary } from "./WalletSummary"

const FIELDS = ["amount", "destinationType", "destinationRef"] as const
const DESTINATIONS = [
  { id: "WALLET", label: "Mobile wallet or InstaPay", help: "Vodafone Cash, Etisalat Cash, Orange Cash… or your InstaPay address.", icon: Smartphone },
  { id: "BANK", label: "Bank account", help: "Your IBAN (EG…) or account number.", icon: Landmark },
] as const

function RequestForm({ data }: { data: ProviderPayouts }) {
  const request = useRequestPayout()
  const form = useForm<PayoutRequestInput, unknown, PayoutRequestValues>({
    resolver: zodResolver(payoutRequestSchema),
    defaultValues: {
      amount: data.summary.available,
      destinationType: data.lastDestination?.type ?? "WALLET",
      destinationRef: data.lastDestination?.ref ?? "",
    },
  })
  const { register, control, handleSubmit, setError, setValue, formState } = form
  const type = useWatch({ control, name: "destinationType" })

  const submit = handleSubmit((values) =>
    request.mutate(values, {
      onSuccess: () => toast.success(`Payout of ${formatPrice(values.amount)} requested`),
      onError: (e) => applyApiErrors(e, setError, FIELDS),
    }),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Request a payout</CardTitle>
        <CardDescription>
          Up to {formatPrice(data.summary.available)}, at least {formatPrice(PAYOUT_MIN)}. Livo&apos;s team reviews it, then sends the money to the account below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="grid gap-5">
          <FormField id="payout-amount" label="Amount (EGP)" error={formState.errors.amount?.message}>
            <div className="flex gap-2">
              <Input
                id="payout-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                dir="ltr"
                className="max-w-48 text-start tabular-nums"
                aria-invalid={!!formState.errors.amount}
                aria-describedby="payout-amount-msg"
                {...register("amount")}
              />
              <Button type="button" variant="outline" onClick={() => setValue("amount", data.summary.available, { shouldDirty: true, shouldValidate: true })}>
                All of it
              </Button>
            </div>
          </FormField>

          <FormField id="payout-type" label="Send it to" error={formState.errors.destinationType?.message}>
            <Controller
              control={control}
              name="destinationType"
              render={({ field }) => (
                <RadioGroup id="payout-type" value={field.value} onValueChange={(v) => field.onChange(v)} className="grid gap-2 sm:grid-cols-2" aria-describedby="payout-type-msg">
                  {DESTINATIONS.map((d) => (
                    <Label key={d.id} className={cn("flex min-h-16 cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal", field.value === d.id && "border-primary bg-primary/5")}>
                      <RadioGroupItem value={d.id} className="mt-0.5" />
                      <span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <d.icon className="size-4" aria-hidden />
                          {d.label}
                        </span>
                        <span className="block text-sm text-muted-foreground">{d.help}</span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              )}
            />
          </FormField>

          <FormField
            id="payout-ref"
            label={type === "BANK" ? "IBAN or account number" : "Wallet number or InstaPay address"}
            error={formState.errors.destinationRef?.message}
            helper={type === "BANK" ? "The account must be in your name." : "e.g. 01012345678 or name@instapay. It must be in your name."}
          >
            <Input id="payout-ref" dir="ltr" autoComplete="off" className="max-w-sm text-start" aria-invalid={!!formState.errors.destinationRef} aria-describedby="payout-ref-msg" {...register("destinationRef")} />
          </FormField>

          <div>
            <Button type="submit" size="lg" variant="commit" disabled={request.isPending}>
              {request.isPending ? <Spinner data-icon="inline-start" /> : null}
              Request a payout
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/**
 * `/provider/payouts` (PR-12, docs/provider-earnings-payouts-feature.md): what can be withdrawn, the
 * request form (amount + where to send it) when a request is possible, and the history with each
 * request's status. Page number in the URL.
 */
export function PayoutsBoard() {
  const { query, hrefWith } = useUrlQuery(providerPayoutListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useProviderPayouts(query)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payouts"
        description="Move your earnings to your bank or mobile wallet."
        actions={
          <>
            {isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
            <Button variant="outline" render={<Link href="/provider/earnings" />}>
              See earnings
            </Button>
          </>
        }
      />

      {isError ? (
        <EmptyState icon={AlertCircle} title="Couldn't load your payouts" description={error.message} action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>} />
      ) : isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          <WalletSummary s={data.summary} />

          {data.requestBlockedReason ? (
            <Alert variant="info">
              <Info aria-hidden />
              <AlertDescription>{data.requestBlockedReason}</AlertDescription>
            </Alert>
          ) : (
            <RequestForm key={`${data.summary.available}-${data.total}`} data={data} />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your requests</CardTitle>
            </CardHeader>
            <CardContent>
              {data.items.length === 0 ? (
                <EmptyState icon={Banknote} title="No payout requests yet" description="Your requests and what happened to each appear here." />
              ) : (
                <ul className="divide-y">
                  {data.items.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                      <span className="w-32 text-lg font-semibold tabular-nums">
                        <bdi dir="ltr">{formatPrice(p.amount)}</bdi>
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block">
                          {p.destinationType === "BANK" ? "Bank" : "Wallet"} <bdi dir="ltr" className="font-mono text-muted-foreground">{p.destination}</bdi>
                        </span>
                        <span className="block text-muted-foreground">
                          Requested {formatDate(p.createdAt)}
                          {p.processedAt ? ` · ${p.status === "PAID" ? "sent" : p.status === "REJECTED" ? "declined" : "approved"} ${formatDate(p.processedAt)}` : ""}
                        </span>
                        {p.rejectionReason ? <span className="block text-destructive">Reason: {p.rejectionReason}</span> : null}
                      </span>
                      <MetaBadge meta={PAYOUT_STATUS[p.status]} />
                    </li>
                  ))}
                </ul>
              )}
              {data.total > 0 ? <ListPagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(page) => hrefWith({ page })} /> : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
