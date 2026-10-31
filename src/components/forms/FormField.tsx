import { AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  id: string
  label: string
  /** Shown under the field; replaced by the error when there is one (DESIGN-SYSTEM.md §5). */
  helper?: React.ReactNode
  error?: string
  optional?: boolean
  className?: string
  children: React.ReactNode
}

/** Label above, helper/error below, error announced politely. The control must set `aria-describedby={`${id}-msg`}`. */
export function FormField({ id, label, helper, error, optional, className, children }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id} className="text-base">
        {label}
        {optional ? <span className="font-normal text-muted-foreground"> (optional)</span> : null}
      </Label>
      {children}
      <p
        id={`${id}-msg`}
        aria-live="polite"
        className={cn("flex min-h-5 items-center gap-1 text-sm", error ? "text-destructive" : "text-muted-foreground")}
      >
        {error ? <AlertCircle className="size-4 shrink-0" aria-hidden /> : null}
        {error ?? helper}
      </p>
    </div>
  )
}
