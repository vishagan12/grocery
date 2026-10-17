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
        {/* Section Heading - Clean single-line row on all screen sizes */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-200/80 gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="font-black text-[#0F172A] tracking-tight text-sm sm:text-xl whitespace-nowrap truncate">
                {t('dealOfDay', lang)}
              </h3>
              <span className="hidden xs:inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black bg-[#76CA3E] text-white px-2 py-0.5 rounded-full shadow-2xs whitespace-nowrap shrink-0">
                <Flame className="w-3 h-3 fill-current shrink-0" />
                <span>{lang === 'ta' ? 'சிறப்பு சலுகை' : 'HOT DEALS'}</span>
              </span>
            </div>
            <p className="text-slate-600 font-medium text-[11px] sm:text-sm mt-0.5 truncate hidden sm:block">
              {lang === 'ta'
                ? 'நேரடி கடை கவுண்டர் விலை • 20 நிமிட விரைவு டெலிவரி'
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
            className="text-[11px] sm:text-sm font-black text-[#143B0D] hover:text-[#76CA3E] transition-colors bg-white hover:bg-emerald-50/50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs whitespace-nowrap flex items-center gap-1 sm:gap-1.5 shrink-0"
          >
            <span>{t('viewAllDeals', lang)}</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
