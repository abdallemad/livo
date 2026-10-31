"use client"

import { useRef, useState } from "react"
import { Search } from "lucide-react"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"

interface SearchBoxProps {
  /** The value in the URL right now. */
  value: string | undefined
  /** Called 300 ms after the admin stops typing. */
  onSearch: (value: string) => void
  placeholder: string
  label: string
}

/** Debounced list search; the committed value lives in the URL (`useUrlQuery`). */
export function SearchBox({ value, onSearch, placeholder, label }: SearchBoxProps) {
  const [text, setText] = useState(value ?? "")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function onChange(next: string) {
    setText(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onSearch(next.trim()), 300)
  }

  return (
    <InputGroup className="h-9 sm:max-w-72">
      <InputGroupAddon>
        <Search aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
    </InputGroup>
  )
}
