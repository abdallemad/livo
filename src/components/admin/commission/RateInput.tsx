"use client"

import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { COMMISSION_MAX, COMMISSION_MIN } from "@/utils/commission"

/** A percent field (0–50, 2 decimals) with a trailing `%`. Spread `register("ratePercent")` into it. */
export function RateInput({ id, invalid, ...props }: React.ComponentProps<"input"> & { id: string; invalid?: boolean }) {
  return (
    <InputGroup className="w-36">
      <InputGroupInput
        id={id}
        type="number"
        inputMode="decimal"
        step="0.01"
        min={COMMISSION_MIN}
        max={COMMISSION_MAX}
        dir="ltr"
        className="tabular-nums"
        aria-invalid={invalid}
        aria-describedby={`${id}-msg`}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>%</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}
