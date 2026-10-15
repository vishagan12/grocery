'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products } from '@/data/products';
import ProductCard from './ProductCard';
import { ArrowRight, Flame } from 'lucide-react';

export default function FeaturedProducts() {
  const { state, dispatch } = useStore();
  const lang = state.lang;

  // Show top 12 popular essentials
  const featured = products.slice(0, 12);

  return (
    <section className="py-4 sm:py-7 bg-[#F8FAF7]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Section Heading - Clean layout with optimal full-width space utilization */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-slate-200/80 gap-2.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-[#0F172A] tracking-tight text-base sm:text-xl whitespace-nowrap">
                {t('dealOfDay', lang)}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black bg-[#4CB01E] text-white px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                <Flame className="w-3 h-3 fill-current shrink-0" />
                <span>{lang === 'ta' ? 'சிறப்பு சலுகை' : 'HOT DEALS'}</span>
              </span>
            </div>
            <p className="text-slate-600 font-medium text-xs sm:text-sm mt-1">
              {lang === 'ta'
                ? 'நேரடி கடை கவுண்டர் விலை • 20 நிமிட விரைவு டெலிவரி'
                : 'Direct store counter price • Delivered in 20 minutes'}
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'SET_PAGE', page: 'products' });
                dispatch({ type: 'SET_CATEGORY', category: 'all' });
                dispatch({ type: 'SET_SORT', sort: 'discount' });
              }}
              className="text-xs sm:text-sm font-black text-[#1E4D12] hover:text-[#4CB01E] transition-colors bg-white hover:bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs whitespace-nowrap flex items-center gap-1.5 ml-auto sm:ml-0"
            >
              <span>{t('viewAllDeals', lang)}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
