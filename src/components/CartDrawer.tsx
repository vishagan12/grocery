'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products, impulseEssentials } from '@/data/products';
import { IconCart, IconTruck } from '@/components/Icons';
import { useDialog } from '@/hooks/useDialog';
import { FREE_DELIVERY_THRESHOLD } from '@/lib/brand';

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

  const closeCart = () => dispatch({ type: 'SET_CART_OPEN', open: false });
  const panelRef = useDialog(state.cartOpen, closeCart);

  if (!state.cartOpen) return null;

  const subtotal = getCartSubtotal();
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'AMMAN50' || code === 'AMMA50' || code === 'SAVE50') {
      dispatch({ type: 'APPLY_COUPON', code, discount: 50 });
      showToast(t('couponApplied', lang, { amount: 50 }));
    } else if (code === 'FREEDEL') {
      dispatch({ type: 'APPLY_COUPON', code, discount: 30 });
      showToast(lang === 'ta' ? 'இலவச டெலிவரி கூப்பன் சேர்க்கப்பட்டது (ரூ. 30 தள்ளுபடி)' : 'Free delivery coupon applied (₹30 OFF)');
    } else if (code === 'MALIGAI100') {
      dispatch({ type: 'APPLY_COUPON', code, discount: 100 });
      showToast(lang === 'ta' ? 'ரூ. 100 மளிகை தள்ளுபடி சேர்க்கப்பட்டது' : 'Flat ₹100 grocery discount applied');
    } else {
      showToast(lang === 'ta' ? 'தவறான கூப்பன் குறியீடு' : 'Invalid coupon code. Try AMMAN50');
    }
  };

  const finalTotal = getCartTotal();

  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end overscroll-contain"
      onClick={closeCart}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        tabIndex={-1}
        className="relative w-full max-w-md bg-[#FDFBF7] h-full flex flex-col animate-slide-right shadow-2xl border-l border-[#EAE2D5] overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAE2D5] bg-[#FFFFFF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-apple text-brand-forest flex items-center justify-center">
              <IconCart className="w-4 h-4" />
            </div>
            <div>
              <h2 id="cart-drawer-title" className="text-base font-extrabold text-brand-slate leading-tight">
                {t('myCart', lang)}
              </h2>
              <p className="text-[11px] text-slate-600">
                {getCartItemCount()} {t('items', lang)}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={lang === 'ta' ? 'கூடையை மூடு' : 'Close cart'}
            onClick={closeCart}
            className="text-slate-600 hover:text-brand-slate hover:bg-[#F5EFE6] rounded-xl transition-all w-10 h-10 flex items-center justify-center"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Free Delivery Meter - Fully Rounded 2xl Capsule Card */}
        {state.cart.length > 0 && (
          <div className="mx-4 my-2.5 p-3.5 bg-gradient-to-r from-brand-mint to-emerald-50 rounded-2xl border-2 border-emerald-300/80 shadow-xs">
            <div className="flex items-center justify-between gap-2 text-xs font-black text-slate-800 mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <IconTruck className="w-4 h-4 text-brand-forest shrink-0" />
                <span className="text-xs font-bold text-slate-900 break-words leading-tight flex-1">
                  {remaining > 0
                    ? t('addMoreForFree', lang, { amount: remaining })
                    : t('freeDeliveryUnlocked', lang)}
                </span>
              </div>
              <span className="text-brand-forest text-[11px] font-black bg-white px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs shrink-0">
                {Math.round(progress)}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label={lang === 'ta' ? 'இலவச டெலிவரி முன்னேற்றம்' : 'Free delivery progress'}
              className="w-full h-2.5 bg-emerald-100 rounded-full overflow-hidden border border-emerald-200/50"
            >
              <div
                className="h-full rounded-full transition-all duration-500 shadow-xs"
                style={{
                  width: `${progress}%`,
                  backgroundColor: remaining > 0 ? '#F59E0B' : 'var(--color-primary)',
                }}
              />
            </div>
          </div>
        )}

        {/* Cart Content Area */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3 space-y-4 overscroll-contain touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {state.cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
              <div aria-hidden="true" className="w-20 h-20 rounded-2xl bg-[#F5EFE6] border border-[#EAE2D5] flex items-center justify-center text-brand-primary mb-4 shadow-xs">
                <IconCart className="w-10 h-10" />
              </div>
              <h3 className="text-base font-extrabold text-brand-slate mb-1">
                {t('cartEmpty', lang)}
              </h3>
              <p className="text-xs text-slate-600 mb-5 max-w-xs leading-relaxed">
                {t('cartEmptyDesc', lang)}
              </p>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  dispatch({ type: 'SET_PAGE', page: 'products' });
                }}
                className="bg-brand-primary hover:brightness-110 text-brand-forest px-6 py-3 rounded-xl font-bold text-xs touch-target shadow-md transition-all"
              >
                {t('shopNow', lang)}
              </button>
            </div>
          ) : (
            <>
              {/* Itemized List - Clean, premium and neat card styling */}
              <div className="space-y-3">
                {state.cart.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (!product) return null;
                  const variant = product.variants[item.variantIndex];
                  if (!variant) return null;

                  return (
                    <div
                      key={`${item.productId}-${item.variantIndex}`}
                      className="flex items-center gap-3 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 relative flex items-center justify-center">
                        <img
                          src={product.image}
                          alt=""
                          width={56}
                          height={56}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-slate-900 break-words leading-tight text-sm">
                          {lang === 'ta' ? product.nameTa : product.nameEn}
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5 font-medium">
                          {variant.label}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="font-extrabold text-slate-900 text-sm">
                            ₹{variant.price * item.quantity}
                          </span>
                          <span className="text-[11px] text-slate-500 line-through">
                            ₹{variant.mrp * item.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper (Consistent clean green shade) */}
                      <div
                        role="group"
                        aria-label={lang === 'ta' ? 'அளவு' : 'Quantity'}
                        className="flex items-center bg-apple text-brand-forest rounded-lg overflow-hidden shrink-0 shadow-xs select-none"
                      >
                        <button
                          type="button"
                          aria-label={
                            item.quantity === 1
                              ? lang === 'ta' ? 'கூடையிலிருந்து நீக்கு' : 'Remove from cart'
                              : lang === 'ta' ? 'அளவைக் குறை' : 'Decrease quantity'
                          }
                          onClick={() =>
                            dispatch({
                              type: 'UPDATE_QUANTITY',
                              productId: item.productId,
                              variantIndex: item.variantIndex,
                              quantity: item.quantity - 1,
                            })
                          }
                          className="min-w-[36px] min-h-[36px] font-black text-sm bg-transparent hover:bg-apple-hover active:scale-90 transition-transform"
                        >
                          −
                        </button>
                        <span aria-live="polite" className="px-1 font-black text-xs min-w-[1.5rem] text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={lang === 'ta' ? 'அளவை அதிகரி' : 'Increase quantity'}
                          onClick={() =>
                            dispatch({
                              type: 'UPDATE_QUANTITY',
                              productId: item.productId,
                              variantIndex: item.variantIndex,
                              quantity: item.quantity + 1,
                            })
                          }
                          className="min-w-[36px] min-h-[36px] font-black text-sm bg-transparent hover:bg-apple-hover active:scale-90 transition-transform"
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
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {t('impulseAddTitle', lang)}
                  </h3>
                  <span className="text-[10px] text-brand-forest font-black bg-brand-mint px-2 py-0.5 rounded-full border border-emerald-200">
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
                        className="w-40 shrink-0 bg-white border border-slate-200/90 rounded-2xl p-2.5 flex flex-col justify-between shadow-2xs hover:shadow-xs hover:border-apple transition-all"
                      >
                        <div className="w-full h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center relative mb-2">
                          <img
                            src={prod.image}
                            alt=""
                            width={140}
                            height={80}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 mb-2">
                          <p className="font-bold text-xs text-slate-900 break-words leading-snug">
                            {lang === 'ta' ? prod.nameTa : prod.nameEn}
                          </p>
                          <p className="text-[10px] text-slate-600 font-semibold">{variant.label}</p>
                          <p className="font-black text-xs text-brand-forest mt-0.5">₹{variant.price}</p>
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
                          aria-label={lang === 'ta' ? `${prod.nameTa} சேர்` : `Add ${prod.nameEn}`}
                          className="w-full min-h-[36px] bg-brand-mint hover:bg-apple text-brand-forest font-black py-1.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 shadow-2xs active:scale-95"
                        >
                          <span aria-hidden="true">+</span>
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
                  aria-label={lang === 'ta' ? 'கூப்பன் குறியீடு' : 'Coupon code'}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder={lang === 'ta' ? 'கூப்பன் (எ.கா. AMMAN50)' : 'Coupon Code (e.g. AMMAN50)'}
                  className="flex-1 min-w-0 min-h-[44px] text-xs border border-slate-300 bg-[#FFFFFF] rounded-xl px-3 py-2 font-semibold text-brand-slate outline-none focus:border-brand-forest focus:ring-2 focus:ring-apple/40 uppercase placeholder:normal-case placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!couponCode.trim()}
                  className="min-h-[44px] bg-[#F5EFE6] hover:bg-[#EAE2D5] disabled:opacity-60 text-brand-slate border border-[#EAE2D5] px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
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
              <div className="flex justify-between text-brand-deep">
                <span>{t('productDiscount', lang)}</span>
                <span className="font-bold">-₹{getCartDiscount()}</span>
              </div>
              {state.couponDiscount > 0 && (
                <div className="flex justify-between text-brand-deep font-bold">
                  <span>Promo {state.appliedCoupon} Discount</span>
                  <span>-₹{state.couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-brand-slate/70">
                <span>{t('deliveryFee', lang)}</span>
                <span className="font-bold">
                  {getDeliveryFee() === 0 ? (
                    <span className="text-brand-deep font-bold">{t('free', lang)}</span>
                  ) : (
                    `₹${getDeliveryFee()}`
                  )}
                </span>
              </div>
              <div className="border-t border-[#EAE2D5] pt-2 flex justify-between font-black text-base text-brand-slate">
                <span>{t('grandTotal', lang)}</span>
                <span className="text-brand-deep">₹{finalTotal}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                closeCart();
                dispatch({ type: 'SET_PAGE', page: 'checkout' });
              }}
              className="w-full min-h-[50px] bg-brand-primary hover:brightness-110 text-brand-forest font-black text-sm rounded-xl mt-3.5 transition-all shadow-lg shadow-brand-primary/30 touch-target flex items-center justify-center gap-2"
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
