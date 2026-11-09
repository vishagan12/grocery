# Production Deployment & Operational Readiness Checklist
**Project:** Sri Amman Supermarket (Madurai) Quick-Commerce  
**Architecture:** Next.js 14 App Router + Supabase PostgreSQL + Upstash Redis  
**Branch:** `opus-review`  
**Date:** November 2026

---

## Executive Summary: Go-Live Readiness Verdict

**Verdict: READY WITH CONDITIONS**

The core infrastructure, security guards, database RPCs, and order processing flows are thoroughly tested and production-grade. Before commercial launch with real paying customers and live delivery operations, the conditions below must be completed.

### Prioritised Action Items:
1. **MUST FIX BEFORE GO-LIVE (Blockers):**
   - **Vercel Pro & Supabase Pro:** Upgrade from free tiers to prevent project pausing, ensure commercial terms compliance, and enable Point-In-Time Recovery (PITR).
   - **Production Supabase Project:** Apply all 14 migrations sequentially, run RLS checks, and seed admin/rider accounts.
   - **Payment Gateway Live Mode:** Replace test credentials with live Razorpay keys and configure the webhook signature secret with replay deduplication.
   - **Domain & SSL:** Point the official custom domain (`sriammansupermarket.in`) to Vercel and verify DNS propagation.
   - **`LOADTEST_BYPASS_SECRET`:** Ensure this variable is **UNSET** in Vercel Production environment settings.
2. **RECOMMENDED BEFORE GO-LIVE (Can be done in parallel):**
   - **Catalog Expansion:** Add missing staple products (Sugar/Sakkarai, Jaggery/Vellam, Mustard/Kadugu, Cumin/Seeragam, Garlic/Poondu) and update `small-onions` with the `ulli` alias.
   - **Contrast Tuning:** Ensure all `#76CA3E` apple green action buttons use `text-brand-forest` (`#143B0D`) instead of `text-white` to guarantee WCAG AA compliance (contrast ratio > 6:1 vs 2.04:1).
   - **Local SEO:** Insert Schema.org `GroceryStore` JSON-LD structured data into `src/app/layout.tsx`.
3. **CAN WAIT (Post-Launch Enhancements):**
   - SMS OTP Gateway integration (Twilio / MSG91) — Google One-Tap auth is currently active and fully operational.
   - Advanced delivery route optimization for multi-order drop-offs.
   - Customer loyalty points module.

---

## 1. Environment Variables Audit & Vercel Configuration Table

Tick off each variable in the Vercel Project Settings (`Settings -> Environment Variables`):

| Variable Name | Scope / Target | Required | Verified Safe in Code? | Description & Value Guidelines |
| :--- | :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production & Preview | **Yes** | Yes (Client-safe) | Production Supabase project URL (`https://<prod-ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production & Preview | **Yes** | Yes (Client-safe) | Public Anon key. Respects Row Level Security on all tables. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Production (Server-Only)** | **Yes** | Yes (Protected) | Service role key. Used strictly for atomic orders & administrative RPCs. **NEVER expose to client.** |
| `UPSTASH_REDIS_REST_URL` | Production & Preview | **Yes** | Yes (Server-Only) | Upstash Redis REST URL for distributed sliding-window rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | Production & Preview | **Yes** | Yes (Server-Only) | Upstash Redis REST authentication token. |
| `DATABASE_URL` | Production (Server-Only) | **Yes** | Yes (Server-Only) | Direct PostgreSQL connection string (Port 5432 / 6543) for migrations and `pg_dump` backups. |
| `PAYMENT_WEBHOOK_SECRET` | Production & Preview | **Yes** | Yes (Fails closed) | Secret key from payment gateway webhook dashboard. If unset, webhook endpoint safely fails closed. |
| `ALERT_WEBHOOK_URL` | Production | Optional | Yes (Server-Only) | Discord/Slack webhook URL for real-time dead-letter queue notifications. |
| `NEXT_PUBLIC_SITE_URL` | Production & Preview | **Yes** | Yes (Client-safe) | Canonical live domain (e.g. `https://sriammansupermarket.in`). |
| `NEXT_PUBLIC_SHOP_LAT` | Production & Preview | **Yes** | Yes (Client-safe) | Store latitude (`9.9252` for Madurai store). |
| `NEXT_PUBLIC_SHOP_LNG` | Production & Preview | **Yes** | Yes (Client-safe) | Store longitude (`78.1198` for Madurai store). |
| `NEXT_PUBLIC_SENTRY_DSN` | Production & Preview | Optional | Yes (Sanitized) | Sentry public DSN for client error tracking. |
| `SENTRY_DSN` | Production (Server-Only) | Optional | Yes (Sanitized) | Sentry server DSN for backend error logging. |
| `LOADTEST_BYPASS_SECRET` | **LEAVE UNSET IN PROD** | **NO** | Yes (Disabled if unset) | **Leave UNSET in Production.** When unset, all bypass attempts are completely ignored. |

---

## 2. Database Migration Runbook (Production Supabase)

Execute these 14 migration files in exact numerical order via Supabase SQL Editor or CI pipeline:

1. `supabase/migrations/20261028170100_create_roles_and_helpers.sql` — Creates `app_role` enum, `user_roles` table, and `is_admin()`, `is_rider()`, `has_role()` helper functions.
2. `supabase/migrations/20261028170200_create_riders_and_link_auth.sql` — Creates `riders` table, links auth users to rider profiles.
3. `supabase/migrations/20261028170300_create_audit_log_and_triggers.sql` — Creates `audit_log` table, immutable triggers on orders, products, user_roles.
4. `supabase/migrations/20261028170400_revoke_and_enable_rls.sql` — Revokes broad privileges, enables RLS on all tables, establishes strict row-level policies.
5. `supabase/migrations/20261028170500_secure_rpc_functions.sql` — Creates atomic RPCs `admin_assign_rider` and `rider_update_order_status` with state transition validation.
6. `supabase/migrations/20261028170600_storage_security_policies.sql` — Sets up storage buckets and access policies for product images.
7. `supabase/migrations/20261029100000_grant_helper_functions_to_authenticated.sql` — Grants helper functions to authenticated role.
8. `supabase/migrations/20261030100000_drop_legacy_open_policies.sql` — Drops legacy permissive development policies.
9. `supabase/migrations/20261030100100_add_orders_updated_at.sql` — Adds `updated_at` column and auto-touch trigger to `orders`.
10. `supabase/migrations/20261030100200_search_and_performance_tuning.sql` — Installs `pg_trgm`, `unaccent`, creates `search_products_fast` RPC with GIN index.
11. `supabase/migrations/20261031100000_fix_search_path_for_trgm_operators.sql` — Enforces immutable `search_path = public, extensions, pg_temp` on `search_products_fast`.
12. `supabase/migrations/20261102100000_make_search_products_fast_limit_first.sql` — Optimizes limit clause in `search_products_fast` for sub-50ms query execution.
13. `supabase/migrations/20261104110000_create_place_order_atomic.sql` — Creates server-only atomic order placement with row-locking (`FOR UPDATE`) on product_variants, stock deduction, and strict idempotency.
14. `supabase/migrations/20261105100000_high_concurrency_query_indexes.sql` — Adds composite B-Tree indexes on `orders(status, created_at DESC)`, `orders(user_id, created_at DESC)`, `orders(assigned_rider_id, status)`, `products(category, is_active)`, `products(is_active, stock_quantity)`, `order_items(order_id, product_id)`.

### Post-Migration Verification Commands
Execute in the Supabase SQL Editor:
```sql
-- 1. Verify extensions
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_trgm', 'unaccent');

-- 2. Run RLS Checks (Safe transaction - rolls back automatically)
-- Copy and run supabase/tests/rls-checks.sql (Expect 43+ PASS results)

-- 3. Run Search Checks
-- Copy and run supabase/tests/search-checks.sql (Expect 10 PASS results)

-- 4. Apply Thanglish & Tamil Search Aliases
-- Copy and run supabase/seed-thanglish-aliases.sql
```

### RPC Access Matrix: Verified Permissions

| RPC Stored Function | Executable by `anon`? | Executable by `authenticated`? | Executable by `service_role`? | Security Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :--- |
| `search_products_fast` | **YES** | **YES** | **YES** | Public catalog read-only search via GIN trigram index. Sub-50ms execution. |
| `place_order_atomic` | **NO (404/Revoked)** | **NO (404/Revoked)** | **YES** | Explicitly revoked from PUBLIC/anon/authenticated. Server-only execution via Next.js `/api/orders`. |
| `admin_assign_rider` | **NO (404/Revoked)** | Conditioned | **YES** | Requires `public.is_admin()` check. Throws 42501 SQL exception if unauthorized. |
| `rider_update_order_status` | **NO (404/Revoked)** | Conditioned | **YES** | Requires `public.is_rider()` check and assignment verification. Throws 42501 SQL exception. |

---

## 3. Security Audit & Protection Layers

1. **Row Level Security (RLS):**
   - Active on all 9 tables in schema `public`.
   - Default policy revokes all access from `anon` and `authenticated`.
   - Customers can only read and insert their own orders (`auth.uid() = user_id`).
   - Staff roles (`admin`, `rider`) verified via `public.user_roles` table using `security_definer` helper functions with immutable `search_path`.
2. **Server-Side Role Authentication (`src/lib/serverAuth.ts`):**
   - Admin and rider routes execute `supabase.auth.getUser()`, cryptographically verifying JWTs with the Supabase Auth server (rejects forged/tampered client cookies).
   - Multi-role segregation ensures an authenticated customer cannot call `/api/admin` or `/api/rider`.
3. **Sliding-Window Rate Limiting (`src/lib/rateLimit.ts`):**
   - Login: 5 attempts per 15 minutes per IP + username, then a 15-minute lockout.
   - Customer OTP: 3 per 10 minutes per phone, 10 per hour per IP.
   - Place Order: 5 per minute per user/IP.
   - Catalog & Search: 60 per minute per IP.
   - Admin & Rider APIs: 120 per minute per user.
   - Fails open for read-only catalog routes if Redis is temporarily unreachable; fails closed for login, OTP, and orders.
4. **Security Headers & CSP (`next.config.js`):**
   - `Content-Security-Policy`: Permits Supabase auth, Google login, Unsplash media, Sentry ingestion, and Cloudflare Turnstile while forbidding unauthorized scripts and iframe embedding.
   - `HSTS`: `max-age=63072000; includeSubDomains; preload`.
   - `X-Frame-Options: DENY` (anti-clickjacking).
   - `X-Content-Type-Options: nosniff`.
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(self)`.
5. **PII Masking & Log Sanitization:**
   - Active in `src/lib/logger.ts` and `src/lib/sentrySanitizer.ts`.
   - Masks customer phone numbers (`+91******3210`), bearer JWTs, passwords, and authorization headers in all console and Sentry events.
   - Unhandled exceptions return generic sanitized error objects `{ error: "Internal Server Error", requestId }` without leaking stack traces or database schema names.

---

## 4. Orders, Payments, & Concurrency Safety

1. **Idempotency End-to-End:**
   - Client sends UUID `idempotencyKey` with every checkout request.
   - `place_order_atomic` checks `orders.idempotency_key`. If an order exists, it immediately returns the original order without recreating records or re-charging inventory.
2. **Authoritative Server Pricing:**
   - Client pricing is completely discarded on the server.
   - Server re-fetches product variant prices from catalog/database, calculates subtotal, enforces coupon rules (`AMMAN50`, `FREEDEL`, `MALIGAI100`), calculates delivery fees based on order value, and computes final total.
3. **Concurrency & Negative Stock Prevention:**
   - `place_order_atomic` locks inventory rows with `SELECT ... FOR UPDATE` on `product_variants`.
   - If stock is insufficient, the entire transaction rolls back cleanly with `Insufficient stock for product`. Stock cannot drop below 0 under high concurrent demand.
4. **Payment vs Order Write Desync Handling:**
   - COD orders are saved immediately with `payment_status = 'pending'`.
   - Online payments verify HMAC-SHA256 signatures via constant-time comparison (`crypto.timingSafeEqual`).
   - Webhook events are logged in `webhook_events` to reject replay attacks.
   - If a payment succeeds but the order write fails, the incident is placed into the dead-letter queue with `ALERT_WEBHOOK_URL` notification for manual staff reconciliation.
5. **Order Lifecycle State Machine:**
   - Valid rider progression: `0 (Placed) / 1 (Packed)` -> `2 (On Route)` -> `3 (Delivered)`.
   - Regressions (e.g. `Delivered` -> `Placed`) and editing financial sums are blocked by database constraints.

---

## 5. Infrastructure, Reliability, & Disaster Recovery

1. **Health Check Monitoring (`/api/health`):**
   - Probes database responsiveness with an indexed query (`products.select('id').limit(1)`).
   - Returns HTTP 200 with latency (< 25 ms), heap memory, and uptime.
   - Configure UptimeRobot (Free plan) to ping `/api/health` every 5 minutes.
2. **Automated Weekly Backups:**
   - Use `scripts/db-backup.sh` (or `scripts/db-backup.js`) to take custom-format PostgreSQL dumps (`pg_dump -Fc -Z 9`).
   - Retain 30 days of timestamped snapshots.
   - Verified restore test command:
     ```bash
     pg_restore --clean --if-exists --no-owner --no-privileges -d "$DATABASE_URL" backups/supabase_backup_YYYYMMDD_HHMMSS.dump
     ```
3. **Rollback Procedures:**
   - **Vercel Deployments:** Instant rollback in Vercel Dashboard -> Deployments -> click previous deployment -> "Promote to Production" (< 60 seconds).
   - **Database Rollback:** Apply scripts in `supabase/rollbacks/` in reverse numerical order (e.g. `20261105100000_rollback_...`, `20261104110000_rollback_...`).

---

## 6. Catalog Data & Search Aliases

1. **Catalog Integrity Audit:**
   - Current catalog contains **36 verified products** across **8 categories**.
   - 100% of products have verified high-resolution images.
   - 100% of products have non-zero pricing and variant packages.
   - 100% of products have bilingual English and Tamil names (`nameEn`, `nameTa`).
2. **Missing Aliases & Proposed Migration:**
   - `small-onions`: Add `ulli`, `chinna ulli`, `sambar ulli` to `search_aliases`.
   - Proposed expansion products for Madurai kitchen staples:
     - White Sugar / Sakkarai (`sakkarai`, `seeni`, `sugar`)
     - Jaggery / Vellam (`vellam`, `mandai vellam`, `achu vellam`, `karupatti`)
     - Mustard Seeds / Kadugu (`kadugu`, `mustard`)
     - Cumin Seeds / Seeragam (`seeragam`, `jeeragam`, `cumin`)
     - Garlic / Poondu (`poondu`, `vellai poondu`, `garlic`)
     - Ginger / Inji (`inji`, `ginger`)
     - Black Pepper / Milagu (`milagu`, `pepper`)

---

## 7. SEO, PWA, & Accessibility

1. **SEO:**
   - `robots.ts` correctly permits crawler access to public pages while blocking `/admin`, `/rider`, `/api/`, and `/checkout`.
   - `sitemap.ts` generates daily URLs for homepage and all 8 category routes.
2. **PWA:**
   - `public/manifest.json` configured with brand green `#76CA3E`, app icons, and `display: standalone`.
   - Service worker (`public/sw.js`) caches core static assets and provides `public/offline.html` when network connectivity drops.
3. **Accessibility:**
   - Contrast calculation: White text on `#76CA3E` apple green yields **2.04:1** (fails WCAG AA). Deep forest green text (`#143B0D`, `text-brand-forest`) yields **6.14:1** (passes WCAG AAA).
   - All primary checkout buttons in `CartDrawer.tsx` already utilize `text-brand-forest` on `bg-brand-primary` for high contrast.
   - Touch targets for mobile shopping conform to the 44x44 px minimum recommendation.

---

## 8. Manual Steps for the Store Owner (Outside Codebase)

Before opening the storefront to live shoppers, complete these account and configuration steps:

1. **Vercel Dashboard:**
   - Upgrade team to **Vercel Pro** ($20/mo) for commercial use.
   - Set all Production environment variables from the Section 1 table.
   - Verify `LOADTEST_BYPASS_SECRET` is deleted/unset.
   - Add custom domain `sriammansupermarket.in` (and `www`) and configure DNS records (A record to `76.76.21.21` or CNAME to `cname.vercel-dns.com`).
2. **Supabase Dashboard (Production Project):**
   - Create a dedicated **Production Supabase project** (e.g. `sri-amman-prod`).
   - Upgrade to **Supabase Pro** ($25/mo) for daily automatic backups, 7-day PITR, and no inactivity pausing.
   - Run the 14 migrations in Section 2 via the SQL Editor.
   - Run `supabase/tests/rls-checks.sql` and `supabase/tests/search-checks.sql` to verify integrity.
   - Run `supabase/seed-thanglish-aliases.sql` to populate search keywords.
   - Under `Authentication -> Providers`, enable Google OAuth and configure Client ID / Client Secret from Google Cloud Console.
   - Under `Authentication -> URL Configuration`, set Site URL to `https://sriammansupermarket.in` and add Redirect URL `https://sriammansupermarket.in/**`.
3. **Payment Gateway (Razorpay / Cashfree / Stripe):**
   - Complete KYC and bank account verification for Sri Amman Supermarket.
   - Generate Live API Key and Key Secret.
   - Configure Webhook URL: `https://sriammansupermarket.in/api/webhooks/payment`.
   - Select events: `payment.captured`, `payment.failed`, `order.paid`.
   - Copy Webhook Secret and add to Vercel as `PAYMENT_WEBHOOK_SECRET`.
4. **Monitoring & Incident Response:**
   - Create a free account at [sentry.io](https://sentry.io), create project "amman-grocery-web", and copy DSNs to Vercel.
   - Create a free account at [uptimerobot.com](https://uptimerobot.com), add HTTP monitor for `https://sriammansupermarket.in/api/health` with a 5-minute interval and SMS/email alerts.
5. **Google Business Profile:**
   - Claim and verify the physical Google Business profile for Sri Amman Supermarket in Madurai.
   - Link website URL to `https://sriammansupermarket.in`.
