'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bike,
  PackageCheck,
  MapPin,
  Clock,
  Phone,
  Navigation,
  RefreshCw,
  Search,
  WifiOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Package,
  Sparkles,
  User,
} from 'lucide-react';
import { RiderSession } from './RiderAuthView';

export interface RiderOrderItem {
  id: string;
  productId: string;
  nameEn: string;
  nameTa: string;
  variantLabel: string;
  price: number;
  quantity: number;
}

export interface RiderOrder {
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
  assignedRiderName?: string;
  assignedRiderPhone?: string;
  itemCount?: number;
  items?: RiderOrderItem[];
}

export interface RiderHomeViewProps {
  session: RiderSession;
  activeOrder: RiderOrder | null;
  readyOrders: RiderOrder[];
  isOnline: boolean;
  isSyncing: boolean;
  onRefresh: () => void;
  onSelectOrder: (order: RiderOrder) => void;
  onLookupCode: (code: string) => void;
  onToggleShiftStatus: () => void;
  lang?: 'en' | 'ta';
}

export const RiderHomeView: React.FC<RiderHomeViewProps> = ({
  session,
  activeOrder,
  readyOrders,
  isOnline,
  isSyncing,
  onRefresh,
  onSelectOrder,
  onLookupCode,
  onToggleShiftStatus,
  lang = 'en',
}) => {
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '']);
  const digitRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleDigitChange = (index: number, val: string) => {
    const char = val.slice(-1);
    const next = [...codeDigits];
    next[index] = char;
    setCodeDigits(next);

    if (char && index < 3) {
      digitRefs[index + 1].current?.focus();
    }

    if (char && index === 3 && next.every((d) => d !== '')) {
      onLookupCode(next.join(''));
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      digitRefs[index - 1].current?.focus();
    }
  };

  const handleClearCode = () => {
    setCodeDigits(['', '', '', '']);
    digitRefs[0].current?.focus();
  };

  return (
    <div className="space-y-4 pb-24 font-sans max-w-md mx-auto">
      {/* Offline / Slow Connection Warning Banner */}
      {!isOnline && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3.5 rounded-2xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#410002] flex items-center justify-between shadow-sm animate-pulse"
        >
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-5 h-5 text-[#BA1A1A] shrink-0" />
            <div>
              <span className="font-bold text-xs block">
                {lang === 'ta' ? 'ஆஃப்லைன் முறை' : 'Network Disconnected'}
              </span>
              <span className="text-[11px] text-[#410002]/80">
                {lang === 'ta'
                  ? 'டெலிவரி விவரங்கள் உள்ளூரில் சேமிக்கப்பட்டு ஆட்டோ-ஒத்திசைக்கப்படும்.'
                  : 'Pending actions will auto-sync when network reconnects.'}
              </span>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="min-h-[36px] px-2.5 rounded-xl bg-[#BA1A1A] text-white text-xs font-bold shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Prominent Shift Status & Availability Header */}
      <section className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F1F9EC] border border-[#76CA3E]/30 flex items-center justify-center text-[#143B0D]">
              <Bike className="w-5 h-5 text-[#143B0D]" />
            </div>
            <div>
              <span className="text-xs font-black text-[#0F172A] block leading-tight">
                {session.name}
              </span>
              <span className="text-[11px] font-mono text-[#475569]">
                {session.vehicle.split('(')[0]}
              </span>
            </div>
          </div>

          {/* Availability Toggle (Online / On Break) */}
          <button
            type="button"
            onClick={onToggleShiftStatus}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all select-none border ${
              session.shiftStatus === 'active'
                ? 'bg-[#F1F9EC] border-[#76CA3E] text-[#143B0D] ring-2 ring-[#76CA3E]/20'
                : 'bg-slate-100 border-[#E2E8F0] text-slate-600'
            }`}
            aria-pressed={session.shiftStatus === 'active'}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                session.shiftStatus === 'active' ? 'bg-[#76CA3E] animate-ping' : 'bg-slate-400'
              }`}
            />
            <span className="font-mono uppercase tracking-wider text-[11px]">
              {session.shiftStatus === 'active'
                ? lang === 'ta'
                  ? 'ஆன்லைன்'
                  : 'ONLINE'
                : lang === 'ta'
                ? 'ஓய்வு'
                : 'ON BREAK'}
            </span>
          </button>
        </div>

        {/* Quick Shift Metric Strip */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E2E8F0] text-center">
          <div className="p-2 rounded-xl bg-[#F8FAF7]">
            <span className="text-[10px] uppercase font-bold text-[#475569] block">Status</span>
            <span className="text-xs font-mono font-bold text-[#047857]">
              {session.shiftStatus === 'active' ? 'Accepting' : 'Paused'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#F8FAF7]">
            <span className="text-[10px] uppercase font-bold text-[#475569] block">
              {lang === 'ta' ? 'தயாராக' : 'At Dock'}
            </span>
            <span className="text-xs font-mono font-bold text-[#0047BF]">
              {readyOrders.length} Bags
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#F8FAF7]">
            <span className="text-[10px] uppercase font-bold text-[#475569] block">Zone</span>
            <span className="text-xs font-mono font-bold text-[#0F172A]">Madurai 3km</span>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTED ACTIVE ORDER (Priority Callout at Top) */}
      {activeOrder && (
        <section
          aria-label="Current Active Delivery"
          className="bg-white rounded-2xl border-2 border-[#143B0D] shadow-md overflow-hidden relative"
        >
          {/* Header Strip */}
          <div className="bg-[#143B0D] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#76CA3E] animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#76CA3E]">
                {lang === 'ta' ? 'நடப்பு டெலிவரி' : 'ACTIVE MISSION IN TRANSIT'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded font-mono text-[11px] font-black bg-[#76CA3E] text-[#143B0D]">
              BAG #{activeOrder.id.replace(/\D/g, '').slice(-4) || activeOrder.id.slice(-4)}
            </span>
          </div>

          <div className="p-4 space-y-3.5">
            {/* Customer & Distance */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#475569] font-bold block">
                  {activeOrder.isForSomeoneElse
                    ? lang === 'ta'
                      ? 'பெறுபவர் (For Someone Else)'
                      : 'Doorstep Recipient'
                    : lang === 'ta'
                    ? 'வாடிக்கையாளர்'
                    : 'Customer'}
                </span>
                <h3 className="text-lg font-black text-[#0F172A] leading-tight mt-0.5">
                  {activeOrder.recipientName || activeOrder.customerName}
                </h3>
                <span className="text-xs font-mono font-bold text-[#475569]">
                  +91 {(activeOrder.recipientPhone || activeOrder.phone).replace(/\D/g, '').slice(-10)}
                </span>
              </div>

              {/* Distance Pill */}
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F1F9EC] border border-[#76CA3E]/30 text-[#143B0D] font-mono text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-[#047857]" />
                  <span>{activeOrder.distanceKm} km</span>
                </span>
                <span className="block text-[10px] text-[#475569] font-medium mt-1">
                  ~{Math.round(activeOrder.distanceKm * 4)} mins bike
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#0047BF] shrink-0 mt-0.5" />
              <p className="text-xs text-[#0F172A] leading-snug font-medium line-clamp-2">
                {activeOrder.address}
              </p>
            </div>

            {/* Payment Collection Warning */}
            <div className="flex items-center justify-between p-3 rounded-xl border bg-[#F8FAF7] border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#FE932C]" />
                <span className="text-xs font-bold text-[#0F172A]">
                  {activeOrder.paymentMethod === 'cod' && activeOrder.paymentStatus !== 'paid'
                    ? lang === 'ta'
                      ? 'ரொக்கம் வசூலிக்கவும்'
                      : 'Collect Cash on Delivery'
                    : lang === 'ta'
                    ? 'முன்பணம் செலுத்தப்பட்டது'
                    : 'Prepaid via UPI'}
                </span>
              </div>
              <span
                className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg ${
                  activeOrder.paymentMethod === 'cod' && activeOrder.paymentStatus !== 'paid'
                    ? 'bg-[#FFDCC3] text-[#2F1500]'
                    : 'bg-[#97F5CC] text-[#002115]'
                }`}
              >
                {activeOrder.paymentMethod === 'cod' && activeOrder.paymentStatus !== 'paid'
                  ? `₹${activeOrder.total}`
                  : 'PAID'}
              </span>
            </div>

            {/* Obvious Primary Action Button (>= 48px) */}
            <button
              onClick={() => onSelectOrder(activeOrder)}
              className="w-full min-h-[50px] rounded-2xl bg-[#143B0D] hover:bg-[#1E4D12] active:scale-[0.98] text-white font-bold text-sm flex items-center justify-between px-4 shadow-md transition-all"
            >
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-[#76CA3E]" />
                <span>{lang === 'ta' ? 'டெலிவரி திரைக்குச் செல்' : 'Open Delivery Dashboard'}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#76CA3E]" />
            </button>
          </div>
        </section>
      )}

      {/* 4-DIGIT BAG VERIFICATION SLIP QUICK KEYPAD */}
      <section className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#047857] block">
              Store Dispatch Counter
            </span>
            <h2 className="text-xs font-black text-[#0F172A] uppercase">
              {lang === 'ta' ? 'பில் 4-இலக்க எண் தேடல்' : 'QUICK BAG # VERIFICATION'}
            </h2>
          </div>
          {codeDigits.some((d) => d !== '') && (
            <button
              type="button"
              onClick={handleClearCode}
              className="text-[11px] font-bold text-[#475569] hover:text-[#0F172A]"
            >
              Clear
            </button>
          )}
        </div>

        {/* 4 Monospace Touch-Friendly PIN Boxes */}
        <div className="flex items-center justify-center gap-2.5 my-1">
          {codeDigits.map((digit, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <input
                ref={digitRefs[idx]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                className="w-14 h-16 rounded-2xl bg-[#F8FAF7] focus:bg-white text-center font-mono text-2xl font-black text-[#0F172A] border-2 border-[#E2E8F0] focus:border-[#143B0D] focus:ring-2 focus:ring-[#76CA3E]/30 outline-none shadow-inner transition-all"
                aria-label={`Digit ${idx + 1}`}
              />
              <span className="text-[9px] font-mono text-[#94A3B8] mt-1 font-bold">
                D{idx + 1}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            const entered = codeDigits.join('').trim();
            if (entered.length > 0) onLookupCode(entered);
          }}
          disabled={codeDigits.join('').trim().length === 0}
          className="w-full min-h-[48px] rounded-xl bg-[#0047BF] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Search className="w-4 h-4" />
          <span>{lang === 'ta' ? 'ஆர்டர் விவரங்களை ஏற்று' : 'Lookup Bag Details'}</span>
        </button>
      </section>

      {/* READY AT STORE DOCK QUEUE */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-[#0047BF]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
              {lang === 'ta' ? 'கவுண்டரில் தயாராக உள்ள பைகள்' : 'Ready for Pickup at Store Dock'}
            </h2>
          </div>
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold text-[#143B0D] bg-[#F1F9EC] hover:bg-[#76CA3E]/20 transition-colors"
            aria-label="Refresh orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>

        {readyOrders.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F1F9EC] mx-auto flex items-center justify-center text-[#143B0D]">
              <Package className="w-6 h-6 text-[#76CA3E]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#0F172A]">
                {lang === 'ta' ? 'தற்போது புதிய ஆர்டர்கள் இல்லை' : 'No Orders Waiting at Counter'}
              </h3>
              <p className="text-xs text-[#475569] mt-0.5 max-w-xs mx-auto">
                {lang === 'ta'
                  ? 'புதிய ஆர்டர்கள் பேக்கிங் முடிந்தவுடன் இங்கு தோன்றும்.'
                  : 'New orders will appear here as soon as store staff bag them.'}
              </p>
            </div>
            <button
              onClick={onRefresh}
              className="min-h-[44px] px-4 rounded-xl bg-[#143B0D] text-white text-xs font-bold inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check for New Orders</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {readyOrders.map((ro) => {
              const bagNum = ro.id.replace(/\D/g, '').slice(-4) || ro.id.slice(-4);
              const isCOD = ro.paymentMethod === 'cod' && ro.paymentStatus !== 'paid';

              return (
                <article
                  key={ro.id}
                  onClick={() => onSelectOrder(ro)}
                  className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#143B0D] shadow-xs cursor-pointer transition-all active:scale-[0.99] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-[#0047BF] text-white font-mono font-black text-xs">
                        BAG #{bagNum}
                      </span>
                      <span className="text-xs font-bold text-[#0F172A] truncate max-w-[140px]">
                        {ro.recipientName || ro.customerName}
                      </span>
                    </div>

                    <span
                      className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${
                        isCOD ? 'bg-[#FFDCC3] text-[#2F1500]' : 'bg-[#97F5CC] text-[#002115]'
                      }`}
                    >
                      {isCOD ? `Collect ₹${ro.total}` : 'UPI PAID'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#475569] pt-1 border-t border-[#E2E8F0]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0047BF] shrink-0" />
                      <span className="truncate max-w-[200px]">{ro.address}</span>
                    </div>
                    <span className="font-mono font-bold text-[#0F172A] shrink-0">
                      {ro.distanceKm} km
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
