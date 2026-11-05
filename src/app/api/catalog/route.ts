import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { products as fallbackCatalog, categories as fallbackCategories } from '@/data/products';

// Next.js ISR: Revalidate cached public catalog every 180 seconds (3 minutes)
export const revalidate = 180;

let catalogMemoryCache: { body: any; expiry: number } | null = null;
function invalidateCatalogMemoryCache() {
  catalogMemoryCache = null;
}

/**
 * Public Catalog Cache Route
 * Serves products, variants, categories, and store operational status.
 * Highly cacheable via Next.js ISR & HTTP CDN cache headers (s-maxage=180, stale-while-revalidate=600).
 * Completely devoid of any user-specific or private customer data.
 */
export async function GET() {
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
