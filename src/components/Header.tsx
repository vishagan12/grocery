'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products, categories } from '@/data/products';
import {
  Zap,
  Search,
  User,
  ChevronDown,
  Languages,
  ShoppingBag,
  Package,
  Leaf,
  Milk,
  Droplets,
  Cookie,
  Sparkles,
  X,
  Plus,
  MapPin,
} from 'lucide-react';

export default function Header() {
  const { state, dispatch, showToast } = useStore();
  const lang = state.lang;
  const [searchFocused, setSearchFocused] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const queryTrimmed = state.searchQuery.trim().toLowerCase();
  const filteredSearch =
    queryTrimmed.length >= 2
      ? products
          .filter(
            (p) =>
              p.nameEn.toLowerCase().includes(queryTrimmed) ||
              p.nameTa.includes(state.searchQuery.trim())
          )
          .slice(0, 6)
      : [];

  useEffect(() => {
    function handleScroll() {
      if (typeof window !== 'undefined') {
        setIsScrolled(window.scrollY > 40);
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Quick horizontal category tabs for Row 3 with Lucide stroke icons
  const quickTabs = [
    { id: 'all', labelEn: 'All', labelTa: 'அனைத்தும்', Icon: ShoppingBag },
    { id: 'rice-grains', labelEn: 'Provisions', labelTa: 'மளிகை', Icon: Package },
    { id: 'vegetables-fruits', labelEn: 'Vegetables', labelTa: 'காய்கறி', Icon: Leaf },
    { id: 'dairy-eggs', labelEn: 'Dairy & Milk', labelTa: 'பால்', Icon: Milk },
    { id: 'oils-ghee', labelEn: 'Oils & Ghee', labelTa: 'எண்ணெய்', Icon: Droplets },
    { id: 'snacks-biscuits', labelEn: 'Snacks', labelTa: 'சிற்றுண்டி', Icon: Cookie },
    { id: 'household-pooja', labelEn: 'Pooja Needs', labelTa: 'பூஜை', Icon: Sparkles },
  ];

  return (
    <>
      {/* Top Bar: Brand SA Icon, Location, Language Toggle & Profile (Scrolls away naturally) */}
      <div className="bg-[#1E4D12] text-white relative z-20 border-b border-emerald-900/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
          <div className="flex items-center justify-between gap-2.5">
            {/* Left: SA Logo Badge + Clean Aligned Location Pill */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Home SA Logo Button - Clean icon badge only */}
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'SET_PAGE', page: 'home' });
                  dispatch({ type: 'SET_CATEGORY', category: 'all' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white text-[#1E4D12] flex items-center justify-center font-black text-xs sm:text-sm shadow-xs border border-yellow-300 hover:scale-105 active:scale-95 transition-all shrink-0 focus:outline-none"
                title={lang === 'ta' ? 'முகப்பு பக்கம் செல்ல' : 'Go to Homepage'}
                aria-label="Sri Amman Supermarket Home"
              >
                <span>SA</span>
              </button>

              {/* Subtle vertical divider */}
              <div className="h-6 w-px bg-white/20 shrink-0" />

              {/* Clean, perfectly aligned location pill with MapPin */}
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_LOCATION_MODAL', open: true })}
                className="flex items-center gap-2 bg-black/20 hover:bg-black/30 border border-white/20 px-2.5 py-1 rounded-xl text-left group min-w-0 transition-all active:scale-95"
                title="Change delivery location"
              >
                <MapPin className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                <div className="flex flex-col leading-none min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-white text-[11px] sm:text-xs uppercase tracking-wide truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[200px]">
                      {state.location.area || 'Madurai'}
                    </span>
                    <ChevronDown className="w-2.5 h-2.5 text-white/70 group-hover:translate-y-0.5 transition-transform shrink-0" />
                  </div>
                  <span className="text-yellow-300/90 font-bold text-[9px] sm:text-[10px] whitespace-nowrap mt-0.5">
                    20 {lang === 'ta' ? 'நிமிடம்' : 'mins'}
                  </span>
                </div>
              </button>
            </div>

            {/* Right: Language Toggle & Profile Button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Language Pill Switcher */}
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_LANG', lang: lang === 'en' ? 'ta' : 'en' })}
                className="flex items-center gap-1.5 bg-black/25 hover:bg-black/35 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/30 text-[11px] sm:text-xs font-black text-white shadow-2xs transition-all active:scale-95"
                aria-label="Toggle Language"
              >
                <Languages className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-300 shrink-0" />
                <span className="font-bold">{lang === 'en' ? 'தமிழ்' : 'English'}</span>
              </button>

              {/* User Profile / Login Icon Button */}
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 flex items-center justify-center text-white transition-all shadow-2xs active:scale-95"
                aria-label="Account login"
                title="Account"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY SEARCH & CATEGORIES HEADER: Solid green below top menu, lush emerald green blur when scrolled */}
      <header
        className={`sticky top-0 z-50 text-white border-b transition-all duration-300 ${
          isScrolled
            ? 'bg-[#1E4D12]/85 backdrop-blur-xl border-[#4CB01E]/30 shadow-lg'
            : 'bg-[#1E4D12] border-emerald-900/40 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 pt-2 pb-1.5">
          {/* Row 2: Floating Pill Search Bar */}
          <div ref={searchRef} className="relative z-30 mb-2">
            <div
              className={`flex items-center bg-white rounded-2xl shadow-md h-12 px-3 sm:px-4 border-2 transition-all ${
                searchFocused
                  ? 'border-yellow-400 ring-2 ring-yellow-400/30'
                  : 'border-transparent'
              }`}
            >
              {/* Green Magnifying Glass Icon */}
              <Search className="w-5 h-5 text-[#4CB01E] shrink-0 mr-2.5" />

              {/* Input with clear placeholder */}
              <input
                type="text"
                placeholder={
                  lang === 'ta'
                    ? 'தேடுங்கள் "பொன்னி அரிசி, ஆவின் பால், கோல்ட் வின்னர்..."'
                    : 'Search "Ponni Rice, Aavin Milk, Gold Winner..."'
                }
                value={state.searchQuery}
                onChange={(e) => dispatch({ type: 'SET_SEARCH', query: e.target.value })}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchFocused(false);
                    dispatch({ type: 'SET_PAGE', page: 'products' });
                  }
                }}
                className="flex-1 bg-transparent text-sm sm:text-base outline-none text-slate-900 placeholder-slate-400 font-medium"
              />

              {state.searchQuery && (
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_SEARCH', query: '' })}
                  className="p-1 text-slate-400 hover:text-slate-600 mr-2"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Right: Subtle vertical divider + Quick 1-Click Monthly List Badge */}
              <div className="h-5 sm:h-6 w-px bg-slate-200 mx-1 sm:mx-1.5 shrink-0" />
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_PAGE', page: 'monthly-list' })}
                className="flex items-center gap-1 sm:gap-1.5 bg-[#F1F9EC] hover:bg-[#E2F3D9] text-[#1E4D12] px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all shrink-0 border border-[#4CB01E]/30"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-600 fill-current shrink-0" />
                <span className="whitespace-nowrap hidden xs:inline">
                  {lang === 'ta' ? 'மாத மளிகை' : 'Monthly List'}
                </span>
                <span className="whitespace-nowrap xs:hidden">
                  {lang === 'ta' ? 'மாத மளிகை' : 'List'}
                </span>
              </button>
            </div>

            {/* Search Autocomplete Dropdown */}
            {searchFocused && filteredSearch.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in text-slate-900">
                {filteredSearch.map((p) => {
                  const cat = categories.find((c) => c.id === p.category);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAF7] cursor-pointer transition-colors border-b border-slate-100 last:border-0"
                      onClick={() => {
                        dispatch({ type: 'SET_PRODUCT_DETAIL', id: p.id });
                        dispatch({ type: 'SET_PAGE', page: 'product-detail' });
                        setSearchFocused(false);
                        dispatch({ type: 'SET_SEARCH', query: '' });
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0 flex items-center justify-center p-1">
                        <img
                          src={p.image || cat?.image}
                          alt={p.nameEn}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 leading-snug break-words">
                          {lang === 'ta' ? p.nameTa : p.nameEn}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          ₹{p.variants[0].price} — {p.variants[0].label}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({ type: 'ADD_TO_CART', productId: p.id, variantIndex: 0 });
                          showToast(t('addedToCart', lang));
                        }}
                        className="bg-[#4CB01E] hover:bg-[#3D9415] text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap shadow-xs flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{lang === 'ta' ? 'சேர்' : 'ADD'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Row 3: Blinkit-Style Horizontal Icon Category Strip with Lucide Icons (Seamless Edge-to-Edge) */}
          <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden no-scrollbar py-1 text-white -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 touch-pan-x cursor-grab active:cursor-grabbing select-none">
            {quickTabs.map((tab) => {
              const TabIcon = tab.Icon;
              const isActive =
                tab.id === 'all'
                  ? state.currentPage === 'home' || (state.currentPage === 'products' && state.activeCategory === 'all')
                  : state.activeCategory === tab.id && state.currentPage === 'products';

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.id === 'all') {
                      dispatch({ type: 'SET_PAGE', page: 'home' });
                      dispatch({ type: 'SET_CATEGORY', category: 'all' });
                    } else {
                      dispatch({ type: 'SET_CATEGORY', category: tab.id });
                      dispatch({ type: 'SET_PAGE', page: 'products' });
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 relative ${
                    isActive
                      ? 'bg-white text-[#1E4D12] shadow-sm font-black'
                      : 'bg-white/15 text-white/90 hover:bg-white/25'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'ta' ? tab.labelTa : tab.labelEn}</span>
                  {isActive && (
                    <div className="absolute -bottom-1 left-3 right-3 h-0.5 bg-yellow-300 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  );
}

function LoginModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const lang = state.lang;
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F1F9EC] flex items-center justify-center text-[#4CB01E]">
              <User className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">
              {lang === 'ta' ? 'ஸ்ரீ அம்மன் உள்நுழைவு' : 'Sri Amman Account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          {lang === 'ta'
            ? 'உங்கள் மொபைல் எண்ணை உள்ளிட்டு விரைவாக உள்நுழையுங்கள்'
            : 'Enter your phone number to access saved orders and express delivery.'}
        </p>

        {!otpSent ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'ta' ? 'மொபைல் எண்' : 'Phone Number'}
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#4CB01E]">
                <span className="bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 border-r border-slate-200">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2.5 text-sm outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            <button
              disabled={phone.length < 10}
              onClick={() => setOtpSent(true)}
              className="w-full bg-[#4CB01E] disabled:bg-slate-300 text-white font-extrabold py-3 rounded-xl transition-all shadow-sm"
            >
              {lang === 'ta' ? 'OTP அனுப்பவும்' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'ta' ? 'OTP குறியீடு (டெமோ: 1234)' : 'Enter OTP (Demo: 1234)'}
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-bold border border-slate-200 rounded-xl py-2.5 outline-none focus:border-[#4CB01E]"
              />
            </div>

            <button
              onClick={() => {
                dispatch({
                  type: 'SET_LOGIN',
                  phone: `+91 ${phone || '9876543210'}`,
                  loggedIn: true,
                });
                onClose();
              }}
              className="w-full bg-[#4CB01E] text-white font-extrabold py-3 rounded-xl shadow-sm"
            >
              {lang === 'ta' ? 'சரிபார்க்கவும்' : 'Verify & Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
