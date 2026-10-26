'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products } from '@/data/products';
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  Receipt,
  User,
  Truck,
  ArrowRight,
} from 'lucide-react';

export default function MobileBottomNav() {
  const { state, dispatch, getCartItemCount, getCartSubtotal, getCartDiscount } = useStore();
  const lang = state.lang;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide floating dock during checkout so it never blocks payment/address forms
  if (state.currentPage === 'checkout') {
    return null;
  }

  const cartCount = mounted ? getCartItemCount() : 0;
  const cartSubtotal = mounted ? getCartSubtotal() : 0;
  const cartSavings = mounted ? getCartDiscount() : 0;
  const freeDeliveryDiff = Math.max(0, 499 - cartSubtotal);
  const freeDeliveryProgress = Math.min(100, Math.round((cartSubtotal / 499) * 100));

  // Get last 3 products added to cart for thumbnail stack
  const recentCartProducts = mounted
    ? state.cart
        .slice(-3)
        .reverse()
        .map((item) => products.find((p) => p.id === item.productId))
        .filter(Boolean)
    : [];

  const navItems = [
    { key: 'home', Icon: Home, label: t('home', lang) },
    { key: 'products', Icon: LayoutGrid, label: t('categories', lang) },
    { key: 'cart', Icon: ShoppingBag, label: lang === 'ta' ? 'கூடை' : 'Cart', isCart: true },
    { key: 'orders', Icon: Receipt, label: t('trackOrder', lang) },
    { key: 'profile', Icon: User, label: lang === 'ta' ? 'கணக்கு' : 'Profile' },
  ];

  return (
    <div className="fixed bottom-3 sm:bottom-4 inset-x-0 z-40 px-3 sm:px-4 pointer-events-none flex flex-col items-center justify-end pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-md pointer-events-auto">
        {/* Layer 1: Dark Free-Delivery Nudge Strip (only shown while unlocking; disappears once free delivery is reached) */}
        {cartCount > 0 && cartSubtotal < 499 && (
          <div className="mx-1 mb-2 bg-[#1E293B]/95 backdrop-blur-md text-white text-xs px-3.5 py-2 rounded-2xl shadow-xl flex flex-col gap-1 border border-slate-700/60 animate-slide-up">
            <div className="flex items-center justify-between font-bold text-[11px]">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="leading-tight truncate">
                  {lang === 'ta'
                    ? `இலவச டெலிவரிக்கு மேலும் ₹${freeDeliveryDiff} சேருங்கள்`
                    : `Add ₹${freeDeliveryDiff} more for FREE delivery!`}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                ₹{cartSubtotal}/₹499
              </span>
            </div>
            {/* Mini Lime Progress Bar */}
            <div className="w-full bg-slate-700/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#76CA3E] h-full rounded-full transition-all duration-300"
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Layer 2: The Blinkit Floating Green "View Cart" Pill (when cartCount > 0) */}
        {cartCount > 0 && (
          <div
            onClick={() => dispatch({ type: 'SET_CART_OPEN', open: true })}
            className="mx-1 mb-2 bg-[#76CA3E] hover:bg-[#60B328] text-white rounded-2xl p-2.5 sm:p-3 shadow-2xl flex items-center justify-between border border-white/25 cursor-pointer transition-all active:scale-[0.99] select-none gap-2"
          >
            {/* Left: Overlapping circular thumbnails + item count & subtotal */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex items-center -space-x-2 shrink-0">
                {recentCartProducts.map((p, idx) => (
                  <div
                    key={p?.id || idx}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-white shadow-md overflow-hidden shrink-0 relative"
                  >
                    <img
                      src={p?.image}
                      alt={p?.nameEn}
                      className="w-full h-full object-cover rounded-full"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col min-w-0 leading-tight flex-1">
                <span className="font-extrabold text-xs sm:text-sm text-white truncate">
                  {cartCount} {t('items', lang)} • ₹{cartSubtotal}
                </span>
                {cartSavings > 0 ? (
                  <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-100 truncate">
                    {lang === 'ta' ? `ரூ. ${cartSavings} சேமிப்பு` : `Saved ₹${cartSavings}`}
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-100 font-medium truncate">
                    {lang === 'ta' ? 'அதிவேக டெலிவரி' : 'Express Delivery'}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Bold View Cart CTA with Lucide Arrow */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-white text-[#143B0D] font-black text-xs px-2.5 sm:px-3 py-1.5 rounded-xl shadow-md shrink-0 whitespace-nowrap">
              <span>{lang === 'ta' ? 'கூடை' : 'View Cart'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </div>

      {/* Layer 3: Sleek Elevated Floating Pill Dock */}
      <nav className="pointer-events-auto w-full max-w-md bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-8px_rgba(15,23,42,0.18),0_4px_12px_-2px_rgba(4,120,87,0.08)] px-2 py-1.5 flex items-center justify-around transition-all duration-300">
        {navItems.map((item) => {
          const isActive = item.isCart
            ? state.cartOpen
            : (state.currentPage === item.key || (item.key === 'orders' && state.currentPage === 'monthly-list')) && !state.cartOpen;
          const NavIcon = item.Icon;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (item.isCart) {
                  dispatch({ type: 'SET_CART_OPEN', open: true });
                } else {
                  dispatch({ type: 'SET_CART_OPEN', open: false });
                  dispatch({ type: 'SET_PAGE', page: item.key });
                  if (item.key === 'products') {
                    dispatch({ type: 'SET_CATEGORY', category: 'all' });
                  }
                }
              }}
              className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-95 relative select-none ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold rounded-xl sm:rounded-2xl px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <NavIcon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-emerald-700' : 'text-slate-500'}`} />
                {item.isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center ring-2 ring-white shadow-xs px-1">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none mt-1 whitespace-nowrap ${isActive ? 'text-emerald-800 font-bold' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
