'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { IconTag, IconTruck } from './Icons';

export default function PromoBanners() {
  const { state, dispatch } = useStore();
  const lang = state.lang;

  return (
    <section className="py-4 sm:py-6 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="grid md:grid-cols-2 gap-3 sm:gap-5">
          {/* Weekend Super Saver Banner - 100% full text visible */}
          <div
            onClick={() => {
              dispatch({ type: 'SET_PAGE', page: 'products' });
              dispatch({ type: 'SET_CATEGORY', category: 'all' });
              dispatch({ type: 'SET_SORT', sort: 'discount' });
            }}
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer min-h-[160px] sm:min-h-[190px] flex items-center p-4 sm:p-7 shadow-2xs border border-emerald-900/10 select-none"
          >
            <img
              src="https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80"
              alt="Weekend Grocery Deals"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#173812]/95 via-[#1D4A17]/85 to-transparent" />

            <div className="relative z-10 max-w-sm text-white min-w-0">
              <span className="inline-flex items-center gap-1.5 bg-[#FDE047] text-[#1E3B18] text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 shadow-2xs whitespace-nowrap">
                <IconTag className="w-3 h-3 shrink-0" />
                <span>{t('limitedOffer', lang)}</span>
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-white leading-tight mb-1">
                {t('weekendSaver', lang)}
              </h3>
              <p className="text-white/85 text-xs sm:text-sm font-medium leading-normal">
                {t('upTo30Off', lang)}
              </p>
            </div>
          </div>

          {/* 20-Min Delivery Banner - 100% full text visible */}
          <div
            onClick={() => {
              dispatch({ type: 'SET_PAGE', page: 'products' });
              dispatch({ type: 'SET_CATEGORY', category: 'all' });
            }}
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer min-h-[160px] sm:min-h-[190px] flex items-center p-4 sm:p-7 shadow-2xs border border-emerald-900/10 select-none"
          >
            <img
              src="https://images.unsplash.com/photo-1543168256-418811576931?auto=format&fit=crop&w=800&q=80"
              alt="Express Delivery Fresh Produce"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#142C12]/95 via-[#1D3E1A]/85 to-transparent" />

            <div className="relative z-10 max-w-sm text-white min-w-0">
              <span className="inline-flex items-center gap-1.5 bg-[#76CA3E] text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 shadow-2xs whitespace-nowrap">
                <IconTruck className="w-3 h-3 text-white shrink-0" />
                <span>{t('expressRider', lang)}</span>
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-white leading-tight mb-1">
                {lang === 'ta' ? '20 நிமிட விரைவு டெலிவரி' : '20-Min Superfast Delivery'}
              </h3>
              <p className="text-white/85 text-xs sm:text-sm font-medium leading-normal">
                {t('byOurRiders', lang)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
