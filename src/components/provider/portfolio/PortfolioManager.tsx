"use client"

import { ArrowDown, ArrowUp, Images, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog, EmptyState, PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useDeletePortfolioItem, useProviderPortfolio, useReorderPortfolio } from "@/hooks/use-provider-catalog"
import type { ProviderPortfolio } from "@/types/provider-catalog"
import { formatNumber } from "@/utils/format"
import { PortfolioItemDialog } from "./PortfolioItemDialog"

/**
 * `/provider/portfolio` (PR-04, docs/provider-services-portfolio-feature.md): photos of past work as
 * a gallery — add, edit, delete, and move items up / down (the order customers will see on the
 * public profile). First snapshot from the server.
 */
export function PortfolioManager({ initialData }: { initialData: ProviderPortfolio }) {
  const { data } = useProviderPortfolio(initialData)
  const remove = useDeletePortfolioItem()
  const reorder = useReorderPortfolio()
  const full = data.items.length >= data.max

  const move = (index: number, by: -1 | 1) => {
    const ids = data.items.map((i) => i.id)
    const target = index + by
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorder.mutate(ids, { onError: (e) => toast.error(e.message) })
  }

  const addButton = (
    <PortfolioItemDialog
      item={null}
      pendingImages={data.pendingImages}
      trigger={
        <Button size="lg" disabled={full}>
          <Plus data-icon="inline-start" aria-hidden />
          Add past work
        </Button>
      }
    />
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio"
        description={
          full
            ? `Your portfolio is full (${data.max} items). Delete an old one to add more.`
            : "Photos of jobs you did. Good photos help customers choose you."
        }
        actions={addButton}
      />

      {data.items.length === 0 ? (
        <EmptyState icon={Images} title="No past work yet" description="Add photos of 2–3 jobs you're proud of: before and after works best." action={addButton} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((item, index) => (
            <li key={item.id}>
              <Card className="h-full gap-0 overflow-hidden py-0">
                <div className="relative aspect-[4/3] bg-muted">
                  {item.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- owner-only signed preview, not optimisable by next/image
                    <img src={item.images[0].previewUrl} alt="" className="size-full object-cover" loading="lazy" />
                  ) : null}
                  <span className="absolute end-2 bottom-2 rounded-md bg-background/90 px-2 py-0.5 text-xs font-medium tabular-nums">
                    {formatNumber(item.images.length)} {item.images.length === 1 ? "photo" : "photos"}
                  </span>
                </div>
                <CardContent className="flex-1 space-y-1 p-4">
                  <p className="font-semibold leading-snug">{item.title}</p>
                  {item.description ? <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p> : null}
                </CardContent>
                <CardFooter className="flex items-center gap-1 border-t bg-muted/30 px-3 py-2">
                  <Button size="icon" variant="ghost" aria-label={`Move “${item.title}” earlier`} disabled={index === 0 || reorder.isPending} onClick={() => move(index, -1)}>
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Move “${item.title}” later`}
                    disabled={index === data.items.length - 1 || reorder.isPending}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown aria-hidden />
                  </Button>
                  <div className="ms-auto flex gap-1">
                    <PortfolioItemDialog
                      item={item}
                      pendingImages={[]}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Pencil data-icon="inline-start" aria-hidden />
                          Edit
                        </Button>
                      }
                    />
                    <ConfirmDialog
                      trigger={
                        <Button size="icon" variant="ghost" className="text-destructive" aria-label={`Delete “${item.title}”`} disabled={remove.isPending}>
                          <Trash2 aria-hidden />
                        </Button>
                      }
                      title={`Delete “${item.title}”?`}
                      description="Its photos are deleted too. This can't be undone."
                      confirmLabel="Delete"
                      cancelLabel="Keep it"
                      onConfirm={() => remove.mutate(item.id, { onSuccess: () => toast.success("Deleted from your portfolio"), onError: (e) => toast.error(e.message) })}
                    />
                  </div>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
