'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { Zap, ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  const { state, dispatch } = useStore();
  const lang = state.lang;

  const bentoCards = [
    {
      id: 'vegetables-fruits',
      titleEn: 'Fresh Farm Vegetables',
      titleTa: 'பண்ணை காய்கறிகள்',
      badgeEn: 'Up to 25% Off',
      badgeTa: '25% வரை தள்ளுபடி',
      subEn: 'Daily Fresh Stock',
      subTa: 'தினசரி புதிய வரத்து',
      image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'oils-ghee',
      titleEn: 'Cooking Oils & Ghee',
      titleTa: 'சமையல் எண்ணெய் & நெய்',
      badgeEn: 'Wholesale Price',
      badgeTa: 'மொத்த விலை சேமிப்பு',
      subEn: 'Direct Store Counter',
      subTa: 'கவுண்டர் விலை',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'dairy-eggs',
      titleEn: 'Aavin Dairy & Eggs',
      titleTa: 'ஆவின் பால் & முட்டை',
      badgeEn: 'Morning Fresh',
      badgeTa: 'காலை புதிய வரத்து',
      subEn: 'Chilled & Inspected',
      subTa: 'பரிசோதிக்கப்பட்ட தரம்',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'household-pooja',
      titleEn: 'Daily Pooja Essentials',
      titleTa: 'பூஜை & விசேஷ தேவைகள்',
      badgeEn: 'Pooja Needs',
      badgeTa: 'விசேஷ தேவைகள்',
      subEn: 'Camphor, Agarbatti & Oils',
      subTa: 'கற்பூரம், அகர்பத்தி',
      image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <section className="bg-gradient-to-b from-[#4CB01E]/15 via-[#F8FAF7] to-white pt-2.5 sm:pt-3.5 pb-5 sm:pb-7 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Headline Banner: Super Saver Typography - Fully visible, wraps cleanly */}
        <div className="py-2.5 px-3 mb-3 bg-white/95 rounded-2xl border border-[#4CB01E]/20 shadow-2xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-[#4CB01E] shrink-0" />
          <h2 className="text-xs sm:text-sm font-extrabold text-[#1E4D12] tracking-tight text-center leading-snug">
            {lang === 'ta'
              ? 'ஸ்ரீ அம்மன் சூப்பர் சேவர் • அத்தியாவசிய மளிகைக்கு 30% வரை தள்ளுபடி'
              : 'Sri Amman Super Saver • Up to 30% OFF Daily Essentials'}
          </h2>
          <Sparkles className="w-4 h-4 text-[#4CB01E] shrink-0" />
        </div>

        {/* 3-Column Asymmetric Bento Grid (Mobile & Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-4">
          {/* Left Tall Card (Slim and compact on mobile, perfectly scaled on desktop) */}
          <div
            onClick={() => dispatch({ type: 'SET_PAGE', page: 'monthly-list' })}
            className="md:col-span-5 relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 text-white p-3 sm:p-5 md:p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer min-h-[135px] sm:min-h-[180px] md:min-h-[350px] group border border-emerald-800/30 select-none"
          >
            {/* Background Image Overlay: Crystal Clear, high visibility photography */}
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85"
                alt="Monthly Provision Bundle"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                loading="lazy"
              />
              {/* Soft, reduced subtle gradient so photo shines through brightly */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
            </div>

            {/* Content Top - Fully visible with clean scaling */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-[#143B0D] text-[10px] sm:text-[11px] font-black px-2 py-0.5 sm:py-1 rounded-full uppercase tracking-wider mb-1 sm:mb-1.5 shadow-2xs whitespace-nowrap">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current shrink-0" />
                <span>{lang === 'ta' ? 'குடும்ப மெகா சேமிப்பு' : 'Bestselling Bundle'}</span>
              </div>
              <h3 className="text-sm xs:text-base sm:text-2xl md:text-3xl font-black text-white leading-tight mb-0.5 sm:mb-1">
                {lang === 'ta' ? 'மாதாந்திர மளிகை தொகுப்பு' : 'Monthly Maligai Bundle'}
              </h3>
              <p className="text-[10px] xs:text-[11px] sm:text-sm text-emerald-100 font-medium leading-snug line-clamp-1 sm:line-clamp-none">
                {lang === 'ta'
                  ? 'அரிசி, பருப்பு, எண்ணெய் & மசாலா அனைத்தும் ஒரே கிளிக்கில்'
                  : 'Rice, Dals, Oils & Masalas in 1 tap'}
              </p>
            </div>

            {/* Content Bottom: Price Pill + 1-Tap Trigger */}
            <div className="relative z-10 mt-2 sm:mt-4 flex items-center justify-between gap-2 pt-1.5 sm:pt-2 border-t border-white/20 flex-nowrap">
              <div className="flex items-baseline gap-1.5 sm:gap-2 bg-black/40 backdrop-blur-md px-2 sm:px-3 py-0.5 sm:py-1.5 rounded-xl border border-white/20 shrink-0">
                <span className="text-xs xs:text-sm sm:text-xl font-black text-yellow-300">₹1,540</span>
                <span className="text-[9px] xs:text-[10px] sm:text-xs text-white/60 line-through">₹1,890</span>
                <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-extrabold text-emerald-300 bg-emerald-950/70 px-1.5 py-0.5 rounded">
                  {lang === 'ta' ? 'ரூ.350 மிச்சம்' : 'SAVE ₹350'}
                </span>
              </div>
              <span className="bg-white text-[#143B0D] font-black text-[10px] xs:text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1 sm:py-2 rounded-xl shadow-xs group-hover:bg-yellow-300 transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap">
                <span>{lang === 'ta' ? 'ஆர்டர் செய்' : 'Order Now'}</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
            </div>
          </div>

          {/* Right 4 Bento Grid Cards (Spans 7 cols on desktop, 2x2 grid on mobile) */}
          <div className="md:col-span-7 grid grid-cols-2 gap-2.5 sm:gap-4">
            {bentoCards.map((card) => (
              <div
                key={card.id}
                onClick={() => {
                  dispatch({ type: 'SET_CATEGORY', category: card.id });
                  dispatch({ type: 'SET_PAGE', page: 'products' });
                }}
                className="relative rounded-2xl overflow-hidden bg-white p-2.5 sm:p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all cursor-pointer border border-slate-200/80 hover:border-[#4CB01E] group min-h-[185px] sm:min-h-[205px] select-none"
              >
                {/* Card Top: Badge & Full Title visible on multiple lines */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-black text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded-full inline-block">
                      {lang === 'ta' ? card.badgeTa : card.badgeEn}
                    </span>
                    <span className="text-[10px] font-bold text-[#4CB01E] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                      <span>{lang === 'ta' ? 'பார்க்க' : 'Shop'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug break-words">
                    {lang === 'ta' ? card.titleTa : card.titleEn}
                  </h4>
                </div>

                {/* Card Center: Prominent, High-Resolution Studio Image Showcase */}
                <div className="w-full h-20 sm:h-24 my-1.5 rounded-xl overflow-hidden bg-[#F8FAF7] border border-slate-100/80 shadow-2xs flex items-center justify-center relative group-hover:bg-[#F1F9EC] transition-colors">
                  <img
                    src={card.image}
                    alt={card.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                {/* Card Bottom: Subtext fully visible */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-0.5 leading-tight">
                  <span>{lang === 'ta' ? card.subTa : card.subEn}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wide Action Strip Below Bento Grid: 1-Tap Reorder (Full text visible) */}
        <div
          onClick={() => dispatch({ type: 'SET_PAGE', page: 'monthly-list' })}
          className="mt-2.5 sm:mt-4 bg-[#F1F9EC] hover:bg-[#E6F5DE] border border-[#4CB01E]/30 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2.5 shadow-2xs transition-all cursor-pointer select-none group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#4CB01E] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Zap className="w-4 h-4 text-yellow-300 fill-current" />
            </div>
            <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-snug">
              <strong className="font-extrabold text-[#1E4D12]">
                {lang === 'ta'
                  ? 'கடந்த மாத மளிகையை 1 தட்டலில் மீண்டும் ஆர்டர் செய்'
                  : "Reorder Last Month's Groceries in 1 Tap"}
              </strong>
              <span className="hidden sm:inline text-slate-500">
                {' '}
                — {lang === 'ta' ? '20 நிமிடம் மிச்சப்படுத்துங்கள்' : 'Save 20 minutes today'}
              </span>
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white border border-[#4CB01E]/30 flex items-center justify-center text-[#4CB01E] font-bold group-hover:bg-[#4CB01E] group-hover:text-white transition-all shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </section>
  );
}
