"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CATEGORY_ICON_KEYS, CATEGORY_ICONS, CATEGORY_TYPE_HELP, CATEGORY_TYPE_LABEL } from "@/constants/category-icons"
import { useCreateCategory, useUpdateCategory } from "@/hooks/use-admin-catalog"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { applyApiErrors } from "@/lib/form-errors"
import { cn } from "@/lib/utils"
import {
  CATEGORY_DESCRIPTION_MAX,
  CATEGORY_TYPES,
  createCategorySchema,
  type CategoryFormInput,
  type CreateCategoryValues,
} from "@/schemas/category.schema"
import type { AdminCategoryDetail, CategoryOptionDto } from "@/types/admin"
import { slugify } from "@/utils/slug"

const FIELDS = ["nameEn", "nameAr", "slug", "description", "type", "parentId", "iconKey", "sortOrder", "isActive"] as const
const NO_PARENT = "__none__"

interface CategoryFormProps {
  /** Absent = create. */
  category?: AdminCategoryDetail
  parents: CategoryOptionDto[]
}

/**
 * Create / edit one category (AD-02). The slug is only editable on create
 * (it becomes the public URL `/services/<slug>`); on edit it is shown read-only.
 * Server `fieldErrors` (duplicate slug, invalid parent, type conflict) replay
 * into the matching field.
 */
export function CategoryForm({ category, parents }: CategoryFormProps) {
  const router = useRouter()
  const editing = !!category
  const create = useCreateCategory()
  const update = useUpdateCategory(category?.id ?? "")
  const saving = create.isPending || update.isPending

  const form = useForm<CategoryFormInput, unknown, CreateCategoryValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      nameEn: category?.nameEn ?? "",
      nameAr: category?.nameAr ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      type: category?.type ?? "BOTH",
      parentId: category?.parentId ?? "",
      iconKey: (category?.iconKey as CategoryFormInput["iconKey"]) ?? "",
      sortOrder: category?.sortOrder ?? 0,
      isActive: category?.isActive ?? true,
    },
  })
  const { register, control, handleSubmit, setError, formState } = form
  const [nameEn, slug, parentId] = useWatch({ control, name: ["nameEn", "slug", "parentId"] })
  const confirmLeave = useUnsavedChanges(formState.isDirty && !formState.isSubmitSuccessful)
  const errors = formState.errors

  const submit = handleSubmit((values) => {
    const done = () => {
      toast.success(editing ? `${values.nameEn} was saved` : `${values.nameEn} was created`)
      router.push("/admin/categories")
    }
    const fail = (e: unknown) => applyApiErrors(e, setError, FIELDS)
    if (editing) {
      // The slug never changes after creation.
      const { slug: _slug, ...rest } = values
      void _slug
      update.mutate(rest, { onSuccess: done, onError: fail })
    } else {
      create.mutate(values, { onSuccess: done, onError: fail })
    }
  })

  const parentOptions = [{ id: NO_PARENT, name: "None — top-level category" }, ...parents]

  return (
    <div className="space-y-6">
      <PageHeader
        title={editing ? `Edit ${category.nameEn || category.nameAr}` : "New category"}
        description={
          editing
            ? "Changes show on the site within a few minutes."
            : "Categories are what customers browse. Keep names short and familiar."
        }
      />

      <Card>
        <CardContent>
          <form onSubmit={submit} noValidate className="grid max-w-3xl gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField id="cat-name-en" label="Name (English)" error={errors.nameEn?.message} helper="Shown on the site, e.g. Plumbing.">
                <Input id="cat-name-en" aria-invalid={!!errors.nameEn} aria-describedby="cat-name-en-msg" {...register("nameEn")} />
              </FormField>
              <FormField id="cat-name-ar" label="Name (Arabic)" error={errors.nameAr?.message} helper="Kept for the Arabic version of the site.">
                <Input
                  id="cat-name-ar"
                  dir="rtl"
                  lang="ar"
                  aria-invalid={!!errors.nameAr}
                  aria-describedby="cat-name-ar-msg"
                  {...register("nameAr")}
                />
              </FormField>
            </div>

            {editing ? (
              <div className="flex flex-col gap-2">
                <Label className="text-base">URL</Label>
                <p className="text-sm">
                  <code>/services/{category.slug}</code>
                  <span className="block text-muted-foreground">The URL can&apos;t change after a category is created, so links keep working.</span>
                </p>
              </div>
            ) : (
              <FormField
                id="cat-slug"
                label="URL name"
                optional
                error={errors.slug?.message}
                helper={`The page will be /services/${slug || slugify(nameEn ?? "") || "…"}. Leave empty to use the English name. It can't be changed later.`}
              >
                <Input
                  id="cat-slug"
                  dir="ltr"
                  placeholder={slugify(nameEn ?? "")}
                  aria-invalid={!!errors.slug}
                  aria-describedby="cat-slug-msg"
                  {...register("slug")}
                />
              </FormField>
            )}

            <FormField id="cat-type" label="How customers book it" error={errors.type?.message}>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <RadioGroup
                    id="cat-type"
                    value={field.value}
                    onValueChange={(v) => field.onChange(v)}
                    aria-describedby="cat-type-msg"
                    className="grid gap-2 sm:grid-cols-3"
                  >
                    {CATEGORY_TYPES.map((t) => (
                      <Label
                        key={t}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal",
                          field.value === t && "border-primary bg-primary/5",
                        )}
                      >
                        <RadioGroupItem value={t} className="mt-0.5" />
                        <span>
                          <span className="block font-medium">{CATEGORY_TYPE_LABEL[t]}</span>
                          <span className="block text-sm text-muted-foreground">{CATEGORY_TYPE_HELP[t]}</span>
                        </span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}
              />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="cat-parent"
                label="Parent category"
                error={errors.parentId?.message}
                helper={category?.hasChildren ? "Has sub-categories, so it stays top-level." : "Sub-categories sit under a top-level one."}
              >
                <Controller
                  control={control}
                  name="parentId"
                  render={({ field }) => (
                    <OptionSelect
                      id="cat-parent"
                      value={field.value || NO_PARENT}
                      onChange={(v) => field.onChange(v === NO_PARENT ? "" : v)}
                      options={parentOptions}
                      placeholder="Top-level"
                      invalid={!!errors.parentId}
                      disabled={category?.hasChildren}
                    />
                  )}
                />
              </FormField>
              <FormField id="cat-sort" label="Order" error={errors.sortOrder?.message} helper="Lower numbers show first.">
                <Input
                  id="cat-sort"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  dir="ltr"
                  className="text-start tabular-nums"
                  aria-invalid={!!errors.sortOrder}
                  aria-describedby="cat-sort-msg"
                  {...register("sortOrder")}
                />
              </FormField>
            </div>

            <FormField
              id="cat-icon"
              label="Icon"
              optional
              error={errors.iconKey?.message}
              helper={parentId ? "Sub-categories usually don't need one." : "Shown on the home and services pages."}
            >
              <Controller
                control={control}
                name="iconKey"
                render={({ field }) => (
                  <div id="cat-icon" role="radiogroup" aria-describedby="cat-icon-msg" className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={field.value ? "outline" : "secondary"}
                      role="radio"
                      aria-checked={!field.value}
                      onClick={() => field.onChange("")}
                    >
                      None
                    </Button>
                    {CATEGORY_ICON_KEYS.map((key) => {
                      const Icon = CATEGORY_ICONS[key]
                      const selected = field.value === key
                      return (
                        <Button
                          key={key}
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          role="radio"
                          aria-checked={selected}
                          aria-label={key.replace("-", " ")}
                          className={cn(selected && "border-primary bg-primary/10 text-primary")}
                          onClick={() => field.onChange(key)}
                        >
                          <Icon />
                        </Button>
                      )
                    })}
                  </div>
                )}
              />
            </FormField>

            <FormField
              id="cat-desc"
              label="Description"
              optional
              error={errors.description?.message}
              helper="A sentence or two for the category page (also used for search engines)."
            >
              <Textarea
                id="cat-desc"
                rows={3}
                maxLength={CATEGORY_DESCRIPTION_MAX}
                aria-invalid={!!errors.description}
                aria-describedby="cat-desc-msg"
                {...register("description")}
              />
            </FormField>

            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <Label className="flex items-center gap-3 text-base">
                    <Switch checked={field.value} onCheckedChange={field.onChange} aria-describedby="cat-active-msg" />
                    Show on the site
                  </Label>
                  <p id="cat-active-msg" aria-live="polite" className={cn("text-sm", errors.isActive ? "text-destructive" : "text-muted-foreground")}>
                    {errors.isActive?.message ?? "When off, the category and its services are hidden from customers."}
                  </p>
                </div>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner data-icon="inline-start" /> : null}
                {editing ? "Save changes" : "Create category"}
              </Button>
              <Button
                type="button"
                variant="outline"
                render={<Link href="/admin/categories" />}
                onClick={(e) => {
                  if (!confirmLeave()) e.preventDefault()
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
