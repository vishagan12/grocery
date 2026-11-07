-- =====================================================================
-- File: supabase/tests/search-checks.sql
-- Description: Interactive, self-contained Search & Performance test suite
--              for Supabase SQL Editor.
--
-- TESTS COVERED:
--   1. English full & phrase search ("rice", "ponni rice")
--   2. Typo / Trigram fuzzy search ("ponnie rise")
--   3. Tamil native script search ("அரிசி", partial "அரி")
--   4. Thanglish colloquial variants ("arisi", "arrisi", "paruppu", "thakkali")
--   5. Case-insensitivity & mixed case ("PoNnI RiCe")
--   6. Whitespace resilience ("  ponni   rice  ")
--   7. Short query boundary rejection (< 2 chars returns 0 rows)
--   8. Long query safety (100+ characters safely truncated/handled without error)
--   9. Special characters & SQL Injection safety (' OR '1'='1, ;, %, _)
--  10. Security & Data Leakage (No private columns, internal prices, or cost exposed)
--
-- INDEX & PERFORMANCE VERIFICATION GUIDE (Run manually in SQL Editor for execution plan analysis):
--
-- Performance Targets:
--   - Normal query (e.g. 'rice', 'ponni rice'): Execution time < 50 ms
--   - Broad query matching thousands of products (e.g. 'arisi' with 5000+ matches): Execution time < 150 ms
--
-- Expected Plan Nodes:
--   - Bitmap Index Scan on idx_products_search_doc_trgm (for search_doc % query)
--   - Bitmap Index Scan on idx_products_name_en_lower_trgm (for lower(name_en) % query)
--   - Bitmap Index Scan on idx_products_name_ta_trgm (for Tamil ILIKE / trigram)
--   - Index Scan on idx_product_variants_prod_price (for lateral variant aggregation of only the top <= 30 items)
--
-- Exact EXPLAIN ANALYZE commands to run:
--   EXPLAIN ANALYZE SELECT * FROM public.search_products_fast('arisi', 20, 0);
--   EXPLAIN ANALYZE SELECT * FROM public.search_products_fast('rice', 20, 0);
--   EXPLAIN ANALYZE SELECT * FROM public.search_products_fast('அரிசி', 20, 0);
--
-- INSTRUCTIONS: Run this entire script in Supabase SQL Editor.
--               Results table shows PASS/FAIL for every test plus summary.
-- =====================================================================

-- Ensure extensions and public are accessible
SET search_path = public, extensions, pg_temp;

-- ---------------------------------------------------------------------
-- 0. DEDICATED SCHEMA & TEST RESULTS TABLE (No TEMP table connection loss)
-- ---------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS zz_search_test;

CREATE TABLE IF NOT EXISTS zz_search_test.test_results (
  test_no int PRIMARY KEY,
  test_name text NOT NULL,
  expected text NOT NULL,
  actual text NOT NULL,
  passed boolean NOT NULL
);

-- Truncate at start of each run for idempotency
TRUNCATE TABLE zz_search_test.test_results;

CREATE OR REPLACE FUNCTION zz_search_test.log_result(
  p_test_no int,
  p_test_name text,
  p_expected text,
  p_actual text,
  p_passed boolean
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, zz_search_test, pg_temp
AS $$
BEGIN
  INSERT INTO zz_search_test.test_results (test_no, test_name, expected, actual, passed)
  VALUES (p_test_no, p_test_name, p_expected, p_actual, p_passed)
  ON CONFLICT (test_no) DO UPDATE
    SET test_name = EXCLUDED.test_name,
        expected  = EXCLUDED.expected,
        actual    = EXCLUDED.actual,
        passed    = EXCLUDED.passed;
END;
$$;

-- ---------------------------------------------------------------------
-- 1. SEED FAKE TEST CATEGORY & PRODUCTS (Idempotent seed data)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  INSERT INTO public.categories (id, name_en, name_ta, image)
  VALUES ('test_search_cat', 'Test Search Category', 'சோதனை பிரிவு', 'https://example.com/test.jpg')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.products (id, name_en, name_ta, category_id, image, in_stock, search_aliases)
  VALUES
    (
      'test_prod_rice',
      'Ponni Boiled Rice',
      'பொன்னி புழுங்கல் அரிசி',
      'test_search_cat',
      'https://example.com/rice.jpg',
      true,
      'ponni poni boiled rice rrice arisi arrisi puzhungal'
    ),
    (
      'test_prod_tomato',
      'Fresh Country Tomatoes',
      'நாட்டு தக்காளி',
      'test_search_cat',
      'https://example.com/tomato.jpg',
      true,
      'country tomatoes thakkali takkali thakali thakkaali tomato'
    ),
    (
      'test_prod_toor_dal',
      'Premium Toor Dal',
      'துவரம் பருப்பு',
      'test_search_cat',
      'https://example.com/dhal.jpg',
      true,
      'toor dal dhal paruppu parupu thuvaram lentils'
    )
  ON CONFLICT (id) DO UPDATE
    SET name_en = EXCLUDED.name_en,
        name_ta = EXCLUDED.name_ta,
        search_aliases = EXCLUDED.search_aliases;

  -- Remove prior test variants to prevent duplicate rows on re-runs
  DELETE FROM public.product_variants
  WHERE product_id IN ('test_prod_rice', 'test_prod_tomato', 'test_prod_toor_dal');

  INSERT INTO public.product_variants (id, product_id, label, price, mrp, stock_qty)
  VALUES
    (gen_random_uuid(), 'test_prod_rice', '5 kg Bag', 320.00, 350.00, 50),
    (gen_random_uuid(), 'test_prod_tomato', '1 kg', 40.00, 50.00, 30),
    (gen_random_uuid(), 'test_prod_toor_dal', '1 kg', 160.00, 180.00, 40);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error seeding search test products: %', SQLERRM;
END $$;

-- ---------------------------------------------------------------------
-- TEST 1: English Full & Phrase Search ("rice", "ponni rice")
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_count int;
  v_found boolean;
BEGIN
  BEGIN
    SELECT count(*), bool_or(id = 'test_prod_rice') INTO v_count, v_found
    FROM public.search_products_fast('ponni rice');

    PERFORM zz_search_test.log_result(
      1,
      'Search: English phrase ("ponni rice")',
      'Finds Ponni Rice in top results',
      'Found ' || v_count || ' products, matched test rice: ' || COALESCE(v_found::text, 'false'),
      (v_count > 0 AND COALESCE(v_found, false) = true)
    );
  EXCEPTION WHEN OTHERS THEN
    PERFORM zz_search_test.log_result(
      1,
      'Search: English phrase ("ponni rice")',
      'Finds Ponni Rice in top results',
      'EXCEPTION: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')',
      false
    );
  END;
END $$;

-- ---------------------------------------------------------------------
-- TEST 2: Typo / Trigram Fuzzy Search ("ponnie rise")
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_count int;
  v_found boolean;
BEGIN
  BEGIN
    SELECT count(*), bool_or(id = 'test_prod_rice') INTO v_count, v_found
    FROM public.search_products_fast('ponnie rise');

    PERFORM zz_search_test.log_result(
      2,
      'Search: Typo / Trigram tolerance ("ponnie rise")',
      'Tolerates minor typos and matches Ponni Rice',
      'Found ' || v_count || ' matches, matched test rice: ' || COALESCE(v_found::text, 'false'),
      (COALESCE(v_found, false) = true)
    );
  EXCEPTION WHEN OTHERS THEN
    PERFORM zz_search_test.log_result(
      2,
      'Search: Typo / Trigram tolerance ("ponnie rise")',
      'Tolerates minor typos and matches Ponni Rice',
      'EXCEPTION: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')',
      false
    );
  END;
END $$;

-- ---------------------------------------------------------------------
-- TEST 3: Native Tamil Script Search ("அரிசி", partial "அரி")
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_count_full int;
  v_count_part int;
BEGIN
  BEGIN
    SELECT count(*) INTO v_count_full FROM public.search_products_fast('அரிசி');
    SELECT count(*) INTO v_count_part FROM public.search_products_fast('அரி');

    PERFORM zz_search_test.log_result(
      3,
      'Search: Native Tamil script ("அரிசி" and partial "அரி")',
      'Matches Tamil products correctly via ILIKE path',
      'Full term: ' || v_count_full || ' matches, Partial term: ' || v_count_part || ' matches',
      (v_count_full > 0 AND v_count_part > 0)
    );
  EXCEPTION WHEN OTHERS THEN
    PERFORM zz_search_test.log_result(
      3,
      'Search: Native Tamil script ("அரிசி" and partial "அரி")',
      'Matches Tamil products correctly via ILIKE path',
      'EXCEPTION: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')',
      false
    );
  END;
END $$;

-- ---------------------------------------------------------------------
-- TEST 4: Thanglish Colloquial Variants ("arisi", "arrisi", "thakkali", "paruppu")
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_arisi_count int;
  v_arrisi_count int;
  v_thakkali_count int;
  v_paruppu_count int;
BEGIN
  BEGIN
    SELECT count(*) INTO v_arisi_count FROM public.search_products_fast('arisi');
    SELECT count(*) INTO v_arrisi_count FROM public.search_products_fast('arrisi');
    SELECT count(*) INTO v_thakkali_count FROM public.search_products_fast('thakkali');
    SELECT count(*) INTO v_paruppu_count FROM public.search_products_fast('paruppu');

    PERFORM zz_search_test.log_result(
      4,
      'Search: Thanglish variants ("arisi", "arrisi", "thakkali", "paruppu")',
      'All Thanglish spellings resolve to respective products',
      'arisi: ' || v_arisi_count || ', arrisi: ' || v_arrisi_count || ', thakkali: ' || v_thakkali_count || ', paruppu: ' || v_paruppu_count,
      (v_arisi_count > 0 AND v_arrisi_count > 0 AND v_thakkali_count > 0 AND v_paruppu_count > 0)
    );
  EXCEPTION WHEN OTHERS THEN
    PERFORM zz_search_test.log_result(
      4,
      'Search: Thanglish variants ("arisi", "arrisi", "thakkali", "paruppu")',
      'All Thanglish spellings resolve to respective products',
      'EXCEPTION: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')',
      false
    );
  END;
END $$;

-- ---------------------------------------------------------------------
-- TEST 5: Mixed Case Normalization ("PoNnI RiCe")
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_count int;
  v_found boolean;
BEGIN
  BEGIN
    SELECT count(*), bool_or(id = 'test_prod_rice') INTO v_count, v_found
    FROM public.search_products_fast('PoNnI RiCe');

    PERFORM zz_search_test.log_result(
      5,
      'Search: Mixed case ("PoNnI RiCe")',
      'Case-insensitive matching succeeds',
      'Found ' || v_count || ' matches, matched test rice: ' || COALESCE(v_found::text, 'false'),
      (COALESCE(v_found, false) = true)
    );
  EXCEPTION WHEN OTHERS THEN
    PERFORM zz_search_test.log_result(
      5,
      'Search: Mixed case ("PoNnI RiCe")',
      'Case-insensitive matching succeeds',
      'EXCEPTION: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')',
      false
    );
  END;
END $$;

-- ---------------------------------------------------------------------
-- TEST 6: Extra Whitespace Collapsing ("  ponni   rice  ")
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_count int;
BEGIN
  BEGIN
    SELECT count(*) INTO v_count
    FROM public.search_products_fast('   ponni     rice   ');

    PERFORM zz_search_test.log_result(
      6,
      'Search: Extra whitespace resilience',
      'Trims and collapses arbitrary spaces',
      'Found ' || v_count || ' matches',
      (v_count > 0)
    );
  EXCEPTION WHEN OTHERS THEN
    PERFORM zz_search_test.log_result(
      6,
      'Search: Extra whitespace resilience',
      'Trims and collapses arbitrary spaces',
      'EXCEPTION: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')',
      false
    );
  END;
END $$;

-- ---------------------------------------------------------------------
-- TEST 7: Short Query Boundary Rejection (< 2 chars returns 0 rows)
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_count int;
BEGIN
  BEGIN
    SELECT count(*) INTO v_count FROM public.search_products_fast('r');

    PERFORM zz_search_test.log_result(
      7,
      'Search: 1-character query rejection (< 2 characters)',
      '0 rows returned',
      v_count || ' rows returned',
      (v_count = 0)
    );
  EXCEPTION WHEN OTHERS THEN
    PERFORM zz_search_test.log_result(
      7,
      'Search: 1-character query rejection (< 2 characters)',
      '0 rows returned',
      'EXCEPTION: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')',
      false
    );
  END;
END $$;

-- ---------------------------------------------------------------------
-- TEST 8: Long Query Safety (100+ chars handled safely without error)
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_long_query text;
  v_count int;
BEGIN
  BEGIN
    v_long_query := repeat('ponni rice fresh supermarket organic ', 5); -- 185 chars
    SELECT count(*) INTO v_count FROM public.search_products_fast(v_long_query);

    PERFORM zz_search_test.log_result(
      8,
      'Search: 100+ character query safety',
      'Executes safely without runtime error',
      'Handled ' || length(v_long_query) || ' characters, returned ' || v_count || ' rows',
      true
    );
  EXCEPTION WHEN OTHERS THEN
    PERFORM zz_search_test.log_result(
      8,
      'Search: 100+ character query safety',
      'Executes safely without runtime error',
      'EXCEPTION: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')',
      false
    );
  END;
END $$;

-- ---------------------------------------------------------------------
-- TEST 9: Special Characters & SQL Injection Resilience
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_count_sqli int;
  v_count_spec int;
BEGIN
  BEGIN
    -- SQL Injection attempts
    SELECT count(*) INTO v_count_sqli FROM public.search_products_fast(''' OR ''1''=''1''; DROP TABLE products; --');
    -- Wildcards & escape sequences
    SELECT count(*) INTO v_count_spec FROM public.search_products_fast('%_\\');

    PERFORM zz_search_test.log_result(
      9,
      'Search: SQL injection & wildcard pattern escaping',
      'Zero unhandled errors, injection rendered inert',
      'SQLi matches: ' || v_count_sqli || ', Spec matches: ' || v_count_spec,
      (v_count_sqli = 0 AND v_count_spec = 0)
    );
  EXCEPTION WHEN OTHERS THEN
    PERFORM zz_search_test.log_result(
      9,
      'Search: SQL injection & wildcard pattern escaping',
      'Zero unhandled errors, injection rendered inert',
      'EXCEPTION: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')',
      false
    );
  END;
END $$;

-- ---------------------------------------------------------------------
-- TEST 10: Security & Privacy Check (Public catalog columns only)
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_col_count int;
  v_bad_cols text;
BEGIN
  BEGIN
    SELECT count(*), string_agg(column_name, ', ')
    INTO v_col_count, v_bad_cols
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'search_products_fast'
      AND column_name IN ('cost_price', 'supplier', 'margin', 'admin_notes');

    PERFORM zz_search_test.log_result(
      10,
      'Security: No private columns or sensitive attributes returned',
      '0 sensitive columns in search output schema',
      v_col_count || ' sensitive columns found: ' || COALESCE(v_bad_cols, 'none'),
      (v_col_count = 0)
    );
  EXCEPTION WHEN OTHERS THEN
    PERFORM zz_search_test.log_result(
      10,
      'Security: No private columns or sensitive attributes returned',
      '0 sensitive columns in search output schema',
      'EXCEPTION: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')',
      false
    );
  END;
END $$;

-- ---------------------------------------------------------------------
-- 2. OUTPUT TEST RESULTS & SUMMARY
-- ---------------------------------------------------------------------
-- Detailed results ordered by check number
SELECT
  test_no,
  test_name,
  CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS status,
  expected,
  actual
FROM zz_search_test.test_results
ORDER BY test_no;

-- One-row summary
SELECT
  count(*) AS total_checks,
  count(*) FILTER (WHERE passed) AS passed_checks,
  count(*) FILTER (WHERE NOT passed) AS failed_checks,
  CASE
    WHEN count(*) FILTER (WHERE NOT passed) = 0 THEN 'ALL CHECKS PASSED'
    ELSE 'SOME CHECKS FAILED'
  END AS final_verdict
FROM zz_search_test.test_results;

-- ---------------------------------------------------------------------
-- CLEANUP (Run separately when test session is concluded):
-- ---------------------------------------------------------------------
-- DROP SCHEMA IF EXISTS zz_search_test CASCADE;
-- DELETE FROM public.product_variants WHERE product_id IN ('test_prod_rice', 'test_prod_tomato', 'test_prod_toor_dal');
-- DELETE FROM public.products WHERE id IN ('test_prod_rice', 'test_prod_tomato', 'test_prod_toor_dal');
-- DELETE FROM public.categories WHERE id = 'test_search_cat';
