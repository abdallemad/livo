import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarCheck, CheckCircle2, ClipboardList, Info, Plus, Wallet } from "lucide-react"
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
  title: "Design system",
  robots: { index: false, follow: false },
}

const TOC = [
  { id: "colors", label: "Colors" },
  { id: "type", label: "Typography" },
  { id: "shape", label: "Spacing and radius" },
  { id: "buttons", label: "Buttons" },
  { id: "badges", label: "States" },
  { id: "forms", label: "Forms" },
  { id: "overlays", label: "Overlays" },
  { id: "navigation", label: "Navigation" },
  { id: "feedback", label: "Alerts and loading" },
  { id: "data", label: "Tables and numbers" },
  { id: "domain", label: "Platform components" },
  { id: "direction", label: "Direction test" },
]

const LONG_TEXT =
  "Installation and maintenance of all electric and gas water heaters, with a six-month warranty on spare parts and a full check of the connections before switching on"

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
          <span className="text-muted-foreground">Design system</span>
          <div className="ms-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 md:px-6 lg:grid-cols-[13rem_1fr]">
        <aside className="hidden lg:block">
          <nav aria-label="Design system sections" className="sticky top-20 flex flex-col py-12">
            {TOC.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                {t.label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="space-y-3 pt-12">
            <h1 className="text-4xl font-bold md:text-5xl">Design system</h1>
            <p className="max-w-prose text-lg text-muted-foreground">
              Calm, precise, and trustworthy. Petrol blue for everyday actions, and a single amber for commitment moments: booking, accepting a quote, payment,
              and payouts — plus rating stars.
            </p>
          </div>

          <Section id="colors" title="Colors" description="Semantic tokens only. No hex values or raw Tailwind colors in feature code.">
            <ThemePair>
              <TokenSwatches />
            </ThemePair>
          </Section>

          <Section id="type" title="Typography" description="Readex Pro for headings, IBM Plex Sans for body text. Body text is at least 16px.">
            <Card className="gap-6 px-4 md:px-6">
              <p className="text-4xl font-bold md:text-6xl">Quote — Home maintenance</p>
              <h1 className="text-3xl font-semibold md:text-4xl">Title 1 — Booking details</h1>
              <h2 className="text-2xl font-semibold md:text-3xl">Title 2 — Quotes received</h2>
              <h3 className="text-xl font-semibold">Title 3 — Provider</h3>
              <p className="max-w-prose">
                Primary text — Describe the job in detail and add photos, and you’ll get quotes from verified providers in your area within hours.
              </p>
              <p className="text-sm text-muted-foreground">Small / info — Updated 2 hours ago</p>
              <p className="text-xs">Comment — 12px, the smallest size allowed</p>
              <p className="tabular-nums">
                Always Western digits: {formatPrice(1250)} · {formatDateTime(NOW)} · <Ltr>{formatPhone("01012345678")}</Ltr>
              </p>
            </Card>
          </Section>

          <Section id="shape" title="Spacing, radius, and shadows" description="Unit 4px. Radius by level. Shadows for floating elements only.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { c: "rounded-md", l: "Tools — rounded-md" },
                { c: "rounded-lg", l: "Cards — rounded-lg" },
                { c: "rounded-xl", l: "Overlays — rounded-xl" },
                { c: "rounded-full", l: "Avatars — rounded-full" },
              ].map((r) => (
                <div key={r.c} className="space-y-2">
                  <div className={`h-20 border-2 border-primary bg-card ${r.c}`} />
                  <p className="text-sm text-muted-foreground">{r.l}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-5">
                <p className="font-medium">Card in a list</p>
                <p className="text-sm text-muted-foreground">1px border and background — no shadow.</p>
              </div>
              <div className="rounded-lg border bg-popover p-5 shadow-md">
                <p className="font-medium">Floating element</p>
                <p className="text-sm text-muted-foreground">Menus, dialogs, sticky bar — shadow-md.</p>
              </div>
            </div>
          </Section>

          <Section id="buttons" title="Buttons" description="Height: sm 36px (admin tables only), default 44px, lg 52px. Only one commit button per screen.">
            <Demo title="Types">
              <Button>Save changes</Button>
              <Button variant="commit">Book now</Button>
              <Button variant="secondary">Add to favorites</Button>
              <Button variant="outline">Undo</Button>
              <Button variant="ghost">Dismiss</Button>
              <Button variant="destructive">Cancel booking</Button>
              <Button variant="link">Learn more</Button>
            </Demo>
            <Demo title="Sizes and icons">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button>
                <Plus data-icon="inline-start" aria-hidden />
                Add a service
              </Button>
              <Button variant="outline">
                Next
                <ArrowRight data-icon="inline-end" aria-hidden />
              </Button>
              <Button size="icon" variant="outline" aria-label="Add">
                <Plus />
              </Button>
            </Demo>
            <Demo title="States">
              <LoadingButtonDemo />
              <Button loading>Saving</Button>
              <Button disabled>Unavailable</Button>
              <Button variant="commit" loading>
                Accept quote
              </Button>
            </Demo>
            <ThemePair>
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="commit">Confirm the job is done</Button>
                <Button variant="outline">Undo</Button>
                <Button variant="destructive">Delete</Button>
              </div>
            </ThemePair>
          </Section>

          <Section id="badges" title="Statuses and badges" description="Status is always an icon + a word, not just a color.">
            <Demo title="Request and booking stages">
              {WORK_STATUSES.map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </Demo>
            <Demo title="Provider verification">
              {VERIFICATION_STATUSES.map((s) => (
                <VerificationBadge key={s} status={s} />
              ))}
              <VerifiedBadge />
            </Demo>
            <Demo title="Badge variants">
              <Badge>Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Danger</Badge>
            </Demo>
          </Section>

          <Section id="forms" title="Forms" description="The label always sits above the field. The error message explains the fix.">
            <FormDemos />
          </Section>

          <Section id="overlays" title="Overlays and menus">
            <OverlayDemos />
          </Section>

          <Section id="navigation" title="Navigation" description="Directional icons point the way the reading direction flows.">
            <Demo title="Breadcrumb">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link href="/services" />}>Services</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Plumbing</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </Demo>
            <Demo title="Pagination — real links .../page/[page]">
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
                  <AccordionTrigger>When does the provider get paid?</AccordionTrigger>
                  <AccordionContent>After you confirm the job is done, or once the objection window ends.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="b">
                  <AccordionTrigger>Can I cancel a booking?</AccordionTrigger>
                  <AccordionContent>Yes, before the provider starts the job.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </Demo>
            <NavigationDemos />
          </Section>

          <Section id="feedback" title="Alerts and loading" description="Load with a Skeleton in the shape of the content, not a spinner.">
            <div className="grid gap-4 lg:grid-cols-2">
              <Alert variant="info">
                <Info aria-hidden />
                <AlertTitle>Info</AlertTitle>
                <AlertDescription>You’ll get a notification as soon as a provider sends a quote.</AlertDescription>
              </Alert>
              <Alert variant="success">
                <CheckCircle2 aria-hidden />
                <AlertTitle>Booked</AlertTitle>
                <AlertDescription>The appointment is Saturday at 10 AM.</AlertDescription>
              </Alert>
              <Alert variant="warning">
                <AlertTriangle aria-hidden />
                <AlertTitle>Request is about to expire</AlertTitle>
                <AlertDescription>If you don’t choose a quote within two days, the request will expire.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTriangle aria-hidden />
                <AlertTitle>Payment failed</AlertTitle>
                <AlertDescription>Check your card details and try again.</AlertDescription>
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
                title="No requests yet"
                description="Request a quote for your first project."
                action={<Button variant="outline">Request a quote</Button>}
                className="lg:col-span-2"
              />
            </div>
            <Demo title="Spinner (buttons and short operations only)">
              <Spinner />
              <span className="text-muted-foreground">Sending…</span>
            </Demo>
          </Section>

          <Section id="data" title="Tables and numbers">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Bookings this month" value="128" icon={CalendarCheck} change={12} hint="vs. last month" />
              <StatCard label="Earnings" value={formatPrice(18450)} icon={Wallet} change={-4} />
              <StatCard label="Open requests" value="23" icon={ClipboardList} />
              <StatCard label="Rating" value="4.8" hint="from 312 reviews" />
            </div>
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking number</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(
                    [
                      ["BK-1042", "Water heater installation", "PAID", 650],
                      ["BK-1041", "Pipe unclogging", "IN_PROGRESS", 300],
                      ["BK-1039", "Clean a 120 m² apartment", "COMPLETED", 1200],
                      ["BK-1037", "Paint a room", "DISPUTED", 2400],
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

          <Section id="domain" title="Platform components" description="Presentational only: they take DTOs as props and never fetch data.">
            <PageHeader
              title="PageHeader — My requests"
              description="Title, a short description, and the primary action at the end."
              actions={<Button>Request a quote</Button>}
              className="rounded-lg border bg-card p-4"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ServiceCard
                service={{
                  href: "#",
                  title: "Gas water heater installation",
                  providerName: "Mahmoud Plumbing",
                  price: 450,
                  rating: 4.7,
                  reviewsCount: 86,
                  duration: "2 hours",
                }}
              />
              <ServiceCard
                service={{ href: "#", title: LONG_TEXT, providerName: "Al Nour Integrated Maintenance & Finishing Co.", price: 12500, priceKind: "from" }}
              />
              <ProviderCard
                provider={{
                  href: "#",
                  name: "Mahmoud Abdelrahman",
                  specialties: ["Plumbing", "Water heaters"],
                  rating: 4.8,
                  reviewsCount: 124,
                  jobsCount: 310,
                  areas: ["Nasr City", "Heliopolis", "Grouping"],
                  verified: true,
                }}
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <QuoteCard
                selected
                quote={{
                  providerName: "Ahmed Electric",
                  price: 3200,
                  duration: "3 days",
                  rating: 4.9,
                  reviewsCount: 58,
                  message: "I'll replace all the wiring in the kitchen and living room and install a new panel. The price includes materials.",
                  verified: true,
                }}
                action={<Button variant="commit">Accept quote</Button>}
              />
              <QuoteCard
                quote={{
                  providerName: "Karim Electric",
                  price: 2750,
                  duration: "5 days",
                  rating: 4.4,
                  reviewsCount: 21,
                  message: "The price excludes materials. I can come by to inspect first.",
                }}
                action={<Button variant="outline">Choose this quote</Button>}
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Demo title="PriceTag · RatingStars" className="flex-col items-start">
                <PriceTag amount={350} kind="fixed" />
                <PriceTag amount={12500} kind="from" size="lg" />
                <RatingStars value={4.6} count={128} size="md" />
                <RatingStars value={2} />
              </Demo>
              <Demo title="BookingTimeline — Happy path" className="block">
                <BookingTimeline
                  current="IN_PROGRESS"
                  events={[
                    { status: "OPEN", at: formatDateTime(NOW) },
                    { status: "ACCEPTED", at: formatDateTime(NOW) },
                    { status: "PAID", at: formatDateTime(NOW), note: "The amount is held until you confirm completion" },
                    { status: "IN_PROGRESS", at: formatDateTime(NOW) },
                  ]}
                />
              </Demo>
              <Demo title="BookingTimeline — Dispute" className="block">
                <BookingTimeline
                  current="DISPUTED"
                  events={[
                    { status: "OPEN", at: formatDateTime(NOW) },
                    { status: "ACCEPTED", at: formatDateTime(NOW) },
                    { status: "PAID", at: formatDateTime(NOW) },
                    { status: "DISPUTED", at: formatDateTime(NOW), note: "The job wasn't finished as agreed" },
                  ]}
                />
              </Demo>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Demo title="ChatThread" className="block">
                <ScrollArea className="h-72">
                  <div className="flex flex-col gap-3 p-1">
                    <ChatBubble body="Hi, could you come tomorrow at 10?" at="9:41 AM" mine state="read" />
                    <ChatBubble body="Hi, sounds good. I'll be there on time." at="9:43 AM" />
                    <ChatBlockedNotice />
                    <ChatBubble body="Great, see you then" at="9:45 AM" mine state="sending" />
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
                    <AvatarFallback className="text-lg">M</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                </Demo>
              </div>
            </div>
          </Section>

          <Section id="direction" title="Direction test" description="Long text, IDs and phone numbers kept in their own direction, and directional buttons.">
            <Card className="gap-4 px-4 md:px-6">
              <p className="max-w-prose">{LONG_TEXT}</p>
              <p>
                Your booking <Ltr className="font-mono">BK-1042</Ltr> with <Ltr>Cool Air</Ltr> is confirmed, and they will call you on{" "}
                <Ltr>{formatPhone("01012345678")}</Ltr> after the booking is confirmed.
              </p>
              <p>
                Total <span className="font-semibold tabular-nums">{formatPrice(1250.5)}</span> Commission included (<Ltr>10%</Ltr>).
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline">
                  <ArrowLeft data-icon="inline-start" aria-hidden />
                  Back
                </Button>
                <Button variant="outline">
                  Next
                  <ArrowRight data-icon="inline-end" aria-hidden />
                </Button>
              </div>
            </Card>
          </Section>
        </main>
      </div>
    </div>
  )
}
