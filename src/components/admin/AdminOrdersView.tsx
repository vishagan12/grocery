'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Printer,
  PackageCheck,
  Bike,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  AlertTriangle,
  XCircle,
  Download,
  MoreVertical,
  ExternalLink,
  User,
  Check,
  ChevronRight,
  ArrowRight,
  CreditCard,
  Banknote,
  RefreshCw,
  X,
} from 'lucide-react';
import { AdminOrderData, AdminOrderItem } from './AdminDashboard';
import { Button } from '../ui/Button';
import { Input, SearchInput, Select } from '../ui/FormControls';
import { StatusBadge } from '../ui/StatusBadge';
import { Tabs } from '../ui/Tabs';
import { SideDrawer, ConfirmationDialog } from '../ui/Overlays';
import { Timeline, KeyValueList } from '../ui/Miscellaneous';
import { PageHeader } from './PageHeader';

export interface AdminOrdersViewProps {
  orders: AdminOrderData[];
  onUpdateStatus: (orderId: string, status: number, paymentStatus?: string) => Promise<void>;
  onAssignRider: (orderId: string, riderName: string, riderPhone: string) => Promise<void>;
  onCancelOrder: (orderId: string, reason: string) => Promise<void>;
  onPrintOrder: (order: AdminOrderData) => void;
  onRefresh: () => void;
  packedItems: Record<string, Record<string, boolean>>;
  onTogglePackedItem: (orderId: string, itemKey: string) => void;
  initialSelectedOrderId?: string | null;
  onClearSelectedOrder?: () => void;
}

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({
  orders,
  onUpdateStatus,
  onAssignRider,
  onCancelOrder,
  onPrintOrder,
  onRefresh,
  packedItems,
  onTogglePackedItem,
  initialSelectedOrderId,
  onClearSelectedOrder,
}) => {
  // Filter States
  const [statusFilter, setStatusFilter] = useState<'all' | '0' | '1' | '2' | '3' | '4'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'upi' | 'cod'>('all');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'someone_else'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'amount_high' | 'amount_low' | 'distance'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Bulk Selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Selected Order for Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderData | null>(null);

  // Sync initialSelectedOrderId from parent dashboard
  useEffect(() => {
    if (initialSelectedOrderId) {
      const target = orders.find((o) => o.id === initialSelectedOrderId);
      if (target) {
        setSelectedOrder(target);
      }
    }
  }, [initialSelectedOrderId, orders]);

  // Rider Assignment State in Detail
  const [riderNameInput, setRiderNameInput] = useState('');
  const [riderPhoneInput, setRiderPhoneInput] = useState('');
  const [isAssigningRider, setIsAssigningRider] = useState(false);

  // Cancel Confirmation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<AdminOrderData | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer cancelled before dispatch');
  const [isCancelling, setIsCancelling] = useState(false);

  // Status Tabs Definition with Counts
  const statusTabs = useMemo(() => {
    const c0 = orders.filter((o) => o.status === 0).length;
    const c1 = orders.filter((o) => o.status === 1).length;
    const c2 = orders.filter((o) => o.status === 2).length;
    const c3 = orders.filter((o) => o.status === 3).length;
    const c4 = orders.filter((o) => o.status === 4).length;

    return [
      { id: 'all', label: 'All Orders', count: orders.length },
      { id: '0', label: 'New / Packing', count: c0 },
      { id: '1', label: 'Bagged at Dock', count: c1 },
      { id: '2', label: 'On Bike Transit', count: c2 },
      { id: '3', label: 'Delivered', count: c3 },
      { id: '4', label: 'Cancelled', count: c4 },
    ];
  }, [orders]);

  // Filtering & Sorting
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // Status filter
        if (statusFilter !== 'all' && o.status !== Number(statusFilter)) return false;

        // Payment filter
        if (paymentFilter !== 'all' && o.paymentMethod !== paymentFilter) return false;

        // Recipient filter
        if (recipientFilter === 'someone_else' && !o.isForSomeoneElse) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = o.id.toLowerCase().includes(q);
          const matchCustomer = o.customerName.toLowerCase().includes(q);
          const matchPhone = o.phone.includes(q);
          const matchRecipient = o.recipientName?.toLowerCase().includes(q);
          const matchAddress = o.address.toLowerCase().includes(q);
          if (!matchId && !matchCustomer && !matchPhone && !matchRecipient && !matchAddress) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'amount_high') return b.total - a.total;
        if (sortBy === 'amount_low') return a.total - b.total;
        if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
        return 0;
      });
  }, [orders, statusFilter, paymentFilter, recipientFilter, searchQuery, sortBy]);

  // Pagination Slicing
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(paginatedOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkPack = async () => {
    for (const id of selectedOrderIds) {
      await onUpdateStatus(id, 1);
    }
    setSelectedOrderIds([]);
  };

  const handleBulkPrint = () => {
    const targetOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
    targetOrders.forEach((o) => onPrintOrder(o));
  };

  const handleExportFilteredCsv = () => {
    const headers = [
      'Order ID',
      'Date',
      'Customer',
      'Phone',
      'Is Someone Else',
      'Recipient',
      'Address',
      'Distance Km',
      'Items Count',
      'Total INR',
      'Payment Method',
      'Status',
    ];
    const rows = filteredOrders.map((o) => [
      `"${o.id}"`,
      `"${new Date(o.createdAt).toLocaleString()}"`,
      `"${o.customerName}"`,
      `"${o.phone}"`,
      o.isForSomeoneElse ? 'YES' : 'NO',
      `"${o.recipientName || ''}"`,
      `"${o.address.replace(/"/g, '""')}"`,
      o.distanceKm,
      o.items.length,
      o.total,
      o.paymentMethod.toUpperCase(),
      o.status === 0
        ? 'NEW'
        : o.status === 1
        ? 'BAGGED'
        : o.status === 2
        ? 'ON ROUTE'
        : o.status === 3
        ? 'DELIVERED'
        : 'CANCELLED',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SriAmman_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <PageHeader
        title="Live Dispatch &amp; Orders"
        description="Fulfillment queue, 4-digit dock pickup codes, thermal slips, and instant order tracking."
        badge={
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-[#F1F9EC] text-[#143B0D] border border-[#76CA3E]/30">
            {filteredOrders.length} Orders
          </span>
        }
        secondaryActions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportFilteredCsv}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* 2. Status Segmented Tabs */}
      <Tabs
        tabs={statusTabs}
        activeTab={statusFilter}
        onChange={(tabId) => {
          setStatusFilter(tabId as any);
          setCurrentPage(1);
          setSelectedOrderIds([]);
        }}
        variant="pills"
      />

      {/* 3. Filter Bar & Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Query */}
          <div className="lg:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by SAS Order #, phone, customer, or recipient..."
            />
          </div>

          {/* Payment Method Filter */}
          <Select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value as any);
              setCurrentPage(1);
            }}
          >
            <option value="all">Payment: All Methods</option>
            <option value="upi">Payment: UPI Online Paid</option>
            <option value="cod">Payment: COD Cash Due</option>
          </Select>

          {/* Recipient Filter */}
          <Select
            value={recipientFilter}
            onChange={(e) => {
              setRecipientFilter(e.target.value as any);
              setCurrentPage(1);
            }}
          >
            <option value="all">Recipient: All Orders</option>
            <option value="someone_else">Ordered for Someone Else</option>
          </Select>
        </div>

        {/* Sorting & Page Size */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500 uppercase font-mono">Sort by:</span>
            <button
              onClick={() => setSortBy('newest')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                sortBy === 'newest' ? 'bg-[#F1F9EC] text-[#143B0D]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Newest Placed
            </button>
            <button
              onClick={() => setSortBy('amount_high')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                sortBy === 'amount_high' ? 'bg-[#F1F9EC] text-[#143B0D]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Highest Value
            </button>
            <button
              onClick={() => setSortBy('distance')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                sortBy === 'distance' ? 'bg-[#F1F9EC] text-[#143B0D]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Closest Distance
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-mono">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-100 rounded border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-800 outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Bulk Action Floating Bar (when rows selected) */}
      {selectedOrderIds.length > 0 && (
        <div className="sticky top-20 z-20 p-3 rounded-xl bg-[#143B0D] text-white shadow-lg flex items-center justify-between flex-wrap gap-2 animate-scale-up">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#76CA3E] text-[#143B0D] font-mono font-bold text-xs flex items-center justify-center">
              {selectedOrderIds.length}
            </span>
            <span className="text-xs font-bold">orders selected for batch fulfillment</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleBulkPack} icon={<PackageCheck className="w-3.5 h-3.5" />}>
              Pack Selected (Ready)
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkPrint} icon={<Printer className="w-3.5 h-3.5" />}>
              Print 80mm Slips
            </Button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="text-xs text-slate-300 hover:text-white px-2 py-1 font-bold"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 5. Orders Table / Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#F8FAF7] border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedOrders.length > 0 &&
                      paginatedOrders.every((o) => selectedOrderIds.includes(o.id))
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-[#143B0D] accent-[#76CA3E] cursor-pointer"
                    aria-label="Select all orders on this page"
                  />
                </th>
                <th className="p-3.5">Order &amp; Bag Code</th>
                <th className="p-3.5">Customer &amp; Recipient</th>
                <th className="p-3.5">Delivery Address</th>
                <th className="p-3.5 text-right">Items &amp; Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <p className="text-sm font-bold text-slate-700">No matching orders found</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting search or filter criteria.</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord) => {
                  const bagPin = ord.id.replace(/\D/g, '').slice(-4) || 'BAG';
                  const isSelected = selectedOrderIds.includes(ord.id);

                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-[#F8FAF7] transition-colors ${
                        isSelected ? 'bg-[#F1F9EC]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(ord.id)}
                          className="w-4 h-4 rounded text-[#143B0D] accent-[#76CA3E] cursor-pointer"
                          aria-label={`Select order ${ord.id}`}
                        />
                      </td>

                      {/* Order & Bag Code */}
                      <td className="p-3.5">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="font-mono font-bold text-sm text-slate-900 hover:text-[#047857] text-left underline decoration-slate-300 underline-offset-2"
                          >
                            {ord.id}
                          </button>
                          <div className="flex items-center gap-1.5">
                            {ord.status === 1 && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-[#0047BF] text-white tracking-wider">
                                PIN: {bagPin}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(ord.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer & Recipient */}
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {ord.isForSomeoneElse ? ord.recipientName : ord.customerName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {ord.isForSomeoneElse ? `+91 ${ord.recipientPhone}` : ord.phone}
                          </span>
                          {ord.isForSomeoneElse && (
                            <span className="mt-0.5 inline-block text-[10px] text-amber-800 font-bold bg-[#FFDCC3] px-1.5 py-0.2 rounded w-fit">
                              Ordered by {ord.customerName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Delivery Address */}
                      <td className="p-3.5 max-w-xs">
                        <div className="flex items-start gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-[#047857] shrink-0 mt-0.5" />
                          <span className="truncate" title={ord.address}>
                            {ord.address} • {ord.distanceKm} km
                          </span>
                        </div>
                        {ord.assignedRiderName && (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-bold mt-1">
                            <Bike className="w-3 h-3 text-[#047857]" />
                            <span>Rider: {ord.assignedRiderName}</span>
                          </div>
                        )}
                      </td>

                      {/* Items & Total */}
                      <td className="p-3.5 text-right">
                        <span className="font-mono font-extrabold text-sm text-slate-900 block tabular-nums">
                          ₹{ord.total}
                        </span>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-500">{ord.items.length} items</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${
                              ord.paymentMethod === 'upi'
                                ? 'bg-[#97F5CC] text-[#002115]'
                                : 'bg-[#FFDCC3] text-[#2F1500]'
                            }`}
                          >
                            {ord.paymentMethod.toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5">
                        <StatusBadge status={ord.status as any} size="sm" />
                      </td>

                      {/* Quick Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {ord.status === 0 && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => onUpdateStatus(ord.id, 1)}
                              icon={<PackageCheck className="w-3.5 h-3.5" />}
                              title="Mark Bagged &amp; Ready for Pickup"
                            >
                              Pack
                            </Button>
                          )}
                          {ord.status === 1 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onUpdateStatus(ord.id, 2)}
                              icon={<Bike className="w-3.5 h-3.5" />}
                              title="Dispatch on Bike"
                            >
                              Dispatch
                            </Button>
                          )}
                          {ord.status === 2 && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => onUpdateStatus(ord.id, 3, 'paid')}
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              title="Mark Delivered &amp; Settled"
                            >
                              Settle
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPrintOrder(ord)}
                            icon={<Printer className="w-3.5 h-3.5" />}
                            title="80mm Thermal Receipt"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(ord)}
                          >
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View (< 768px) */}
        <div className="md:hidden divide-y divide-slate-100">
          {paginatedOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <p className="font-bold text-slate-700">No matching orders found</p>
            </div>
          ) : (
            paginatedOrders.map((ord) => {
              const bagPin = ord.id.replace(/\D/g, '').slice(-4) || 'BAG';

              return (
                <div key={ord.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={ord.status as any} size="sm" />
                    <span className="font-mono font-bold text-xs text-slate-900">{ord.id}</span>
                  </div>

                  {ord.status === 1 && (
                    <div className="p-2 rounded-lg bg-[#0047BF] text-white text-center font-mono font-extrabold text-sm tracking-wider">
                      DOCK PICKUP CODE: {bagPin}
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {ord.isForSomeoneElse ? `For: ${ord.recipientName}` : ord.customerName}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      {ord.isForSomeoneElse ? `+91 ${ord.recipientPhone}` : ord.phone}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 truncate">
                      {ord.address} • {ord.distanceKm} km
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                      ₹{ord.total} •{' '}
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {ord.paymentMethod}
                      </span>
                    </span>
                    <span className="text-xs text-slate-500">{ord.items.length} items</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {ord.status === 0 && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onUpdateStatus(ord.id, 1)}
                        className="col-span-2"
                      >
                        Pack &amp; Bag
                      </Button>
                    )}
                    {ord.status === 1 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onUpdateStatus(ord.id, 2)}
                        className="col-span-2"
                      >
                        Dispatch
                      </Button>
                    )}
                    {ord.status === 2 && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onUpdateStatus(ord.id, 3, 'paid')}
                        className="col-span-2"
                      >
                        Mark Delivered
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPrintOrder(ord)}
                      icon={<Printer className="w-3.5 h-3.5" />}
                    >
                      Print
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(ord)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 6. Pagination Footer */}
        {filteredOrders.length > pageSize && (
          <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span className="font-mono">
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="px-2 font-mono font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 7. ORDER DETAIL DRAWER / INSPECTOR */}
      {/* ==================================================================== */}
      {selectedOrder && (
        <SideDrawer
          isOpen={Boolean(selectedOrder)}
          onClose={() => {
            setSelectedOrder(null);
            onClearSelectedOrder?.();
          }}
          title={`Order Details • ${selectedOrder.id}`}
        >
          <div className="space-y-6">
            {/* Status & Quick Action Buttons */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <StatusBadge status={selectedOrder.status as any} />
                <span className="text-xs font-mono text-slate-500">
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Status Advancement Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {selectedOrder.status === 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      await onUpdateStatus(selectedOrder.id, 1);
                      setSelectedOrder({ ...selectedOrder, status: 1 });
                    }}
                    icon={<PackageCheck className="w-4 h-4" />}
                  >
                    Pack &amp; Generate PIN
                  </Button>
                )}
                {selectedOrder.status === 1 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      await onUpdateStatus(selectedOrder.id, 2);
                      setSelectedOrder({ ...selectedOrder, status: 2 });
                    }}
                    icon={<Bike className="w-4 h-4" />}
                  >
                    Start Bike Delivery
                  </Button>
                )}
                {selectedOrder.status === 2 && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      await onUpdateStatus(selectedOrder.id, 3, 'paid');
                      setSelectedOrder({ ...selectedOrder, status: 3, paymentStatus: 'paid' });
                    }}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Confirm Delivery
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPrintOrder(selectedOrder)}
                  icon={<Printer className="w-4 h-4" />}
                >
                  Print Slip
                </Button>
              </div>
            </div>

            {/* 4-digit Dock Pickup Code */}
            {selectedOrder.status >= 1 && selectedOrder.status <= 2 && (
              <div className="p-3.5 rounded-xl bg-[#0047BF] text-white text-center shadow-xs">
                <span className="text-[10px] tracking-widest uppercase opacity-80 block font-mono">
                  Rider Bag Hand-off PIN
                </span>
                <span className="text-2xl font-mono font-extrabold tracking-wider">
                  PICKUP CODE: {selectedOrder.id.replace(/\D/g, '').slice(-4) || 'BAG'}
                </span>
              </div>
            )}

            {/* Recipient & Customer Details */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                Customer &amp; Recipient
              </h4>

              {selectedOrder.isForSomeoneElse ? (
                <div className="p-2.5 rounded-lg bg-[#FFDCC3]/50 border border-[#FE932C]/30 space-y-1">
                  <span className="text-[10px] font-bold text-amber-900 uppercase font-mono">
                    Recipient (Receiving Groceries)
                  </span>
                  <p className="text-sm font-bold text-slate-900">{selectedOrder.recipientName}</p>
                  <p className="text-xs font-mono text-slate-600">+91 {selectedOrder.recipientPhone}</p>
                  <div className="pt-2 mt-2 border-t border-amber-200/60 text-[11px] text-amber-900">
                    Ordered by: <b>{selectedOrder.customerName}</b> ({selectedOrder.phone})
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedOrder.customerName}</p>
                  <p className="text-xs font-mono text-slate-600">+91 {selectedOrder.phone}</p>
                </div>
              )}

              {/* Delivery Address & GPS Link */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <MapPin className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    {selectedOrder.address} • <span className="font-bold">{selectedOrder.distanceKm} km</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(selectedOrder.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#F1F9EC] hover:bg-[#76CA3E]/20 text-[#143B0D] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Open in Maps</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a
                    href={`tel:${selectedOrder.isForSomeoneElse ? selectedOrder.recipientPhone : selectedOrder.phone}`}
                    className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Rider Assignment Box */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Rider Assignment
                </h4>
                {selectedOrder.assignedRiderName && (
                  <span className="text-[10px] font-bold text-[#047857] font-mono bg-[#97F5CC] px-2 py-0.5 rounded">
                    ASSIGNED
                  </span>
                )}
              </div>

              {selectedOrder.assignedRiderName ? (
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-[#047857]" />
                    <div>
                      <p className="font-bold text-slate-900">{selectedOrder.assignedRiderName}</p>
                      <p className="text-[10px] font-mono text-slate-500">{selectedOrder.assignedRiderPhone || 'Madurai Fleet'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAssigningRider(true)}
                    className="text-[11px] font-bold text-[#047857] hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No dedicated rider assigned yet. Will be auto-claimed at dock.
                </p>
              )}

              {(!selectedOrder.assignedRiderName || isAssigningRider) && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <Input
                    placeholder="Rider Name (e.g. Murugan M)"
                    value={riderNameInput}
                    onChange={(e) => setRiderNameInput(e.target.value)}
                  />
                  <Input
                    placeholder="Rider Mobile (e.g. 9443212345)"
                    value={riderPhoneInput}
                    onChange={(e) => setRiderPhoneInput(e.target.value)}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      if (!riderNameInput.trim()) return;
                      await onAssignRider(selectedOrder.id, riderNameInput, riderPhoneInput);
                      setSelectedOrder({
                        ...selectedOrder,
                        assignedRiderName: riderNameInput,
                        assignedRiderPhone: riderPhoneInput,
                      });
                      setIsAssigningRider(false);
                      setRiderNameInput('');
                      setRiderPhoneInput('');
                    }}
                  >
                    Save Assigned Rider
                  </Button>
                </div>
              )}
            </div>

            {/* Interactive Items Packing Checklist */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Items Checklist ({selectedOrder.items.length})
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">Tap checkbox to pack</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {selectedOrder.items.map((it, idx) => {
                  const itemKey = `${selectedOrder.id}-${idx}`;
                  const isPacked = Boolean(packedItems[selectedOrder.id]?.[itemKey]);

                  return (
                    <label
                      key={idx}
                      className="py-2.5 flex items-start gap-2.5 cursor-pointer select-none hover:bg-slate-50 px-1 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isPacked}
                        onChange={() => onTogglePackedItem(selectedOrder.id, itemKey)}
                        className="mt-0.5 accent-[#047857] w-4 h-4 rounded cursor-pointer"
                      />
                      <div className="flex-1 min-w-0 leading-tight">
                        <p className={`font-semibold text-slate-900 ${isPacked ? 'line-through text-slate-400' : ''}`}>
                          {it.productNameEn}{' '}
                          {it.productNameTa && <span className="text-[10px] text-slate-500">({it.productNameTa})</span>}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {it.variantLabel} • Qty: <span className="font-bold text-slate-800">{it.quantity}</span>
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-800 tabular-nums">
                        ₹{it.price * it.quantity}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Order Financial Summary */}
              <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-800 tabular-nums">₹{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-mono font-bold tabular-nums">-₹{selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Fee (3 km):</span>
                  <span className="font-mono font-bold text-slate-800 tabular-nums">
                    {selectedOrder.deliveryFee === 0 ? 'FREE' : `₹${selectedOrder.deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Amount:</span>
                  <span className="font-mono tabular-nums">₹{selectedOrder.total}</span>
                </div>
                <div className="pt-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      selectedOrder.paymentMethod === 'upi'
                        ? 'bg-[#97F5CC] text-[#002115]'
                        : 'bg-[#FFDCC3] text-[#2F1500]'
                    }`}
                  >
                    {selectedOrder.paymentMethod === 'upi'
                      ? 'PAID ONLINE VIA UPI'
                      : `COLLECT COD CASH: ₹${selectedOrder.total}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancel / Refund Action */}
            {selectedOrder.status !== 3 && selectedOrder.status !== 4 && (
              <div className="pt-2">
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setOrderToCancel(selectedOrder);
                    setCancelModalOpen(true);
                  }}
                  icon={<XCircle className="w-4 h-4" />}
                >
                  Cancel Order &amp; Void Slip
                </Button>
              </div>
            )}
          </div>
        </SideDrawer>
      )}

      {/* ==================================================================== */}
      {/* 8. CANCELLATION / REFUND CONFIRMATION MODAL */}
      {/* ==================================================================== */}
      <ConfirmationDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Order &amp; Void Receipt?"
        message={`Are you sure you want to cancel order ${orderToCancel?.id}? This will flag the order as cancelled in the customer app and notify the delivery dock.`}
        confirmLabel="Yes, Cancel Order"
        cancelLabel="Keep Order"
        variant="danger"
        loading={isCancelling}
        onConfirm={async () => {
          if (!orderToCancel) return;
          setIsCancelling(true);
          try {
            await onCancelOrder(orderToCancel.id, cancelReason);
            setCancelModalOpen(false);
            if (selectedOrder?.id === orderToCancel.id) {
              setSelectedOrder({ ...selectedOrder, status: 4 });
            }
          } finally {
            setIsCancelling(false);
          }
        }}
      />
    </div>
  );
};
