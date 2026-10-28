'use client';

import React, { useState, useRef } from 'react';
import {
  Bike,
  PackageCheck,
  CheckCircle2,
  MapPin,
  Phone,
  MessageSquare,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Home,
  Clock,
  User,
  Check,
} from 'lucide-react';

/* =========================================================================
   RIDER BOTTOM NAVIGATION DOCK (Touch targets >= 48px, pb-safe)
========================================================================= */
export interface RiderNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export interface RiderBottomNavProps {
  items: RiderNavItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export const RiderBottomNav: React.FC<RiderBottomNavProps> = ({ items, activeId, onChange }) => {
  return (
    <nav
      aria-label="Rider Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-lg"
    >
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 rounded-xl transition-all duration-150 select-none ${
                isActive ? 'text-[#143B0D]' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className="relative">
                <span className="w-5 h-5">{item.icon}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 min-w-[16px] h-4 text-[10px] font-black font-mono rounded-full bg-[#BA1A1A] text-white flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 font-bold tracking-tight ${
                  isActive ? 'text-[#143B0D]' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
              {isActive && <span className="w-4 h-1 rounded-full bg-[#76CA3E] mt-0.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

/* =========================================================================
   RIDER STICKY PRIMARY ACTION BAR (Single-hand thumbs, pb-safe)
========================================================================= */
export interface RiderStickyActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export const RiderStickyActionBar: React.FC<RiderStickyActionBarProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 pb-safe shadow-xl ${className}`}
    >
      <div className="max-w-md mx-auto">{children}</div>
    </div>
  );
};

/* =========================================================================
   RIDER STATUS STEPPER
========================================================================= */
export interface RiderStatusStepperProps {
  currentStage: 'dock' | 'route' | 'doorstep' | 'delivered';
}

export const RiderStatusStepper: React.FC<RiderStatusStepperProps> = ({ currentStage }) => {
  const stages = [
    { id: 'dock', label: 'Store Dock', icon: <PackageCheck className="w-3.5 h-3.5" /> },
    { id: 'route', label: 'On Bike', icon: <Bike className="w-3.5 h-3.5" /> },
    { id: 'doorstep', label: 'Doorstep', icon: <Navigation className="w-3.5 h-3.5" /> },
    { id: 'delivered', label: 'Settled', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  ];

  const stageOrder = ['dock', 'route', 'doorstep', 'delivered'];
  const currentIndex = stageOrder.indexOf(currentStage);

  return (
    <div className="w-full bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
      <div className="flex items-center justify-between relative">
        {/* Track Line */}
        <div className="absolute left-4 right-4 top-4 h-0.5 bg-slate-200 -z-0" />
        <div
          className="absolute left-4 top-4 h-0.5 bg-[#76CA3E] -z-0 transition-all duration-300"
          style={{ width: `${(currentIndex / (stages.length - 1)) * 90}%` }}
        />

        {stages.map((st, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={st.id} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-200 ${
                  isDone
                    ? 'bg-[#76CA3E] text-[#143B0D]'
                    : isCurrent
                    ? 'bg-[#143B0D] text-white ring-4 ring-[#76CA3E]/30 scale-110'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {st.icon}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-bold tracking-tight whitespace-nowrap ${
                  isCurrent ? 'text-[#143B0D]' : isDone ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* =========================================================================
   RIDER ORDER CARD (High contrast, outdoor readable)
========================================================================= */
export interface RiderOrderCardProps {
  orderId: string;
  bagCode: string;
  recipientName: string;
  phone: string;
  address: string;
  distanceKm: number;
  paymentMethod: 'upi' | 'cod';
  totalAmount: number;
  isForSomeoneElse?: boolean;
  onNavigate?: () => void;
  onCall?: () => void;
  onWhatsApp?: () => void;
  primaryAction?: React.ReactNode;
}

export const RiderOrderCard: React.FC<RiderOrderCardProps> = ({
  orderId,
  bagCode,
  recipientName,
  phone,
  address,
  distanceKm,
  paymentMethod,
  totalAmount,
  isForSomeoneElse,
  onNavigate,
  onCall,
  onWhatsApp,
  primaryAction,
}) => {
  return (
    <article className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 space-y-3.5">
      {/* Top Header: Bag Code & Payment */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-[#0047BF] text-white font-mono font-extrabold text-base tracking-wider shadow-2xs">
            BAG #{bagCode}
          </div>
          <span className="font-mono text-xs font-bold text-slate-500">#{orderId.slice(-6)}</span>
        </div>

        <span
          className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs uppercase ${
            paymentMethod === 'upi' ? 'bg-[#97F5CC] text-[#002115]' : 'bg-[#FFDCC3] text-[#2F1500]'
          }`}
        >
          {paymentMethod === 'upi' ? 'UPI PAID' : `COLLECT ₹${totalAmount}`}
        </span>
      </div>

      {/* Recipient & Location Info */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{recipientName}</h3>
          <span className="text-xs font-mono font-bold text-slate-600">{distanceKm} km</span>
        </div>
        {isForSomeoneElse && (
          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-900">
            Ordered for someone else
          </span>
        )}
        <div className="flex items-start gap-1.5 text-xs text-slate-600 pt-0.5">
          <MapPin className="w-4 h-4 text-[#143B0D] shrink-0 mt-0.5" />
          <p className="leading-snug">{address}</p>
        </div>
      </div>

      {/* Quick Action Triggers (Touch Target >= 48px) */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
        <button
          onClick={onNavigate}
          className="min-h-[48px] rounded-xl bg-[#F1F9EC] hover:bg-[#76CA3E]/20 text-[#143B0D] font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors active:scale-95"
        >
          <Navigation className="w-4 h-4" />
          <span>Maps GPS</span>
        </button>
        <button
          onClick={onCall}
          className="min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors active:scale-95"
        >
          <Phone className="w-4 h-4 text-slate-700" />
          <span>Call</span>
        </button>
        <button
          onClick={onWhatsApp}
          className="min-h-[48px] rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors active:scale-95"
        >
          <MessageSquare className="w-4 h-4 text-emerald-700" />
          <span>WhatsApp</span>
        </button>
      </div>

      {primaryAction && <div className="pt-1">{primaryAction}</div>}
    </article>
  );
};

/* =========================================================================
   SLIDE / SWIPE TO CONFIRM BUTTON (Gloves / Outdoor usage)
========================================================================= */
export interface SlideToConfirmProps {
  onConfirm: () => void;
  label?: string;
  confirmedLabel?: string;
  disabled?: boolean;
}

export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({
  onConfirm,
  label = 'Slide to confirm delivery',
  confirmedLabel = 'Confirmed & Settled',
  disabled = false,
}) => {
  const [sliderPos, setSliderPos] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled || isConfirmed || !trackRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const rect = trackRef.current.getBoundingClientRect();
    const maxOffset = rect.width - 56;
    const currentOffset = Math.max(0, Math.min(clientX - rect.left - 24, maxOffset));

    setSliderPos(currentOffset);

    if (currentOffset >= maxOffset * 0.9) {
      setIsConfirmed(true);
      setSliderPos(maxOffset);
      onConfirm();
    }
  };

  const handleEnd = () => {
    if (!isConfirmed) {
      setSliderPos(0);
    }
  };

  return (
    <div
      ref={trackRef}
      onMouseMove={(e) => e.buttons === 1 && handleTouchMove(e)}
      onMouseUp={handleEnd}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
      className={`relative w-full h-14 rounded-2xl flex items-center select-none overflow-hidden transition-colors ${
        disabled
          ? 'bg-slate-200 opacity-60 cursor-not-allowed'
          : isConfirmed
          ? 'bg-[#143B0D]'
          : 'bg-[#F1F9EC] border-2 border-[#76CA3E]'
      }`}
    >
      <span
        className={`w-full text-center text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-opacity ${
          isConfirmed ? 'text-white' : 'text-[#143B0D]'
        }`}
      >
        {isConfirmed ? confirmedLabel : label}
      </span>

      {/* Handle */}
      <div
        style={{ transform: `translateX(${sliderPos}px)` }}
        className={`absolute left-1 top-1 bottom-1 w-12 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md transition-transform duration-75 ${
          isConfirmed ? 'bg-[#76CA3E] text-[#143B0D]' : 'bg-[#143B0D] text-white'
        }`}
      >
        {isConfirmed ? <Check className="w-5 h-5 font-bold" /> : <ArrowRight className="w-5 h-5" />}
      </div>
    </div>
  );
};
