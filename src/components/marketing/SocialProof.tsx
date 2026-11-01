import { MapPin } from "lucide-react"
import { RatingStars } from "@/components/shared"
import { SOCIAL_PROOF } from "@/constants/trust"
import type { ProofItem } from "@/utils/trust"
import { formatNumber } from "@/utils/format"

/**
 * Social proof (docs/landing-page.md §8). At launch: just "Now live in {city}". Each number (rating, providers,
 * completed jobs) appears only from real data above its threshold in `constants/trust.ts` (`visibleProof`).
 */
export function SocialProof({ proof }: { proof: ProofItem[] }) {
  return (
    <section aria-label="Livo today" className="defer-render">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-heading text-xl font-semibold">{SOCIAL_PROOF.launchMessage}</p>
            <p className="text-muted-foreground">{SOCIAL_PROOF.launchBody}</p>
          </div>
        </div>
        {proof.length ? (
          <dl className="flex flex-wrap gap-8">
            {proof.map((p) =>
              p.kind === "rating" ? (
                <div key="rating">
                  <dt className="text-sm text-muted-foreground">Average rating</dt>
                  <dd className="flex items-center gap-2 font-heading text-2xl font-semibold tabular-nums">
                    {formatNumber(p.value)} <RatingStars value={p.value} />
                    <span className="text-sm font-normal text-muted-foreground">({formatNumber(p.count)} reviews)</span>
                  </dd>
                </div>
              ) : (
                <div key={p.kind}>
                  <dt className="text-sm text-muted-foreground">{p.kind === "providers" ? "Verified providers" : "Jobs completed"}</dt>
                  <dd className="font-heading text-2xl font-semibold tabular-nums">{formatNumber(p.value)}</dd>
                </div>
              ),
            )}
          </dl>
        ) : null}
      </div>
    </section>
  )
}
