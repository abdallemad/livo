"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { History, Info, Percent } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { ConfirmDialog, PageHeader } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { auditActionLabel } from "@/constants/audit-actions"
import {
  useClearCategoryCommission,
  useCommissionSettings,
  useSetCategoryCommission,
  useUpdateGlobalCommission,
} from "@/hooks/use-admin-money"
import { applyApiErrors } from "@/lib/form-errors"
import { cn } from "@/lib/utils"
import { commissionRateBodySchema, type CommissionRateInput, type CommissionRateValues } from "@/schemas/admin.schema"
import type { AdminCommissionCategory, AdminCommissionSettings } from "@/types/admin"
import { COMMISSION_MAX, splitAmount } from "@/utils/commission"
import { formatDateTime, formatNumber, formatPrice } from "@/utils/format"
import { CategoryRateDialog } from "./CategoryRateDialog"
import { RateInput } from "./RateInput"

const EXAMPLE_AMOUNT = 1000
const pct = (n: number) => `${formatNumber(n)}%`

function GlobalRateForm({ rate, updatedAt }: { rate: number; updatedAt: string | null }) {
  const update = useUpdateGlobalCommission()
  const form = useForm<CommissionRateInput, unknown, CommissionRateValues>({
    resolver: zodResolver(commissionRateBodySchema),
    values: { ratePercent: String(rate) },
  })
  const raw = Number(useWatch({ control: form.control, name: "ratePercent" }))
  const preview = Number.isFinite(raw) && raw >= 0 && raw <= COMMISSION_MAX ? splitAmount(EXAMPLE_AMOUNT, raw) : null
  const error = form.formState.errors.ratePercent?.message
  const unchanged = raw === rate

  const submit = form.handleSubmit((values) =>
    update.mutateAsync(values).then(
      () => toast.success(`Platform commission set to ${pct(values.ratePercent)}`),
      (e) => applyApiErrors(e, form.setError, ["ratePercent"]),
    ),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform rate</CardTitle>
        <CardDescription>
          Charged to the provider on every booking whose category has no rate of its own (BR-01).
          {updatedAt ? ` Last changed ${formatDateTime(updatedAt)}.` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          <FormField
            id="global-rate"
            label="Commission"
            error={error}
            helper={
              preview
                ? `On a ${formatPrice(EXAMPLE_AMOUNT)} booking: Livo ${formatPrice(preview.commission)}, provider ${formatPrice(preview.providerNet)}.`
                : `Between 0 and ${COMMISSION_MAX}%.`
            }
          >
            <RateInput id="global-rate" invalid={!!error} {...form.register("ratePercent")} />
          </FormField>
          <Button type="submit" className="sm:mt-8" disabled={update.isPending || unchanged}>
            {update.isPending ? <Spinner data-icon="inline-start" /> : null}
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function sourceText(c: AdminCommissionCategory) {
  if (c.source === "CATEGORY") return "Own rate"
  if (c.source === "PARENT") return `From ${c.parentName ?? "parent"}`
  return "Platform rate"
}

function CategoryRates({ categories }: { categories: AdminCommissionCategory[] }) {
  const setRate = useSetCategoryCommission()
  const clearRate = useClearCategoryCommission()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category rates</CardTitle>
        <CardDescription>
          Give a category its own rate when the platform rate doesn&apos;t fit. Sub-categories use their own rate, then
          their parent&apos;s, then the platform rate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-end">Rate</TableHead>
              <TableHead>Comes from</TableHead>
              <TableHead className="text-end">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                  No categories yet. Every booking uses the platform rate.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className={cn(c.parentId && "ps-8")}>
                    <span className={cn(c.parentId ? "text-sm" : "font-medium")}>{c.name}</span>
                    {!c.isActive ? (
                      <Badge variant="secondary" className="ms-2">
                        Off
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className={cn("text-end tabular-nums", c.source === "CATEGORY" && "font-semibold")}>
                    <bdi dir="ltr">{pct(c.effectiveRate)}</bdi>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.source === "CATEGORY" ? <Badge variant="info">{sourceText(c)}</Badge> : sourceText(c)}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <CategoryRateDialog
                        category={c}
                        pending={setRate.isPending}
                        trigger={
                          <Button size="sm" variant="outline">
                            {c.overrideRate === null ? "Set rate" : "Change"}
                          </Button>
                        }
                        onSubmit={(values) =>
                          setRate
                            .mutateAsync({ categoryId: c.id, ...values })
                            .then(() => toast.success(`${c.name}: ${pct(values.ratePercent)}`))
                        }
                      />
                      {c.overrideRate !== null ? (
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="ghost" className="text-destructive" disabled={clearRate.isPending}>
                              Remove
                            </Button>
                          }
                          title={`Remove ${c.name}'s own rate?`}
                          description={`New bookings in ${c.name} will use ${c.parentId ? "the parent category's rate (or the platform rate)" : "the platform rate"}. Existing bookings keep their rate.`}
                          confirmLabel="Remove rate"
                          cancelLabel="Cancel"
                          onConfirm={() =>
                            clearRate.mutate(c.id, {
                              onSuccess: () => toast.success(`${c.name} now uses the inherited rate`),
                              onError: (e) => toast.error(e.message),
                            })
                          }
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/**
 * `/admin/settings/commission` (AD-06, docs/admin-commission-payouts-feature.md): the platform
 * rate, per-category overrides with each category's effective rate, and the audit trail of
 * changes. First snapshot from the server; writes go through `/api/admin/commission*` and refetch.
 */
export function CommissionSettings({ initialData }: { initialData: AdminCommissionSettings }) {
  const { data } = useCommissionSettings(initialData)

  return (
    <div className="space-y-6">
      <PageHeader title="Commission" description="What Livo keeps from each booking, deducted from the provider's share." />

      <Alert variant="info">
        <Info aria-hidden />
        <AlertTitle>Changes apply to new bookings only</AlertTitle>
        <AlertDescription>
          Each booking keeps the rate it was confirmed with, so editing a rate never changes past bookings, earnings or
          payouts.
        </AlertDescription>
      </Alert>

      <GlobalRateForm rate={data.globalRate} updatedAt={data.globalUpdatedAt} />
      <CategoryRates categories={data.categories} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-4" aria-hidden />
            Recent changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No changes yet.</p>
          ) : (
            <ol className="divide-y">
              {data.history.map((h) => (
                <li key={h.id} className="flex flex-col gap-0.5 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-2">
                    <Percent className="size-3.5 text-muted-foreground" aria-hidden />
                    {auditActionLabel(h.action)}
                    {h.categoryName ? <span className="font-medium">{h.categoryName}</span> : null}
                    <bdi dir="ltr" className="tabular-nums text-muted-foreground">
                      {h.from === null ? "—" : pct(h.from)} → {h.to === null ? "inherited" : pct(h.to)}
                    </bdi>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(h.createdAt)}
                    {h.actor ? ` · ${h.actor}` : ""}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
