import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AlertTriangle, ArrowLeft, CalendarCheck, CheckCircle2, ClipboardList, Info, Plus, Wallet } from "lucide-react"
import { ChatBlockedNotice, ChatBubble } from "@/components/chat/ChatBubble"
import { FormDemos, LoadingButtonDemo, NavigationDemos, OverlayDemos } from "@/components/design-system/InteractiveDemos"
import { Demo, Section, ThemePair } from "@/components/design-system/Section"
import { TokenSwatches } from "@/components/design-system/TokenSwatches"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { ProviderCard } from "@/components/provider/ProviderCard"
import { VerificationBanner } from "@/components/provider/VerificationBanner"
import { QuoteCard } from "@/components/request/QuoteCard"
import { ServiceCard } from "@/components/service/ServiceCard"
import {
  BookingTimeline,
  EmptyState,
  Ltr,
  PageHeader,
  PriceTag,
  RatingStars,
  StatCard,
  StatusBadge,
  VerificationBadge,
  VerifiedBadge,
} from "@/components/shared"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SITE_NAME } from "@/constants/site"
import { VERIFICATION_STATUSES, WORK_STATUSES } from "@/constants/status"
import { getCurrentUser } from "@/services/auth.service"
import { formatDateTime, formatPhone, formatPrice } from "@/utils/format"

/**
 * Living style guide (docs/DESIGN-SYSTEM.md §12). Every token, type style,
 * component variant and domain component in its states, in light and dark.
 * When you change a token or component, check this page.
 *
 * Not a public page: `noindex`, never in the sitemap, open in development
 * and admin-only in production (404 for everyone else — proxy layer 1 +
 * this check as layer 2).
 */
export const metadata: Metadata = {
  title: "نظام التصميم",
  robots: { index: false, follow: false },
}

const TOC = [
  { id: "colors", label: "الألوان" },
  { id: "type", label: "الخطوط" },
  { id: "shape", label: "المسافات والحواف" },
  { id: "buttons", label: "الأزرار" },
  { id: "badges", label: "الحالات" },
  { id: "forms", label: "النماذج" },
  { id: "overlays", label: "النوافذ" },
  { id: "navigation", label: "التنقل" },
  { id: "feedback", label: "التنبيهات والتحميل" },
  { id: "data", label: "الجداول والأرقام" },
  { id: "domain", label: "مكونات المنصة" },
  { id: "rtl", label: "اختبار RTL" },
]

const LONG_AR =
  "تركيب وصيانة جميع أنواع السخانات الكهربائية والغاز مع ضمان على قطع الغيار لمدة ستة شهور وفحص شامل للتوصيلات قبل التشغيل"

const NOW = new Date("2026-10-31T10:30:00")

export default async function DesignSystemPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    const user = await getCurrentUser()
    if (user?.role !== "ADMIN") notFound()
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-6">
          <Link href="/" className="font-heading text-lg font-semibold">
            {SITE_NAME}
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-muted-foreground">نظام التصميم</span>
          <div className="ms-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 md:px-6 lg:grid-cols-[13rem_1fr]">
        <aside className="hidden lg:block">
          <nav aria-label="أقسام نظام التصميم" className="sticky top-20 flex flex-col py-12">
            {TOC.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                {t.label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="space-y-3 pt-12">
            <h1 className="text-4xl font-bold md:text-5xl">نظام التصميم</h1>
            <p className="max-w-prose text-lg text-muted-foreground">
              هادي، دقيقة، وموثوقة. أزرق بترولي للإجراءات العادية، ولون كهرماني واحد بس للحظات الالتزام: الحجز، قبول العرض، الدفع،
              وسحب الأرباح — ونجوم التقييم.
            </p>
          </div>

          <Section id="colors" title="الألوان" description="توكنز دلالية فقط. ممنوع hex أو ألوان Tailwind المباشرة في كود الميزات.">
            <ThemePair>
              <TokenSwatches />
            </ThemePair>
          </Section>

          <Section id="type" title="الخطوط" description="Readex Pro للعناوين، IBM Plex Sans Arabic للنص. أقل حجم للنص 16px، وبدون letter-spacing على العربي.">
            <Card className="gap-6 px-4 md:px-6">
              <p className="text-4xl font-bold md:text-6xl">عرض — صيانة بيتك</p>
              <h1 className="text-3xl font-semibold md:text-4xl">عنوان 1 — تفاصيل الحجز</h1>
              <h2 className="text-2xl font-semibold md:text-3xl">عنوان 2 — العروض اللي وصلت</h2>
              <h3 className="text-xl font-semibold">عنوان 3 — مزود الخدمة</h3>
              <p className="max-w-prose">
                نص أساسي — اوصف الشغلانة بالتفصيل وضيف صور، وهيوصلك عروض أسعار من مزودين موثّقين في منطقتك خلال ساعات.
              </p>
              <p className="text-sm text-muted-foreground">صغير / معلومات — آخر تحديث من ساعتين</p>
              <p className="text-xs">تعليق — 12px وده أصغر حجم مسموح</p>
              <p className="tabular-nums">
                أرقام لاتينية دايمًا: {formatPrice(1250)} · {formatDateTime(NOW)} · <Ltr>{formatPhone("01012345678")}</Ltr>
              </p>
            </Card>
          </Section>

          <Section id="shape" title="المسافات والحواف والظلال" description="وحدة 4px. الحواف حسب المستوى. الظلال للعناصر العائمة بس.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { c: "rounded-md", l: "الأدوات — rounded-md" },
                { c: "rounded-lg", l: "الكروت — rounded-lg" },
                { c: "rounded-xl", l: "النوافذ — rounded-xl" },
                { c: "rounded-full", l: "الصور الشخصية — rounded-full" },
              ].map((r) => (
                <div key={r.c} className="space-y-2">
                  <div className={`h-20 border-2 border-primary bg-card ${r.c}`} />
                  <p className="text-sm text-muted-foreground">{r.l}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-5">
                <p className="font-medium">كارت في قائمة</p>
                <p className="text-sm text-muted-foreground">حدود 1px وخلفية — بدون ظل.</p>
              </div>
              <div className="rounded-lg border bg-popover p-5 shadow-md">
                <p className="font-medium">عنصر عائم</p>
                <p className="text-sm text-muted-foreground">قوائم، نوافذ، شريط ثابت — shadow-md.</p>
              </div>
            </div>
          </Section>

          <Section id="buttons" title="الأزرار" description="الارتفاع: sm ‏36px (جداول الإدارة بس)، default ‏44px، lg ‏52px. زرار commit واحد بس في الشاشة.">
            <Demo title="الأنواع">
              <Button>احفظ التغييرات</Button>
              <Button variant="commit">احجز الآن</Button>
              <Button variant="secondary">ضيف للمفضلة</Button>
              <Button variant="outline">تراجع</Button>
              <Button variant="ghost">تجاهل</Button>
              <Button variant="destructive">ألغِ الحجز</Button>
              <Button variant="link">اعرف أكتر</Button>
            </Demo>
            <Demo title="الأحجام والأيقونات">
              <Button size="sm">صغير</Button>
              <Button>عادي</Button>
              <Button size="lg">كبير</Button>
              <Button>
                <Plus data-icon="inline-start" aria-hidden />
                ضيف خدمة
              </Button>
              <Button variant="outline">
                التالي
                <ArrowLeft data-icon="inline-end" aria-hidden />
              </Button>
              <Button size="icon" variant="outline" aria-label="ضيف">
                <Plus />
              </Button>
            </Demo>
            <Demo title="الحالات">
              <LoadingButtonDemo />
              <Button loading>جارٍ الحفظ</Button>
              <Button disabled>غير متاح</Button>
              <Button variant="commit" loading>
                اقبل العرض
              </Button>
            </Demo>
            <ThemePair>
              <div className="flex flex-wrap gap-2">
                <Button>أساسي</Button>
                <Button variant="commit">أكّد إتمام الشغل</Button>
                <Button variant="outline">تراجع</Button>
                <Button variant="destructive">احذف</Button>
              </div>
            </ThemePair>
          </Section>

          <Section id="badges" title="الحالات والشارات" description="الحالة دايمًا أيقونة + كلمة، مش لون بس.">
            <Demo title="مراحل الطلب والحجز">
              {WORK_STATUSES.map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </Demo>
            <Demo title="توثيق المزود">
              {VERIFICATION_STATUSES.map((s) => (
                <VerificationBadge key={s} status={s} />
              ))}
              <VerifiedBadge />
            </Demo>
            <Demo title="أنواع Badge">
              <Badge>أساسي</Badge>
              <Badge variant="secondary">ثانوي</Badge>
              <Badge variant="outline">بحدود</Badge>
              <Badge variant="neutral">محايد</Badge>
              <Badge variant="info">معلومة</Badge>
              <Badge variant="success">نجاح</Badge>
              <Badge variant="warning">تنبيه</Badge>
              <Badge variant="destructive">خطر</Badge>
            </Demo>
          </Section>

          <Section id="forms" title="النماذج" description="العنوان فوق الحقل دايمًا. رسالة الخطأ بتشرح الحل.">
            <FormDemos />
          </Section>

          <Section id="overlays" title="النوافذ والقوائم">
            <OverlayDemos />
          </Section>

          <Section id="navigation" title="التنقل" description="الأيقونات الاتجاهية بتنعكس في RTL.">
            <Demo title="Breadcrumb">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link href="/" />}>الرئيسية</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link href="/services" />}>الخدمات</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>سباكة</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </Demo>
            <Demo title="Pagination — روابط حقيقية .../page/[page]">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      2
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </Demo>
            <Demo title="Accordion" className="block">
              <Accordion>
                <AccordionItem value="a">
                  <AccordionTrigger>إمتى المزود بياخد فلوسه؟</AccordionTrigger>
                  <AccordionContent>بعد ما تأكد إتمام الشغل، أو بعد انتهاء مدة الاعتراض.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="b">
                  <AccordionTrigger>أقدر ألغي الحجز؟</AccordionTrigger>
                  <AccordionContent>أيوه، قبل ما المزود يبدأ الشغل.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </Demo>
            <NavigationDemos />
          </Section>

          <Section id="feedback" title="التنبيهات والتحميل" description="التحميل بـ Skeleton بنفس شكل المحتوى، مش spinner.">
            <div className="grid gap-4 lg:grid-cols-2">
              <Alert variant="info">
                <Info aria-hidden />
                <AlertTitle>معلومة</AlertTitle>
                <AlertDescription>هيوصلك إشعار أول ما مزود يبعت عرض سعر.</AlertDescription>
              </Alert>
              <Alert variant="success">
                <CheckCircle2 aria-hidden />
                <AlertTitle>تم الحجز</AlertTitle>
                <AlertDescription>الميعاد يوم السبت الساعة 10 الصبح.</AlertDescription>
              </Alert>
              <Alert variant="warning">
                <AlertTriangle aria-hidden />
                <AlertTitle>الطلب قرّب ينتهي</AlertTitle>
                <AlertDescription>لو ما اخترتش عرض خلال يومين، الطلب هينتهي.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTriangle aria-hidden />
                <AlertTitle>الدفع ما تمّش</AlertTitle>
                <AlertDescription>اتأكد من بيانات الكارت وجرّب تاني.</AlertDescription>
              </Alert>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="gap-3 px-4">
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </Card>
              <EmptyState
                icon={ClipboardList}
                title="لسه ما فيش طلبات"
                description="اطلب عرض سعر لأول مشروع."
                action={<Button variant="outline">اطلب عرض سعر</Button>}
                className="lg:col-span-2"
              />
            </div>
            <Demo title="Spinner (للأزرار والعمليات القصيرة بس)">
              <Spinner />
              <span className="text-muted-foreground">جارٍ الإرسال…</span>
            </Demo>
          </Section>

          <Section id="data" title="الجداول والأرقام">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="حجوزات الشهر" value="128" icon={CalendarCheck} change={12} hint="عن الشهر اللي فات" />
              <StatCard label="الأرباح" value={formatPrice(18450)} icon={Wallet} change={-4} />
              <StatCard label="طلبات مفتوحة" value="23" icon={ClipboardList} />
              <StatCard label="التقييم" value="4.8" hint="من 312 تقييم" />
            </div>
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الحجز</TableHead>
                    <TableHead>الخدمة</TableHead>
                    <TableHead>الميعاد</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(
                    [
                      ["BK-1042", "تركيب سخان", "PAID", 650],
                      ["BK-1041", "تسليك مواسير", "IN_PROGRESS", 300],
                      ["BK-1039", "تنظيف شقة 120م", "COMPLETED", 1200],
                      ["BK-1037", "دهان أوضة", "DISPUTED", 2400],
                    ] as const
                  ).map(([id, s, st, p]) => (
                    <TableRow key={id}>
                      <TableCell>
                        <Ltr className="font-mono">{id}</Ltr>
                      </TableCell>
                      <TableCell>{s}</TableCell>
                      <TableCell className="tabular-nums">{formatDateTime(NOW)}</TableCell>
                      <TableCell className="tabular-nums">{formatPrice(p)}</TableCell>
                      <TableCell>
                        <StatusBadge status={st} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Section>

          <Section id="domain" title="مكونات المنصة" description="مكونات عرض بس، بتاخد DTOs كـ props ومن غير أي جلب بيانات.">
            <PageHeader
              title="PageHeader — طلباتي"
              description="العنوان، وصف قصير، والإجراء الأساسي في الآخر."
              actions={<Button>اطلب عرض سعر</Button>}
              className="rounded-lg border bg-card p-4"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ServiceCard
                service={{
                  href: "#",
                  title: "تركيب سخان غاز",
                  providerName: "محمود للسباكة",
                  price: 450,
                  rating: 4.7,
                  reviewsCount: 86,
                  duration: "ساعتين",
                }}
              />
              <ServiceCard
                service={{ href: "#", title: LONG_AR, providerName: "شركة النور للصيانة والتشطيبات المتكاملة", price: 12500, priceKind: "from" }}
              />
              <ProviderCard
                provider={{
                  href: "#",
                  name: "محمود عبد الرحمن",
                  specialties: ["سباكة", "سخانات"],
                  rating: 4.8,
                  reviewsCount: 124,
                  jobsCount: 310,
                  areas: ["مدينة نصر", "مصر الجديدة", "التجمع"],
                  verified: true,
                }}
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <QuoteCard
                selected
                quote={{
                  providerName: "أحمد للكهرباء",
                  price: 3200,
                  duration: "3 أيام",
                  rating: 4.9,
                  reviewsCount: 58,
                  message: "هغيّر الأسلاك كلها في المطبخ والصالة وأركّب لوحة جديدة، والسعر شامل الخامات.",
                  verified: true,
                }}
                action={<Button variant="commit">اقبل العرض</Button>}
              />
              <QuoteCard
                quote={{
                  providerName: "كريم إلكتريك",
                  price: 2750,
                  duration: "5 أيام",
                  rating: 4.4,
                  reviewsCount: 21,
                  message: "السعر من غير الخامات، ممكن أعدّي أعاين الأول.",
                }}
                action={<Button variant="outline">اختار العرض ده</Button>}
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Demo title="PriceTag · RatingStars" className="flex-col items-start">
                <PriceTag amount={350} kind="fixed" />
                <PriceTag amount={12500} kind="from" size="lg" />
                <RatingStars value={4.6} count={128} size="md" />
                <RatingStars value={2} />
              </Demo>
              <Demo title="BookingTimeline — المسار العادي" className="block">
                <BookingTimeline
                  current="IN_PROGRESS"
                  events={[
                    { status: "OPEN", at: formatDateTime(NOW) },
                    { status: "ACCEPTED", at: formatDateTime(NOW) },
                    { status: "PAID", at: formatDateTime(NOW), note: "المبلغ محجوز لحد ما تأكد الإتمام" },
                    { status: "IN_PROGRESS", at: formatDateTime(NOW) },
                  ]}
                />
              </Demo>
              <Demo title="BookingTimeline — نزاع" className="block">
                <BookingTimeline
                  current="DISPUTED"
                  events={[
                    { status: "OPEN", at: formatDateTime(NOW) },
                    { status: "ACCEPTED", at: formatDateTime(NOW) },
                    { status: "PAID", at: formatDateTime(NOW) },
                    { status: "DISPUTED", at: formatDateTime(NOW), note: "الشغل ما خلصش زي ما اتفقنا" },
                  ]}
                />
              </Demo>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Demo title="ChatThread" className="block">
                <ScrollArea className="h-72">
                  <div className="flex flex-col gap-3 p-1">
                    <ChatBubble body="السلام عليكم، ممكن تيجي بكرة الساعة 10؟" at="9:41 ص" mine state="read" />
                    <ChatBubble body="وعليكم السلام، تمام، هكون عندك في الميعاد." at="9:43 ص" />
                    <ChatBlockedNotice />
                    <ChatBubble body="تمام، مستنيك" at="9:45 ص" mine state="sending" />
                  </div>
                </ScrollArea>
              </Demo>
              <div className="space-y-4">
                <Demo title="VerificationBanner" className="block p-0">
                  <VerificationBanner status="PENDING" />
                  <VerificationBanner status="REJECTED" />
                </Demo>
                <Demo title="Avatar">
                  <Avatar className="size-14">
                    <AvatarFallback className="text-lg">م</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>أ</AvatarFallback>
                  </Avatar>
                </Demo>
              </div>
            </div>
          </Section>

          <Section id="rtl" title="اختبار RTL" description="نص عربي طويل، وكلمة لاتينية جوه جملة عربية، وأرقام وتليفونات LTR.">
            <Card className="gap-4 px-4 md:px-6">
              <p className="max-w-prose">{LONG_AR}</p>
              <p>
                حجزك رقم <Ltr className="font-mono">BK-1042</Ltr> مع شركة <Ltr>Cool Air</Ltr> اتأكد، وهيكلمك على{" "}
                <Ltr>{formatPhone("01012345678")}</Ltr> بعد تأكيد الحجز.
              </p>
              <p>
                الإجمالي <span className="font-semibold tabular-nums">{formatPrice(1250.5)}</span> شامل العمولة (<Ltr>10%</Ltr>).
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">
                  <ArrowLeft data-icon="inline-start" className="rtl:-scale-x-100" aria-hidden />
                  رجوع
                </Button>
                <Button variant="outline">
                  التالي
                  <ArrowLeft data-icon="inline-end" aria-hidden />
                </Button>
              </div>
            </Card>
          </Section>
        </main>
      </div>
    </div>
  )
}
