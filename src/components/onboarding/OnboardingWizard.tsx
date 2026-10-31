"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { OnboardingStep } from "@/constants/onboarding"
import { onboardingKeys } from "@/constants/query-keys"
import { useOnboardingState } from "@/hooks/use-onboarding"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import type { OnboardingFinishDto, OnboardingStateDto } from "@/types/onboarding"
import { AddressStep } from "./steps/AddressStep"
import { BasicInfoStep } from "./steps/BasicInfoStep"
import { DocumentsStep } from "./steps/DocumentsStep"
import { FirstServiceStep } from "./steps/FirstServiceStep"
import { InterestsStep } from "./steps/InterestsStep"
import { ProviderProfileStep } from "./steps/ProviderProfileStep"
import { ReviewStep } from "./steps/ReviewStep"
import { RoleStep } from "./steps/RoleStep"
import type { StepIntent, StepProps } from "./steps/types"
import { SuccessScreen } from "./SuccessScreen"
import { WizardProgress } from "./WizardProgress"

/**
 * The onboarding wizard (docs/onboarding-feature.md). A client island: the
 * page around it is static. The server decides where the user is
 * (`currentStep`); this component only remembers which step is on screen,
 * so a refresh or a later visit resumes from what the DB says.
 */
export function OnboardingWizard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isPending, isError, refetch } = useOnboardingState()
  const [chosen, setChosen] = useState<OnboardingStep | null>(null)
  const [forward, setForward] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [finished, setFinished] = useState<OnboardingFinishDto | null>(null)
  const confirmLeave = useUnsavedChanges(dirty)
  const reduceMotion = useReducedMotion()

  // A step may only be shown once the server says the user can reach it.
  const step = data ? (chosen && data.steps.includes(chosen) ? chosen : data.currentStep) : null

  // Already finished (e.g. an old tab): this page is not for them anymore.
  useEffect(() => {
    if (data?.completed && !finished) {
      router.replace(data.role === "PROVIDER" ? "/provider" : data.role === "CUSTOMER" ? "/account" : "/admin")
    }
  }, [data, finished, router])

  if (finished) return <SuccessScreen result={finished} />
  if (isPending) return <WizardSkeleton />
  if (isError || !data || !step) {
    return (
      <Card className="items-center gap-4 px-6 py-10 text-center">
        <p className="text-lg font-medium">ما قدرناش نحمّل خطوات التسجيل.</p>
        <p className="text-muted-foreground">اتأكد من الإنترنت وجرّب تاني.</p>
        <Button variant="outline" onClick={() => void refetch()}>
          <RotateCcw data-icon="inline-start" aria-hidden />
          جرّب تاني
        </Button>
      </Card>
    )
  }
  if (data.completed) return <WizardSkeleton />

  const latest = () => queryClient.getQueryData<OnboardingStateDto>(onboardingKeys.state()) ?? data

  const goTo = (target: OnboardingStep, isForward: boolean) => {
    setDirty(false)
    setForward(isForward)
    setChosen(target)
  }

  const onAdvance = (intent: StepIntent) => {
    setDirty(false)
    if (intent === "exit") {
      toast.success("اتحفظ. كمّل من نفس المكان وقت ما تحب.")
      router.push("/")
      return
    }
    // The role step can change the whole path, so read the steps from the state the save just returned.
    const fresh = latest()
    const index = fresh.steps.indexOf(step)
    const next = fresh.steps[index + 1] ?? fresh.currentStep
    goTo(next, true)
  }

  const index = data.steps.indexOf(step)
  const onBack =
    index > 0
      ? () => {
          if (confirmLeave()) goTo(data.steps[index - 1], false)
        }
      : undefined

  const props: StepProps = { state: data, onBack, onAdvance, onDirtyChange: setDirty }
  const offset = reduceMotion ? 0 : forward ? -24 : 24 // RTL: the next step enters from the inline end (left)

  return (
    <div className="flex flex-col gap-6">
      <WizardProgress steps={data.role ? data.steps : ["role"]} current={step} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: offset }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -offset }}
          transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
        >
          {step === "role" && <RoleStep {...props} />}
          {step === "basic" && <BasicInfoStep {...props} />}
          {step === "address" && <AddressStep {...props} />}
          {step === "interests" && <InterestsStep {...props} onFinished={setFinished} />}
          {step === "profile" && <ProviderProfileStep {...props} />}
          {step === "documents" && <DocumentsStep {...props} />}
          {step === "service" && <FirstServiceStep {...props} />}
          {step === "review" && (
            <ReviewStep
              {...props}
              onFinished={setFinished}
              onEdit={(target) => goTo(target, false)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/** Same shape as a step card, so nothing jumps when the state arrives. */
function WizardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-2 w-full" />
      </div>
      <Card className="gap-6 px-4 py-6 md:px-8 md:py-8">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="ms-auto h-13 w-36" />
      </Card>
    </div>
  )
}
