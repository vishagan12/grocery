'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Phone,
  Navigation,
  ArrowRight,
  Filter,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { RiderOrder } from './RiderHomeView';

export interface RiderOrdersListViewProps {
  orders: RiderOrder[];
  onSelectOrder: (order: RiderOrder) => void;
  onRefresh: () => void;
  isSyncing?: boolean;
  lang?: 'en' | 'ta';
}

export const RiderOrdersListView: React.FC<RiderOrdersListViewProps> = ({
  orders,
  onSelectOrder,
  onRefresh,
  isSyncing = false,
  lang = 'en',
}) => {
  const [selectedTab, setSelectedTab] = useState<'ready' | 'active' | 'delivered'>('ready');
  const [searchQuery, setSearchQuery] = useState('');

  // Segment counts
  const readyCount = useMemo(
    () => orders.filter((o) => o.status === 0 || o.status === 1).length,
    [orders]
  );
  const activeCount = useMemo(() => orders.filter((o) => o.status === 2).length, [orders]);
  const deliveredCount = useMemo(() => orders.filter((o) => o.status === 3).length, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Tab match
      if (selectedTab === 'ready' && !(o.status === 0 || o.status === 1)) return false;
      if (selectedTab === 'active' && o.status !== 2) return false;
      if (selectedTab === 'delivered' && o.status !== 3) return false;

      // Query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const bagNum = o.id.replace(/\D/g, '');
        const name = (o.recipientName || o.customerName).toLowerCase();
        const phone = o.phone.toLowerCase();
        const addr = o.address.toLowerCase();
        return bagNum.includes(q) || name.includes(q) || phone.includes(q) || addr.includes(q);
      }

      return true;
    });
  }, [orders, selectedTab, searchQuery]);

  return (
    <div className="space-y-3.5 pb-24 font-sans max-w-md mx-auto">
      {/* Header with Title and Refresh */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-black text-[#0F172A] tracking-tight">
            {lang === 'ta' ? 'ஆர்டர்கள் பட்டியல்' : 'Delivery Runs'}
          </h2>
          <span className="text-xs text-[#475569]">
            {orders.length} {lang === 'ta' ? 'மொத்த ஆர்டர்கள்' : 'total dispatches logged'}
          </span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isSyncing}
          className="min-h-[44px] px-3 rounded-xl bg-[#F1F9EC] hover:bg-[#76CA3E]/20 text-[#143B0D] text-xs font-bold flex items-center gap-1.5 transition-colors"
          aria-label="Refresh orders list"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
        </button>
      </div>

      {/* Segmented Tab Filter Bar (Touch targets >= 48px) */}
      <div
        role="tablist"
        aria-label="Order status tabs"
        className="grid grid-cols-3 gap-1.5 bg-[#EAEFE7] p-1.5 rounded-2xl"
      >
        <button
          role="tab"
          aria-selected={selectedTab === 'ready'}
          onClick={() => setSelectedTab('ready')}
          className={`min-h-[48px] rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
            selectedTab === 'ready'
              ? 'bg-white text-[#143B0D] shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          <span>{lang === 'ta' ? 'கவுண்டர்' : 'At Store'}</span>
          <span className="font-mono text-[10px] font-black text-[#0047BF]">({readyCount})</span>
        </button>

        <button
          role="tab"
          aria-selected={selectedTab === 'active'}
          onClick={() => setSelectedTab('active')}
          className={`min-h-[48px] rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
            selectedTab === 'active'
              ? 'bg-white text-[#143B0D] shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          <span>{lang === 'ta' ? 'பயணத்தில்' : 'On Bike'}</span>
          <span className="font-mono text-[10px] font-black text-[#FE932C]">({activeCount})</span>
        </button>

        <button
          role="tab"
          aria-selected={selectedTab === 'delivered'}
          onClick={() => setSelectedTab('delivered')}
          className={`min-h-[48px] rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
            selectedTab === 'delivered'
              ? 'bg-white text-[#143B0D] shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          <span>{lang === 'ta' ? 'முடிந்தது' : 'Delivered'}</span>
          <span className="font-mono text-[10px] font-black text-[#047857]">
            ({deliveredCount})
          </span>
        </button>
      </div>

      {/* Search Input (Touch Target >= 48px) */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            lang === 'ta'
              ? 'பை எண் / பெயர் / முகவரி தேட...'
              : 'Search bag #, name, locality...'
          }
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

      {/* Order Cards List */}
      {filteredOrders.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-[#F1F9EC] mx-auto flex items-center justify-center text-[#143B0D]">
            <Package className="w-6 h-6 text-[#76CA3E]" />
          </div>
          <h3 className="text-sm font-black text-[#0F172A]">
            {lang === 'ta' ? 'ஆர்டர்கள் எதுவும் இல்லை' : 'No Orders in this Category'}
          </h3>
          <p className="text-xs text-[#475569] max-w-xs mx-auto">
            {searchQuery
              ? 'Try modifying your search term or clear the filter.'
              : selectedTab === 'ready'
              ? 'Store packing counter has no orders waiting right now.'
              : selectedTab === 'active'
              ? 'No active bike delivery mission in transit.'
              : 'No orders marked delivered today yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const bagCode = order.id.replace(/\D/g, '').slice(-4) || order.id.slice(-4);
            const isCOD = order.paymentMethod === 'cod' && order.paymentStatus !== 'paid';

            return (
              <article
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#143B0D] shadow-xs p-4 space-y-3 cursor-pointer transition-all active:scale-[0.99]"
              >
                {/* Top Row: Bag Code, Status Badge, and Payment */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-white font-mono font-black text-xs ${
                        order.status === 2
                          ? 'bg-[#143B0D]'
                          : order.status === 3
                          ? 'bg-[#047857]'
                          : 'bg-[#0047BF]'
                      }`}
                    >
                      BAG #{bagCode}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#475569]">
                      #{order.id.slice(-6)}
                    </span>
                  </div>

                  <span
                    className={`font-mono font-black text-xs px-2.5 py-1 rounded-lg uppercase ${
                      isCOD ? 'bg-[#FFDCC3] text-[#2F1500]' : 'bg-[#97F5CC] text-[#002115]'
                    }`}
                  >
                    {isCOD ? `Collect ₹${order.total}` : 'UPI PAID'}
                  </span>
                </div>

                {/* Recipient / Customer Info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-[#0F172A] tracking-tight truncate max-w-[220px]">
                      {order.recipientName || order.customerName}
                    </h3>
                    <span className="font-mono text-xs font-bold text-[#0F172A]">
                      {order.distanceKm} km
                    </span>
                  </div>

                  {order.isForSomeoneElse && (
                    <span className="inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#FFDCC3] text-[#2F1500]">
                      Ordered for someone else
                    </span>
                  )}

                  <div className="flex items-start gap-1.5 text-xs text-[#475569] pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0047BF] shrink-0 mt-0.5" />
                    <p className="line-clamp-2 leading-relaxed">{order.address}</p>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] text-xs">
                  <span className="font-mono text-[11px] text-[#475569] font-bold">
                    {order.itemCount || 1} items in bag
                  </span>

                  <div className="flex items-center gap-1 text-[#143B0D] font-bold">
                    <span>{lang === 'ta' ? 'விவரங்கள்' : 'Open Mission'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
