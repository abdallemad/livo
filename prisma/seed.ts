/**
 * Livo mock-data seed for local development and staging demos.
 *
 *   npm run db:seed            → upsert reference data, then (re)create all mock data
 *   npm run db:seed -- --reset → only delete the mock data (reference data stays)
 *
 * Node runs this file directly (type stripping, Node 22.18+), so it uses only
 * erasable TypeScript: no enums, no namespaces, no parameter properties.
 *
 * Two kinds of data:
 *
 * 1. REFERENCE data — cities/areas, categories, commission, site settings,
 *    static pages. Upserted by slug/key with `update: {}`, so re-running never
 *    overwrites what an admin edited. Safe for any environment except prod.
 *
 * 2. MOCK data — users, providers, services, requests, quotes, bookings,
 *    payments, chat, reviews, disputes, wallet, payouts, notifications, audit
 *    log. Every row has a deterministic id starting with `seed_`, so a re-run
 *    first deletes exactly those rows and recreates them. Real rows are never
 *    touched.
 *
 * Mock users are NOT Clerk users. Their ids (`seed_…`) can't collide with
 * Clerk ids (`user_…`), but nobody can sign in as them. Their phones use the
 * +20 100 000 00xx range. A real sign-up with one of those numbers would hit
 * the unique index on `User.phone`, so don't run this against production. The
 * script refuses when NODE_ENV=production.
 *
 * File rows point at `seed/…` R2 keys that don't exist; the UI must show its
 * placeholder for them (CLAUDE.md §9 image fallbacks).
 *
 * Covers every status of every state machine (request, quote, booking,
 * payment/escrow, milestone, payout, dispute, verification) so each page in
 * docs/SITEMAP.md has something to render.
 */
import { PrismaClient } from "@prisma/client"
import type { Prisma } from "@prisma/client"

const db = new PrismaClient()
type Tx = Prisma.TransactionClient

const PREFIX = "seed_"
const RESET_ONLY = process.argv.includes("--reset")

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
/** Midnight UTC today, so "in 2 days at 10:00" is stable within a day. */
const TODAY = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z")
/** `at(-3, 14)` = three days ago at 14:00 UTC (16:00/17:00 Cairo). */
const at = (days: number, hour = 10, minute = 0) => new Date(TODAY.getTime() + days * DAY + hour * HOUR + minute * 60_000)

const money = (n: number) => n.toFixed(2)
const round2 = (n: number) => Math.round(n * 100) / 100

/** Deterministic PRNG (mulberry32) so file sizes/hashes are stable between runs. */
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20261031)
const hex = (len: number) => Array.from({ length: len }, () => Math.floor(rand() * 16).toString(16)).join("")

const id = (kind: string, key: string | number) => `${PREFIX}${kind}_${key}`
const phone = (n: number) => `+20100000${String(n).padStart(4, "0")}`

// ----------------------------------------------------------------------------
// Reference data
// ----------------------------------------------------------------------------

const CITIES = [
  { slug: "cairo", nameAr: "القاهرة", nameEn: "Cairo", isActive: true },
  // Present but inactive: shows that adding a city is data, not a deploy (NF-09).
  { slug: "giza", nameAr: "الجيزة", nameEn: "Giza", isActive: false },
]

const AREAS: Record<string, { slug: string; nameAr: string; nameEn: string }[]> = {
  cairo: [
    { slug: "nasr-city", nameAr: "مدينة نصر", nameEn: "Nasr City" },
    { slug: "heliopolis", nameAr: "مصر الجديدة", nameEn: "Heliopolis" },
    { slug: "new-cairo", nameAr: "التجمع الخامس", nameEn: "New Cairo" },
    { slug: "maadi", nameAr: "المعادي", nameEn: "Maadi" },
    { slug: "zamalek", nameAr: "الزمالك", nameEn: "Zamalek" },
    { slug: "mokattam", nameAr: "المقطم", nameEn: "Mokattam" },
    { slug: "shorouk", nameAr: "الشروق", nameEn: "El Shorouk" },
    { slug: "downtown", nameAr: "وسط البلد", nameEn: "Downtown" },
  ],
  giza: [
    { slug: "dokki", nameAr: "الدقي", nameEn: "Dokki" },
    { slug: "sheikh-zayed", nameAr: "الشيخ زايد", nameEn: "Sheikh Zayed" },
  ],
}

type CategorySeed = {
  slug: string
  nameAr: string
  nameEn: string
  type: "FIXED" | "QUOTE" | "BOTH"
  iconKey?: string
  description: string
  parent?: string
}

/** Launch scope: 5 top-level trades (SITEMAP open decision #6), a few sub-categories. */
const CATEGORIES: CategorySeed[] = [
  { slug: "plumbing", nameAr: "سباكة", nameEn: "Plumbing", type: "BOTH", iconKey: "droplets", description: "تسليك، إصلاح تسريبات، تركيب سخانات وخلاطات، وتغيير مواسير." },
  { slug: "plumbing-leaks", parent: "plumbing", nameAr: "إصلاح التسريبات", nameEn: "Leak repair", type: "FIXED", description: "كشف وإصلاح تسريب المية تحت الأحواض وفي الحمامات." },
  { slug: "plumbing-heaters", parent: "plumbing", nameAr: "تركيب السخانات", nameEn: "Water heaters", type: "FIXED", description: "تركيب وصيانة سخانات الغاز والكهرباء." },
  { slug: "electrical", nameAr: "كهرباء", nameEn: "Electrical", type: "BOTH", iconKey: "zap", description: "إصلاح أعطال، تركيب إنارة ونجف، وتأسيس كهرباء للشقق." },
  { slug: "electrical-wiring", parent: "electrical", nameAr: "تأسيس كهرباء", nameEn: "Wiring", type: "QUOTE", description: "تأسيس وتغيير أسلاك الشقة ولوحة الكهرباء." },
  { slug: "cleaning", nameAr: "تنظيف", nameEn: "Cleaning", type: "FIXED", iconKey: "sparkles", description: "تنظيف شقق، تنظيف بعد التشطيب، وتنظيف كنب وسجاد." },
  { slug: "finishing", nameAr: "نقاشة وتشطيبات", nameEn: "Finishing", type: "QUOTE", iconKey: "paint-roller", description: "دهانات، سيراميك وبورسلين، وتشطيب حمامات ومطابخ." },
  { slug: "finishing-painting", parent: "finishing", nameAr: "دهانات", nameEn: "Painting", type: "QUOTE", description: "دهان شقق وأوض بكل أنواع الدهانات." },
  { slug: "finishing-tiling", parent: "finishing", nameAr: "سيراميك وبورسلين", nameEn: "Tiling", type: "QUOTE", description: "تركيب سيراميك وبورسلين للأرضيات والحوائط." },
  { slug: "ac", nameAr: "تكييفات", nameEn: "Air conditioning", type: "BOTH", iconKey: "snowflake", description: "تركيب، صيانة، وشحن فريون لكل أنواع التكييفات." },
]

const GLOBAL_COMMISSION = 10
const CATEGORY_COMMISSION: Record<string, number> = { cleaning: 12 }

const SITE_SETTINGS: { key: string; value: Prisma.InputJsonValue }[] = [
  { key: "request.expiryDays", value: 7 }, // BR-05
  { key: "booking.objectionWindowHours", value: 48 }, // BR-08
  { key: "review.lowRatingThreshold", value: { minBookings: 5, maxAverage: 3 } }, // BR-04
  { key: "booking.cancellation", value: { freeUntilHoursBefore: 24, lateFeePercent: 20 } }, // BR-06
  { key: "chat.blockContactUntilConfirmed", value: true }, // SY-04
]

const STATIC_PAGES = [
  {
    slug: "about",
    title: "من نحن",
    body: "<p>منصة بتوصّل البيوت المصرية بمزودي خدمات صيانة وتشطيب موثّقين، بأسعار واضحة ودفع آمن.</p>",
  },
  {
    slug: "terms",
    title: "شروط الاستخدام",
    body: "<h2>الحجز والدفع</h2><p>المبلغ بيفضل محجوز لحد ما العميل يأكد إتمام الشغل أو تنتهي مدة الاعتراض.</p><h2>الإلغاء</h2><p>الإلغاء مجاني قبل الميعاد بـ 24 ساعة.</p>",
  },
  {
    slug: "privacy",
    title: "سياسة الخصوصية",
    body: "<p>رقم تليفونك وعنوانك ما بيظهروش لمزود الخدمة غير بعد تأكيد الحجز.</p>",
  },
  {
    slug: "faq",
    title: "الأسئلة الشائعة",
    body: "<h3>إمتى المزود بياخد فلوسه؟</h3><p>بعد ما تأكد إتمام الشغل، أو بعد 48 ساعة من غير اعتراض.</p><h3>أقدر ألغي الحجز؟</h3><p>أيوه، قبل ما المزود يبدأ الشغل.</p>",
  },
]

async function seedReferenceData() {
  for (const c of CITIES) {
    await db.city.upsert({ where: { slug: c.slug }, update: {}, create: c })
  }
  const cities = await db.city.findMany({ where: { slug: { in: CITIES.map((c) => c.slug) } } })
  for (const city of cities) {
    for (const a of AREAS[city.slug] ?? []) {
      await db.area.upsert({
        where: { cityId_slug: { cityId: city.id, slug: a.slug } },
        update: {},
        create: { ...a, cityId: city.id },
      })
    }
  }

  // Parents first (array order guarantees it), children look their parent up by slug.
  for (const [i, c] of CATEGORIES.entries()) {
    const parent = c.parent ? await db.category.findUniqueOrThrow({ where: { slug: c.parent } }) : null
    await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        type: c.type,
        iconKey: c.iconKey ?? null,
        description: c.description,
        sortOrder: i,
        parentId: parent?.id ?? null,
      },
    })
  }

  // One global commission row (categoryId null) + per-category overrides (AD-06).
  const global = await db.commissionSetting.findFirst({ where: { categoryId: null } })
  if (!global) await db.commissionSetting.create({ data: { ratePercent: money(GLOBAL_COMMISSION) } })
  for (const [slug, rate] of Object.entries(CATEGORY_COMMISSION)) {
    const category = await db.category.findUniqueOrThrow({ where: { slug } })
    await db.commissionSetting.upsert({
      where: { categoryId: category.id },
      update: {},
      create: { categoryId: category.id, ratePercent: money(rate) },
    })
  }

  for (const s of SITE_SETTINGS) {
    await db.siteSetting.upsert({ where: { key: s.key }, update: {}, create: s })
  }
  for (const p of STATIC_PAGES) {
    await db.staticPage.upsert({ where: { slug: p.slug }, update: {}, create: p })
  }

  console.log(`[seed] reference data: ${CITIES.length} cities, ${CATEGORIES.length} categories, commission, settings, pages`)
}

// ----------------------------------------------------------------------------
// Mock data: reset
// ----------------------------------------------------------------------------

/**
 * Deletes every `seed_` row, children before parents (several relations are
 * `onDelete: Restrict`). Reference data is left alone.
 */
async function deleteMockData(tx: Tx) {
  const mine = { id: { startsWith: PREFIX } }
  await tx.auditLog.deleteMany({ where: mine })
  await tx.notification.deleteMany({ where: mine })
  await tx.walletTransaction.deleteMany({ where: mine })
  await tx.payout.deleteMany({ where: mine })
  await tx.invoice.deleteMany({ where: mine })
  await tx.review.deleteMany({ where: mine })
  // ProviderDocument and Invoice restrict deleting their File, so they go first.
  await tx.providerDocument.deleteMany({ where: mine })
  await tx.file.deleteMany({ where: { OR: [mine, { key: { startsWith: "seed/" } }] } })
  await tx.dispute.deleteMany({ where: mine })
  await tx.message.deleteMany({ where: mine })
  await tx.payment.deleteMany({ where: mine })
  await tx.milestone.deleteMany({ where: mine })
  await tx.booking.deleteMany({ where: mine })
  await tx.quote.deleteMany({ where: mine })
  await tx.serviceRequest.deleteMany({ where: mine })
  await tx.service.deleteMany({ where: mine })
  await tx.portfolioItem.deleteMany({ where: mine })
  await tx.availability.deleteMany({ where: mine })
  await tx.providerArea.deleteMany({ where: { providerId: { startsWith: PREFIX } } })
  await tx.providerCategory.deleteMany({ where: { providerId: { startsWith: PREFIX } } })
  await tx.address.deleteMany({ where: mine })
  await tx.providerProfile.deleteMany({ where: { userId: { startsWith: PREFIX } } })
  await tx.customerProfile.deleteMany({ where: { userId: { startsWith: PREFIX } } })
  await tx.customerInterest.deleteMany({ where: { userId: { startsWith: PREFIX } } })
  await tx.user.deleteMany({ where: mine })
}

// ----------------------------------------------------------------------------
// Mock data: definitions
// ----------------------------------------------------------------------------

const ADMIN = { key: "admin", name: "مدير المنصة", phone: phone(1), email: "admin@example.com" }

const CUSTOMERS = [
  { key: "1", name: "أحمد محمود", area: "nasr-city", street: "شارع عباس العقاد", details: "عمارة 12، الدور الرابع، شقة 8" },
  { key: "2", name: "منى عبد الله", area: "new-cairo", street: "الحي الخامس، شارع التسعين", details: "فيلا 33" },
  { key: "3", name: "كريم حسن", area: "heliopolis", street: "شارع الحجاز", details: "عمارة 4، الدور الثاني" },
  { key: "4", name: "سارة إبراهيم", area: "maadi", street: "شارع 9", details: "عمارة 21، الدور السادس، شقة 12" },
  { key: "5", name: "يوسف علي", area: "mokattam", street: "الهضبة الوسطى", details: "عمارة 7، الدور الأول" },
  { key: "6", name: "نهى مصطفى", area: "zamalek", street: "شارع 26 يوليو", details: "عمارة 3، الدور الثالث", suspended: true },
]

type ProviderSeed = {
  key: string
  name: string
  bio: string
  years: number
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
  rejectionReason?: string
  categories: string[]
  areas: string[]
  portfolio?: string[]
}

const PROVIDERS: ProviderSeed[] = [
  { key: "1", name: "محمود عبد الرحمن", bio: "سباك بخبرة 12 سنة في الشقق والفيلات. بشتغل بخامات مضمونة وبنضّف بعد الشغل.", years: 12, status: "APPROVED", categories: ["plumbing", "plumbing-leaks", "plumbing-heaters"], areas: ["nasr-city", "heliopolis", "new-cairo"], portfolio: ["تغيير مواسير حمام كامل", "تركيب سخان غاز 10 لتر"] },
  { key: "2", name: "أحمد سمير", bio: "كهربائي معتمد. تأسيس، إصلاح أعطال، وتركيب نجف وإنارة.", years: 9, status: "APPROVED", categories: ["electrical", "electrical-wiring"], areas: ["new-cairo", "shorouk", "nasr-city", "heliopolis"], portfolio: ["تأسيس كهرباء شقة 180م"] },
  { key: "3", name: "حسام النور", bio: "فريق تنظيف منظّم بأدوات ومنظفات آمنة على الرخام والخشب.", years: 6, status: "APPROVED", categories: ["cleaning"], areas: ["nasr-city", "heliopolis", "new-cairo", "maadi", "zamalek", "mokattam"], portfolio: ["تنظيف شقة بعد التشطيب"] },
  { key: "4", name: "عماد فؤاد", bio: "مقاول تشطيبات: دهانات وسيراميك وحمامات. بلتزم بالمواعيد والمقايسة.", years: 15, status: "APPROVED", categories: ["finishing", "finishing-painting", "finishing-tiling"], areas: ["new-cairo", "heliopolis", "nasr-city", "shorouk"], portfolio: ["دهان شقة 3 أوض", "تشطيب حمام كامل"] },
  { key: "5", name: "خالد رشدي", bio: "فني تكييفات وكهرباء. صيانة، تركيب، وشحن فريون لكل الماركات.", years: 8, status: "APPROVED", categories: ["ac", "electrical"], areas: ["maadi", "mokattam", "nasr-city", "downtown"], portfolio: ["تركيب 4 تكييفات سبليت"] },
  { key: "6", name: "مصطفى جمال", bio: "سباك شاب، شغل نضيف وسريع.", years: 3, status: "PENDING", categories: ["plumbing"], areas: ["maadi", "downtown"] },
  { key: "7", name: "رامي عادل", bio: "كهربائي.", years: 2, status: "REJECTED", rejectionReason: "صورة البطاقة مش واضحة. ارفع صورة واضحة للوشين.", categories: ["electrical"], areas: ["downtown"] },
  { key: "8", name: "طارق يحيى", bio: "تنظيف واجهات زجاج وشبابيك.", years: 5, status: "SUSPENDED", categories: ["cleaning"], areas: ["zamalek", "downtown"] },
  { key: "9", name: "وليد حسني", bio: "", years: 1, status: "DRAFT", categories: ["ac"], areas: [] },
  { key: "10", name: "سامح النقاش", bio: "نقاش ومبلّط. شغل يدوي دقيق في الدهانات والسيراميك.", years: 11, status: "APPROVED", categories: ["finishing", "finishing-painting", "finishing-tiling"], areas: ["maadi", "new-cairo", "mokattam"], portfolio: ["تركيب سيراميك مطبخ"] },
]

type ServiceSeed = {
  key: string
  provider: string
  category: string
  title: string
  description: string
  price: number
  minutes: number
  isActive?: boolean
}

const SERVICES: ServiceSeed[] = [
  { key: "pipe-unclogging", provider: "1", category: "plumbing", title: "تسليك مواسير المطبخ والحمام", description: "تسليك بالسوستة أو الضغط، مع فحص سبب الانسداد.", price: 250, minutes: 60 },
  { key: "gas-heater-install", provider: "1", category: "plumbing-heaters", title: "تركيب سخان غاز", description: "تركيب السخان وتوصيل المية والغاز واختبار التسريب. السعر من غير الخامات.", price: 450, minutes: 120 },
  { key: "sink-leak-repair", provider: "1", category: "plumbing-leaks", title: "إصلاح تسريب تحت الحوض", description: "تغيير الجلب أو الوصلات اللي فيها تسريب.", price: 200, minutes: 60 },
  { key: "switch-replacement", provider: "2", category: "electrical", title: "تغيير مفتاح أو بريزة", description: "تغيير مفتاح أو بريزة واحدة، والسعر من غير الخامات.", price: 80, minutes: 30 },
  { key: "chandelier-install", provider: "2", category: "electrical", title: "تركيب نجفة", description: "تركيب نجفة لحد 12 لمبة مع تأمين التعليق.", price: 200, minutes: 60 },
  { key: "electrical-fault-repair", provider: "2", category: "electrical", title: "فحص وإصلاح عطل كهربا", description: "تحديد سبب الفصل أو القفلة وإصلاحه.", price: 300, minutes: 90 },
  { key: "apartment-cleaning-120", provider: "3", category: "cleaning", title: "تنظيف شقة لحد 120 متر", description: "تنظيف شامل للأرضيات والحمامات والمطبخ والشبابيك من جوه.", price: 1200, minutes: 360 },
  { key: "post-construction-cleaning", provider: "3", category: "cleaning", title: "تنظيف بعد التشطيب", description: "إزالة بقايا الدهان والأسمنت وتلميع الأرضيات.", price: 2200, minutes: 480 },
  { key: "sofa-carpet-cleaning", provider: "3", category: "cleaning", title: "تنظيف كنب وسجاد", description: "تنظيف بالبخار لطقم كنب وسجادتين.", price: 600, minutes: 180 },
  { key: "ac-maintenance", provider: "5", category: "ac", title: "صيانة تكييف وتنظيف فلاتر", description: "غسيل الوحدة الداخلية والخارجية وتنظيف الفلاتر.", price: 350, minutes: 90 },
  { key: "split-ac-install", provider: "5", category: "ac", title: "تركيب تكييف سبليت", description: "تركيب تكييف لحد 3 حصان مع 3 متر مواسير.", price: 900, minutes: 180 },
  // Inactive: must 404 publicly (visibility rule lives in the service layer).
  { key: "freon-recharge", provider: "5", category: "ac", title: "شحن فريون", description: "شحن فريون كامل مع كشف التسريب.", price: 700, minutes: 60, isActive: false },
  // Belongs to a SUSPENDED provider: must be hidden even though the service itself is active.
  { key: "glass-facade-cleaning", provider: "8", category: "cleaning", title: "تنظيف واجهات زجاج", description: "تنظيف واجهات وشبابيك من بره.", price: 800, minutes: 240 },
]

type RequestSeed = {
  key: string
  customer: string
  category: string
  area: string
  title: string
  description: string
  budget?: number
  status: "DRAFT" | "OPEN" | "ACCEPTED" | "CANCELLED" | "EXPIRED"
  createdDay: number
  preferredDay?: number
  media?: number
}

const REQUESTS: RequestSeed[] = [
  { key: "1", customer: "1", category: "finishing-painting", area: "nasr-city", title: "دهان شقة 3 أوض وصالة", description: "شقة 140 متر محتاجة دهان كامل بلاستيك، الحوائط فيها شروخ بسيطة في الصالة.", budget: 15000, status: "OPEN", createdDay: -2, preferredDay: 10, media: 2 },
  { key: "2", customer: "2", category: "electrical-wiring", area: "new-cairo", title: "تأسيس كهرباء شقة جديدة 150م", description: "شقة على المحارة، محتاج تأسيس كامل مع لوحة 24 خط.", budget: 25000, status: "ACCEPTED", createdDay: -14 },
  { key: "3", customer: "3", category: "plumbing", area: "heliopolis", title: "تغيير مواسير الحمام بالكامل", description: "المواسير قديمة حديد ومحتاجة تتغير بلاستيك، الحمام 6 متر.", status: "OPEN", createdDay: -1, preferredDay: 4 },
  { key: "4", customer: "4", category: "finishing-tiling", area: "maadi", title: "تركيب سيراميك مطبخ", description: "مطبخ 9 متر أرضيات وحوائط لحد السقف، السيراميك موجود.", budget: 9000, status: "ACCEPTED", createdDay: -25 },
  { key: "5", customer: "1", category: "ac", area: "nasr-city", title: "صيانة 3 تكييفات", description: "3 تكييفات 1.5 حصان محتاجين غسيل وكشف فريون.", status: "EXPIRED", createdDay: -20 },
  { key: "6", customer: "5", category: "plumbing", area: "mokattam", title: "تسريب في السقف من الشقة اللي فوق", description: "في مية بتنزل من سقف الحمام.", status: "CANCELLED", createdDay: -9 },
  { key: "7", customer: "2", category: "finishing-painting", area: "new-cairo", title: "دهان أوضة أطفال", description: "أوضة 4×4 عايزها لونين مع رسمة بسيطة.", status: "DRAFT", createdDay: 0 },
  { key: "8", customer: "3", category: "finishing", area: "new-cairo", title: "تشطيب حمام كامل", description: "حمام 5 متر: سيراميك، أطقم صحية، ودهان سقف.", budget: 20000, status: "ACCEPTED", createdDay: -30 },
  { key: "9", customer: "6", category: "electrical", area: "zamalek", title: "تغيير إنارة الشقة لليد", description: "حوالي 25 سبوت ولمبة محتاجين يتغيروا ليد.", budget: 4000, status: "OPEN", createdDay: -3 },
]

type QuoteSeed = {
  key: string
  request: string
  provider: string
  price: number
  days: number
  message: string
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN" | "EXPIRED"
  createdDay: number
}

const QUOTES: QuoteSeed[] = [
  { key: "1a", request: "1", provider: "4", price: 14500, days: 10, message: "السعر شامل المعجون والدهان بلاستيك سايبس، وهصلّح الشروخ الأول.", status: "PENDING", createdDay: -1 },
  { key: "1b", request: "1", provider: "10", price: 12800, days: 14, message: "السعر مصنعية بس، الخامات عليك أو أجيبها بفاتورة.", status: "PENDING", createdDay: -1 },
  { key: "2a", request: "2", provider: "2", price: 23000, days: 12, message: "تأسيس كامل بسلك السويدي ولوحة 24 خط، على 3 مراحل.", status: "ACCEPTED", createdDay: -13 },
  { key: "2b", request: "2", provider: "5", price: 26500, days: 10, message: "شامل الخامات والتشغيل.", status: "REJECTED", createdDay: -13 },
  { key: "4a", request: "4", provider: "10", price: 8500, days: 4, message: "مصنعية تركيب ومونة ولحامات.", status: "ACCEPTED", createdDay: -24 },
  { key: "5a", request: "5", provider: "5", price: 1000, days: 1, message: "الـ 3 تكييفات في يوم واحد.", status: "EXPIRED", createdDay: -19 },
  { key: "8a", request: "8", provider: "4", price: 18000, days: 8, message: "شامل السيراميك والأطقم الصحية متوسطة.", status: "ACCEPTED", createdDay: -29 },
  { key: "9a", request: "9", provider: "2", price: 3800, days: 2, message: "شامل اللمبات.", status: "WITHDRAWN", createdDay: -2 },
  { key: "9b", request: "9", provider: "5", price: 3500, days: 1, message: "مصنعية بس، وأقدر أجيب اللمبات بسعر الجملة.", status: "PENDING", createdDay: -2 },
]

type BookingSeed = {
  n: number
  source: "SERVICE" | "QUOTE"
  customer: string
  provider: string
  service?: string
  quote?: string
  status:
    | "PENDING_PAYMENT"
    | "PENDING_PROVIDER"
    | "CONFIRMED"
    | "IN_PROGRESS"
    | "AWAITING_CONFIRMATION"
    | "COMPLETED"
    | "CLOSED"
    | "CANCELLED"
    | "REJECTED"
    | "DISPUTED"
  method: "ONLINE" | "CASH"
  day: number
  hour?: number
  notes?: string
}

const BOOKINGS: BookingSeed[] = [
  { n: 1, source: "SERVICE", customer: "1", provider: "1", service: "pipe-unclogging", status: "PENDING_PAYMENT", method: "ONLINE", day: 3, notes: "الحوض بيصفّي ببطء من أسبوع." },
  { n: 2, source: "SERVICE", customer: "2", provider: "3", service: "apartment-cleaning-120", status: "PENDING_PROVIDER", method: "ONLINE", day: 2, hour: 7 },
  { n: 3, source: "SERVICE", customer: "3", provider: "2", service: "chandelier-install", status: "CONFIRMED", method: "CASH", day: 1, hour: 14, notes: "النجفة موجودة، السقف ارتفاعه 3 متر." },
  { n: 4, source: "SERVICE", customer: "4", provider: "5", service: "ac-maintenance", status: "IN_PROGRESS", method: "ONLINE", day: 0, hour: 9 },
  { n: 5, source: "SERVICE", customer: "5", provider: "1", service: "gas-heater-install", status: "AWAITING_CONFIRMATION", method: "ONLINE", day: -1, hour: 11 },
  { n: 6, source: "SERVICE", customer: "1", provider: "3", service: "post-construction-cleaning", status: "COMPLETED", method: "ONLINE", day: -10, hour: 7 },
  { n: 7, source: "SERVICE", customer: "2", provider: "2", service: "electrical-fault-repair", status: "CLOSED", method: "CASH", day: -20, hour: 16 },
  { n: 8, source: "SERVICE", customer: "3", provider: "1", service: "sink-leak-repair", status: "CANCELLED", method: "ONLINE", day: -6 },
  { n: 9, source: "SERVICE", customer: "4", provider: "2", service: "switch-replacement", status: "REJECTED", method: "ONLINE", day: -4 },
  { n: 10, source: "QUOTE", customer: "2", provider: "2", quote: "2a", status: "IN_PROGRESS", method: "ONLINE", day: -8, hour: 8 },
  { n: 11, source: "QUOTE", customer: "4", provider: "10", quote: "4a", status: "COMPLETED", method: "ONLINE", day: -18, hour: 8 },
  { n: 12, source: "QUOTE", customer: "3", provider: "4", quote: "8a", status: "DISPUTED", method: "ONLINE", day: -22, hour: 8 },
  { n: 13, source: "SERVICE", customer: "5", provider: "5", service: "split-ac-install", status: "CLOSED", method: "ONLINE", day: -30, hour: 12 },
  { n: 14, source: "SERVICE", customer: "6", provider: "3", service: "sofa-carpet-cleaning", status: "CLOSED", method: "ONLINE", day: -40, hour: 10 },
  { n: 15, source: "SERVICE", customer: "1", provider: "1", service: "gas-heater-install", status: "COMPLETED", method: "CASH", day: -5, hour: 13 },
]

const REVIEWS: { booking: number; rating: number; comment: string; reply?: string; hidden?: boolean; byProvider?: { rating: number; comment: string } }[] = [
  { booking: 6, rating: 5, comment: "الشقة بقت تلمع، الفريق جه في ميعاده وكان محترم جدًا.", reply: "شكرًا يا أستاذ أحمد، نورتنا." },
  { booking: 7, rating: 4, comment: "حل المشكلة بسرعة، بس اتأخر نص ساعة.", byProvider: { rating: 5, comment: "عميلة محترمة وواضحة في طلبها." } },
  { booking: 11, rating: 4, comment: "الشغل نضيف واللحامات مظبوطة." },
  { booking: 13, rating: 1, comment: "كلام مسيء اتشال من المراجعة.", hidden: true },
  { booking: 14, rating: 5, comment: "الكنب رجع جديد. أنصح بيهم.", reply: "تحت أمرك في أي وقت." },
  { booking: 15, rating: 5, comment: "ركّب السخان وجرّبه قدامي وشرحلي الصيانة." },
]

const MESSAGES: { booking: number; from: "customer" | "provider"; body: string; minutesAfter: number; blocked?: boolean }[] = [
  // Booking 2 is not confirmed yet: contact details must be blocked (SY-04).
  { booking: 2, from: "provider", body: "أهلًا، ممكن أعرف الشقة كام أوضة بالظبط؟", minutesAfter: 30 },
  { booking: 2, from: "customer", body: "3 أوض وصالة وحمامين.", minutesAfter: 45 },
  { booking: 2, from: "provider", body: "[تم إخفاء بيانات التواصل — ممنوع قبل تأكيد الحجز]", minutesAfter: 50, blocked: true },
  { booking: 3, from: "customer", body: "السلام عليكم، النجفة تقيلة شوية، هتحتاج حد معاك؟", minutesAfter: 20 },
  { booking: 3, from: "provider", body: "وعليكم السلام، هجيب معايا مساعد ما تقلقيش.", minutesAfter: 35 },
  { booking: 4, from: "provider", body: "أنا تحت العمارة.", minutesAfter: 5 },
  { booking: 4, from: "customer", body: "تمام، الدور السادس شقة 12.", minutesAfter: 6 },
  { booking: 5, from: "provider", body: "خلصت التركيب وجربت السخان. من فضلك أكّد إتمام الشغل.", minutesAfter: 120 },
  { booking: 10, from: "provider", body: "خلصنا المرحلة الأولى (التكسير والخراطيم). هنبدأ سحب السلك بكرة.", minutesAfter: 60 },
  { booking: 10, from: "customer", body: "تمام، هبعتلك دفعة المرحلة التانية النهارده.", minutesAfter: 90 },
  { booking: 12, from: "customer", body: "في سيراميكة مكسورة جنب الحوض والميول غلط والمية بتقف.", minutesAfter: 60 },
  { booking: 12, from: "provider", body: "ده كان من الخامات اللي اتجابت، مش من التركيب.", minutesAfter: 120 },
]

// ----------------------------------------------------------------------------
// Mock data: build
// ----------------------------------------------------------------------------

async function seedMockData(tx: Tx) {
  // Lookups into reference data.
  const cairo = await tx.city.findUniqueOrThrow({ where: { slug: "cairo" } })
  const areas = new Map((await tx.area.findMany({ where: { cityId: cairo.id } })).map((a) => [a.slug, a]))
  const categories = new Map((await tx.category.findMany()).map((c) => [c.slug, c]))
  const commissionRows = await tx.commissionSetting.findMany({ include: { category: true } })
  const globalRate = Number(commissionRows.find((c) => c.categoryId === null)?.ratePercent ?? GLOBAL_COMMISSION)
  const categoryRate = new Map(commissionRows.filter((c) => c.category).map((c) => [c.category!.slug, Number(c.ratePercent)]))
  /** Sub-categories inherit their top-level parent's override. */
  const rateFor = (slug: string) => {
    const cat = categories.get(slug)!
    const parent = cat.parentId ? [...categories.values()].find((c) => c.id === cat.parentId) : null
    return categoryRate.get(slug) ?? (parent ? categoryRate.get(parent.slug) : undefined) ?? globalRate
  }
  const area = (slug: string) => {
    const a = areas.get(slug)
    if (!a) throw new Error(`[seed] unknown area ${slug}`)
    return a
  }
  const category = (slug: string) => {
    const c = categories.get(slug)
    if (!c) throw new Error(`[seed] unknown category ${slug}`)
    return c
  }

  const adminId = id("user", ADMIN.key)
  const customerId = (k: string) => id("user", `customer_${k}`)
  const providerId = (k: string) => id("user", `provider_${k}`)

  // --- Users ------------------------------------------------------------------
  // Everyone finished onboarding on sign-up day, except provider 9 (DRAFT), who
  // picked a role but left the wizard: the resume case (docs/onboarding-feature.md).
  const onboarded = (createdAt: Date, completed = true) => ({
    createdAt,
    cityId: cairo.id,
    roleSelectedAt: createdAt,
    onboardingCompletedAt: completed ? createdAt : null,
  })
  let phoneN = 2
  await tx.user.create({
    data: { id: adminId, name: ADMIN.name, phone: ADMIN.phone, email: ADMIN.email, role: "ADMIN", ...onboarded(at(-120)) },
  })
  for (const c of CUSTOMERS) {
    await tx.user.create({
      data: {
        id: customerId(c.key),
        name: c.name,
        phone: phone(phoneN++),
        role: "CUSTOMER",
        status: c.suspended ? "SUSPENDED" : "ACTIVE",
        ...onboarded(at(-90 + Number(c.key) * 5)),
        customerProfile: { create: {} },
      },
    })
    const a = area(c.area)
    await tx.address.create({
      data: {
        id: id("address", `${c.key}_home`),
        userId: customerId(c.key),
        label: "البيت",
        cityId: cairo.id,
        areaId: a.id,
        street: c.street,
        details: c.details,
        isDefault: true,
      },
    })
  }
  // A second, non-default address for customer 1 (CU-14).
  await tx.address.create({
    data: {
      id: id("address", "1_office"),
      userId: customerId("1"),
      label: "الشغل",
      cityId: cairo.id,
      areaId: area("downtown").id,
      street: "شارع قصر النيل",
      details: "عمارة 18، الدور الخامس، مكتب 502",
    },
  })
  // The optional onboarding "interests" step; the other customers skipped it.
  const interests: Record<string, string[]> = {
    "1": ["finishing", "ac"],
    "2": ["electrical", "cleaning", "finishing-painting"],
    "3": ["plumbing"],
  }
  for (const [k, slugs] of Object.entries(interests)) {
    await tx.customerInterest.createMany({
      data: slugs.map((slug) => ({ userId: customerId(k), categoryId: category(slug).id })),
    })
  }

  // --- Providers --------------------------------------------------------------
  for (const p of PROVIDERS) {
    const uid = providerId(p.key)
    const reviewed = p.status === "APPROVED" || p.status === "REJECTED" || p.status === "SUSPENDED"
    await tx.user.create({
      data: {
        id: uid,
        name: p.name,
        phone: phone(phoneN++),
        role: "PROVIDER",
        ...onboarded(at(-100 + Number(p.key) * 4), p.status !== "DRAFT"),
      },
    })
    await tx.providerProfile.create({
      data: {
        userId: uid,
        cityId: cairo.id,
        bio: p.bio || null,
        yearsExperience: p.years,
        verificationStatus: p.status,
        rejectionReason: p.rejectionReason ?? null,
        reviewedById: reviewed ? adminId : null,
        reviewedAt: reviewed ? at(-60 + Number(p.key)) : null,
        categories: { create: p.categories.map((slug) => ({ categoryId: category(slug).id })) },
        areas: { create: p.areas.map((slug) => ({ areaId: area(slug).id })) },
      },
    })

    // Verification documents (PR-02) for everyone past DRAFT. Private R2 keys.
    if (p.status !== "DRAFT") {
      const docs: ("NATIONAL_ID" | "SELFIE" | "CERTIFICATE")[] = ["NATIONAL_ID", "SELFIE"]
      if (p.years >= 5) docs.push("CERTIFICATE")
      for (const type of docs) {
        const fileId = id("file", `doc_${p.key}_${type.toLowerCase()}`)
        await tx.file.create({
          data: {
            id: fileId,
            key: `seed/verification/${p.key}/${type.toLowerCase()}.jpg`,
            mimeType: "image/jpeg",
            sizeBytes: 150_000 + Math.floor(rand() * 400_000),
            sha256: hex(64),
            uploadedById: uid,
          },
        })
        await tx.providerDocument.create({ data: { id: id("doc", `${p.key}_${type.toLowerCase()}`), providerId: uid, type, fileId } })
      }
    }

    // Portfolio (PR-04): each item gets two image File rows.
    for (const [i, title] of (p.portfolio ?? []).entries()) {
      const itemId = id("portfolio", `${p.key}_${i}`)
      await tx.portfolioItem.create({ data: { id: itemId, providerId: uid, title, sortOrder: i, createdAt: at(-50 + i) } })
      for (const n of [1, 2]) {
        await tx.file.create({
          data: {
            id: id("file", `portfolio_${p.key}_${i}_${n}`),
            key: `seed/portfolio/${p.key}/${i}-${n}.jpg`,
            mimeType: "image/jpeg",
            sizeBytes: 200_000 + Math.floor(rand() * 600_000),
            sha256: hex(64),
            uploadedById: uid,
            portfolioItemId: itemId,
          },
        })
      }
    }

    // Weekly hours (PR-10): Sat–Thu 09:00–18:00; Friday off.
    if (p.status === "APPROVED") {
      await tx.availability.createMany({
        data: [6, 0, 1, 2, 3, 4].map((weekday) => ({
          id: id("availability", `${p.key}_${weekday}`),
          providerId: uid,
          weekday,
          startTime: "09:00",
          endTime: "18:00",
        })),
      })
    }
  }

  // --- Services ---------------------------------------------------------------
  const serviceRows = new Map<string, { id: string; price: number; category: string; title: string }>()
  for (const [i, s] of SERVICES.entries()) {
    const sid = id("service", s.key)
    await tx.service.create({
      data: {
        id: sid,
        slug: s.key,
        providerId: providerId(s.provider),
        categoryId: category(s.category).id,
        title: s.title,
        description: s.description,
        price: money(s.price),
        durationMinutes: s.minutes,
        isActive: s.isActive ?? true,
        createdAt: at(-45 + i),
      },
    })
    await tx.file.create({
      data: {
        id: id("file", `service_${s.key}`),
        key: `seed/services/${s.key}.jpg`,
        mimeType: "image/jpeg",
        sizeBytes: 120_000 + Math.floor(rand() * 300_000),
        sha256: hex(64),
        uploadedById: providerId(s.provider),
        serviceId: sid,
      },
    })
    serviceRows.set(s.key, { id: sid, price: s.price, category: s.category, title: s.title })
  }

  // --- Requests & quotes ------------------------------------------------------
  const requestRows = new Map<string, RequestSeed>()
  for (const r of REQUESTS) {
    const rid = id("request", r.key)
    const customer = CUSTOMERS.find((c) => c.key === r.customer)!
    const created = at(r.createdDay, 9)
    await tx.serviceRequest.create({
      data: {
        id: rid,
        customerId: customerId(r.customer),
        categoryId: category(r.category).id,
        cityId: cairo.id,
        areaId: area(r.area).id,
        addressId: r.area === customer.area ? id("address", `${r.customer}_home`) : null,
        title: r.title,
        description: r.description,
        budget: r.budget !== undefined ? money(r.budget) : null,
        preferredDate: r.preferredDay !== undefined ? at(r.preferredDay) : null,
        status: r.status,
        expiresAt: r.status === "DRAFT" ? null : new Date(created.getTime() + 7 * DAY),
        createdAt: created,
      },
    })
    for (let n = 1; n <= (r.media ?? 0); n++) {
      await tx.file.create({
        data: {
          id: id("file", `request_${r.key}_${n}`),
          key: `seed/requests/${r.key}/${n}.jpg`,
          mimeType: "image/jpeg",
          sizeBytes: 300_000 + Math.floor(rand() * 900_000),
          sha256: hex(64),
          uploadedById: customerId(r.customer),
          requestId: rid,
        },
      })
    }
    requestRows.set(r.key, r)
  }

  const quoteRows = new Map<string, QuoteSeed>()
  for (const q of QUOTES) {
    const created = at(q.createdDay, 15)
    await tx.quote.create({
      data: {
        id: id("quote", q.key),
        requestId: id("request", q.request),
        providerId: providerId(q.provider),
        price: money(q.price),
        durationDays: q.days,
        message: q.message,
        status: q.status,
        validUntil: new Date(created.getTime() + 5 * DAY),
        createdAt: created,
      },
    })
    quoteRows.set(q.key, q)
  }

  // --- Bookings ---------------------------------------------------------------
  const year = TODAY.getUTCFullYear()
  const bookingNumber = (n: number) => `LV-${year}-${String(n).padStart(6, "0")}`
  const bookingId = (n: number) => id("booking", n)
  const bookingInfo = new Map<number, { amount: number; net: number; commission: number; customer: string; provider: string; title: string; status: BookingSeed["status"]; method: BookingSeed["method"]; scheduled: Date }>()

  const UNLOCKED = new Set(["CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED", "CLOSED", "DISPUTED"])
  const STARTED = new Set(["IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED", "CLOSED", "DISPUTED"])
  const PROVIDER_DONE = new Set(["AWAITING_CONFIRMATION", "COMPLETED", "CLOSED", "DISPUTED"])
  const DONE = new Set(["COMPLETED", "CLOSED"])

  for (const b of BOOKINGS) {
    let amount: number
    let categorySlug: string
    let title: string
    let requestKey: string | undefined
    if (b.source === "SERVICE") {
      const s = serviceRows.get(b.service!)!
      amount = s.price
      categorySlug = s.category
      title = s.title
    } else {
      const q = quoteRows.get(b.quote!)!
      const r = requestRows.get(q.request)!
      amount = q.price
      categorySlug = r.category
      title = r.title
      requestKey = r.key
    }
    const rate = rateFor(categorySlug)
    const commission = round2((amount * rate) / 100)
    const net = round2(amount - commission)
    const scheduled = at(b.day, b.hour ?? 10)
    const created = new Date(Math.min(scheduled.getTime() - 2 * DAY, Date.now() - HOUR))
    const customer = CUSTOMERS.find((c) => c.key === b.customer)!
    const a = area(customer.area)

    await tx.booking.create({
      data: {
        id: bookingId(b.n),
        number: bookingNumber(b.n),
        source: b.source,
        customerId: customerId(b.customer),
        providerId: providerId(b.provider),
        serviceId: b.service ? serviceRows.get(b.service)!.id : null,
        requestId: requestKey ? id("request", requestKey) : null,
        quoteId: b.quote ? id("quote", b.quote) : null,
        amount: money(amount),
        commissionRate: money(rate),
        commissionAmount: money(commission),
        providerNet: money(net),
        status: b.status,
        scheduledAt: scheduled,
        addressSnapshot: {
          label: "البيت",
          city: cairo.nameAr,
          area: a.nameAr,
          street: customer.street,
          details: customer.details,
        },
        notes: b.notes ?? null,
        contactUnlockedAt: UNLOCKED.has(b.status) ? new Date(created.getTime() + 2 * HOUR) : null,
        startedAt: STARTED.has(b.status) ? scheduled : null,
        providerCompletedAt: PROVIDER_DONE.has(b.status) ? new Date(scheduled.getTime() + 3 * HOUR) : null,
        completedAt: DONE.has(b.status) ? new Date(scheduled.getTime() + 5 * HOUR) : null,
        autoReleaseAt: b.status === "AWAITING_CONFIRMATION" ? new Date(scheduled.getTime() + 3 * HOUR + 48 * HOUR) : null,
        cancelledById: b.status === "CANCELLED" ? customerId(b.customer) : b.status === "REJECTED" ? providerId(b.provider) : null,
        cancelReason: b.status === "CANCELLED" ? "السباك اللي في العمارة صلّحها." : b.status === "REJECTED" ? "مش متاح في الميعاد ده." : null,
        cancelledAt: b.status === "CANCELLED" || b.status === "REJECTED" ? new Date(created.getTime() + 6 * HOUR) : null,
        createdAt: created,
      },
    })
    bookingInfo.set(b.n, { amount, net, commission, customer: b.customer, provider: b.provider, title, status: b.status, method: b.method, scheduled })
  }

  // --- Milestones (CU-17) for the big wiring project (booking 10) ------------
  const b10 = bookingInfo.get(10)!
  const milestones = [
    { key: "1", title: "التكسير والخراطيم", share: 0.3, status: "RELEASED" as const, due: -8 },
    { key: "2", title: "سحب السلك والعلب", share: 0.4, status: "FUNDED" as const, due: -2 },
    { key: "3", title: "اللوحة والتشطيب والتشغيل", share: 0.3, status: "PENDING" as const, due: 5 },
  ]
  for (const [i, m] of milestones.entries()) {
    await tx.milestone.create({
      data: {
        id: id("milestone", `10_${m.key}`),
        bookingId: bookingId(10),
        title: m.title,
        amount: money(round2(b10.amount * m.share)),
        sortOrder: i,
        status: m.status,
        dueAt: at(m.due),
      },
    })
  }

  // --- Payments ---------------------------------------------------------------
  // Booking status → (payment status, escrow state). Cash never sits in escrow.
  for (const b of BOOKINGS) {
    if (b.n === 10) continue // milestone payments below
    const info = bookingInfo.get(b.n)!
    const online = b.method === "ONLINE"
    let status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED" = "PAID"
    let escrow: "NONE" | "HELD" | "RELEASED" | "REFUNDED" | "PARTIALLY_REFUNDED" = "NONE"
    let refunded = 0
    let released: Date | null = null

    if (b.status === "PENDING_PAYMENT") status = "PENDING"
    else if (b.status === "CANCELLED" || b.status === "REJECTED") {
      status = "REFUNDED"
      escrow = "REFUNDED"
      refunded = info.amount
    } else if (online && ["PENDING_PROVIDER", "CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION", "DISPUTED"].includes(b.status)) escrow = "HELD"
    else if (online && DONE.has(b.status)) {
      escrow = "RELEASED"
      released = new Date(info.scheduled.getTime() + 6 * HOUR)
    } else if (!online && !DONE.has(b.status)) status = "PENDING" // cash collected on completion

    if (b.n === 13) {
      // Resolved dispute: partial refund of 300 after release.
      status = "PARTIALLY_REFUNDED"
      escrow = "PARTIALLY_REFUNDED"
      refunded = 300
    }

    await tx.payment.create({
      data: {
        id: id("payment", b.n),
        bookingId: bookingId(b.n),
        method: b.method,
        amount: money(info.amount),
        status,
        escrowState: online ? escrow : "NONE",
        gatewayRef: online && status !== "PENDING" ? `seed_gw_${hex(16)}` : null,
        gatewayPayload: online && status !== "PENDING" ? { provider: "mock", event: "payment.succeeded" } : undefined,
        refundedAmount: money(refunded),
        paidAt: status === "PENDING" ? null : new Date(info.scheduled.getTime() - (online ? 2 * DAY : -5 * HOUR)),
        releasedAt: released,
      },
    })
  }
  // A failed first attempt on booking 1 (shows the retry path).
  await tx.payment.create({
    data: {
      id: id("payment", "1_failed"),
      bookingId: bookingId(1),
      method: "ONLINE",
      amount: money(bookingInfo.get(1)!.amount),
      status: "FAILED",
      gatewayRef: `seed_gw_${hex(16)}`,
      gatewayPayload: { provider: "mock", event: "payment.failed", reason: "card_declined" },
    },
  })
  for (const [i, m] of milestones.entries()) {
    if (m.status === "PENDING") continue
    await tx.payment.create({
      data: {
        id: id("payment", `10_${m.key}`),
        bookingId: bookingId(10),
        milestoneId: id("milestone", `10_${m.key}`),
        method: "ONLINE",
        amount: money(round2(b10.amount * m.share)),
        status: "PAID",
        escrowState: m.status === "RELEASED" ? "RELEASED" : "HELD",
        gatewayRef: `seed_gw_${hex(16)}`,
        gatewayPayload: { provider: "mock", event: "payment.succeeded" },
        paidAt: at(-10 + i * 6),
        releasedAt: m.status === "RELEASED" ? at(-6) : null,
      },
    })
  }

  // --- Chat -------------------------------------------------------------------
  for (const [i, m] of MESSAGES.entries()) {
    const info = bookingInfo.get(m.booking)!
    const base = BOOKINGS.find((b) => b.n === m.booking)!
    await tx.message.create({
      data: {
        id: id("message", i + 1),
        bookingId: bookingId(m.booking),
        senderId: m.from === "customer" ? customerId(info.customer) : providerId(info.provider),
        body: m.body,
        contactBlocked: m.blocked ?? false,
        createdAt: new Date(at(base.day - 1, 12).getTime() + m.minutesAfter * 60_000),
      },
    })
  }

  // --- Reviews (SY-05) --------------------------------------------------------
  for (const r of REVIEWS) {
    const info = bookingInfo.get(r.booking)!
    const createdAt = new Date(info.scheduled.getTime() + DAY)
    await tx.review.create({
      data: {
        id: id("review", `${r.booking}_customer`),
        bookingId: bookingId(r.booking),
        reviewerId: customerId(info.customer),
        revieweeId: providerId(info.provider),
        rating: r.rating,
        comment: r.comment,
        providerReply: r.reply ?? null,
        isHidden: r.hidden ?? false,
        createdAt,
      },
    })
    if (r.byProvider) {
      await tx.review.create({
        data: {
          id: id("review", `${r.booking}_provider`),
          bookingId: bookingId(r.booking),
          reviewerId: providerId(info.provider),
          revieweeId: customerId(info.customer),
          rating: r.byProvider.rating,
          comment: r.byProvider.comment,
          createdAt,
        },
      })
    }
  }

  // --- Disputes (CU-12 / AD-05) -----------------------------------------------
  await tx.dispute.create({
    data: {
      id: id("dispute", 12),
      bookingId: bookingId(12),
      openedById: customerId("3"),
      reason: "في سيراميكة مكسورة جنب الحوض، وميول الأرضية غلط والمية بتقف.",
      status: "UNDER_REVIEW",
      createdAt: at(-15),
    },
  })
  for (const n of [1, 2]) {
    await tx.file.create({
      data: {
        id: id("file", `dispute_12_${n}`),
        key: `seed/disputes/12/${n}.jpg`,
        mimeType: "image/jpeg",
        sizeBytes: 400_000 + Math.floor(rand() * 800_000),
        sha256: hex(64),
        uploadedById: customerId("3"),
        disputeId: id("dispute", 12),
      },
    })
  }
  await tx.dispute.create({
    data: {
      id: id("dispute", 13),
      bookingId: bookingId(13),
      openedById: customerId("5"),
      reason: "التكييف بيسرّب مية من الوحدة الداخلية بعد التركيب.",
      status: "RESOLVED",
      resolution: "PARTIAL_REFUND",
      refundAmount: money(300),
      resolutionNote: "المزود عدّل الميول بعد الشكوى، واتفقنا على استرداد جزء من المصنعية.",
      resolvedById: adminId,
      resolvedAt: at(-24),
      createdAt: at(-28),
    },
  })
  // An OPEN dispute too, so the queue shows every status: booking 7 (cash, closed later).
  await tx.dispute.create({
    data: {
      id: id("dispute", 7),
      bookingId: bookingId(7),
      openedById: customerId("2"),
      reason: "المزود طلب مبلغ زيادة عن السعر المتفق عليه.",
      status: "OPEN",
      createdAt: at(-1),
    },
  })

  // --- Invoices (SY-07) for finished bookings ---------------------------------
  let invoiceN = 1
  for (const b of BOOKINGS) {
    if (!DONE.has(b.status)) continue
    const info = bookingInfo.get(b.n)!
    await tx.invoice.create({
      data: {
        id: id("invoice", b.n),
        bookingId: bookingId(b.n),
        number: `INV-${year}-${String(invoiceN++).padStart(6, "0")}`,
        total: money(info.amount),
        issuedAt: new Date(info.scheduled.getTime() + 6 * HOUR),
      },
    })
  }

  // --- Payouts (PR-12 / AD-07) ------------------------------------------------
  await tx.payout.create({
    data: {
      id: id("payout", "1_paid"),
      providerId: providerId("3"),
      amount: money(1500),
      status: "PAID",
      destinationType: "WALLET",
      destinationRef: "Vodafone Cash ••••5678",
      processedById: adminId,
      processedAt: at(-7),
      createdAt: at(-9),
    },
  })
  await tx.payout.create({
    data: {
      id: id("payout", "2_requested"),
      providerId: providerId("10"),
      amount: money(5000),
      status: "REQUESTED",
      destinationType: "BANK",
      destinationRef: "CIB ••••4421",
      createdAt: at(-1),
    },
  })
  await tx.payout.create({
    data: {
      id: id("payout", "3_approved"),
      providerId: providerId("5"),
      amount: money(400),
      status: "APPROVED",
      destinationType: "WALLET",
      destinationRef: "InstaPay ••••0912",
      processedById: adminId,
      processedAt: at(0, 8),
      createdAt: at(-2),
    },
  })
  await tx.payout.create({
    data: {
      id: id("payout", "4_rejected"),
      providerId: providerId("2"),
      amount: money(3000),
      status: "REJECTED",
      destinationType: "BANK",
      destinationRef: "NBE ••••7730",
      processedById: adminId,
      processedAt: at(-3),
      rejectionReason: "المبلغ أكبر من الرصيد المتاح بعد خصم عمولة الشغل الكاش.",
      createdAt: at(-4),
    },
  })

  // --- Wallet ledger (PR-11): balance = SUM(amount) per provider --------------
  const wallet: Prisma.WalletTransactionCreateManyInput[] = []
  for (const b of BOOKINGS) {
    const info = bookingInfo.get(b.n)!
    if (b.n === 10) continue
    if (b.method === "ONLINE" && DONE.has(b.status)) {
      wallet.push({ id: id("wallet", `${b.n}_earning`), providerId: providerId(b.provider), bookingId: bookingId(b.n), type: "EARNING", amount: money(info.net), note: `صافي الحجز ${bookingNumber(b.n)}`, createdAt: new Date(info.scheduled.getTime() + 6 * HOUR) })
    }
    if (b.method === "CASH" && DONE.has(b.status)) {
      wallet.push({ id: id("wallet", `${b.n}_commission`), providerId: providerId(b.provider), bookingId: bookingId(b.n), type: "COMMISSION_DEBT", amount: money(-info.commission), note: `عمولة حجز كاش ${bookingNumber(b.n)}`, createdAt: new Date(info.scheduled.getTime() + 6 * HOUR) })
    }
  }
  const m1 = milestones[0]
  wallet.push({ id: id("wallet", "10_m1_earning"), providerId: providerId("2"), bookingId: bookingId(10), type: "EARNING", amount: money(round2(b10.amount * m1.share * (1 - rateFor("electrical-wiring") / 100))), note: `مرحلة: ${m1.title}`, createdAt: at(-6) })
  wallet.push({ id: id("wallet", "13_clawback"), providerId: providerId("5"), bookingId: bookingId(13), type: "REFUND_CLAWBACK", amount: money(-300), note: "استرداد جزئي بعد حل النزاع", createdAt: at(-24) })
  wallet.push({ id: id("wallet", "3_payout"), providerId: providerId("3"), payoutId: id("payout", "1_paid"), type: "PAYOUT", amount: money(-1500), note: "سحب أرباح", createdAt: at(-7) })
  wallet.push({ id: id("wallet", "4_adjustment"), providerId: providerId("4"), type: "ADJUSTMENT", amount: money(150), note: "تعويض فرق عمولة (تصحيح يدوي)", createdAt: at(-12) })
  await tx.walletTransaction.createMany({ data: wallet })

  // --- Denormalised provider counters (same values the services keep updated) -
  for (const p of PROVIDERS) {
    const uid = providerId(p.key)
    const agg = await tx.review.aggregate({ where: { revieweeId: uid, isHidden: false }, _avg: { rating: true }, _count: true })
    const completed = await tx.booking.count({ where: { providerId: uid, status: { in: ["COMPLETED", "CLOSED"] } } })
    await tx.providerProfile.update({
      where: { userId: uid },
      data: { ratingAvg: money(agg._avg.rating ?? 0), ratingCount: agg._count, completedCount: completed },
    })
  }

  // --- Notifications (SY-02) --------------------------------------------------
  const notifications: Prisma.NotificationCreateManyInput[] = [
    { userId: customerId("1"), type: "QUOTE_RECEIVED", title: "وصلك عرض سعر جديد", body: "عماد فؤاد بعت عرض على «دهان شقة 3 أوض وصالة».", payload: { requestId: id("request", "1") }, createdAt: at(-1, 15) },
    { userId: customerId("1"), type: "QUOTE_RECEIVED", title: "وصلك عرض سعر جديد", body: "سامح النقاش بعت عرض على «دهان شقة 3 أوض وصالة».", payload: { requestId: id("request", "1") }, createdAt: at(-1, 16), readAt: at(-1, 18) },
    { userId: customerId("1"), type: "PAYMENT_UPDATE", title: "الدفع ما تمّش", body: "جرّب تاني لحجز تسليك المواسير.", payload: { bookingId: bookingId(1) }, createdAt: at(0, 7) },
    { userId: customerId("5"), type: "BOOKING_STATUS_CHANGED", title: "المزود خلّص الشغل", body: "أكّد إتمام تركيب السخان خلال 48 ساعة.", payload: { bookingId: bookingId(5) }, createdAt: at(-1, 14) },
    { userId: customerId("3"), type: "DISPUTE_UPDATE", title: "النزاع قيد المراجعة", body: "فريق الدعم بيراجع الصور والمحادثات.", payload: { bookingId: bookingId(12) }, createdAt: at(-14) },
    { userId: providerId("1"), type: "NEW_REQUEST_MATCH", title: "طلب جديد في منطقتك", body: "«تغيير مواسير الحمام بالكامل» في مصر الجديدة.", payload: { requestId: id("request", "3") }, createdAt: at(-1, 9) },
    { userId: providerId("3"), type: "BOOKING_CREATED", title: "حجز جديد مستني موافقتك", body: "تنظيف شقة لحد 120 متر — التجمع الخامس.", payload: { bookingId: bookingId(2) }, createdAt: at(-1, 10) },
    { userId: providerId("3"), type: "PAYOUT_UPDATE", title: "تم تحويل أرباحك", body: "اتحوّل 1500 ج.م على محفظتك.", payload: { payoutId: id("payout", "1_paid") }, createdAt: at(-7), readAt: at(-7, 12) },
    { userId: providerId("6"), type: "PROVIDER_DECISION", title: "طلب التوثيق وصلنا", body: "هنراجع مستنداتك خلال يومين شغل.", createdAt: at(-3) },
    { userId: providerId("7"), type: "PROVIDER_DECISION", title: "طلب التوثيق اترفض", body: "صورة البطاقة مش واضحة. ارفع صورة واضحة للوشين.", createdAt: at(-55) },
    { userId: providerId("2"), type: "REVIEW_RECEIVED", title: "وصلك تقييم جديد", body: "منى عبد الله قيّمتك 4 نجوم.", payload: { bookingId: bookingId(7) }, createdAt: at(-19) },
    { userId: adminId, type: "SYSTEM", title: "نزاع جديد مفتوح", body: `الحجز ${bookingNumber(7)}`, payload: { bookingId: bookingId(7) }, createdAt: at(-1) },
  ]
  await tx.notification.createMany({ data: notifications.map((n, i) => ({ ...n, id: id("notification", i + 1) })) })

  // --- Audit log (AD-11 / NF-12) ----------------------------------------------
  const audit: Prisma.AuditLogCreateManyInput[] = [
    ...PROVIDERS.filter((p) => p.status === "APPROVED").map((p) => ({ actorId: adminId, action: "provider.approve", entityType: "ProviderProfile", entityId: providerId(p.key), createdAt: at(-60 + Number(p.key)) })),
    { actorId: adminId, action: "provider.reject", entityType: "ProviderProfile", entityId: providerId("7"), metadata: { reason: "صورة البطاقة مش واضحة." }, createdAt: at(-53) },
    { actorId: adminId, action: "provider.suspend", entityType: "ProviderProfile", entityId: providerId("8"), metadata: { reason: "شكاوى متكررة من التأخير." }, createdAt: at(-35) },
    { actorId: adminId, action: "user.suspend", entityType: "User", entityId: customerId("6"), metadata: { reason: "محاولة تبادل أرقام قبل الحجز." }, createdAt: at(-8) },
    { actorId: adminId, action: "dispute.resolve", entityType: "Dispute", entityId: id("dispute", 13), metadata: { resolution: "PARTIAL_REFUND", refundAmount: 300 }, createdAt: at(-24) },
    { actorId: adminId, action: "payout.paid", entityType: "Payout", entityId: id("payout", "1_paid"), metadata: { amount: 1500 }, createdAt: at(-7) },
    { actorId: adminId, action: "payout.approve", entityType: "Payout", entityId: id("payout", "3_approved"), metadata: { amount: 400 }, createdAt: at(0, 8) },
    { actorId: adminId, action: "payout.reject", entityType: "Payout", entityId: id("payout", "4_rejected"), metadata: { amount: 3000 }, createdAt: at(-3) },
    { actorId: adminId, action: "wallet.adjust", entityType: "WalletTransaction", entityId: id("wallet", "4_adjustment"), metadata: { amount: 150 }, createdAt: at(-12) },
    { actorId: adminId, action: "review.hide", entityType: "Review", entityId: id("review", "13_customer"), createdAt: at(-26) },
    { actorId: null, action: "payment.webhook", entityType: "Payment", entityId: id("payment", 6), metadata: { event: "payment.succeeded" }, createdAt: at(-12) },
  ]
  await tx.auditLog.createMany({ data: audit.map((a, i) => ({ ...a, id: id("audit", i + 1) })) })

  return {
    users: 1 + CUSTOMERS.length + PROVIDERS.length,
    services: SERVICES.length,
    requests: REQUESTS.length,
    quotes: QUOTES.length,
    bookings: BOOKINGS.length,
    messages: MESSAGES.length,
    wallet: wallet.length,
  }
}

// ----------------------------------------------------------------------------
// Entry point
// ----------------------------------------------------------------------------

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed mock data with NODE_ENV=production.")
  }

  if (RESET_ONLY) {
    await db.$transaction((tx) => deleteMockData(tx), { timeout: 60_000 })
    console.log("[seed] mock data removed (reference data kept)")
    return
  }

  await seedReferenceData()
  // One transaction: a failure leaves the previous mock data intact, never half a dataset.
  const counts = await db.$transaction(
    async (tx) => {
      await deleteMockData(tx)
      return seedMockData(tx)
    },
    { timeout: 120_000, maxWait: 10_000 }
  )
  console.log("[seed] mock data:", counts)
}

main()
  .catch((error) => {
    console.error("[seed] failed", error)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
