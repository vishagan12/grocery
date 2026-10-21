'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products, categories, Product } from '@/data/products';
import { searchCatalogFast } from '@/lib/searchProducts';
import {
  Zap,
  Search,
  User,
  ChevronDown,
  Languages,
  Store,
  ShoppingCart,
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
  Heart,
  RotateCcw,
} from 'lucide-react';
import OtpInput from '@/components/OtpInput';

export default function Header() {
  const { state, dispatch, showToast } = useStore();
  const lang = state.lang;
  const [searchFocused, setSearchFocused] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const queryTrimmed = state.searchQuery.trim();

  useEffect(() => {
    if (queryTrimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const results = await searchCatalogFast(queryTrimmed, 6);
        if (isMounted) {
          setSuggestions(results);
        }
      } catch {
        if (isMounted) {
          setSuggestions([]);
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [queryTrimmed]);

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
      {/* Top Bar: Brand Store Icon, Location, Language Toggle & Profile (Apple Green #76CA3E) */}
      <div className="bg-[#76CA3E] text-[#143B0D] relative z-40 border-b border-[#143B0D]/10">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2">
          <div className="flex items-center justify-between gap-2.5">
            {/* Left: Store Logo Badge + Clean Aligned Location Pill */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Home Logo Button - Supermarket Store Icon Badge */}
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'SET_PAGE', page: 'home' });
                  dispatch({ type: 'SET_CATEGORY', category: 'all' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#143B0D] text-[#76CA3E] flex items-center justify-center shadow-md border-2 border-[#143B0D]/30 hover:scale-105 active:scale-95 transition-all shrink-0 focus:outline-none group relative overflow-hidden"
                title={lang === 'ta' ? 'ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட் முகப்பு' : 'Sri Amman Supermarket'}
                aria-label="Sri Amman Supermarket Home"
              >
                <Store className="w-5 h-5 text-[#76CA3E] group-hover:scale-110 relative z-10 transition-transform drop-shadow-2xs stroke-[2.2]" />
              </button>

              {/* Subtle vertical divider */}
              <div className="h-6 w-px bg-[#143B0D]/20 shrink-0" />

              {/* Clean, perfectly aligned location pill with MapPin */}
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_LOCATION_MODAL', open: true })}
                className="flex items-center gap-2 bg-[#143B0D]/15 hover:bg-[#143B0D]/25 border border-[#143B0D]/20 px-2.5 py-1 rounded-xl text-left group min-w-0 transition-all active:scale-95"
                title="Change delivery location"
              >
                <MapPin className="w-3.5 h-3.5 text-[#143B0D] shrink-0" />
                <div className="flex flex-col leading-none min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-[#143B0D] text-[11px] sm:text-xs uppercase tracking-wide break-words max-w-[150px] xs:max-w-[220px] sm:max-w-[320px]">
                      {state.location.area || 'Madurai'}
                    </span>
                    <ChevronDown className="w-2.5 h-2.5 text-[#143B0D]/80 group-hover:translate-y-0.5 transition-transform shrink-0" />
                  </div>
                  <span className="text-[#143B0D] font-extrabold text-[9px] sm:text-[10px] whitespace-nowrap mt-0.5">
                    {state.location.deliveryMins} {lang === 'ta' ? 'நிமிடம்' : 'mins'}
                  </span>
                </div>
              </button>
            </div>

            {/* Right: Language Toggle & Profile Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Language Pill Switcher */}
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_LANG', lang: lang === 'en' ? 'ta' : 'en' })}
                className="flex items-center gap-1.5 bg-[#143B0D]/15 hover:bg-[#143B0D]/25 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-[#143B0D]/25 text-[11px] sm:text-xs font-black text-[#143B0D] shadow-2xs transition-all active:scale-95"
                aria-label="Toggle Language"
              >
                <Languages className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#143B0D] shrink-0" />
                <span className="font-extrabold">{lang === 'en' ? 'தமிழ்' : 'English'}</span>
              </button>

              {/* User Profile / Login Icon Button */}
              <button
                type="button"
                onClick={() => {
                  if (state.isLoggedIn) {
                    dispatch({ type: 'SET_PAGE', page: 'profile' });
                  } else {
                    setLoginOpen(true);
                  }
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#143B0D]/15 hover:bg-[#143B0D]/25 border border-[#143B0D]/25 flex items-center justify-center text-[#143B0D] transition-all shadow-2xs active:scale-95"
                aria-label="Account login and profile"
                title="Account"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#143B0D]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY SEARCH & CATEGORIES HEADER in Light Apple Green #76CA3E */}
      <header
        className={`sticky top-0 z-50 text-[#143B0D] transition-all duration-300 ${
          isScrolled
            ? 'bg-[#76CA3E]/95 backdrop-blur-xl shadow-xl border-b border-[#143B0D]/15'
            : 'bg-[#76CA3E] shadow-md border-b border-[#143B0D]/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-2 pb-1.5">
          {/* Row 2: Search Bar + Wishlist Heart Button Layout (Equal symmetric spacing on both sides) */}
          <div ref={searchRef} className="relative z-30 mb-2 w-full">
            <div className="flex items-center gap-2 sm:gap-3 w-full">
              {/* Floating Pill Search Bar */}
              <div
                className={`flex-1 min-w-0 flex items-center bg-white rounded-2xl shadow-md h-11 sm:h-12 px-3 sm:px-4 border-2 transition-all ${
                  searchFocused
                    ? 'border-yellow-400 ring-2 ring-yellow-400/30'
                    : 'border-transparent'
                }`}
              >
                {/* Green Magnifying Glass Icon */}
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#76CA3E] shrink-0 mr-2 sm:mr-2.5" />

                {/* Input with simple clean placeholder */}
                <input
                  type="text"
                  placeholder={lang === 'ta' ? 'தேடுங்கள்' : 'Search'}
                  value={state.searchQuery}
                  onChange={(e) => dispatch({ type: 'SET_SEARCH', query: e.target.value })}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchFocused(false);
                      dispatch({ type: 'SET_PAGE', page: 'products' });
                    }
                  }}
                  className="flex-1 bg-transparent text-xs sm:text-base outline-none text-slate-900 placeholder-slate-400 font-medium min-w-0"
                />

                {state.searchQuery && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_SEARCH', query: '' })}
                    className="p-1 text-slate-400 hover:text-slate-600 mr-1"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Right: Subtle vertical divider + Quick 1-Click Order Again Badge */}
                <div className="h-5 sm:h-6 w-px bg-slate-200 mx-1 sm:mx-1.5 shrink-0" />
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_PAGE', page: 'monthly-list' })}
                  className="flex items-center gap-1 sm:gap-1.5 bg-[#F1F9EC] hover:bg-[#E2F3D9] text-[#143B0D] px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all shrink-0 border border-[#76CA3E]/30"
                >
                  <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#3D9415] shrink-0" />
                  <span className="whitespace-nowrap hidden xs:inline">
                    {lang === 'ta' ? 'மீண்டும் ஆர்டர்' : 'Order Again'}
                  </span>
                  <span className="whitespace-nowrap xs:hidden">
                    {lang === 'ta' ? 'மீண்டும்' : 'Reorder'}
                  </span>
                </button>
              </div>

              {/* Wishlist Heart Button - Equal symmetric spacing on both sides */}
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_PAGE', page: 'wishlist' })}
                className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-100 flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0 group"
                aria-label="View Wishlist"
                title="Wishlist"
              >
                <Heart
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 duration-200 ${
                    state.wishlist.length > 0
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-slate-600 group-hover:text-rose-500'
                  }`}
                />
                {state.wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] sm:text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-scale-in">
                    {state.wishlist.length}
                  </span>
                )}
              </button>
            </div>

            {/* Search Autocomplete Dropdown */}
            {searchFocused && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in text-slate-900">
                {suggestions.map((p) => {
                  const cat = categories.find((c) => c.id === p.category);
                  const firstVariant = p.variants?.[0] || { price: 0, label: '1 pack' };
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
                          ₹{firstVariant.price} — {firstVariant.label}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({ type: 'ADD_TO_CART', productId: p.id, variantIndex: 0 });
                          showToast(t('addedToCart', lang));
                        }}
                        className="bg-[#76CA3E] hover:bg-[#60B328] text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap shadow-xs flex items-center gap-1"
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
          <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden no-scrollbar py-1 text-[#143B0D] -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 touch-pan-x cursor-grab active:cursor-grabbing select-none">
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
                      ? 'bg-[#143B0D] text-white shadow-md font-black'
                      : 'bg-[#143B0D]/10 hover:bg-[#143B0D]/20 text-[#143B0D] font-bold'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'ta' ? tab.labelTa : tab.labelEn}</span>
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
  const { state, dispatch, showToast } = useStore();
  const lang = state.lang;
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');

  const handleSendOtp = () => {
    if (phone.length >= 10) {
      setStep('otp');
    }
  };

  const handleVerifyOtp = () => {
    const code = otpDigits.join('');
    if (code.length === 4) {
      setStep('name');
    }
  };

  const handleCompleteLogin = () => {
    const finalName = name.trim() || 'Vishagan';
    const finalPhone = `+91-${phone || '1234567890'}`;

    let formattedDob = '12 Dec 2006';
    if (dob) {
      try {
        const d = new Date(dob);
        if (!isNaN(d.getTime())) {
          formattedDob = d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        } else {
          formattedDob = dob;
        }
      } catch {
        formattedDob = dob;
      }
    }

    dispatch({
      type: 'SET_LOGIN',
      phone: finalPhone,
      name: finalName,
      dob: formattedDob,
      loggedIn: true,
    });
    showToast(lang === 'ta' ? `வரவேற்கிறோம், ${finalName}!` : `Welcome, ${finalName}!`);
    onClose();
    // User requested: the profile must open only when I click it, it must not open after I log in
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in box-border">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto box-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F1F9EC] flex items-center justify-center text-[#76CA3E]">
              <User className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">
              {step === 'name'
                ? lang === 'ta'
                  ? 'உங்கள் பெயர்'
                  : "What's your name?"
                : lang === 'ta'
                ? 'ஸ்ரீ அம்மன் உள்நுழைவு'
                : 'Sri Amman Account'}
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
          {step === 'name'
            ? lang === 'ta'
              ? 'உங்கள் பெயரைக் கூறி உங்கள் கணக்கை தொடங்குங்கள்'
              : 'Please enter your name to customize your grocery profile.'
            : step === 'otp'
            ? lang === 'ta'
              ? `+91 ${phone} க்கு அனுப்பப்பட்ட OTP ஐ உள்ளிடவும் (எந்த எண்ணும் ஏற்கப்படும்)`
              : `Enter the OTP sent to +91 ${phone} (any digits accepted)`
            : lang === 'ta'
            ? 'உங்கள் மொபைல் எண்ணை உள்ளிட்டு விரைவாக உள்நுழையுங்கள்'
            : 'Enter your phone number to access saved addresses and express checkout.'}
        </p>

        {step === 'phone' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'ta' ? 'மொபைல் எண்' : 'Phone Number'}
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#76CA3E]">
                <span className="bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 border-r border-slate-200">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2.5 text-sm outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            <button
              disabled={phone.length < 10}
              onClick={handleSendOtp}
              className="w-full bg-[#76CA3E] disabled:bg-slate-300 text-white font-extrabold py-3 rounded-xl transition-all shadow-sm active:scale-98"
            >
              {lang === 'ta' ? 'OTP அனுப்பவும்' : 'Continue'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2 text-center">
                {lang === 'ta' ? '4-இலக்க OTP குறியீட்டை உள்ளிடவும்' : 'Enter 4-Digit Verification OTP'}
              </label>
              <OtpInput
                value={otpDigits}
                onChange={setOtpDigits}
                onComplete={handleVerifyOtp}
              />
            </div>

            <button
              disabled={otpDigits.join('').length < 4}
              onClick={handleVerifyOtp}
              className="w-full bg-[#76CA3E] disabled:bg-slate-300 text-white font-extrabold py-3 rounded-xl shadow-sm active:scale-98 transition-all"
            >
              {lang === 'ta' ? 'சரிபார்க்கவும்' : 'Verify & Continue'}
            </button>
          </div>
        )}

        {step === 'name' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'ta' ? 'உங்கள் பெயர்' : 'Full Name'}
              </label>
              <input
                type="text"
                placeholder="Vishagan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl outline-none focus:border-[#76CA3E]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'ta' ? 'பிறந்த தேதி' : 'Date of Birth'}
              </label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl outline-none focus:border-[#76CA3E] bg-white text-slate-800 cursor-pointer"
              />
            </div>

            <button
              onClick={handleCompleteLogin}
              className="w-full bg-[#76CA3E] text-white font-extrabold py-3 rounded-xl shadow-sm active:scale-98"
            >
              {lang === 'ta' ? 'உள்நுழையவும்' : 'Complete & Log In'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
