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
      toast.error("اختار نوع الحساب الأول.")
      return
    }
    if (!dirty) return onAdvance("next")
    save.mutate({ role }, { onSuccess: () => onAdvance("next"), onError: (e) => toast.error(e.message) })
  }

  return (
    <StepCard
      title="أهلًا بيك! هتستخدم المنصة إزاي؟"
      description="تقدر تغيّر اختيارك لحد ما تخلّص التسجيل."
      footer={<StepActions onPrimary={submit} primaryLabel="التالي" pending={save.isPending} />}
    >
      <div role="radiogroup" aria-label="نوع الحساب" className="grid gap-4 md:grid-cols-2">
        <RoleCard
          name="role"
          value="CUSTOMER"
          icon={ClipboardList}
          title="عايز أطلب خدمة"
          description="احجز خدمات صيانة وتشطيب بسعر ثابت، أو اطلب عروض أسعار وقارن بينها."
          checked={role === "CUSTOMER"}
          onSelect={() => setRole("CUSTOMER")}
        />
        <RoleCard
          name="role"
          value="PROVIDER"
          icon={Wrench}
          title="أنا مقدم خدمة"
          description="اعرض خدماتك، استقبل طلبات في منطقتك، واستلم فلوسك بأمان."
          checked={role === "PROVIDER"}
          onSelect={() => setRole("PROVIDER")}
        />
      </div>
    </StepCard>
  )
}
