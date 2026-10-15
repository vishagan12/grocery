'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { categories } from '@/data/products';
import { ArrowRight } from 'lucide-react';

export default function CategoryGrid() {
  const { state, dispatch } = useStore();
  const lang = state.lang;

  const navigateCategory = (categoryId: string) => {
    dispatch({ type: 'SET_CATEGORY', category: categoryId });
    dispatch({ type: 'SET_PAGE', page: 'products' });
  };

  return (
    <section className="py-4 sm:py-7 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Section Heading - 100% visible text */}
        <div className="flex items-center justify-between mb-3.5 sm:mb-5 pb-2.5 border-b border-slate-100 gap-2">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight leading-snug">
              {lang === 'ta' ? 'மளிகை & அத்தியாவசிய பொருட்கள்' : 'Grocery & Kitchen Essentials'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5 leading-snug">
              {lang === 'ta'
                ? 'அனைத்து புதிய பொருட்கள் 20 நிமிடத்தில் டெலிவரி'
                : 'Direct from store counter • Delivered in 20 minutes'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'SET_CATEGORY', category: 'all' });
              dispatch({ type: 'SET_PAGE', page: 'products' });
            }}
            className="text-xs sm:text-sm font-black text-[#4CB01E] hover:text-[#3D9415] transition-colors bg-white px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs whitespace-nowrap flex items-center gap-1 shrink-0"
          >
            <span>{lang === 'ta' ? 'அனைத்தும்' : 'See All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 8 Symmetrical Identical Category Cards: 4 columns on mobile, 8 columns on desktop */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3.5">
          {categories.map((cat) => {
            const isSelected = state.activeCategory === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => navigateCategory(cat.id)}
                className={`rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-between cursor-pointer transition-all border group shadow-2xs hover:shadow-sm text-center select-none min-h-[110px] sm:min-h-[125px] ${
                  isSelected
                    ? 'bg-[#F1F9EC] border-[#4CB01E] ring-1 ring-[#4CB01E]'
                    : 'bg-[#F8FAF7] hover:bg-[#F1F9EC] border-slate-200/80 hover:border-[#4CB01E]'
                }`}
              >
                {/* Prominent Image Window */}
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-white p-1 mb-1.5 shadow-2xs flex items-center justify-center border border-slate-100/80">
                  <img
                    src={cat.image}
                    alt={cat.nameEn}
                    className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>

                {/* Clean Multi-Line Category Label (Zero hidden ellipsis) */}
                <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight text-center break-words w-full px-0.5">
                  {lang === 'ta' ? cat.nameTa : cat.nameEn}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
