# Header navigation — grouped hover dropdowns

The public header (`(marketing)` and `(auth)` layouts) groups its links into dropdowns that open on hover.

## Groups

Defined once in `MARKETING_NAV_GROUPS` (`src/constants/nav.ts`):

| Group | Links |
|---|---|
| **Services** | All services · All categories · Request a quote · **Popular categories** column (active top-level categories from the DB, up to 8) |
| **For providers** | Become a provider · Provider sign in |
| **Help** | How it works · FAQ · About Livo · Contact us |

Every link answers 200 for a visitor. `/policies` is deliberately absent — it 404s until an admin publishes it. `Request a quote`
sends a signed-out visitor to sign in first (the zone gate).

The category column is read from the DB (`getNavCategories()`) **at build / ISR regeneration time** — never per request, so the
layouts stay static (CLAUDE.md §4.1 rule 1; the build still lists `/`, `/services`, `/about`… as ○ 1h). A hard-coded list would
link a 404 as soon as an admin deactivated a category. If the DB is unreachable the column is simply empty and the static links remain.

## Behaviour (`src/components/layout/NavMenu.tsx`)

- Opens on **mouse hover** (with a 150 ms close delay so moving diagonally into the panel doesn't drop it), on **click/tap** (touch
  has no hover) and stays open while focus is inside.
- Closes on pointer leave, **Escape** (focus returns to the trigger), focus leaving the group, or following a link.
- Triggers are buttons with `aria-expanded` / `aria-controls`; the trigger of the group containing the current page is marked
  `aria-current` (`activeGroupId()`, longest href wins).
- **Every panel is always rendered**, so all links are real `<a href>` in the cached HTML for crawlers; a closed panel is `invisible`
  (out of the tab order and the accessibility tree), not unmounted. Motion is a 150 ms fade/slide, off with `prefers-reduced-motion`.
- Logical utilities only (`start-0`, `border-s`, `ps-4`).

**Mobile** (`MobileMenu.tsx`): the same groups in the side sheet, each under a small heading, categories as a two-column list.

## Files

`src/constants/nav.ts` (`NavLink`, `NavGroup`, `MARKETING_NAV_GROUPS`; `FOOTER_NAV` unchanged), `src/utils/nav.ts`
(`buildNavGroups`, `activeGroupId`), `src/components/layout/{AppHeader,NavMenu,MobileMenu}.tsx`, `getNavCategories()` in
`src/services/catalog.service.ts`, `tests/utils/nav.test.ts`.
