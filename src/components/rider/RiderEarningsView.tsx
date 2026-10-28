'use client';

import React, { useState } from 'react';
import {
  IndianRupee,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { RiderSession } from './RiderAuthView';
import { RiderOrder } from './RiderHomeView';

export interface RiderEarningsViewProps {
  session: RiderSession;
  orders: RiderOrder[];
  lang?: 'en' | 'ta';
  onDepositConfirmed?: () => void;
}

export const RiderEarningsView: React.FC<RiderEarningsViewProps> = ({
  session,
  orders,
  lang = 'en',
  onDepositConfirmed,
}) => {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositDone, setDepositDone] = useState(false);

  // Delivered orders for this rider
  const deliveredOrders = orders.filter(
    (o) => o.status === 3 && (!o.assignedRiderPhone || o.assignedRiderPhone === session.phone)
  );

  // Calculation rules:
  // Base delivery payout: ₹40 per completed delivery
  // Distance bonus: ₹10 extra if distance > 2.5 km
  const todayTrips = deliveredOrders.length;
  const tripPayouts = deliveredOrders.reduce((acc, curr) => {
    const base = 40;
    const distanceBonus = curr.distanceKm > 2.5 ? 10 : 0;
    return acc + base + distanceBonus;
  }, 0);

  // COD Cash collected (Money in rider's pocket that must be handed over to store cashier)
  const codCashToHandIn = deliveredOrders
    .filter((o) => o.paymentMethod === 'cod')
    .reduce((acc, curr) => acc + curr.total, 0);

  // Weekly estimated earnings (simulated historical + today)
  const weeklyEstimatedEarnings = 2840 + tripPayouts;

  const handleHandoverDeposit = () => {
    setDepositSubmitting(true);
    setTimeout(() => {
      setDepositSubmitting(false);
      setDepositDone(true);
      setDepositModalOpen(false);
      if (onDepositConfirmed) onDepositConfirmed();
    }, 500);
  };

  return (
    <div className="space-y-4 pb-28 font-sans max-w-md mx-auto">
      {/* Top Title & Shift Summary */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
            {lang === 'ta' ? 'வருமானம் & ரொக்கம்' : 'Earnings & Cash'}
          </h2>
          <span className="text-xs text-[#475569]">
            {lang === 'ta' ? 'இன்றைய ஷிப்ட் கணக்கு' : "Today's shift settlement breakdown"}
          </span>
        </div>
        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-[#F1F9EC] border border-[#76CA3E]/30 text-[#143B0D]">
          {todayTrips} {lang === 'ta' ? 'பயணங்கள்' : 'Trips Done'}
        </span>
      </div>

      {/* DUAL SUMMARY CARDS: Rider Payout vs Counter Cash to Deposit */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Card 1: Rider's Own Earnings (Net Payout) */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider block">
              {lang === 'ta' ? 'உங்கள் வருமானம்' : 'My Payout'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#F1F9EC] flex items-center justify-center text-[#143B0D]">
              <TrendingUp className="w-4 h-4 text-[#047857]" />
            </div>
          </div>

          <div>
            <div className="font-mono text-2xl font-black text-[#143B0D] tracking-tight">
              ₹{tripPayouts}
            </div>
            <span className="text-[10px] text-[#475569] font-medium block mt-0.5">
              ₹40/drop + distance
            </span>
          </div>

          <div className="pt-1.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
            <span className="text-[#475569] font-medium">This Week</span>
            <span className="font-mono font-bold text-[#0F172A]">₹{weeklyEstimatedEarnings}</span>
          </div>
        </div>

        {/* Card 2: Store COD Cash in Hand (To Deposit) */}
        <div className="p-4 rounded-2xl bg-[#FFDCC3]/40 border border-[#FE932C]/40 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#2F1500] uppercase tracking-wider block">
              {lang === 'ta' ? 'கவுண்டர் ரொக்கம்' : 'Store COD Cash'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#FFDCC3] flex items-center justify-center text-[#2F1500]">
              <Wallet className="w-4 h-4 text-[#FE932C]" />
            </div>
          </div>

          <div>
            <div className="font-mono text-2xl font-black text-[#2F1500] tracking-tight">
              ₹{depositDone ? 0 : codCashToHandIn}
            </div>
            <span className="text-[10px] text-[#2F1500]/80 font-medium block mt-0.5">
              {depositDone
                ? 'Handed to cashier'
                : lang === 'ta'
                ? 'அலுவலகத்தில் ஒப்படைக்கவும்'
                : 'Deposit at counter'}
            </span>
          </div>

          <div className="pt-1.5 border-t border-[#FE932C]/30 flex items-center justify-between text-[11px]">
            <span className="text-[#2F1500] font-medium">Status</span>
            <span
              className={`font-bold font-mono text-[10px] px-1.5 py-0.2 rounded ${
                depositDone
                  ? 'bg-[#97F5CC] text-[#002115]'
                  : codCashToHandIn > 0
                  ? 'bg-[#FE932C] text-[#2F1500]'
                  : 'bg-white text-slate-700'
              }`}
            >
              {depositDone ? 'SETTLED' : codCashToHandIn > 0 ? 'DUE NOW' : 'NIL'}
            </span>
          </div>
        </div>
      </div>

      {/* COUNTER DEPOSIT HANDOVER ACTION BOX */}
      {!depositDone && codCashToHandIn > 0 && (
        <section className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-sm space-y-3">
          <div className="flex items-start gap-2.5">
            <Receipt className="w-5 h-5 text-[#FE932C] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                {lang === 'ta'
                  ? 'கவுண்டர் ரொக்க ஒப்படைப்பு'
                  : 'Counter Cash Handover Verification'}
              </h3>
              <p className="text-[11px] text-[#475569] leading-snug mt-0.5">
                {lang === 'ta'
                  ? 'வசூலிக்கப்பட்ட ₹' + codCashToHandIn + ' ரொக்கத்தை ஸ்டோர் கேஷியரிடம் ஒப்படைத்து சரிபார்க்கவும்.'
                  : 'Hand in collected ₹' + codCashToHandIn + ' cash to store cashier at dispatch counter.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDepositModalOpen(true)}
            className="w-full min-h-[48px] rounded-xl bg-[#143B0D] hover:bg-[#1E4D12] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all select-none"
          >
            <ShieldCheck className="w-4 h-4 text-[#76CA3E]" />
            <span>
              {lang === 'ta'
                ? 'கேஷியரிடம் ஒப்படைத்ததை உறுதிசெய்'
                : 'Confirm Handover to Store Cashier'}
            </span>
          </button>
        </section>
      )}

      {/* SETTLED CONFIRMATION PILL (if settled) */}
      {depositDone && (
        <div className="p-3.5 rounded-2xl bg-[#F1F9EC] border border-[#76CA3E]/30 text-[#143B0D] flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#047857]" />
            <span>
              {lang === 'ta'
                ? 'இன்றைய ரொக்கம் கேஷியரிடம் வெற்றிகரமாக ஒப்படைக்கப்பட்டது.'
                : "Today's collected cash settled with cashier."}
            </span>
          </div>
          <span className="font-mono text-[10px] bg-[#76CA3E] text-[#143B0D] px-2 py-0.5 rounded-md">
            VERIFIED
          </span>
        </div>
      )}

      {/* TODAY'S COMPLETED TRIPS BREAKDOWN */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
            {lang === 'ta' ? 'இன்றைய பயணங்கள் விபரம்' : "Today's Completed Trips"}
          </h3>
          <span className="font-mono text-xs text-[#475569] font-bold">
            {deliveredOrders.length} trips
          </span>
        </div>

        {deliveredOrders.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#F1F9EC] mx-auto flex items-center justify-center text-[#143B0D]">
              <Clock className="w-5 h-5 text-[#76CA3E]" />
            </div>
            <p className="text-xs text-[#475569]">
              {lang === 'ta'
                ? 'இன்று இன்னும் டெலிவரிகள் முடிக்கப்படவில்லை.'
                : 'No deliveries completed yet today.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 divide-y divide-[#E2E8F0]">
            {deliveredOrders.map((ord, idx) => {
              const bagNum = ord.id.replace(/\D/g, '').slice(-4) || ord.id.slice(-4);
              const tripFee = 40 + (ord.distanceKm > 2.5 ? 10 : 0);

              return (
                <div
                  key={ord.id}
                  className="pt-2.5 first:pt-0 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-[#047857] text-white font-mono font-black text-[10px]">
                        BAG #{bagNum}
                      </span>
                      <span className="font-bold text-[#0F172A] truncate max-w-[130px]">
                        {ord.recipientName || ord.customerName}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#475569] block">
                      {ord.distanceKm} km •{' '}
                      {ord.paymentMethod === 'cod' ? `COD collected ₹${ord.total}` : 'Prepaid UPI'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-[#047857] block">
                      +₹{tripFee}
                    </span>
                    <span className="text-[9px] text-[#94A3B8] font-mono">
                      {ord.distanceKm > 2.5 ? '₹40+₹10' : '₹40 flat'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* WEEKLY PAYOUT POLICY FAQ */}
      <section className="p-3.5 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0] space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#143B0D]">
          <HelpCircle className="w-3.5 h-3.5 text-[#047857]" />
          <span>Amman Partner Settlement Schedule</span>
        </div>
        <p className="text-[11px] text-[#475569] leading-relaxed">
          Rider trip earnings are deposited directly to your registered bank account every Monday.
          Daily collected cash must be handed over at the counter before closing shift.
        </p>
      </section>

      {/* MODAL: Cash Handover Confirmation */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#FFDCC3] mx-auto flex items-center justify-center text-[#2F1500]">
              <Wallet className="w-6 h-6 text-[#FE932C]" />
            </div>

            <div>
              <h4 className="text-base font-black text-[#0F172A]">
                Confirm Cash Handover
              </h4>
              <p className="text-xs text-[#475569] mt-1">
                Are you physically handing over ₹{codCashToHandIn} in cash to the store counter cashier?
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0] font-mono font-black text-xl text-[#2F1500]">
              ₹{codCashToHandIn}.00
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDepositModalOpen(false)}
                className="min-h-[44px] rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={depositSubmitting}
                onClick={handleHandoverDeposit}
                className="min-h-[44px] rounded-xl bg-[#143B0D] hover:bg-[#1E4D12] text-white text-xs font-bold"
              >
                {depositSubmitting ? 'Confirming...' : 'Yes, Handed In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
