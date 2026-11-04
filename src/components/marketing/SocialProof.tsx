import { MapPin } from "lucide-react"
import { RatingStars } from "@/components/shared"
import { SOCIAL_PROOF } from "@/constants/trust"
import type { ProofItem } from "@/utils/trust"
import { formatNumber } from "@/utils/format"
import { CountUp } from "@/components/motion/CountUp"

/**
 * Social proof (docs/landing-page.md §8). At launch: just "Now live in {city}". Each number (rating, providers,
 * completed jobs) appears only from real data above its threshold in `constants/trust.ts` (`visibleProof`).
 */
export function SocialProof({ proof }: { proof: ProofItem[] }) {
  return (
    <section aria-label="Livo today" className="defer-render">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="flex flex-col gap-6 rounded-[36px] border bg-card p-6 shadow-card md:flex-row md:items-center md:justify-between md:p-10">
        <div className="flex items-start gap-3">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <MapPin className="size-6" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-xl font-bold md:text-2xl">{SOCIAL_PROOF.launchMessage}</p>
            <p className="text-muted-foreground">{SOCIAL_PROOF.launchBody}</p>
          </div>
        </div>
        {proof.length ? (
          <dl className="flex flex-wrap gap-8">
            {proof.map((p) =>
              p.kind === "rating" ? (
                <div key="rating">
                  <dt className="text-sm text-muted-foreground">Average rating</dt>
                  <dd className="flex items-center gap-2 font-heading text-3xl font-bold tabular-nums">
                    <CountUp value={p.value} decimals={1} /> <RatingStars value={p.value} />
                    <span className="text-sm font-normal text-muted-foreground">({formatNumber(p.count)} reviews)</span>
                  </dd>
                </div>
              ) : (
                <div key={p.kind}>
                  <dt className="text-sm text-muted-foreground">{p.kind === "providers" ? "Verified providers" : "Jobs completed"}</dt>
                  <dd className="text-brand-gradient font-heading text-[clamp(30px,3.4vw,46px)] leading-none font-bold tabular-nums">
                    <CountUp value={p.value} />
                  </dd>
                </div>
              ),
            )}
          </dl>
        ) : null}
        </div>
      </div>
    </section>
  )
}
