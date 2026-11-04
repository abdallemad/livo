import Link from "next/link"
import { getImageProps } from "next/image"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HERO } from "@/constants/trust"
import { LAUNCH_CATEGORIES, LAUNCH_CITY } from "@/constants/site"
import { HeroBackdrop } from "@/components/motion/HeroBackdrop"
import { SplitWords } from "@/components/motion/split-words"

/** "plumbing, electrical and cleaning" — the launch services from constants, as one readable line. */
function servicesLine() {
  const labels = LAUNCH_CATEGORIES.map((c) => c.label)
  return labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}` : (labels[0] ?? "")
}

/**
 * Art-directed hero photo (website slide 1): a wide crop from `md` up, a portrait crop on phones. `getImageProps`
 * keeps Next's optimized `srcSet` while letting `<picture>` pick the crop, and only the matching one is downloaded.
 */
function HeroPhoto() {
  const common = { alt: "", fill: true, sizes: "100vw", priority: true, quality: 70 } as const
  const { props: desktop } = getImageProps({ ...common, src: "/marketing/hero-desktop.webp" })
  const { props: mobile } = getImageProps({ ...common, src: "/marketing/hero-mobile.webp" })
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktop.srcSet} sizes={desktop.sizes} />
      <source srcSet={mobile.srcSet} sizes={mobile.sizes} />
      <img {...desktop} alt="" className="ken-burns absolute inset-0 size-full object-cover object-[60%_30%]" />
    </picture>
  )
}

/**
 * Hero (docs/landing-page.md §2), styled after the marketing website's first screen: a navy photo band with the outcome
 * as the one H1, the launch city and services, two CTAs, and a pill-shaped service + area search. The search is a plain
 * GET form to `/services` (works before hydration; the landing page never reads `searchParams` — the listing's island
 * does).
 */
export function Hero({ areas }: { areas: { slug: string; name: string }[] }) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-navy text-white">
      <div aria-hidden className="absolute inset-0 -z-20 overflow-hidden">
        <HeroPhoto />
        {/* Website `.sl-bg::after`: a navy vignette so white text always reads on the photo. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_58%_78%_at_50%_48%,rgb(4_18_58/0.7),rgb(4_18_58/0.48)_62%,rgb(4_18_58/0.28)),linear-gradient(180deg,rgb(4_18_58/0.2),rgb(4_18_58/0.05)_40%,rgb(4_18_58/0.55))]" />
      </div>
      <HeroBackdrop />

      <div className="mx-auto flex min-h-[min(640px,calc(100svh-4.5rem))] max-w-5xl flex-col items-center justify-center px-4 pt-14 pb-12 text-center md:px-6 md:pt-20 md:pb-16">
        <span className="rise-in inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/14 px-4 py-1.5 text-[13px] font-semibold tracking-[0.06em] uppercase">
          <span aria-hidden className="relative flex size-2">
            <span className="pulse-ring absolute inset-0 rounded-full bg-coral/70" />
            <span className="relative size-2 rounded-full bg-coral" />
          </span>
          Now in {LAUNCH_CITY}
        </span>

        {/* Text animation in CSS (runs at first paint — this is the LCP element; docs/landing-page.md "Motion"). */}
        <h1
          id="hero-title"
          aria-label={HERO.title}
          className="mt-5 mb-3 text-[clamp(32px,5vw,66px)] leading-[1.08] font-bold tracking-[-0.025em] text-balance text-white [text-shadow:0_4px_30px_rgb(4_18_58/0.5)]"
        >
          <SplitWords text={HERO.title} />
        </h1>
        <p className="rise-in max-w-2xl text-[clamp(15px,1.45vw,19px)] text-[#e4e7f7]" style={{ animationDelay: "350ms" }}>
          {servicesLine().replace(/^./, (c) => c.toUpperCase())} — by providers we check ourselves.
        </p>

        <div className="rise-in mt-6 flex flex-wrap justify-center gap-3" style={{ animationDelay: "500ms" }}>
          <Button size="lg" variant="commit" render={<Link href="/services" />}>
            {HERO.primaryCta}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/55 bg-white/15 text-white hover:bg-white/25 hover:text-white dark:border-white/55 dark:bg-white/15 dark:hover:bg-white/25"
            render={<Link href="/become-provider" />}
          >
            {HERO.secondaryCta}
          </Button>
        </div>

        <form
          action="/services"
          method="get"
          role="search"
          aria-label="Find a service"
          style={{ animationDelay: "650ms" }}
          className="rise-in mt-9 grid w-full max-w-3xl gap-2 rounded-[28px] border-2 border-transparent bg-white p-2 text-navy shadow-[0_24px_44px_-20px_rgb(0_0_0/0.55)] transition-colors focus-within:border-coral sm:grid-cols-[1fr_12rem_auto] sm:rounded-full sm:ps-4"
        >
          <label className="sr-only" htmlFor="hero-q">
            What do you need?
          </label>
          <div className="flex min-w-0 items-center gap-2 ps-3 sm:ps-0">
            <Search className="size-5 shrink-0 text-navy/60" aria-hidden />
            <input
              id="hero-q"
              name="q"
              type="search"
              placeholder="What do you need? e.g. water heater"
              className="h-12 min-w-0 flex-1 rounded-full bg-transparent px-1 text-base font-medium text-navy outline-none placeholder:text-[#4b5680]/80"
            />
          </div>
          <label className="sr-only" htmlFor="hero-area">
            Area
          </label>
          <select
            id="hero-area"
            name="area"
            defaultValue=""
            className="h-12 rounded-full border-0 bg-[#f3f4fb] px-4 text-base font-medium text-navy outline-none focus-visible:ring-2 focus-visible:ring-violet"
          >
            <option value="">All of {LAUNCH_CITY}</option>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="lg" className="h-12 bg-brand-gradient text-white shadow-glow hover:bg-transparent hover:bg-brand-gradient">
            <Search data-icon="inline-start" aria-hidden />
            Search
          </Button>
        </form>
      </div>
    </section>
  )
}
