'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { products } from '@/data/products';
import {
  RotateCcw,
  ShoppingBag,
  Package,
  Calendar,
  CreditCard,
  MapPin,
  ChevronRight,
  Plus,
  Check,
  ArrowRight,
  Receipt,
  Store,
  Sparkles,
  Truck,
  ExternalLink,
} from 'lucide-react';

export default function OrderAgainPage() {
  const { state, dispatch, showToast } = useStore();
  const lang = state.lang;
  const [reorderedOrderId, setReorderedOrderId] = useState<string | null>(null);

  // Group all unique items previously ordered by user
  const orderedItemsMap = new Map<string, { productId: string; variantIndex: number; count: number; lastOrdered: number }>();

  state.orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = `${item.productId}-${item.variantIndex}`;
      const existing = orderedItemsMap.get(key);
      if (existing) {
        existing.count += item.quantity;
        existing.lastOrdered = Math.max(existing.lastOrdered, order.timestamp);
      } else {
        orderedItemsMap.set(key, {
          productId: item.productId,
          variantIndex: item.variantIndex,
          count: item.quantity,
          lastOrdered: order.timestamp,
        });
      }
    });
  });

  const uniquePastItems = Array.from(orderedItemsMap.values()).sort((a, b) => b.lastOrdered - a.lastOrdered);

  const handleReorderFullOrder = (orderId: string) => {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;

    order.items.forEach((item) => {
      dispatch({
        type: 'ADD_TO_CART',
        productId: item.productId,
        variantIndex: item.variantIndex,
        quantity: item.quantity,
      });
    });

    setReorderedOrderId(orderId);
    showToast(
      lang === 'ta'
        ? `${order.items.length} பொருட்கள் கூடையில் சேர்க்கப்பட்டன`
        : `Added ${order.items.length} items from order ${order.id} to cart`
    );

    setTimeout(() => {
      dispatch({ type: 'SET_CART_OPEN', open: true });
      setReorderedOrderId(null);
    }, 450);
  };

  const handleAddSingleItem = (productId: string, variantIndex: number) => {
    dispatch({
      type: 'ADD_TO_CART',
      productId,
      variantIndex,
      quantity: 1,
    });

    const catalogList = state.catalog && state.catalog.length > 0 ? state.catalog : products;
    const prod = catalogList.find((p) => p.id === productId) || products.find((p) => p.id === productId);
    const prodName = prod ? (lang === 'ta' ? prod.nameTa : prod.nameEn) : 'Item';

    showToast(lang === 'ta' ? `${prodName} கூடையில் சேர்க்கப்பட்டது` : `Added ${prodName} to cart`);
  };

  // Empty State: No previous orders
  if (state.orders.length === 0) {
    return (
      <section className="py-16 md:py-24 bg-brand-cream min-h-[80vh] flex flex-col items-center justify-center px-4 w-full box-border">
        <div className="w-full max-w-md mx-auto text-center bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl box-border">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-brand-primary mx-auto mb-5 shadow-xs">
            <RotateCcw className="w-10 h-10" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
            {lang === 'ta' ? 'முந்தைய ஆர்டர்கள் எதுவும் இல்லை' : 'No Previous Orders Yet'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed max-w-sm mx-auto">
            {lang === 'ta'
              ? 'நீங்கள் ஒருமுறை மளிகைப் பொருட்களை வாங்கியதும், அவற்றை ஒரே கிளிக்கில் இங்கிருந்து மீண்டும் ஆர்டர் செய்யலாம்!'
              : 'Once you place an order with Sri Amman Supermarket, your purchased items and entire orders will appear here for fast 1-click reordering.'}
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_PAGE', page: 'products' })}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-highlight text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-md shadow-emerald-700/20 active:scale-98 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{lang === 'ta' ? 'ஷாப்பிங் செய்ய தொடங்கு' : 'Start Shopping Now'}</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 sm:py-10 md:py-12 bg-brand-cream min-h-screen text-slate-900 w-full overflow-x-hidden box-border">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 box-border">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 box-border">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-mint border border-apple/30 text-brand-highlight text-xs font-black uppercase tracking-wider mb-2">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'விரைவு மறு-ஆர்டர்' : '1-Click Express Reorder'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {lang === 'ta' ? 'முந்தைய ஆர்டர்கள் (மீண்டும் ஆர்டர்)' : 'Your Previous Orders'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === 'ta'
                ? 'உங்கள் முந்தைய ஆர்டர்களை சரிபார்த்து, ஒரே கிளிக்கில் மீண்டும் கூடையில் சேர்த்துக்கொள்ளுங்கள்.'
                : 'Quickly reorder your favorite grocery items and repeat your past supermarket orders.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
              {state.orders.length} {lang === 'ta' ? 'ஆர்டர்கள்' : state.orders.length === 1 ? 'Order' : 'Orders'}
            </span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_PAGE', page: 'orders' })}
              className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-highlight text-white px-4 py-2 rounded-xl text-xs font-black shadow-xs active:scale-98 transition-all"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{lang === 'ta' ? 'லைவ் டிராக்கிங்' : 'Track Active'}</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: Frequently Reordered Items Carousel / Grid */}
        {uniquePastItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                <span>{lang === 'ta' ? 'நீங்கள் அடிக்கடி வாங்கிய பொருட்கள்' : 'Items You Ordered Previously'}</span>
              </h2>
              <span className="text-xs text-slate-400 font-semibold">
                {uniquePastItems.length} {lang === 'ta' ? 'பொருட்கள்' : 'items'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {uniquePastItems.map((pastItem) => {
                const catalogList = state.catalog && state.catalog.length > 0 ? state.catalog : products;
                const prod = catalogList.find((p) => p.id === pastItem.productId) || products.find((p) => p.id === pastItem.productId);
                if (!prod) return null;
                const variant = prod.variants[pastItem.variantIndex] || prod.variants[0];

                return (
                  <div
                    key={`${pastItem.productId}-${pastItem.variantIndex}`}
                    className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all"
                  >
                    <div>
                      <div className="w-full aspect-square rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 mb-2.5 overflow-hidden">
                        <img
                          src={prod.image}
                          alt={prod.nameEn}
                          width={140}
                          height={140}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug break-words">
                        {lang === 'ta' ? prod.nameTa : prod.nameEn}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {variant?.label || '1 pack'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 font-mono">
                        ₹{variant?.price || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddSingleItem(pastItem.productId, pastItem.variantIndex)}
                        className="inline-flex items-center gap-1 bg-brand-mint hover:bg-brand-primary text-brand-highlight hover:text-white border border-apple/30 px-2.5 py-1 rounded-xl text-xs font-black transition-all active:scale-95 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: Complete Past Orders Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-primary" />
              <span>{lang === 'ta' ? 'முந்தைய முழு ஆர்டர் வரலாறு' : 'Previous Order History'}</span>
            </h2>
          </div>

          <div className="space-y-4">
            {state.orders.map((order) => {
              const orderDateStr = new Date(order.timestamp).toLocaleDateString(
                lang === 'ta' ? 'ta-IN' : 'en-IN',
                {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }
              );

              const orderTimeStr = new Date(order.timestamp).toLocaleTimeString(
                lang === 'ta' ? 'ta-IN' : 'en-IN',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              );

              const isReordering = reorderedOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 transition-all hover:border-slate-300"
                >
                  {/* Order Card Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-black text-xs sm:text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {order.id}
                        </span>
                        <span
                          className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                            order.status >= 4
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {order.status >= 4
                            ? lang === 'ta'
                              ? 'டெலிவரி செய்யப்பட்டது'
                              : 'Delivered'
                            : lang === 'ta'
                            ? 'செயலில் உள்ளது'
                            : 'In Progress'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {orderDateStr} at {orderTimeStr}
                        </span>
                        <span>&bull;</span>
                        <span className="inline-flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          {order.paymentMethod.toUpperCase()}
                        </span>
                      </p>
                    </div>

                    {/* Reorder Button */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleReorderFullOrder(order.id)}
                        disabled={isReordering}
                        className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-highlight text-white px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-md shadow-emerald-700/20 active:scale-98"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isReordering ? 'animate-spin' : ''}`} />
                        <span>{lang === 'ta' ? 'அனைத்தையும் மீண்டும் ஆர்டர் செய்' : 'Reorder Entire Order'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'SET_PAGE', page: 'orders' })}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="View Live Order Tracking"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Items Grid in this Order */}
                  <div className="py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {order.items.map((item) => {
                      const catalogList = state.catalog && state.catalog.length > 0 ? state.catalog : products;
                      const product = catalogList.find((p) => p.id === item.productId) || products.find((p) => p.id === item.productId);
                      if (!product) return null;
                      const variant = product.variants[item.variantIndex] || product.variants[0];

                      return (
                        <div
                          key={`${order.id}-${item.productId}-${item.variantIndex}`}
                          className="bg-slate-50/70 rounded-2xl p-2.5 border border-slate-200/70 flex items-center justify-between gap-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                              <img
                                src={product.image}
                                alt={product.nameEn}
                                width={40}
                                height={40}
                                className="w-full h-full object-contain"
                                loading="lazy"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 break-words">
                                {lang === 'ta' ? product.nameTa : product.nameEn}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                {variant?.label} × {item.quantity}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddSingleItem(item.productId, item.variantIndex)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-brand-primary text-slate-700 hover:text-white border border-slate-200 flex items-center justify-center transition-colors shrink-0 shadow-2xs"
                            title="Add single item to cart"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Footer Totals & Address */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <p className="text-slate-500 break-words flex items-center gap-1.5 flex-1 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="break-words">{order.address}</span>
                    </p>
                    <div className="flex items-center gap-3 font-mono self-end sm:self-auto shrink-0">
                      <span className="text-slate-400">Total:</span>
                      <span className="text-sm font-black text-slate-900">₹{order.total}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
