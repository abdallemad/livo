# 2026-11-03 — Animated landing page, notification bell on the marketing header, badge alignment

Details: [landing-page.md — Motion](../landing-page.md#motion), [notifications-feature.md](../notifications-feature.md).

- **Landing page animations** (`motion`, formerly Framer Motion):
  - **text animation** on every title — the hero headline's words rise in at first paint (CSS, so the LCP element never
    waits for JavaScript), each section title animates word by word as it scrolls into view;
  - hero subtitle, buttons and search rise in; two soft glows drift behind the hero;
  - card grids (trust strip, popular services, why-trust cards, providers, work gallery, provider benefits) appear one
    after another with a small hover lift; how-it-works, money flow and FAQ fade in; the final CTA zooms in;
  - social-proof numbers count up.
  Reduced-motion visitors get no movement; all text and numbers are in the server HTML. `DESIGN-SYSTEM.md` §10 now
  records the landing page as the one exception to "no scroll-reveal / hover-lift".
- **Marketing header:** the notification bell sits next to the account menu for signed-in users, live through Pusher;
  "See all" goes to `/account/notifications` or `/provider/notifications` by role. Nothing renders for signed-out visitors.
- **Sidebar badge fix:** the unread-messages count is now inside the **Messages** row, aligned with the label (it used to
  drop below the item on the taller touch-size rows).

No schema change and no migration.

## Verification

- `tsc --noEmit`, `npm run lint`, `npm test` (206/206) pass.
- Ran the app against a throwaway local Postgres (all migrations applied, seed loaded): `/` answers 200 with no server
  errors; the HTML has the hero `<h1>` with 7 animated word spans and the full sentence as `aria-label`, all 8 section
  `<h2>`s with `aria-label`, the light + dark wordmarks, and the favicon / icon / apple-touch-icon links. The chat
  unread-count SQL also ran correctly on the seeded data.
- **Not seen in a browser** — the sandbox's browser can't reach the local server. Worth checking: the hero words and
  scroll reveals in Chrome and Safari, with "Reduce motion" on and off; the sidebar badge on `/account` with unread
  messages; the bell on the landing page while signed in.
