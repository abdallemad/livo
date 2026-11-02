# Brand assets — logo, favicon, app icons

The Livo logo is the **"LV" mark** — a lavender "L" and a "V" whose stroke rises into an arrow, on a deep-purple rounded
square — and the **wordmark**: the mark followed by "Livo" in heavy rounded lettering. All files were generated from the
two source images supplied with the change (transparent PNG/WebP), so re-export from new sources the same way if the logo
changes.

| File | Size | Used for |
|---|---|---|
| `public/logo-mark.png` | 512 × 512, transparent | `SITE_LOGO` — dashboard sidebars (customer, provider, admin) and the mobile dashboard header via `BrandMark`; the `Organization.logo` in JSON-LD (`utils/structured-data.ts`) |
| `public/logo-wordmark.png` | 517 × 192, transparent, purple lettering | `BrandWordmark` in **light** mode — marketing header, footer, onboarding header |
| `public/logo-wordmark-dark.png` | 517 × 192, transparent, lavender lettering (`#E2C7FB`) | `BrandWordmark` in **dark** mode — purple lettering on a dark background is unreadable |
| `src/app/icon.png` | 512 × 512, transparent | browser tab / PWA icon (Next file convention → `<link rel="icon">`) |
| `src/app/favicon.ico` | 16, 32, 48 | legacy `/favicon.ico` requests |
| `src/app/apple-icon.png` | 180 × 180, **opaque** (corners filled with the mark's purple `#5B129F`) | iOS home screen (iOS paints transparency black and rounds the corners itself) |

The old placeholder `public/logo.svg` was removed.

## In code

- `src/constants/site.ts` — `SITE_LOGO` (the mark) and `SITE_WORDMARK` (`light`, `dark`, intrinsic `width` / `height`).
  Brand identity stays in this one file (CLAUDE.md §9).
- `src/components/shared/brand-logo.tsx` (also exported from `components/shared`):
  - `BrandMark({ size })` — decorative (`alt=""`), always shown next to the name as text, so the sidebar's
    collapsed "icon" mode still shows the logo.
  - `BrandWordmark({ height, priority })` — two `next/image`s toggled with `dark:hidden` / `hidden dark:block`
    (next-themes `class` strategy); the hidden one is `display: none`, so the name is announced once (`alt="Livo"`).
    Server-safe: no hooks, so the static marketing layout stays static. `priority` on the above-the-fold headers.

| Place | Component |
|---|---|
| Marketing header (`AppHeader`), footer (`AppFooter`), onboarding header | `BrandWordmark` (36 px high) |
| Dashboard sidebar header (customer / provider / admin) | `BrandMark` 28 px + "Livo" + zone label |
| Dashboard mobile header | `BrandMark` 24 px + "Livo" |
| Browser tab, bookmarks, iOS home screen | `icon.png`, `favicon.ico`, `apple-icon.png` |
| Search engines (Organization JSON-LD) | `logo-mark.png` |

## Colour note

The logo purple is `#5B129F`; the UI's `primary` token is `#6B2FC4` on light surfaces and `#B37AFD` in dark mode
([DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) §2). They sit together well; aligning the token to the logo is a separate design
decision (contrast must stay AA).

## Not done

- A social-share image (`opengraph-image`) using the wordmark — pages share the default OG metadata today.
- An SVG version of the logo (the sources are raster; PNGs are exported at 2× their display size).
