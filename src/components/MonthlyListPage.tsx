'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products, monthlyListItems, categories } from '@/data/products';
import { IconCheck, IconZap, IconCheckCircle, IconTruck, IconShield } from '@/components/Icons';
import { SlidersHorizontal, Plus, Trash2, X, Search } from 'lucide-react';

type FamilySize = 'small' | 'medium' | 'joint';

export default function MonthlyListPage() {
  const { state, dispatch, showToast } = useStore();
  const lang = state.lang;

  const [familySize, setFamilySize] = useState<FamilySize>('small');
  const [activeCatFilter, setActiveCatFilter] = useState<string>('all');
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customizeSearch, setCustomizeSearch] = useState('');

  const [items, setItems] = useState(
    monthlyListItems.map((mi) => ({
      ...mi,
      checked: true,
      qty: mi.defaultQty,
    }))
  );

  // Adjust quantities when family size changes
  const handleFamilySizeChange = (size: FamilySize) => {
    setFamilySize(size);
    const multiplier = size === 'small' ? 1 : size === 'medium' ? 1.5 : 2.5;
    setItems((prev) =>
      prev.map((item) => {
        const base = monthlyListItems.find((mi) => mi.productId === item.productId)?.defaultQty || 1;
        return {
          ...item,
          qty: Math.max(1, Math.round(base * multiplier)),
        };
      })
    );
  };

  const toggleItem = (index: number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item)));
  };

  const updateQty = (index: number, delta: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
    showToast(lang === 'ta' ? 'பட்டியலிலிருந்து நீக்கப்பட்டது' : 'Removed from monthly list');
  };

  const addItemToList = (productId: string) => {
    if (items.some((i) => i.productId === productId)) {
      showToast(lang === 'ta' ? 'பொருள் ஏற்கனவே பட்டியலில் உள்ளது' : 'Already in monthly list');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        productId,
        variantIndex: 0,
        defaultQty: 1,
        checked: true,
        qty: 1,
      },
    ]);
    showToast(lang === 'ta' ? 'மாதாந்திர பட்டியலில் சேர்க்கப்பட்டது' : 'Added to monthly list');
  };

  const selectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, checked: true })));
  };

  const deselectAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, checked: false })));
  };

  const checkedItems = items.filter((i) => i.checked);

  const totalMrp = checkedItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return sum;
    const variant = product.variants[item.variantIndex];
    return sum + (variant?.mrp || 0) * item.qty;
  }, 0);

  const totalPrice = checkedItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return sum;
    const variant = product.variants[item.variantIndex];
    return sum + (variant?.price || 0) * item.qty;
  }, 0);

  const savings = Math.max(0, totalMrp - totalPrice);

  const addAllToCart = () => {
    checkedItems.forEach((item) => {
      dispatch({
        type: 'ADD_TO_CART',
        productId: item.productId,
        variantIndex: item.variantIndex,
        quantity: item.qty,
      });
    });
    showToast(t('monthlyListAdded', lang));
    setTimeout(() => {
      dispatch({ type: 'SET_CART_OPEN', open: true });
    }, 400);
  };

  // Filter items by category tab
  const displayedItems = items.map((item, originalIndex) => ({ ...item, originalIndex })).filter((item) => {
    if (activeCatFilter === 'all') return true;
    const prod = products.find((p) => p.id === item.productId);
    return prod?.category === activeCatFilter;
  });

  return (
    <section className="py-6 md:py-10 bg-[#FBF8F3] min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Hero Banner */}
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#EAE2D5] p-6 md:p-8 mb-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-mint border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider mb-2.5">
                <IconZap className="w-3.5 h-3.5 text-brand-primary" />
                <span>{t('smartRoutine', lang)}</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-brand-slate tracking-tight leading-tight mb-2">
                {t('kudumbaTitle', lang)}
              </h1>
              <p className="text-sm md:text-base text-brand-slate/70 font-medium leading-relaxed">
                {t('kudumbaSubtitle', lang)}
              </p>
            </div>

            {/* Family Size Selector */}
            <div className="bg-[#F5EFE6] p-4 rounded-2xl border border-[#EAE2D5] shrink-0">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-slate/70 mb-2.5">
                {t('familySizeLabel', lang)}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                {[
                  { key: 'small', label: t('familySmall', lang) },
                  { key: 'medium', label: t('familyMedium', lang) },
                  { key: 'joint', label: t('familyJoint', lang) },
                ].map((fs) => (
                  <button
                    key={fs.key}
                    type="button"
                    onClick={() => handleFamilySizeChange(fs.key as FamilySize)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      familySize === fs.key
                        ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                        : 'bg-[#FFFFFF] text-brand-slate border-[#EAE2D5] hover:bg-[#FAF6EE]'
                    }`}
                  >
                    {fs.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          {/* Left Column (Items List & Category Filter) */}
          <div className="lg:col-span-8 space-y-3.5 sm:space-y-4 min-w-0">
            {/* Filter Pills, Customize Button & Select All Bar */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE2D5] p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-1 -mx-1 px-1 touch-pan-x">
                {/* Customize List Button (Opens interactive catalog add modal) */}
                <button
                  type="button"
                  onClick={() => setCustomizeOpen(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-yellow-500 shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{lang === 'ta' ? 'பட்டியலை மாற்று / சேர்' : 'Customize List'}</span>
                </button>

                <div className="h-5 w-px bg-[#EAE2D5] mx-1 shrink-0" />

                <button
                  type="button"
                  onClick={() => setActiveCatFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                    activeCatFilter === 'all'
                      ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                      : 'bg-[#F5EFE6] text-brand-slate border-[#EAE2D5] hover:bg-[#EFE9DF]'
                  }`}
                >
                  {t('all', lang)} ({items.length})
                </button>
                {categories.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCatFilter(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                      activeCatFilter === c.id
                        ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                        : 'bg-[#F5EFE6] text-brand-slate border-[#EAE2D5] hover:bg-[#EFE9DF]'
                    }`}
                  >
                    {lang === 'ta' ? c.nameTa : c.nameEn}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-bold pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-brand-primary hover:underline py-1"
                >
                  {t('selectAll', lang)}
                </button>
                <span className="text-[#D1C7B7]">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-brand-slate/60 hover:text-brand-slate py-1"
                >
                  {t('deselectAll', lang)}
                </button>
              </div>
            </div>

            {/* Items List - Mobile-Optimized Rows with Zero Screen Overflow */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE2D5] shadow-sm overflow-hidden divide-y divide-[#F5EFE6]">
              {displayedItems.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                if (!product) return null;
                const variant = product.variants[item.variantIndex];
                if (!variant) return null;

                const itemTotal = variant.price * item.qty;
                const itemMrpTotal = variant.mrp * item.qty;

                return (
                  <div
                    key={`${item.productId}-${item.variantIndex}`}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 md:p-5 transition-colors ${
                      item.checked ? 'bg-[#FFFFFF]' : 'bg-[#FAF6EE]/50 opacity-60'
                    }`}
                  >
                    {/* Left: Checkbox + Image + Product Details */}
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                      {/* Checkbox */}
                      <button
                        type="button"
                        aria-label="Toggle item selection"
                        onClick={() => toggleItem(item.originalIndex)}
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                          item.checked
                            ? 'bg-brand-primary border-brand-primary text-white shadow-xs'
                            : 'border-[#D1C7B7] bg-[#FFFFFF]'
                        }`}
                      >
                        {item.checked && <IconCheck className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Product Image */}
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-[#FBF8F3] border border-[#EAE2D5] shrink-0 flex items-center justify-center p-1">
                        <img
                          src={product.image}
                          alt={lang === 'ta' ? product.nameTa : product.nameEn}
                          className="w-full h-full object-contain rounded-lg"
                          loading="lazy"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-xs sm:text-sm md:text-base text-brand-slate leading-snug break-words">
                          {lang === 'ta' ? product.nameTa : product.nameEn}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-brand-slate/60 mt-0.5 break-words">
                          {variant.label} &bull; {lang === 'ta' ? product.nameEn : product.nameTa}
                        </p>
                        <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1 flex-wrap">
                          <span className="font-extrabold text-brand-slate text-sm sm:text-base">₹{itemTotal}</span>
                          <span className="text-[11px] sm:text-xs text-gray-400 line-through">₹{itemMrpTotal}</span>
                          {itemMrpTotal > itemTotal && (
                            <span className="text-[9px] sm:text-[10px] font-bold text-brand-primary bg-brand-mint px-1.5 py-0.2 rounded border border-brand-primary/10">
                              {lang === 'ta' ? `₹${itemMrpTotal - itemTotal} சேமிப்பு` : `Save ₹${itemMrpTotal - itemTotal}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quantity Stepper & Quick Remove */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-8 sm:pl-0 pt-1 sm:pt-0">
                      <div
                        className="flex items-center bg-[#F5EFE6] rounded-xl overflow-hidden border border-[#EAE2D5]"
                        style={{ minHeight: '34px' }}
                      >
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateQty(item.originalIndex, -1)}
                          className="px-2.5 py-1 text-brand-slate font-bold hover:bg-[#EAE2D5] transition-all text-sm"
                        >
                          −
                        </button>
                        <span className="px-2.5 font-extrabold text-brand-slate text-xs min-w-[1.75rem] text-center">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateQty(item.originalIndex, 1)}
                          className="px-2.5 py-1 text-brand-slate font-bold hover:bg-[#EAE2D5] transition-all text-sm"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 flex items-center justify-center transition-all shrink-0"
                        title={lang === 'ta' ? 'பட்டியலிலிருந்து நீக்கு' : 'Remove from list'}
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (Sticky Family Savings & 1-Click Order Summary) */}
          <div className="lg:col-span-4 lg:sticky lg:top-36 space-y-4 min-w-0">
            <div className="bg-[#FFFFFF] rounded-2xl border-2 border-brand-primary/30 shadow-xl p-4 sm:p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE2D5] gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-brand-slate break-words flex-1">
                  {lang === 'ta' ? 'மாதாந்திர பில் விவரம்' : 'Monthly Provision Summary'}
                </h3>
                <span className="text-[11px] sm:text-xs font-bold text-brand-primary bg-brand-mint px-2 py-0.5 rounded-full border border-brand-primary/10 shrink-0">
                  {checkedItems.length} {t('selectedItems', lang)}
                </span>
              </div>

              {/* Price Calculation */}
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-brand-slate/70">
                  <span>{t('marketMrp', lang)}</span>
                  <span className="font-bold line-through text-gray-400">₹{totalMrp}</span>
                </div>
                <div className="flex justify-between items-center text-brand-slate">
                  <span className="font-semibold">{t('ourPrice', lang)}</span>
                  <span className="font-extrabold text-base sm:text-lg text-brand-slate">₹{totalPrice}</span>
                </div>
                <div className="flex justify-between items-center text-brand-primary bg-brand-mint p-2.5 sm:p-3 rounded-xl border border-brand-primary/20">
                  <span className="font-extrabold text-xs sm:text-sm">{t('youSave', lang)}</span>
                  <span className="font-black text-lg sm:text-xl text-brand-primary">₹{savings}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-brand-slate/70 pt-0.5">
                  <span>{t('deliveryFee', lang)}</span>
                  <span className="text-brand-primary font-bold">{t('free', lang)}</span>
                </div>
              </div>

              {/* Free Delivery Callout */}
              <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] sm:text-xs font-bold text-brand-primary">
                <IconTruck className="w-4 h-4 text-brand-primary shrink-0" />
                <span className="leading-snug break-words">
                  {lang === 'ta' ? 'இலவச ஹோம் டெலிவரி & உடனடி பேக்கிங்!' : 'Free Delivery Included for Monthly List!'}
                </span>
              </div>

              {/* 1-Click Action Button */}
              <button
                type="button"
                onClick={addAllToCart}
                disabled={checkedItems.length === 0}
                className={`w-full py-3.5 sm:py-4 rounded-xl text-sm md:text-base font-black transition-all touch-target shadow-lg flex items-center justify-center gap-2 ${
                  checkedItems.length > 0
                    ? 'bg-brand-primary hover:bg-brand-highlight text-white shadow-brand-primary/30 hover:scale-[1.01]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                style={{ minHeight: '48px' }}
              >
                <IconZap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 shrink-0" />
                <span className="break-words">{t('addEntireList', lang)}</span>
              </button>

              <p className="text-[10px] sm:text-[11px] text-center text-brand-slate/50 leading-relaxed">
                {lang === 'ta'
                  ? 'ஆர்டர் செய்த பிறகு தேவைக்கேற்ப பொருட்களை மாற்றிக் கொள்ளலாம்.'
                  : 'Items will be double-packed cleanly and delivered in 20 minutes.'}
              </p>
            </div>

            {/* Quality & Packing Assurance Card */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE2D5] p-3.5 sm:p-4 text-xs space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-brand-slate">
                <IconShield className="w-4 h-4 text-brand-primary shrink-0" />
                <span>{lang === 'ta' ? 'பாதுகாப்பான பேக்கிங் உறுதி' : 'Safe Packaging Guarantee'}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-brand-slate/65 leading-relaxed">
                {lang === 'ta'
                  ? 'எண்ணெய் மற்றும் அரிசி பைகள் தனித்தனி தடிமனான பைகளில் சிந்தாமல் பேக் செய்யப்படும்.'
                  : 'Oils and grains are individually packed in heavy leak-proof bags to prevent any damage.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Customize Monthly List Modal */}
      {customizeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in box-border">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 box-border">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-[#F8FAF7]">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#76CA3E]" />
                  <span>{lang === 'ta' ? 'மாதாந்திர பட்டியலில் பொருட்கள் சேர்க்க' : 'Customize Monthly Provision List'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {lang === 'ta'
                    ? 'உங்கள் குடும்பத்திற்கு தேவையான கூடுதல் பொருட்களை பட்டியலில் எளிதாக சேர்க்கவும்'
                    : 'Search and add any grocery item directly into your recurring monthly list'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomizeOpen(false)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Inside Modal */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="flex items-center bg-[#F1F9EC] rounded-2xl px-3.5 py-2.5 border border-[#76CA3E]/30">
                <Search className="w-4 h-4 text-[#76CA3E] mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder={lang === 'ta' ? 'அரிசி, பருப்பு, எண்ணெய் தேடவும்...' : 'Search items to add (rice, oil, dal, snacks)...'}
                  value={customizeSearch}
                  onChange={(e) => setCustomizeSearch(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium"
                />
                {customizeSearch && (
                  <button type="button" onClick={() => setCustomizeSearch('')}>
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Catalog List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
              {products
                .filter((p) => {
                  const q = customizeSearch.trim().toLowerCase();
                  if (!q) return true;
                  return p.nameEn.toLowerCase().includes(q) || p.nameTa.includes(q);
                })
                .map((prod) => {
                  const inList = items.some((i) => i.productId === prod.id);
                  const firstVariant = prod.variants[0];

                  return (
                    <div key={prod.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-xl bg-[#F8FAF7] border border-slate-200 shrink-0 overflow-hidden p-0.5">
                          <img src={prod.image} alt={prod.nameEn} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug break-words">
                            {lang === 'ta' ? prod.nameTa : prod.nameEn}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {firstVariant.label} • ₹{firstVariant.price}
                          </p>
                        </div>
                      </div>

                      {inList ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            {lang === 'ta' ? 'சேர்க்கப்பட்டுள்ளது' : 'In List'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(prod.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addItemToList(prod.id)}
                          className="bg-[#4CB01E] hover:bg-[#3D9415] text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 shrink-0 shadow-xs active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{lang === 'ta' ? 'சேர்' : 'Add to List'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-[#F8FAF7] flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                {items.length} {lang === 'ta' ? 'பொருட்கள் பட்டியலில் உள்ளன' : 'total items in monthly list'}
              </span>
              <button
                type="button"
                onClick={() => setCustomizeOpen(false)}
                className="bg-slate-900 hover:bg-black text-white px-5 py-2 rounded-xl text-xs font-black transition-all"
              >
                {lang === 'ta' ? 'முடிந்தது' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
