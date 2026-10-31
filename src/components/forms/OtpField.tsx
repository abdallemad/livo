"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { cn } from "@/lib/utils"

interface OtpFieldProps {
  value: string
  onChange: (value: string) => void
  /** Called when all 6 digits are entered (auto-submit). */
  onComplete?: (value: string) => void
  onResend?: () => void
  /** Seconds before "resend" is enabled. */
  resendAfter?: number
  error?: string
  className?: string
}

/** 6-slot OTP (§5): LTR digits, auto-submit, resend countdown, error clears on edit. */
export function OtpField({ value, onChange, onComplete, onResend, resendAfter = 60, error, className }: OtpFieldProps) {
  const [left, setLeft] = useState(resendAfter)

  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div dir="ltr">
        <InputOTP
          maxLength={6}
          value={value}
          onChange={onChange}
          onComplete={onComplete}
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label="Verification code"
          aria-invalid={error ? true : undefined}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      {error ? (
        <p aria-live="polite" className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="size-4" aria-hidden />
          {error}
        </p>
      ) : null}
      <Button
        variant="link"
        disabled={left > 0}
        onClick={() => {
          setLeft(resendAfter)
          onResend?.()
        }}
      >
        {left > 0 ? (
          <>
            Resend code in <span className="tabular-nums">{left}</span> seconds
          </>
        ) : (
          "Resend code"
        )}
      </Button>
    </div>
  )
}
