# DESIGN-SYSTEM.md — Livo Design System (shadcn/ui on Base UI)

> **What this file is.** Instructions for Claude Code to **build and then follow** Livo's design system.
> Read with `CLAUDE.md` (stack, layers, rendering rules) and `SITEMAP.md` (which pages exist).
> Rule: **no page or feature is built until the foundation in §14 (Phase A) exists.** After that, every screen is assembled only from the tokens, components and patterns defined here. Never hard-code colors, radii, fonts or spacing inside feature components.

- Stack: Tailwind CSS v4 (CSS-first, no `tailwind.config.js`), shadcn/ui **base-nova style on Base UI (`@base-ui/react`), not Radix**, `class-variance-authority`, `lucide-react`, `next-themes`.
- Language/direction: **Arabic, RTL**. Route paths and code stay English; all UI copy is Arabic.
- This file **overrides** `CLAUDE.md` §9 on two points only: fonts (Arabic fonts instead of Geist) and default theme (light instead of dark). Everything else in §9 still applies.

---

## 1. Design direction

**Subject:** a marketplace where Egyptian households book home-repair and building trades (plumbing, electrical, cleaning, tiling/painting), either at a fixed price or by comparing quotes.

**Audiences:**
- *Customers:* a worried homeowner with a leaking pipe, or someone fitting out a flat who is nervous about being overcharged. They need **clarity and trust**.
- *Providers:* tradespeople, mostly non-technical, usually on a phone with a weak connection. They need **big, obvious, few-step screens**.
- *Admins:* staff who need **dense, scannable tables**.

**Personality:** calm, sober, dependable, closer to a good spirit level than to a flashy app. It looks like a trustworthy tradesperson's tools: matte, precise, plain.

**One memorable thing (spend boldness only here):** a single warm **marker-amber** colour reserved for *commitment moments*, meaning the action that books, accepts, pays or releases money, plus rating stars. Everything else is quiet petrol-teal, ink and plaster-grey. If amber appears anywhere else, it is a bug.

**What we deliberately avoid:** cream + terracotta, near-black + neon accent, identical rounded cards with the same soft shadow on everything, gradient washes, ALL-CAPS eyebrow labels, "→" on every link, scroll-triggered fade-ups on every section.

---

## 2. Colour tokens

Semantic tokens only. Components use `bg-background`, `text-foreground`, `bg-primary`, etc., never raw hex.

> **Naming trap:** in shadcn, `accent` means "hover/selected surface", not a brand accent. Our amber is therefore a separate token called **`commit`**.

### Palette (light, default)

| Token | Hex | Use |
|---|---|---|
| `background` | `#F4F6F5` | page ("plaster") |
| `foreground` | `#14232F` | text ("ink") |
| `card` / `popover` | `#FFFFFF` | surfaces |
| `primary` | `#0F5C5A` | general primary actions, links, active nav ("petrol") |
| `primary-foreground` | `#FFFFFF` | |
| `secondary` | `#E6EBEA` | secondary buttons, subtle fills |
| `secondary-foreground` | `#14232F` | |
| `muted` | `#E6EBEA` | disabled/quiet surfaces |
| `muted-foreground` | `#53636B` | secondary text (AA on `background`) |
| `accent` | `#DDE7E6` | hover / selected row (shadcn meaning) |
| `accent-foreground` | `#14232F` | |
| `commit` | `#F2B01E` | **commitment actions + rating stars only** |
| `commit-foreground` | `#14232F` | text on amber (never white) |
| `border` / `input` | `#D5DDDB` | |
| `ring` | `#0F5C5A` | focus ring |
| `destructive` | `#B3261E` | errors, cancel, delete |
| `success` | `#1E7A4C` | |
| `warning` | `#8A5A00` | text-safe amber-brown; **not** the `commit` colour |
| `info` | `#1F5F99` | |

### Palette (dark)

| Token | Hex |
|---|---|
| `background` | `#0E1A22` |
| `foreground` | `#EAF0EE` |
| `card` / `popover` | `#14232F` |
| `primary` / `primary-foreground` | `#3FB8B0` / `#08201F` |
| `secondary` / `muted` | `#1D3040` |
| `muted-foreground` | `#9BB0B5` |
| `accent` | `#1D3040` |
| `commit` / `commit-foreground` | `#F2B01E` / `#14232F` |
| `border` / `input` | `#25363F` |
| `ring` | `#3FB8B0` |
| `destructive` | `#F2766E` |
| `success` | `#4CC38A` |
| `warning` | `#E0B04A` |
| `info` | `#6FB0E8` |

Charts (admin KPIs): `chart-1 #0F5C5A`, `chart-2 #F2B01E`, `chart-3 #1F5F99`, `chart-4 #1E7A4C`, `chart-5 #53636B`.

### Colour rules
1. **Never** use `commit` as text on a light background (fails contrast); only as a fill with `commit-foreground`, or as a filled star.
2. Maximum **one `commit` button per screen/step.** Examples: *احجز الآن*, *اقبل العرض*, *أكّد إتمام الشغل*, *اطلب سحب الأرباح*.
3. Status is never conveyed by colour alone; always icon + text label.
4. Verify AA contrast (4.5:1 body, 3:1 large/UI) for any new pairing.

### `src/app/globals.css` (shape to implement)

```css
@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));

:root {
  --background: #F4F6F5;  --foreground: #14232F;
  --card: #FFFFFF;        --card-foreground: #14232F;
  --popover: #FFFFFF;     --popover-foreground: #14232F;
  --primary: #0F5C5A;     --primary-foreground: #FFFFFF;
  --secondary: #E6EBEA;   --secondary-foreground: #14232F;
  --muted: #E6EBEA;       --muted-foreground: #53636B;
  --accent: #DDE7E6;      --accent-foreground: #14232F;
  --commit: #F2B01E;      --commit-foreground: #14232F;
  --destructive: #B3261E;
  --success: #1E7A4C;  --warning: #8A5A00;  --info: #1F5F99;
  --border: #D5DDDB;  --input: #D5DDDB;  --ring: #0F5C5A;
  --chart-1: #0F5C5A; --chart-2: #F2B01E; --chart-3: #1F5F99; --chart-4: #1E7A4C; --chart-5: #53636B;
  --radius: 0.5rem;
}
.dark { /* values from the dark table above */ }

@theme inline {
  --color-background: var(--background);   --color-foreground: var(--foreground);
  --color-card: var(--card);               --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);         --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);         --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);     --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);             --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);           --color-accent-foreground: var(--accent-foreground);
  --color-commit: var(--commit);           --color-commit-foreground: var(--commit-foreground);
  --color-destructive: var(--destructive);
  --color-success: var(--success);  --color-warning: var(--warning);  --color-info: var(--info);
  --color-border: var(--border);  --color-input: var(--input);  --color-ring: var(--ring);
  --font-sans: var(--font-body);  --font-heading: var(--font-display);
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 2px);
  --radius-xl: calc(var(--radius) + 6px);
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground font-sans antialiased; line-height: 1.75; }
  h1,h2,h3,h4 { @apply font-heading; letter-spacing: 0; }
}
```

Keep the exact variable shape that `npx shadcn@latest init` generated if it differs; only change the **values** and add the extra tokens (`commit`, `success`, `warning`, `info`).

---

## 3. Typography (Arabic-first)

| Role | Font | Weights | CSS var |
|---|---|---|---|
| Headings / display | **Readex Pro** | 500, 600, 700 | `--font-display` |
| Body / UI | **IBM Plex Sans Arabic** | 400, 500, 600 | `--font-body` |

Load both with `next/font/google`, `subsets: ["arabic","latin"]`, `display: "swap"`, in `src/app/layout.tsx`, replacing Geist. Remove `Geist_Mono`; use the system mono stack for the rare code/ID display.

### Scale (mobile → desktop)

| Style | Class intent | Size | Line-height |
|---|---|---|---|
| Display (hero only) | `text-4xl md:text-6xl font-heading font-bold` | 36 → 60 | 1.25 |
| H1 | `text-3xl md:text-4xl font-heading font-semibold` | 30 → 36 | 1.3 |
| H2 | `text-2xl md:text-3xl font-heading font-semibold` | 24 → 30 | 1.35 |
| H3 | `text-xl font-heading font-semibold` | 20 | 1.4 |
| Body | `text-base` | 16 | 1.75 |
| Small / meta | `text-sm text-muted-foreground` | 14 | 1.65 |
| Caption | `text-xs` | 12 (never below) | 1.6 |

### Arabic typography rules
1. **No letter-spacing / `tracking-*` on Arabic text** (it breaks letter joining). **No `uppercase`, no italics** for Arabic.
2. Minimum body size **16px** (providers use cheap phones). Arabic needs the taller line-height above.
3. Line length ≤ ~65 characters in reading areas (`max-w-prose`).
4. **Digits: Western (0-9)** everywhere (prices, phones, dates, OTP). Use `tabular-nums` in tables, prices and OTP. Format with `Intl.NumberFormat("ar-EG", { numberingSystem: "latn" })`. (Decision #2 in §16.)
5. Currency display: `350 ج.م`, number then symbol, via one `formatPrice()` util in `src/utils/format.ts`. Never concatenate by hand.
6. Mixed Arabic + Latin/number runs (phone, order id, English brand names) get `dir="ltr"` on an inline `<bdi>` or span so they do not scramble.

---

## 4. Spacing, radius, elevation, layout

- **Base unit 4px** (Tailwind default scale). Section rhythm: `py-12 md:py-20` public, `p-4 md:p-6` inside dashboards.
- **Radius by hierarchy, not one value everywhere:** controls (`button`, `input`, `select`) `rounded-md`; cards, popovers `rounded-lg`; dialogs, sheets, large media `rounded-xl`; avatars, status dots `rounded-full`. Never `rounded-3xl` pill cards.
- **Elevation:** surfaces are separated by **1px border + background contrast**, not shadow. Shadows only on things that float: dropdowns, popovers, dialogs, sticky bars (`shadow-md`). Cards in lists have **no shadow**.
- **Containers:** public pages `max-w-6xl mx-auto px-4 md:px-6`; reading text `max-w-prose`; dashboards fill the shell.
- **Touch targets ≥ 44px** high on every interactive element (see sizes in §5).
- Use `dvh`, never `vh`, for shells (CLAUDE.md §9).

---

## 5. Component rules

Install shadcn components with `npx shadcn@latest add <name>` into `src/components/ui`. They are **ours to edit**, but changes are limited to: tokens, sizes, variants (via `cva`), and RTL fixes (§6). Never duplicate a component to restyle it. Add a variant instead.

### Components to install (Phase A)
`button input textarea label select checkbox radio-group switch card badge avatar separator skeleton tooltip popover dialog alert-dialog sheet dropdown-menu tabs table pagination breadcrumb progress alert accordion scroll-area command sidebar input-otp calendar` plus the toast component and the form/field helper used with `react-hook-form`. If a name does not exist in the base-nova registry, build it on the matching `@base-ui/react` primitive in the same file style. Do not pull in Radix.

### Button
Sizes (heights): `sm 36px` (admin tables only), `default 44px`, `lg 52px` (hero, mobile primary).

| Variant | Use |
|---|---|
| `default` | petrol, standard primary action |
| `commit` | **amber, commitment action. Max one per screen** (see §2) |
| `secondary` | secondary action |
| `outline` | tertiary, cancel |
| `ghost` | toolbar / icon buttons |
| `destructive` | cancel booking, delete, reject |
| `link` | inline text action |

Add `commit` to the button `cva` (`bg-commit text-commit-foreground hover:bg-commit/90`). Loading state: spinner (`lucide Loader2`) + disabled + same width (no layout shift). Every async button shows it.

### Inputs & forms
- Label **above** the field, always visible (no placeholder-as-label). Helper text below; error text replaces helper in `text-destructive` with an icon.
- `react-hook-form` + `zodResolver` (CLAUDE.md §9); replay server `fieldErrors` from the hook's `ActionError`.
- Phone input: LTR, `inputMode="tel"`, fixed `+20` prefix, accepts `01XXXXXXXXX`.
- OTP: `input-otp`, 6 slots, LTR digits, auto-submit, resend timer (disabled with countdown), clear error on failure.
- Long forms are split into **steps** (max ~5), one question group per step, with a visible progress indicator.

### Cards, tables, badges
- Card = border + `bg-card`, `p-4 md:p-5`. No decorative gradients.
- Tables (admin): sticky header, row hover = `bg-accent`, bulk-select, sortable headers, empty state, skeleton rows. On mobile, customer/provider lists render as **cards**, not tables.
- `Badge` variants added: `success`, `warning`, `info`, `neutral`, `destructive`, plus `status` mapping in §8.

### Overlays
- `Dialog` for confirmation and short forms, `Sheet` for mobile menus/filters, `AlertDialog` for destructive/irreversible confirms (cancel booking, reject provider, resolve dispute). Destructive confirms restate the consequence in the title.
- Toasts: bottom on mobile, start-side on desktop; one short sentence; same verb as the button that triggered it.

---

## 6. RTL rules (mandatory)

1. `<html lang="ar" dir="rtl">` in the root layout. Wrap the app in Base UI's **`DirectionProvider`** (`direction="rtl"`) so popovers, menus, tabs, sliders and keyboard arrows follow RTL. Verify the exact import path in the installed `@base-ui/react` docs.
2. **Use logical utilities only:** `ms-*` `me-*` `ps-*` `pe-*` `start-*` `end-*` `text-start` `text-end` `border-s` `border-e` `rounded-s-*` `rounded-e-*`. **Never** `ml-* mr-* pl-* pr-* left-* right-* text-left text-right`.
3. After adding any shadcn component, **grep it for physical utilities** (`left-`, `right-`, `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`, `slide-in-from-left/right`, `translate-x`) and convert them. Add this as a lint/grep check in `tests/` (a node:test that scans `src/components/ui` and `src/components` for banned classes).
4. **Directional icons flip**: chevrons, arrows, "back", progress arrows get `rtl:-scale-x-100` (or pick the mirrored icon). Non-directional icons (check, search, phone, star, play) do not flip.
5. Numbers, phone numbers, emails, URLs, ids render LTR inside RTL text (`<bdi>`/`dir="ltr"`).
6. Stepper/timeline progress runs right→left. Carousels and sliders start from the right.
7. Test every new screen once with long Arabic strings and once with a Latin word inside an Arabic sentence.

---

## 7. Layout shells

| Shell | Route group | Structure |
|---|---|---|
| **Marketing** | `(marketing)` | Header (logo at start; nav: الخدمات، كيف تعمل المنصة، انضم كمزود؛ `AccountControls` island at end) + footer. Static; no request reads. |
| **Customer app** | `(app)/account` | Desktop: sidebar at start + `<main>` scrolls. Mobile: top bar + **bottom tab bar** (الرئيسية، طلباتي، حجوزاتي، المحادثات، حسابي). |
| **Provider app** | `(provider)/provider` | Same as customer but tabs: الرئيسية، الطلبات، حجوزاتي، المحادثات، الأرباح. Bigger type and targets. Verification-status banner pinned at top until `ACTIVE`. |
| **Admin** | `(admin)/admin` | Collapsible sidebar + breadcrumb bar + dense content. Desktop-first. |

- Shell = `h-dvh overflow-hidden`, only `<main>` scrolls (CLAUDE.md §9).
- Nav lists live in `src/constants/*-nav.ts`; **active state is a Client Component using `usePathname()`** (layouts do not re-render on navigation).
- Page anatomy for every dashboard page: `PageHeader` (title, short description, primary action at end) → optional filters → content → pagination.

---

## 8. Domain components (build once in Phase B, reuse everywhere)

Place generic ones in `src/components/shared/` (export from `index.ts`) and domain-specific ones in their domain folder. Each is presentational and takes DTOs as props; **no data fetching inside them**.

| Component | Purpose | Used on |
|---|---|---|
| `PageHeader` | Title + description + actions | all dashboards |
| `EmptyState` | Icon, one-line explanation, **one action** | every list |
| `StatusBadge` | Maps state machine → label, icon, variant (table below) | requests, bookings, disputes, payouts |
| `BookingTimeline` | Vertical timeline of states with timestamps | customer/provider/admin booking detail |
| `PriceTag` | `formatPrice()` + optional "starting from / fixed" label | service cards, quotes |
| `RatingStars` | Display + input; filled stars use `commit` | profiles, reviews |
| `VerifiedBadge` | "مزود موثّق" with check icon | provider card/profile |
| `ServiceCard` | Image, title, provider, price, rating, duration | `/services/*` |
| `ProviderCard` | Photo, name, specialties, rating, jobs count, areas | lists, profile |
| `QuoteCard` + `QuoteCompareTable` | Price, duration, rating, message, "اقبل العرض" (`commit`) | `/account/requests/[id]` |
| `RequestForm` | Description + photo dropzone (compression, limit, progress) + category + address + budget | new request |
| `PhotoUploader` | `react-dropzone`, compress client-side, per-file progress, retry on weak network | requests, portfolio, disputes, verification |
| `ChatThread` + `ChatBubble` + `ChatComposer` | Messages with delivery state; inline notice when contact details are blocked (SY-04) | both messages pages |
| `Stepper` / `Wizard` | Progress + back/next, keeps state | booking wizard, provider onboarding |
| `AddressPicker` | Saved addresses + new address (+ map later) | booking, request |
| `DateTimePicker` | Day chips + time slots | booking wizard |
| `ConfirmDialog` | Wraps `AlertDialog`, takes consequence text | destructive flows |
| `StatCard` | Number + label + change | provider/admin dashboards |
| `DataTable` (+ wrapper) | Sorting, bulk select, pagination, empty/skeleton | admin |
| `WalletSummary` | Due / collected / commission | provider earnings |
| `ReviewForm` / `ReviewItem` | Stars + comment; provider reply | review pages |
| `AccountControls` | Client island, same-size placeholder until Clerk resolves | all headers |

### `StatusBadge` mapping

| State | Arabic label | Variant | Icon |
|---|---|---|---|
| Draft | مسودة | neutral | `FileEdit` |
| Open | مفتوح | info | `CircleDot` |
| Quotes received | وصلت عروض | info | `MessageSquareQuote` |
| Accepted | تم القبول | primary | `Handshake` |
| Paid / Escrowed | الدفع محجوز | primary | `ShieldCheck` |
| In progress | قيد التنفيذ | warning | `Wrench` |
| Completed | مكتمل | success | `CheckCircle2` |
| Reviewed | تم التقييم | success | `Star` |
| Closed | مغلق | neutral | `Archive` |
| Cancelled | ملغي | destructive | `XCircle` |
| Disputed | نزاع | destructive | `AlertTriangle` |
| Expired | منتهي | neutral | `Clock` |

Provider verification: `PENDING` قيد المراجعة (warning) · `ACTIVE` مفعّل (success) · `SUSPENDED` موقوف (destructive) · `REJECTED` مرفوض (destructive).

---

## 9. Content & copy rules (Arabic UI)

- Simple, everyday Arabic that Egyptians read easily. No stiff formal phrasing, no slang. Short sentences, active voice.
- **A button says exactly what happens:** "احجز الآن"، "قدّم عرض سعر"، "أكّد إتمام الشغل". Never "إرسال" or "تأكيد" alone. The toast after repeats the same verb ("تم الحجز").
- **Errors explain the fix, never apologise:** "رقم الموبايل غير صحيح. اكتب 11 رقم يبدأ بـ 01."
- **Empty states invite one action:** "لسه ما فيش طلبات. اطلب عرض سعر لأول مشروع."
- Use one glossary everywhere:

| Concept | Use | Do not use |
|---|---|---|
| Customer | عميل | زبون |
| Provider | مزود الخدمة | صنايعي (UI), بائع |
| Request | طلب | |
| Quote | عرض سعر | |
| Booking | حجز | |
| Escrow | مبلغ محجوز | ضمان, أمانة |
| Payout | سحب الأرباح | |
| Dispute | نزاع | |

- Brand name only from `src/constants/site.ts`.
- No marketing filler in dashboards. Labels name what the user manages, not how the system works.

---

## 10. Motion

- Motion answers an action (open, expand, save, confirm). Durations 150–200ms, ease-out. Use `tw-animate-css` classes already in shadcn; `motion` library only for the hero and the booking-confirmed moment.
- **No** scroll-reveal on every section, **no** hover-lift on every card.
- Respect `prefers-reduced-motion` (`motion-reduce:` variants / `useReducedMotion`).
- Loading uses `Skeleton` that matches the final layout (no spinners for page content).

---

## 11. Accessibility & performance floor

- Visible focus ring on every interactive element (`ring` token, 2px, offset 2px). Never remove outlines.
- Full keyboard operation; Base UI handles focus management in overlays. Do not break it with custom wrappers.
- Every icon-only button has an Arabic `aria-label`. Images have Arabic `alt`. Form errors are announced (`aria-live="polite"`).
- Contrast per §2. Touch targets per §4. Text resizes to 200% without loss.
- Perf: icons imported by name from `lucide-react`; images via the `next/image` wrapper pattern (CLAUDE.md §9); fonts subset to Arabic + Latin; no component libraries beyond the stack.

---

## 12. File layout for the design system

```
src/
├── app/globals.css                    # tokens (§2), base layer
├── app/layout.tsx                     # fonts, dir="rtl", DirectionProvider, providers
├── components/
│   ├── ui/                            # shadcn primitives (edit only per §5)
│   ├── shared/                        # PageHeader, EmptyState, StatusBadge, StatCard, ConfirmDialog, DataTable…
│   ├── layout/                        # Marketing header/footer, Customer/Provider/Admin shells, BottomTabs
│   ├── forms/                         # PhoneField, OtpField, PhotoUploader, DateTimePicker, AddressPicker
│   └── <domain>/                      # service/, provider/, request/, booking/, chat/, wallet/
├── constants/
│   ├── status.ts                      # state machine → label/variant/icon (§8)
│   └── *-nav.ts
├── utils/format.ts                    # formatPrice, formatDate, formatPhone (Arabic locale, Latin digits)
└── (admin)/admin/design-system/page.tsx   # living style guide (below)
```

**Living style guide:** `/admin/design-system` (inside the admin gate, `noindex`) renders every token, type style, button/badge variant, form field, each domain component in each state (empty / loading / error / long Arabic text), in light and dark. Add it to `SITEMAP.md` under Admin. It is the visual regression reference: **when you change a token or component, check this page.** It must not exist as a public route.

---

## 13. Hard rules (checklist for every PR)

- [ ] No raw hex, `rgb()`, or Tailwind palette colours (`bg-blue-500`) in feature code. Tokens only.
- [ ] No physical-direction utilities (`ml-`, `pr-`, `left-`, `text-left`…). Logical only.
- [ ] Directional icons flip under RTL.
- [ ] Max one `commit` button per screen; `commit` not used for anything else.
- [ ] No `tracking-*`, `uppercase`, or italics on Arabic text.
- [ ] Interactive elements ≥ 44px; body text ≥ 16px.
- [ ] Every list has empty, loading (skeleton) and error states.
- [ ] Status shown with icon + label via `StatusBadge`, not colour alone.
- [ ] Prices via `formatPrice()`; numbers LTR inside RTL text.
- [ ] No hard-coded Arabic copy that contradicts the glossary (§9).
- [ ] New/changed component appears in `/admin/design-system`.
- [ ] `npm run lint` and `npm run build` pass.

---

## 14. Build order

**Phase A: Foundation (before any page)**
1. Confirm shadcn is initialised as base-nova (CLAUDE.md §15); install the components in §5.
2. Write tokens into `globals.css` (§2); add `commit/success/warning/info` to `@theme inline`.
3. Load fonts, set `dir="rtl"`, add `DirectionProvider`, set `next-themes` default to `light`.
4. Add `commit` Button variant, Button sizes, Badge variants.
5. Convert all installed `ui/` components to logical utilities; add the RTL grep test.
6. Add `utils/format.ts` and `constants/status.ts`.

**Phase B: Shared & domain components** (§8), shells (§7), then the `/admin/design-system` page showing them all.

**Phase C: Pages** follow `SITEMAP.md` build order, composing only Phase A/B pieces. If a screen needs a pattern that does not exist, add it to Phase B first (and to the style-guide page), then use it.

---

## 15. Do-not list

- Do not install or mix another UI kit (MUI, Chakra, Mantine, Radix-based shadcn styles).
- Do not create a second token file, a `tailwind.config.js`, or CSS modules for colours.
- Do not use gradients as decoration, glassmorphism, or glow effects.
- Do not use emojis as icons. `lucide-react` only.
- Do not use dark patterns or fake urgency ("باقي ساعة!") in copy.
- Do not build screens just for a visual preview that are not in `SITEMAP.md`.

---

## 16. Open decisions (change these and update this file)

| # | Decision | Current default |
|---|---|---|
| 1 | Default theme | **Light** (overrides CLAUDE.md's dark default); dark supported |
| 2 | Digits | Western (0-9). Switch to Arabic-Indic only by changing `formatPrice`/`format.ts` |
| 3 | Fonts | Readex Pro (headings) + IBM Plex Sans Arabic (body); confirm after seeing them in the style guide |
| 4 | Brand colours | Petrol `#0F5C5A` + marker-amber `#F2B01E`; replace if a logo/brand identity already exists |
| 5 | Logo & brand name | Placeholder from `constants/site.ts` |
| 6 | Mobile navigation | Bottom tab bar for customer/provider; revise if usability testing says otherwise |
