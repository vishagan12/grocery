import { supabase } from '@/lib/supabase';
import { Product, products as fallbackProducts } from '@/data/products';

// High-performance TTL cache for search queries (30 seconds TTL)
const SEARCH_CACHE_MAX = 50;
const SEARCH_CACHE_TTL_MS = 30 * 1000;

interface CachedSearchEntry {
  results: Product[];
  expiresAt: number;
}

const searchCache = new Map<string, CachedSearchEntry>();

function getCachedResults(cacheKey: string): Product[] | undefined {
  const entry = searchCache.get(cacheKey);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    searchCache.delete(cacheKey);
    return undefined;
  }
  // Re-insert to mark as recently used
  searchCache.delete(cacheKey);
  searchCache.set(cacheKey, entry);
  return entry.results;
}

function setCachedResults(cacheKey: string, results: Product[]): void {
  if (searchCache.size >= SEARCH_CACHE_MAX) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(cacheKey, {
    results,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });
}

/**
 * High-performance search function:
 * - Trims and enforces 2 to 60 character input bounds.
 * - Checks in-memory session cache before network query.
 * - Supports cancellation via AbortSignal to drop stale in-flight results.
 * - Handles English, Tamil script, and Thanglish interchangeably.
 * - Falls back gracefully to local catalog on network/database failure.
 */
export async function searchCatalogFast(
  query: string,
  limit = 8,
  signal?: AbortSignal
): Promise<Product[]> {
  const cleanQuery = query.trim().slice(0, 60);
  if (cleanQuery.length < 2) return [];

  const cacheKey = `${cleanQuery.toLowerCase()}_${limit}`;
  const cached = getCachedResults(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Check if caller already aborted before firing request
    if (signal?.aborted) {
      return [];
    }

    // Call public.search_products_fast RPC
    const { data, error } = await supabase.rpc('search_products_fast', {
      query: cleanQuery,
      p_limit: Math.min(30, Math.max(1, limit)),
      search_term: cleanQuery,
      max_results: Math.min(30, Math.max(1, limit)),
    });

    if (signal?.aborted) {
      return [];
    }

    if (error) {
      console.warn(`[searchCatalogFast] Supabase RPC error code: ${error.code || error.message || 'UNKNOWN'}`);
    }

    if (error || !data || data.length === 0) {
      // Local fallback search (handles Tamil substring and Latin lowercase)
      const q = cleanQuery.toLowerCase();
      const fallbackResults = fallbackProducts
        .filter(
          (p) =>
            p.nameEn.toLowerCase().includes(q) ||
            p.nameTa.includes(cleanQuery) ||
            p.category.toLowerCase().includes(q)
        )
        .slice(0, limit);

      setCachedResults(cacheKey, fallbackResults);
      return fallbackResults;
    }

    const formattedResults: Product[] = data.map((row: any) => ({
      id: row.id,
      nameEn: row.name_en,
      nameTa: row.name_ta,
      category: row.category_id,
      image: row.image,
      inStock: Boolean(row.in_stock),
      badge: row.badge || undefined,
      badgeTa: row.badge_ta || undefined,
      variants:
        Array.isArray(row.variants) && row.variants.length > 0
          ? row.variants.map((v: any) => ({
              label: v.label || '1 pack',
              price: Number(v.price || 0),
              mrp: Number(v.mrp || v.price || 0),
              stock_qty: typeof v.stock_qty === 'number' ? v.stock_qty : 20,
            }))
          : [{ label: '1 pack', price: 50, mrp: 60 }],
    }));

    setCachedResults(cacheKey, formattedResults);
    return formattedResults;
  } catch (err: any) {
    if (signal?.aborted) {
      return [];
    }

    const q = cleanQuery.toLowerCase();
    const fallbackResults = fallbackProducts
      .filter((p) => p.nameEn.toLowerCase().includes(q) || p.nameTa.includes(cleanQuery))
      .slice(0, limit);

    setCachedResults(cacheKey, fallbackResults);
    return fallbackResults;
  }
}