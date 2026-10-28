# Supabase Database Migrations & Security Hardening Guide

**Project:** Sri Amman Supermarket (Madurai)  
**Branch:** `backend-hardening`  
**Target:** Supabase PostgreSQL Database (Staging / Production)  

---

## 1. Overview & Architecture

This directory contains version-controlled SQL migrations designed to transition the database from anonymous client access to **Supabase Auth** with least-privilege **Row Level Security (RLS)**, dedicated **Roles**, and **Tamper-Resistant RPC Functions**.

### Key Protections Enforced:
1. **Roles Table (`public.user_roles`)**: Strict role separation (`admin`, `rider`, `customer`). Cannot be modified or escalated by clients.
2. **Identity Links**: `orders` and `addresses` are keyed to `auth.users(id)`. Riders are keyed to `auth.users(id)` and identified by unique lowercase `username`.
3. **Least Privilege**: Global `REVOKE ALL` from `anon` and `authenticated`, followed by explicit, scoped grants.
4. **Isolated RLS Policies**: Customers cannot read or touch other customers' orders or addresses.
5. **Secure State Transitions**: Riders cannot directly edit the `orders` table; order status changes must pass through `public.rider_update_order_status()`, which enforces state machine rules and locks the order row.
6. **Audit Trail**: Every change to sensitive tables (`products`, `variants`, `orders`, `riders`, `user_roles`, `flags`) is logged via `public.audit_log` with actor identity and redacted secrets.

---

## 2. Migration Execution Order

Open the **SQL Editor** in your Supabase project dashboard and execute each migration script in sequential order:

| Step | Migration File | Purpose & Action |
| :---: | :--- | :--- |
| **1** | `supabase/migrations/20261028170100_create_roles_and_helpers.sql` | Creates `public.user_roles` table, role helper functions (`app_role()`, `is_admin()`, `is_rider()`), and auto-assigns `'customer'` role to new auth users on sign up. |
| **2** | `supabase/migrations/20261028170200_create_riders_and_link_auth.sql` | Creates `public.riders` table, adds `user_id` & `assigned_rider_id` to `orders`, adds `user_id` to `addresses`, and adds performance indexes. |
| **3** | `supabase/migrations/20261028170300_create_audit_log_and_triggers.sql` | Creates `public.audit_log` table with RLS (admin-only view) and attaches automatic audit triggers to sensitive tables. |
| **4** | `supabase/migrations/20261028170400_revoke_and_enable_rls.sql` | Revokes broad privileges, enables RLS across all tables in `public`, defines customer/rider/admin access policies, and sets `security_invoker = true` on views. |
| **5** | `supabase/migrations/20261028170500_secure_rpc_functions.sql` | Deploys `rider_update_order_status` and `admin_assign_rider` functions with strict authorization checks and concurrency row locking. |
| **6** | `supabase/migrations/20261028170600_storage_security_policies.sql` | Provisions `product-images` storage bucket (5MB limit, image MIME types only) with public read and admin-only upload/delete policies. |

---

## 3. Post-Migration Verification & Seeding

### Step A: Run Automated RLS Verification Suite
Run `supabase/tests/rls-checks.sql` in the Supabase SQL Editor.
- Simulates `anon`, `Customer A`, `Customer B`, `Rider`, and `Admin`.
- Validates IDOR prevention, data isolation, and status transition rules.
- Automatically rolls back at the end, leaving no test junk in the database.

### Step B: Seed Admin & Rider Roles
Run `supabase/seed-staging-roles.sql` after substituting your placeholder values:
1. Create your admin user in **Supabase Dashboard &rarr; Authentication &rarr; Users**.
2. Replace `'REPLACE_WITH_ADMIN_EMAIL'` with your admin's email.
3. Replace `'REPLACE_WITH_RIDER_USERNAME'` with the rider username (e.g., `muthukumar`).
4. Execute the script to promote the users.

---

## 4. Rollback Instructions

If you need to roll back the migrations, run the corresponding rollback scripts in **reverse order**:

1. `supabase/rollbacks/20261028170600_rollback_storage_security_policies.sql`
2. `supabase/rollbacks/20261028170500_rollback_secure_rpc_functions.sql`
3. `supabase/rollbacks/20261028170400_rollback_revoke_and_enable_rls.sql`
4. `supabase/rollbacks/20261028170300_rollback_audit_log_and_triggers.sql`
5. `supabase/rollbacks/20261028170200_rollback_riders_and_link_auth.sql`
6. `supabase/rollbacks/20261028170100_rollback_roles_and_helpers.sql`

---

## 5. Notes on Client App Impact
Once these migrations are applied to a database, anonymous direct writes to `addresses` and `orders` from client browsers will be rejected by PostgreSQL RLS. The frontend and API routes must be updated in the next phase to authenticate with Supabase Auth session tokens.
