'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { IconCart, IconPhone, IconMail, IconClock } from '@/components/Icons';
import { Languages } from 'lucide-react';

export default function Footer() {
  const { state, dispatch } = useStore();
  const lang = state.lang;

  return (
    <footer className="bg-brand-deep text-white py-10 md:py-14 pb-24 md:pb-12 border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-sm">
                <IconCart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-extrabold">{t('brandName', lang)}</h3>
            </div>
            <p className="text-emerald-100/70 text-sm leading-relaxed">{t('footerTagline', lang)}</p>
            <p className="text-emerald-100/50 text-sm mt-2">{t('footerAddress', lang)}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-base mb-3 text-emerald-300">
              {t('quickLinks', lang)}
            </h4>
            <div className="space-y-2 text-sm text-emerald-100/80 flex flex-col items-start">
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'SET_PAGE', page: 'home' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition-colors"
              >
                {t('home', lang)}
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'SET_PAGE', page: 'products' });
                  dispatch({ type: 'SET_CATEGORY', category: 'all' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition-colors"
              >
                {t('allProducts', lang)}
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'SET_PAGE', page: 'monthly-list' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition-colors"
              >
                {t('monthlyList', lang)}
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'SET_PAGE', page: 'orders' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition-colors"
              >
                {t('trackOrder', lang)}
              </button>
            </div>
          </div>

          {/* Contact & Language */}
          <div>
            <h4 className="font-bold text-base mb-3 text-emerald-300">
              {t('customerCare', lang)}
            </h4>
            <div className="space-y-2 text-sm text-emerald-100/80 mb-4">
              <p className="flex items-center gap-2">
                <IconPhone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </p>
              <p className="flex items-center gap-2">
                <IconMail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>sriammansupermarket@gmail.com</span>
              </p>
              <p className="flex items-center gap-2">
                <IconClock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{t('storeHours', lang)}</span>
              </p>
            </div>

            <button
              onClick={() => dispatch({ type: 'SET_LANG', lang: lang === 'en' ? 'ta' : 'en' })}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border border-white/20"
            >
              <Languages className="w-4 h-4 text-emerald-300" />
              <span>{lang === 'en' ? 'தமிழில் படிக்கவும்' : 'Switch to English'}</span>
            </button>
          </div>
        </div>

        <div className="border-t border-emerald-900/50 mt-8 pt-6 text-center text-xs md:text-sm text-emerald-100/50">
          © 2026 {t('brandName', lang)}. {t('allRights', lang)}
        </div>
      </div>
    </footer>
  );
}
