"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OptionSelectProps {
  id: string
  value: string
  onChange: (value: string) => void
  options: { id: string; name: string }[]
  placeholder: string
  invalid?: boolean
  disabled?: boolean
}

/** Single choice from a short list (city, area, category), with the label `htmlFor` wired to the trigger. */
export function OptionSelect({ id, value, onChange, options, placeholder, invalid, disabled }: OptionSelectProps) {
  const items = options.map((o) => ({ value: o.id, label: o.name }))
  return (
    <Select items={items} value={value || null} onValueChange={(v) => onChange((v as string | null) ?? "")} disabled={disabled}>
      <SelectTrigger id={id} className="w-full text-base" aria-invalid={invalid || undefined} aria-describedby={`${id}-msg`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} className="min-h-10 text-base">
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
