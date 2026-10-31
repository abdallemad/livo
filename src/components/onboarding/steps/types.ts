import type { OnboardingStateDto } from "@/types/onboarding"

/** "next" = continue to the following step, "exit" = saved, leave the wizard (resumes here later). */
export type StepIntent = "next" | "exit"

/** What the wizard hands every step component. */
export interface StepProps {
  state: OnboardingStateDto
  onBack?: () => void
  /** Called after a successful save (or a skip) with the user's intent. */
  onAdvance: (intent: StepIntent) => void
  /** Lets the wizard warn before leaving with unsaved edits. */
  onDirtyChange: (dirty: boolean) => void
}
