"use client"

import Link from "next/link"
import { CornerDownRight, Pencil, Plus, Tags, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog, EmptyState, PageHeader } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CATEGORY_TYPE_LABEL, categoryIcon } from "@/constants/category-icons"
import { useAdminCategories, useDeleteCategory, useSetCategoryActive } from "@/hooks/use-admin-catalog"
import { cn } from "@/lib/utils"
import type { AdminCategoryListItem } from "@/types/admin"
import { formatNumber } from "@/utils/format"

/**
 * `/admin/categories` (AD-02): the whole tree (parents, then their
 * sub-categories), usage counts, an on/off switch per row, edit and delete.
 * Delete is offered only when nothing references the category; otherwise the
 * admin switches it off.
 */
export function CategoriesTable({ initialData }: { initialData: AdminCategoryListItem[] }) {
  const { data, isFetching } = useAdminCategories(initialData)
  const setActive = useSetCategoryActive()
  const remove = useDeleteCategory()
  const rows = data ?? []
  const parentActive = new Map(rows.filter((c) => !c.parentId).map((c) => [c.id, c.isActive]))

  function toggle(c: AdminCategoryListItem, isActive: boolean) {
    setActive.mutate(
      { id: c.id, isActive },
      {
        onSuccess: () => toast.success(`${c.nameEn ?? c.nameAr} is ${isActive ? "visible on the site" : "hidden from the site"}`),
        onError: (e) => toast.error(e.message),
      },
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="What customers can browse and book. Switching a category off hides it and its services from the site."
        actions={
          <>
            {isFetching ? <Spinner className="self-center text-muted-foreground" /> : null}
            <Button render={<Link href="/admin/categories/new" />}>
              <Plus data-icon="inline-start" aria-hidden />
              New category
            </Button>
          </>
        }
      />

      <Card>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="No categories yet"
              description="Add the first trades customers can book."
              action={<Button render={<Link href="/admin/categories/new" />}>New category</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Booking type</TableHead>
                  <TableHead className="text-end">Services (live)</TableHead>
                  <TableHead className="text-end">Providers</TableHead>
                  <TableHead className="text-end">Requests</TableHead>
                  <TableHead>On site</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => {
                  const Icon = categoryIcon(c.iconKey)
                  const name = c.nameEn ?? c.nameAr
                  const inUse = c.counts.children + c.counts.services + c.counts.requests + c.counts.providers > 0
                  const parentOff = c.parentId ? parentActive.get(c.parentId) === false : false
                  const busy = setActive.isPending && setActive.variables?.id === c.id
                  return (
                    <TableRow key={c.id} className={cn(!c.isActive && "text-muted-foreground")}>
                      <TableCell>
                        <span className={cn("flex items-center gap-2", c.parentId && "ps-6")}>
                          {c.parentId ? (
                            <CornerDownRight className="size-4 text-muted-foreground" aria-hidden />
                          ) : Icon ? (
                            <Icon className="size-4 text-primary" aria-hidden />
                          ) : (
                            <Tags className="size-4 text-muted-foreground" aria-hidden />
                          )}
                          <span>
                            <Link href={`/admin/categories/${c.id}/edit`} className="font-medium hover:underline">
                              {name}
                            </Link>
                            <span className="block text-xs text-muted-foreground" dir="rtl" lang="ar">
                              {c.nameAr}
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">/{c.slug}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{CATEGORY_TYPE_LABEL[c.type]}</Badge>
                      </TableCell>
                      <TableCell className="text-end tabular-nums">
                        <Link href={`/admin/services?categoryId=${c.id}`} className="hover:underline">
                          {formatNumber(c.counts.services)} ({formatNumber(c.counts.liveServices)})
                        </Link>
                      </TableCell>
                      <TableCell className="text-end tabular-nums">{formatNumber(c.counts.providers)}</TableCell>
                      <TableCell className="text-end tabular-nums">{formatNumber(c.counts.requests)}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <Switch
                            checked={c.isActive}
                            disabled={busy || (!c.isActive && parentOff)}
                            onCheckedChange={(checked) => toggle(c, checked)}
                            aria-label={`Show ${name} on the site`}
                          />
                          <span className="text-xs">{parentOff && c.isActive ? "Parent off" : c.isActive ? "On" : "Off"}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="icon-sm" variant="ghost" aria-label={`Edit ${name}`} render={<Link href={`/admin/categories/${c.id}/edit`} />}>
                            <Pencil />
                          </Button>
                          {inUse ? (
                            <Tooltip>
                              <TooltipTrigger render={<span tabIndex={0} />}>
                                <Button size="icon-sm" variant="ghost" disabled aria-label={`Can't delete ${name}: it's in use`}>
                                  <Trash2 />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>In use — switch it off instead</TooltipContent>
                            </Tooltip>
                          ) : (
                            <ConfirmDialog
                              trigger={
                                <Button size="icon-sm" variant="ghost" aria-label={`Delete ${name}`} disabled={remove.isPending}>
                                  <Trash2 />
                                </Button>
                              }
                              title={`Delete ${name}?`}
                              description="It's not used by any service, request or provider. This can't be undone."
                              confirmLabel="Delete category"
                              cancelLabel="Cancel"
                              onConfirm={() =>
                                remove.mutate(c.id, {
                                  onSuccess: () => toast.success(`${name} was deleted`),
                                  onError: (e) => toast.error(e.message),
                                })
                              }
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
