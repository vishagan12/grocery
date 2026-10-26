# Polish progress — branch `opus-review`

## Frozen primary color (apple green)

| Token | Value | Where defined |
|---|---|---|
| `apple` / `--color-primary` | **#76CA3E** (unchanged) | `src/styles/design-tokens.json` → Tailwind `bg-apple`, CSS var, `src/lib/brand.ts` `BRAND_PRIMARY` |
| `apple-hover` / `--color-primary-hover` | #60B328 (pre-existing hover shade, kept) | same |
| `brand-primary` | #4CB01E (pre-existing secondary green, frozen too) | same |

Text on apple green uses `brand-forest` (#143B0D, contrast 6.18:1). Also present literally in `public/manifest.json` and `src/app/icon.svg` (cannot read CSS vars).

## Step 0 — Baseline

- Stack: Next.js 14.2.35 App Router, React 18, TypeScript, Tailwind 3.4, lucide-react, Supabase JS, npm.
- Routing: `/` renders an in-app page switcher (`state.currentPage` in `StoreContext`); `/products`, `/orders`, `/checkout`, `/monthly-list` set the page. Separate portals `/admin`, `/rider`. API routes: admin, health, orders, places, resolve-shop, rider, webhooks/payment.
- Build: passes. Lint: 25 warnings (22 `no-img-element`, 3 `exhaustive-deps` in admin/rider), 0 errors.
- npm audit: 6 vulns (1 critical next, 4 high, 1 moderate); fixes require breaking upgrades (next@16) — not applied.
- Secrets: `.env.local` untracked and ignored; no secrets in tracked files.

### Lighthouse (mobile, production build)

| Page | Perf | A11y | BP | SEO | LCP | TBT | FCP |
|---|---|---|---|---|---|---|---|
| Home before | 57 | 91 | 100 | 100 | 5.7s | 410ms | 3.7s |
| Home after Step 1 | 60 | 93 | 100 | 100 | 7.1s* | 392ms | 2.4s |
| Products before | 42 | 91 | 100 | 100 | 6.8s | 1010ms | — |
| Products after Step 1 | 52 | 93 | 100 | 100 | 7.2s* | 851ms | 2.3s |

*LCP is the hero/product imagery (page-level work, varies run to run). Remaining a11y failures are page content: color-contrast, target-size (Home), select-name (Products).

## Step 1 — Global foundation (done)

- Design tokens in one JSON consumed by Tailwind config, `:root` CSS vars and TS; ~300 arbitrary hex classes replaced with token classes (identical values). Defined previously missing utilities (`shadow-xs/2xs`, `drop-shadow-xs`, `backdrop-blur-xs`, `scale-98`, `xs` breakpoint).
- Fonts: Google Fonts `@import` (render-blocking) replaced by self-hosted `next/font` Inter + Noto Sans Tamil.
- Global CSS: focus-visible ring, selection color, reduced-motion, pinch-zoom re-enabled, no `transition: all`, button/input/card/badge component classes, skip-link.
- Shared `useDialog` hook (focus trap, Escape, scroll lock, focus restore, stacking) used by Login, Location, GPS-denied modals and Cart drawer.
- Header, footer, bottom nav, cart drawer, toast: landmarks, labels, 44px targets, contrast, semantic buttons instead of clickable divs.
- Bug fix: OTP auto-submit used stale state; login name is now required (removed silent "Vishagan" fallback).
- Meta: theme-color, manifest, apple touch icon, on-brand OG image, `.gitignore` hardened (`.env*`, `Thumbs.db`).

## Decisions made

- #76CA3E identified as the apple green (labelled so in code, most-used green).
- Dark forest text on green instead of white (white fails contrast; green unchanged).
- Green text on white uses `brand-deep` (#1E4D12) where `brand-primary` failed contrast.
- Hover on `brand-primary` buttons uses `brightness-110` (subtle) rather than a darker green with white text.
- `theme-color` changed from emerald #047857 to the apple green.
- Toast moved to the top; at the bottom it covered the cart pill and nav.
- OG image recolored from emerald/amber to brand colors.
- OG/apple-icon keep edge runtime (Node runtime of `@vercel/og` fails on Windows).
- Dependencies not upgraded (audit fixes are breaking).

## Text changes

- No visible copy changed. Added screen-reader-only labels/aria-labels only. Placeholders unchanged.

## Flags

- Concurrent external edits were detected during Step 1 in `LocationModal`, `Header`, `CartDrawer` (Escape handlers); merged into `useDialog`, nothing discarded.
- Placeholder-looking data: phone +91 98765 43210, address "123, Main Road…", DOB default "12 Dec 2006" (Profile/StoreContext).
- Unused components: `TopStrip.tsx`, `MonthlyListPage.tsx` (left in place).
- Home has no `<h1>`.
- 22 `no-img-element` warnings remain (handled per page).
- npm audit vulnerabilities need a major Next upgrade — owner decision.

## Page checklist

- [x] 0. Shared layout (header, footer, nav, dialogs) — Step 1
- [ ] 1. Home (`/`)
- [ ] 2. Products / category listing (`/products`)
- [ ] 3. Product detail
- [ ] 4. Wishlist
- [ ] 5. Order Again (`/monthly-list`)
- [ ] 6. Checkout (`/checkout`)
- [ ] 7. Orders / tracking (`/orders`)
- [ ] 8. Profile
- [ ] 9. 404 (not-found)
- [ ] 10. Admin (`/admin`)
- [ ] 11. Rider (`/rider`)
