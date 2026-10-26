'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Navigation,
  Phone,
  MessageSquare,
  CheckCircle,
  Clock,
  MapPin,
  QrCode,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  DollarSign,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface RiderOrderItem {
  id: string;
  productId: string;
  nameEn: string;
  nameTa: string;
  variantLabel: string;
  price: number;
  quantity: number;
}

interface RiderOrder {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: number; // 0, 1: Ready at counter, 2: Out for delivery, 3: Delivered
  createdAt: string;
  isForSomeoneElse?: boolean;
  recipientName?: string;
  recipientPhone?: string;
  items: RiderOrderItem[];
}

interface ReadyOrderSummary {
  id: string;
  customerName: string;
  address: string;
  distanceKm: number;
  total: number;
  paymentMethod: string;
  status: number;
}

export default function RiderPage() {
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '']);
  const [activeOrder, setActiveOrder] = useState<RiderOrder | null>(null);
  const [readyOrders, setReadyOrders] = useState<ReadyOrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Payment Cash/QR selection state
  const [cashCollected, setCashCollected] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Delivery Completed Splash State
  const [deliveryCelebration, setDeliveryCelebration] = useState(false);

  // Refs for 4 PIN boxes
  const digitRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Fetch recent ready orders for quick select
  const loadReadyOrders = async () => {
    try {
      const res = await fetch('/api/rider');
      if (res.ok) {
        const data = await res.json();
        setReadyOrders(data.orders || []);
      }
    } catch (e) {
      console.warn('Error loading ready orders:', e);
    }
  };

  useEffect(() => {
    loadReadyOrders();

    // Check URL parameters for direct QR scan lookup (e.g. /rider?id=4821 or /rider?code=4821)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('id') || params.get('code');
      if (urlCode) {
        fetchOrderDetails(urlCode);
      }
    }
  }, []);

  // Realtime Supabase Subscription for order status updates
  useEffect(() => {
    const channel = supabase
      .channel('rider_realtime_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadReadyOrders();
          if (activeOrder) {
            fetchOrderDetails(activeOrder.id, false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeOrder]);

  // Lookup order by digits or code
  const fetchOrderDetails = async (queryCode: string, showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/rider?code=${encodeURIComponent(queryCode)}`);
      if (res.ok) {
        const data = await res.json();
        setActiveOrder(data.order);
        setCashCollected(data.order.paymentStatus === 'paid');

        // Set digits in keypad if 4-digit numeric code
        const numOnly = data.order.id.replace(/\D/g, '').slice(-4);
        if (numOnly.length === 4) {
          setCodeDigits(numOnly.split(''));
        }
      } else {
        const err = await res.json().catch(() => null);
        setErrorMsg(err?.error || (lang === 'ta' ? 'ஆர்டர் கிடைக்கவில்லை' : 'Order not found'));
      }
    } catch {
      setErrorMsg(lang === 'ta' ? 'நெட்வொர்க் பிழை' : 'Network error fetching order');
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const char = val.slice(-1);
    const next = [...codeDigits];
    next[index] = char;
    setCodeDigits(next);

    // Auto-focus next input
    if (char && index < 3) {
      digitRefs[index + 1].current?.focus();
    }

    // Auto-fetch when all 4 digits entered
    if (char && index === 3 && next.every((d) => d !== '')) {
      fetchOrderDetails(next.join(''));
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      digitRefs[index - 1].current?.focus();
    }
  };

  // Stage 1: Confirm Pickup & Start Ride
  const handleStartRide = async () => {
    if (!activeOrder) return;
    try {
      const res = await fetch('/api/rider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          status: 2,
        }),
      });

      if (res.ok) {
        setActiveOrder((prev) => (prev ? { ...prev, status: 2 } : null));
      }
    } catch (err) {
      console.warn('Start ride error:', err);
    }
  };

  // Stage 2: Mark Order Delivered
  const handleMarkDelivered = async () => {
    if (!activeOrder) return;
    try {
      const res = await fetch('/api/rider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.id,
          status: 3,
          paymentCollectedMethod: cashCollected ? 'cash' : 'upi',
        }),
      });

      if (res.ok) {
        setDeliveryCelebration(true);
        setActiveOrder((prev) => (prev ? { ...prev, status: 3, paymentStatus: 'paid' } : null));
        loadReadyOrders();
      }
    } catch (err) {
      console.warn('Mark delivered error:', err);
    }
  };

  const handleResetForNextOrder = () => {
    setDeliveryCelebration(false);
    setActiveOrder(null);
    setCodeDigits(['', '', '', '']);
    setCashCollected(false);
    loadReadyOrders();
  };

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] min-h-screen flex flex-col font-sans antialiased max-w-md mx-auto shadow-2xl relative pb-40">
      {/* Mobile Top Header */}
      <header className="fixed top-0 max-w-md w-full z-50 bg-[#047857] text-white shadow-md">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeOrder) setActiveOrder(null);
                else if (typeof window !== 'undefined') window.history.back();
              }}
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-[#005d42] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-sm tracking-tight leading-tight">
                {lang === 'ta' ? 'விநியோக தளம்' : 'Active Delivery Run'}
              </h1>
              <span className="text-[11px] text-[#9ffdd3]">
                {lang === 'ta' ? 'ஸ்ரீ அம்மன் டெலிவரி' : 'Sri Amman Partner'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
              className="h-8 px-2.5 rounded-lg bg-[#005d42] hover:bg-[#00513a] text-white font-mono text-xs font-bold transition-colors"
            >
              {lang === 'en' ? 'EN / தமிழ்' : 'தமிழ் / EN'}
            </button>
            <div className="w-8 h-8 rounded-full bg-[#005d42] flex items-center justify-center">
              <Truck className="w-4 h-4 text-[#97f5cc]" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 px-4 flex-1 space-y-4">
        {/* Rider Ambient Bar */}
        <div className="w-full bg-[#dae2fd] px-3 py-2 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#047857] animate-pulse"></span>
            <span className="font-bold text-slate-800">
              Rider Fleet • Madurai 3km Zone
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#005d42] bg-white px-2 py-0.5 rounded-full">
            {lang === 'ta' ? 'ஷிப்ட் ஆன்லைன்' : 'SHIFT ONLINE'}
          </span>
        </div>

        {/* SECTION 1: 4-DIGIT PIN PAD / ORDER ID LOOKUP */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#047857] font-bold">
              Bag Verification Slip
            </span>
            <h2 className="text-xs font-bold text-slate-900 uppercase">
              {lang === 'ta' ? 'பில் எண்ணை உள்ளிடவும் (4 இலக்கம்)' : 'ENTER 4-DIGIT ORDER ID FROM BAG SLIP'}
            </h2>
          </div>

          {/* 4 Monospace Digit Boxes */}
          <div className="flex items-center justify-center gap-3 my-1">
            {codeDigits.map((digit, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <input
                  ref={digitRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  className="w-14 h-16 rounded-xl bg-slate-100 focus:bg-white text-center font-mono text-2xl font-bold text-slate-900 border-2 border-slate-200 focus:border-[#047857] focus:outline-none shadow-inner"
                />
                <span className="text-[9px] font-mono text-slate-400 mt-1">DIGIT {idx + 1}</span>
              </div>
            ))}
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-semibold text-center">{errorMsg}</p>
          )}

          <button
            onClick={() => {
              const entered = codeDigits.join('').trim();
              if (entered.length > 0) fetchOrderDetails(entered);
            }}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-[#005d42] hover:bg-[#00513a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Searching...' : 'Load Delivery Details'}</span>
            <span className="text-[10px] text-[#7bd8b1]">/ விவரங்கள்</span>
          </button>

          {/* Quick-Select Ready at Counter List */}
          {readyOrders.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                Ready for Pickup at Counter:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {readyOrders.map((ro) => (
                  <button
                    key={ro.id}
                    onClick={() => fetchOrderDetails(ro.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#dae2fd] text-slate-800 text-[11px] font-mono font-bold border border-slate-200 transition-colors"
                  >
                    {ro.id} ({ro.distanceKm}km)
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: ACTIVE DELIVERY MISSION CARD */}
        {activeOrder && (
          <section className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden space-y-4">
            {/* Mission Header */}
            <div className="bg-[#047857] text-white p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold bg-white text-[#005d42] px-2 py-0.5 rounded">
                  ORDER {activeOrder.id}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  activeOrder.status === 2 ? 'bg-[#97f5cc] text-[#002115]' : 'bg-[#005d42] text-[#97f5cc]'
                }`}>
                  {activeOrder.status === 2 ? 'ON BIKE (பயணத்தில்)' : 'PACKED & READY'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold pt-1">
                <Clock className="w-3.5 h-3.5 text-[#97f5cc]" />
                <span>{activeOrder.distanceKm} km from store • ~8 mins by bike</span>
              </div>
            </div>

            {/* Customer Details Content */}
            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    {activeOrder.isForSomeoneElse
                      ? (lang === 'ta' ? 'வீட்டு வாசலில் பெறுபவர்' : 'Doorstep Recipient')
                      : (lang === 'ta' ? 'வாடிக்கையாளர்' : 'Customer')}
                  </span>
                  {activeOrder.isForSomeoneElse && (
                    <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-amber-100 text-amber-900 font-bold">
                      {lang === 'ta' ? 'மற்றொருவருக்கு' : 'For Someone Else'}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {activeOrder.recipientName || activeOrder.customerName}
                </h3>
                <span className="text-xs font-mono text-slate-600 font-bold">
                  +91 {(activeOrder.recipientPhone || activeOrder.phone).replace(/\D/g, '').slice(-10)}
                </span>

                {/* Helpful info badge if isForSomeoneElse */}
                {activeOrder.isForSomeoneElse && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <div>
                      <p className="font-bold leading-snug">
                        {lang === 'ta'
                          ? `ஆர்டர் செய்தவர்: +91 ${activeOrder.phone.replace(/\D/g, '').slice(-10)} (${activeOrder.customerName || 'கணக்கு வைத்திருப்பவர்'})`
                          : `Ordered by +91 ${activeOrder.phone.replace(/\D/g, '').slice(-10)} for ${activeOrder.recipientName}`}
                      </p>
                      <p className="text-[11px] text-amber-800/80 mt-0.5">
                        {lang === 'ta'
                          ? 'வீட்டு வாசலில் பெறுபவர் ஆச்சரியப்பட்டால், யார் அனுப்பினார் என்பதைத் தெரிவிக்கவும்.'
                          : 'If recipient looks surprised at the door, mention who ordered these groceries.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Address Box with Highlighted Door No */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#0047bf] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {activeOrder.address}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Google Maps Bike Route, Call & WhatsApp */}
              <div className="space-y-2 pt-1">
                <a
                  href={
                    activeOrder.lat && activeOrder.lng
                      ? `https://www.google.com/maps/dir/?api=1&destination=${activeOrder.lat},${activeOrder.lng}&travelmode=two-wheeler`
                      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeOrder.address + ', Madurai')}&travelmode=two-wheeler`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="h-13 w-full rounded-xl bg-[#0047bf] hover:bg-[#003ea8] text-white flex items-center justify-between px-4 shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <Navigation className="w-5 h-5 text-white" />
                    <div className="text-left">
                      <div className="text-xs font-bold">Open Google Maps Bike Route</div>
                      <div className="text-[10px] text-[#b4c5ff]">மேப்பில் வழியைப் பார்க்க ({activeOrder.distanceKm} km)</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white" />
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:+91${(activeOrder.recipientPhone || activeOrder.phone).replace(/\D/g, '').slice(-10)}`}
                    className="h-11 rounded-xl bg-[#283044] hover:bg-[#1e2330] text-white flex items-center justify-center gap-2 text-xs font-bold transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{lang === 'ta' ? 'அழைக்க' : 'Call Doorstep'}</span>
                  </a>
                  <a
                    href={`https://wa.me/91${(activeOrder.recipientPhone || activeOrder.phone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                      `Hello from Sri Amman Supermarket delivery partner. I am delivering your order ${activeOrder.id}${activeOrder.isForSomeoneElse ? ` (ordered by ${activeOrder.customerName})` : ''}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-11 rounded-xl bg-[#047857] hover:bg-[#035f44] text-white flex items-center justify-center gap-2 text-xs font-bold transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp Pin</span>
                  </a>
                </div>
              </div>

              {/* High Visibility Payment Collection Banner */}
              {activeOrder.paymentMethod === 'cod' && activeOrder.paymentStatus !== 'paid' ? (
                <div className="p-3.5 rounded-xl bg-[#ffdcc3] border border-[#ffb77d] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#6e3900]">
                      <DollarSign className="w-4 h-4" />
                      <div>
                        <span className="text-xs font-bold block uppercase">CASH / UPI ON DELIVERY</span>
                        <span className="text-[10px]">வாடிக்கையாளரிடம் ரொக்கம் வசூலிக்கவும்</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-[#fe932c] text-[#663500] font-bold">
                      MANDATORY
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg flex justify-between items-center shadow-inner">
                    <span className="text-xs font-medium text-slate-600">Total Cash to Collect:</span>
                    <span className="font-mono text-xl font-bold text-[#904d00]">₹{activeOrder.total}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setCashCollected(!cashCollected)}
                      className={`h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border ${
                        cashCollected
                          ? 'bg-[#005d42] text-white border-[#005d42]'
                          : 'bg-white text-slate-800 border-slate-300'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{cashCollected ? '✓ Cash Collected' : 'Collect Cash'}</span>
                    </button>

                    <button
                      onClick={() => setQrModalOpen(true)}
                      className="h-10 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#0047bf]" />
                      <span>Show UPI QR</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#97f5cc]/40 border border-[#97f5cc] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#005d42]" />
                    <span className="text-xs font-bold text-[#002115]">
                      ALREADY PAID VIA UPI • COLLECT ₹0
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#005d42]">முன்பணம்</span>
                </div>
              )}

              {/* Items in Bag List */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Verify Items in Bag ({activeOrder.items.length})
                </span>
                <div className="space-y-1">
                  {activeOrder.items.map((it, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-slate-900">{it.nameEn} ({it.variantLabel})</span>
                        {it.nameTa && <span className="block text-[10px] text-slate-500">{it.nameTa}</span>}
                      </div>
                      <span className="font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                        x{it.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* UPI QR Modal Overlay */}
      {qrModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 text-center space-y-3 relative shadow-2xl">
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="font-bold text-sm text-slate-900">Sri Amman Store UPI QR</h4>
            <p className="text-[11px] text-slate-500">Scan &amp; pay to supermarket ICICI account</p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block">
              {/* Dynamic UPI Intent QR image */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `upi://pay?pa=sriammansupermarket.madurai@icici&pn=Sri%20Amman%20Supermarket&am=${activeOrder.total}&cu=INR&tn=Order%20${activeOrder.id}`
                )}`}
                alt="Store UPI QR"
                className="w-44 h-44 object-contain mx-auto"
              />
            </div>

            <div className="font-mono text-sm font-bold text-[#005d42]">
              Amount: ₹{activeOrder.total}.00
            </div>

            <button
              onClick={() => {
                setCashCollected(true);
                setQrModalOpen(false);
              }}
              className="w-full py-2.5 bg-[#005d42] hover:bg-[#004e37] text-white text-xs font-bold rounded-xl transition-colors"
            >
              Customer Paid Successfully
            </button>
          </div>
        </div>
      )}

      {/* Delivery Celebration Screen */}
      {deliveryCelebration && (
        <div className="fixed inset-0 z-50 bg-[#005d42] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle className="w-10 h-10 text-[#97f5cc]" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Order Delivered Successfully!</h2>
          <p className="text-xs text-[#9ffdd3] mt-1 max-w-xs">
            Payment settled and logged to store counter daybook.
          </p>

          <button
            onClick={handleResetForNextOrder}
            className="mt-8 px-6 py-3 rounded-xl bg-white text-[#005d42] font-bold text-sm shadow-xl flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Pick Up Next Order
          </button>
        </div>
      )}

      {/* Sticky Bottom Two-Stage Progression Bar */}
      {activeOrder && activeOrder.status < 3 && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md px-4 pt-2 pb-5 border-t border-slate-200 shadow-xl max-w-md mx-auto">
          {activeOrder.status < 2 ? (
            <button
              onClick={handleStartRide}
              className="w-full h-14 rounded-xl bg-[#fe932c] hover:bg-[#e27e1b] text-[#663500] font-bold text-xs flex items-center justify-between px-4 shadow-md transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 text-left">
                <Truck className="w-5 h-5 text-[#663500]" />
                <div>
                  <span className="block leading-tight text-xs font-bold">1. Confirm Bag Pickup &amp; Start Ride</span>
                  <span className="text-[10px] opacity-80">அலுவலகத்திலிருந்து கிளம்பு</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#663500] text-[#ffdcc3] font-bold">
                READY
              </span>
            </button>
          ) : (
            <button
              onClick={handleMarkDelivered}
              className="w-full h-14 rounded-xl bg-[#005d42] hover:bg-[#004e37] text-white font-bold text-sm flex items-center justify-between px-4 shadow-lg transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 text-left">
                <CheckCircle className="w-5 h-5 text-[#97f5cc]" />
                <div>
                  <span className="block leading-tight font-bold">2. Mark Order Delivered</span>
                  <span className="text-[10px] text-[#7bd8b1]">டெலிவரி முடிந்தது (OTP சரிபார்)</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#97f5cc]" />
            </button>
          )}
        </nav>
      )}
    </div>
  );
}
