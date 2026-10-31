import { Progress } from "@/components/ui/progress"
import { STEP_LABELS, type OnboardingStep } from "@/constants/onboarding"

interface WizardProgressProps {
  steps: readonly OnboardingStep[]
  current: OnboardingStep
}

/** "Step 2 of 5" + bar + step name. Before a role is picked the total isn't known, so only the first step shows. */
export function WizardProgress({ steps, current }: WizardProgressProps) {
  const index = Math.max(steps.indexOf(current), 0)
  const total = steps.length
  const percent = Math.round(((index + 1) / total) * 100)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">
          Step <span className="tabular-nums">{index + 1}</span>
          {total > 1 ? (
            <>
              {" "}of <span className="tabular-nums">{total}</span>
            </>
          ) : null}
        </span>
        <span className="text-muted-foreground">{STEP_LABELS[current]}</span>
      </div>
      <Progress value={percent} aria-label={`Sign-up progress: step ${index + 1}`} />
    </div>
  )
}
