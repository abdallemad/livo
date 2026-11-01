"use client"

import Link from "next/link"
import { BriefcaseBusiness, Clock, ImageIcon, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog, EmptyState, PageHeader } from "@/components/shared"
import { formatDuration } from "@/components/onboarding/ServicePreviewCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useDeleteService, useProviderServices, useToggleService } from "@/hooks/use-provider-catalog"
import { cn } from "@/lib/utils"
import type { ProviderServiceList, ProviderServiceListItem } from "@/types/provider-catalog"
import { formatNumber, formatPrice } from "@/utils/format"
import type { ServiceVisibilityState } from "@/utils/service-visibility"

const VISIBILITY: Record<ServiceVisibilityState, { label: string; variant: "success" | "neutral" | "destructive" | "warning" }> = {
  LIVE: { label: "Live", variant: "success" },
  PROVIDER_OFF: { label: "Off", variant: "neutral" },
  HIDDEN_BY_ADMIN: { label: "Hidden by Livo", variant: "destructive" },
  PROVIDER_INACTIVE: { label: "Waiting for activation", variant: "warning" },
  CATEGORY_OFF: { label: "Category paused", variant: "warning" },
}

function ServiceCard({ s }: { s: ProviderServiceListItem }) {
  const toggle = useToggleService()
  const remove = useDeleteService()
  const v = VISIBILITY[s.visibility]
  const switchId = `svc-on-${s.id}`

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex gap-4 p-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground sm:size-24">
          {s.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- owner-only signed preview, not optimisable by next/image
            <img src={s.coverUrl} alt="" className="size-full object-cover" loading="lazy" />
          ) : (
            <ImageIcon className="size-6" aria-hidden />
          )}
        </div>
        <CardContent className="min-w-0 flex-1 space-y-1.5 px-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={v.variant}>{v.label}</Badge>
            <Badge variant="secondary">{s.category}</Badge>
          </div>
          <Link href={`/provider/services/${s.id}/edit`} className="block text-lg leading-snug font-semibold hover:underline">
            {s.title}
          </Link>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <bdi dir="ltr" className="font-semibold tabular-nums">{formatPrice(s.price)}</bdi>
            {s.durationMinutes ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="size-3.5" aria-hidden />
                {formatDuration(s.durationMinutes)}
              </span>
            ) : null}
            <span className="text-muted-foreground">
              {formatNumber(s.bookingCount)} {s.bookingCount === 1 ? "booking" : "bookings"} · {formatNumber(s.imageCount)} photos
            </span>
          </p>
          <p className={cn("text-sm", s.visibility === "LIVE" ? "text-muted-foreground" : s.visibility === "HIDDEN_BY_ADMIN" ? "text-destructive" : "text-warning")}>{s.statusText}</p>
        </CardContent>
      </div>
      <CardFooter className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-4 py-3">
        <div className="flex min-h-11 items-center gap-2">
          <Switch
            id={switchId}
            checked={s.isActive}
            disabled={toggle.isPending}
            onCheckedChange={(isActive) =>
              toggle.mutate(
                { id: s.id, isActive },
                { onSuccess: () => toast.success(isActive ? "Service switched on" : "Service switched off"), onError: (e) => toast.error(e.message) },
              )
            }
          />
          <Label htmlFor={switchId} className="text-sm">
            {s.isActive ? "On" : "Off"}
          </Label>
        </div>
        <div className="ms-auto flex gap-1">
          <Button variant="outline" render={<Link href={`/provider/services/${s.id}/edit`} />}>
            <Pencil data-icon="inline-start" aria-hidden />
            Edit
          </Button>
          {s.deleteBlockedReason ? (
            <Tooltip>
              <TooltipTrigger render={<span tabIndex={0} />}>
                <Button variant="ghost" className="text-destructive" disabled aria-label="Delete">
                  <Trash2 aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">{s.deleteBlockedReason}</TooltipContent>
            </Tooltip>
          ) : (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" className="text-destructive" disabled={remove.isPending} aria-label="Delete">
                  <Trash2 aria-hidden />
                </Button>
              }
              title={`Delete “${s.title}”?`}
              description="It disappears from Livo with its photos. This can't be undone."
              confirmLabel="Delete service"
              cancelLabel="Keep it"
              onConfirm={() => remove.mutate(s.id, { onSuccess: () => toast.success("Service deleted"), onError: (e) => toast.error(e.message) })}
            />
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * `/provider/services` (PR-05, docs/provider-services-portfolio-feature.md): the provider's
 * fixed-price services — whether customers can see each one and why not, an on/off switch, edit,
 * delete (only without bookings). First snapshot from the server.
 */
export function ServicesList({ initialData }: { initialData: ProviderServiceList }) {
  const { data } = useProviderServices(initialData)
  const full = data.items.length >= data.max
  const quoteOnly = data.categories.length === 0 && data.verificationStatus !== null
  const live = data.items.filter((s) => s.visibility === "LIVE").length

  const addButton = (
    <Button size="lg" disabled={full || data.categories.length === 0} render={full || data.categories.length === 0 ? undefined : <Link href="/provider/services/new" />}>
      <Plus data-icon="inline-start" aria-hidden />
      Add a service
    </Button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="My services"
        description={
          data.items.length
            ? `Fixed-price jobs customers can book directly. ${formatNumber(live)} of ${formatNumber(data.items.length)} live.`
            : "Fixed-price jobs customers can book directly, without waiting for a quote."
        }
        actions={
          full ? (
            <Tooltip>
              <TooltipTrigger render={<span tabIndex={0} />}>{addButton}</TooltipTrigger>
              <TooltipContent>You can list up to {data.max} services.</TooltipContent>
            </Tooltip>
          ) : data.categories.length === 0 ? null : (
            addButton
          )
        }
      />

      {data.verificationStatus === null ? (
        <EmptyState icon={BriefcaseBusiness} title="This page is for provider accounts" description="Your account has no provider profile, so it has no services." />
      ) : quoteOnly ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title="Your specialties work by quote only"
          description="Customers describe the job and you send a price. Add a specialty that allows fixed prices to list services here."
          action={<Button render={<Link href="/provider/requests" />}>See available requests</Button>}
        />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title="No services yet"
          description="Add a job you do often, at a clear price — customers can book it right away."
          action={<Button render={<Link href="/provider/services/new" />}>Add your first service</Button>}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {data.items.map((s) => (
            <ServiceCard key={s.id} s={s} />
          ))}
        </div>
      )}
    </div>
  )
}
