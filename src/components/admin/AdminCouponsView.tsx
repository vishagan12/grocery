'use client';

import React, { useState, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Copy,
  Check,
  Calendar,
  Percent,
  IndianRupee,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  Gift,
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { StatCard } from '../ui/StatCard';
import { SearchInput, Input, Select, Toggle } from '../ui/FormControls';
import { Button } from '../ui/Button';
import { Modal, ConfirmationDialog } from '../ui/Overlays';
import { EmptyState } from '../ui/Miscellaneous';

export interface CouponItem {
  id: string;
  code: string;
  title: string;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  timesUsed: number;
  usageLimit?: number;
  expiresAt: string;
  active: boolean;
}

const INITIAL_COUPONS: CouponItem[] = [
  {
    id: 'c-01',
    code: 'PUDURFREE',
    title: 'Free Delivery for K.Pudur Residents',
    discountType: 'flat',
    discountValue: 25,
    minOrderValue: 299,
    timesUsed: 184,
    usageLimit: 500,
    expiresAt: '2026-12-31',
    active: true,
  },
  {
    id: 'c-02',
    code: 'AMMAN100',
    title: 'Flat ₹100 Off on Monthly Grocery Rush',
    discountType: 'flat',
    discountValue: 100,
    minOrderValue: 1499,
    timesUsed: 92,
    usageLimit: 300,
    expiresAt: '2026-11-30',
    active: true,
  },
  {
    id: 'c-03',
    code: 'FESTIVE15',
    title: '15% Off on Cooking Oils & Masalas',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscount: 150,
    minOrderValue: 799,
    timesUsed: 65,
    usageLimit: 200,
    expiresAt: '2026-11-15',
    active: true,
  },
  {
    id: 'c-04',
    code: 'WELCOME50',
    title: 'New Customer Welcome Coupon',
    discountType: 'flat',
    discountValue: 50,
    minOrderValue: 399,
    timesUsed: 312,
    expiresAt: '2026-12-31',
    active: true,
  },
  {
    id: 'c-05',
    code: 'PONGAL2026',
    title: 'Pongal Festival Special Offer',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 200,
    minOrderValue: 999,
    timesUsed: 420,
    expiresAt: '2026-01-20',
    active: false,
  },
];

export const AdminCouponsView: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponItem[]>(INITIAL_COUPONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    discountType: 'flat' as 'flat' | 'percentage',
    discountValue: 50,
    maxDiscount: 150,
    minOrderValue: 499,
    usageLimit: 200,
    expiresAt: '2026-12-31',
    active: true,
  });
  const [formError, setFormError] = useState('');

  // Overview Metrics
  const metrics = useMemo(() => {
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter((c) => c.active).length;
    const totalRedeemed = coupons.reduce((acc, c) => acc + c.timesUsed, 0);
    const totalSavings = coupons.reduce((acc, c) => {
      const estimatedAvgSaving = c.discountType === 'flat' ? c.discountValue : 80;
      return acc + c.timesUsed * estimatedAvgSaving;
    }, 0);

    return { totalCoupons, activeCoupons, totalRedeemed, totalSavings };
  }, [coupons]);

  // Filtered list
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter === 'active' && !c.active) return false;
      if (statusFilter === 'inactive' && c.active) return false;
      return true;
    });
  }, [coupons, searchQuery, statusFilter]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      title: '',
      discountType: 'flat',
      discountValue: 50,
      maxDiscount: 150,
      minOrderValue: 499,
      usageLimit: 250,
      expiresAt: '2026-12-31',
      active: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: CouponItem) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      title: coupon.title,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount || 150,
      minOrderValue: coupon.minOrderValue,
      usageLimit: coupon.usageLimit || 500,
      expiresAt: coupon.expiresAt,
      active: coupon.active,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode) {
      setFormError('Please enter a coupon code (alphanumeric).');
      return;
    }
    if (!formData.title.trim()) {
      setFormError('Please enter an offer description.');
      return;
    }

    if (editingCoupon) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === editingCoupon.id
            ? {
                ...c,
                code: cleanCode,
                title: formData.title.trim(),
                discountType: formData.discountType,
                discountValue: Number(formData.discountValue),
                maxDiscount:
                  formData.discountType === 'percentage'
                    ? Number(formData.maxDiscount)
                    : undefined,
                minOrderValue: Number(formData.minOrderValue),
                usageLimit: Number(formData.usageLimit) || undefined,
                expiresAt: formData.expiresAt,
                active: formData.active,
              }
            : c
        )
      );
    } else {
      const newCoupon: CouponItem = {
        id: `c-${Date.now()}`,
        code: cleanCode,
        title: formData.title.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        maxDiscount:
          formData.discountType === 'percentage' ? Number(formData.maxDiscount) : undefined,
        minOrderValue: Number(formData.minOrderValue),
        timesUsed: 0,
        usageLimit: Number(formData.usageLimit) || undefined,
        expiresAt: formData.expiresAt,
        active: formData.active,
      };
      setCoupons((prev) => [newCoupon, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteCoupon = () => {
    if (!deleteConfirmId) return;
    setCoupons((prev) => prev.filter((c) => c.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Coupons & Promotional Offers"
        subtitle="Manage customer discount codes, festival vouchers, and cart threshold rules."
        actions={
          <Button variant="primary" size="md" onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Create Promo Coupon
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Coupons"
          value={`${metrics.activeCoupons} / ${metrics.totalCoupons}`}
          icon={<Tag className="w-5 h-5 text-[#143B0D]" />}
          description="Live codes ready at checkout"
        />
        <StatCard
          label="Times Redeemed"
          value={metrics.totalRedeemed.toLocaleString('en-IN')}
          icon={<Gift className="w-5 h-5 text-[#0047BF]" />}
          description="Total successful redemptions"
        />
        <StatCard
          label="Total Customer Savings"
          value={`₹${metrics.totalSavings.toLocaleString('en-IN')}`}
          icon={<IndianRupee className="w-5 h-5 text-[#047857]" />}
          description="Cumulative discounts granted"
        />
        <StatCard
          label="Top Promo Code"
          value="WELCOME50"
          icon={<Sparkles className="w-5 h-5 text-[#D97706]" />}
          description="312 new user signups"
        />
      </div>

      {/* Controls Bar: Search & Status Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchInput
            placeholder="Search by coupon code or offer title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'all'
                ? 'bg-[#143B0D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Coupons ({coupons.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-[#047857] text-white shadow-xs'
                : 'bg-emerald-50 text-[#047857] hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#047857]" /> Active &amp; Live
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === 'inactive'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            Paused / Expired
          </button>
        </div>
      </div>

      {/* Coupons Table / Cards */}
      {filteredCoupons.length === 0 ? (
        <EmptyState
          title="No coupons match your search"
          description="Create a new promotional code or clear your filter criteria."
          action={
            <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
              Clear Search Filter
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAF7] border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Offer Description</th>
                  <th className="py-3.5 px-4 text-center">Discount Value</th>
                  <th className="py-3.5 px-4 text-right">Min Cart Value</th>
                  <th className="py-3.5 px-4 text-center">Usage Progress</th>
                  <th className="py-3.5 px-4 text-center">Expiry Date</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCoupons.map((coupon) => {
                  const isExpired = new Date(coupon.expiresAt) < new Date();
                  return (
                    <tr key={coupon.id} className="hover:bg-[#F8FAF7]/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg bg-[#F1F9EC] border border-[#76CA3E]/40 text-[#143B0D] tracking-wider">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            title="Copy code to clipboard"
                            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-[#047857]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-bold text-[#0F172A] block truncate">
                          {coupon.title}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {coupon.discountType === 'flat'
                            ? `₹${coupon.discountValue} FLAT OFF`
                            : `${coupon.discountValue}% OFF (Max ₹${coupon.maxDiscount})`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-800 font-semibold">
                        ₹{coupon.minOrderValue}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-xs text-slate-600 font-semibold">
                          {coupon.timesUsed}{' '}
                          {coupon.usageLimit ? `/ ${coupon.usageLimit}` : 'redeemed'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-xs font-mono font-semibold ${
                            isExpired ? 'text-[#BA1A1A]' : 'text-slate-600'
                          }`}
                        >
                          {new Date(coupon.expiresAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(coupon.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                            coupon.active && !isExpired
                              ? 'bg-emerald-50 text-[#047857] border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              coupon.active && !isExpired ? 'bg-[#047857]' : 'bg-slate-400'
                            }`}
                          />
                          {coupon.active && !isExpired ? 'Active' : isExpired ? 'Expired' : 'Paused'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(coupon)}
                            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(coupon.id)}
                            className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-[#BA1A1A] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredCoupons.map((coupon) => {
              const isExpired = new Date(coupon.expiresAt) < new Date();
              return (
                <div key={coupon.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-[#F1F9EC] border border-[#76CA3E]/40 text-[#143B0D] tracking-wider">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className="text-slate-400 p-1"
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="w-3.5 h-3.5 text-[#047857]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-[#0F172A]">{coupon.title}</h4>
                    </div>

                    <button
                      onClick={() => handleToggleActive(coupon.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        coupon.active && !isExpired
                          ? 'bg-emerald-50 text-[#047857]'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          coupon.active && !isExpired ? 'bg-[#047857]' : 'bg-slate-400'
                        }`}
                      />
                      {coupon.active && !isExpired ? 'Active' : 'Off'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#F8FAF7] p-2.5 rounded-xl border border-slate-100 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Benefit</span>
                      <span className="font-bold text-[#143B0D] font-mono">
                        {coupon.discountType === 'flat' ? `₹${coupon.discountValue} OFF` : `${coupon.discountValue}%`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Min Order</span>
                      <span className="font-bold text-slate-800 font-mono">
                        ₹{coupon.minOrderValue}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Redeemed</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {coupon.timesUsed}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">
                      Expires: {new Date(coupon.expiresAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(coupon)}>
                        Edit
                      </Button>
                      <button
                        onClick={() => setDeleteConfirmId(coupon.id)}
                        className="text-slate-400 hover:text-[#BA1A1A] p-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? 'Edit Promo Coupon' : 'Create New Coupon'}
        size="md"
      >
        <form onSubmit={handleSaveCoupon} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#FFDAD6] text-[#BA1A1A] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Coupon Code (e.g. FESTIVE20) *
            </label>
            <Input
              placeholder="e.g. PUDURFREESHIP"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Offer Title / Customer Display Text *
            </label>
            <Input
              placeholder="e.g. Flat ₹50 Off on orders above ₹499"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as 'flat' | 'percentage',
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#76CA3E]"
              >
                <option value="flat">Flat ₹ Discount</option>
                <option value="percentage">Percentage (%) Discount</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {formData.discountType === 'flat' ? 'Discount Amount (₹)' : 'Discount Percentage (%)'}
              </label>
              <Input
                type="number"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: Number(e.target.value) })
                }
              />
            </div>
          </div>

          {formData.discountType === 'percentage' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Maximum Discount Cap (₹)
              </label>
              <Input
                type="number"
                value={formData.maxDiscount}
                onChange={(e) =>
                  setFormData({ ...formData, maxDiscount: Number(e.target.value) })
                }
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Cart Total (₹)
              </label>
              <Input
                type="number"
                value={formData.minOrderValue}
                onChange={(e) =>
                  setFormData({ ...formData, minOrderValue: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Redemptions Limit
              </label>
              <Input
                type="number"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({ ...formData, usageLimit: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Expiration Date</label>
            <Input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingCoupon ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteCoupon}
        title="Delete Promo Coupon?"
        description="Are you sure you want to delete this coupon code? Any customer currently attempting to apply this at checkout will receive an invalid code message."
        confirmLabel="Confirm Delete"
        variant="danger"
      />
    </div>
  );
};
