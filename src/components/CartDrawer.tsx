'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products, impulseEssentials } from '@/data/products';
import { IconCart, IconTag, IconTruck, IconCheckCircle } from '@/components/Icons';

export default function CartDrawer() {
  const {
    state,
    dispatch,
    getCartSubtotal,
    getCartMrpTotal,
    getCartDiscount,
    getDeliveryFee,
    getCartTotal,
    getCartItemCount,
    showToast,
  } = useStore();
  const lang = state.lang;
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [showOutOfStockSection, setShowOutOfStockSection] = useState(true);

  // Out of stock demo items from reference screenshot 1
  const outOfStockItems = [
    {
      id: 'oos-vanilla',
      name: lang === 'ta' ? 'புரமேட் வெண்ணிலா எசென்ஸ்' : 'Puramate Culinary Vanilla Essence',
      unit: '1 unit • 30 ml',
      image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'oos-baking-paper',
      name: lang === 'ta' ? 'பெகோ பேக்கிங் & ரேப்பிங் பேப்பர்' : 'Beco Baking & Food Wrapping Paper',
      unit: '1 unit • 1 roll',
      image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=200&q=80',
    },
  ];

  // Substitute recommendations from reference screenshot 1
  const substituteSuggestions = [
    {
      id: 'sub-baking-soda',
      name: lang === 'ta' ? 'புரமேட் பேக்கிங் சோடா' : 'Puramate Baking Soda',
      unit: '50 g',
      price: 23,
      mrp: 25,
      discount: '8% OFF',
      image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'sub-wrap-roll',
      name: lang === 'ta' ? 'ஆர்கானிக் கிச்சன் ரேப்' : 'Beco Brown Food Wrap',
      unit: '1 roll',
      price: 125,
      mrp: 155,
      discount: '20% OFF',
      image: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=200&q=80',
    },
  ];

  if (!state.cartOpen) return null;

  const subtotal = getCartSubtotal();
  const freeDeliveryThreshold = 499;
  const remaining = Math.max(0, freeDeliveryThreshold - subtotal);
  const progress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'AMMAN50' || code === 'SAVE50' || code === 'MADURAI') {
      setCouponApplied(true);
      showToast(t('couponApplied', lang, { amount: 50 }));
    } else {
      showToast(lang === 'ta' ? 'தவறான கூப்பன் குறியீடு' : 'Invalid coupon code. Try AMMAN50');
    }
  };

  const finalTotal = Math.max(0, getCartTotal() - (couponApplied ? 50 : 0));

  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end"
      onClick={() => dispatch({ type: 'SET_CART_OPEN', open: false })}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" />
      <div
        className="relative w-full max-w-md bg-[#FDFBF7] h-full flex flex-col animate-slide-right shadow-2xl border-l border-[#EAE2D5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAE2D5] bg-[#FFFFFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center">
              <IconCart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-brand-slate leading-tight">
                {t('myCart', lang)}
              </h2>
              <p className="text-[11px] text-brand-slate/60">
                {getCartItemCount()} {t('items', lang)}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close cart"
            onClick={() => dispatch({ type: 'SET_CART_OPEN', open: false })}
            className="text-brand-slate/60 hover:text-brand-slate hover:bg-[#F5EFE6] rounded-xl transition-all w-9 h-9 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Free Delivery Meter - Fully Rounded 2xl Capsule Card */}
        {state.cart.length > 0 && (
          <div className="mx-4 my-2.5 p-3.5 bg-gradient-to-r from-[#F1F9EC] to-emerald-50 rounded-2xl border-2 border-emerald-300/80 shadow-xs">
            <div className="flex items-center justify-between gap-2 text-xs font-black text-slate-800 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <IconTruck className="w-4 h-4 text-[#1E4D12] shrink-0" />
                <span className="truncate text-xs font-bold text-slate-900">
                  {remaining > 0
                    ? t('addMoreForFree', lang, { amount: remaining })
                    : t('freeDeliveryUnlocked', lang)}
                </span>
              </div>
              <span className="text-[#1E4D12] text-[11px] font-black bg-white px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs shrink-0">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-emerald-100 rounded-full overflow-hidden border border-emerald-200/50">
              <div
                className="h-full rounded-full transition-all duration-500 shadow-xs"
                style={{
                  width: `${progress}%`,
                  backgroundColor: remaining > 0 ? '#F59E0B' : '#4CB01E',
                }}
              />
            </div>
          </div>
        )}

        {/* Cart Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Blinkit-Style "Items Not In Stock" Warning Card (as requested from reference screenshot) */}
          {state.cart.length > 0 && showOutOfStockSection && (
            <div className="bg-[#1C1F26] border-2 border-rose-500/60 rounded-3xl p-3.5 text-white shadow-xl animate-fade-in">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h3 className="font-black text-rose-400 text-sm tracking-tight">
                    {lang === 'ta' ? '2 பொருட்கள் இருப்பில் இல்லை' : '2 items are not in stock'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOutOfStockSection(false)}
                  className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white flex items-center justify-center text-xs transition-colors"
                  aria-label="Dismiss out of stock warning"
                >
                  ✕
                </button>
              </div>

              {/* List of Out of stock items */}
              <div className="space-y-2.5 py-1">
                {outOfStockItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-800/80 p-1 border border-slate-700/60 flex items-center justify-center shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain rounded opacity-75" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-200 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{item.unit}</p>
                      <button
                        type="button"
                        onClick={() => showToast(lang === 'ta' ? 'விருப்பப்பட்டியலில் சேர்க்கப்பட்டது!' : 'Moved to wishlist!')}
                        className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 underline decoration-dotted mt-0.5"
                      >
                        {lang === 'ta' ? 'விருப்பப்பட்டியலுக்கு மாற்று' : 'Move to wishlist'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add these items instead Carousel / Rail */}
              <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                <p className="text-xs font-black text-slate-300 mb-2">
                  {lang === 'ta' ? 'மாற்றாக இவற்றைச் சேர்க்கவும்' : 'Add these items instead'}
                </p>
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
                  {substituteSuggestions.map((sub) => (
                    <div
                      key={sub.id}
                      className="w-44 shrink-0 bg-slate-800/70 border border-slate-700/80 rounded-2xl p-2.5 flex items-center gap-2 relative shadow-md"
                    >
                      <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-xs">
                        {sub.discount}
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-slate-900/80 p-1 border border-slate-700 flex items-center justify-center shrink-0 mt-2">
                        <img src={sub.image} alt={sub.name} className="w-full h-full object-contain rounded" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[11px] text-slate-200 truncate leading-tight">{sub.name}</p>
                        <p className="text-[10px] text-slate-400">{sub.unit}</p>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-black text-xs text-white">₹{sub.price}</span>
                          <span className="text-[10px] text-slate-400 line-through">₹{sub.mrp}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            showToast(lang === 'ta' ? `${sub.name} கூடையில் சேர்க்கப்பட்டது!` : `Added ${sub.name}!`);
                          }}
                          className="mt-1 w-full bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/50 text-[10px] font-black py-1 rounded-lg transition-colors text-center"
                        >
                          {lang === 'ta' ? 'சேர்' : 'ADD'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {state.cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
              <div className="w-20 h-20 rounded-2xl bg-[#F5EFE6] border border-[#EAE2D5] flex items-center justify-center text-brand-primary mb-4 shadow-xs">
                <IconCart className="w-10 h-10" />
              </div>
              <h3 className="text-base font-extrabold text-brand-slate mb-1">
                {t('cartEmpty', lang)}
              </h3>
              <p className="text-xs text-brand-slate/60 mb-5 max-w-xs leading-relaxed">
                {t('cartEmptyDesc', lang)}
              </p>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'SET_CART_OPEN', open: false });
                  dispatch({ type: 'SET_PAGE', page: 'products' });
                }}
                className="bg-brand-primary hover:bg-brand-highlight text-white px-6 py-3 rounded-xl font-bold text-xs touch-target shadow-md transition-all"
              >
                {t('shopNow', lang)}
              </button>
            </div>
          ) : (
            <>
              {/* Itemized List */}
              <div className="space-y-2.5">
                {state.cart.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (!product) return null;
                  const variant = product.variants[item.variantIndex];
                  if (!variant) return null;

                  return (
                    <div
                      key={`${item.productId}-${item.variantIndex}`}
                      className="flex items-center gap-3 bg-[#FFFFFF] border border-[#EAE2D5] rounded-xl p-3 shadow-xs"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#FBF8F3] border border-[#EAE2D5] shrink-0 p-0.5">
                        <img
                          src={product.image}
                          alt={lang === 'ta' ? product.nameTa : product.nameEn}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-brand-slate break-words leading-tight">
                          {lang === 'ta' ? product.nameTa : product.nameEn}
                        </p>
                        <p className="text-brand-slate/50 text-[11px] mt-0.5 break-words">
                          {variant.label}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="font-extrabold text-brand-slate text-sm">
                            ₹{variant.price * item.quantity}
                          </span>
                          <span className="text-[10px] text-gray-400 line-through">
                            ₹{variant.mrp * item.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper (Consistent clean green shade) */}
                      <div
                        className="flex items-center bg-[#4CB01E] text-white rounded-lg overflow-hidden shrink-0 shadow-xs select-none"
                        style={{ minHeight: '34px' }}
                      >
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            dispatch({
                              type: 'UPDATE_QUANTITY',
                              productId: item.productId,
                              variantIndex: item.variantIndex,
                              quantity: item.quantity - 1,
                            })
                          }
                          className="px-2.5 py-1 font-black text-sm bg-transparent active:scale-90 transition-transform focus:outline-none"
                        >
                          −
                        </button>
                        <span className="px-2 font-black text-xs min-w-[1.5rem] text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() =>
                            dispatch({
                              type: 'UPDATE_QUANTITY',
                              productId: item.productId,
                              variantIndex: item.variantIndex,
                              quantity: item.quantity + 1,
                            })
                          }
                          className="px-2.5 py-1 font-black text-sm bg-transparent active:scale-90 transition-transform focus:outline-none"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Frequently Added Essentials - Side by Side with Smooth Horizontal Scroll & Prominent Images */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {t('impulseAddTitle', lang)}
                  </h4>
                  <span className="text-[10px] text-[#1E4D12] font-black bg-[#F1F9EC] px-2 py-0.5 rounded-full border border-emerald-200">
                    {lang === 'ta' ? 'அத்தியாவசியம்' : 'Quick Add'}
                  </span>
                </div>
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 px-1 edge-scroll">
                  {impulseEssentials.map((imp) => {
                    const prod = products.find((p) => p.id === imp.productId);
                    if (!prod) return null;
                    const variant = prod.variants[imp.variantIndex];
                    if (!variant) return null;

                    return (
                      <div
                        key={prod.id}
                        className="w-40 shrink-0 bg-white border border-slate-200/90 rounded-2xl p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-xs hover:border-[#4CB01E] transition-all"
                      >
                        <div className="w-full h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 mb-2">
                          <img src={prod.image} alt={prod.nameEn} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 mb-2">
                          <p className="font-bold text-xs text-slate-900 truncate leading-snug">
                            {lang === 'ta' ? prod.nameTa : prod.nameEn}
                          </p>
                          <p className="text-[10px] text-slate-500 font-semibold">{variant.label}</p>
                          <p className="font-black text-xs text-[#1E4D12] mt-0.5">₹{variant.price}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            dispatch({
                              type: 'ADD_TO_CART',
                              productId: prod.id,
                              variantIndex: imp.variantIndex,
                              quantity: 1,
                            });
                            showToast(t('addedToCart', lang));
                          }}
                          className="w-full bg-[#F1F9EC] hover:bg-[#4CB01E] hover:text-white text-[#1E4D12] font-black py-1.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                        >
                          <span>+</span>
                          <span>{lang === 'ta' ? 'சேர்' : 'ADD'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Promo Coupon Box */}
              <form onSubmit={handleApplyCoupon} className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder={lang === 'ta' ? 'கூப்பன் (எ.கா. AMMAN50)' : 'Coupon Code (e.g. AMMAN50)'}
                  className="flex-1 text-xs border border-[#EAE2D5] bg-[#FFFFFF] rounded-xl px-3 py-2 font-semibold text-brand-slate outline-none focus:border-brand-primary uppercase placeholder:normal-case"
                />
                <button
                  type="submit"
                  className="bg-[#F5EFE6] hover:bg-[#EAE2D5] text-brand-slate border border-[#EAE2D5] px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  {t('apply', lang)}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Bill Summary Footer (Sticky Bottom) */}
        {state.cart.length > 0 && (
          <div className="border-t border-[#EAE2D5] px-5 py-4 bg-[#FFFFFF] shadow-2xl">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-brand-slate/70">
                <span>{t('itemTotal', lang)}</span>
                <span className="font-semibold text-brand-slate">₹{getCartMrpTotal()}</span>
              </div>
              <div className="flex justify-between text-brand-primary">
                <span>{t('productDiscount', lang)}</span>
                <span className="font-bold">-₹{getCartDiscount()}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-brand-primary font-bold">
                  <span>Promo AMMAN50 Discount</span>
                  <span>-₹50</span>
                </div>
              )}
              <div className="flex justify-between text-brand-slate/70">
                <span>{t('deliveryFee', lang)}</span>
                <span className="font-bold">
                  {getDeliveryFee() === 0 ? (
                    <span className="text-brand-primary font-bold">{t('free', lang)}</span>
                  ) : (
                    `₹${getDeliveryFee()}`
                  )}
                </span>
              </div>
              <div className="border-t border-[#EAE2D5] pt-2 flex justify-between font-black text-base text-brand-slate">
                <span>{t('grandTotal', lang)}</span>
                <span className="text-brand-primary">₹{finalTotal}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                dispatch({ type: 'SET_CART_OPEN', open: false });
                dispatch({ type: 'SET_PAGE', page: 'checkout' });
              }}
              className="w-full bg-brand-primary hover:bg-brand-highlight text-white font-black text-sm rounded-xl mt-3.5 transition-all shadow-lg shadow-brand-primary/30 touch-target flex items-center justify-center gap-2"
              style={{ minHeight: '50px' }}
            >
              <span>{t('proceedCheckout', lang)}</span>
              <span>(₹{finalTotal})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
