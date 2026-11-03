-- =====================================================================
-- Migration: 20261030100200_search_and_performance_tuning.sql
-- Description: Full-text, Trigram, and Phonetic Tamil/Thanglish search layer
--              plus high-concurrency performance tuning indexes for 200+ users.
--
-- TARGET: Supabase PostgreSQL Database (Staging / Production)
-- EXTENSIONS (Free Supabase Tier): pg_trgm, unaccent
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. EXTENSIONS (Free Supabase Tier)
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

-- ---------------------------------------------------------------------
-- 2. PRODUCTS: ADD search_aliases COLUMN
-- ---------------------------------------------------------------------
-- Admin-editable column holding Thanglish variants, colloquial terms,
-- and alternative Tamil/English spellings (space separated, lowercase).
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_aliases text NOT NULL DEFAULT '';

-- ---------------------------------------------------------------------
-- 3. DETERMINISTIC SQL NORMALIZATION FUNCTION
-- ---------------------------------------------------------------------
-- Normalizes text for fast index matching:
-- - Converts Latin characters to lowercase.
-- - Strips diacritics via unaccent().
-- - Maps common Thanglish phonetic patterns to unified forms:
--     zh -> l, th -> t, dh -> d, ee -> i, oo -> u, aa -> a, w -> v,
--     sh/ch -> s, kh -> k, gh -> g, bh -> b, ph -> p.
-- - Collapses repeated letters ("arrisi" -> "arisi", "ponnii" -> "poni").
-- - Strips trailing/redundant 'h' following consonants.
-- - Collapses multiple spaces.
-- - CRITICAL: Completely preserves Tamil script characters (\u0B80-\u0BFF).
-- Marked IMMUTABLE and PARALLEL SAFE for use in generated columns & indexes.
CREATE OR REPLACE FUNCTION public.normalize_search(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
AS $$
DECLARE
  v_res text;
BEGIN
  IF input_text IS NULL OR trim(input_text) = '' THEN
    RETURN '';
  END IF;

  -- 1. Trim leading and trailing whitespace
  v_res := trim(input_text);

  -- 2. Lowercase (lowercases Latin characters; leaves Tamil characters unchanged)
  v_res := lower(v_res);

  -- 3. Unaccent Latin characters (leaves Tamil script intact)
  BEGIN
    v_res := public.unaccent(v_res);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 4. Map multi-letter Thanglish & phonetic equivalents (ordered: pairs first)
  v_res := replace(v_res, 'zh', 'l');    -- kozhambu -> kolambu, kizhangu -> kilangu
  v_res := replace(v_res, 'th', 't');    -- thakkali -> takkali, thanneer -> taneer
  v_res := replace(v_res, 'dh', 'd');    -- dhal / dhosa -> dal / dosa
  v_res := replace(v_res, 'ee', 'i');    -- seeragam -> siragam, keerai -> kirai
  v_res := replace(v_res, 'oo', 'u');    -- oothappam -> uthappam, poori -> puri
  v_res := replace(v_res, 'aa', 'a');    -- paal -> pal, maavu -> mavu
  v_res := replace(v_res, 'w', 'v');     -- wengayam -> vengayam
  v_res := replace(v_res, 'sh', 's');    -- sakkarai / shakarai -> sakarai
  v_res := replace(v_res, 'ch', 's');    -- chappathi -> sappathi
  v_res := replace(v_res, 'kh', 'k');
  v_res := replace(v_res, 'gh', 'g');
  v_res := replace(v_res, 'bh', 'b');
  v_res := replace(v_res, 'ph', 'p');

  -- 5. Collapse repeated letters (e.g. 'arrisi' -> 'arisi', 'ponnii' -> 'poni')
  -- Operates strictly on Latin [a-z], preserving Tamil script untouched
  v_res := regexp_replace(v_res, '([a-z])\1+', '\1', 'g');

  -- 6. Remove remaining 'h' immediately following any Latin consonant
  v_res := regexp_replace(v_res, '([bcdfghjklmnpqrstvwxyz])h', '\1', 'g');

  -- 7. Normalize all whitespace sequences to a single space
  v_res := trim(regexp_replace(v_res, '\s+', ' ', 'g'));

  RETURN v_res;
END;
$$;

-- ---------------------------------------------------------------------
-- 4. PRODUCTS: STORED GENERATED SEARCH DOCUMENT COLUMN
-- ---------------------------------------------------------------------
-- Combines normalized English name, search aliases, and native Tamil name.
-- Note: Existing search_text column is preserved for compatibility.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'search_doc'
  ) THEN
    ALTER TABLE public.products
      ADD COLUMN search_doc text GENERATED ALWAYS AS (
        public.normalize_search(COALESCE(name_en, '') || ' ' || COALESCE(search_aliases, '')) || ' ' || COALESCE(name_ta, '')
      ) STORED;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 5. SEARCH & CATALOG INDEXES
-- ---------------------------------------------------------------------

-- GIN Trigram index on normalized search document (Latin + Thanglish + Tamil)
CREATE INDEX IF NOT EXISTS idx_products_search_doc_trgm
  ON public.products USING gin (search_doc gin_trgm_ops);

-- GIN Trigram index on native Tamil name
CREATE INDEX IF NOT EXISTS idx_products_name_ta_trgm
  ON public.products USING gin (name_ta gin_trgm_ops);

-- B-Tree lookup index on category_id
CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON public.products(category_id);

-- B-Tree index on in_stock boolean flag
CREATE INDEX IF NOT EXISTS idx_products_in_stock
  ON public.products(in_stock);

-- Partial index for active in-stock catalog browsing
CREATE INDEX IF NOT EXISTS idx_products_in_stock_true
  ON public.products(id, category_id) WHERE in_stock = true;

-- Product variants foreign key and pricing indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON public.product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_prod_price
  ON public.product_variants(product_id, price);

-- ---------------------------------------------------------------------
-- 6. HIGH-CONCURRENCY PERFORMANCE INDEXES (200+ CONCURRENT USERS)
-- ---------------------------------------------------------------------

-- Composite index for customer order history queries (user_id + created_at DESC)
CREATE INDEX IF NOT EXISTS idx_orders_user_created_desc
  ON public.orders(user_id, created_at DESC);

-- Composite index for customer status queries
CREATE INDEX IF NOT EXISTS idx_orders_user_status
  ON public.orders(user_id, status);

-- Composite index for rider active delivery queue
CREATE INDEX IF NOT EXISTS idx_orders_rider_status
  ON public.orders(assigned_rider_id, status);

-- Index for order_items foreign key lookups
CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON public.order_items(product_id);

-- Indexes for audit_log filtering and chronological timeline
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at_desc
  ON public.audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_created
  ON public.audit_log(table_name, created_at DESC);

-- Webhook deduplication lookup index
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'webhook_events') THEN
    CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
    CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON public.webhook_events(processed_at DESC);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 7. AUTHORITATIVE SEARCH RPC FUNCTION
-- ---------------------------------------------------------------------
-- Full hybrid English, Tamil script, and Thanglish search engine.
-- Features:
-- - Trims and rejects queries < 2 characters (returns empty).
-- - Caps query length at 60 characters.
-- - Detects Tamil script vs Latin characters automatically.
-- - Tamil path: Uses safe-escaped ILIKE on name_ta (immune to pg_trgm locale tokenization).
-- - Latin path: Uses GIN trigram similarity (%) + prefix matching on search_doc and name_en.
-- - Ranks results: Exact match (1.0), Prefix match (0.8), Trigram similarity, In-Stock first.
-- - Aggregates variant pricing and labels in a single query (zero N+1 queries).
-- - Returns only public catalog columns (zero private data leakage).
-- - Hard limit (maximum 30 items).
-- - Statement timeout enforced at 2 seconds.
-- - Callable by anon and authenticated roles.
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
SET search_path = ''
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

-- ---------------------------------------------------------------------
-- 8. PERMISSIONS & GRANTS
-- ---------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.normalize_search(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.normalize_search(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.search_products_fast(text, int, int, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_products_fast(text, int, int, text, int) TO anon, authenticated, service_role;

COMMIT;
