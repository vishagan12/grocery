'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { IconMapPin, IconTruck, IconClock, IconPhone, IconChevronDown } from './Icons';

export default function TopStrip() {
  const { state, dispatch } = useStore();
  const lang = state.lang;

  return (
    <div className="bg-brand-deep text-white text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs md:text-sm text-white/90">
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_LOCATION_MODAL', open: true })}
            className="flex items-center gap-1.5 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-all border border-white/15 text-left"
            aria-label="Change delivery location"
          >
            <IconMapPin className="w-3.5 h-3.5 text-brand-mint shrink-0" />
            <span>
              {lang === 'ta' ? 'டெலிவரி:' : 'Deliver to:'} <strong className="font-bold text-emerald-200">{state.location.area}</strong> ({state.location.deliveryMins}m)
            </span>
            <IconChevronDown className="w-3 h-3 text-white/70" />
          </button>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:flex items-center gap-1.5">
            <IconTruck className="w-3.5 h-3.5 text-brand-mint shrink-0" />
            <span>{t('freeDelivery', lang)}</span>
          </span>
          <span className="hidden md:inline text-white/40">|</span>
          <span className="hidden md:flex items-center gap-1.5">
            <IconClock className="w-3.5 h-3.5 text-brand-mint shrink-0" />
            <span>{t('storeHours', lang)}</span>
          </span>
          <span className="hidden lg:inline text-white/40">|</span>
          <a href="tel:+919876543210" className="hidden lg:flex items-center gap-1.5 hover:text-white transition-colors">
            <IconPhone className="w-3.5 h-3.5 text-brand-mint shrink-0" />
            <span>{t('helpline', lang)}</span>
          </a>
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_LANG', lang: lang === 'en' ? 'ta' : 'en' })}
          className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-full px-3 py-1 text-xs font-semibold transition-all touch-target"
          style={{ minHeight: '32px' }}
          aria-label="Toggle language"
        >
          <span className={lang === 'en' ? 'text-white font-bold' : 'text-white/70'}>English</span>
          <span className="text-white/40">/</span>
          <span className={lang === 'ta' ? 'text-white font-bold' : 'text-white/70'}>தமிழ்</span>
        </button>
      </div>
    </div>
  );
}
