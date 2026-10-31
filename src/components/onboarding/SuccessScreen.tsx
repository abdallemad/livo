"use client"

import Link from "next/link"
import { Bell, CheckCircle2, Clock, Eye, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useFocusOnMount } from "@/hooks/use-focus-on-mount"
import type { OnboardingFinishDto } from "@/types/onboarding"

/** Final screen. Providers see what "قيد المراجعة" means and what happens next (PR-03). */
export function SuccessScreen({ result }: { result: OnboardingFinishDto }) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>()
  const provider = result.role === "PROVIDER"
  return (
    <Card className="items-center gap-6 px-4 py-10 text-center md:px-10">
      <span
        className={
          provider
            ? "flex size-16 items-center justify-center rounded-full bg-warning/12 text-warning"
            : "flex size-16 items-center justify-center rounded-full bg-success/12 text-success"
        }
      >
        {provider ? <Clock className="size-8" aria-hidden /> : <CheckCircle2 className="size-8" aria-hidden />}
      </span>
      <div className="space-y-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold outline-none md:text-3xl">
          {provider ? "ملفك قيد المراجعة" : "حسابك جاهز!"}
        </h1>
        <p className="max-w-prose text-muted-foreground">
          {provider
            ? "استلمنا بياناتك ومستنداتك. فريقنا هيراجعها، وعادةً بناخد يومين شغل."
            : "تقدر دلوقتي تحجز خدمة بسعر ثابت أو تطلب عروض أسعار وتقارن بينها."}
        </p>
      </div>
      {provider ? (
        <ol className="grid w-full max-w-md gap-3 text-start">
          <NextStep icon={ShieldCheck} text="بنراجع هويتك ومستنداتك." />
          <NextStep icon={Bell} text="هيوصلك إشعار بالنتيجة أول ما نخلّص." />
          <NextStep icon={Eye} text="خدماتك هتظهر للعملاء بعد الموافقة بس." />
        </ol>
      ) : null}
      <Button size="lg" render={<Link href={result.redirectTo} />}>
        {provider ? "روح للوحة المزود" : "روح لحسابك"}
      </Button>
    </Card>
  )
}

function NextStep({ icon: Icon, text }: { icon: typeof Bell; text: string }) {
  return (
    <li className="flex items-center gap-3 rounded-md border bg-card p-3">
      <Icon className="size-5 shrink-0 text-primary" aria-hidden />
      {text}
    </li>
  )
}
