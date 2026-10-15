'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products, categories } from '@/data/products';
import ProductCard from './ProductCard';
import { IconSearch, IconCheckCircle, IconZap } from './Icons';

export default function ProductsPage() {
  const { state, dispatch } = useStore();
  const lang = state.lang;

  const [priceRange, setPriceRange] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [discountOnly, setDiscountOnly] = useState<boolean>(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isDown = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeftPos = React.useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    if (!scrollRef.current) return;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftPos.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeaveOrUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftPos.current - walk;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  let filtered = [...products];

  // Category filter
  if (state.activeCategory !== 'all') {
    filtered = filtered.filter((p) => p.category === state.activeCategory);
  }

  // Price range filter
  if (priceRange === 'under-50') {
    filtered = filtered.filter((p) => p.variants[0].price < 50);
  } else if (priceRange === '50-150') {
    filtered = filtered.filter((p) => p.variants[0].price >= 50 && p.variants[0].price <= 150);
  } else if (priceRange === '150-500') {
    filtered = filtered.filter((p) => p.variants[0].price > 150 && p.variants[0].price <= 500);
  } else if (priceRange === 'above-500') {
    filtered = filtered.filter((p) => p.variants[0].price > 500);
  }

  // In Stock filter
  if (inStockOnly) {
    filtered = filtered.filter((p) => p.inStock);
  }

  // Discount filter
  if (discountOnly) {
    filtered = filtered.filter((p) => {
      const v = p.variants[0];
      return v && v.mrp > v.price;
    });
  }

  // Search filter
  const queryTrimmed = state.searchQuery.trim().toLowerCase();
  if (queryTrimmed.length >= 2) {
    filtered = filtered.filter(
      (p) =>
        p.nameEn.toLowerCase().includes(queryTrimmed) ||
        p.nameTa.includes(state.searchQuery.trim())
    );
  }

  // Sort
  if (state.sortBy === 'price-low') {
    filtered.sort((a, b) => a.variants[0].price - b.variants[0].price);
  } else if (state.sortBy === 'price-high') {
    filtered.sort((a, b) => b.variants[0].price - a.variants[0].price);
  } else if (state.sortBy === 'discount') {
    filtered.sort((a, b) => {
      const dA = ((a.variants[0].mrp - a.variants[0].price) / a.variants[0].mrp) * 100;
      const dB = ((b.variants[0].mrp - b.variants[0].price) / b.variants[0].mrp) * 100;
      return dB - dA;
    });
  }

  const activeCat = categories.find((c) => c.id === state.activeCategory);

  const resetAll = () => {
    dispatch({ type: 'SET_CATEGORY', category: 'all' });
    dispatch({ type: 'SET_SEARCH', query: '' });
    dispatch({ type: 'SET_SORT', sort: 'popularity' });
    setPriceRange('all');
    setInStockOnly(false);
    setDiscountOnly(false);
  };

  const hasActiveFilters =
    state.activeCategory !== 'all' ||
    state.searchQuery !== '' ||
    priceRange !== 'all' ||
    inStockOnly ||
    discountOnly;

  return (
    <section className="py-6 md:py-10 bg-[#FBF8F3] min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Controls: Horizontal Category Scroll + Clean Inline Sort Dropdown */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Category Horizontal Scroll Bar (Seamless Edge-to-Edge with clean pills and multi-input scrolling) */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            className="flex-1 min-w-0 -mx-4 px-4 overflow-x-auto overflow-y-hidden hide-scrollbar touch-pan-x cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center gap-2 pb-1.5 w-max">
              <button
                onClick={() => dispatch({ type: 'SET_CATEGORY', category: 'all' })}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                  state.activeCategory === 'all'
                    ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                    : 'bg-[#FFFFFF] text-brand-slate border-slate-200 hover:border-brand-primary'
                }`}
              >
                <span>{t('all', lang)}</span>
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  state.activeCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {products.length}
                </span>
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat.id).length;
                const isSelected = state.activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => dispatch({ type: 'SET_CATEGORY', category: cat.id })}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border shrink-0 ${
                      isSelected
                        ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                        : 'bg-[#FFFFFF] text-brand-slate border-slate-200 hover:border-brand-primary'
                    }`}
                  >
                    <img src={cat.image} alt={cat.nameEn} className="w-4 h-4 rounded-full object-cover shrink-0" />
                    <span className="truncate max-w-[140px]">{lang === 'ta' ? cat.nameTa : cat.nameEn}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inline Sort Control */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 px-1 sm:px-0">
            <span className="text-xs font-extrabold text-slate-700">{filtered.length} {t('items', lang)}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">{t('sortBy', lang)}:</span>
              <select
                value={state.sortBy}
                onChange={(e) => dispatch({ type: 'SET_SORT', sort: e.target.value })}
                className="text-xs font-bold bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 outline-none focus:border-brand-primary shadow-2xs"
              >
                <option value="popularity">{t('popularity', lang)}</option>
                <option value="price-low">{t('priceLowHigh', lang)}</option>
                <option value="price-high">{t('priceHighLow', lang)}</option>
                <option value="discount">{t('discountPercent', lang)}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop Left Sidebar (Rich Filters) */}
          <aside className="hidden md:block w-72 flex-shrink-0">
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE2D5] shadow-sm p-5 sticky top-36 space-y-6">
              {/* Categories Section */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#EAE2D5]">
                  <h3 className="font-extrabold text-sm text-brand-slate uppercase tracking-wider">
                    {t('categories', lang)}
                  </h3>
                  {hasActiveFilters && (
                    <button
                      onClick={resetAll}
                      className="text-xs font-bold text-brand-primary hover:underline"
                    >
                      {t('resetFilters', lang)}
                    </button>
                  )}
                </div>

                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  <button
                    onClick={() => dispatch({ type: 'SET_CATEGORY', category: 'all' })}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                      state.activeCategory === 'all'
                        ? 'bg-brand-primary text-white shadow-xs font-bold'
                        : 'text-brand-slate hover:bg-[#F5EFE6]'
                    }`}
                  >
                    <span>{t('all', lang)}</span>
                    <span className="text-[11px] opacity-75">{products.length}</span>
                  </button>
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.category === cat.id).length;
                    const isSelected = state.activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => dispatch({ type: 'SET_CATEGORY', category: cat.id })}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 justify-between ${
                          isSelected
                            ? 'bg-brand-primary text-white shadow-xs font-bold'
                            : 'text-brand-slate hover:bg-[#F5EFE6]'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <img src={cat.image} alt={cat.nameEn} className="w-5 h-5 rounded-md object-cover shrink-0" />
                          <span className="break-words leading-tight flex-1">{lang === 'ta' ? cat.nameTa : cat.nameEn}</span>
                        </div>
                        <span className="text-[11px] opacity-75 shrink-0 ml-1">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="pt-4 border-t border-[#EAE2D5]">
                <h4 className="font-bold text-xs uppercase tracking-wider text-brand-slate/60 mb-2.5">
                  {t('priceRange', lang)}
                </h4>
                <div className="space-y-1.5 text-xs">
                  {[
                    { key: 'all', label: t('all', lang) },
                    { key: 'under-50', label: t('under50', lang) },
                    { key: '50-150', label: t('range50to150', lang) },
                    { key: '150-500', label: t('range150to500', lang) },
                    { key: 'above-500', label: t('above500', lang) },
                  ].map((pr) => (
                    <label
                      key={pr.key}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        priceRange === pr.key ? 'bg-brand-mint text-brand-primary font-bold' : 'hover:bg-[#F5EFE6] text-brand-slate/80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priceRange"
                        checked={priceRange === pr.key}
                        onChange={() => setPriceRange(pr.key)}
                        className="accent-brand-primary"
                      />
                      <span>{pr.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Special Toggles (In Stock / Deals) */}
              <div className="pt-4 border-t border-[#EAE2D5] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-slate">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-brand-primary w-4 h-4 rounded"
                  />
                  <span>{t('inStockOnly', lang)}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-slate">
                  <input
                    type="checkbox"
                    checked={discountOnly}
                    onChange={(e) => setDiscountOnly(e.target.checked)}
                    className="accent-brand-primary w-4 h-4 rounded"
                  />
                  <span>{t('discountsOnly', lang)}</span>
                </label>
              </div>

              {/* Sort By in Sidebar */}
              <div className="pt-4 border-t border-[#EAE2D5]">
                <h4 className="font-bold text-xs uppercase tracking-wider text-brand-slate/60 mb-2">
                  {t('sortBy', lang)}
                </h4>
                <div className="space-y-1">
                  {[
                    { value: 'popularity', label: t('popularity', lang) },
                    { value: 'price-low', label: t('priceLowHigh', lang) },
                    { value: 'price-high', label: t('priceHighLow', lang) },
                    { value: 'discount', label: t('discountPercent', lang) },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => dispatch({ type: 'SET_SORT', sort: opt.value })}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${
                        state.sortBy === opt.value
                          ? 'text-brand-primary font-bold bg-[#F5EFE6]'
                          : 'text-brand-slate/75 hover:bg-[#F5EFE6]/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assurance Box */}
              <div className="p-3 bg-[#F5EFE6] rounded-xl border border-[#EAE2D5] text-[11px] text-brand-slate/75 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-brand-primary mb-1">
                  <IconCheckCircle className="w-3.5 h-3.5 text-brand-primary" />
                  <span>{lang === 'ta' ? 'ஸ்ரீ அம்மன் நேரடி உத்தரவாதம்' : 'Sri Amman Fresh Guarantee'}</span>
                </div>
                <span>
                  {lang === 'ta'
                    ? 'எந்தவொரு பொருளிலும் குறை இருப்பின், 30 நிமிடத்திற்குள் கவுண்டரில் மாற்றிக் கொள்ளலாம்.'
                    : '100% genuine counter quality with 30-min doorstep replacement.'}
                </span>
              </div>
            </div>
          </aside>

          {/* Main Products Grid Column */}
          <main className="flex-1 min-w-0">
            {/* Desktop Only Title (Hidden on mobile so products appear immediately first) */}
            <div className="hidden md:flex bg-[#FFFFFF] border border-[#EAE2D5] rounded-2xl p-4 md:p-5 mb-4 shadow-2xs items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-brand-slate">
                    {activeCat ? (lang === 'ta' ? activeCat.nameTa : activeCat.nameEn) : t('allProducts', lang)}
                  </h2>
                  <span className="text-xs font-bold text-brand-primary bg-brand-mint px-2 py-0.5 rounded-full border border-brand-primary/10">
                    {filtered.length} {t('items', lang)}
                  </span>
                </div>
                <p className="text-xs text-brand-slate/60 mt-0.5 font-medium">
                  {lang === 'ta'
                    ? 'மதுரையின் முதல் தர மளிகைகள், தூய்மையான பேக்கிங் மற்றும் நியாயமான மொத்த விலை.'
                    : 'Freshly stocked everyday kitchen staples with honest retail pricing.'}
                </p>
              </div>
            </div>

            {/* Active Filters Bar if any */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4 bg-[#F5EFE6] p-2.5 rounded-xl border border-[#EAE2D5] text-xs">
                <span className="font-bold text-brand-slate/70">{t('filters', lang)}:</span>
                {state.activeCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-[#FFFFFF] px-2.5 py-1 rounded-md text-brand-primary font-bold border border-[#EAE2D5]">
                    {activeCat ? (lang === 'ta' ? activeCat.nameTa : activeCat.nameEn) : state.activeCategory}
                    <button onClick={() => dispatch({ type: 'SET_CATEGORY', category: 'all' })} className="text-gray-400 hover:text-black">×</button>
                  </span>
                )}
                {priceRange !== 'all' && (
                  <span className="inline-flex items-center gap-1 bg-[#FFFFFF] px-2.5 py-1 rounded-md text-brand-primary font-bold border border-[#EAE2D5]">
                    {priceRange}
                    <button onClick={() => setPriceRange('all')} className="text-gray-400 hover:text-black">×</button>
                  </span>
                )}
                {inStockOnly && (
                  <span className="inline-flex items-center gap-1 bg-[#FFFFFF] px-2.5 py-1 rounded-md text-brand-primary font-bold border border-[#EAE2D5]">
                    {t('inStockOnly', lang)}
                    <button onClick={() => setInStockOnly(false)} className="text-gray-400 hover:text-black">×</button>
                  </span>
                )}
                {discountOnly && (
                  <span className="inline-flex items-center gap-1 bg-[#FFFFFF] px-2.5 py-1 rounded-md text-brand-primary font-bold border border-[#EAE2D5]">
                    {t('discountsOnly', lang)}
                    <button onClick={() => setDiscountOnly(false)} className="text-gray-400 hover:text-black">×</button>
                  </span>
                )}
                <button
                  onClick={resetAll}
                  className="ml-auto text-xs font-bold text-[#C62828] hover:underline"
                >
                  {t('resetFilters', lang)}
                </button>
              </div>
            )}

            {/* Empty State */}
            {filtered.length === 0 ? (
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE2D5] text-center py-16 p-6 shadow-xs">
                <IconSearch className="w-12 h-12 text-brand-slate/30 mx-auto mb-3" />
                <p className="text-lg font-bold text-brand-slate mb-1">
                  {t('noProductsMatch', lang)}
                </p>
                <p className="text-xs text-brand-slate/50 mb-5 max-w-sm mx-auto">
                  {t('trySearchingAnother', lang)}
                </p>
                <button
                  onClick={resetAll}
                  className="bg-brand-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm hover:bg-brand-highlight transition-all"
                >
                  {t('resetFilters', lang)}
                </button>
              </div>
            ) : (
              /* Products Grid: 2 cols on mobile, 3 cols on tablet, 4 cols on desktop */
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
