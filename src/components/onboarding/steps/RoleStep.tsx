"use client"

import { useEffect, useState } from "react"
import { ClipboardList, Wrench } from "lucide-react"
import { toast } from "sonner"
import { useSaveRole } from "@/hooks/use-onboarding"
import { StepActions, StepCard } from "../StepCard"
import { RoleCard } from "../RoleCard"
import type { StepProps } from "./types"

/** Step 1 (AU-03): customer or provider. Changeable until onboarding is finished. */
export function RoleStep({ state, onAdvance, onDirtyChange }: StepProps) {
  const [role, setRole] = useState<"CUSTOMER" | "PROVIDER" | null>(state.role)
  const save = useSaveRole()
  const dirty = role !== state.role

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])

  const submit = () => {
    if (!role) {
      toast.error("Choose an account type first.")
      return
    }
    if (!dirty) return onAdvance("next")
    save.mutate({ role }, { onSuccess: () => onAdvance("next"), onError: (e) => toast.error(e.message) })
  }

  return (
    <StepCard
      title="Welcome! How will you use the platform?"
      description="You can change your choice until you finish signing up."
      footer={<StepActions onPrimary={submit} primaryLabel="Next" pending={save.isPending} />}
    >
      <div role="radiogroup" aria-label="Account type" className="grid gap-4 md:grid-cols-2">
        <RoleCard
          name="role"
          value="CUSTOMER"
          icon={ClipboardList}
          title="I want to hire"
          description="Book fixed-price maintenance and finishing services, or request quotes and compare them."
          checked={role === "CUSTOMER"}
          onSelect={() => setRole("CUSTOMER")}
        />
        <RoleCard
          name="role"
          value="PROVIDER"
          icon={Wrench}
          title="I offer services"
          description="Offer your services, get requests in your area, and get paid safely."
          checked={role === "PROVIDER"}
          onSelect={() => setRole("PROVIDER")}
        />
      </div>
    </StepCard>
  )
}
