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

        {/* Free Delivery Meter */}
        {state.cart.length > 0 && (
          <div className="px-5 py-3 bg-brand-mint border-b border-emerald-100">
            <div className="flex items-center justify-between text-xs font-bold text-brand-slate mb-1.5">
              <span>
                {remaining > 0
                  ? t('addMoreForFree', lang, { amount: remaining })
                  : t('freeDeliveryUnlocked', lang)}
              </span>
              <span className="text-brand-primary text-[10px]">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2 bg-emerald-100/80 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: remaining > 0 ? '#F59E0B' : '#2E7D32',
                }}
              />
            </div>
          </div>
        )}

        {/* Cart Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
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

              {/* Frequently Added Impulse Essentials (Fills empty vertical space!) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-slate/70">
                    {t('impulseAddTitle', lang)}
                  </h4>
                  <span className="text-[10px] text-brand-primary font-bold bg-brand-mint px-2 py-0.5 rounded">
                    {lang === 'ta' ? 'அத்தியாவசியம்' : 'Quick Add'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {impulseEssentials.map((imp) => {
                    const prod = products.find((p) => p.id === imp.productId);
                    if (!prod) return null;
                    const variant = prod.variants[imp.variantIndex];
                    if (!variant) return null;

                    return (
                      <div
                        key={prod.id}
                        className="bg-[#FFFFFF] border border-[#EAE2D5] rounded-xl p-2.5 flex items-center gap-2 hover:border-brand-primary/40 transition-colors shadow-xs"
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F5EFE6] shrink-0">
                          <img src={prod.image} alt={prod.nameEn} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 text-[11px]">
                          <p className="font-bold text-brand-slate break-words leading-snug">
                            {lang === 'ta' ? prod.nameTa : prod.nameEn}
                          </p>
                          <p className="text-brand-slate/60 text-[10px] mt-0.5">₹{variant.price}</p>
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
                          className="bg-brand-mint hover:bg-brand-primary hover:text-white text-brand-primary font-black px-2 py-1 rounded text-xs transition-colors shrink-0"
                          title="Quick Add to Cart"
                        >
                          +
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
