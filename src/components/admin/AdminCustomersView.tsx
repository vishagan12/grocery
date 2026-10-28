'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  MessageSquare,
  ShoppingBag,
  IndianRupee,
  Calendar,
  MapPin,
  ExternalLink,
  Crown,
  ChevronRight,
  Clock,
  CheckCircle2,
  Package,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { StatCard } from '../ui/StatCard';
import { SearchInput, Select } from '../ui/FormControls';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { SideDrawer } from '../ui/Overlays';
import { Avatar, KeyValueList, EmptyState } from '../ui/Miscellaneous';

export interface CustomerOrderSummary {
  id: string;
  total: number;
  status: number;
  paymentMethod: string;
  createdAt: string;
  itemsCount: number;
  itemsDescription?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  orders: CustomerOrderSummary[];
}

export interface AdminCustomersViewProps {
  orders: any[];
  onSelectOrder?: (orderId: string) => void;
}

export const AdminCustomersView: React.FC<AdminCustomersViewProps> = ({
  orders = [],
  onSelectOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSegment, setFilterSegment] = useState<'all' | 'vip' | 'regular' | 'new'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Derive unique customer profiles from all historical & live orders
  const customers: CustomerRecord[] = useMemo(() => {
    const map = new Map<string, CustomerRecord>();

    orders.forEach((o) => {
      const phone = (o.phone || '').trim();
      const name = (o.customerName || 'Valued Customer').trim();
      const key = phone || name;
      if (!key) return;

      const orderSummary: CustomerOrderSummary = {
        id: o.id,
        total: Number(o.total || 0),
        status: typeof o.status === 'number' ? o.status : 0,
        paymentMethod: o.paymentMethod || 'cod',
        createdAt: o.createdAt || new Date().toISOString(),
        itemsCount: Array.isArray(o.items) ? o.items.length : 1,
        itemsDescription: Array.isArray(o.items)
          ? o.items.map((i: any) => `${i.productNameEn || i.productId} (${i.quantity || 1})`).join(', ')
          : undefined,
      };

      if (!map.has(key)) {
        map.set(key, {
          id: `cust-${key.replace(/[^a-zA-Z0-9]/g, '')}`,
          name,
          phone: phone || 'No phone recorded',
          address: (o.address || 'Madurai').trim(),
          totalOrders: 1,
          totalSpent: Number(o.total || 0),
          lastOrderDate: o.createdAt || new Date().toISOString(),
          orders: [orderSummary],
        });
      } else {
        const existing = map.get(key)!;
        existing.totalOrders += 1;
        existing.totalSpent += Number(o.total || 0);
        existing.orders.push(orderSummary);

        // Update with most recent date & address if newer
        if (new Date(orderSummary.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = orderSummary.createdAt;
          if (o.address) existing.address = o.address.trim();
          if (name && name !== 'Valued Customer') existing.name = name;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = customers.length;
    const vipCount = customers.filter((c) => c.totalSpent >= 2500 || c.totalOrders >= 4).length;
    const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);
    const avgSpend = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;

    return { totalCount, vipCount, totalRevenue, avgSpend };
  }, [customers]);

  // Filtered customer records
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // Segment filter
      if (filterSegment === 'vip') return c.totalSpent >= 2500 || c.totalOrders >= 4;
      if (filterSegment === 'regular') return c.totalOrders >= 2 && c.totalSpent < 2500;
      if (filterSegment === 'new') return c.totalOrders === 1;

      return true;
    });
  }, [customers, searchQuery, filterSegment]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Customer Directory & Profiles"
        subtitle="Manage customer relationships, view order histories, and trigger direct WhatsApp/Call communications."
        badge={{
          label: `${customers.length} Patrons`,
          variant: 'primary',
        }}
      />

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Registered Patrons"
          value={metrics.totalCount}
          icon={<Users className="w-5 h-5 text-[#143B0D]" />}
          description="Unique buyers in database"
        />
        <StatCard
          label="VIP Frequent Shoppers"
          value={metrics.vipCount}
          icon={<Crown className="w-5 h-5 text-[#D97706]" />}
          description="Placed 4+ orders or ₹2,500+"
        />
        <StatCard
          label="Total Customer Lifetime Spend"
          value={`₹${metrics.totalRevenue.toLocaleString('en-IN')}`}
          icon={<IndianRupee className="w-5 h-5 text-[#047857]" />}
          description="Cumulative store revenue"
        />
        <StatCard
          label="Average Lifetime Value"
          value={`₹${metrics.avgSpend.toLocaleString('en-IN')}`}
          icon={<TrendingUp className="w-5 h-5 text-[#0047BF]" />}
          description="Per customer average"
        />
      </div>

      {/* Controls Bar: Search & Segmentation */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchInput
            placeholder="Search by patron name, phone number, or locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterSegment('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterSegment === 'all'
                ? 'bg-[#143B0D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Patrons ({customers.length})
          </button>
          <button
            onClick={() => setFilterSegment('vip')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              filterSegment === 'vip'
                ? 'bg-[#D97706] text-white shadow-xs'
                : 'bg-amber-50 text-[#78350F] hover:bg-amber-100 border border-[#FE932C]/30'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            VIP Regulars ({metrics.vipCount})
          </button>
          <button
            onClick={() => setFilterSegment('regular')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterSegment === 'regular'
                ? 'bg-[#143B0D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Repeat Buyers
          </button>
          <button
            onClick={() => setFilterSegment('new')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterSegment === 'new'
                ? 'bg-[#143B0D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            First-time Buyers
          </button>
        </div>
      </div>

      {/* Customers Data Table (Desktop) / Cards (Mobile) */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          title="No customers match your criteria"
          description="Try clearing search filters or checking phone number spelling."
          action={
            searchQuery ? (
              <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                Clear Search Filter
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAF7] border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Primary Address / Area</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3.5 px-4 text-right">Last Order</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCustomers.map((c) => {
                  const isVip = c.totalSpent >= 2500 || c.totalOrders >= 4;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#F8FAF7]/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedCustomer(c)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} size="md" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#0F172A] group-hover:text-[#143B0D] transition-colors truncate">
                                {c.name}
                              </span>
                              {isVip && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#78350F] text-[10px] font-extrabold border border-[#FE932C]/30">
                                  <Crown className="w-2.5 h-2.5 text-[#D97706]" />
                                  VIP
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 block truncate font-mono">
                              ID: {c.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-700">
                            {c.phone}
                          </span>
                          {c.phone && c.phone !== 'No phone recorded' && (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <a
                                href={`tel:${c.phone}`}
                                title="Call customer"
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-[#F1F9EC] hover:text-[#143B0D] flex items-center justify-center text-slate-600 transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`https://wa.me/91${c.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat on WhatsApp"
                                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-[#047857] flex items-center justify-center text-slate-600 transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-slate-600 truncate flex items-center gap-1.5" title={c.address}>
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-800 font-mono">
                          {c.totalOrders}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-[#0F172A] tabular-nums">
                          ₹{c.totalSpent.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(c.lastOrderDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(c);
                          }}
                        >
                          View History
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredCustomers.map((c) => {
              const isVip = c.totalSpent >= 2500 || c.totalOrders >= 4;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className="p-4 active:bg-[#F8FAF7] transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={c.name} size="sm" />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#0F172A] truncate flex items-center gap-1.5">
                          {c.name}
                          {isVip && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#FEF3C7] text-[#78350F] text-[9px] font-extrabold border border-[#FE932C]/30">
                              VIP
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">{c.phone}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="block font-mono font-bold text-sm text-[#0F172A]">
                        ₹{c.totalSpent.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.totalOrders} {c.totalOrders === 1 ? 'order' : 'orders'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 truncate flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{c.address}</span>
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {c.phone && c.phone !== 'No phone recorded' && (
                        <>
                          <a
                            href={`tel:${c.phone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-[#F1F9EC]"
                          >
                            <Phone className="w-3 h-3 text-[#143B0D]" /> Call
                          </a>
                          <a
                            href={`https://wa.me/91${c.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#047857] font-bold border border-emerald-200/50"
                          >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </a>
                        </>
                      )}
                    </div>

                    <span className="text-xs text-[#143B0D] font-bold flex items-center gap-1">
                      History <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Detail & Order History SideDrawer */}
      <SideDrawer
        isOpen={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || 'Customer Profile'}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Summary Card */}
            <div className="p-4 rounded-2xl bg-[#F8FAF7] border border-slate-200 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedCustomer.name} size="lg" />
                  <div>
                    <h3 className="text-base font-extrabold text-[#0F172A] flex items-center gap-2">
                      {selectedCustomer.name}
                      {selectedCustomer.totalSpent >= 2500 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#78350F] text-[10px] font-extrabold border border-[#FE932C]/30 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-[#D97706]" /> VIP Patron
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Account ID: {selectedCustomer.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Communication Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#F1F9EC] hover:text-[#143B0D] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#143B0D]" /> Call Customer
                </a>
                <a
                  href={`https://wa.me/91${selectedCustomer.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[#047857] font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp Direct
                </a>
              </div>

              {/* Address Box */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Primary Delivery Location
                </span>
                <p className="text-slate-700 font-medium leading-relaxed flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{selectedCustomer.address}</span>
                </p>
              </div>

              {/* Patron Statistics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block font-mono">Total Orders</span>
                  <span className="text-base font-extrabold text-[#0F172A] font-mono">
                    {selectedCustomer.totalOrders}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block font-mono">Total Spent</span>
                  <span className="text-base font-extrabold text-[#143B0D] font-mono">
                    ₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block font-mono">Avg / Order</span>
                  <span className="text-base font-extrabold text-[#0F172A] font-mono">
                    ₹{Math.round(selectedCustomer.totalSpent / Math.max(1, selectedCustomer.totalOrders))}
                  </span>
                </div>
              </div>
            </div>

            {/* Complete Order History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-[#0F172A] flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#143B0D]" />
                  <span>Order History ({selectedCustomer.orders.length})</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">Most recent first</span>
              </div>

              <div className="space-y-3">
                {selectedCustomer.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#76CA3E]/50 transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{ord.id.slice(-6).toUpperCase()}
                        </span>
                        <StatusBadge
                          status={
                            ord.status === 0
                              ? 'new'
                              : ord.status === 1
                              ? 'packing'
                              : ord.status === 2
                              ? 'out_for_delivery'
                              : ord.status === 3
                              ? 'delivered'
                              : 'cancelled'
                          }
                          size="sm"
                        />
                      </div>

                      <span className="font-mono font-extrabold text-sm text-[#0F172A]">
                        ₹{ord.total}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(ord.createdAt).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {ord.paymentMethod}
                      </span>
                    </div>

                    {ord.itemsDescription && (
                      <p className="text-xs text-slate-600 line-clamp-2 bg-[#F8FAF7] p-2 rounded-lg font-mono text-[11px] border border-slate-100">
                        {ord.itemsDescription}
                      </p>
                    )}

                    {onSelectOrder && (
                      <div className="mt-2 text-right">
                        <button
                          onClick={() => {
                            setSelectedCustomer(null);
                            onSelectOrder(ord.id);
                          }}
                          className="text-xs font-bold text-[#143B0D] hover:underline inline-flex items-center gap-1"
                        >
                          View in Live Dispatch <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  );
};
