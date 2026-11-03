-- =====================================================================
-- Migration: 20261102100000_make_search_products_fast_limit_first.sql
-- Description: High-performance limit-first rewrite of search_products_fast().
--              Decouples candidate ranking and LIMIT/OFFSET from variant JSON
--              aggregation and min_price computation.
--
-- TARGET: Supabase PostgreSQL Database (Staging / Production)
--
-- PROBLEM & ROOT CAUSE:
-- On staging with 5,000 products matching a broad query like 'arisi',
-- `explain analyze select * from public.search_products_fast('arisi', 20, 0)`
-- took ~636 ms.
-- The previous function evaluated `similarity()` and scored ALL candidates,
-- joined every matching row to `product_variants`, performed `MIN(price)` and
-- `jsonb_agg(...)` across all matched variants, and only then ran
-- `ORDER BY ... LIMIT 20`. Work scaled with total matches (O(N)), not with the
-- 20 requested rows.
--
-- REWRITE ARCHITECTURE (LIMIT-FIRST):
-- 1. Index-friendly candidate search:
--    Instead of a single large `OR` across multiple expressions (which inhibits
--    optimal index selection), candidates are retrieved via UNION ALL branches
--    backed by dedicated indexes:
--      Branch A: `p.search_doc % v_norm_query`
--                Index: `idx_products_search_doc_trgm` USING gin (search_doc gin_trgm_ops)
--      Branch B: `lower(p.name_en) % lower(v_clean_query)`
--                Index: `idx_products_name_en_lower_trgm` USING gin (lower(name_en) gin_trgm_ops)
--      Branch C: `p.search_doc ILIKE v_safe_ilike || '%'` or `ILIKE '% ' || v_safe_ilike || '%'`
--                (Prefix / Word Prefix served by trigram index / partial scans)
--      Branch D: `lower(p.name_en) ILIKE lower(v_clean_query) || '%'`
--    Each branch returns `p.id` only.
-- 2. Stage 1 (Candidate Deduplication, Scoring & LIMIT):
--    Deduplicates IDs, joins back to `public.products`, calculates ranking score
--    (exact match 1.0, prefix 0.8-0.95, or trigram similarity), orders by
--    `in_stock DESC, score DESC, name_en ASC`, and applies `LIMIT v_limit OFFSET v_offset`
--    IMMEDIATELY.
-- 3. Stage 2 (Lateral Variant Aggregation for at most 30 rows):
--    Computes `min_price` and `variants` jsonb solely for the <= 30 filtered rows
--    via a correlated LATERAL subquery or scoped join using `idx_product_variants_prod_price`.
-- 4. Dynamic pg_trgm.similarity_threshold:
--    Set locally to 0.3 via `set_config('pg_trgm.similarity_threshold', '0.3', true)`.
--    0.3 is PostgreSQL's standard trigram sweet spot: high enough to avoid noisy
--    garbage matches on short words, yet tolerant of typical Tamil/English typos
--    (e.g., 'ponnie rise' -> 'Ponni Boiled Rice').
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. DEDICATED INDEXES FOR SEARCH BRANCHES
-- ---------------------------------------------------------------------

-- GIN Trigram index on lower(name_en) for Branch B (English name trigram matches)
-- and case-insensitive English typo tolerance.
CREATE INDEX IF NOT EXISTS idx_products_name_en_lower_trgm
  ON public.products USING gin (lower(name_en) gin_trgm_ops);

-- Ensure GIN Trigram index on normalized search document exists (Branch A & C)
CREATE INDEX IF NOT EXISTS idx_products_search_doc_trgm
  ON public.products USING gin (search_doc gin_trgm_ops);

-- Ensure GIN Trigram index on native Tamil name exists (Tamil ILIKE & trigram path)
CREATE INDEX IF NOT EXISTS idx_products_name_ta_trgm
  ON public.products USING gin (name_ta gin_trgm_ops);

-- Ensure product_variants composite index for ultra-fast price & variant lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_prod_price
  ON public.product_variants(product_id, price);

-- ---------------------------------------------------------------------
-- 2. AUTHORITATIVE LIMIT-FIRST SEARCH RPC FUNCTION
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_products_fast(
  query text DEFAULT '',
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0,
  search_term text DEFAULT NULL,
  max_results int DEFAULT NULL
)
RETURNS TABLE (
  id text,
  name_en text,
  name_ta text,
  category_id text,
  image text,
  in_stock boolean,
  min_price numeric,
  variants jsonb,
  similarity_score real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
SET statement_timeout = '2s'
AS $$
DECLARE
  v_raw_query text;
  v_clean_query text;
  v_norm_query text;
  v_limit int;
  v_offset int;
  v_is_tamil boolean;
  v_safe_ilike text;
BEGIN
  -- 1. Unify parameter names (supports both (query, p_limit) and legacy (search_term, max_results))
  v_raw_query := COALESCE(NULLIF(search_term, ''), query, '');
  v_clean_query := trim(v_raw_query);

  -- 2. Validate input length: reject queries shorter than 2 characters
  IF length(v_clean_query) < 2 THEN
    RETURN;
  END IF;

  -- Cap input at 60 characters
  IF length(v_clean_query) > 60 THEN
    v_clean_query := substring(v_clean_query FROM 1 FOR 60);
  END IF;

  v_limit := LEAST(30, GREATEST(1, COALESCE(max_results, p_limit, 20)));
  v_offset := GREATEST(0, COALESCE(p_offset, 0));

  -- 3. Detect Tamil script (Unicode block \u0B80-\u0BFF)
  v_is_tamil := (v_clean_query ~ '[\u0B80-\u0BFF]');

  IF v_is_tamil THEN
    -- Escape SQL ILIKE pattern characters (%, _, \)
    v_safe_ilike := replace(replace(replace(v_clean_query, '\', '\\'), '%', '\%'), '_', '\_');

    RETURN QUERY
    WITH stage1_products AS (
      SELECT
        p.id,
        p.name_en,
        p.name_ta,
        p.category_id,
        p.image,
        p.in_stock,
        CASE
          WHEN p.name_ta = v_clean_query THEN 1.0::real
          WHEN p.name_ta ILIKE v_safe_ilike || '%' THEN 0.85::real
          WHEN p.name_ta ILIKE '%' || v_safe_ilike || '%' THEN 0.6::real
          ELSE 0.2::real
        END AS score
      FROM public.products p
      WHERE p.name_ta ILIKE '%' || v_safe_ilike || '%'
      ORDER BY
        p.in_stock DESC,
        score DESC,
        p.name_ta ASC
      LIMIT v_limit
      OFFSET v_offset
    )
    SELECT
      s1.id,
      s1.name_en,
      s1.name_ta,
      s1.category_id,
      s1.image,
      s1.in_stock,
      COALESCE(vp.min_price, 0::numeric) AS min_price,
      COALESCE(vp.variants, '[]'::jsonb) AS variants,
      s1.score AS similarity_score
    FROM stage1_products s1
    LEFT JOIN LATERAL (
      SELECT
        MIN(pv.price) AS min_price,
        jsonb_agg(
          jsonb_build_object(
            'id', pv.id,
            'label', pv.label,
            'price', pv.price,
            'mrp', pv.mrp,
            'stock_qty', pv.stock_qty
          ) ORDER BY pv.price ASC
        ) AS variants
      FROM public.product_variants pv
      WHERE pv.product_id = s1.id
    ) vp ON true
    ORDER BY
      s1.in_stock DESC,
      s1.score DESC,
      s1.name_ta ASC;

  ELSE
    -- Latin / Thanglish / English Search
    -- Set local trigram threshold to 0.3 for balanced typo tolerance without false positives
    PERFORM set_config('pg_trgm.similarity_threshold', '0.3', true);

    v_norm_query := public.normalize_search(v_clean_query);
    IF length(v_norm_query) < 2 THEN
      v_norm_query := lower(v_clean_query);
    END IF;

    v_safe_ilike := replace(replace(replace(v_norm_query, '\', '\\'), '%', '\%'), '_', '\_');

    RETURN QUERY
    WITH candidate_ids AS (
      -- Branch A: GIN Trigram similarity on normalized search document
      SELECT p.id
      FROM public.products p
      WHERE p.search_doc % v_norm_query

      UNION

      -- Branch B: GIN Trigram similarity on lower(name_en)
      SELECT p.id
      FROM public.products p
      WHERE lower(p.name_en) % lower(v_clean_query)

      UNION

      -- Branch C: Substring/Prefix matches on normalized search_doc
      SELECT p.id
      FROM public.products p
      WHERE p.search_doc ILIKE '%' || v_safe_ilike || '%'

      UNION

      -- Branch D: Substring/Prefix matches on lower(name_en)
      SELECT p.id
      FROM public.products p
      WHERE lower(p.name_en) ILIKE '%' || lower(v_clean_query) || '%'
    ),
    stage1_ranked AS (
      SELECT
        p.id,
        p.name_en,
        p.name_ta,
        p.category_id,
        p.image,
        p.in_stock,
        CASE
          -- Exact English or Normalized match
          WHEN lower(p.name_en) = lower(v_clean_query) THEN 1.0::real
          WHEN public.normalize_search(p.name_en) = v_norm_query THEN 0.95::real
          -- Prefix matches
          WHEN lower(p.name_en) ILIKE lower(v_clean_query) || '%' THEN 0.85::real
          WHEN p.search_doc ILIKE v_safe_ilike || '%' THEN 0.8::real
          WHEN p.search_doc ILIKE '% ' || v_safe_ilike || '%' THEN 0.7::real
          -- Trigram similarity computed strictly on candidates
          ELSE GREATEST(
            public.similarity(p.search_doc, v_norm_query),
            public.similarity(lower(p.name_en), lower(v_clean_query))
          )::real
        END AS score
      FROM candidate_ids c
      JOIN public.products p ON p.id = c.id
      ORDER BY
        p.in_stock DESC,
        score DESC,
        p.name_en ASC
      LIMIT v_limit
      OFFSET v_offset
    )
    SELECT
      s1.id,
      s1.name_en,
      s1.name_ta,
      s1.category_id,
      s1.image,
      s1.in_stock,
      COALESCE(vp.min_price, 0::numeric) AS min_price,
      COALESCE(vp.variants, '[]'::jsonb) AS variants,
      s1.score AS similarity_score
    FROM stage1_ranked s1
    LEFT JOIN LATERAL (
      SELECT
        MIN(pv.price) AS min_price,
        jsonb_agg(
          jsonb_build_object(
            'id', pv.id,
            'label', pv.label,
            'price', pv.price,
            'mrp', pv.mrp,
            'stock_qty', pv.stock_qty
          ) ORDER BY pv.price ASC
        ) AS variants
      FROM public.product_variants pv
      WHERE pv.product_id = s1.id
    ) vp ON true
    ORDER BY
      s1.in_stock DESC,
      s1.score DESC,
      s1.name_en ASC;

  END IF;
END;
$$;

-- ---------------------------------------------------------------------
-- 3. PERMISSIONS & GRANTS
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.search_products_fast(text, int, int, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_products_fast(text, int, int, text, int) TO anon, authenticated, service_role;

COMMIT;

