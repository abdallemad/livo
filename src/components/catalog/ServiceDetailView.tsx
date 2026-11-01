import Link from "next/link"
import { BadgeCheck, BriefcaseBusiness, CalendarCheck, ClipboardList, Clock, MapPin, ShieldCheck, Star, Wrench } from "lucide-react"
import { JsonLd } from "@/components/seo/json-ld"
import { RatingStars } from "@/components/shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ServiceDetail } from "@/types/catalog"
import { CATEGORIES_PATH, categoryPageHref, durationLabel } from "@/utils/catalog"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"
import { breadcrumbJsonLd, serviceJsonLd } from "@/utils/structured-data"
import { Crumbs } from "./Crumbs"
import { ServiceGrid } from "./ServiceGrid"

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"

/** The crumbs for a service page — shared by the visible breadcrumb and the JSON-LD (CLAUDE.md §11). */
export function serviceCrumbs(s: ServiceDetail) {
  return [
    { name: "Home", path: "/" },
    { name: "Categories", path: CATEGORIES_PATH },
    ...(s.parent ? [{ name: s.parent.name, path: categoryPageHref(s.parent.slug) }] : []),
    { name: s.category.name, path: categoryPageHref(s.category.slug) },
    { name: s.title, path: s.href },
  ]
}

function Gallery({ images, title }: { images: string[]; title: string }) {
  if (!images.length) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Wrench className="size-14" aria-hidden />
      </div>
    )
  }
  const [main, ...rest] = images
  return (
    <div className="space-y-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- streamed by /api/images/services; next/image wrapper is a follow-up (docs/catalog-feature.md) */}
      <img src={main} alt={title} className="aspect-[4/3] w-full rounded-2xl object-cover" />
      {rest.length ? (
        <ul className="grid grid-cols-4 gap-2">
          {rest.slice(0, 4).map((src, i) => (
            <li key={src}>
              {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
              <img src={src} alt={`${title} — photo ${i + 2}`} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/**
 * `/services/[category]/[service]` (MK-02; docs/catalog-feature.md): server-rendered and cached (ISR). What the job
 * is and costs, who does it (public profile summary — never contact details, SY-04), one amber **Book now**
 * (DESIGN-SYSTEM §2) to the booking wizard, recent reviews, and links to more services (crawlable).
 */
export function ServiceDetailView({ s }: { s: ServiceDetail }) {
  const p = s.provider
  const crumbs = serviceCrumbs(s)
  const takesQuotes = s.category.type !== "FIXED"

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 md:px-6 md:py-12">
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={serviceJsonLd({ title: s.title, description: s.description, href: s.href, price: s.price, category: s.category.name, provider: p.name, city: p.city, images: s.images })} />
      <Crumbs crumbs={crumbs} />

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Gallery images={s.images} title={s.title} />
          <div className="space-y-3">
            <Badge variant="secondary">{s.parent ? `${s.parent.name} › ${s.category.name}` : s.category.name}</Badge>
            <h1 className="text-3xl font-semibold md:text-4xl">{s.title}</h1>
            <p className="text-lg whitespace-pre-line text-muted-foreground">{s.description}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Paid safely", body: "Your payment is held by Livo until you confirm the job is done." },
              { icon: BadgeCheck, title: "Verified provider", body: "ID checked by our team before they could take bookings." },
              { icon: CalendarCheck, title: "You pick the time", body: "Choose a date and time that suits you when you book." },
            ].map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3 rounded-xl border p-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Fixed price</p>
                <p className="font-heading text-3xl font-semibold tabular-nums">
                  <bdi dir="ltr">{formatPrice(s.price)}</bdi>
                </p>
                {s.durationMinutes ? (
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="size-4" aria-hidden />
                    About {durationLabel(s.durationMinutes)}
                  </p>
                ) : null}
              </div>
              <Button size="lg" variant="commit" className="w-full" render={<Link href={`/account/book/${s.id}`} />}>
                Book now
              </Button>
              <p className="text-center text-xs text-muted-foreground">You won&apos;t pay until you confirm the booking.</p>
              {takesQuotes ? (
                <Button variant="outline" className="w-full" render={<Link href={`/account/requests/new?category=${encodeURIComponent(s.category.slug)}`} />}>
                  <ClipboardList data-icon="inline-start" aria-hidden />
                  Need something different? Request a quote
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/providers/${p.id}`} className="flex items-center gap-3 hover:underline">
                <Avatar className="size-12">
                  {p.avatarUrl ? <AvatarImage src={p.avatarUrl} alt="" /> : null}
                  <AvatarFallback>{initials(p.name)}</AvatarFallback>
                </Avatar>
                <span>
                  <span className="flex items-center gap-1 font-semibold">
                    {p.name}
                    <BadgeCheck className="size-4 text-primary" aria-label="Verified" />
                  </span>
                  {p.reviewsCount ? <RatingStars value={p.rating} count={p.reviewsCount} /> : <span className="text-sm text-muted-foreground">No reviews yet</span>}
                </span>
              </Link>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <BriefcaseBusiness className="size-4 text-muted-foreground" aria-hidden />
                  <dt className="sr-only">Jobs done</dt>
                  <dd>{formatNumber(p.completedJobs)} {p.completedJobs === 1 ? "job" : "jobs"} done</dd>
                </div>
                {p.yearsExperience ? (
                  <div className="flex items-center gap-1.5">
                    <Star className="size-4 text-muted-foreground" aria-hidden />
                    <dt className="sr-only">Experience</dt>
                    <dd>{formatNumber(p.yearsExperience)} years</dd>
                  </div>
                ) : null}
                <div className="col-span-2 flex items-start gap-1.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <dt className="sr-only">Works in</dt>
                  <dd>{p.areas.length ? p.areas.join(", ") : `All of ${p.city}`}</dd>
                </div>
              </dl>
              {p.bio ? <p className="line-clamp-4 text-sm text-muted-foreground">{p.bio}</p> : null}
              <p className="text-xs text-muted-foreground">On Livo since {formatDate(p.memberSince)}</p>
            </CardContent>
          </Card>
        </aside>
      </div>

      <section aria-labelledby="reviews-heading" className="space-y-4">
        <h2 id="reviews-heading" className="text-xl font-semibold">
          What customers say about {p.name}
          {p.reviewsCount ? <span className="ms-2 text-base font-normal text-muted-foreground">({formatNumber(p.reviewsCount)})</span> : null}
        </h2>
        {s.reviews.length ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {s.reviews.map((r) => (
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
        ) : (
          <p className="text-muted-foreground">No reviews yet. Customers can review after a job is completed.</p>
        )}
      </section>

      {s.moreFromProvider.length ? (
        <section aria-labelledby="more-heading" className="space-y-4">
          <h2 id="more-heading" className="text-xl font-semibold">More from {p.name}</h2>
          <ServiceGrid items={s.moreFromProvider} />
        </section>
      ) : null}

      {s.similar.length ? (
        <section aria-labelledby="similar-heading" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="similar-heading" className="text-xl font-semibold">Similar {s.category.name.toLowerCase()} services</h2>
            <Button variant="ghost" render={<Link href={categoryPageHref(s.category.slug)} />}>
              All {s.category.name.toLowerCase()} services
            </Button>
          </div>
          <ServiceGrid items={s.similar} />
        </section>
      ) : null}
    </div>
  )
}
