import { supabase } from '@/lib/supabase';
import { Product, products as fallbackProducts } from '@/data/products';

export async function searchCatalogFast(query: string, limit = 6): Promise<Product[]> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) return [];

  try {
    const { data, error } = await supabase.rpc('search_products_fast', {
      search_term: cleanQuery,
      max_results: limit,
    });

    if (error || !data || data.length === 0) {
      const q = cleanQuery.toLowerCase();
      return fallbackProducts
        .filter(
          (p) =>
            p.nameEn.toLowerCase().includes(q) ||
            p.nameTa.includes(cleanQuery) ||
            p.category.toLowerCase().includes(q)
        )
        .slice(0, limit);
    }

    return data.map((row: any) => ({
      id: row.id,
      nameEn: row.name_en,
      nameTa: row.name_ta,
      category: row.category_id,
      image: row.image,
      inStock: row.in_stock,
      badge: row.badge || undefined,
      badgeTa: row.badge_ta || undefined,
      variants:
        Array.isArray(row.variants) && row.variants.length > 0
          ? row.variants
          : [{ label: '1 pack', price: 50, mrp: 60 }],
    }));
  } catch (err) {
    const q = cleanQuery.toLowerCase();
    return fallbackProducts
      .filter((p) => p.nameEn.toLowerCase().includes(q) || p.nameTa.includes(cleanQuery))
      .slice(0, limit);
  }
}