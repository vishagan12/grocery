'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products } from '@/data/products';
import { FREE_DELIVERY_THRESHOLD } from '@/lib/brand';
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
  const freeDeliveryDiff = Math.max(0, FREE_DELIVERY_THRESHOLD - cartSubtotal);
  const freeDeliveryProgress = Math.min(100, Math.round((cartSubtotal / FREE_DELIVERY_THRESHOLD) * 100));

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
    <div className="fixed bottom-6 sm:bottom-8 inset-x-0 z-40 px-3 sm:px-4 pointer-events-none flex flex-col items-center justify-end pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-sm sm:max-w-md pointer-events-auto">
        {/* Layer 1: Dark Free-Delivery Nudge Strip (only shown while unlocking; disappears once free delivery is reached) */}
        {cartCount > 0 && cartSubtotal < FREE_DELIVERY_THRESHOLD && (
          <div className="mx-1 mb-2.5 bg-[#1E293B]/95 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-xl flex flex-col gap-1 border border-slate-700/60 animate-slide-up">
            <div className="flex items-center justify-between font-bold text-[11px]">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Truck aria-hidden="true" className="w-3.5 h-3.5 text-apple shrink-0" />
                <span className="leading-tight truncate">
                  {lang === 'ta'
                    ? `இலவச டெலிவரிக்கு மேலும் ₹${freeDeliveryDiff} சேருங்கள்`
                    : `Add ₹${freeDeliveryDiff} more for FREE delivery!`}
                </span>
              </div>
              <span className="text-[10px] text-slate-300 font-mono shrink-0 ml-2">
                ₹{cartSubtotal}/₹{FREE_DELIVERY_THRESHOLD}
              </span>
            </div>
            <div aria-hidden="true" className="w-full bg-slate-700/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-apple h-full rounded-full transition-all duration-300"
                style={{ width: `${freeDeliveryProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Layer 2: The Blinkit Floating Green "View Cart" Pill (when cartCount > 0) */}
        {cartCount > 0 && (
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => dispatch({ type: 'SET_CART_OPEN', open: true })}
            className="w-[calc(100%-0.5rem)] text-left mx-1 mb-2.5 bg-apple hover:bg-apple-hover text-brand-forest rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-2xl flex items-center justify-between border border-white/25 cursor-pointer transition-all active:scale-[0.99] select-none gap-2"
          >
            {/* Left: Overlapping circular thumbnails + item count & subtotal */}
            <span className="flex items-center gap-2.5 min-w-0 flex-1">
              <span aria-hidden="true" className="flex items-center -space-x-2 shrink-0">
                {recentCartProducts.map((p, idx) => (
                  <span
                    key={p?.id || idx}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-white shadow-md overflow-hidden shrink-0 relative"
                  >
                    <img
                      src={p?.image}
                      alt=""
                      width={32}
                      height={32}
                      className="w-full h-full object-cover rounded-full"
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                ))}
              </span>

              <span className="flex flex-col min-w-0 leading-tight flex-1">
                <span className="font-extrabold text-xs sm:text-sm text-brand-forest truncate">
                  {cartCount} {t('items', lang)} • ₹{cartSubtotal}
                </span>
                {cartSavings > 0 ? (
                  <span className="text-[10px] sm:text-[11px] font-bold text-brand-forest/90 truncate">
                    {lang === 'ta' ? `ரூ. ${cartSavings} சேமிப்பு` : `Saved ₹${cartSavings}`}
                  </span>
                ) : (
                  <span className="text-[10px] text-brand-forest/90 font-semibold truncate">
                    {lang === 'ta' ? 'அதிவேக டெலிவரி' : 'Express Delivery'}
                  </span>
                )}
              </span>
            </span>

            <span className="flex items-center gap-1 sm:gap-1.5 bg-white text-brand-forest font-black text-xs px-3 py-1.5 rounded-full shadow-md shrink-0 whitespace-nowrap">
              <span>{lang === 'ta' ? 'கூடை' : 'View Cart'}</span>
              <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
            </span>
          </button>
        )}
      </div>

      {/* Layer 3: Sleek Elevated Floating Capsule Dock */}
      <nav
        aria-label={lang === 'ta' ? 'முதன்மை வழிசெலுத்தல்' : 'Main navigation'}
        className="pointer-events-auto w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-full shadow-[0_16px_40px_-10px_rgba(15,23,42,0.22),0_6px_18px_-4px_rgba(5,150,105,0.12)] px-2.5 sm:px-3.5 py-1.5 sm:py-2 flex items-center justify-around ring-1 ring-black/5 transition-all duration-300"
      >
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
              aria-current={isActive && !item.isCart ? 'page' : undefined}
              aria-haspopup={item.isCart ? 'dialog' : undefined}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-all duration-200 active:scale-95 relative select-none ${
                isActive
                  ? 'bg-brand-mint text-brand-forest font-bold rounded-full px-3 sm:px-3.5 py-1 sm:py-1.5 shadow-2xs ring-1 ring-apple/50'
                  : 'text-slate-600 hover:text-slate-900 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-slate-100/70'
              }`}
            >
              <span className="relative flex items-center justify-center">
                <NavIcon aria-hidden="true" className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-brand-highlight' : 'text-slate-600'}`} />
                {item.isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-brand-forest text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center ring-2 ring-white shadow-xs px-1">
                    <span className="sr-only">{lang === 'ta' ? 'பொருட்கள்:' : 'Items:'} </span>
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-semibold leading-none mt-1 whitespace-nowrap ${isActive ? 'text-brand-forest font-bold' : 'text-slate-600'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
