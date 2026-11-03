-- =====================================================================
-- Rollback Migration: 20261102100000_rollback_make_search_products_fast_limit_first.sql
-- Description: Reverses 20261102100000_make_search_products_fast_limit_first.sql.
--              Restores previous public.search_products_fast() definition from
--              migration 20261030100200_search_and_performance_tuning.sql,
--              retaining the search_path setting from 20261031100000, and drops
--              the added index idx_products_name_en_lower_trgm.
-- =====================================================================

BEGIN;

-- 1. Drop index added in migration 20261102100000
DROP INDEX IF EXISTS public.idx_products_name_en_lower_trgm;

-- 2. Restore previous search_products_fast definition exactly as in 20261030100200
--    with search_path = public, extensions, pg_temp from 20261031100000
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
    WITH matched_products AS (
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
    ),
    product_pricing AS (
      SELECT
        pv.product_id,
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
      WHERE pv.product_id IN (SELECT mp.id FROM matched_products mp)
      GROUP BY pv.product_id
    )
    SELECT
      mp.id,
      mp.name_en,
      mp.name_ta,
      mp.category_id,
      mp.image,
      mp.in_stock,
      COALESCE(pp.min_price, 0::numeric) AS min_price,
      COALESCE(pp.variants, '[]'::jsonb) AS variants,
      mp.score AS similarity_score
    FROM matched_products mp
    LEFT JOIN product_pricing pp ON pp.product_id = mp.id
    ORDER BY
      mp.in_stock DESC,
      mp.score DESC,
      mp.name_ta ASC
    LIMIT v_limit
    OFFSET v_offset;

  ELSE
    -- Latin / Thanglish / English Search
    v_norm_query := public.normalize_search(v_clean_query);
    IF length(v_norm_query) < 2 THEN
      v_norm_query := lower(v_clean_query);
    END IF;

    v_safe_ilike := replace(replace(replace(v_norm_query, '\', '\\'), '%', '\%'), '_', '\_');

    RETURN QUERY
    WITH candidate_products AS (
      SELECT
        p.id,
        p.name_en,
        p.name_ta,
        p.category_id,
        p.image,
        p.in_stock,
        p.search_doc,
        CASE
          -- Exact English or Normalized match
          WHEN lower(p.name_en) = lower(v_clean_query) THEN 1.0::real
          WHEN public.normalize_search(p.name_en) = v_norm_query THEN 0.95::real
          -- Prefix matches
          WHEN lower(p.name_en) ILIKE lower(v_clean_query) || '%' THEN 0.85::real
          WHEN p.search_doc ILIKE v_safe_ilike || '%' THEN 0.8::real
          WHEN p.search_doc ILIKE '% ' || v_safe_ilike || '%' THEN 0.7::real
          -- Trigram similarity
          ELSE GREATEST(
            public.similarity(p.search_doc, v_norm_query),
            public.similarity(lower(p.name_en), lower(v_clean_query))
          )::real
        END AS score
      FROM public.products p
      WHERE
        p.search_doc % v_norm_query
        OR lower(p.name_en) % lower(v_clean_query)
        OR p.search_doc ILIKE '%' || v_safe_ilike || '%'
        OR lower(p.name_en) ILIKE '%' || lower(v_clean_query) || '%'
    ),
    product_pricing AS (
      SELECT
        pv.product_id,
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
      WHERE pv.product_id IN (SELECT cp.id FROM candidate_products cp)
      GROUP BY pv.product_id
    )
    SELECT
      cp.id,
      cp.name_en,
      cp.name_ta,
      cp.category_id,
      cp.image,
      cp.in_stock,
      COALESCE(pp.min_price, 0::numeric) AS min_price,
      COALESCE(pp.variants, '[]'::jsonb) AS variants,
      cp.score AS similarity_score
    FROM candidate_products cp
    LEFT JOIN product_pricing pp ON pp.product_id = cp.id
    ORDER BY
      cp.in_stock DESC,
      cp.score DESC,
      cp.name_en ASC
    LIMIT v_limit
    OFFSET v_offset;

  END IF;
END;
$$;

-- 3. Grants
REVOKE ALL ON FUNCTION public.search_products_fast(text, int, int, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_products_fast(text, int, int, text, int) TO anon, authenticated, service_role;

COMMIT;

