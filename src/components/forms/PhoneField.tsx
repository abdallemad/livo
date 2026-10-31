"use client"

import { useId } from "react"
import { AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface PhoneFieldProps extends Omit<React.ComponentProps<"input">, "type" | "dir"> {
  label?: string
  helper?: string
  error?: string
}

/**
 * Egyptian mobile input (§5): label above, LTR digits, `inputMode="tel"`,
 * fixed +20 prefix, accepts `01XXXXXXXXX`. Error replaces the helper text.
 */
export function PhoneField({ label = "رقم الموبايل", helper = "11 رقم يبدأ بـ 01", error, className, id, ...props }: PhoneFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const msgId = `${inputId}-msg`
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <div dir="ltr" className="flex">
        <span className="flex h-11 items-center rounded-s-md border border-e-0 border-input bg-muted px-3 text-muted-foreground tabular-nums">
          +20
        </span>
        <Input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="01012345678"
          maxLength={11}
          aria-invalid={error ? true : undefined}
          aria-describedby={msgId}
          className="rounded-s-none text-base tabular-nums"
          {...props}
        />
      </div>
      <p id={msgId} aria-live="polite" className={cn("flex items-center gap-1 text-sm", error ? "text-destructive" : "text-muted-foreground")}>
        {error ? <AlertCircle className="size-4 shrink-0" aria-hidden /> : null}
        {error ?? helper}
      </p>
    </div>
  )
}
