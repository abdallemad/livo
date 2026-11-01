import Link from "next/link"
import { BriefcaseBusiness, CalendarClock, ClipboardList, Images, MapPin, ShieldCheck, Star } from "lucide-react"
import { JsonLd } from "@/components/seo/json-ld"
import { RatingStars, VerifiedBadge } from "@/components/shared"
import { PublicImage } from "@/components/shared/public-image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PublicProviderProfile } from "@/types/catalog"
import { categoryPageHref } from "@/utils/catalog"
import { formatDate, formatNumber } from "@/utils/format"
import { breadcrumbJsonLd, providerJsonLd } from "@/utils/structured-data"
import { Crumbs } from "./Crumbs"
import { ServiceGrid } from "./ServiceGrid"

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"

/** Visible breadcrumb and JSON-LD share one list (CLAUDE.md §11). */
export function providerCrumbs(p: PublicProviderProfile) {
  return [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: p.name, path: p.href },
  ]
}

/**
 * `/providers/[id]` (PR-04, PR-10, SY-04; docs/provider-profile-feature.md): server-rendered, cached (ISR). Who the
 * provider is, what they do and where, their live services, past work and customer reviews. **No contact details** —
 * customers reach a provider by booking a service or sending a quote request (SY-04). Stars appear only above the trust
 * threshold; below it the track record speaks (docs/landing-page.md).
 */
export function ProviderProfileView({ p }: { p: PublicProviderProfile }) {
  const crumbs = providerCrumbs(p)
  const quoteCategory = p.specialties[0]?.slug
  const requestHref = quoteCategory ? `/account/requests/new?category=${encodeURIComponent(quoteCategory)}` : "/account/requests/new"
  const photos = p.portfolio.reduce((n, item) => n + item.images.length, 0)

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-6 md:py-12">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={providerJsonLd({ name: p.name, href: p.href, bio: p.bio, specialties: p.specialties.map((s) => s.name), city: p.city, image: p.avatarUrl })} />
      <Crumbs crumbs={crumbs} />

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar className="size-24 text-2xl">
            {p.avatarUrl ? <AvatarImage src={p.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials(p.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold md:text-4xl">{p.name}</h1>
              <VerifiedBadge />
            </div>
            {p.showStars ? (
              <RatingStars value={p.rating} count={p.reviewsCount} />
            ) : (
              <p className="text-sm text-muted-foreground">{p.reviewsCount ? `${formatNumber(p.reviewsCount)} review${p.reviewsCount === 1 ? "" : "s"} so far` : "New on Livo — no reviews yet"}</p>
            )}
            {p.specialties.length ? (
              <ul className="flex flex-wrap gap-2" aria-label="Specialties">
                {p.specialties.map((s) => (
                  <li key={s.slug}>
                    <Badge variant="secondary" render={<Link href={categoryPageHref(s.slug)} />}>
                      {s.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
            <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5">
                <BriefcaseBusiness className="size-4 text-muted-foreground" aria-hidden />
                <dt className="sr-only">Jobs done</dt>
                <dd>{formatNumber(p.completedJobs)} {p.completedJobs === 1 ? "job" : "jobs"} done on Livo</dd>
              </div>
              {p.yearsExperience ? (
                <div className="flex items-center gap-1.5">
                  <Star className="size-4 text-muted-foreground" aria-hidden />
                  <dt className="sr-only">Experience</dt>
                  <dd>{formatNumber(p.yearsExperience)} years of experience</dd>
                </div>
              ) : null}
              <div className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <dt className="sr-only">Works in</dt>
                <dd>{p.areas.length ? `${p.areas.join(", ")} · ${p.city}` : `All of ${p.city}`}</dd>
              </div>
            </dl>
            {p.bio ? <p className="max-w-prose text-lg whitespace-pre-line text-muted-foreground">{p.bio}</p> : null}
            <p className="text-xs text-muted-foreground">On Livo since {formatDate(p.memberSince)}</p>
          </div>
        </header>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="space-y-3">
              <p className="font-medium">Hire {p.name}</p>
              {p.services.length ? (
                <Button size="lg" className="w-full" render={<a href="#services" />}>
                  See fixed-price services
                </Button>
              ) : null}
              <Button size="lg" variant={p.services.length ? "outline" : "default"} className="w-full" render={<Link href={requestHref} />}>
                <ClipboardList data-icon="inline-start" aria-hidden />
                Request a quote
              </Button>
              <p className="flex gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
                Contact details are shared once you book, so every job is covered by Livo&apos;s booking record and reviews.
              </p>
            </CardContent>
          </Card>

          {p.hours ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
                  Working hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  {p.hours.map((d) => (
                    <div key={d.day} className="contents">
                      <dt className="font-medium">{d.day}</dt>
                      <dd className={d.ranges.length ? "" : "text-muted-foreground"}>{d.ranges.length ? d.ranges.join(", ") : "Closed"}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">Cairo time.</p>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>

      <section id="services" aria-labelledby="services-heading" className="scroll-mt-24 space-y-4">
        <h2 id="services-heading" className="text-xl font-semibold">Services by {p.name}</h2>
        {p.services.length ? (
          <ServiceGrid items={p.services} />
        ) : (
          <p className="text-muted-foreground">No fixed-price services listed right now. Send a quote request and {p.name} can price your job.</p>
        )}
      </section>

      <section aria-labelledby="work-heading" className="defer-render space-y-4">
        <h2 id="work-heading" className="text-xl font-semibold">
          Past work
          {photos ? <span className="ms-2 text-base font-normal text-muted-foreground">({formatNumber(photos)} photos)</span> : null}
        </h2>
        {p.portfolio.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.portfolio.map((item) => (
              <li key={item.id}>
                <Card className="h-full gap-0 overflow-hidden py-0">
                  <div className="aspect-[4/3] bg-muted">
                    <PublicImage src={item.images[0]} alt={`${item.title} — by ${p.name}`} width={480} height={360} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="size-full object-cover" />
                  </div>
                  <CardContent className="space-y-1 p-4">
                    <p className="font-medium">{item.title}</p>
                    {item.description ? <p className="line-clamp-3 text-sm text-muted-foreground">{item.description}</p> : null}
                    {item.images.length > 1 ? <p className="text-xs text-muted-foreground">+{item.images.length - 1} more photo{item.images.length === 2 ? "" : "s"}</p> : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Images className="size-4" aria-hidden />
            No portfolio photos yet.
          </p>
        )}
      </section>

      <section aria-labelledby="reviews-heading" className="defer-render space-y-4">
        <h2 id="reviews-heading" className="text-xl font-semibold">
          What customers say
          {p.reviewsCount ? <span className="ms-2 text-base font-normal text-muted-foreground">({formatNumber(p.reviewsCount)})</span> : null}
        </h2>
        {p.reviews.length ? (
          <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
            {p.showStars ? (
              <div className="space-y-2">
                <p className="font-heading text-4xl font-semibold tabular-nums">{p.rating.toFixed(1)}</p>
                <RatingStars value={p.rating} count={p.reviewsCount} />
                <ul className="space-y-1 pt-2 text-sm">
                  {p.ratingBreakdown.map((r) => (
                    <li key={r.rating} className="flex items-center gap-2">
                      <span className="w-3 tabular-nums">{r.rating}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${r.percent}%` }} />
                      </span>
                      <span className="w-8 text-end text-muted-foreground tabular-nums">{formatNumber(r.count)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">An average is shown once there are enough reviews to be meaningful.</p>
            )}
            <ul className="grid gap-4">
              {p.reviews.map((r) => (
                <li key={r.id}>
                  <Card className="h-full gap-2">
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <RatingStars value={r.rating} />
                        <span className="font-medium">{r.customerFirstName ?? "A customer"}</span>
                        <span className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</span>
                      </div>
                      {r.comment ? <p className="whitespace-pre-line">{r.comment}</p> : null}
                      {r.reply ? (
                        <p className="rounded-lg border-s-4 border-primary/40 bg-muted/50 p-2 text-sm">
                          <span className="font-medium">Reply from {p.name}: </span>
                          {r.reply}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted-foreground">No reviews yet. Customers can review after a job is completed.</p>
        )}
      </section>
    </div>
  )
}
