import { LAUNCH_CITY, SITE_NAME } from "./site"

/**
 * Trust copy and social-proof thresholds for the landing page (docs/landing-page.md).
 *
 * RULES (do not break them when editing this file):
 * 1. Only promise what the product does today: provider verification (ID + selfie + admin review), online payments held
 *    until the customer confirms (BR-08), visible fixed prices, explicit approval of any project price change (BR-07),
 *    dispute review by our team (AD-05), phone numbers hidden until a booking is confirmed (BR-02, SY-04).
 * 2. No warranty, no money-back guarantee, no specific refund terms — those policies aren't defined yet.
 * 3. Cash is supported, so payment protection is always worded as applying to ONLINE payments.
 * 4. Numbers are shown only from real data and only above the thresholds below — never invented.
 */

// --- thresholds -------------------------------------------------------------------

/** Platform-wide review count before the average rating and the count appear. */
export const MIN_REVIEWS_TO_SHOW = 20
/** Approved providers before their count appears. */
export const MIN_PROVIDERS_TO_SHOW = 10
/** Completed jobs before their count appears. */
export const MIN_COMPLETED_JOBS_TO_SHOW = 50
/** "Meet our providers" is hidden below this many eligible providers. */
export const MIN_FEATURED_PROVIDERS = 3
/** At most this many provider cards. */
export const MAX_FEATURED_PROVIDERS = 4
/** A provider's stars appear on their card only with at least this many reviews; otherwise experience + portfolio. */
export const MIN_PROVIDER_REVIEWS_FOR_STARS = 5
/** The work gallery is hidden below this many photos. */
export const MIN_GALLERY_IMAGES = 3
export const MAX_GALLERY_IMAGES = 8
export const MAX_POPULAR_SERVICES = 6

// --- copy ------------------------------------------------------------------------------

export const HERO = {
  title: "Book a verified technician. Pay with confidence.",
  primaryCta: "Book a service",
  secondaryCta: "Join as a provider",
} as const

export type TrustIconKey = "verified" | "payment" | "price" | "reviews" | "support" | "privacy"

export const TRUST_STRIP: readonly { icon: TrustIconKey; label: string }[] = [
  { icon: "verified", label: "Verified providers" },
  { icon: "payment", label: "Payment protected until the job is done (online payments)" },
  { icon: "price", label: "Clear upfront prices" },
  { icon: "reviews", label: "Real customer reviews" },
]

export const WHY_TRUST = {
  title: `Why you can trust ${SITE_NAME}`,
  intro: "You're letting someone into your home. Here's exactly what we do to make that safe.",
  cards: [
    {
      icon: "verified" as TrustIconKey,
      title: "Verified providers",
      body: "Every provider sends their national ID and a selfie, and our team reviews them before they can take a single job.",
    },
    {
      icon: "payment" as TrustIconKey,
      title: "Protected payments",
      body: `When you pay online, ${SITE_NAME} holds the money and releases it to the provider only after you confirm the work is done.`,
    },
    {
      icon: "price" as TrustIconKey,
      title: "Clear pricing",
      body: "Small jobs have fixed prices you see before booking. On a project, any price change needs your explicit approval.",
    },
    {
      icon: "support" as TrustIconKey,
      title: "Support when things go wrong",
      body: "If something isn't right, report it before you confirm the job. Our team reviews every dispute.",
    },
  ],
  privacyNote: "Your phone number stays hidden until your booking is confirmed.",
  policiesLink: "Our policies",
} as const

export const HOW_IT_WORKS = {
  title: "How it works",
  tabs: [
    {
      id: "fixed",
      label: "Fixed-price service",
      steps: [
        { title: "Choose a service", body: "Pick a fixed-price job and see the price before you book." },
        { title: "Book and pay", body: "Choose a time and pay online, or pay in cash when the job is done." },
        { title: "The provider confirms", body: "Your provider accepts the booking. Their phone number is shared with you then." },
        { title: "The work is done", body: "The provider marks the job as done when they finish." },
        { title: "You confirm", body: "You confirm the work. If you paid online, the provider is paid only now." },
        { title: "You rate", body: "Leave a review so other customers know what to expect." },
      ],
    },
    {
      id: "quotes",
      label: "Project with quotes",
      steps: [
        { title: "Describe your project", body: "Add a description, photos, your area and a budget if you have one." },
        { title: "Compare quotes", body: "Verified providers send their price and timeline. Compare them side by side." },
        { title: "Accept one", body: "Pick the quote that suits you. Any later price change needs your approval." },
        // TODO: confirm — staged payments (CU-17) are in the data model but not yet in the booking UI.
        { title: "Pay in stages", body: "For bigger projects, pay in stages as the work progresses." },
        { title: "Confirm completion", body: "Confirm when the project is finished, then leave a review." },
      ],
    },
  ],
} as const

export const MONEY_FLOW = {
  title: "Where your money is",
  steps: ["You pay", `${SITE_NAME} holds the payment`, "Work is completed", "You confirm", "Provider is paid"],
  footnote: "Applies to online payments. Cash is paid directly to the provider when the job is done.",
} as const

export const SOCIAL_PROOF = {
  launchMessage: `Now live in ${LAUNCH_CITY}`,
  launchBody: "We're starting in one city so we can check every provider ourselves.",
} as const

export const PROVIDER_BAND = {
  title: "Work with ready customers and secure payments.",
  benefits: [
    { title: "Steady requests", body: "Get booking and quote requests from customers in your areas and specialty." },
    { title: "Protected payments", body: "Online payments are held by us and released to you once the customer confirms the job." },
    { title: "A professional profile", body: "Show your verified badge, your past work and your customer reviews." },
  ],
  cta: "Join as a provider",
} as const

export const FINAL_CTA = {
  title: "Ready to get the job done?",
  body: "Book a verified provider in a few taps.",
} as const

/**
 * FAQ — answered ONLY from what the product does. Policies that aren't defined yet (refund terms, warranty, cancellation
 * window, no-shows) are answered honestly as "case by case through our dispute process" with a TODO to confirm.
 * Rendered server-side (answers in the HTML) and as FAQPage JSON-LD.
 */
export const LANDING_FAQ: readonly { q: string; a: string }[] = [
  {
    q: "What if a technician doesn't show up?",
    // TODO: confirm the no-show policy (rebooking, compensation) and how customers report it (the booking page with
    // "report a problem" — CU-12 — is not built yet). Until then it is case by case.
    a: `Tell us and our team will look into it. If you paid online, the money stays held by ${SITE_NAME} — it only reaches the provider after you confirm the job is done. Each case is reviewed individually through our dispute process.`,
  },
  {
    q: "How do you verify providers?",
    a: "Every provider sends a photo of their national ID and a selfie, and can add trade certificates. Our team reviews them before the provider can receive any request or booking. Providers can also be suspended later.",
  },
  {
    q: "Can I pay in cash?",
    a: "Yes. You can pay online or in cash when the job is done. Payment protection — holding the money until you confirm the work — applies only to online payments.",
  },
  {
    q: "Who can see my phone number?",
    a: "No provider sees your phone number or full address until they accept your booking. Then it's shared only with that provider, for that booking. It's never shown on public pages.",
  },
  {
    q: "What happens if there's a problem with the work?",
    // TODO: confirm refund terms and any warranty. Until then: case by case through disputes.
    a: `Report the problem before you confirm the job. If you paid online, the payment stays on hold while our team reviews the dispute, including photos and your chat with the provider. The outcome is decided case by case.`,
  },
]
