'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { categories, Product } from '@/data/products';
import { searchCatalogFast } from '@/lib/searchProducts';
import { useDialog } from '@/hooks/useDialog';
import {
  Search,
  User,
  ChevronDown,
  Languages,
  Store,
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
      {/* Top Bar: Brand Store Icon, Location, Language Toggle & Profile */}
      <div className="bg-apple text-brand-forest relative z-40 border-b border-brand-forest/10">
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
                className="tap-target w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-brand-forest text-apple flex items-center justify-center shadow-md border-2 border-brand-forest/30 hover:scale-105 active:scale-95 transition-all shrink-0 group"
                title={lang === 'ta' ? 'ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட் முகப்பு' : 'Sri Amman Supermarket'}
                aria-label={lang === 'ta' ? 'ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட் முகப்பு' : 'Sri Amman Supermarket home'}
              >
                <Store aria-hidden="true" className="w-5 h-5 text-apple group-hover:scale-110 relative z-10 transition-transform drop-shadow-2xs stroke-[2.2]" />
              </button>

              {/* Subtle vertical divider */}
              <div className="h-6 w-px bg-brand-forest/20 shrink-0" />

              {/* Clean, perfectly aligned location pill with MapPin */}
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_LOCATION_MODAL', open: true })}
                aria-haspopup="dialog"
                className="flex items-center gap-2 min-h-[40px] bg-brand-forest/15 hover:bg-brand-forest/25 border border-brand-forest/20 px-2.5 py-1 rounded-xl text-left group min-w-0 transition-all active:scale-95"
                title={lang === 'ta' ? 'டெலிவரி இடத்தை மாற்றவும்' : 'Change delivery location'}
              >
                <MapPin aria-hidden="true" className="w-3.5 h-3.5 text-brand-forest shrink-0" />
                <span className="sr-only">{lang === 'ta' ? 'டெலிவரி இடம்:' : 'Delivery location:'}</span>
                <div className="flex flex-col leading-none min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-brand-forest text-[11px] sm:text-xs uppercase tracking-wide break-words max-w-[150px] xs:max-w-[220px] sm:max-w-[320px]">
                      {state.location.area || 'Madurai'}
                    </span>
                    <ChevronDown aria-hidden="true" className="w-2.5 h-2.5 text-brand-forest/80 group-hover:translate-y-0.5 transition-transform shrink-0" />
                  </div>
                  <span className="text-brand-forest font-extrabold text-[9px] sm:text-[10px] whitespace-nowrap mt-0.5">
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
                className="tap-target flex items-center gap-1.5 bg-brand-forest/15 hover:bg-brand-forest/25 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-brand-forest/25 text-[11px] sm:text-xs font-black text-brand-forest shadow-2xs transition-all active:scale-95"
                title={lang === 'en' ? 'Switch to Tamil' : 'Switch to English'}
              >
                <Languages aria-hidden="true" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-forest shrink-0" />
                <span className="font-extrabold" lang={lang === 'en' ? 'ta' : 'en'}>
                  {lang === 'en' ? 'தமிழ்' : 'English'}
                </span>
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
                aria-haspopup={state.isLoggedIn ? undefined : 'dialog'}
                className="tap-target w-9 h-9 rounded-full bg-brand-forest/15 hover:bg-brand-forest/25 border border-brand-forest/25 flex items-center justify-center text-brand-forest transition-all shadow-2xs active:scale-95"
                aria-label={
                  state.isLoggedIn
                    ? lang === 'ta' ? 'என் கணக்கு' : 'My account'
                    : lang === 'ta' ? 'உள்நுழைக' : 'Log in'
                }
                title={lang === 'ta' ? 'கணக்கு' : 'Account'}
              >
                <User aria-hidden="true" className="w-4 h-4 text-brand-forest" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky search & categories header */}
      <header
        className={`sticky top-0 z-50 text-brand-forest transition-all duration-300 ${
          isScrolled
            ? 'bg-apple/95 backdrop-blur-xl shadow-xl border-b border-brand-forest/15'
            : 'bg-apple shadow-md border-b border-brand-forest/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-2 pb-1.5">
          {/* Row 2: Search Bar + Wishlist Heart Button Layout (Equal symmetric spacing on both sides) */}
          <div
            ref={searchRef}
            className="relative z-30 mb-2 w-full"
            onBlur={(e) => {
              if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) {
                setSearchFocused(false);
              }
            }}
          >
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
                <Search aria-hidden="true" className="w-4 h-4 sm:w-5 sm:h-5 text-brand-highlight shrink-0 mr-2 sm:mr-2.5" />

                <input
                  type="search"
                  aria-label={lang === 'ta' ? 'பொருட்களைத் தேடுங்கள்' : 'Search products'}
                  autoComplete="off"
                  enterKeyHint="search"
                  placeholder={lang === 'ta' ? 'தேடுங்கள்' : 'Search'}
                  value={state.searchQuery}
                  onChange={(e) => dispatch({ type: 'SET_SEARCH', query: e.target.value })}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchFocused(false);
                      dispatch({ type: 'SET_PAGE', page: 'products' });
                    } else if (e.key === 'Escape') {
                      setSearchFocused(false);
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="flex-1 bg-transparent text-xs sm:text-base outline-none focus-visible:outline-none text-slate-900 placeholder-slate-500 font-medium min-w-0 [&::-webkit-search-cancel-button]:hidden"
                />

                {state.searchQuery && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_SEARCH', query: '' })}
                    className="tap-target p-1 text-slate-500 hover:text-slate-700 mr-1 rounded-md"
                    aria-label={lang === 'ta' ? 'தேடலை அழி' : 'Clear search'}
                  >
                    <X aria-hidden="true" className="w-4 h-4" />
                  </button>
                )}

                {/* Right: Subtle vertical divider + Quick 1-Click Order Again Badge */}
                <div className="h-5 sm:h-6 w-px bg-slate-200 mx-1 sm:mx-1.5 shrink-0" />
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_PAGE', page: 'monthly-list' })}
                  className="tap-target flex items-center gap-1 sm:gap-1.5 bg-brand-mint hover:bg-[#E2F3D9] text-brand-forest px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all shrink-0 border border-apple/30"
                >
                  <RotateCcw aria-hidden="true" className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-highlight shrink-0" />
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
                aria-label={
                  lang === 'ta'
                    ? `விருப்பப் பட்டியல் (${state.wishlist.length})`
                    : `Wishlist (${state.wishlist.length} items)`
                }
                aria-current={state.currentPage === 'wishlist' ? 'page' : undefined}
                title={lang === 'ta' ? 'விருப்பப் பட்டியல்' : 'Wishlist'}
              >
                <Heart
                  aria-hidden="true"
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 duration-200 ${
                    state.wishlist.length > 0
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-slate-600 group-hover:text-rose-500'
                  }`}
                />
                {state.wishlist.length > 0 && (
                  <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-scale-in">
                    {state.wishlist.length}
                  </span>
                )}
              </button>
            </div>

            {/* Search Autocomplete Dropdown */}
            {searchFocused && suggestions.length > 0 && (
              <ul
                aria-label={lang === 'ta' ? 'தேடல் பரிந்துரைகள்' : 'Search suggestions'}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in text-slate-900"
              >
                {suggestions.map((p) => {
                  const cat = categories.find((c) => c.id === p.category);
                  const firstVariant = p.variants?.[0] || { price: 0, label: '1 pack' };
                  const name = lang === 'ta' ? p.nameTa : p.nameEn;
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-brand-cream transition-colors border-b border-slate-100 last:border-0"
                    >
                      <button
                        type="button"
                        className="flex flex-1 min-w-0 items-center gap-3 text-left rounded-lg"
                        onClick={() => {
                          dispatch({ type: 'SET_PRODUCT_DETAIL', id: p.id });
                          dispatch({ type: 'SET_PAGE', page: 'product-detail' });
                          setSearchFocused(false);
                          dispatch({ type: 'SET_SEARCH', query: '' });
                        }}
                      >
                        <span className="w-10 h-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0 flex items-center justify-center p-1">
                          <img
                            src={p.image || cat?.image}
                            alt=""
                            width={40}
                            height={40}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold text-sm text-slate-900 leading-snug break-words">
                            {name}
                          </span>
                          <span className="block text-xs text-slate-600 font-medium">
                            ₹{firstVariant.price} — {firstVariant.label}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          dispatch({ type: 'ADD_TO_CART', productId: p.id, variantIndex: 0 });
                          showToast(t('addedToCart', lang));
                        }}
                        aria-label={lang === 'ta' ? `${name} கூடையில் சேர்` : `Add ${name} to cart`}
                        className="min-h-[36px] bg-apple hover:bg-apple-hover text-brand-forest px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap shadow-xs flex items-center gap-1"
                      >
                        <Plus aria-hidden="true" className="w-3.5 h-3.5" />
                        <span>{lang === 'ta' ? 'சேர்' : 'ADD'}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Row 3: Blinkit-Style Horizontal Icon Category Strip with Lucide Icons (Seamless Edge-to-Edge) */}
          <nav
            aria-label={lang === 'ta' ? 'பிரிவுகள்' : 'Categories'}
            className="flex items-center gap-2 overflow-x-auto overflow-y-hidden no-scrollbar py-1 text-brand-forest -mx-3 sm:-mx-6 px-3 sm:px-6 touch-pan-x select-none"
          >
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
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 relative ${
                    isActive
                      ? 'bg-brand-forest text-white shadow-md font-black'
                      : 'bg-brand-forest/10 hover:bg-brand-forest/20 text-brand-forest font-bold'
                  }`}
                >
                  <TabIcon aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'ta' ? tab.labelTa : tab.labelEn}</span>
                </button>
              );
            })}
          </nav>
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

  const panelRef = useDialog(true, onClose);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 10) {
      setStep('otp');
    }
  };

  const verifyOtp = (code: string) => {
    if (code.length === 4) {
      setStep('name');
    }
  };

  const handleCompleteLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    if (!finalName) return;
    const finalPhone = `+91-${phone}`;

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
    // Profile opens only when the user clicks it, never automatically after login
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 animate-fade-in box-border"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        aria-describedby="login-modal-desc"
        tabIndex={-1}
        className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] max-h-[90dvh] overflow-y-auto box-border animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-mint flex items-center justify-center text-brand-highlight">
              <User aria-hidden="true" className="w-4 h-4" />
            </div>
            <h2 id="login-modal-title" className="font-extrabold text-lg text-slate-900">
              {step === 'name'
                ? lang === 'ta'
                  ? 'உங்கள் பெயர்'
                  : "What's your name?"
                : lang === 'ta'
                ? 'ஸ்ரீ அம்மன் உள்நுழைவு'
                : 'Sri Amman Account'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'ta' ? 'மூடு' : 'Close'}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        <p id="login-modal-desc" className="text-xs text-slate-600 mb-4">
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
          <form className="space-y-3" onSubmit={handleSendOtp} noValidate>
            <div>
              <label htmlFor="login-phone" className="field-label">
                {lang === 'ta' ? 'மொபைல் எண்' : 'Phone Number'}
              </label>
              <div className="input flex items-center p-0 overflow-hidden">
                <span className="bg-slate-50 self-stretch flex items-center px-3 text-xs font-bold text-slate-600 border-r border-slate-200">
                  +91
                </span>
                <input
                  id="login-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  required
                  data-autofocus
                  placeholder="1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 min-w-0 px-3 py-2.5 text-sm outline-none focus-visible:outline-none font-medium text-slate-900 bg-transparent"
                />
              </div>
            </div>

            <button type="submit" disabled={phone.length < 10} className="btn btn-primary btn-lg btn-block">
              {lang === 'ta' ? 'OTP அனுப்பவும்' : 'Continue'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              verifyOtp(otpDigits.join(''));
            }}
          >
            <fieldset>
              <legend className="field-label mb-2 w-full text-center">
                {lang === 'ta' ? '4-இலக்க OTP குறியீட்டை உள்ளிடவும்' : 'Enter 4-Digit Verification OTP'}
              </legend>
              <OtpInput value={otpDigits} onChange={setOtpDigits} onComplete={verifyOtp} />
            </fieldset>

            <button type="submit" disabled={otpDigits.join('').length < 4} className="btn btn-primary btn-lg btn-block">
              {lang === 'ta' ? 'சரிபார்க்கவும்' : 'Verify & Continue'}
            </button>
          </form>
        )}

        {step === 'name' && (
          <form className="space-y-3" onSubmit={handleCompleteLogin}>
            <div>
              <label htmlFor="login-name" className="field-label">
                {lang === 'ta' ? 'உங்கள் பெயர்' : 'Full Name'}
              </label>
              <input
                id="login-name"
                type="text"
                autoComplete="name"
                required
                data-autofocus
                autoFocus
                placeholder="Vishagan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input font-semibold"
              />
            </div>

            <div>
              <label htmlFor="login-dob" className="field-label">
                {lang === 'ta' ? 'பிறந்த தேதி' : 'Date of Birth'}
              </label>
              <input
                id="login-dob"
                type="date"
                autoComplete="bday"
                max={new Date().toISOString().split('T')[0]}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="input font-semibold text-slate-800 cursor-pointer"
              />
            </div>

            <button type="submit" disabled={!name.trim()} className="btn btn-primary btn-lg btn-block">
              {lang === 'ta' ? 'உள்நுழையவும்' : 'Complete & Log In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
