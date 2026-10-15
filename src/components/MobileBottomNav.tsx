'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products } from '@/data/products';
import {
  Home,
  LayoutGrid,
  RotateCcw,
  Receipt,
  Truck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function MobileBottomNav() {
  const { state, dispatch, getCartItemCount, getCartSubtotal, getCartDiscount } = useStore();
  const lang = state.lang;
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const cartCount = getCartItemCount();
  const cartSubtotal = getCartSubtotal();
  const cartSavings = getCartDiscount();
  const freeDeliveryDiff = Math.max(0, 499 - cartSubtotal);
  const freeDeliveryProgress = Math.min(100, Math.round((cartSubtotal / 499) * 100));

  // Get last 3 products added to cart for thumbnail stack
  const recentCartProducts = state.cart
    .slice(-3)
    .reverse()
    .map((item) => products.find((p) => p.id === item.productId))
    .filter(Boolean);

  const navItems = [
    { key: 'home', Icon: Home, label: t('home', lang) },
    { key: 'products', Icon: LayoutGrid, label: t('categories', lang) },
    { key: 'monthly-list', Icon: RotateCcw, label: lang === 'ta' ? 'மாத லிஸ்ட்' : 'Order Again' },
    { key: 'orders', Icon: Receipt, label: t('trackOrder', lang) },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-md md:max-w-xl mx-auto pointer-events-auto">
        {/* Layer 1: Dark Free-Delivery Nudge Strip (only shown while unlocking; disappears once free delivery is reached) */}
        {cartCount > 0 && cartSubtotal < 499 && (
          <div className="mx-2 sm:mx-3 mb-1.5 bg-[#1E293B] text-white text-xs px-3.5 py-2.5 rounded-2xl shadow-xl flex flex-col gap-1.5 border border-slate-700/60 animate-slide-up">
            <div className="flex items-center justify-between font-bold text-[11px] sm:text-xs">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="leading-tight truncate">
                  {lang === 'ta'
                    ? `இலவச டெலிவரிக்கு மேலும் ₹${freeDeliveryDiff} சேருங்கள்`
                    : `Shop for ₹${freeDeliveryDiff} more for FREE delivery!`}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                ₹{cartSubtotal}/₹499
              </span>
            </div>
            {/* Mini Lime Progress Bar */}
            <div className="w-full bg-slate-700/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#4CB01E] h-full rounded-full transition-all duration-300"
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Layer 2: The Blinkit Floating Green "View Cart" Pill (when cartCount > 0) */}
        {cartCount > 0 && (
          <div
            onClick={() => dispatch({ type: 'SET_CART_OPEN', open: true })}
            className="mx-2 sm:mx-3 mb-2 bg-[#4CB01E] hover:bg-[#3D9415] text-white rounded-2xl p-2.5 sm:p-3 shadow-2xl flex items-center justify-between border border-white/25 cursor-pointer transition-all active:scale-[0.99] select-none gap-2"
          >
            {/* Left: Overlapping circular thumbnails + item count & subtotal */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex items-center -space-x-2 shrink-0">
                {recentCartProducts.map((p, idx) => (
                  <div
                    key={p?.id || idx}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-[#4CB01E] overflow-hidden flex items-center justify-center p-0.5 shadow-xs shrink-0"
                  >
                    <img
                      src={p?.image}
                      alt={p?.nameEn}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col min-w-0 leading-tight flex-1">
                <span className="font-extrabold text-xs sm:text-base text-white break-words">
                  {cartCount} {t('items', lang)} • ₹{cartSubtotal}
                </span>
                {cartSavings > 0 ? (
                  <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-100 break-words">
                    {lang === 'ta' ? `ரூ. ${cartSavings} சேமிப்பு` : `Saved ₹${cartSavings}`}
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-100 font-medium break-words">
                    {lang === 'ta' ? 'அதிவேக டெலிவரி' : 'Express Delivery'}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Bold View Cart CTA with Lucide Arrow */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-white text-[#1E4D12] font-black text-xs sm:text-sm px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl shadow-md shrink-0 whitespace-nowrap">
              <span>{lang === 'ta' ? 'கூடை பார்க்க' : 'View Cart'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* Layer 3: Frosted Glass 4-Tab Bottom Navigation Bar (Always visible on mobile) */}
      <nav className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 h-16 px-4 flex items-center justify-around pointer-events-auto shadow-lg pb-safe">
        {navItems.map((item) => {
          const isActive = state.currentPage === item.key && !state.cartOpen;
          const NavIcon = item.Icon;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                dispatch({ type: 'SET_CART_OPEN', open: false });
                dispatch({ type: 'SET_PAGE', page: item.key });
                if (item.key === 'products') {
                  dispatch({ type: 'SET_CATEGORY', category: 'all' });
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all relative ${
                isActive ? 'text-[#1E4D12] font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-[#F1F9EC] text-[#4CB01E]' : ''
                }`}
              >
                <NavIcon className="w-5 h-5" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold leading-none mt-0.5">
                {item.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#4CB01E] mt-1 shadow-2xs" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
