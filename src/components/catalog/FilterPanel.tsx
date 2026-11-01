"use client"

import { useState } from "react"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { CatalogQuery } from "@/schemas/catalog.schema"
import type { CatalogFilterOptions } from "@/types/catalog"
import { DURATION_FILTERS, durationLabel, RATING_FILTERS } from "@/utils/catalog"
import { formatNumber } from "@/utils/format"

export type FilterPatch = Partial<Record<keyof CatalogQuery, string | number | undefined>>

const ANY = "ANY"
const SELECT = "[&_[data-slot=select-trigger]]:h-11"

function Chips<T extends number>({ label, value, options, format, onChange }: { label: string; value?: number; options: readonly T[]; format: (v: T) => string; onChange: (v: T | undefined) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" size="sm" variant={value === undefined ? "default" : "outline"} aria-pressed={value === undefined} onClick={() => onChange(undefined)}>
          Any
        </Button>
        {options.map((o) => (
          <Button key={o} type="button" size="sm" variant={value === o ? "default" : "outline"} aria-pressed={value === o} onClick={() => onChange(o)}>
            {format(o)}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}

/** Price range: typed freely, applied on blur / Enter (not on every keystroke). */
function PriceRange({ min, max, bounds, onApply }: { min?: number; max?: number; bounds: CatalogFilterOptions["priceBounds"]; onApply: (min?: number, max?: number) => void }) {
  const [lo, setLo] = useState(min?.toString() ?? "")
  const [hi, setHi] = useState(max?.toString() ?? "")
  const apply = () => onApply(lo === "" ? undefined : Math.max(0, Number(lo)), hi === "" ? undefined : Math.max(0, Number(hi)))
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Price (EGP)</legend>
      <div className="flex items-center gap-2">
        <Label htmlFor="price-min" className="sr-only">Minimum price</Label>
        <Input id="price-min" type="number" inputMode="numeric" min={0} dir="ltr" placeholder={bounds ? formatNumber(bounds.min) : "Min"} value={lo} onChange={(e) => setLo(e.target.value)} onBlur={apply} onKeyDown={(e) => e.key === "Enter" && apply()} className="h-11 tabular-nums" />
        <span className="text-muted-foreground">–</span>
        <Label htmlFor="price-max" className="sr-only">Maximum price</Label>
        <Input id="price-max" type="number" inputMode="numeric" min={0} dir="ltr" placeholder={bounds ? formatNumber(bounds.max) : "Max"} value={hi} onChange={(e) => setHi(e.target.value)} onBlur={apply} onKeyDown={(e) => e.key === "Enter" && apply()} className="h-11 tabular-nums" />
      </div>
    </fieldset>
  )
}

/**
 * The advanced filters for `/services` (MK-02, MK-06; docs/catalog-feature.md): search, category (a parent
 * includes its sub-categories), area, price range, maximum duration, minimum rating. Presentational —
 * `onChange` writes the URL. Used in the desktop sidebar, the mobile sheet and the static fallback.
 */
export function FilterPanel({ query, options, onChange, className }: { query: CatalogQuery; options: CatalogFilterOptions; onChange: (patch: FilterPatch) => void; className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Label htmlFor="catalog-q" className="text-sm font-medium">Search</Label>
        <SearchBox value={query.q} onSearch={(q) => onChange({ q })} placeholder="e.g. heater, AC, tiles" label="Search services" />
      </div>
      <div className={cn("space-y-2", SELECT)}>
        <Label htmlFor="filter-category" className="text-sm font-medium">Category</Label>
        <OptionSelect
          id="filter-category"
          value={query.category ?? ANY}
          onChange={(v) => onChange({ category: v === ANY ? undefined : v })}
          options={[{ id: ANY, name: "All categories" }, ...options.categories.map((c) => ({ id: c.slug, name: c.parentName ? `${c.parentName} › ${c.name}` : c.name }))]}
          placeholder="Category"
        />
      </div>
      <div className={cn("space-y-2", SELECT)}>
        <Label htmlFor="filter-area" className="text-sm font-medium">Area</Label>
        <OptionSelect
          id="filter-area"
          value={query.area ?? ANY}
          onChange={(v) => onChange({ area: v === ANY ? undefined : v })}
          options={[{ id: ANY, name: "Anywhere" }, ...options.areas.map((a) => ({ id: a.slug, name: a.name }))]}
          placeholder="Area"
        />
      </div>
      <PriceRange key={`${query.minPrice}-${query.maxPrice}`} min={query.minPrice} max={query.maxPrice} bounds={options.priceBounds} onApply={(minPrice, maxPrice) => onChange({ minPrice, maxPrice })} />
      <Chips label="Takes at most" value={query.maxDuration} options={DURATION_FILTERS} format={durationLabel} onChange={(maxDuration) => onChange({ maxDuration })} />
      <Chips label="Provider rating" value={query.minRating} options={RATING_FILTERS} format={(r) => `${r}+ ★`} onChange={(minRating) => onChange({ minRating })} />
    </div>
  )
}
