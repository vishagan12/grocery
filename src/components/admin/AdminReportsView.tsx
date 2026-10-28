'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  IndianRupee,
  Calendar,
  Download,
  CreditCard,
  Banknote,
  TrendingUp,
  ShoppingBag,
  ArrowUpRight,
  Filter,
  FileSpreadsheet,
  PieChart,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { StatCard } from '../ui/StatCard';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { EmptyState } from '../ui/Miscellaneous';

export interface AdminReportsViewProps {
  orders: any[];
}

export const AdminReportsView: React.FC<AdminReportsViewProps> = ({ orders = [] }) => {
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days' | 'month' | 'all'>('7days');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'upi' | 'cod'>('all');

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt || Date.now());
      const orderDateStr = (o.createdAt || '').split('T')[0];

      if (dateRange === 'today') {
        if (orderDateStr !== todayStr) return false;
      } else if (dateRange === 'yesterday') {
        if (orderDateStr !== yesterdayStr) return false;
      } else if (dateRange === '7days') {
        if (orderDate < sevenDaysAgo) return false;
      } else if (dateRange === 'month') {
        if (orderDate < thirtyDaysAgo) return false;
      }

      if (paymentFilter !== 'all' && (o.paymentMethod || 'cod').toLowerCase() !== paymentFilter) {
        return false;
      }

      return true;
    });
  }, [orders, dateRange, paymentFilter]);

  // Aggregate Key Financial Metrics
  const metrics = useMemo(() => {
    const validOrders = filteredOrders.filter((o) => o.status !== 4); // exclude cancelled
    const grossSales = validOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    const subtotal = validOrders.reduce((acc, o) => acc + Number(o.subtotal || 0), 0);
    const deliveryFees = validOrders.reduce((acc, o) => acc + Number(o.deliveryFee || 0), 0);
    const discounts = validOrders.reduce((acc, o) => acc + Number(o.discount || 0), 0);
    const settledCount = validOrders.length;
    const aov = settledCount > 0 ? Math.round(grossSales / settledCount) : 0;

    // Payment method breakdown
    const upiOrders = validOrders.filter((o) => (o.paymentMethod || '').toLowerCase() === 'upi');
    const codOrders = validOrders.filter((o) => (o.paymentMethod || 'cod').toLowerCase() === 'cod');

    const upiTotal = upiOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);
    const codTotal = codOrders.reduce((acc, o) => acc + Number(o.total || 0), 0);

    const upiPct = grossSales > 0 ? Math.round((upiTotal / grossSales) * 100) : 0;
    const codPct = grossSales > 0 ? 100 - upiPct : 0;

    return {
      grossSales,
      subtotal,
      deliveryFees,
      discounts,
      settledCount,
      aov,
      upiTotal,
      upiOrdersCount: upiOrders.length,
      upiPct,
      codTotal,
      codOrdersCount: codOrders.length,
      codPct,
    };
  }, [filteredOrders]);

  // Hourly velocity distribution
  const hourlyData = useMemo(() => {
    const hours = [
      { label: '6-8 AM', count: 0, amount: 0 },
      { label: '8-10 AM', count: 0, amount: 0 },
      { label: '10-12 PM', count: 0, amount: 0 },
      { label: '12-2 PM', count: 0, amount: 0 },
      { label: '2-4 PM', count: 0, amount: 0 },
      { label: '4-6 PM', count: 0, amount: 0 },
      { label: '6-8 PM', count: 0, amount: 0 },
      { label: '8-10 PM', count: 0, amount: 0 },
    ];

    filteredOrders.forEach((o) => {
      if (o.status === 4) return;
      const d = new Date(o.createdAt || Date.now());
      const h = d.getHours();
      let idx = 0;
      if (h >= 6 && h < 8) idx = 0;
      else if (h >= 8 && h < 10) idx = 1;
      else if (h >= 10 && h < 12) idx = 2;
      else if (h >= 12 && h < 14) idx = 3;
      else if (h >= 14 && h < 16) idx = 4;
      else if (h >= 16 && h < 18) idx = 5;
      else if (h >= 18 && h < 20) idx = 6;
      else idx = 7;

      hours[idx].count += 1;
      hours[idx].amount += Number(o.total || 0);
    });

    const maxAmount = Math.max(...hours.map((h) => h.amount), 1);
    return hours.map((h) => ({
      ...h,
      pct: Math.round((h.amount / maxAmount) * 100),
    }));
  }, [filteredOrders]);

  // Export CSV Handler
  const handleExportCsv = () => {
    const headers = [
      'Order ID',
      'Date & Time',
      'Customer Name',
      'Phone',
      'Payment Method',
      'Status',
      'Subtotal (INR)',
      'Delivery Fee (INR)',
      'Discount (INR)',
      'Total Amount (INR)',
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.id}"`,
      `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
      `"${(o.customerName || 'Valued Customer').replace(/"/g, '""')}"`,
      `"${o.phone || ''}"`,
      `"${(o.paymentMethod || 'COD').toUpperCase()}"`,
      `"${o.status === 0 ? 'New' : o.status === 1 ? 'Packing' : o.status === 2 ? 'Out for Delivery' : o.status === 3 ? 'Delivered' : 'Cancelled'}"`,
      o.subtotal || 0,
      o.deliveryFee || 0,
      o.discount || 0,
      o.total || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `sri_amman_daybook_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Financial Reports & Store Analytics"
        subtitle="Review revenue daybooks, track payment settlement channels (UPI vs COD), and export audit logs."
        actions={
          <Button variant="primary" size="md" onClick={handleExportCsv} className="gap-2">
            <Download className="w-4 h-4" /> Export Daybook CSV
          </Button>
        }
      />

      {/* Date & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mr-2 hidden sm:inline">
            Period:
          </span>
          <button
            onClick={() => setDateRange('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              dateRange === 'today'
                ? 'bg-[#143B0D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateRange('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              dateRange === 'yesterday'
                ? 'bg-[#143B0D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setDateRange('7days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              dateRange === '7days'
                ? 'bg-[#143B0D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              dateRange === 'month'
                ? 'bg-[#143B0D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Past 30 Days
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              dateRange === 'all'
                ? 'bg-[#143B0D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Records
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Channel:</span>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'upi' | 'cod')}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#76CA3E]"
          >
            <option value="all">All Settlements (UPI &amp; COD)</option>
            <option value="upi">UPI Online Only</option>
            <option value="cod">Cash on Delivery Only</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Gross Store Revenue"
          value={`₹${metrics.grossSales.toLocaleString('en-IN')}`}
          icon={<IndianRupee className="w-5 h-5 text-[#047857]" />}
          description={`Across ${metrics.settledCount} orders`}
        />
        <StatCard
          label="Average Order Value"
          value={`₹${metrics.aov.toLocaleString('en-IN')}`}
          icon={<TrendingUp className="w-5 h-5 text-[#0047BF]" />}
          description="Ticket size per transaction"
        />
        <StatCard
          label="Delivery Fees Billed"
          value={`₹${metrics.deliveryFees.toLocaleString('en-IN')}`}
          icon={<Layers className="w-5 h-5 text-[#143B0D]" />}
          description="Logistics surcharge collected"
        />
        <StatCard
          label="Total Promos & Discounts"
          value={`₹${metrics.discounts.toLocaleString('en-IN')}`}
          icon={<ShoppingBag className="w-5 h-5 text-[#D97706]" />}
          description="Customer discount value"
        />
      </div>

      {/* Payment Settlement Split & Velocity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Split Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-[#0F172A] text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#143B0D]" />
              <span>Settlement Channel Split</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Real-time</span>
          </div>

          {/* Visual Percentage Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-[#0047BF]">UPI: {metrics.upiPct}%</span>
              <span className="text-[#047857]">COD: {metrics.codPct}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
              <div
                className="h-full bg-[#0047BF] transition-all"
                style={{ width: `${metrics.upiPct}%` }}
              />
              <div
                className="h-full bg-[#76CA3E] transition-all"
                style={{ width: `${metrics.codPct}%` }}
              />
            </div>
          </div>

          {/* Channel Detail Rows */}
          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#F8FAF7] border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#DBE1FF] text-[#0047BF] flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">UPI / QR Payment</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {metrics.upiOrdersCount} orders settled
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-sm text-[#0047BF]">
                ₹{metrics.upiTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8FAF7] border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F1F9EC] text-[#143B0D] flex items-center justify-center font-bold">
                  <Banknote className="w-4 h-4 text-[#047857]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Cash on Delivery</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {metrics.codOrdersCount} orders collected
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-sm text-[#047857]">
                ₹{metrics.codTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/50 text-xs text-[#78350F] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
            <span>
              All COD cash must be handed over by riders at the end of their shift at the store
              counter.
            </span>
          </div>
        </div>

        {/* Hourly Sales Velocity Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-[#0F172A] text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#143B0D]" />
                <span>Peak Order Velocity Hours</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution of sales volume across store operating hours (Madurai time)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#143B0D] px-2.5 py-1 rounded-lg bg-[#F1F9EC] border border-[#76CA3E]/30">
              Rush: 06:00 PM - 08:00 PM
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-44 pt-6 flex items-end gap-2 sm:gap-4 px-2">
            {hourlyData.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                {/* Tooltip on hover */}
                <span className="text-[10px] font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  ₹{h.amount}
                </span>

                <div className="w-full bg-slate-100 rounded-t-xl h-full flex items-end overflow-hidden max-w-[42px]">
                  <div
                    className="w-full bg-[#76CA3E] hover:bg-[#143B0D] transition-all rounded-t-xl"
                    style={{ height: `${Math.max(8, h.pct)}%` }}
                  />
                </div>

                <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap rotate-[-30deg] sm:rotate-0 mt-1">
                  {h.label.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 font-mono">
            <span>Store opening: 06:30 AM</span>
            <span>Store closing: 10:30 PM</span>
          </div>
        </div>
      </div>

      {/* Daybook Ledger Transactions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-[#0F172A] text-sm flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#143B0D]" />
            <span>Audit Daybook Ledger ({filteredOrders.length} records)</span>
          </h3>
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> CSV Export
          </Button>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState
            title="No transactions for selected date range"
            description="Adjust your period or payment filter to inspect historical orders."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAF7] border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3 px-4">Time &amp; Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-center">Order Status</th>
                  <th className="py-3 px-4 text-right">Items Subtotal</th>
                  <th className="py-3 px-4 text-right">Delivery Fee</th>
                  <th className="py-3 px-4 text-right">Total Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.slice(0, 50).map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F8FAF7]/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-xs text-[#0F172A] block">
                        #{ord.id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {new Date(ord.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-xs text-slate-900 block truncate">
                        {ord.customerName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {ord.phone}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                          (ord.paymentMethod || '').toLowerCase() === 'upi'
                            ? 'bg-blue-50 text-[#0047BF] border border-blue-200/50'
                            : 'bg-emerald-50 text-[#047857] border border-emerald-200/50'
                        }`}
                      >
                        {ord.paymentMethod || 'COD'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
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
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-600">
                      ₹{ord.subtotal}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-600">
                      ₹{ord.deliveryFee}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#0F172A]">
                      ₹{ord.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
