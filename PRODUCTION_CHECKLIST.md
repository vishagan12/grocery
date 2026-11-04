# Production Deployment & Operational Readiness Checklist
**Project:** Sri Amman Supermarket (Madurai) Quick-Commerce  
**Architecture:** Next.js 14 App Router + Supabase PostgreSQL + Upstash Redis  
**Branch:** `opus-review`

---

## 1. Environment Variables Audit

Verify that all required environment variables are set in production (e.g. Vercel, Docker, or Cloud VM):

| Variable | Scope | Required | Description |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client + Server) | **Yes** | Supabase project URL (`https://<ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client + Server) | **Yes** | Supabase Anon public key. Respects RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only (Secret)** | **Yes** | Server-privileged key for atomic order processing & migrations. **NEVER expose to client browser or commit to git.** |
| `UPSTASH_REDIS_REST_URL` | **Server-Only (Secret)** | **Yes** | Upstash Redis REST endpoint for distributed sliding-window rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | **Server-Only (Secret)** | **Yes** | Upstash Redis REST access token. |
| `DATABASE_URL` | **Server-Only (Secret)** | **Yes** | Direct or Session pooler PostgreSQL URI for migrations and weekly `pg_dump` backups. |
| `ALERT_WEBHOOK_URL` | **Server-Only (Secret)** | Optional | Slack/Discord webhook URL for critical security & dead-letter queue alerts. |
| `NEXT_PUBLIC_APP_URL` | Public (Client + Server) | **Yes** | Canonical production domain (e.g. `https://sriamman.com`). |

---

## 2. Pre-Deployment Database Verification

Before routing production traffic:
1. **Apply Migrations in Sequential Order**:
   Execute migrations 1 through 13 in `supabase/migrations/` sequentially via Supabase SQL Editor or CI/CD runner.
2. **Execute RLS Verification Suite**:
   Run `supabase/tests/rls-checks.sql` in Supabase SQL Editor. Confirm all tests report **PASS** and transaction safely rolls back.
3. **Execute Search Performance Suite**:
   Run `supabase/tests/search-checks.sql` in Supabase SQL Editor. Verify `search_products_fast` handles Tamil, Thanglish, typos, and broad queries with GIN Bitmap Index Scans under 50-150 ms.
4. **Seed Role Credentials**:
   Assign initial administrative staff and rider accounts in `user_roles` using `supabase/seed-staging-roles.sql`.

---

## 3. Production Deployment Steps

1. **Clean Production Build**:
   ```bash
   npm run build
   ```
   Confirm exit code 0, 0 type errors, and all routes properly mapped.
2. **Execute Automated Test Suites**:
   ```bash
   npx tsx --test tests/rate-limiting.test.ts tests/order-concurrency.test.ts tests/auth-security.test.ts tests/reliability.test.ts
   ```
   Confirm 18/18 tests pass.
3. **Deploy Web Application**:
   Deploy build artifact to hosting platform (Vercel, AWS ECS, or Node runtime).
4. **Verify Live Health Check Endpoint**:
   ```bash
   curl -f -s https://sriamman.com/api/health | jq .
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "database": "connected",
     "service": "sri-amman-supermarket",
     "latencyMs": 42
   }
   ```
5. **Set Up Scheduled Weekly Backups**:
   Schedule the backup cron job on the ops host or GitHub Actions:
   ```cron
   0 2 * * 0 cd /srv/amman-grocery && DATABASE_URL="..." ./scripts/db-backup.sh >> ./backups/cron.log 2>&1
   ```

---

## 4. Disaster Recovery & Rollback Procedure

In the event of critical regressions, failed releases, or data anomalies:

### Web Application Rollback
- **Hosting Provider Rollback**: Roll back to previous deployment commit hash immediately via Vercel Dashboard / Container tag deployment (< 60 seconds).

### Database Migration Rollback
Execute the rollback scripts in `supabase/rollbacks/` in strict reverse order:
1. `supabase/rollbacks/20261104110000_rollback_create_place_order_atomic.sql`
2. `supabase/rollbacks/20261102100000_rollback_make_search_products_fast_limit_first.sql`
3. `supabase/rollbacks/20261031100000_rollback_fix_search_path_for_trgm_operators.sql`
4. `supabase/rollbacks/20261030100200_rollback_search_and_performance_tuning.sql`
5. `supabase/rollbacks/20261030100100_rollback_add_orders_updated_at.sql`
6. `supabase/rollbacks/20261030100000_rollback_drop_legacy_open_policies.sql`
7. `supabase/rollbacks/20261029100000_rollback_grant_helper_functions_to_authenticated.sql`
8. `supabase/rollbacks/20261028170600_rollback_storage_security_policies.sql`
9. `supabase/rollbacks/20261028170500_rollback_secure_rpc_functions.sql`
10. `supabase/rollbacks/20261028170400_rollback_revoke_and_enable_rls.sql`
11. `supabase/rollbacks/20261028170300_rollback_audit_log_and_triggers.sql`
12. `supabase/rollbacks/20261028170200_rollback_riders_and_link_auth.sql`
13. `supabase/rollbacks/20261028170100_rollback_roles_and_helpers.sql`

### Snapshot Recovery Test
Restore from the most recent weekly backup snapshot:
```bash
pg_restore --clean --if-exists --no-owner --no-privileges -d "$DATABASE_URL" backups/supabase_backup_YYYYMMDD_HHMMSS.dump
```
