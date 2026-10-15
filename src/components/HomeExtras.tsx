'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { IconCheckCircle, IconTruck, IconZap, IconShield } from './Icons';
import { ArrowRight } from 'lucide-react';

export function WhyChooseUs() {
  const { state } = useStore();
  const lang = state.lang;

  const features = [
    {
      title: t('why1Title', lang),
      desc: t('why1Desc', lang),
      icon: <IconCheckCircle className="w-5 h-5 text-[#4CB01E]" />,
      tag: lang === 'ta' ? '100% தரம்' : '100% Inspected',
    },
    {
      title: t('why2Title', lang),
      desc: t('why2Desc', lang),
      icon: <IconShield className="w-5 h-5 text-[#4CB01E]" />,
      tag: lang === 'ta' ? 'மொத்த விலை' : 'Honest Pricing',
    },
    {
      title: t('why3Title', lang),
      desc: t('why3Desc', lang),
      icon: <IconTruck className="w-5 h-5 text-[#4CB01E]" />,
      tag: lang === 'ta' ? '20 நிமிட டெலிவரி' : '20-Min Express',
    },
    {
      title: t('why4Title', lang),
      desc: t('why4Desc', lang),
      icon: <IconZap className="w-5 h-5 text-[#4CB01E]" />,
      tag: lang === 'ta' ? 'கூடுதல் சேமிப்பு' : 'Extra Savings',
    },
  ];

  return (
    <section className="py-6 sm:py-10 bg-[#F1F9EC]/50 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-5 sm:mb-8">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#1E4D12] bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-2xs mb-2 inline-block whitespace-nowrap">
            {lang === 'ta' ? 'ஸ்ரீ அம்மன் உறுதிமொழி' : 'The Sri Amman Promise'}
          </span>
          <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {t('whyTitle', lang)}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-normal">
            {t('whySubtitle', lang)}
          </p>
        </div>

        {/* Sri Amman Promise: Stacks 1 under the other on mobile (totally 4), senior-friendly, spacious */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-md md:max-w-none mx-auto">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-all duration-300 flex items-start gap-3.5 sm:flex-col sm:items-stretch"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#F1F9EC] border border-[#4CB01E]/20 flex items-center justify-center shrink-0">
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug break-words">
                    {f.title}
                  </h4>
                  <span className="text-[10px] sm:text-[11px] font-bold text-[#1E4D12] bg-[#F1F9EC] px-2 py-0.5 rounded-md border border-[#4CB01E]/20 shrink-0">
                    {f.tag}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CustomerReviews() {
  const { state, dispatch } = useStore();
  const lang = state.lang;

  const reviews = [
    {
      name: t('rev1Name', lang),
      location: t('rev1Loc', lang),
      text: t('rev1Text', lang),
      rating: 5,
      date: lang === 'ta' ? '2 நாட்களுக்கு முன்' : '2 days ago',
    },
    {
      name: t('rev2Name', lang),
      location: t('rev2Loc', lang),
      text: t('rev2Text', lang),
      rating: 5,
      date: lang === 'ta' ? 'நேற்று' : 'Yesterday',
    },
    {
      name: t('rev3Name', lang),
      location: t('rev3Loc', lang),
      text: t('rev3Text', lang),
      rating: 5,
      date: lang === 'ta' ? '1 வாரத்திற்கு முன்' : '1 week ago',
    },
  ];

  return (
    <section className="py-6 sm:py-10 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* Kudumba Monthly Provision Callout Banner */}
        <div className="mb-6 sm:mb-8 bg-gradient-to-r from-[#143B0D] via-[#1E4D12] to-[#2E7D32] rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3.5 sm:gap-6 border border-emerald-500/30">
          <div className="w-full sm:max-w-xl text-center sm:text-left min-w-0">
            <span className="inline-flex items-center gap-1.5 bg-yellow-400 text-[#143B0D] text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2 shadow-2xs whitespace-nowrap">
              <IconZap className="w-3.5 h-3.5 text-[#143B0D] shrink-0" />
              <span>{lang === 'ta' ? 'குடும்ப மெகா சேமிப்பு' : 'Family Bundle Deal'}</span>
            </span>
            <h3 className={`font-black tracking-tight mb-1.5 text-white ${lang === 'ta' ? 'text-sm sm:text-2xl leading-normal' : 'text-base sm:text-2xl leading-tight'}`}>
              {lang === 'ta' ? '1-கிளிக் குடும்ப மாத மளிகை தொகுப்பு' : '1-Click Kudumba Monthly Grocery Bundle'}
            </h3>
            <p className={`text-emerald-100/90 font-medium ${lang === 'ta' ? 'text-[11px] sm:text-sm leading-relaxed' : 'text-xs sm:text-sm leading-normal'}`}>
              {lang === 'ta'
                ? 'அரிசி, பருப்பு, எண்ணெய் & சமையல் சாமான்கள் அனைத்தும் ஒரே கூடை தொகுப்பாக வாங்குங்கள்.'
                : t('kudumbaSubtitle', lang)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_PAGE', page: 'monthly-list' })}
            className="w-full sm:w-auto justify-center bg-white hover:bg-yellow-300 text-[#143B0D] font-black text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-xs hover:shadow-md transition-all whitespace-nowrap shrink-0 active:scale-95 inline-flex items-center gap-2"
          >
            <span>{lang === 'ta' ? 'மாத மளிகை தேர்வு செய்' : t('monthlyListBtn', lang)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Reviews Section Header */}
        <div className="text-center max-w-xl mx-auto mb-5 sm:mb-6">
          <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('reviewsTitle', lang)}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5 leading-normal">
            {t('reviewsSubtitle', lang)}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-2.5 sm:gap-4">
          {reviews.map((rev, i) => (
            <div
              key={i}
              className="bg-[#F8FAF7] rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-2">
                  {[...Array(rev.rating)].map((_, idx) => (
                    <svg key={idx} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-3 sm:mb-4">
                  &ldquo;{rev.text}&rdquo;
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between gap-1 flex-wrap">
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-slate-900">{rev.name}</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">{rev.location}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                  {rev.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
