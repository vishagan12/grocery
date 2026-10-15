'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { Zap, ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  const { state, dispatch } = useStore();
  const lang = state.lang;
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);

  const heroSlides = [
    {
      id: 'monthly-bundle',
      tagEn: 'Bestselling Bundle',
      tagTa: 'குடும்ப மெகா சேமிப்பு',
      titleEn: 'Monthly Maligai Bundle',
      titleTa: 'மாதாந்திர மளிகை தொகுப்பு',
      subEn: 'Rice, Dals, Oils & Masalas in 1 tap',
      subTa: 'அரிசி, பருப்பு, எண்ணெய் & மசாலா அனைத்தும் ஒரே கிளிக்கில்',
      price: '₹1,540',
      mrp: '₹1,890',
      saveEn: 'SAVE ₹350',
      saveTa: 'ரூ.350 மிச்சம்',
      actionEn: 'Order Now',
      actionTa: 'ஆர்டர் செய்',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85',
      targetPage: 'monthly-list',
    },
    {
      id: 'super-saver-deals',
      tagEn: 'Today Special Offers',
      tagTa: 'இன்றைய அதிரடி தள்ளுபடி',
      titleEn: 'Wholesale Grocery Deals',
      titleTa: 'மொத்த விலை மளிகை சலுகைகள்',
      subEn: 'Top kitchen essentials at direct counter prices',
      subTa: 'அத்தியாவசிய சமையல் மளிகைக்கு 30% வரை நேரடி தள்ளுபடி',
      price: 'Up to 30% OFF',
      mrp: 'Best Rate',
      saveEn: 'HOT DEALS',
      saveTa: 'சூப்பர் சேவர்',
      actionEn: 'View Deals',
      actionTa: 'சலுகைகள் பார்',
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=900&q=85',
      targetPage: 'products',
    },
    {
      id: 'fresh-farm-produce',
      tagEn: 'Farm Fresh Direct',
      tagTa: 'நேரடி பண்ணை புதிய வரத்து',
      titleEn: 'Morning Fresh Vegetables',
      titleTa: 'காலை புதிய பண்ணை காய்கறிகள்',
      subEn: 'Harvested fresh & delivered in 25 minutes',
      subTa: 'தினசரி காலை புதிய காய்கறிகள் உங்கள் வாசலில்',
      price: 'Daily Fresh',
      mrp: 'Clean & Inspected',
      saveEn: 'FRESH PICK',
      saveTa: 'புதியது',
      actionEn: 'Shop Veggies',
      actionTa: 'காய்கறி வாங்க',
      image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=900&q=85',
      targetPage: 'products',
      targetCat: 'vegetables-fruits',
    },
  ];

  // Auto-advance slide every 5 seconds (resets whenever activeSlide changes so user gets full 5s)
  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlide, heroSlides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 40) {
      // Swiped left -> next
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    } else if (diff < -40) {
      // Swiped right -> prev
      setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    }
    setTouchStart(null);
  };

  const currentSlide = heroSlides[activeSlide];

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
        {/* Top Headline Banner: Super Saver Typography - 100% full text visible without ellipses */}
        <div className="py-2 px-3 mb-3 bg-white/95 rounded-2xl border border-[#4CB01E]/20 shadow-2xs flex items-center justify-center gap-1.5 sm:gap-2">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4CB01E] shrink-0" />
          <h2 className="text-[11px] xs:text-xs sm:text-sm font-extrabold text-[#1E4D12] tracking-tight text-center whitespace-normal sm:whitespace-nowrap leading-tight">
            {lang === 'ta'
              ? 'ஸ்ரீ அம்மன் சூப்பர் சேவர் • அத்தியாவசிய மளிகைக்கு 30% வரை தள்ளுபடி'
              : 'Sri Amman Super Saver • Up to 30% OFF Daily Essentials'}
          </h2>
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4CB01E] shrink-0" />
        </div>

        {/* 3-Column Asymmetric Bento Grid (Mobile & Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-4">
          {/* Left Tall Card: Dynamic Swipeable Auto-Carousel (5s interval, touch swipe, smooth fade) */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
              if (currentSlide.targetCat) {
                dispatch({ type: 'SET_CATEGORY', category: currentSlide.targetCat });
              }
              dispatch({ type: 'SET_PAGE', page: currentSlide.targetPage });
            }}
            className="md:col-span-5 relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 text-white p-4 sm:p-5 md:p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer min-h-[165px] sm:min-h-[210px] md:min-h-[360px] group border border-emerald-800/30 select-none"
          >
            {/* Background Image Overlay with smooth fade */}
            <div className="absolute inset-0 z-0">
              <img
                key={currentSlide.id}
                src={currentSlide.image}
                alt={currentSlide.titleEn}
                className="w-full h-full object-cover transition-all duration-700 opacity-80 group-hover:scale-105 animate-smooth-fade"
                loading="lazy"
              />
              {/* Soft subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
            </div>

            {/* Content Top with smooth fade */}
            <div key={`content-${activeSlide}`} className="relative z-10 animate-fade-in">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-[#143B0D] text-[11px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs whitespace-nowrap">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
                  <span>{lang === 'ta' ? currentSlide.tagTa : currentSlide.tagEn}</span>
                </div>

                {/* Carousel Pagination Dots */}
                <div className="flex items-center gap-1.5 bg-black/45 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10">
                  {heroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Slide ${idx + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSlide(idx);
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === activeSlide ? 'w-5 bg-yellow-300' : 'w-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <h3 className="text-base xs:text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight mb-1.5 line-clamp-2 drop-shadow-xs">
                {lang === 'ta' ? currentSlide.titleTa : currentSlide.titleEn}
              </h3>
              <p className="text-xs xs:text-[13px] sm:text-sm md:text-base text-emerald-100 font-medium leading-relaxed line-clamp-2 drop-shadow-xs">
                {lang === 'ta' ? currentSlide.subTa : currentSlide.subEn}
              </p>
            </div>

            {/* Content Bottom: Price Pill + Action Trigger */}
            <div key={`bottom-${activeSlide}`} className="relative z-10 mt-3 sm:mt-4 flex items-center justify-between gap-2 pt-2 border-t border-white/20 flex-nowrap animate-fade-in">
              <div className="flex items-baseline gap-1.5 sm:gap-2.5 bg-black/55 backdrop-blur-md px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl border border-white/20 shrink-0">
                <span className="text-sm xs:text-base sm:text-xl font-black text-yellow-300">{currentSlide.price}</span>
                {currentSlide.id === 'monthly-bundle' && (
                  <span className="text-[10px] sm:text-xs text-white/60 line-through hidden xs:inline">{currentSlide.mrp}</span>
                )}
                <span className="text-[10px] sm:text-xs font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded">
                  {lang === 'ta' ? currentSlide.saveTa : currentSlide.saveEn}
                </span>
              </div>
              <span className="bg-white text-[#143B0D] font-black text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-xs group-hover:bg-yellow-300 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <span>{lang === 'ta' ? currentSlide.actionTa : currentSlide.actionEn}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                className="relative rounded-2xl overflow-hidden bg-white p-3 sm:p-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all cursor-pointer border border-slate-200/80 hover:border-[#4CB01E] group min-h-[195px] sm:min-h-[215px] select-none"
              >
                {/* Card Top: Badge & Full Title visible on multiple lines */}
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] sm:text-[11px] font-black text-emerald-900 bg-emerald-100/90 px-2 sm:px-2.5 py-0.5 rounded-full inline-block truncate max-w-[70%]">
                      {lang === 'ta' ? card.badgeTa : card.badgeEn}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#4CB01E] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                      <span>{lang === 'ta' ? 'பார்க்க' : 'Shop'}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
                    </span>
                  </div>
                  <h4 className="font-extrabold text-[13px] sm:text-base text-slate-900 leading-snug break-words">
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
                <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold pt-0.5 leading-tight">
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
