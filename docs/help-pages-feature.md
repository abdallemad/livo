# Help pages & Become a provider

Status: **built** (2026-11-05). Replaces the placeholders on `/become-provider`, `/how-it-works` and `/contact`, and gives
`/faq` and `/about` built-in content. Designed in the LIVO marketing style (docs/DESIGN-SYSTEM.md): ghost-word page heroes,
white rounded cards with gradient icon tiles, navy → violet feature cards, dashed step timelines, navy closing bands.

All five pages are **static** (no request reads); `/faq` and `/about` also read their admin `StaticPage` at build /
hourly ISR. Copy lives in `src/constants/help.ts` and follows the same honesty rules as `constants/trust.ts`: only what
the product does today — no refund terms, warranty, cancellation window or verification time promises.

## Pages

| Route | Sections |
|---|---|
| `/become-provider` (MK-04) | Hero with **Create your provider account** (`/sign-up`) + **Provider sign in** and three promise chips → 6 benefits (requests, protected payments, profile, areas, prices, schedule) → two ways to earn (fixed-price services / quotes on projects) → the 6 onboarding steps (docs/onboarding-feature.md) beside a sticky "What you need" checklist → how payouts work (flow + commission / cash notes) → provider FAQ → closing band with the page's one gradient commit button. JSON-LD: BreadcrumbList + FAQPage. |
| `/how-it-works` (MK-03) | Help nav → both customer flows side by side (reusing `HOW_IT_WORKS` from `constants/trust.ts`, so the landing tabs and this page never disagree) → "Where your money is" → the four trust promises → the provider flow → help CTA. |
| `/faq` (MK-05) | Help nav → sticky topic index (Booking, Payments, Trust & safety, For providers) + grouped accordions (answers `keepMounted` + `hiddenUntilFound`, in the HTML) → **More answers**: the admin `faq` StaticPage body when published → help CTA. JSON-LD: FAQPage over every built-in answer. |
| `/about` (MK-05) | Help nav → story + "Now live in {city}" card → **From the team**: the admin `about` StaticPage body when published → values → "Built for both sides" → help CTA. |
| `/contact` (MK-05) | Help nav → four channels (booking chat, report a problem on the booking, the AI assistant, FAQ) → phone / WhatsApp / email cards **only when set** in `constants/site.ts` (`SUPPORT_PHONE`, `SUPPORT_WHATSAPP`, new `SUPPORT_EMAIL`) → popular topics + provider card → help CTA. No contact form yet: it would need a message store and an admin inbox. |

**Behaviour change:** `/faq` and `/about` used to 404 unless their `StaticPage` was published. They now always answer 200
with the built-in content; the admin text is an extra block. A DB outage just drops that block. Both moved to the static
part of `sitemap.ts`; `/terms`, `/privacy`, `/policies` still appear only when published.

## Components — `src/components/help/`

| File | What |
|---|---|
| `HelpNav.tsx` | Pill bar of the Help group (`HELP_NAV`); active page passed as a prop (no `usePathname`, stays a Server Component) |
| `HelpCta.tsx` | "Still have a question?" navy band → FAQ / Contact |
| `StepTimeline.tsx` | Numbered (or icon) discs on a dashed rail, a card per step; an `<ol>` |
| `FlowSteps.tsx` | Horizontal (vertical on phones) money flow with the "held" step in navy |
| `FaqList.tsx` | Accordion with answers kept in the HTML |
| `IconCard.tsx` | White card with gradient icon tile (benefits, values, promises) |
| `CmsBody.tsx` | Sanitised `StaticPage` HTML on a white panel (also used by `StaticPageView`) |
| `help-icons.ts` | `HelpIconKey` → lucide icon |

Motion (`Reveal`, `StaggerList`, `AnimatedTitle`) is wrapped in `MotionProvider` on each page, as on the landing page;
content stays in the server HTML.
