'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Bike,
  PackageCheck,
  CheckCircle2,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Navigation,
  QrCode,
  DollarSign,
  AlertCircle,
  X,
  RotateCcw,
  Check,
  Package,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { RiderOrder, RiderOrderItem } from './RiderHomeView';
import { RiderStatusStepper, SlideToConfirm, RiderStickyActionBar } from './ui/RiderPrimitives';

export interface RiderOrderDetailViewProps {
  order: RiderOrder;
  onBack: () => void;
  onStartRide: (orderId: string) => Promise<boolean>;
  onMarkDelivered: (orderId: string, cashCollected: boolean) => Promise<boolean>;
  onResetToNext: () => void;
  isOnline?: boolean;
  lang?: 'en' | 'ta';
}

export const RiderOrderDetailView: React.FC<RiderOrderDetailViewProps> = ({
  order,
  onBack,
  onStartRide,
  onMarkDelivered,
  onResetToNext,
  isOnline = true,
  lang = 'en',
}) => {
  const [cashCollected, setCashCollected] = useState(order.paymentStatus === 'paid');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [celebrationOpen, setCelebrationOpen] = useState(order.status === 3);

  const bagCode = order.id.replace(/\D/g, '').slice(-4) || order.id.slice(-4);
  const isCOD = order.paymentMethod === 'cod' && order.paymentStatus !== 'paid';
  const effectivePhone = (order.recipientPhone || order.phone).replace(/\D/g, '').slice(-10);

  // Map stepper stage
  const stepperStage: 'dock' | 'route' | 'doorstep' | 'delivered' =
    order.status === 0 || order.status === 1
      ? 'dock'
      : order.status === 2
      ? 'route'
      : 'delivered';

  const handleStartPickup = async () => {
    setActionError(null);
    setSubmitting(true);
    try {
      const success = await onStartRide(order.id);
      if (!success) {
        setActionError(
          lang === 'ta'
            ? 'பை பிக்-அப் பதிவு செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
            : 'Could not update pickup status. Please retry.'
        );
      }
    } catch {
      setActionError('Network error updating pickup status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelivery = async () => {
    setActionError(null);
    setSubmitting(true);
    try {
      const success = await onMarkDelivered(order.id, cashCollected);
      if (success) {
        setCelebrationOpen(true);
      } else {
        setActionError(
          lang === 'ta'
            ? 'டெலிவரி நிலை பதிவு செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
            : 'Could not record delivery. Please retry.'
        );
      }
    } catch {
      setActionError('Network error updating delivery status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-32 font-sans max-w-md mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAF7] text-[#0F172A] flex items-center justify-center transition-colors active:scale-95"
          aria-label="Back to active orders"
        >
          <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#0047BF] text-white font-mono font-black text-xs tracking-wider">
            BAG #{bagCode}
          </div>
          <span className="block font-mono text-[10px] text-[#475569] mt-0.5">
            #{order.id.slice(-6)}
          </span>
        </div>

        <span
          className={`font-mono text-xs font-black px-2.5 py-1 rounded-xl uppercase ${
            order.status === 2
              ? 'bg-[#143B0D] text-white'
              : order.status === 3
              ? 'bg-[#97F5CC] text-[#002115]'
              : 'bg-[#FFDCC3] text-[#2F1500]'
          }`}
        >
          {order.status === 2 ? 'ON BIKE' : order.status === 3 ? 'DELIVERED' : 'READY'}
        </span>
      </div>

      {/* Error Alert with Retry */}
      {actionError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 rounded-2xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#410002] flex items-start justify-between text-xs font-medium"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#BA1A1A] shrink-0 mt-0.5" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-[11px] font-bold text-[#BA1A1A] ml-2 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4-Phase Status Stepper */}
      <RiderStatusStepper currentStage={stepperStage} />

      {/* Customer & Recipient Card */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3.5 shadow-sm">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#475569] font-bold">
              {order.isForSomeoneElse
                ? lang === 'ta'
                  ? 'வாசலில் பெறுபவர் (For Someone Else)'
                  : 'Doorstep Recipient'
                : lang === 'ta'
                ? 'வாடிக்கையாளர்'
                : 'Customer'}
            </span>
            {order.isForSomeoneElse && (
              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-[#FFDCC3] text-[#2F1500] font-bold">
                {lang === 'ta' ? 'வேறொருவருக்கு' : 'For Someone Else'}
              </span>
            )}
          </div>

          <h2 className="text-xl font-black text-[#0F172A] leading-tight mt-0.5">
            {order.recipientName || order.customerName}
          </h2>

          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-mono font-bold text-[#475569]">
              +91 {effectivePhone}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[#047857] bg-[#F1F9EC] px-2 py-0.5 rounded-md">
              <Clock className="w-3.5 h-3.5" />
              <span>{order.distanceKm} km (~{Math.round(order.distanceKm * 4)}m)</span>
            </span>
          </div>

          {/* Someone Else Warning Banner */}
          {order.isForSomeoneElse && (
            <div className="mt-2.5 p-3 rounded-xl bg-[#FFDCC3]/50 border border-[#FE932C]/40 text-[#2F1500] text-xs flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FE932C] mt-1 shrink-0" />
              <div>
                <p className="font-bold leading-snug">
                  {lang === 'ta'
                    ? `ஆர்டர் செய்தவர்: +91 ${order.phone.replace(/\D/g, '').slice(-10)} (${order.customerName || 'கணக்குதாரர்'})`
                    : `Ordered by ${order.customerName} (+91 ${order.phone.replace(/\D/g, '').slice(-10)})`}
                </p>
                <p className="text-[11px] text-[#2F1500]/80 mt-0.5">
                  {lang === 'ta'
                    ? 'வீட்டு வாசலில் பெறுபவர் யார் அனுப்பியது என கேட்டால், ஆர்டர் செய்தவர் பெயரைத் தெரிவிக்கவும்.'
                    : 'If recipient asks who sent this, inform them who placed the order.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Address Container */}
        <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] space-y-1">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#0047BF] shrink-0 mt-0.5" />
            <p className="text-xs text-[#0F172A] leading-relaxed font-medium">
              {order.address}
            </p>
          </div>
        </div>

        {/* Action Triggers: Google Maps Bike Route, Call & WhatsApp (>= 48px) */}
        <div className="space-y-2 pt-1">
          <a
            href={
              order.lat && order.lng
                ? `https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lng}&travelmode=two-wheeler`
                : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    order.address + ', Madurai'
                  )}&travelmode=two-wheeler`
            }
            target="_blank"
            rel="noreferrer"
            className="min-h-[50px] w-full rounded-2xl bg-[#0047BF] hover:bg-[#1D4ED8] active:scale-[0.98] text-white flex items-center justify-between px-4 shadow-md transition-all select-none"
          >
            <div className="flex items-center gap-2.5">
              <Navigation className="w-5 h-5 text-white" />
              <div className="text-left">
                <span className="text-xs font-bold block leading-tight">
                  Open Google Maps Bike Route
                </span>
                <span className="text-[10px] text-[#DBE1FF]">
                  {order.distanceKm} km turn-by-turn navigation
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
              GPS
            </span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:+91${effectivePhone}`}
              className="min-h-[48px] rounded-xl bg-[#0F172A] hover:bg-[#1E293B] active:scale-[0.98] text-white flex items-center justify-center gap-2 text-xs font-bold transition-all select-none"
            >
              <Phone className="w-4 h-4 text-[#76CA3E]" />
              <span>{lang === 'ta' ? 'அழைக்க' : 'Call Doorstep'}</span>
            </a>

            <a
              href={`https://wa.me/91${effectivePhone}?text=${encodeURIComponent(
                `Hello from Sri Amman Supermarket delivery partner. I am delivering your order #${bagCode}${
                  order.isForSomeoneElse ? ` (ordered by ${order.customerName})` : ''
                }.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="min-h-[48px] rounded-xl bg-[#047857] hover:bg-[#065F46] active:scale-[0.98] text-white flex items-center justify-center gap-2 text-xs font-bold transition-all select-none"
            >
              <MessageSquare className="w-4 h-4 text-[#97F5CC]" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* Payment & Cash Collection Card */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#475569]">
          Payment &amp; Settlement
        </h3>

        {isCOD ? (
          <div className="p-3.5 rounded-2xl bg-[#FFDCC3] border border-[#FE932C]/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#2F1500]">
                <DollarSign className="w-4 h-4 text-[#FE932C]" />
                <div>
                  <span className="text-xs font-bold block uppercase leading-tight">
                    CASH / UPI ON DELIVERY
                  </span>
                  <span className="text-[10px] text-[#2F1500]/80">
                    {lang === 'ta'
                      ? 'வாடிக்கையாளரிடம் ரொக்கம் வசூலிக்கவும்'
                      : 'Collect from customer before handing over bag'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] bg-[#FE932C] text-[#2F1500] font-black">
                MANDATORY
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl flex justify-between items-center shadow-inner">
              <span className="text-xs font-bold text-[#475569]">Total to Collect:</span>
              <span className="font-mono text-2xl font-black text-[#2F1500]">
                ₹{order.total}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCashCollected(!cashCollected)}
                className={`min-h-[48px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                  cashCollected
                    ? 'bg-[#143B0D] text-white border-[#143B0D]'
                    : 'bg-white text-[#0F172A] border-[#E2E8F0]'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{cashCollected ? '✓ Cash Collected' : 'Mark Cash Done'}</span>
              </button>

              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="min-h-[48px] rounded-xl bg-white hover:bg-[#F8FAF7] text-[#0F172A] border border-[#E2E8F0] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <QrCode className="w-4 h-4 text-[#0047BF]" />
                <span>Show UPI QR</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#F1F9EC] border border-[#76CA3E]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#047857]" />
              <div>
                <span className="text-xs font-bold text-[#002115] block">
                  ALREADY PAID VIA UPI • COLLECT ₹0
                </span>
                <span className="text-[10px] text-[#047857]">
                  No cash collection required at doorstep
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-black text-[#047857]">₹{order.total}</span>
          </div>
        )}
      </section>

      {/* Bag Items Checklist */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#0047BF]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
              Verify Items in Bag ({order.items?.length || 1})
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#047857]">100% Bagged</span>
        </div>

        <div className="space-y-1.5 divide-y divide-[#E2E8F0]">
          {(order.items && order.items.length > 0
            ? order.items
            : [
                {
                  id: 'it-1',
                  productId: 'p-1',
                  nameEn: 'Amman Fresh Items Pack',
                  nameTa: 'மளிகைப் பொருட்கள்',
                  variantLabel: '1 pack',
                  price: order.total,
                  quantity: 1,
                },
              ]
          ).map((item, idx) => (
            <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#0F172A] block leading-snug">
                  {item.nameEn}
                </span>
                <span className="text-[10px] text-[#475569]">
                  {item.nameTa ? `${item.nameTa} • ` : ''}
                  {item.variantLabel}
                </span>
              </div>
              <span className="font-mono font-bold text-[#0F172A] bg-[#F8FAF7] border border-[#E2E8F0] px-2 py-1 rounded-lg">
                x{item.quantity}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* UPI QR Modal Overlay */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 text-center space-y-3.5 relative shadow-2xl">
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-3.5 right-3.5 min-w-[36px] min-h-[36px] rounded-full bg-[#F8FAF7] border border-[#E2E8F0] flex items-center justify-center text-[#475569]"
              aria-label="Close UPI QR modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h4 className="font-black text-sm text-[#0F172A]">Store UPI QR Code</h4>
              <p className="text-[11px] text-[#475569]">Scan with GPay, PhonePe, or Paytm</p>
            </div>

            <div className="p-3 bg-[#F8FAF7] rounded-2xl border border-[#E2E8F0] inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `upi://pay?pa=sriammansupermarket.madurai@icici&pn=Sri%20Amman%20Supermarket&am=${order.total}&cu=INR&tn=Order%20${bagCode}`
                )}`}
                alt="Store UPI QR"
                width={176}
                height={176}
                loading="lazy"
                className="w-44 h-44 object-contain mx-auto"
              />
            </div>

            <div className="font-mono text-base font-black text-[#143B0D]">
              Amount to Pay: ₹{order.total}.00
            </div>

            <button
              onClick={() => {
                setCashCollected(true);
                setQrModalOpen(false);
              }}
              className="w-full min-h-[48px] bg-[#143B0D] hover:bg-[#1E4D12] text-white text-xs font-bold rounded-2xl transition-colors"
            >
              Customer Paid via QR Successfully
            </button>
          </div>
        </div>
      )}

      {/* Delivery Celebration Screen */}
      {celebrationOpen && (
        <div className="fixed inset-0 z-50 bg-[#143B0D] text-white flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-4 ring-8 ring-[#76CA3E]/20">
            <CheckCircle2 className="w-10 h-10 text-[#76CA3E]" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Order Delivered!</h2>
          <p className="text-xs text-[#97F5CC] mt-1 max-w-xs leading-relaxed">
            Payment settled and logged to counter register. Excellent delivery run!
          </p>

          <button
            onClick={() => {
              setCelebrationOpen(false);
              onResetToNext();
            }}
            className="mt-8 min-h-[52px] px-6 rounded-2xl bg-white text-[#143B0D] font-black text-sm shadow-xl flex items-center gap-2 hover:bg-[#F1F9EC] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Pick Up Next Order</span>
          </button>
        </div>
      )}

      {/* Sticky Bottom Primary Action Bar (Touch targets >= 48px, pb-safe) */}
      <RiderStickyActionBar>
        {order.status < 2 ? (
          <button
            onClick={handleStartPickup}
            disabled={submitting}
            className="w-full min-h-[52px] rounded-2xl bg-[#143B0D] hover:bg-[#1E4D12] active:scale-[0.98] text-white font-bold text-sm flex items-center justify-between px-4 shadow-lg transition-all disabled:opacity-60"
          >
            <div className="flex items-center gap-2.5">
              <Bike className="w-5 h-5 text-[#76CA3E]" />
              <div className="text-left">
                <span className="block font-black leading-tight text-xs sm:text-sm">
                  1. Confirm Bag Pickup &amp; Start Ride
                </span>
                <span className="text-[10px] text-[#76CA3E]">
                  {lang === 'ta' ? 'அலுவலகத்திலிருந்து கிளம்பு' : 'Depart from store dock'}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl font-mono text-[11px] font-black bg-[#76CA3E] text-[#143B0D]">
              START
            </span>
          </button>
        ) : order.status === 2 ? (
          <SlideToConfirm
            onConfirm={handleConfirmDelivery}
            label={
              isCOD && !cashCollected
                ? 'Slide to confirm cash & deliver'
                : 'Slide to confirm delivery'
            }
            confirmedLabel="Delivery Confirmed & Settled"
            disabled={submitting}
          />
        ) : (
          <button
            onClick={onResetToNext}
            className="w-full min-h-[50px] rounded-2xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Pick Up Next Order</span>
          </button>
        )}
      </RiderStickyActionBar>
    </div>
  );
};
