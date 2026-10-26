'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products } from '@/data/products';
import { supabase } from '@/lib/supabase';
import {
  Package,
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Receipt,
  RotateCcw,
  Sparkles,
  Store,
  ChevronRight,
  ShieldCheck,
  Printer,
  ShoppingBag,
  ExternalLink,
  Info,
  Calendar,
  CreditCard,
  Building2,
  Check,
  Copy,
  AlertCircle,
  X,
  Share2,
  Users,
} from 'lucide-react';

const milestoneKeys = [
  'orderPlaced',
  'acceptedByCounter',
  'packingItems',
  'outForDelivery',
  'delivered',
];

const milestoneTitlesTa = [
  'ஆர்டர் பதிவானது',
  'கவுண்டரில் ஏற்கப்பட்டது',
  'பொருட்கள் பேக் செய்யப்படுகிறது',
  'டெலிவரிக்கு புறப்பட்டது',
  'வெற்றிகரமாக டெலிவரி செய்யப்பட்டது',
];

const milestoneDescriptions = [
  {
    en: 'Your order has been received by Sri Amman Supermarket system.',
    ta: 'உங்கள் ஆர்டர் ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட் சிஸ்டத்தில் பெறப்பட்டது.',
  },
  {
    en: 'Counter supervisor confirmed and verified items in stock.',
    ta: 'கவுண்டர் மேற்பார்வையாளர் பொருட்களை சரிபார்த்து ஏற்றுக்கொண்டார்.',
  },
  {
    en: 'Quality checked, sealed hygienic packing in progress.',
    ta: 'தரம் சரிபார்க்கப்பட்டு சுகாதாரமாக பேக்கிங் செய்யப்படுகிறது.',
  },
  {
    en: 'Assigned to store delivery rider on express route.',
    ta: 'விரைவு வழித்தடத்தில் கடை டெலிவரி ரைடரிடம் ஒப்படைக்கப்பட்டது.',
  },
  {
    en: 'Package safely delivered at your doorstep. Happy cooking!',
    ta: 'பொருட்கள் உங்கள் வீட்டு வாசலில் பாதுகாப்பாக வழங்கப்பட்டது!',
  },
];

const milestoneIcons = [
  CheckCircle2,
  Store,
  Package,
  Bike,
  CheckCircle2,
];

export default function OrdersPage() {
  const { state, dispatch, showToast } = useStore();
  const lang = state.lang;
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const activeOrder = state.orders.find((o) => o.id === selectedOrderId) || state.orders[0];

  if (!activeOrder) {
    return (
      <section className="py-16 md:py-24 bg-[#F8FAF7] min-h-[80vh] flex flex-col items-center justify-center px-4 w-full box-border">
        <div className="w-full max-w-md mx-auto text-center bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl box-border">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#4CB01E] mx-auto mb-5 shadow-xs">
            <Package className="w-10 h-10" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
            {t('noOrdersYet', lang)}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed max-w-sm mx-auto">
            {lang === 'ta'
              ? 'உங்கள் அன்றாட மளிகைப் பொருட்களை உடனடியாக ஆர்டர் செய்து 20 நிமிடத்தில் பெறுங்கள்!'
              : 'Order fresh provisions from Sri Amman Supermarket and get them delivered to your doorstep in 20 minutes!'}
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_PAGE', page: 'products' })}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#4CB01E] hover:bg-[#3D9415] text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-md shadow-emerald-700/20 active:scale-98 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t('shopNow', lang)}</span>
          </button>
        </div>
      </section>
    );
  }

  const handleAdvanceStatus = async () => {
    setStatusUpdating(true);
    const nextStatus = activeOrder.status >= 4 ? 0 : activeOrder.status + 1;
    if (activeOrder.status >= 4) {
      dispatch({
        type: 'LOAD_STATE',
        state: {
          orders: state.orders.map((o) => (o.id === activeOrder.id ? { ...o, status: 0 } : o)),
        },
      });
      showToast(lang === 'ta' ? 'டெமோ மீண்டும் தொடங்கப்பட்டது' : 'Demo status restarted');
    } else {
      dispatch({ type: 'ADVANCE_ORDER', orderId: activeOrder.id });
      showToast(
        lang === 'ta'
          ? `ஆர்டர் நிலை: ${milestoneTitlesTa[nextStatus]}`
          : `Order Status: ${milestoneKeys[nextStatus]}`
      );
    }
    try {
      await supabase.from('orders').update({ status: nextStatus }).eq('id', activeOrder.id);
    } catch {
      // offline / mock fallback
    } finally {
      setTimeout(() => setStatusUpdating(false), 250);
    }
  };

  const handleCopyOrderId = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(activeOrder.id);
      setCopiedId(true);
      showToast(lang === 'ta' ? 'ஆர்டர் எண் நகலெடுக்கப்பட்டது' : 'Order ID copied to clipboard');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const printReceipt = () => {
    const receiptEl = document.getElementById('printable-receipt');
    if (!receiptEl) {
      window.print();
      return;
    }
    const clone = receiptEl.cloneNode(true) as HTMLElement;
    const printBtns = clone.querySelectorAll('.no-print');
    printBtns.forEach((b) => b.remove());

    const printWindow = window.open('', '_blank', 'width=460,height=680');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt - ${activeOrder.id}</title>
          <style>
            @page {
              margin: 8mm auto;
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
              color: #0F172A;
              background: #FFFFFF;
              padding: 12px;
              display: flex;
              justify-content: center;
            }
            .receipt-wrapper {
              width: 320px;
              max-width: 100%;
              border: 1px dashed #64748B;
              padding: 16px;
              border-radius: 6px;
              background: #FFFFFF;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .font-extrabold { font-weight: 800; }
            .border-b { border-bottom: 1px dashed #CBD5E1; }
            .border-t { border-top: 1px dashed #CBD5E1; }
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
            .text-sub { font-size: 10px; color: #64748B; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .items-list { margin: 8px 0; }
            .no-print { display: none !important; }
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
  };

  const orderDate = new Date(activeOrder.timestamp).toLocaleDateString(
    lang === 'ta' ? 'ta-IN' : 'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );

  const orderTime = new Date(activeOrder.timestamp).toLocaleTimeString(
    lang === 'ta' ? 'ta-IN' : 'en-IN',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );  const cleanPhone = (phoneStr: string) => {
    if (!phoneStr) return '';
    const digits = phoneStr.replace(/\D/g, '');
    const tenDigits = digits.length >= 10 ? digits.slice(-10) : digits;
    return tenDigits ? `+91 ${tenDigits}` : phoneStr;
  };

  return (
    <section className="py-6 sm:py-10 md:py-12 bg-[#F8FAF7] min-h-screen text-slate-900 w-full overflow-x-hidden box-border">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 box-border">
        {/* Top Header Card & Demo Switcher */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 box-border">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="tracking-wide">
                  {activeOrder.status >= 4
                    ? lang === 'ta'
                      ? 'டெலிவரி முடிந்தது'
                      : 'Delivered'
                    : lang === 'ta'
                    ? 'நேரடி கண்காணிப்பு'
                    : 'Live Tracking'}
                </span>
              </span>
              <button
                type="button"
                onClick={handleCopyOrderId}
                className="group inline-flex items-center gap-1 text-xs font-mono font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                title="Click to copy Order ID"
              >
                <span>{activeOrder.id}</span>
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                )}
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('trackOrder', lang)}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {orderDate} at {orderTime}
              </span>
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                {activeOrder.paymentMethod.toUpperCase()}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* View Receipt Trigger on Mobile */}
            <button
              type="button"
              onClick={() => setReceiptModalOpen(true)}
              className="lg:hidden inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs transition-all border border-slate-200 shadow-2xs active:scale-98"
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ta' ? 'பில் ரசீது' : 'View Bill'}</span>
            </button>

            {/* Advance Status Demo Tool */}
            <button
              type="button"
              onClick={handleAdvanceStatus}
              disabled={statusUpdating}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 px-4 py-2.5 rounded-xl font-black text-xs shadow-md shadow-amber-500/20 transition-all border border-amber-600/20 active:scale-98"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${statusUpdating ? 'animate-spin' : ''}`} />
              <span>
                {activeOrder.status >= 4 ? t('restartDemo', lang) : t('demoAdvance', lang)}
              </span>
            </button>
          </div>
        </div>

        {/* Prominent WhatsApp Share Action Banner for "Ordering for Someone Else" */}
        {activeOrder.isForSomeoneElse && activeOrder.recipientPhone && (
          <div className="mb-6 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-3xl p-4 sm:p-5 text-white shadow-lg shadow-emerald-700/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border border-emerald-500/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white">
                <Share2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-sm sm:text-base leading-tight">
                  {lang === 'ta'
                    ? `${activeOrder.recipientName}-க்கு ஆர்டர் செய்துள்ளீர்கள்`
                    : `Ordering for ${activeOrder.recipientName}`}
                </p>
                <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                  {lang === 'ta'
                    ? `டெலிவரி தொடர்பு: +91 ${activeOrder.recipientPhone.replace(/\D/g, '').slice(-10)} • நேரடி டிராக்கிங் விவரத்தைப் பகிருங்கள்`
                    : `Doorstep contact: +91 ${activeOrder.recipientPhone.replace(/\D/g, '').slice(-10)} • Keep them updated with 1-click live tracking`}
                </p>
              </div>
            </div>

            <a
              href={`https://wa.me/91${activeOrder.recipientPhone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                `Hi ${activeOrder.recipientName || 'there'}, I've ordered groceries for you from Sri Amman Supermarket (Order ${activeOrder.id} • ${activeOrder.paymentMethod === 'upi' ? 'Already Paid Online' : 'Cash on Delivery: ₹' + activeOrder.total}). It will arrive shortly at your doorstep!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-900 font-black text-xs sm:text-sm px-5 py-3 rounded-2xl transition-all shadow-md active:scale-98 shrink-0"
            >
              <Share2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {lang === 'ta'
                  ? `${activeOrder.recipientName}-க்கு வாட்ஸ்அப்பில் ஆர்டர் விவரத்தை அனுப்பு`
                  : `Share Order Details on WhatsApp with ${activeOrder.recipientName}`}
              </span>
            </a>
          </div>
        )}

        {/* Multi-Order Tabs */}
        {state.orders.length > 1 && (
          <div className="mb-6">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 px-1">
              {lang === 'ta' ? 'உங்கள் ஆர்டர்கள்' : 'Your Recent Orders'} ({state.orders.length})
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-2 hide-scrollbar edge-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
              {state.orders.map((o) => {
                const isSelected = activeOrder.id === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelectedOrderId(o.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2.5 shadow-2xs shrink-0 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#4CB01E] to-[#60B328] text-white border-[#4CB01E] shadow-md shadow-[#4CB01E]/25 ring-2 ring-[#76CA3E]/50'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-mono">{o.id}</span>
                    <span className="opacity-40">&bull;</span>
                    <span className="font-extrabold text-[#76CA3E]">₹{o.total}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        o.status >= 4
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-400/20 text-amber-300'
                      }`}
                    >
                      {o.status >= 4
                        ? lang === 'ta'
                          ? 'முடிந்தது'
                          : 'Delivered'
                        : `Step ${o.status + 1}/5`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full box-border">
          {/* Left Column (Hero Status Banner, Stepper Timeline, Delivery Partner, Map Pin Details) */}
          <div className="lg:col-span-7 space-y-6 w-full min-w-0 box-border">
            {/* Live Status Hero Banner (Rich Dark Forest & Emerald Gradient for Crystal-Clear Readability) */}
            <div className="bg-gradient-to-br from-[#0D2608] via-[#143B0D] to-[#1E4D12] rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-emerald-950/25 relative overflow-hidden border border-emerald-700/40 box-border">
              {/* Subtle ambient light glow */}
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-52 h-52 bg-[#76CA3E]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase mb-3 border border-white/20 text-emerald-100 shadow-2xs">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    <span>
                      {activeOrder.status >= 4
                        ? lang === 'ta'
                          ? 'டெலிவரி நிறைவடைந்தது'
                          : 'Order Completed'
                        : lang === 'ta'
                        ? 'நேரடி கண்காணிப்பு'
                        : 'Live Status'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-2 break-words drop-shadow-sm">
                    {activeOrder.status >= 4
                      ? lang === 'ta'
                        ? 'பொருட்கள் வழங்கப்பட்டது!'
                        : 'Order Delivered!'
                      : t('orderConfirmed', lang)}
                  </h2>
                  <p className="text-emerald-100/95 text-xs sm:text-sm font-semibold leading-relaxed">
                    {activeOrder.status >= 4
                      ? lang === 'ta'
                        ? 'ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட்டில் வாங்கியதற்கு நன்றி!'
                        : 'Thank you for shopping with Sri Amman Supermarket!'
                      : t('reachingDoorstep', lang)}
                  </p>
                </div>

                <div className="bg-black/25 backdrop-blur-md rounded-2xl p-4 sm:p-4.5 border border-white/20 text-center sm:text-right shrink-0 shadow-inner flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2.5">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] sm:text-[11px] text-emerald-200/90 font-extrabold uppercase tracking-wider">
                      {lang === 'ta' ? 'எதிர்பார்க்கப்படும் நேரம்' : 'Estimated Arrival'}
                    </p>
                    <p className="text-2xl sm:text-3xl font-black text-amber-300 leading-tight drop-shadow-xs">
                      {activeOrder.status >= 4 ? (
                        <span className="text-emerald-300">0 Mins</span>
                      ) : (
                        `~${state.location.deliveryMins || 20} Mins`
                      )}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-white/15 px-3 py-1 rounded-lg border border-white/20">
                    <Clock className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                    <span>3 km Express</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 pt-5 border-t border-white/15">
                <div className="flex justify-between text-[11px] font-black text-emerald-100 mb-2">
                  <span>{lang === 'ta' ? 'டெலிவரி முன்னேற்றம்' : 'Delivery Progress'}</span>
                  <span className="font-mono text-amber-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/15">
                    {Math.round(((activeOrder.status + 1) / 5) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="bg-gradient-to-r from-amber-400 via-[#76CA3E] to-[#4CB01E] h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.min(100, Math.round(((activeOrder.status + 1) / 5) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stepper Timeline Box */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 w-full box-border">
              <div className="flex items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100">
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight leading-tight break-words">
                    {lang === 'ta' ? 'நேரடி ஆர்டர் நிலை' : 'Live Milestone Tracking'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium break-words">
                    {lang === 'ta' ? 'நிகழ்நேர நிலை கண்காணிப்பு' : 'Real-time order stages from store counter to doorstep'}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl whitespace-nowrap shrink-0 border border-slate-200/80">
                  Stage {activeOrder.status + 1} of 5
                </span>
              </div>

              <div className="space-y-0 relative">
                {milestoneKeys.map((key, i) => {
                  const isCompleted = activeOrder.status > i;
                  const isActive = activeOrder.status === i;
                  const isPending = activeOrder.status < i;
                  const MilestoneIcon = milestoneIcons[i];
                  const desc = milestoneDescriptions[i];

                  return (
                    <div key={key} className="flex items-start gap-4 sm:gap-5 group">
                      {/* Step Indicator Node */}
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-300 ${
                            isCompleted
                              ? 'bg-[#4CB01E] text-white shadow-md shadow-[#4CB01E]/25'
                              : isActive
                              ? 'bg-[#4CB01E] text-white ring-4 ring-[#76CA3E]/30 scale-105 shadow-lg shadow-[#4CB01E]/30'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <MilestoneIcon className={`w-5 h-5 ${isActive ? 'text-white animate-bounce' : 'text-slate-400'}`} />
                          )}
                        </div>

                        {/* Connecting Line */}
                        {i < milestoneKeys.length - 1 && (
                          <div
                            className={`w-0.5 h-12 sm:h-14 transition-colors duration-300 my-1 ${
                              activeOrder.status > i ? 'bg-[#4CB01E]' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>

                      {/* Step Text Info */}
                      <div className="flex-1 min-w-0 pt-1 pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <p
                            className={`text-sm sm:text-base font-black leading-tight ${
                              isActive
                                ? 'text-emerald-900 font-black'
                                : isCompleted
                                ? 'text-slate-900'
                                : 'text-slate-400'
                            }`}
                          >
                            {lang === 'ta' ? milestoneTitlesTa[i] : t(key, lang)}
                          </p>

                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                              <span>{lang === 'ta' ? 'நடப்பில் உள்ளது' : 'In Progress'}</span>
                            </span>
                          )}

                          {isCompleted && (
                            <span className="text-[11px] font-bold text-slate-400">
                              {lang === 'ta' ? 'முடிந்தது' : 'Done'}
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-xs sm:text-sm leading-relaxed ${
                            isActive
                              ? 'text-slate-600 font-medium'
                              : isCompleted
                              ? 'text-slate-500'
                              : 'text-slate-400'
                          }`}
                        >
                          {lang === 'ta' ? desc.ta : desc.en}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Partner & Madurai Local Support Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5 w-full box-border">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-400 break-words flex-1">
                  {lang === 'ta' ? 'டெலிவரி விவரங்கள்' : 'Delivery Partner & Vehicle'}
                </h4>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 whitespace-nowrap shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{lang === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Store Verified'}</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#4CB01E] flex items-center justify-center shrink-0 shadow-xs">
                    <Bike className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-base text-slate-900 leading-tight break-words">
                      {t('deliveryBoy', lang)}
                    </h5>
                    <p className="text-xs text-slate-500 font-medium mt-1 break-words">
                      {t('riderVehicle', lang)}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      {lang === 'ta' ? 'மதுரை விரைவு டெலிவரி குழு' : 'Madurai Express Delivery Fleet'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <a
                    href="tel:+919876543210"
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#4CB01E] hover:bg-[#3D9415] text-white px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-md shadow-emerald-700/20 active:scale-98"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{t('callStore', lang)}</span>
                  </a>
                </div>
              </div>

              {/* Delivery Destination Address Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{lang === 'ta' ? 'டெலிவரி முகவரி' : 'Delivery Address'}</span>
                  </div>
                  {activeOrder.isForSomeoneElse && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                      <Users className="w-3 h-3 text-amber-700" />
                      <span>{lang === 'ta' ? 'மற்றொருவருக்கு' : 'For Someone Else'}</span>
                    </span>
                  )}
                </div>
                <p className="text-slate-600 font-medium leading-relaxed pl-5 break-words">
                  {activeOrder.address}
                </p>
                {activeOrder.isForSomeoneElse && (
                  <p className="text-emerald-800 font-bold pl-5 text-[11px]">
                    {lang === 'ta' ? 'பெறுபவர்' : 'Deliver To'}: {activeOrder.recipientName} ({cleanPhone(activeOrder.recipientPhone || '')})
                  </p>
                )}
                <p className="text-slate-500 pl-5 font-mono text-[11px]">
                  {activeOrder.isForSomeoneElse
                    ? `${lang === 'ta' ? 'ஆர்டர் செய்தவர்' : 'Ordered by'}: ${cleanPhone(activeOrder.phone)}`
                    : `Phone: ${cleanPhone(activeOrder.phone)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (Itemized Thermal Bill Receipt & Order Summary) */}
          <div className="lg:col-span-5 w-full min-w-0 box-border lg:sticky lg:top-28">
            <div
              id="printable-receipt"
              className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-xl p-5 sm:p-7 relative font-mono text-xs text-slate-800 w-full box-border"
            >
              {/* Receipt Top Header */}
              <div className="text-center pb-5 border-b border-dashed border-slate-300 space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4CB01E] to-[#60B328] flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-[#4CB01E]/25 border border-white/20">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-black text-lg text-slate-900 tracking-tight font-sans">
                  {t('brandName', lang)}
                </h3>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed max-w-xs mx-auto">
                  {t('footerAddress', lang)}
                </p>
                <div className="pt-1 text-[10px] text-slate-400 space-y-0.5">
                  <p>FSSAI Lic: 12423001000456 &bull; GSTIN: 33AAAAA0000A1Z5</p>
                  <p className="font-bold text-slate-700">
                    {activeOrder.id} &bull; {orderDate}
                  </p>
                  {activeOrder.isForSomeoneElse && (
                    <p className="text-emerald-700 font-bold">
                      DELIVER TO: {activeOrder.recipientName} (Ph: +91 {activeOrder.recipientPhone})
                    </p>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="py-4 border-b border-dashed border-slate-300 space-y-3">
                <div className="flex justify-between font-extrabold text-[11px] uppercase tracking-wider text-slate-400 pb-1 font-sans">
                  <span>{lang === 'ta' ? 'பொருள்' : 'Item'}</span>
                  <span>{lang === 'ta' ? 'தொகை' : 'Amount'}</span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 hide-scrollbar">
                  {activeOrder.items.map((item) => {
                    const catalogList = state.catalog && state.catalog.length > 0 ? state.catalog : products;
                    const product = catalogList.find((p) => p.id === item.productId) || products.find((p) => p.id === item.productId);
                    if (!product) return null;
                    const variant = product.variants[item.variantIndex] || product.variants[0];
                    if (!variant) return null;

                    return (
                      <div
                        key={`${item.productId}-${item.variantIndex}`}
                        className="flex justify-between items-start text-xs gap-3 font-sans"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 leading-snug break-words">
                            {lang === 'ta' ? product.nameTa : product.nameEn}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {variant.label} × {item.quantity} @ ₹{variant.price}
                          </p>
                        </div>
                        <span className="font-extrabold text-slate-900 shrink-0 font-mono">
                          ₹{variant.price * item.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bill Totals Summary */}
              <div className="py-4 border-b border-dashed border-slate-300 space-y-2 text-xs font-sans">
                <div className="flex justify-between text-slate-600">
                  <span>{t('itemTotal', lang)}</span>
                  <span className="font-mono font-semibold">₹{activeOrder.subtotal}</span>
                </div>
                {activeOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>{t('productDiscount', lang)}</span>
                    <span className="font-mono">-₹{activeOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>{t('deliveryFee', lang)}</span>
                  <span className="font-mono font-semibold">
                    {activeOrder.deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase">{t('free', lang)}</span>
                    ) : (
                      `₹${activeOrder.deliveryFee}`
                    )}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2.5 flex justify-between font-black text-base text-slate-900">
                  <span>{t('grandTotal', lang)}</span>
                  <span className="font-mono text-emerald-700">₹{activeOrder.total}</span>
                </div>
              </div>

              {/* Delivery Details In Receipt */}
              <div className="py-3 text-[11px] font-sans space-y-1 text-slate-600 border-b border-dashed border-slate-300">
                <p className="font-bold text-slate-900">{lang === 'ta' ? 'டெலிவரி முகவரி:' : 'Delivery Address:'}</p>
                <p className="leading-snug break-words">{activeOrder.address}</p>
                <p className="text-[10px] text-slate-400 font-mono">Customer Phone: {cleanPhone(activeOrder.phone)}</p>
              </div>

              {/* Thank You Note */}
              <div className="pt-3 text-center text-[11px] text-slate-500 font-sans leading-relaxed">
                {t('thankYouMessage', lang)}
              </div>

              {/* Action Buttons in Receipt */}
              <div className="no-print pt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={printReceipt}
                  className="w-full bg-[#4CB01E] hover:bg-[#3D9415] text-white py-3 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-[#4CB01E]/25 active:scale-98 font-sans"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>{lang === 'ta' ? 'ரசீதை பிரிண்ட் செய்' : 'Print Thermal Receipt'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Modal for Thermal Bill Receipt */}
      {receiptModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in text-slate-900 box-border lg:hidden"
          onClick={() => setReceiptModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 max-h-[90vh] flex flex-col box-border overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">
                  {lang === 'ta' ? 'பில் ரசீது' : 'Order Receipt'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close receipt"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 font-mono text-xs">
              <div className="text-center pb-3 border-b border-dashed border-slate-200 space-y-1">
                <p className="font-black text-base text-slate-900 font-sans">{t('brandName', lang)}</p>
                <p className="text-[10px] text-slate-500 font-sans">{t('footerAddress', lang)}</p>
                <p className="text-[10px] text-slate-400 font-bold">{activeOrder.id} &bull; {orderDate}</p>
              </div>

              {/* Items */}
              <div className="space-y-2 py-2 border-b border-dashed border-slate-200">
                {activeOrder.items.map((item) => {
                  const catalogList = state.catalog && state.catalog.length > 0 ? state.catalog : products;
                  const product = catalogList.find((p) => p.id === item.productId) || products.find((p) => p.id === item.productId);
                  if (!product) return null;
                  const variant = product.variants[item.variantIndex] || product.variants[0];
                  return (
                    <div key={`${item.productId}-${item.variantIndex}`} className="flex justify-between text-xs font-sans">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-slate-800 break-words">
                          {lang === 'ta' ? product.nameTa : product.nameEn}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {variant.label} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold font-mono">₹{variant.price * item.quantity}</span>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="space-y-1.5 pt-1 font-sans text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{t('itemTotal', lang)}</span>
                  <span className="font-mono">₹{activeOrder.subtotal}</span>
                </div>
                {activeOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>{t('productDiscount', lang)}</span>
                    <span className="font-mono">-₹{activeOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>{t('deliveryFee', lang)}</span>
                  <span className="font-mono font-bold">
                    {activeOrder.deliveryFee === 0 ? t('free', lang) : `₹${activeOrder.deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                  <span>{t('grandTotal', lang)}</span>
                  <span className="font-mono text-emerald-700">₹{activeOrder.total}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={printReceipt}
                className="flex-1 bg-[#4CB01E] hover:bg-[#3D9415] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-[#4CB01E]/20 active:scale-98"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>{lang === 'ta' ? 'பிரிண்ட் செய்' : 'Print Receipt'}</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 active:scale-98"
              >
                {lang === 'ta' ? 'மூடு' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
