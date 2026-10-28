'use client';

import React, { useMemo } from 'react';
import {
  TrendingUp,
  PackageCheck,
  Bike,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  ArrowRight,
  IndianRupee,
  CreditCard,
  Banknote,
  Search,
  Download,
  Barcode,
  Layers,
  Store,
  RefreshCw,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import { StatCard } from '../ui/StatCard';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { PageHeader } from './PageHeader';

export interface AdminOrderItem {
  id: string;
  productId: string;
  productNameEn: string;
  productNameTa: string;
  variantLabel: string;
  price: number;
  quantity: number;
}

export interface AdminOrderData {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  distanceKm: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: number;
  createdAt: string;
  isForSomeoneElse?: boolean;
  recipientName?: string;
  recipientPhone?: string;
  assignedRiderName?: string;
  assignedRiderPhone?: string;
  items: AdminOrderItem[];
}

export interface AdminDashboardProps {
  orders: AdminOrderData[];
  lowStockCount: number;
  acceptingOrders: boolean;
  onNavigateSection: (sectionId: string) => void;
  onSelectOrder: (order: AdminOrderData) => void;
  onQuickPackOrder: (orderId: string) => void;
  onPrintOrder: (order: AdminOrderData) => void;
  onExportDaybook: () => void;
  onRefreshData: () => void;
  onTestChime: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  lowStockCount,
  acceptingOrders,
  onNavigateSection,
  onSelectOrder,
  onQuickPackOrder,
  onPrintOrder,
  onExportDaybook,
  onRefreshData,
  onTestChime,
}) => {
  // Aggregate KPIs
  const metrics = useMemo(() => {
    let totalSales = 0;
    let upiSales = 0;
    let upiCount = 0;
    let codSales = 0;
    let codCount = 0;

    let newOrders = 0; // status 0
    let baggedOrders = 0; // status 1
    let onRouteOrders = 0; // status 2
    let deliveredOrders = 0; // status 3

    for (const o of orders) {
      totalSales += o.total;
      if (o.paymentMethod === 'upi') {
        upiSales += o.total;
        upiCount++;
      } else {
        codSales += o.total;
        codCount++;
      }

      if (o.status === 0) newOrders++;
      else if (o.status === 1) baggedOrders++;
      else if (o.status === 2) onRouteOrders++;
      else if (o.status === 3) deliveredOrders++;
    }

    return {
      totalSales,
      upiSales,
      upiCount,
      codSales,
      codCount,
      newOrders,
      baggedOrders,
      onRouteOrders,
      deliveredOrders,
      activeQueue: newOrders + baggedOrders + onRouteOrders,
    };
  }, [orders]);

  // Hourly / Velocity Activity Mock from Real Orders (grouped into 4 fulfillment windows)
  const fulfillmentWindows = useMemo(() => {
    const morning = orders.filter((o) => {
      const h = new Date(o.createdAt).getHours();
      return h >= 6 && h < 12;
    }).length;
    const afternoon = orders.filter((o) => {
      const h = new Date(o.createdAt).getHours();
      return h >= 12 && h < 16;
    }).length;
    const evening = orders.filter((o) => {
      const h = new Date(o.createdAt).getHours();
      return h >= 16 && h < 20;
    }).length;
    const night = orders.filter((o) => {
      const h = new Date(o.createdAt).getHours();
      return h >= 20 || h < 6;
    }).length;

    const max = Math.max(1, morning, afternoon, evening, night);
    return [
      { label: 'Morning (6-12)', count: morning, heightPct: Math.round((morning / max) * 100) },
      { label: 'Noon (12-16)', count: afternoon, heightPct: Math.round((afternoon / max) * 100) },
      { label: 'Rush Evening (16-20)', count: evening, heightPct: Math.round((evening / max) * 100) },
      { label: 'Night (20-24)', count: night, heightPct: Math.round((night / max) * 100) },
    ];
  }, [orders]);

  // Urgent Orders List (New or Bagged awaiting delivery)
  const urgentOrders = useMemo(() => {
    return orders.filter((o) => o.status === 0 || o.status === 1).slice(0, 6);
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Store Status & Refresh */}
      <PageHeader
        title="Store Command Center"
        description="Madurai Fulfillment Hub • Real-time dispatch, inventory alerts, and instant cashier settlements."
        badge={
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold select-none ${
              acceptingOrders
                ? 'bg-[#97F5CC] text-[#002115] border border-[#047857]/30'
                : 'bg-[#FFDAD6] text-[#410002] border border-[#BA1A1A]/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                acceptingOrders ? 'bg-[#047857] animate-pulse' : 'bg-[#BA1A1A]'
              }`}
            />
            {acceptingOrders ? 'STORE ACCEPTING ORDERS' : 'STORE PAUSED'}
          </span>
        }
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshData}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        }
        primaryAction={
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigateSection('orders')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="right"
          >
            Open Dispatch Queue
          </Button>
        }
      />

      {/* 2. Urgent Attention Task Cards (Find critical items within 5 seconds) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Task 1: New Incoming Orders */}
        <div
          onClick={() => onNavigateSection('orders')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            metrics.newOrders > 0
              ? 'bg-[#FFDCC3]/40 border-[#FE932C] hover:bg-[#FFDCC3]/60 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
              Needs Packing
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFDCC3] text-[#2F1500] flex items-center justify-center font-bold">
              <Printer className="w-4 h-4 text-[#FE932C]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {metrics.newOrders}
            </span>
            <span className="text-xs font-bold text-[#FE932C] hover:underline flex items-center gap-1">
              Pack &amp; Bag <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Incoming orders awaiting dock packing</p>
        </div>

        {/* Task 2: Bagged Orders Awaiting Rider */}
        <div
          onClick={() => onNavigateSection('orders')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            metrics.baggedOrders > 0
              ? 'bg-[#DBE1FF]/40 border-[#0047BF] hover:bg-[#DBE1FF]/60 shadow-xs'
              : 'bg-white border-slate-200/90 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
              At Dock / Ready
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#DBE1FF] text-[#00174B] flex items-center justify-center font-bold">
              <PackageCheck className="w-4 h-4 text-[#0047BF]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {metrics.baggedOrders}
            </span>
            <span className="text-xs font-bold text-[#0047BF] hover:underline flex items-center gap-1">
              Dispatch Rider <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Bagged with 4-digit code ready for bike pickup</p>
        </div>

        {/* Task 3: On Route Deliveries */}
        <div
          onClick={() => onNavigateSection('orders')}
          className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
              On Bike Transit
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#97F5CC] text-[#002115] flex items-center justify-center font-bold">
              <Bike className="w-4 h-4 text-[#047857]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {metrics.onRouteOrders}
            </span>
            <span className="text-xs font-bold text-[#047857] flex items-center gap-1">
              Active Transit
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Riders en route within 3.0 km store geofence</p>
        </div>

        {/* Task 4: Low Buffer Stock Warning (<5 Units) */}
        <div
          onClick={() => onNavigateSection('stock')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            lowStockCount > 0
              ? 'bg-[#FFDAD6]/30 border-[#BA1A1A]/40 hover:bg-[#FFDAD6]/50 shadow-xs'
              : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
              Stock Warnings
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFDAD6] text-[#410002] flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4 text-[#BA1A1A]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
              {lowStockCount}
            </span>
            <span className="text-xs font-bold text-[#BA1A1A] hover:underline flex items-center gap-1">
              Adjust Buffer <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Products with &lt; 5 units remaining in aisles</p>
        </div>
      </div>

      {/* 3. Financial Metrics & Velocity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Stat Cards & Revenue Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="Today's Total Sales"
              value={`₹${metrics.totalSales.toLocaleString('en-IN')}`}
              icon={<IndianRupee className="w-4 h-4 text-[#143B0D]" />}
              subtext={`${orders.length} total orders placed today`}
            />
            <StatCard
              label="UPI Online Settled"
              value={`₹${metrics.upiSales.toLocaleString('en-IN')}`}
              icon={<CreditCard className="w-4 h-4 text-[#047857]" />}
              subtext={`${metrics.upiCount} paid via dynamic UPI QR`}
            />
            <StatCard
              label="COD Cash Collect"
              value={`₹${metrics.codSales.toLocaleString('en-IN')}`}
              icon={<Banknote className="w-4 h-4 text-[#FE932C]" />}
              subtext={`${metrics.codCount} orders cash pending`}
            />
          </div>

          {/* Quick Operations Strip */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                Quick Actions:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onExportDaybook}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Export Daybook CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigateSection('gayoo')}
                icon={<Barcode className="w-3.5 h-3.5" />}
              >
                Gayoo POS Sync
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onTestChime}
                icon={<Volume2 className="w-3.5 h-3.5" />}
              >
                Test Chime
              </Button>
              <a
                href="/rider"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Bike className="w-3.5 h-3.5 text-[#047857]" />
                <span>Rider View</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Hourly Velocity Chart (Frozen Palette Only) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Today&apos;s Order Velocity</h3>
              <span className="text-[10px] font-mono font-bold text-[#143B0D] bg-[#F1F9EC] px-2 py-0.5 rounded">
                EXPRESS 3 KM
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Fulfillment surge by time of day</p>

            {/* Custom Bar Visualizer using Frozen Palette Colors */}
            <div className="mt-6 flex items-end justify-between gap-3 h-36 px-2 pb-2 border-b border-slate-100">
              {fulfillmentWindows.map((win, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-mono font-bold text-slate-600 tabular-nums">
                    {win.count}
                  </span>
                  <div className="w-full max-w-[40px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-24">
                    <div
                      style={{ height: `${Math.max(12, win.heightPct)}%` }}
                      className={`w-full transition-all duration-300 rounded-t-lg ${
                        idx === 2 ? 'bg-[#76CA3E]' : 'bg-[#143B0D]'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 pt-2 font-medium">
              <span>Morning</span>
              <span>Noon</span>
              <span className="font-bold text-slate-900">Rush Hr</span>
              <span>Night</span>
            </div>
          </div>

          <div className="pt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 mt-4">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#047857]" /> Avg. Dock Prep SLA
            </span>
            <span className="font-mono font-bold text-slate-800">4.2 mins</span>
          </div>
        </div>
      </div>

      {/* 4. Urgent Orders Quick Dispatch Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Active Dispatch Floor</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Orders requiring kitchen packing or dock rider handoff
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateSection('orders')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
            iconPosition="right"
          >
            View All {orders.length} Orders
          </Button>
        </div>

        {urgentOrders.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F1F9EC] text-[#143B0D] flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">Dispatch Floor Clean</p>
            <p className="text-xs text-slate-400 mt-0.5">
              No pending orders waiting for packing right now.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {urgentOrders.map((ord) => {
              const bagPin = ord.id.replace(/\D/g, '').slice(-4) || 'BAG';

              return (
                <div
                  key={ord.id}
                  className="p-3.5 sm:p-4 hover:bg-[#F8FAF7] transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Status Pill */}
                    <div className="mt-0.5 shrink-0">
                      <StatusBadge status={ord.status as any} size="sm" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {ord.id}
                        </span>
                        {ord.status === 1 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#0047BF] text-white tracking-wider">
                            BAG #{bagPin}
                          </span>
                        )}
                        {ord.isForSomeoneElse && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FFDCC3] text-[#2F1500]">
                            Recipient Order
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 truncate">
                        {ord.isForSomeoneElse
                          ? `Recipient: ${ord.recipientName} (by ${ord.customerName})`
                          : ord.customerName}{' '}
                        • {ord.phone}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {ord.address} • {ord.distanceKm} km • {ord.items.length} items
                      </p>
                    </div>
                  </div>

                  {/* Actions & Total */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-slate-900 block tabular-nums">
                        ₹{ord.total}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                        {ord.paymentMethod.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {ord.status === 0 && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onQuickPackOrder(ord.id)}
                          icon={<PackageCheck className="w-3.5 h-3.5" />}
                        >
                          Pack &amp; Bag
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPrintOrder(ord)}
                        icon={<Printer className="w-3.5 h-3.5" />}
                        title="Print 80mm Slip"
                      >
                        Print
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectOrder(ord)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
