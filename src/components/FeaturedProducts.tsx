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
        {/* Section Heading - 100% text visible across multiple lines */}
        <div className="flex items-center justify-between mb-3.5 sm:mb-5 pb-2.5 border-b border-slate-200/80 gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight leading-snug">
                {t('dealOfDay', lang)}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black bg-[#4CB01E] text-white px-2 py-0.5 rounded-full shadow-2xs shrink-0 whitespace-nowrap">
                <Flame className="w-3 h-3 fill-current shrink-0" />
                <span>HOT DEALS</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 leading-snug">
              {lang === 'ta'
                ? 'நேரடி கவுண்டர் விலை • 20 நிமிட விரைவு டெலிவரி'
                : 'Direct store counter price • Delivered in 20 minutes'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'SET_PAGE', page: 'products' });
              dispatch({ type: 'SET_CATEGORY', category: 'all' });
              dispatch({ type: 'SET_SORT', sort: 'discount' });
            }}
            className="text-xs sm:text-sm font-black text-[#4CB01E] hover:text-[#3D9415] transition-colors bg-white px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs whitespace-nowrap flex items-center gap-1 shrink-0"
          >
            <span>{t('viewAllDeals', lang)}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
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
