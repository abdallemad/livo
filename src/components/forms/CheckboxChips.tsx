"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  id: string
  label: string
  hint?: string | null
}

interface CheckboxChipsProps {
  id: string
  legend: string
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  max?: number
  invalid?: boolean
}

/**
 * Multi-select as large tappable chips (NF-06: providers on phones). Real
 * checkboxes underneath, so keyboard and screen readers work unchanged.
 */
export function CheckboxChips({ id, legend, options, value, onChange, max, invalid }: CheckboxChipsProps) {
  const toggle = (optionId: string) =>
    onChange(value.includes(optionId) ? value.filter((v) => v !== optionId) : [...value, optionId])

  return (
    <fieldset aria-describedby={`${id}-msg`} aria-invalid={invalid || undefined}>
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option.id)
          const disabled = !checked && max !== undefined && value.length >= max
          return (
            <label
              key={option.id}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-base transition-colors select-none",
                "has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2",
                checked ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-accent",
                disabled && "cursor-not-allowed opacity-50",
                invalid && !checked && "border-destructive/50"
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(option.id)}
              />
              <span
                aria-hidden
                className={cn(
                  "flex size-5 items-center justify-center rounded-sm border",
                  checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                )}
              >
                {checked ? <Check className="size-3.5" /> : null}
              </span>
              <span>
                {option.label}
                {option.hint ? <span className="block text-xs text-muted-foreground">{option.hint}</span> : null}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
