import type { Metadata } from "next"
import Link from "next/link"
import {
  BadgeCheck,
  ClipboardList,
  Droplets,
  MessageSquareQuote,
  PaintRoller,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SITE_DESCRIPTION, SITE_NAME } from "@/constants/site"

/**
 * `/` — public home (docs/SITEMAP.md §2, MK-01): value prop, categories,
 * how-it-works teaser, CTAs for customers and providers. Static — no request
 * or DB reads. Categories are placeholders until the launch categories are
 * decided (SITEMAP open decision #6); they all link to `/services` for now.
 */
export const metadata: Metadata = { alternates: { canonical: "/" } }

const CATEGORIES = [
  { label: "Plumbing", hint: "Leaks, installation, maintenance", icon: Droplets },
  { label: "Electrical", hint: "Faults, wiring, lighting", icon: Zap },
  { label: "Cleaning", hint: "Apartments, post-renovation", icon: Sparkles },
  { label: "Painting and finishing", hint: "Painting, tiling", icon: PaintRoller },
]

const STEPS = [
  { title: "Choose a service or describe your job", body: "Book a fixed-price service, or post a request with photos.", icon: ClipboardList },
  { title: "Compare quotes", body: "Verified providers in your area send you clear quotes.", icon: MessageSquareQuote },
  { title: "Pay safely", body: "Your money stays on hold until you confirm the job is done.", icon: ShieldCheck },
]

const TRUST = [
  { title: "Verified providers", body: "We check ID and certificates before any provider can receive requests.", icon: BadgeCheck },
  { title: "Held payment", body: "The provider gets paid after you confirm the job is done.", icon: ShieldCheck },
  { title: "Real reviews", body: "Every review is from a customer who actually completed a booking.", icon: Star },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1.2fr_1fr] md:px-6 md:py-20">
          <div className="space-y-6">
            <h1 className="text-4xl leading-tight font-bold md:text-6xl md:leading-tight">
              Home maintenance,
              <br />
              <span className="text-primary">with a clear price up front.</span>
            </h1>
            <p className="max-w-prose text-lg text-muted-foreground">{SITE_DESCRIPTION}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/services" />}>
                Browse services
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/account/requests/new" />}>
                Request a quote
              </Button>
            </div>
          </div>
          <div aria-hidden className="relative hidden aspect-square rounded-xl border bg-muted md:block">
            <Wrench className="absolute inset-0 m-auto size-24 text-primary/30" />
            <div className="absolute start-6 bottom-6 flex items-center gap-3 rounded-lg border bg-card p-4 shadow-md">
              <span className="flex size-10 items-center justify-center rounded-full bg-success/12 text-success">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <p className="font-semibold">Payment held</p>
                <p className="text-sm text-muted-foreground">until you confirm the job is done</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold md:text-3xl">What do you need today?</h2>
          <Link href="/services" className="hidden font-medium text-primary hover:underline sm:inline">
            All services
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CATEGORIES.map(({ label, hint, icon: Icon }) => (
            <li key={label}>
              <Link
                href="/services"
                className="flex h-full flex-col gap-3 rounded-lg border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <Icon className="size-8 text-primary" aria-hidden />
                <span className="font-heading text-lg font-semibold">{label}</span>
                <span className="text-sm text-muted-foreground">{hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works teaser */}
      <section className="defer-render border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
          <h2 className="mb-10 text-2xl font-semibold md:text-3xl">How {SITE_NAME} works</h2>
          <ol className="grid gap-8 md:grid-cols-3">
            {STEPS.map(({ title, body, icon: Icon }, i) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-lg font-semibold text-primary-foreground tabular-nums">
                  {i + 1}
                </span>
                <div className="space-y-1">
                  <h3 className="flex items-center gap-2 text-xl font-semibold">
                    {title}
                    <Icon className="size-5 text-muted-foreground" aria-hidden />
                  </h3>
                  <p className="text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ol>
          <Button variant="link" className="mt-8 px-0" render={<Link href="/how-it-works" />}>
            Learn more
          </Button>
        </div>
      </section>

      {/* Trust */}
      <section className="defer-render mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {TRUST.map(({ title, body, icon: Icon }) => (
            <div key={title} className="space-y-2 border-s-2 border-primary ps-4">
              <Icon className="size-6 text-primary" aria-hidden />
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Provider CTA */}
      <section className="defer-render px-4 pb-12 md:px-6 md:pb-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-xl bg-primary p-8 text-primary-foreground md:flex-row md:items-center md:justify-between md:p-12">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold md:text-3xl">Do you offer maintenance or finishing services?</h2>
            <p className="max-w-prose text-primary-foreground/85">
              Get requests in your area, send quotes, and get paid safely.
            </p>
          </div>
          <Button size="lg" variant="secondary" render={<Link href="/become-provider" />}>
            Join as a provider
          </Button>
        </div>
      </section>
    </>
  )
}
