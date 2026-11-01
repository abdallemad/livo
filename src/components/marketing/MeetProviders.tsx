import Link from "next/link"
import { BriefcaseBusiness, Images } from "lucide-react"
import { PublicImage } from "@/components/shared/public-image"
import { RatingStars, VerifiedBadge } from "@/components/shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import type { FeaturedProvider } from "@/types/landing"
import { formatNumber } from "@/utils/format"

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"

/**
 * Meet our providers (docs/landing-page.md §6): 3–4 REAL approved providers. Stars only when a provider has enough
 * reviews (`showProviderStars`); otherwise experience and past work speak. The service returns an empty list below
 * `MIN_FEATURED_PROVIDERS`, and then this section isn't rendered at all.
 */
export function MeetProviders({ providers }: { providers: FeaturedProvider[] }) {
  if (!providers.length) return null
  return (
    <section aria-labelledby="providers-title" className="defer-render">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6">
        <div className="space-y-1">
          <h2 id="providers-title" className="text-2xl font-semibold md:text-3xl">Meet our providers</h2>
          <p className="text-muted-foreground">Real people, checked by our team before their first job.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {providers.map((p) => (
            <li key={p.id}>
              <Card className="h-full gap-0 overflow-hidden py-0">
                <Link href={`/providers/${p.id}`} className="flex h-full flex-col focus-visible:outline-none">
                  <div className="relative aspect-[4/3] bg-muted">
                    {p.portfolioImage ? (
                      <PublicImage src={p.portfolioImage.url} alt={`Past work by ${p.name}: ${p.portfolioImage.title}`} width={480} height={360} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-muted-foreground">
                        <Images className="size-8" aria-hidden />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11">
                        {p.avatarUrl ? <AvatarImage src={p.avatarUrl} alt="" /> : null}
                        <AvatarFallback>{initials(p.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{p.name}</p>
                        {p.specialty ? <p className="text-sm text-muted-foreground">{p.specialty}</p> : null}
                      </div>
                    </div>
                    <VerifiedBadge />
                    {p.rating ? (
                      <RatingStars value={p.rating.value} count={p.rating.count} />
                    ) : (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <BriefcaseBusiness className="size-4" aria-hidden />
                        {p.yearsExperience ? `${formatNumber(p.yearsExperience)} years of experience` : "Experienced provider"}
                      </p>
                    )}
                  </div>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
