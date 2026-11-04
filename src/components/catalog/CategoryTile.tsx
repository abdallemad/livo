import { createElement } from "react"
import Link from "next/link"
import { ChevronRight, Wrench } from "lucide-react"
import { Card } from "@/components/ui/card"
import { categoryIcon } from "@/constants/category-icons"
import type { CatalogCategory } from "@/types/catalog"
import { formatNumber } from "@/utils/format"

/** One category on `/services` — a real link to its SSG page (crawlable, CLAUDE.md §11). */
export function CategoryTile({ category }: { category: CatalogCategory }) {
  return (
    <Card className="group gap-0 rounded-3xl py-0 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-coral hover:shadow-card">
      <Link href={`/services/${category.slug}`} className="flex h-full items-start gap-4 p-5 focus-visible:outline-none">
        <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
          {createElement(categoryIcon(category.iconKey) ?? Wrench, { className: "size-6", "aria-hidden": true })}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 font-heading text-lg font-semibold transition-colors group-hover:text-violet dark:group-hover:text-primary">
            {category.name}
            <ChevronRight className="size-4 text-coral opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100" aria-hidden />
          </span>
          <span className="block text-sm text-muted-foreground">
            {category.serviceCount
              ? `${formatNumber(category.serviceCount)} fixed-price ${category.serviceCount === 1 ? "service" : "services"}`
              : category.type === "QUOTE"
                ? "Request quotes from providers"
                : "Request a quote"}
          </span>
          {category.children.length ? <span className="mt-1 block truncate text-xs text-muted-foreground">{category.children.map((c) => c.name).join(" · ")}</span> : null}
        </span>
      </Link>
    </Card>
  )
}
