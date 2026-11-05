import { LAUNCH_CITY, SITE_NAME } from "./site"

/**
 * Copy for the Help pages and /become-provider (docs/help-pages-feature.md).
 *
 * Same rules as `constants/trust.ts`: promise only what the product does today — verification (ID + selfie + admin
 * review), online payments held until the customer confirms or the objection window ends (BR-08), fixed prices,
 * explicit approval of project price changes (BR-07), dispute review (AD-05), phone numbers hidden until a booking is
 * confirmed (BR-02). No warranty, refund terms, cancellation windows or verification times — those aren't defined yet.
 */

export type HelpIconKey =
  | "inbox"
  | "wallet"
  | "badge"
  | "map"
  | "tag"
  | "calendar"
  | "user"
  | "id"
  | "list"
  | "check"
  | "message"
  | "shield"
  | "help"
  | "bot"
  | "phone"
  | "mail"
  | "heart"
  | "eye"
  | "lock"

/** The Help group (`MARKETING_NAV_GROUPS` → Help) as a pill bar on each help page. */
export const HELP_NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: `About ${SITE_NAME}` },
  { href: "/contact", label: "Contact us" },
] as const

export type HelpPath = (typeof HELP_NAV)[number]["href"]

// --- /become-provider ---------------------------------------------------------------------------

export const BECOME_PROVIDER = {
  title: "Grow your trade with customers who are ready to book",
  lead: `Join ${SITE_NAME} in ${LAUNCH_CITY}: get requests in your areas, set your own prices and get paid safely.`,
  primaryCta: "Create your provider account",
  secondaryCta: "Provider sign in",
  chips: ["Verified badge on your profile", "Online payments held safely", "You choose your areas and prices"],
  benefits: [
    { icon: "inbox", title: "Steady requests", body: "Booking and quote requests from customers in your areas and your trades — no cold calls, no flyers." },
    { icon: "wallet", title: "Protected payments", body: `Online payments are held by ${SITE_NAME} and released to you once the customer confirms the job.` },
    { icon: "badge", title: "A professional profile", body: "Your verified badge, your past work and your customer reviews on one public page." },
    { icon: "map", title: "Your areas", body: "Pick the neighbourhoods you cover. You only see requests where you actually work." },
    { icon: "tag", title: "Your prices", body: "Publish fixed-price services for small jobs and send your own quotes on bigger projects." },
    { icon: "calendar", title: "Your schedule", body: "Set your working hours; customers can only book the times you're available." },
  ],
  ways: [
    {
      title: "Fixed-price services",
      body: "List small, repeatable jobs with a clear price and duration. Customers book a time slot straight away.",
      points: ["You set the price and duration", "Instant bookings in your working hours", "Ideal for repairs, installs and cleaning"],
    },
    {
      title: "Quotes on projects",
      body: "Customers describe a bigger job with photos and a budget. You send your price and timeline, and they compare.",
      points: ["Answer only the requests that suit you", "Any later price change needs the customer's approval", "Ideal for finishing, tiling and wiring"],
    },
  ],
  steps: [
    { icon: "user", title: "Create your account", body: "Sign up with your phone number and choose “I offer services”." },
    { icon: "map", title: "Tell us where you work", body: "Your name, your city and the first area you cover." },
    { icon: "list", title: "Build your profile", body: "A short bio, your years of experience, your trades and every area you cover." },
    { icon: "id", title: "Verify your identity", body: "Upload your national ID and a selfie. Trade certificates are optional but help." },
    { icon: "tag", title: "Add your first service", body: "Title, price, duration and photos, with a live preview. Quote-only trades skip this step." },
    { icon: "check", title: "Get approved and go live", body: "Our team reviews every application and notifies you as soon as you're approved." },
  ],
  needs: [
    "A smartphone with a camera",
    "Your national ID",
    "Experience in at least one trade",
    "Trade certificates (optional)",
  ],
  payout: {
    title: "How you get paid",
    steps: ["Customer pays online", `${SITE_NAME} holds the payment`, "You finish the job", "Customer confirms", "Money lands in your wallet"],
    notes: [
      "Request a payout from your wallet at any time; our team approves it.",
      `A platform commission is deducted from each booking — you can see it on every job in your earnings.`,
      "Cash jobs are paid to you directly; their commission is settled from your wallet.",
    ],
  },
  faq: [
    {
      q: `How much does it cost to join ${SITE_NAME}?`,
      a: `Creating a provider account is free. ${SITE_NAME} earns a commission on each booking, and you see it on every job in your earnings.`,
    },
    {
      q: "How long does verification take?",
      a: "Our team reviews applications one by one. You get a notification as soon as you're approved — or if a document needs to be uploaded again.",
    },
    {
      q: "Can customers pay me in cash?",
      a: `Yes. Customers can pay online or in cash. Online payments are held by ${SITE_NAME} and released after the customer confirms the job.`,
    },
    {
      q: "Will customers see my phone number?",
      a: "Only after you accept a booking, and only that customer. Before that you talk through the in-app chat.",
    },
    {
      q: "Which areas can I work in?",
      a: `${SITE_NAME} is live in ${LAUNCH_CITY}. You choose the areas you cover when you build your profile and can change them later.`,
    },
  ],
  finalTitle: "Ready to get your first booking?",
  finalBody: "It takes a few minutes to apply. Save and come back at any step.",
} as const

// --- /how-it-works ------------------------------------------------------------------------------

export const HOW_IT_WORKS_PAGE = {
  title: "How it works",
  lead: "Clear steps from the request to the finished job — for customers and for providers.",
  customerTitle: "Booking as a customer",
  providerTitle: "Working as a provider",
  providerSteps: [
    { title: "Apply and get verified", body: "Build your profile and upload your ID and a selfie. Our team approves you." },
    { title: "Receive requests", body: "Bookings for your services and quote requests in your areas and trades." },
    { title: "Accept or quote", body: "Accept a booking or send your price and timeline on a project." },
    { title: "Do the job", body: "Start the job, keep the customer posted in the chat and mark it finished." },
    { title: "Get paid", body: "Once the customer confirms, the money lands in your wallet. Request a payout any time." },
  ],
  promisesTitle: "What we guarantee on every job",
} as const

// --- /faq -------------------------------------------------------------------------------------

export const FAQ_GROUPS: readonly { id: string; title: string; icon: HelpIconKey; items: readonly { q: string; a: string }[] }[] = [
  {
    id: "booking",
    title: "Booking a service",
    icon: "calendar",
    items: [
      { q: "What's the difference between a fixed-price service and a quote?", a: "Fixed-price services are small jobs with a price you see before booking — you pick a time and book. For bigger projects you describe the job and verified providers send quotes you can compare." },
      { q: "Do I need an account to book?", a: "You can browse every service without an account. To book or request quotes you sign in with your phone number." },
      { q: "Can I change or cancel a booking?", a: "What you can do depends on how close the appointment is — the booking page always shows the options available to you." },
      { q: "What if a technician doesn't show up?", a: `Tell us from the booking page. If you paid online, the money stays held by ${SITE_NAME}; each case is reviewed by our team.` },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    icon: "wallet",
    items: [
      { q: "How can I pay?", a: "Online by card, or in cash when the job is done." },
      { q: "When does the provider get paid?", a: "For online payments, after you confirm the job is done — or when the objection window shown on the booking ends without a report." },
      { q: "Is payment protection available for cash?", a: "No. Holding the money until you confirm applies only to online payments. Cash goes straight to the provider." },
      { q: "Can the price change after I accept a quote?", a: "Only with your explicit approval. A provider can't change the agreed price on their own." },
    ],
  },
  {
    id: "trust",
    title: "Trust & safety",
    icon: "shield",
    items: [
      { q: "How are providers verified?", a: "Every provider uploads their national ID and a selfie, and can add trade certificates. Our team reviews them before the provider can receive any request." },
      { q: "Who can see my phone number and address?", a: "No provider sees them until they accept your booking — then only that provider, for that booking. They never appear on public pages." },
      { q: "What if there's a problem with the work?", a: "Report it from the booking before you confirm the job. If you paid online the payment stays on hold while our team reviews the dispute, including photos and your chat." },
      { q: "Are the reviews real?", a: "Only customers with a completed booking can leave a review, one per booking." },
    ],
  },
  {
    id: "providers",
    title: "For providers",
    icon: "badge",
    items: BECOME_PROVIDER.faq,
  },
]

// --- /about ---------------------------------------------------------------------------------------

export const ABOUT_PAGE = {
  title: `About ${SITE_NAME}`,
  lead: "A home-services marketplace built on one idea: you should never have to gamble when you let someone into your home.",
  storyTitle: "Why we started",
  story: [
    "Finding a good plumber, electrician or painter usually means asking around, hoping, and paying in cash before you know if the job was done right.",
    `${SITE_NAME} changes that. Every provider is verified by our team, prices are clear before you book, and online payments are held until you confirm the work is finished.`,
    `We're starting in ${LAUNCH_CITY} — one city at a time, so we can check every provider ourselves.`,
  ],
  valuesTitle: "What we stand for",
  values: [
    { icon: "eye", title: "Transparency", body: "Fixed prices up front, quotes side by side, no surprise changes without your approval." },
    { icon: "shield", title: "Safety", body: "Verified identities, hidden phone numbers until a booking is confirmed, and a team that reviews disputes." },
    { icon: "heart", title: "Fairness", body: "Providers get steady work and protected payments; customers pay only for work they confirm." },
    { icon: "lock", title: "Privacy", body: "Your contact details are shared with one provider, for one booking — never on public pages." },
  ],
  sidesTitle: "Built for both sides",
  sides: [
    { title: "For customers", body: "Book a fixed-price job in a few taps or compare quotes on a bigger project.", href: "/services", cta: "Browse services" },
    { title: "For providers", body: "Get requests in your areas, set your own prices and get paid safely.", href: "/become-provider", cta: "Join as a provider" },
  ],
} as const

// --- /contact -----------------------------------------------------------------------------------

export const CONTACT_PAGE = {
  title: "Contact us",
  lead: "The fastest way to get help depends on what you need. Pick the option that fits.",
  channels: [
    { icon: "message", title: "About a booking", body: "Message your provider in the booking chat — it keeps everything in one place for our team if a problem comes up.", href: "/account/messages", cta: "Open my messages" },
    { icon: "shield", title: "Problem with a job", body: "Open the booking and report the problem before you confirm. Online payments stay on hold during the review.", href: "/account/bookings", cta: "Go to my bookings" },
    { icon: "bot", title: `Ask the ${SITE_NAME} assistant`, body: "Quick answers about booking, payments and your account — open the assistant button in the corner of any page.", href: null, cta: null },
    { icon: "help", title: "Browse the FAQ", body: "Answers about booking, payments, held funds, disputes and joining as a provider.", href: "/faq", cta: "Read the FAQ" },
  ],
  providerTitle: "Are you a provider?",
  providerBody: "Your dashboard has your requests, bookings, wallet and verification status. Messages from our team arrive as notifications.",
  topicsTitle: "Popular topics",
  topics: [
    { label: "How verification works", href: "/faq#trust" },
    { label: "When the provider gets paid", href: "/faq#payments" },
    { label: "Changing or cancelling a booking", href: "/faq#booking" },
    { label: "Joining as a provider", href: "/become-provider" },
  ],
} as const

export const HELP_CTA = {
  title: "Still have a question?",
  body: "Check the FAQ, ask the assistant in the corner of the page, or see every way to reach us.",
} as const
