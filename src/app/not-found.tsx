'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import {
  PackageSearch,
  Compass,
  Search,
  Home,
  ArrowLeft,
  ArrowRight,
  Store,
  Languages,
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  // Safe StoreContext resolution
  let storeContext: ReturnType<typeof useStore> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    storeContext = useStore();
  } catch {
    storeContext = null;
  }

  const [localLang, setLocalLang] = useState<'en' | 'ta'>('en');
  const [searchQuery, setSearchQuery] = useState('');

  const currentLang = storeContext ? storeContext.state.lang : localLang;

  const toggleLanguage = () => {
    if (storeContext) {
      storeContext.dispatch({
        type: 'SET_LANG',
        lang: storeContext.state.lang === 'ta' ? 'en' : 'ta',
      });
    } else {
      setLocalLang((prev) => (prev === 'ta' ? 'en' : 'ta'));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQ = searchQuery.trim();
    if (storeContext) {
      if (cleanQ) {
        storeContext.dispatch({ type: 'SET_SEARCH', query: cleanQ });
      }
      storeContext.dispatch({ type: 'SET_PAGE', page: 'home' });
    }
    router.push(cleanQ ? `/?q=${encodeURIComponent(cleanQ)}` : '/');
  };

  const handleCategoryClick = (categorySlug: string) => {
    if (storeContext) {
      storeContext.dispatch({ type: 'SET_CATEGORY', category: categorySlug });
      storeContext.dispatch({ type: 'SET_PAGE', page: 'home' });
    }
    router.push('/');
  };

  const handleGoHome = () => {
    if (storeContext) {
      storeContext.dispatch({ type: 'SET_PAGE', page: 'home' });
    }
    router.push('/');
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      handleGoHome();
    }
  };

  const popularAisles = [
    {
      id: 'rice-grains',
      titleEn: 'Rice & Grains',
      titleTa: 'அரிசி & மாவு',
      descEn: 'Basmati, Ponni, Atta & Millet',
      descTa: 'பாசுமதி, பொன்னி & சிறுதானியம்',
    },
    {
      id: 'dals-pulses',
      titleEn: 'Dals & Pulses',
      titleTa: 'பருப்பு & மசாலா',
      descEn: 'Toor, Moong & Whole Spices',
      descTa: 'துவரம்பருப்பு, பாசிப்பருப்பு',
    },
    {
      id: 'oils-ghee',
      titleEn: 'Oils & Ghee',
      titleTa: 'எண்ணெய் & நெய்',
      descEn: 'Groundnut, Gingelly & Cow Ghee',
      descTa: 'கடலை, நல்லெண்ணெய், நெய்',
    },
    {
      id: 'dairy-eggs',
      titleEn: 'Milk & Fresh',
      titleTa: 'பால் & காய்கறி',
      descEn: 'Fresh Milk, Curd, Paneer & Butter',
      descTa: 'பசும்பால், தயிர், பன்னீர்',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 md:p-8 box-border relative overflow-x-hidden">
      {/* Top Bar with Language Switcher */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pt-2 pb-4">
        <Link
          href="/"
          onClick={handleGoHome}
          className="inline-flex items-center gap-2 group text-slate-800 hover:text-emerald-700 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Store className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-black text-sm tracking-tight text-slate-900">
            {currentLang === 'ta' ? 'ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட்' : 'Sri Amman Supermarket'}
          </span>
        </Link>

        {/* Floating Language Pill */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-black shadow-2xs transition-all active:scale-95"
          title="Switch language"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-600" />
          <span>{currentLang === 'ta' ? 'English' : 'தமிழ்'}</span>
        </button>
      </div>

      {/* Main 404 Hero Card */}
      <main className="max-w-xl mx-auto w-full text-center my-auto py-6 sm:py-8 box-border">
        {/* Layered Vector / Icon Illustration ("Empty Grocery Aisle / Lost Cart") */}
        <div className="relative inline-block mb-4">
          <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-100 via-emerald-50 to-amber-50 border border-emerald-200/70 shadow-inner flex items-center justify-center relative">
            <PackageSearch className="w-14 h-14 text-emerald-700 stroke-[1.75]" />

            {/* Floating 404 Pill */}
            <div className="absolute -top-2.5 -right-3 bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-md tracking-wider">
              404
            </div>

            {/* Decorative Compass Badge */}
            <div className="absolute -bottom-2 -left-2 w-9 h-9 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-600">
              <Compass className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
        </div>

        {/* Eyebrow Pill */}
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-black tracking-wider uppercase">
            {currentLang === 'ta' ? 'பக்கம் கிடைக்கவில்லை • பிழை 404' : 'Aisle Not Found • Error 404'}
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
          {currentLang === 'ta'
            ? 'மன்னிக்கவும்! நீங்கள் தேடும் பக்கம் கிடைக்கவில்லை'
            : "Oops! We couldn't find this aisle"}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-2.5 leading-relaxed font-medium">
          {currentLang === 'ta'
            ? 'நீங்கள் தேடிய இணைய முகவரி மாற்றப்பட்டிருக்கலாம் அல்லது நீக்கப்பட்டிருக்கலாம். புதிய மளிகைப் பொருட்களை வாங்க முகப்புப் பக்கத்திற்குச் செல்லுங்கள்.'
            : "The page or item link you followed may have been moved, renamed, or is temporarily out of stock. Let's get you back to fresh groceries in seconds."}
        </p>

        {/* Interactive Quick-Search Bar */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto mt-6 px-1 w-full box-border">
          <div className="relative flex items-center bg-white border border-slate-300 rounded-2xl p-1.5 shadow-sm focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/15 transition-all">
            <Search className="w-4 h-4 text-slate-400 ml-2.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                currentLang === 'ta'
                  ? 'அரிசி, பருப்பு, எண்ணெய், பால் தேடுங்கள்...'
                  : 'Search rice, dal, oil, milk, snacks...'
              }
              className="flex-1 w-full min-w-0 px-3 py-2 text-xs sm:text-sm outline-none bg-transparent text-slate-900 placeholder:text-slate-400 font-medium"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-2xs shrink-0"
            >
              {currentLang === 'ta' ? 'தேடு' : 'Search'}
            </button>
          </div>
        </form>

        {/* Primary & Secondary Call-To-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 max-w-md mx-auto w-full px-1">
          <Link
            href="/"
            onClick={handleGoHome}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all text-center box-border"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {currentLang === 'ta' ? 'முகப்புப் பக்கத்திற்குச் செல்' : 'Back to Sri Amman Supermarket'}
            </span>
          </Link>

          <button
            type="button"
            onClick={handleGoBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 shadow-2xs transition-all text-center box-border shrink-0 active:scale-[0.99]"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>{currentLang === 'ta' ? 'முந்தைய பக்கம்' : 'Go Back'}</span>
          </button>
        </div>

        {/* Popular Supermarket Aisles Quick-Jump Grid */}
        <div className="border-t border-slate-200/80 mt-8 pt-6 w-full box-border">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            {currentLang === 'ta'
              ? 'அல்லது முக்கியப் பிரிவுகளுக்குச் செல்லவும்'
              : 'OR JUMP STRAIGHT TO POPULAR AISLES'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 text-left">
            {popularAisles.map((aisle) => (
              <button
                key={aisle.id}
                type="button"
                onClick={() => handleCategoryClick(aisle.id)}
                className="group p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex flex-col justify-between shadow-2xs hover:shadow-sm active:scale-98 text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform" />
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-800 transition-colors leading-tight">
                    {currentLang === 'ta' ? aisle.titleTa : aisle.titleEn}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 font-medium">
                    {currentLang === 'ta' ? aisle.descTa : aisle.descEn}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Store Support Footer Bar */}
      <footer className="max-w-4xl mx-auto w-full pt-4 pb-2 text-center border-t border-slate-200/60">
        <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-semibold flex-wrap">
          <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            {currentLang === 'ta'
              ? 'ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட் • மதுரையின் நம்பகமான விரைவு மளிகை டெலிவரி'
              : "Sri Amman Supermarket • Madurai's Trusted Express Grocery Delivery"}
          </span>
        </div>
      </footer>
    </div>
  );
}
