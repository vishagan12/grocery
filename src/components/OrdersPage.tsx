'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products } from '@/data/products';
import { supabase } from '@/lib/supabase';
import {
  IconCheckCircle,
  IconPackage,
  IconMotorcycle,
  IconPhone,
  IconReceipt,
  IconRefresh,
  IconMapPin,
  IconShield,
} from '@/components/Icons';

const milestoneKeys = [
  'orderPlaced',
  'acceptedByCounter',
  'packingItems',
  'outForDelivery',
  'delivered',
];

const milestoneIcons = [
  IconCheckCircle,
  IconCheckCircle,
  IconPackage,
  IconMotorcycle,
  IconCheckCircle,
];

export default function OrdersPage() {
  const { state, dispatch } = useStore();
  const lang = state.lang;
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const activeOrder = state.orders.find((o) => o.id === selectedOrderId) || state.orders[0];

  if (!activeOrder) {
    return (
      <section className="py-20 text-center min-h-screen bg-[#FBF8F3] flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-[#F5EFE6] border border-[#EAE2D5] flex items-center justify-center text-brand-primary mb-4 shadow-xs">
          <IconPackage className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-brand-slate mb-1">{t('noOrdersYet', lang)}</h2>
        <p className="text-sm text-brand-slate/60 mb-5 max-w-sm">
          {lang === 'ta'
            ? 'உங்கள் அன்றாட மளிகைப் பொருட்களை உடனடியாக ஆர்டர் செய்து 20 நிமிடத்தில் பெறுங்கள்!'
            : 'Order fresh provisions from our store and get them delivered to your doorstep in 20 minutes!'}
        </p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_PAGE', page: 'products' })}
          className="bg-brand-primary hover:bg-brand-highlight text-white px-8 py-3.5 rounded-xl font-bold touch-target shadow-md transition-all text-sm"
        >
          {t('shopNow', lang)}
        </button>
      </section>
    );
  }

  const handleAdvanceStatus = async () => {
    const nextStatus = activeOrder.status >= 4 ? 0 : activeOrder.status + 1;
    if (activeOrder.status >= 4) {
      dispatch({
        type: 'LOAD_STATE',
        state: {
          orders: state.orders.map((o) => (o.id === activeOrder.id ? { ...o, status: 0 } : o)),
        },
      });
    } else {
      dispatch({ type: 'ADVANCE_ORDER', orderId: activeOrder.id });
    }
    try {
      await supabase.from('orders').update({ status: nextStatus }).eq('id', activeOrder.id);
    } catch {
      // offline / mock fallback
    }
  };

  return (
    <section className="py-8 md:py-12 bg-[#FBF8F3] min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Header & Demo Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-slate tracking-tight">
              {t('trackOrder', lang)}
            </h1>
            <p className="text-xs md:text-sm text-brand-slate/60 mt-0.5">
              {activeOrder.id} &bull; {new Date(activeOrder.timestamp).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdvanceStatus}
              className="bg-amber-400 hover:bg-amber-500 text-brand-deep px-4 py-2 rounded-xl font-black text-xs shadow-md transition-all touch-target flex items-center gap-1.5 border border-amber-500/20"
            >
              <IconRefresh className="w-3.5 h-3.5" />
              <span>
                {activeOrder.status >= 4 ? t('restartDemo', lang) : t('demoAdvance', lang)}
              </span>
            </button>
          </div>
        </div>

        {/* Multi-Order Switcher Tabs if multiple orders (Seamless Edge-to-Edge) */}
        {state.orders.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 hide-scrollbar -mx-4 px-4 edge-scroll">
            {state.orders.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelectedOrderId(o.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${
                  activeOrder.id === o.id
                    ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                    : 'bg-white text-brand-slate border-[#EAE2D5] hover:border-brand-primary/40'
                }`}
              >
                <span>{o.id}</span>
                <span className="opacity-70">&bull;</span>
                <span>₹{o.total}</span>
              </button>
            ))}
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Milestone Stepper & Delivery Rider) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Status Hero Banner */}
            <div className="bg-gradient-to-r from-brand-deep to-brand-primary rounded-3xl p-6 text-white shadow-xl text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-md mb-2 inline-block">
                  {activeOrder.id}
                </span>
                <h2 className="text-xl md:text-2xl font-black mb-1">
                  {t('orderConfirmed', lang)}
                </h2>
                <p className="text-emerald-100 text-xs md:text-sm">
                  {t('reachingDoorstep', lang)}
                </p>
              </div>
              <div className="bg-white/10 rounded-2xl p-3 border border-white/15 text-center shrink-0">
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                  {lang === 'ta' ? 'எதிர்பார்க்கப்படும் நேரம்' : 'Estimated Arrival'}
                </p>
                <p className="text-xl font-black text-amber-300">~{state.location.deliveryMins || 20} Mins</p>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE2D5] shadow-sm p-6">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-brand-slate/70 mb-5 pb-2 border-b border-[#EAE2D5]">
                {lang === 'ta' ? 'நேரடி ஆர்டர் நிலை' : 'Live Milestone Tracking'}
              </h3>

              <div className="space-y-0">
                {milestoneKeys.map((key, i) => {
                  const isCompleted = activeOrder.status >= i;
                  const isActive = activeOrder.status === i;
                  const MilestoneIcon = milestoneIcons[i];

                  return (
                    <div key={key} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                            isCompleted
                              ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                              : 'bg-[#F5EFE6] text-brand-slate/50 border border-[#EAE2D5]'
                          } ${isActive ? 'ring-4 ring-brand-primary/20 scale-110' : ''}`}
                        >
                          {isCompleted ? <MilestoneIcon className="w-4 h-4" /> : i + 1}
                        </div>
                        {i < milestoneKeys.length - 1 && (
                          <div
                            className={`w-0.5 h-7 transition-all ${
                              activeOrder.status > i ? 'bg-brand-primary' : 'bg-[#EAE2D5]'
                            }`}
                          />
                        )}
                      </div>
                      <div className={`pt-1.5 pb-3 ${isActive ? 'text-brand-primary font-bold' : isCompleted ? 'text-brand-slate' : 'text-brand-slate/40'}`}>
                        <p className={`text-sm ${isActive || isCompleted ? 'font-bold' : 'font-medium'}`}>
                          {t(key, lang)}
                        </p>
                        {isActive && (
                          <p className="text-xs text-brand-primary font-semibold animate-pulse mt-0.5">
                            {lang === 'ta' ? 'செயல்பாட்டில் உள்ளது...' : 'In progress right now...'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Partner Card */}
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE2D5] shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-mint text-brand-primary flex items-center justify-center shrink-0 border border-brand-primary/20">
                  <IconMotorcycle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm text-brand-slate break-words leading-tight">
                    {t('deliveryBoy', lang)}
                  </h4>
                  <p className="text-xs text-brand-slate/60 mt-0.5 break-words">
                    {t('riderVehicle', lang)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-[#F5EFE6]">
                <a
                  href="tel:+919876543210"
                  className="flex-1 bg-brand-primary hover:bg-brand-highlight text-white py-2.5 rounded-xl font-bold text-xs text-center transition-all touch-target flex items-center justify-center gap-2 shadow-sm"
                >
                  <IconPhone className="w-3.5 h-3.5" />
                  <span>{t('callStore', lang)}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column (Itemized Printable Thermal Bill Receipt) */}
          <div className="lg:col-span-5 sticky top-36">
            <div id="printable-receipt" className="bg-[#FFFFFF] rounded-2xl border-2 border-[#EAE2D5] shadow-xl p-6 relative font-mono text-xs text-brand-slate">
              {/* Receipt Header */}
              <div className="text-center pb-4 border-b border-dashed border-[#D1C7B7] space-y-1">
                <div className="w-9 h-9 rounded-xl bg-brand-primary flex items-center justify-center text-white mx-auto mb-2 shadow-xs">
                  <IconReceipt className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-extrabold text-base text-brand-deep tracking-tight">
                  {t('brandName', lang)}
                </h3>
                <p className="text-[11px] text-brand-slate/60 font-sans">
                  {t('footerAddress', lang)}
                </p>
                <p className="text-[10px] text-brand-slate/50">
                  FSSAI Lic: 12423001000456 &bull; GSTIN: 33AAAAA0000A1Z5
                </p>
                <p className="text-xs font-bold text-brand-slate pt-1">
                  {activeOrder.id} &bull; {new Date(activeOrder.timestamp).toLocaleDateString()}
                </p>
              </div>

              {/* Items List */}
              <div className="py-4 border-b border-dashed border-[#D1C7B7] space-y-2">
                <div className="flex justify-between font-bold text-[11px] text-brand-slate/60 pb-1">
                  <span>{lang === 'ta' ? 'பொருள்' : 'Item'}</span>
                  <span>{lang === 'ta' ? 'தொகை' : 'Amount'}</span>
                </div>
                {activeOrder.items.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (!product) return null;
                  const variant = product.variants[item.variantIndex];
                  if (!variant) return null;

                  return (
                    <div
                      key={`${item.productId}-${item.variantIndex}`}
                      className="flex justify-between items-start text-xs gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-brand-slate break-words leading-tight">
                          {lang === 'ta' ? product.nameTa : product.nameEn}
                        </p>
                        <p className="text-[10px] text-brand-slate/60 mt-0.5 break-words">
                          {variant.label} × {item.quantity} @ ₹{variant.price}
                        </p>
                      </div>
                      <span className="font-bold shrink-0">
                        ₹{variant.price * item.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Bill Totals */}
              <div className="py-3 border-b border-dashed border-[#D1C7B7] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-brand-slate/70">{t('itemTotal', lang)}</span>
                  <span>₹{activeOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-brand-primary font-bold">
                  <span>{t('productDiscount', lang)}</span>
                  <span>-₹{activeOrder.discount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-slate/70">{t('deliveryFee', lang)}</span>
                  <span>{activeOrder.deliveryFee === 0 ? t('free', lang) : `₹${activeOrder.deliveryFee}`}</span>
                </div>
                <div className="border-t border-[#EAE2D5] pt-2 flex justify-between font-black text-sm text-brand-slate">
                  <span>{t('grandTotal', lang)}</span>
                  <span>₹{activeOrder.total}</span>
                </div>
              </div>

              {/* Delivery Address Summary */}
              <div className="py-3 text-[11px] font-sans space-y-1 text-brand-slate/70">
                <p className="font-bold text-brand-slate">{lang === 'ta' ? 'டெலிவரி முகவரி:' : 'Delivery Address:'}</p>
                <p className="leading-snug">{activeOrder.address}</p>
                <p className="text-[10px] text-brand-slate/50">Phone: +91 {activeOrder.phone}</p>
              </div>

              <div className="pt-2 text-center text-[10px] text-brand-slate/50 font-sans border-t border-dashed border-[#D1C7B7]">
                {t('thankYouMessage', lang)}
              </div>

              {/* Print Receipt Button */}
              <button
                type="button"
                onClick={() => {
                  const receiptEl = document.getElementById('printable-receipt');
                  if (!receiptEl) {
                    window.print();
                    return;
                  }
                  // Clone receipt and remove print button from clone
                  const clone = receiptEl.cloneNode(true) as HTMLElement;
                  const printBtn = clone.querySelector('.print-receipt-btn');
                  if (printBtn) printBtn.remove();

                  const printWindow = window.open('', '_blank', 'width=450,height=650');
                  if (!printWindow) {
                    window.print();
                    return;
                  }

                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Receipt - ${activeOrder.id}</title>
                        <style>
                          @page {
                            margin: 10mm auto;
                            size: portrait;
                          }
                          * {
                            box-sizing: border-box;
                            margin: 0;
                            padding: 0;
                          }
                          body {
                            font-family: monospace, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            font-size: 11px;
                            color: #000;
                            background: #fff;
                            padding: 10px;
                            display: flex;
                            justify-content: center;
                          }
                          .receipt-wrapper {
                            width: 320px;
                            max-width: 100%;
                            border: 1px dashed #666;
                            padding: 16px;
                            border-radius: 4px;
                          }
                          .text-center { text-align: center; }
                          .text-right { text-align: right; }
                          .font-bold { font-weight: bold; }
                          .font-extrabold { font-weight: 800; }
                          .border-b { border-bottom: 1px dashed #999; }
                          .border-t { border-top: 1px dashed #999; }
                          .py-1 { padding-top: 4px; padding-bottom: 4px; }
                          .py-2 { padding-top: 8px; padding-bottom: 8px; }
                          .py-3 { padding-top: 12px; padding-bottom: 12px; }
                          .pb-3 { padding-bottom: 12px; }
                          .pt-2 { padding-top: 8px; }
                          .flex { display: flex; }
                          .justify-between { justify-content: space-between; }
                          .items-start { align-items: flex-start; }
                          .gap-2 { gap: 8px; }
                          .text-xs { font-size: 11px; }
                          .text-sm { font-size: 13px; }
                          .text-base { font-size: 15px; }
                          .text-sub { font-size: 10px; color: #444; }
                          .space-y-1 > * + * { margin-top: 4px; }
                          .space-y-2 > * + * { margin-top: 8px; }
                          .items-list { margin: 8px 0; }
                          .items-list > div { margin-bottom: 6px; }
                        </style>
                      </head>
                      <body>
                        <div class="receipt-wrapper">
                          ${clone.innerHTML}
                        </div>
                        <script>
                          window.onload = function() {
                            window.focus();
                            window.print();
                            window.onafterprint = function() {
                              window.close();
                            };
                          };
                        </script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }}
                className="print-receipt-btn mt-4 w-full bg-[#F5EFE6] hover:bg-[#EAE2D5] text-brand-slate py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border border-[#EAE2D5] font-sans"
              >
                <IconReceipt className="w-3.5 h-3.5 text-brand-primary" />
                <span>{lang === 'ta' ? 'ரசீதை பிரிண்ட் செய்' : 'Print Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
