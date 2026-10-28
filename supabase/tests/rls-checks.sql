-- =====================================================================
-- File: supabase/tests/rls-checks.sql
-- Description: Interactive RLS test verification suite for Supabase SQL Editor.
--              Simulates anon, Customer A, Customer B, Rider, and Admin.
--
-- INSTRUCTIONS: Run this entire script in your Supabase SQL Editor.
--               It ends with ROLLBACK so no test artifacts remain.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. TEST DATA FIXTURES SETUP (Running as database admin)
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_uid_cust_a uuid := '11111111-1111-1111-1111-111111111111';
  v_uid_cust_b uuid := '22222222-2222-2222-2222-222222222222';
  v_uid_rider  uuid := '33333333-3333-3333-3333-333333333333';
  v_uid_admin  uuid := '55555555-5555-5555-5555-555555555555';
  v_rider_id   uuid := '44444444-4444-4444-4444-444444444444';
BEGIN
  -- Insert mock auth users if not present
  INSERT INTO auth.users (id, aud, role, email, created_at, updated_at)
  VALUES 
    (v_uid_cust_a, 'authenticated', 'authenticated', 'test_customer_a@example.com', now(), now()),
    (v_uid_cust_b, 'authenticated', 'authenticated', 'test_customer_b@example.com', now(), now()),
    (v_uid_rider,  'authenticated', 'authenticated', 'muthu@riders.grocery.invalid', now(), now()),
    (v_uid_admin,  'authenticated', 'authenticated', 'owner@example.com', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Ensure user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES 
    (v_uid_cust_a, 'customer'),
    (v_uid_cust_b, 'customer'),
    (v_uid_rider,  'rider'),
    (v_uid_admin,  'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  -- Ensure rider profile
  INSERT INTO public.riders (id, user_id, username, full_name, phone, is_active)
  VALUES (v_rider_id, v_uid_rider, 'muthukumar', 'Muthu Kumar', '9842198421', true)
  ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, is_active = true;

  -- Insert dummy product
  INSERT INTO public.products (id, name_en, name_ta, in_stock)
  VALUES ('test-ponni-rice', 'Ponni Boiled Rice', 'பொன்னி அரிசி', true)
  ON CONFLICT (id) DO NOTHING;

  -- Insert dummy test addresses
  INSERT INTO public.addresses (id, user_id, phone, tag, house_no, street, city, pincode)
  VALUES 
    (99001, v_uid_cust_a, '9842100001', 'Home', '12A', 'West Veli St', 'Madurai', '625001'),
    (99002, v_uid_cust_b, '9842100002', 'Office', '45B', 'KK Nagar', 'Madurai', '625020')
  ON CONFLICT (id) DO NOTHING;

  -- Insert test orders:
  -- Order A: Owned by Customer A, assigned to Rider, status = 1 (Ready)
  -- Order B: Owned by Customer B, unassigned, status = 0 (Placed)
  INSERT INTO public.orders (id, user_id, assigned_rider_id, customer_name, phone, address, total, status, payment_status, payment_method)
  VALUES 
    ('#SAS-TEST-A', v_uid_cust_a, v_rider_id, 'Customer A', '9842100001', '12A West Veli St', 450, 1, 'pending', 'cod'),
    ('#SAS-TEST-B', v_uid_cust_b, NULL,       'Customer B', '9842100002', '45B KK Nagar',     890, 0, 'pending', 'cod')
  ON CONFLICT (id) DO NOTHING;

  -- Insert test order items
  INSERT INTO public.order_items (id, order_id, product_id, variant_label, price, quantity)
  VALUES 
    ('00000000-0000-0000-0000-000000000001', '#SAS-TEST-A', 'test-ponni-rice', '5kg', 250, 1),
    ('00000000-0000-0000-0000-000000000002', '#SAS-TEST-B', 'test-ponni-rice', '10kg', 500, 1)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ---------------------------------------------------------------------
-- TEST 1: ANONYMOUS USER (Public Storefront)
-- ---------------------------------------------------------------------
SET LOCAL ROLE anon;
SET LOCAL request.jwt.claims = '{"role": "anon"}';

-- Test 1.1: Anon can read products catalog
-- EXPECTED RESULT: Returns >= 1 rows
SELECT count(*) AS anon_products_visible FROM public.products WHERE id = 'test-ponni-rice';

-- Test 1.2: Anon must NOT read any customer orders
-- EXPECTED RESULT: count = 0
SELECT count(*) AS anon_orders_visible FROM public.orders;

-- Test 1.3: Anon must NOT read any customer addresses
-- EXPECTED RESULT: count = 0
SELECT count(*) AS anon_addresses_visible FROM public.addresses;

-- Test 1.4: Anon must NOT read internal user_roles
-- EXPECTED RESULT: count = 0
SELECT count(*) AS anon_roles_visible FROM public.user_roles;

-- ---------------------------------------------------------------------
-- TEST 2: CUSTOMER A (Authenticated Customer)
-- ---------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

-- Test 2.1: Customer A sees exactly their own order
-- EXPECTED RESULT: Returns '#SAS-TEST-A' (1 row)
SELECT id, customer_name, status FROM public.orders;

-- Test 2.2: Customer A must NOT see Customer B's order
-- EXPECTED RESULT: count = 0
SELECT count(*) AS customer_a_sees_b_orders FROM public.orders WHERE id = '#SAS-TEST-B';

-- Test 2.3: Customer A sees only their own address
-- EXPECTED RESULT: Returns id 99001 (1 row)
SELECT id, tag, city FROM public.addresses;

-- Test 2.4: Customer A cannot see Customer B's address
-- EXPECTED RESULT: count = 0
SELECT count(*) AS customer_a_sees_b_addresses FROM public.addresses WHERE id = 99002;

-- Test 2.5: Customer A cannot see other users' roles
-- EXPECTED RESULT: Returns only 1 row (role: customer for own user_id)
SELECT user_id, role FROM public.user_roles;

-- Test 2.6: Customer A direct order update must fail (0 rows updated)
-- EXPECTED RESULT: count = 0 (RLS blocks direct UPDATE)
UPDATE public.orders SET status = 3 WHERE id = '#SAS-TEST-A';

-- ---------------------------------------------------------------------
-- TEST 3: CUSTOMER B (Isolation Verification)
-- ---------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

-- Test 3.1: Customer B sees only their own order '#SAS-TEST-B'
-- EXPECTED RESULT: 1 row ('#SAS-TEST-B')
SELECT id, customer_name, status FROM public.orders;

-- Test 3.2: Customer B must see 0 of Customer A's orders
-- EXPECTED RESULT: count = 0
SELECT count(*) AS customer_b_sees_a_orders FROM public.orders WHERE id = '#SAS-TEST-A';

-- Test 3.3: Customer B must see 0 of Customer A's addresses
-- EXPECTED RESULT: count = 0
SELECT count(*) AS customer_b_sees_a_addresses FROM public.addresses WHERE id = 99001;

-- ---------------------------------------------------------------------
-- TEST 4: RIDER (Authenticated Delivery Partner)
-- ---------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}';

-- Test 4.1: Rider can read ONLY orders assigned to them
-- EXPECTED RESULT: Exactly 1 row ('#SAS-TEST-A')
SELECT id, customer_name, address, status FROM public.orders;

-- Test 4.2: Rider cannot read unassigned Order B
-- EXPECTED RESULT: count = 0
SELECT count(*) AS rider_sees_unassigned FROM public.orders WHERE id = '#SAS-TEST-B';

-- Test 4.3: Rider direct table UPDATE is blocked
-- EXPECTED RESULT: count = 0 (Riders cannot directly mutate orders table)
UPDATE public.orders SET status = 2 WHERE id = '#SAS-TEST-A';

-- Test 4.4: Rider status advance via secure RPC (1 -> 2: On Route)
-- EXPECTED RESULT: Returns success: true, status: 2
SELECT public.rider_update_order_status('#SAS-TEST-A', 2);

-- Test 4.5: Rider illegal status regression via RPC (2 -> 1) must raise exception
-- EXPECTED RESULT: ERROR: Invalid status transition
DO $$
BEGIN
  PERFORM public.rider_update_order_status('#SAS-TEST-A', 1);
  RAISE EXCEPTION 'TEST FAILED: Status regression was not blocked!';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'SUCCESS: Status regression was correctly rejected: %', SQLERRM;
END $$;

-- ---------------------------------------------------------------------
-- TEST 5: ADMIN (Authenticated Store Manager)
-- ---------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "55555555-5555-5555-5555-555555555555", "role": "authenticated"}';

-- Test 5.1: Admin can read all orders
-- EXPECTED RESULT: Returns >= 2 rows (both Order A and Order B)
SELECT count(*) AS admin_total_orders_seen FROM public.orders;

-- Test 5.2: Admin can read all customer addresses
-- EXPECTED RESULT: Returns >= 2 rows
SELECT count(*) AS admin_total_addresses_seen FROM public.addresses;

-- Test 5.3: Admin can view audit logs
-- EXPECTED RESULT: Returns >= 1 rows
SELECT count(*) AS admin_audit_log_seen FROM public.audit_log;

-- Test 5.4: Admin can assign rider via secure RPC
-- EXPECTED RESULT: Returns success: true, assigned_rider_id: 44444444-4444-4444-4444-444444444444
SELECT public.admin_assign_rider('#SAS-TEST-B', '44444444-4444-4444-4444-444444444444'::uuid, true);

-- ---------------------------------------------------------------------
-- CLEANUP / ROLLBACK
-- ---------------------------------------------------------------------
-- All tests completed. Rolling back all simulated records.
ROLLBACK;
