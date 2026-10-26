'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { IconCart, IconPhone, IconMail, IconClock } from '@/components/Icons';
import { Languages } from 'lucide-react';

const STORE_PHONE_DISPLAY = '+91 98765 43210';
const STORE_PHONE_HREF = 'tel:+919876543210';
const STORE_EMAIL = 'sriammansupermarket@gmail.com';

export default function Footer() {
  const { state, dispatch } = useStore();
  const lang = state.lang;

  const goTo = (page: string, category?: string) => {
    dispatch({ type: 'SET_PAGE', page });
    if (category) dispatch({ type: 'SET_CATEGORY', category });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const linkClass =
    'inline-flex items-center min-h-[36px] rounded-md hover:text-white hover:underline underline-offset-4 transition-colors text-left';

  return (
    <footer className="bg-brand-deep text-white py-10 md:py-14 pb-36 md:pb-28 border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div
                aria-hidden="true"
                className="w-10 h-10 rounded-xl bg-apple flex items-center justify-center text-brand-forest shadow-sm"
              >
                <IconCart className="w-5 h-5" />
              </div>
              <p className="text-xl font-extrabold">{t('brandName', lang)}</p>
            </div>
            <p className="text-emerald-50/80 text-sm leading-relaxed max-w-prose">{t('footerTagline', lang)}</p>
            <p className="text-emerald-50/75 text-sm mt-2">{t('footerAddress', lang)}</p>
          </div>

          {/* Quick Links */}
          <nav aria-label={t('quickLinks', lang)}>
            <h2 className="font-bold text-base mb-3 text-emerald-300">{t('quickLinks', lang)}</h2>
            <ul className="space-y-1 text-sm text-emerald-50/85">
              <li>
                <button type="button" onClick={() => goTo('home')} className={linkClass}>
                  {t('home', lang)}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => goTo('products', 'all')} className={linkClass}>
                  {t('allProducts', lang)}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => goTo('monthly-list')} className={linkClass}>
                  {lang === 'ta' ? 'மீண்டும் ஆர்டர்' : 'Order Again'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => goTo('orders')} className={linkClass}>
                  {t('trackOrder', lang)}
                </button>
              </li>
            </ul>
          </nav>

          {/* Contact & Language */}
          <div>
            <h2 className="font-bold text-base mb-3 text-emerald-300">{t('customerCare', lang)}</h2>
            <ul className="space-y-1 text-sm text-emerald-50/85 mb-4">
              <li>
                <a href={STORE_PHONE_HREF} className={`${linkClass} gap-2`}>
                  <IconPhone className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>{STORE_PHONE_DISPLAY}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${STORE_EMAIL}`} className={`${linkClass} gap-2 break-all`}>
                  <IconMail className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>{STORE_EMAIL}</span>
                </a>
              </li>
              <li className="flex items-center gap-2 min-h-[36px]">
                <IconClock className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>{t('storeHours', lang)}</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_LANG', lang: lang === 'en' ? 'ta' : 'en' })}
              className="inline-flex items-center gap-2 min-h-[44px] bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/20"
            >
              <Languages aria-hidden="true" className="w-4 h-4 text-emerald-300" />
              <span lang={lang === 'en' ? 'ta' : 'en'}>
                {lang === 'en' ? 'தமிழில் படிக்கவும்' : 'Switch to English'}
              </span>
            </button>
          </div>
        </div>

        <div
          suppressHydrationWarning
          className="border-t border-white/15 mt-8 pt-6 text-center text-xs md:text-sm text-emerald-50/75"
        >
          © {new Date().getFullYear()} {t('brandName', lang)}. {t('allRights', lang)}
        </div>
      </div>
    </footer>
  );
}
