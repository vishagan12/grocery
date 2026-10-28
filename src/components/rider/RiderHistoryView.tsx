'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Filter,
  Search,
  Package,
  IndianRupee,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { RiderOrder } from './RiderHomeView';
import { RiderSession } from './RiderAuthView';

export interface RiderHistoryViewProps {
  session: RiderSession;
  orders: RiderOrder[];
  onSelectOrder: (order: RiderOrder) => void;
  lang?: 'en' | 'ta';
}

// Format timestamp in Indian Standard Time (IST)
const formatISTTime = (isoString?: string) => {
  if (!isoString) return 'Today';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '12:00 PM';
  }
};

const getRelativeDay = (isoString?: string, lang: 'en' | 'ta' = 'en') => {
  if (!isoString) return lang === 'ta' ? 'இன்று' : 'Today';
  try {
    const orderDate = new Date(isoString);
    const now = new Date();
    const isSameDay =
      orderDate.getDate() === now.getDate() &&
      orderDate.getMonth() === now.getMonth() &&
      orderDate.getFullYear() === now.getFullYear();

    if (isSameDay) return lang === 'ta' ? 'இன்று (Today)' : 'Today';

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      orderDate.getDate() === yesterday.getDate() &&
      orderDate.getMonth() === yesterday.getMonth() &&
      orderDate.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return lang === 'ta' ? 'நேற்று (Yesterday)' : 'Yesterday';

    return orderDate.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return lang === 'ta' ? 'இன்று' : 'Today';
  }
};

export const RiderHistoryView: React.FC<RiderHistoryViewProps> = ({
  session,
  orders,
  onSelectOrder,
  lang = 'en',
}) => {
  const [filterType, setFilterType] = useState<'all' | 'cod' | 'upi'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Rider's completed delivered orders only
  const historyOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 3 && (!o.assignedRiderPhone || o.assignedRiderPhone === session.phone)
    );
  }, [orders, session.phone]);

  // Filtered orders
  const filtered = useMemo(() => {
    return historyOrders.filter((ord) => {
      if (filterType === 'cod' && ord.paymentMethod !== 'cod') return false;
      if (filterType === 'upi' && ord.paymentMethod !== 'upi') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const bag = ord.id.replace(/\D/g, '');
        const name = (ord.recipientName || ord.customerName).toLowerCase();
        const addr = ord.address.toLowerCase();
        return bag.includes(q) || name.includes(q) || addr.includes(q);
      }

      return true;
    });
  }, [historyOrders, filterType, searchQuery]);

  // Group by day
  const groupedOrders = useMemo(() => {
    const groups: Record<string, RiderOrder[]> = {};
    for (const ord of filtered) {
      const dayKey = getRelativeDay(ord.createdAt, lang);
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(ord);
    }
    return groups;
  }, [filtered, lang]);

  return (
    <div className="space-y-4 pb-28 font-sans max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
            {lang === 'ta' ? 'டெலிவரி வரலாறு' : 'Delivery History'}
          </h2>
          <span className="text-xs text-[#475569]">
            {filtered.length} {lang === 'ta' ? 'முடிக்கப்பட்ட பயணங்கள்' : 'completed drop-offs'}
          </span>
        </div>
        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-[#F1F9EC] border border-[#76CA3E]/30 text-[#143B0D]">
          IST Madurai
        </span>
      </div>

      {/* Filter Tabs (Touch Targets >= 48px) */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#EAEFE7] p-1.5 rounded-2xl">
        <button
          onClick={() => setFilterType('all')}
          className={`min-h-[44px] rounded-xl text-xs font-bold transition-all ${
            filterType === 'all'
              ? 'bg-white text-[#143B0D] shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          {lang === 'ta' ? 'அனைத்தும்' : 'All Trips'} ({historyOrders.length})
        </button>

        <button
          onClick={() => setFilterType('cod')}
          className={`min-h-[44px] rounded-xl text-xs font-bold transition-all ${
            filterType === 'cod'
              ? 'bg-white text-[#143B0D] shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          {lang === 'ta' ? 'ரொக்கம் (COD)' : 'Cash COD'}
        </button>

        <button
          onClick={() => setFilterType('upi')}
          className={`min-h-[44px] rounded-xl text-xs font-bold transition-all ${
            filterType === 'upi'
              ? 'bg-white text-[#143B0D] shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          {lang === 'ta' ? 'முன்பணம் UPI' : 'Prepaid UPI'}
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === 'ta' ? 'பை எண் / முகவரி தேட...' : 'Filter by bag # or locality...'}
          className="w-full h-12 pl-10 pr-4 rounded-xl bg-white border border-[#E2E8F0] focus:border-[#143B0D] focus:ring-2 focus:ring-[#76CA3E]/30 text-xs font-bold text-[#0F172A] placeholder:text-[#94A3B8] outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#475569]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Grouped Day Sections */}
      {Object.keys(groupedOrders).length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F1F9EC] mx-auto flex items-center justify-center text-[#143B0D]">
            <Package className="w-6 h-6 text-[#76CA3E]" />
          </div>
          <h3 className="text-sm font-black text-[#0F172A]">
            {lang === 'ta' ? 'வரலாறு பதிவுகள் எதுவும் இல்லை' : 'No Delivery Records Found'}
          </h3>
          <p className="text-xs text-[#475569] max-w-xs mx-auto">
            {searchQuery
              ? 'Try modifying your search or clearing the active filter.'
              : 'Completed delivery runs will be preserved here in IST timezone for your records.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedOrders).map(([dayLabel, dayOrders]) => (
            <div key={dayLabel} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-[#143B0D]">
                  {dayLabel}
                </span>
                <span className="font-mono text-[10px] font-bold text-[#475569]">
                  {dayOrders.length} drops
                </span>
              </div>

              <div className="space-y-2.5">
                {dayOrders.map((ord) => {
                  const bagCode = ord.id.replace(/\D/g, '').slice(-4) || ord.id.slice(-4);
                  const istTime = formatISTTime(ord.createdAt);
                  const isCOD = ord.paymentMethod === 'cod';

                  return (
                    <article
                      key={ord.id}
                      onClick={() => onSelectOrder(ord)}
                      className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#143B0D] shadow-xs cursor-pointer transition-all active:scale-[0.99] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-[#047857] text-white font-mono font-black text-xs">
                            BAG #{bagCode}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-[#475569]">
                            {istTime}
                          </span>
                        </div>

                        <span
                          className={`font-mono text-xs font-black px-2 py-0.5 rounded-md ${
                            isCOD ? 'bg-[#FFDCC3] text-[#2F1500]' : 'bg-[#97F5CC] text-[#002115]'
                          }`}
                        >
                          {isCOD ? `COD ₹${ord.total}` : 'UPI PAID'}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-[#0F172A] truncate">
                          {ord.recipientName || ord.customerName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-[#475569]">
                          <MapPin className="w-3.5 h-3.5 text-[#0047BF] shrink-0" />
                          <span className="truncate">{ord.address}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-[#047857] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Delivered &amp; Settled</span>
                        </div>

                        <div className="flex items-center gap-1 text-[#143B0D] font-bold text-[11px]">
                          <span>Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
