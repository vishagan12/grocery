import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { products as fallbackCatalog, categories as fallbackCategories } from '@/data/products';

// Next.js ISR: Revalidate cached public catalog every 180 seconds (3 minutes)
export const revalidate = 180;

let catalogMemoryCache: { body: any; expiry: number } | null = null;
function invalidateCatalogMemoryCache() {
  catalogMemoryCache = null;
}

// In-memory 30s cache for search queries on Edge
const searchMemoryCache = new Map<string, { body: any; expiry: number }>();

/**
 * Public Catalog & Search Route
 * - If `?q=` is supplied: executes fast trigram/Thanglish search via `public.search_products_fast` RPC.
 * - Otherwise: serves the full cached catalog, variants, categories, and store operational status.
 * Highly cacheable via HTTP CDN headers (s-maxage=60 for search, s-maxage=180 for full catalog).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawQ = searchParams.get('q');
  const query = rawQ ? rawQ.trim().slice(0, 60) : '';

  // --------------------------------------------------------------------------
  // PATH A: Search Query Mode (?q=...)
  // --------------------------------------------------------------------------
  if (query.length >= 2) {
    const cacheKey = `search:${query.toLowerCase()}`;
    const cachedSearch = searchMemoryCache.get(cacheKey);
    if (cachedSearch && Date.now() < cachedSearch.expiry) {
      const res = NextResponse.json(cachedSearch.body);
      res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      return res;
    }

    try {
      const { data, error } = await supabase.rpc('search_products_fast', {
        search_term: query,
        query: query,
        max_results: 30,
        p_limit: 30,
      });

      let catalog = [];
      if (!error && data && data.length > 0) {
        catalog = data.map((row: any) => ({
          id: row.id,
          nameEn: row.name_en,
          nameTa: row.name_ta || '',
          category: row.category_id,
          image: row.image,
          inStock: Boolean(row.in_stock),
          badge: row.badge || undefined,
          badgeTa: row.badge_ta || undefined,
          variants:
            Array.isArray(row.variants) && row.variants.length > 0
              ? row.variants.map((v: any) => ({
                  id: v.id,
                  label: v.label || '1 pack',
                  price: Number(v.price || 0),
                  mrp: Number(v.mrp || v.price || 0),
                  stock_qty: typeof v.stock_qty === 'number' ? v.stock_qty : 20,
                }))
              : [{ label: '1 pack', price: Number(row.min_price || 50), mrp: Number(row.min_price || 50) }],
        }));
      } else {
        // Fallback local search if RPC returns 0 matches or fails
        const qLower = query.toLowerCase();
        catalog = fallbackCatalog
          .filter(
            (p) =>
              p.nameEn.toLowerCase().includes(qLower) ||
              p.nameTa.includes(query) ||
              p.category.toLowerCase().includes(qLower)
          )
          .slice(0, 30);
      }

      const responseBody = {
        catalog,
        categories: fallbackCategories,
        acceptingOrders: true,
        query,
        count: catalog.length,
        timestamp: new Date().toISOString(),
      };

      searchMemoryCache.set(cacheKey, {
        body: responseBody,
        expiry: Date.now() + 30 * 1000, // 30s cache TTL
      });

      const response = NextResponse.json(responseBody);
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
      return response;
    } catch (err) {
      const qLower = query.toLowerCase();
      const fallbackResults = fallbackCatalog.filter(
        (p) => p.nameEn.toLowerCase().includes(qLower) || p.nameTa.includes(query)
      );
      return NextResponse.json({
        catalog: fallbackResults,
        categories: fallbackCategories,
        acceptingOrders: true,
        query,
        count: fallbackResults.length,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // --------------------------------------------------------------------------
  // PATH B: Full Catalog Mode
  // --------------------------------------------------------------------------
  if (catalogMemoryCache && Date.now() < catalogMemoryCache.expiry) {
    const res = NextResponse.json(catalogMemoryCache.body);
    res.headers.set('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=600');
    return res;
  }

  try {
    // Execute categories, products+variants join, and feature flags concurrently in parallel
    const [
      { data: rawCategories },
      { data: rawProducts, error: productsError },
      { data: rawFlags }
    ] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name_en, name_ta, image')
        .order('id'),
      supabase
        .from('products')
        .select('id, name_en, name_ta, category_id, image, in_stock, product_variants(id, label, price, mrp, stock_qty)')
        .order('id'),
      supabase
        .from('feature_flags')
        .select('key, enabled'),
    ]);

    let acceptingOrders = true;
    if (rawFlags && Array.isArray(rawFlags)) {
      const flag = rawFlags.find((f: any) => f.key === 'accepting_orders');
      if (flag) acceptingOrders = Boolean(flag.enabled);
    }

    let categories = fallbackCategories;
    if (rawCategories && rawCategories.length > 0) {
      categories = rawCategories.map((c: any) => ({
        id: c.id,
        nameEn: c.name_en,
        nameTa: c.name_ta || '',
        image: c.image || '',
      }));
    }

    let catalog = fallbackCatalog;
    if (!productsError && rawProducts && rawProducts.length > 0) {
      const fallbackOrder = new Map(fallbackCatalog.map((p, idx) => [p.id, idx]));
      catalog = rawProducts.map((p: any) => ({
        id: p.id,
        nameEn: p.name_en,
        nameTa: p.name_ta || '',
        category: p.category_id,
        image: p.image,
        inStock: Boolean(p.in_stock),
        variants:
          Array.isArray(p.product_variants) && p.product_variants.length > 0
            ? p.product_variants.map((v: any) => ({
                id: v.id,
                label: v.label || '1 pack',
                price: Number(v.price || 0),
                mrp: Number(v.mrp || v.price || 0),
                stock_qty: typeof v.stock_qty === 'number' ? v.stock_qty : 20,
              }))
            : [{ label: '1 pack', price: 50, mrp: 60 }],
      }));
      // Preserve default catalog ordering so hydration never reshuffles the initial row
      catalog.sort((a, b) => {
        const ordA = fallbackOrder.has(a.id) ? (fallbackOrder.get(a.id) as number) : 999;
        const ordB = fallbackOrder.has(b.id) ? (fallbackOrder.get(b.id) as number) : 999;
        return ordA - ordB;
      });
    }

    const responseBody = {
      catalog,
      categories,
      acceptingOrders,
      timestamp: new Date().toISOString(),
    };
    catalogMemoryCache = {
      body: responseBody,
      expiry: Date.now() + 60 * 1000, // 60s memory cache
    };
    const response = NextResponse.json(responseBody);

    // HTTP Cache-Control header for Edge CDN & Browser Caching
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=180, stale-while-revalidate=600'
    );

    return response;
  } catch (err: any) {
    // Fail-soft: deliver local catalog if network or database is temporarily unreachable
    return NextResponse.json({
      catalog: fallbackCatalog,
      categories: fallbackCategories,
      acceptingOrders: true,
      timestamp: new Date().toISOString(),
    });
  }
}
