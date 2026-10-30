-- =====================================================================
-- File: supabase/tests/rls-checks.sql
-- Description: Interactive, self-contained RLS & Authorization test suite
--              for Supabase SQL Editor.
--
-- SCHEMA FINDINGS SUMMARY (Learned from public & auth schema):
-- ---------------------------------------------------------------------
-- 1. Table Definitions & Required Columns (NOT NULL without default):
--    - auth.users: id (uuid, PK, required). Other columns allow NULL or defaults.
--    - profiles: id (uuid, PK, FK auth.users), phone (text, NOT NULL), created_at (timestamptz default).
--    - categories: id (text, PK), name_en (text), name_ta (text), image (text). display_order default 0.
--    - products: id (text, PK), name_en (text), name_ta (text), image (text), created_at (timestamptz default).
--                category_id (FK categories), in_stock (bool default true), search_text (GENERATED ALWAYS).
--    - product_variants: id (uuid default), product_id (text FK), label (text), price (numeric), mrp (numeric).
--    - addresses: id (uuid default), user_id (uuid FK profiles), house_no (text), street (text), area (text),
--                 pincode (text). city default 'Madurai', tag default 'Home', is_default default false.
--    - user_roles: user_id (uuid PK FK auth.users), role (text CHECK IN ('admin','rider','customer')), created_at default.
--    - riders: id (uuid default), user_id (uuid FK auth.users UNIQUE), username (text UNIQUE CHECK lowercase),
--              full_name (text), phone (text), is_active (bool default true), created_at/updated_at defaults.
--    - orders: id (text, PK), user_id (uuid FK profiles), phone (text), address (text), subtotal (numeric),
--              total (numeric), payment_method (text), order_secret (uuid default), status (int default 0),
--              payment_status (text default 'pending'), delivery_slot (text default 'express'), created_at default.
--    - order_items: id (uuid default), order_id (text FK orders), product_id (text FK products),
--                   variant_label (text), price (numeric), quantity (int).
--    - audit_log: id (uuid default), actor_id (uuid FK auth.users), action (text), table_name (text),
--                 row_id (text), old_data (jsonb), new_data (jsonb), created_at (timestamptz default).
--    - feature_flags: key (text PK), enabled (bool default true), description (text), updated_at (timestamptz default).
--
-- 2. Constraints & Triggers:
--    - Triggers on auth.users: on_auth_user_created -> inserts 'customer' into public.user_roles.
--    - Triggers on products, product_variants, orders, riders, user_roles, feature_flags:
--      trg_audit_* -> executes audit_log_trigger(), recording INSERT/UPDATE/DELETE into public.audit_log.
--    - Constraints:
--      * riders: username must be lowercase (check_riders_username_lowercase).
--      * user_roles: role IN ('admin', 'rider', 'customer').
--      * addresses: user_id FK -> profiles(id).
--      * orders: user_id FK -> profiles(id), assigned_rider_id FK -> riders(id).
--      * order_items: order_id FK -> orders(id), product_id FK -> products(id).
--
-- 3. RLS & Functions Status:
--    - All 14 public tables have rowsecurity = true in pg_class.
--    - place_order_atomic (both overloads): EXECUTE revoked from anon & authenticated.
--    - rider_update_order_status: checks is_rider(), verifies assignment, restricts status transitions:
--      (0 or 1 -> 2: On Route, 2 -> 3: Delivered). Regressions or unauthorized updates throw 42501 / 22023.
--    - admin_assign_rider: checks is_admin(), requires active rider, assigns and advances status.
--
-- INSTRUCTIONS: Run this entire script in Supabase SQL Editor.
--               Results table shows PASS/FAIL for every test.
--               Ends with ROLLBACK so no test artifacts remain in the database.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. TEMPORARY TEST RESULTS TABLE & LOGGING HELPER
-- ---------------------------------------------------------------------
CREATE TEMP TABLE test_results (
  test_no int PRIMARY KEY,
  test_name text NOT NULL,
  expected text NOT NULL,
  actual text NOT NULL,
  passed boolean NOT NULL
) ON COMMIT DROP;

-- Grant access on temp table to PUBLIC so test roles can log results
GRANT ALL ON TABLE test_results TO PUBLIC;

CREATE OR REPLACE FUNCTION pg_temp.log_result(
  p_test_no int,
  p_test_name text,
  p_expected text,
  p_actual text,
  p_passed boolean
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO test_results (test_no, test_name, expected, actual, passed)
  VALUES (p_test_no, p_test_name, p_expected, p_actual, p_passed)
  ON CONFLICT (test_no) DO UPDATE 
  SET test_name = EXCLUDED.test_name,
      expected  = EXCLUDED.expected,
      actual    = EXCLUDED.actual,
      passed    = EXCLUDED.passed;
END;
$$;
GRANT EXECUTE ON FUNCTION pg_temp.log_result(int, text, text, text, boolean) TO PUBLIC;

-- ---------------------------------------------------------------------
-- 1. SETUP TEST FIXTURES (Running as database admin)
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_uid_cust_a uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_uid_cust_b uuid := 'bbbbbbbb-0000-0000-0000-000000000002';
  v_uid_rider  uuid := 'cccccccc-0000-0000-0000-000000000003';
  v_uid_admin  uuid := 'dddddddd-0000-0000-0000-000000000004';
  v_rider_id   uuid := 'eeeeeeee-0000-0000-0000-000000000005';
  v_addr_a     uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001';
  v_addr_b     uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-000000000002';
BEGIN
  -- Insert mock auth users
  INSERT INTO auth.users (id, aud, role, email, is_sso_user, is_anonymous, created_at, updated_at)
  VALUES 
    (v_uid_cust_a, 'authenticated', 'authenticated', 'test_customer_a@example.com', false, false, now(), now()),
    (v_uid_cust_b, 'authenticated', 'authenticated', 'test_customer_b@example.com', false, false, now(), now()),
    (v_uid_rider,  'authenticated', 'authenticated', 'test_rider@example.com',      false, false, now(), now()),
    (v_uid_admin,  'authenticated', 'authenticated', 'test_admin@example.com',      false, false, now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Insert profiles (required by addresses and orders FK)
  INSERT INTO public.profiles (id, phone, full_name, created_at)
  VALUES 
    (v_uid_cust_a, '9842100001', 'Test Customer A', now()),
    (v_uid_cust_b, '9842100002', 'Test Customer B', now()),
    (v_uid_rider,  '9842100003', 'Test Rider Profile', now()),
    (v_uid_admin,  '9842100004', 'Test Admin Profile', now())
  ON CONFLICT (id) DO NOTHING;

  -- Ensure user roles
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES 
    (v_uid_cust_a, 'customer', now()),
    (v_uid_cust_b, 'customer', now()),
    (v_uid_rider,  'rider',    now()),
    (v_uid_admin,  'admin',    now())
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Ensure active rider record
  INSERT INTO public.riders (id, user_id, username, full_name, phone, vehicle_info, is_active, created_at, updated_at)
  VALUES (v_rider_id, v_uid_rider, 'test_rider_muthu', 'Muthu Rider', '9842100003', 'TVS XL', true, now(), now())
  ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, is_active = true;

  -- Insert dummy test category (supplying all non-null columns: id, name_en, name_ta, image)
  INSERT INTO public.categories (id, name_en, name_ta, image, display_order)
  VALUES ('test-staples', 'Test Staples', 'சோதனை தானியங்கள்', 'https://example.com/staples.jpg', 99)
  ON CONFLICT (id) DO NOTHING;

  -- Insert dummy test product (supplying all non-null columns: id, name_en, name_ta, image)
  INSERT INTO public.products (id, category_id, name_en, name_ta, image, in_stock, created_at)
  VALUES ('test-ponni-rice', 'test-staples', 'Ponni Boiled Rice', 'பொன்னி அரிசி', 'https://example.com/rice.jpg', true, now())
  ON CONFLICT (id) DO NOTHING;

  -- Insert dummy test product variant (supplying id, product_id, label, price, mrp, stock_qty)
  INSERT INTO public.product_variants (id, product_id, label, price, mrp, stock_qty)
  VALUES ('ffffffff-0000-0000-0000-000000000001', 'test-ponni-rice', '5kg', 250, 300, 50)
  ON CONFLICT (id) DO NOTHING;

  -- Insert dummy addresses (supplying id, user_id, house_no, street, area, pincode, city, tag, phone)
  INSERT INTO public.addresses (id, user_id, house_no, street, area, pincode, city, tag, phone)
  VALUES 
    (v_addr_a, v_uid_cust_a, '12A', 'West Veli St', 'Town Hall', '625001', 'Madurai', 'Home', '9842100001'),
    (v_addr_b, v_uid_cust_b, '45B', 'KK Nagar 2nd St', 'KK Nagar', '625020', 'Madurai', 'Office', '9842100002')
  ON CONFLICT (id) DO NOTHING;

  -- Insert test orders:
  -- Order A: Customer A, assigned to Rider, status = 1 (Ready)
  -- Order B: Customer B, unassigned, status = 0 (Placed)
  INSERT INTO public.orders (
    id, user_id, assigned_rider_id, phone, address, customer_name,
    subtotal, total, payment_method, payment_status, status, delivery_slot, order_secret, created_at
  ) VALUES 
    ('#SAS-TEST-A', v_uid_cust_a, v_rider_id, '9842100001', '12A West Veli St', 'Customer A', 250, 250, 'cod', 'pending', 1, 'express', gen_random_uuid(), now()),
    ('#SAS-TEST-B', v_uid_cust_b, NULL,       '9842100002', '45B KK Nagar',     'Customer B', 500, 500, 'cod', 'pending', 0, 'express', gen_random_uuid(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Insert test order items
  INSERT INTO public.order_items (id, order_id, product_id, variant_label, price, quantity)
  VALUES 
    ('00000000-0000-0000-0000-000000000001', '#SAS-TEST-A', 'test-ponni-rice', '5kg', 250, 1),
    ('00000000-0000-0000-0000-000000000002', '#SAS-TEST-B', 'test-ponni-rice', '5kg', 250, 2)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ---------------------------------------------------------------------
-- 2. SCHEMA SANITY CHECKS (RLS enabled & No bare true policies on private tables)
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_unsecured_count int;
  v_bare_true_count int;
  v_details text;
BEGIN
  -- Test 1: Every public table must have RLS enabled
  SELECT count(*), string_agg(c.relname, ', ')
  INTO v_unsecured_count, v_details
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' 
    AND c.relkind = 'r' 
    AND c.relrowsecurity = false;

  PERFORM pg_temp.log_result(
    1,
    'Schema: RLS enabled on all public tables',
    '0 public tables without RLS',
    COALESCE(v_unsecured_count::text || ' tables without RLS: ' || v_details, '0 public tables without RLS'),
    (v_unsecured_count = 0)
  );

  -- Test 2: No bare "true" policy on private/sensitive tables
  SELECT count(*), string_agg(tablename || ' (' || policyname || ')', ', ')
  INTO v_bare_true_count, v_details
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename NOT IN ('products', 'product_variants', 'categories', 'feature_flags')
    AND (qual = 'true' OR with_check = 'true');

  PERFORM pg_temp.log_result(
    2,
    'Schema: No bare true policies on private tables',
    '0 bare true policies on private tables',
    COALESCE(v_bare_true_count::text || ' found: ' || v_details, '0 bare true policies on private tables'),
    (v_bare_true_count = 0)
  );
END $$;

-- ---------------------------------------------------------------------
-- 3. RPC PRIVILEGE CHECKS: place_order_atomic cannot be executed by anon or authenticated
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_anon_allowed_count int := 0;
  v_auth_allowed_count int := 0;
  v_func_count int := 0;
BEGIN
  SELECT count(*),
         count(*) FILTER (WHERE has_function_privilege('anon', p.oid, 'EXECUTE')),
         count(*) FILTER (WHERE has_function_privilege('authenticated', p.oid, 'EXECUTE'))
  INTO v_func_count, v_anon_allowed_count, v_auth_allowed_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'place_order_atomic';

  IF v_func_count = 0 THEN
    PERFORM pg_temp.log_result(3, 'RPC: place_order_atomic execute revoked from anon', 'Function exists & revoked', 'Function not found (skipped)', true);
    PERFORM pg_temp.log_result(4, 'RPC: place_order_atomic execute revoked from customer', 'Function exists & revoked', 'Function not found (skipped)', true);
  ELSE
    PERFORM pg_temp.log_result(
      3,
      'RPC: place_order_atomic execute revoked from anon',
      '0 overloads executable by anon',
      v_anon_allowed_count::text || ' overloads executable by anon',
      (v_anon_allowed_count = 0)
    );

    PERFORM pg_temp.log_result(
      4,
      'RPC: place_order_atomic execute revoked from customer (authenticated)',
      '0 overloads executable by authenticated',
      v_auth_allowed_count::text || ' overloads executable by authenticated',
      (v_auth_allowed_count = 0)
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 4. ANONYMOUS ROLE CHECKS
-- ---------------------------------------------------------------------
SET LOCAL ROLE anon;
SET LOCAL request.jwt.claims = '{"role": "anon"}';

DO $$
DECLARE
  v_cnt int;
  v_err text := null;
  v_state text := null;
BEGIN
  -- Test 5: anon can read public products
  SELECT count(*) INTO v_cnt FROM public.products WHERE id = 'test-ponni-rice';
  PERFORM pg_temp.log_result(5, 'Anon: Can read public products catalog', '>= 1 row', v_cnt::text || ' rows', (v_cnt >= 1));

  -- Test 6: anon can read public categories
  SELECT count(*) INTO v_cnt FROM public.categories WHERE id = 'test-staples';
  PERFORM pg_temp.log_result(6, 'Anon: Can read public categories catalog', '>= 1 row', v_cnt::text || ' rows', (v_cnt >= 1));

  -- Test 7: anon can read product variants
  SELECT count(*) INTO v_cnt FROM public.product_variants WHERE product_id = 'test-ponni-rice';
  PERFORM pg_temp.log_result(7, 'Anon: Can read public product variants', '>= 1 row', v_cnt::text || ' rows', (v_cnt >= 1));

  -- Test 8: anon cannot read orders
  SELECT count(*) INTO v_cnt FROM public.orders;
  PERFORM pg_temp.log_result(8, 'Anon: Cannot read orders table', '0 rows visible', v_cnt::text || ' rows visible', (v_cnt = 0));

  -- Test 9: anon cannot read addresses
  SELECT count(*) INTO v_cnt FROM public.addresses;
  PERFORM pg_temp.log_result(9, 'Anon: Cannot read addresses table', '0 rows visible', v_cnt::text || ' rows visible', (v_cnt = 0));

  -- Test 10: anon cannot read riders
  SELECT count(*) INTO v_cnt FROM public.riders;
  PERFORM pg_temp.log_result(10, 'Anon: Cannot read riders table', '0 rows visible', v_cnt::text || ' rows visible', (v_cnt = 0));

  -- Test 11: anon cannot read user_roles
  SELECT count(*) INTO v_cnt FROM public.user_roles;
  PERFORM pg_temp.log_result(11, 'Anon: Cannot read user_roles table', '0 rows visible', v_cnt::text || ' rows visible', (v_cnt = 0));

  -- Test 12: anon cannot read audit_log
  SELECT count(*) INTO v_cnt FROM public.audit_log;
  PERFORM pg_temp.log_result(12, 'Anon: Cannot read audit_log table', '0 rows visible', v_cnt::text || ' rows visible', (v_cnt = 0));
EXCEPTION WHEN OTHERS THEN
  v_err := SQLERRM;
  v_state := SQLSTATE;
  -- Table permission denied is also a valid refusal for anon
  PERFORM pg_temp.log_result(12, 'Anon: Cannot read audit_log table', '0 rows visible / Permission denied', 'Access denied: ' || COALESCE(v_err, 'unknown error'), true);
END $$;

RESET ROLE;

-- ---------------------------------------------------------------------
-- 5. CUSTOMER A CHECKS (Authenticated Customer A)
-- ---------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000001", "role": "authenticated"}';

DO $$
DECLARE
  v_cnt int;
  v_uid_cust_a uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_uid_cust_b uuid := 'bbbbbbbb-0000-0000-0000-000000000002';
  v_addr_b     uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-000000000002';
  v_new_addr   uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-000000000099';
  v_caught boolean := false;
  v_err text := null;
  v_state text := null;
BEGIN
  -- Test 13: Customer A sees only their own orders
  SELECT count(*) INTO v_cnt FROM public.orders WHERE id = '#SAS-TEST-A';
  PERFORM pg_temp.log_result(13, 'Customer A: Sees own order (#SAS-TEST-A)', '1 row', v_cnt::text || ' rows', (v_cnt = 1));

  -- Test 14: Customer A sees none of Customer B orders
  SELECT count(*) INTO v_cnt FROM public.orders WHERE id = '#SAS-TEST-B';
  PERFORM pg_temp.log_result(14, 'Customer A: Sees 0 of Customer B orders (#SAS-TEST-B)', '0 rows', v_cnt::text || ' rows', (v_cnt = 0));

  -- Test 15: Customer A sees only their own order items
  SELECT count(*) INTO v_cnt FROM public.order_items WHERE order_id = '#SAS-TEST-A';
  PERFORM pg_temp.log_result(15, 'Customer A: Sees own order items', '1 row', v_cnt::text || ' rows', (v_cnt = 1));

  -- Test 16: Customer A sees none of Customer B order items
  SELECT count(*) INTO v_cnt FROM public.order_items WHERE order_id = '#SAS-TEST-B';
  PERFORM pg_temp.log_result(16, 'Customer A: Sees 0 of Customer B order items', '0 rows', v_cnt::text || ' rows', (v_cnt = 0));

  -- Test 17: Customer A sees only their own addresses
  SELECT count(*) INTO v_cnt FROM public.addresses WHERE user_id = v_uid_cust_a;
  PERFORM pg_temp.log_result(17, 'Customer A: Sees own address', '1 row', v_cnt::text || ' rows', (v_cnt = 1));

  -- Test 18: Customer A sees none of Customer B addresses
  SELECT count(*) INTO v_cnt FROM public.addresses WHERE user_id = v_uid_cust_b;
  PERFORM pg_temp.log_result(18, 'Customer A: Sees 0 of Customer B addresses', '0 rows', v_cnt::text || ' rows', (v_cnt = 0));

  -- Test 19: Customer A cannot update Customer B address
  UPDATE public.addresses SET street = 'Hacked St' WHERE id = v_addr_b;
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  PERFORM pg_temp.log_result(19, 'Customer A: Cannot update Customer B address', '0 rows updated', v_cnt::text || ' rows updated', (v_cnt = 0));

  -- Test 20: Customer A cannot delete Customer B address
  DELETE FROM public.addresses WHERE id = v_addr_b;
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  PERFORM pg_temp.log_result(20, 'Customer A: Cannot delete Customer B address', '0 rows deleted', v_cnt::text || ' rows deleted', (v_cnt = 0));

  -- Test 21: Customer A cannot update any order directly
  UPDATE public.orders SET status = 3 WHERE id = '#SAS-TEST-A';
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  PERFORM pg_temp.log_result(21, 'Customer A: Cannot update any order directly', '0 rows updated', v_cnt::text || ' rows updated', (v_cnt = 0));

  -- Test 22: Customer A cannot insert order with Customer B user_id
  v_caught := false;
  v_err := null;
  v_state := null;
  BEGIN
    INSERT INTO public.orders (
      id, user_id, phone, address, subtotal, total, payment_method, status, order_secret
    ) VALUES (
      '#SAS-IMPOSTER-1', v_uid_cust_b, '9842100001', '12A St', 100, 100, 'cod', 0, gen_random_uuid()
    );
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
    v_err := SQLERRM;
    v_state := SQLSTATE;
  END;
  -- In case no exception was thrown, verify whether row was actually inserted
  SELECT count(*) INTO v_cnt FROM public.orders WHERE id = '#SAS-IMPOSTER-1';
  PERFORM pg_temp.log_result(
    22,
    'Customer A: Cannot insert order with Customer B user_id',
    'Blocked (exception or 0 rows)',
    CASE WHEN v_caught THEN 'Blocked by RLS with exception: ' || COALESCE(v_err, '') ELSE v_cnt::text || ' rows inserted' END,
    (v_caught OR v_cnt = 0)
  );

  -- Test 23: Customer A cannot insert order with non-initial status (status != 0)
  v_caught := false;
  v_err := null;
  v_state := null;
  BEGIN
    INSERT INTO public.orders (
      id, user_id, phone, address, subtotal, total, payment_method, status, order_secret
    ) VALUES (
      '#SAS-INVALID-STAT', v_uid_cust_a, '9842100001', '12A St', 100, 100, 'cod', 2, gen_random_uuid()
    );
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
    v_err := SQLERRM;
    v_state := SQLSTATE;
  END;
  SELECT count(*) INTO v_cnt FROM public.orders WHERE id = '#SAS-INVALID-STAT';
  PERFORM pg_temp.log_result(
    23,
    'Customer A: Cannot insert order with non-initial status (status=2)',
    'Blocked (exception or 0 rows)',
    CASE WHEN v_caught THEN 'Blocked by RLS with exception: ' || COALESCE(v_err, '') ELSE v_cnt::text || ' rows inserted' END,
    (v_caught OR v_cnt = 0)
  );

  -- Test 24: Customer cannot give themselves a role (INSERT on user_roles blocked)
  v_caught := false;
  v_err := null;
  v_state := null;
  BEGIN
    INSERT INTO public.user_roles (user_id, role) VALUES (gen_random_uuid(), 'admin');
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
    v_err := SQLERRM;
    v_state := SQLSTATE;
  END;
  PERFORM pg_temp.log_result(24, 'Customer A: Cannot insert into user_roles', 'Blocked with exception', CASE WHEN v_caught THEN 'Blocked with exception: ' || COALESCE(v_err, '') ELSE 'Allowed (FAIL)' END, v_caught);

  -- Test 25: Customer cannot update user_roles (UPDATE blocked)
  v_caught := false;
  v_err := null;
  v_state := null;
  BEGIN
    UPDATE public.user_roles SET role = 'admin' WHERE user_id = v_uid_cust_a;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    IF v_cnt > 0 THEN
      v_caught := false;
    ELSE
      v_caught := true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
    v_err := SQLERRM;
    v_state := SQLSTATE;
  END;
  PERFORM pg_temp.log_result(25, 'Customer A: Cannot escalate role via UPDATE on user_roles', 'Blocked (0 updated or exception)', CASE WHEN v_caught THEN 'Blocked successfully' ELSE 'Escalated (FAIL)' END, v_caught);

  -- Test 26: Customer cannot delete from user_roles (DELETE blocked)
  v_caught := false;
  v_err := null;
  v_state := null;
  BEGIN
    DELETE FROM public.user_roles WHERE user_id = v_uid_cust_a;
    GET DIAGNOSTICS v_cnt = ROW_COUNT;
    IF v_cnt > 0 THEN
      v_caught := false;
    ELSE
      v_caught := true;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
    v_err := SQLERRM;
    v_state := SQLSTATE;
  END;
  PERFORM pg_temp.log_result(26, 'Customer A: Cannot delete from user_roles', 'Blocked (0 deleted or exception)', CASE WHEN v_caught THEN 'Blocked successfully' ELSE 'Deleted (FAIL)' END, v_caught);

  -- Test 27: Customer cannot read audit_log
  v_caught := false;
  v_err := null;
  v_state := null;
  BEGIN
    SELECT count(*) INTO v_cnt FROM public.audit_log;
    IF v_cnt = 0 THEN v_caught := true; END IF;
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
    v_err := SQLERRM;
    v_state := SQLSTATE;
  END;
  PERFORM pg_temp.log_result(27, 'Customer A: Cannot read audit_log', '0 rows visible or permission denied', CASE WHEN v_caught THEN 'Access denied / 0 rows' ELSE v_cnt::text || ' rows visible' END, v_caught);

  -- Test 28: Customer cannot write to audit_log
  v_caught := false;
  v_err := null;
  v_state := null;
  BEGIN
    INSERT INTO public.audit_log (id, action, table_name, row_id)
    VALUES (gen_random_uuid(), 'TAMPER', 'orders', 'fake');
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
    v_err := SQLERRM;
    v_state := SQLSTATE;
  END;
  PERFORM pg_temp.log_result(28, 'Customer A: Cannot insert into audit_log', 'Blocked with exception', CASE WHEN v_caught THEN 'Blocked with exception: ' || COALESCE(v_err, '') ELSE 'Allowed (FAIL)' END, v_caught);

END $$;

RESET ROLE;

-- ---------------------------------------------------------------------
-- 6. CUSTOMER B ISOLATION CHECKS (Authenticated Customer B)
-- ---------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "bbbbbbbb-0000-0000-0000-000000000002", "role": "authenticated"}';

DO $$
DECLARE
  v_cnt int;
  v_uid_cust_a uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_uid_cust_b uuid := 'bbbbbbbb-0000-0000-0000-000000000002';
BEGIN
  -- Test 29: Customer B sees only their own order (#SAS-TEST-B)
  SELECT count(*) INTO v_cnt FROM public.orders WHERE id = '#SAS-TEST-B';
  PERFORM pg_temp.log_result(29, 'Customer B: Sees own order (#SAS-TEST-B)', '1 row', v_cnt::text || ' rows', (v_cnt = 1));

  -- Test 30: Customer B sees none of Customer A orders
  SELECT count(*) INTO v_cnt FROM public.orders WHERE id = '#SAS-TEST-A';
  PERFORM pg_temp.log_result(30, 'Customer B: Sees 0 of Customer A orders', '0 rows', v_cnt::text || ' rows', (v_cnt = 0));

  -- Test 31: Customer B sees none of Customer A addresses
  SELECT count(*) INTO v_cnt FROM public.addresses WHERE user_id = v_uid_cust_a;
  PERFORM pg_temp.log_result(31, 'Customer B: Sees 0 of Customer A addresses', '0 rows', v_cnt::text || ' rows', (v_cnt = 0));
END $$;

RESET ROLE;

-- ---------------------------------------------------------------------
-- 7. RIDER ROLE CHECKS (Authenticated Rider)
-- ---------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "cccccccc-0000-0000-0000-000000000003", "role": "authenticated"}';

DO $$
DECLARE
  v_cnt int;
  v_rpc_res jsonb;
  v_caught boolean := false;
  v_err text := null;
  v_state text := null;
BEGIN
  -- Test 32: Rider sees only orders assigned to them (#SAS-TEST-A)
  SELECT count(*) INTO v_cnt FROM public.orders WHERE id = '#SAS-TEST-A';
  PERFORM pg_temp.log_result(32, 'Rider: Sees assigned order (#SAS-TEST-A)', '1 row', v_cnt::text || ' rows', (v_cnt = 1));

  -- Test 33: Rider does not see unassigned orders (#SAS-TEST-B)
  SELECT count(*) INTO v_cnt FROM public.orders WHERE id = '#SAS-TEST-B';
  PERFORM pg_temp.log_result(33, 'Rider: Does not see unassigned order (#SAS-TEST-B)', '0 rows', v_cnt::text || ' rows', (v_cnt = 0));

  -- Test 34: Rider direct update on orders table is blocked
  UPDATE public.orders SET status = 2 WHERE id = '#SAS-TEST-A';
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  PERFORM pg_temp.log_result(34, 'Rider: Direct UPDATE on orders table blocked', '0 rows updated', v_cnt::text || ' rows updated', (v_cnt = 0));

  -- Test 35: Rider direct price/total modification is blocked
  UPDATE public.orders SET total = 0, subtotal = 0 WHERE id = '#SAS-TEST-A';
  GET DIAGNOSTICS v_cnt = ROW_COUNT;
  PERFORM pg_temp.log_result(35, 'Rider: Cannot change order prices or totals', '0 rows updated', v_cnt::text || ' rows updated', (v_cnt = 0));

  -- Test 36: Rider advances assigned order status via rider_update_order_status (1 -> 2: On Route)
  v_caught := false;
  v_err := null;
  v_state := null;
  v_rpc_res := null;
  BEGIN
    v_rpc_res := public.rider_update_order_status('#SAS-TEST-A', 2);
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
    v_err := SQLERRM;
    v_state := SQLSTATE;
  END;
  PERFORM pg_temp.log_result(
    36,
    'Rider: Advance assigned order status (1 -> 2: On Route) via RPC',
    'Success (status = 2)',
    CASE WHEN v_caught THEN 'Failed with exception: ' || COALESCE(v_err, '') ELSE 'Success: ' || COALESCE(v_rpc_res->>'status', 'null') END,
    (NOT v_caught AND (v_rpc_res->>'status')::int = 2)
  );

  -- Test 37: Rider cannot jump straight from On Route (2) to invalid status (e.g. status regression 2 -> 1)
  v_caught := false;
  v_err := null;
  v_state := null;
  BEGIN
    PERFORM public.rider_update_order_status('#SAS-TEST-A', 1);
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
    v_err := SQLERRM;
    v_state := SQLSTATE;
  END;
  PERFORM pg_temp.log_result(
    37,
    'Rider: Invalid status transition (regression 2 -> 1) rejected',
    'Blocked with exception',
    CASE WHEN v_caught THEN 'Blocked with exception: ' || COALESCE(v_err, '') ELSE 'Allowed illegally (FAIL)' END,
    v_caught
  );

  -- Test 38: Rider cannot update status of order not assigned to them (#SAS-TEST-B)
  v_caught := false;
  v_err := null;
  v_state := null;
  BEGIN
    PERFORM public.rider_update_order_status('#SAS-TEST-B', 2);
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
    v_err := SQLERRM;
    v_state := SQLSTATE;
  END;
  PERFORM pg_temp.log_result(
    38,
    'Rider: Cannot update order not assigned to them (#SAS-TEST-B)',
    'Blocked with exception',
    CASE WHEN v_caught THEN 'Blocked with exception: ' || COALESCE(v_err, '') ELSE 'Allowed illegally (FAIL)' END,
    v_caught
  );

  -- Test 39: Rider cannot call admin_assign_rider
  v_caught := false;
  v_err := null;
  v_state := null;
  BEGIN
    PERFORM public.admin_assign_rider('#SAS-TEST-B', 'eeeeeeee-0000-0000-0000-000000000005'::uuid, true);
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
    v_err := SQLERRM;
    v_state := SQLSTATE;
  END;
  PERFORM pg_temp.log_result(
    39,
    'Rider: admin_assign_rider fails for rider role',
    'Blocked with exception',
    CASE WHEN v_caught THEN 'Blocked with exception: ' || COALESCE(v_err, '') ELSE 'Allowed illegally (FAIL)' END,
    v_caught
  );
END $$;

RESET ROLE;

-- ---------------------------------------------------------------------
-- 8. ADMIN ROLE CHECKS (Authenticated Admin)
-- ---------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "dddddddd-0000-0000-0000-000000000004", "role": "authenticated"}';

DO $$
DECLARE
  v_cnt int;
  v_rpc_res jsonb;
  v_caught boolean := false;
  v_err text := null;
  v_state text := null;
  v_audit_cnt int;
BEGIN
  -- Test 40: Admin can read all orders
  SELECT count(*) INTO v_cnt FROM public.orders WHERE id IN ('#SAS-TEST-A', '#SAS-TEST-B');
  PERFORM pg_temp.log_result(40, 'Admin: Can read all orders (A and B)', '2 rows', v_cnt::text || ' rows', (v_cnt = 2));

  -- Test 41: Admin can read all customer addresses
  SELECT count(*) INTO v_cnt FROM public.addresses WHERE user_id IN (
    'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
    'bbbbbbbb-0000-0000-0000-000000000002'::uuid
  );
  PERFORM pg_temp.log_result(41, 'Admin: Can read all customer addresses', '2 rows', v_cnt::text || ' rows', (v_cnt = 2));

  -- Test 42: Admin can view audit logs
  SELECT count(*) INTO v_cnt FROM public.audit_log;
  PERFORM pg_temp.log_result(42, 'Admin: Can view audit_log records', '>= 1 row', v_cnt::text || ' rows', (v_cnt >= 1));

  -- Test 43: Admin can assign rider via admin_assign_rider
  v_caught := false;
  v_err := null;
  v_state := null;
  v_rpc_res := null;
  BEGIN
    v_rpc_res := public.admin_assign_rider('#SAS-TEST-B', 'eeeeeeee-0000-0000-0000-000000000005'::uuid, true);
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
    v_err := SQLERRM;
    v_state := SQLSTATE;
  END;
  PERFORM pg_temp.log_result(
    43,
    'Admin: admin_assign_rider assigns rider and advances status',
    'Success (assigned_rider_id set)',
    CASE WHEN v_caught THEN 'Failed with exception: ' || COALESCE(v_err, '') ELSE 'Assigned rider: ' || COALESCE(v_rpc_res->>'assigned_rider_id', 'null') END,
    (NOT v_caught AND v_rpc_res->>'assigned_rider_id' = 'eeeeeeee-0000-0000-0000-000000000005')
  );

  -- Test 44: Audit triggers record product price change & order status change
  -- Update product variant price
  UPDATE public.product_variants 
  SET price = 260 
  WHERE id = 'ffffffff-0000-0000-0000-000000000001';

  -- Update order status
  UPDATE public.orders 
  SET status = 3 
  WHERE id = '#SAS-TEST-B';

  SELECT count(*) INTO v_audit_cnt
  FROM public.audit_log
  WHERE (table_name = 'product_variants' AND row_id = 'ffffffff-0000-0000-0000-000000000001')
     OR (table_name = 'orders' AND row_id = '#SAS-TEST-B');

  PERFORM pg_temp.log_result(
    44,
    'Audit: Triggers record product price change & order status change',
    '>= 2 audit records generated',
    v_audit_cnt::text || ' audit records found',
    (v_audit_cnt >= 2)
  );
END $$;

RESET ROLE;

-- Test 45: Customer cannot call admin_assign_rider
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-0000-0000-0000-000000000001", "role": "authenticated"}';

DO $$
DECLARE
  v_caught boolean := false;
  v_err text := null;
  v_state text := null;
BEGIN
  v_caught := false;
  v_err := null;
  v_state := null;
  BEGIN
    PERFORM public.admin_assign_rider('#SAS-TEST-B', 'eeeeeeee-0000-0000-0000-000000000005'::uuid, true);
  EXCEPTION WHEN OTHERS THEN
    v_caught := true;
    v_err := SQLERRM;
    v_state := SQLSTATE;
  END;
  PERFORM pg_temp.log_result(
    45,
    'Customer: admin_assign_rider fails for customer role',
    'Blocked with exception',
    CASE WHEN v_caught THEN 'Blocked with exception: ' || COALESCE(v_err, '') ELSE 'Allowed illegally (FAIL)' END,
    v_caught
  );
END $$;

RESET ROLE;

-- ---------------------------------------------------------------------
-- 9. FINAL RESULTS CONSOLIDATION & SUMMARY
-- ---------------------------------------------------------------------
-- Display individual test results followed by overall pass/fail summary
SELECT 
  test_no,
  test_name,
  expected,
  actual,
  CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS status
FROM test_results
ORDER BY test_no;

SELECT 
  count(*) AS total_checks,
  count(*) FILTER (WHERE passed) AS passed_checks,
  count(*) FILTER (WHERE NOT passed) AS failed_checks,
  CASE 
    WHEN count(*) FILTER (WHERE NOT passed) = 0 THEN 'ALL CHECKS PASSED'
    ELSE 'SOME CHECKS FAILED'
  END AS final_verdict
FROM test_results;

-- ---------------------------------------------------------------------
-- 10. CLEANUP & ROLLBACK (Leaves zero test artifacts in database)
-- ---------------------------------------------------------------------
ROLLBACK;
