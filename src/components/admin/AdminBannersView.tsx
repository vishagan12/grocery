'use client';

import React, { useState } from 'react';
import {
  Image,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Link2,
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { StatCard } from '../ui/StatCard';
import { Input, Select, Toggle } from '../ui/FormControls';
import { Button } from '../ui/Button';
import { Modal, ConfirmationDialog } from '../ui/Overlays';
import { EmptyState } from '../ui/Miscellaneous';

export interface BannerItem {
  id: string;
  title: string;
  subtitleTa: string;
  badgeText: string;
  placement: 'hero' | 'top_strip' | 'spotlight';
  imageUrl: string;
  targetRoute: string;
  active: boolean;
  orderIndex: number;
}

const INITIAL_BANNERS: BannerItem[] = [
  {
    id: 'b-01',
    title: 'Farm Fresh Organic Vegetables',
    subtitleTa: 'தினமும் புதிய நஞ்சில்லா காய்கறிகள்',
    badgeText: 'DAILY FRESH • 15 MINS',
    placement: 'hero',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    targetRoute: '/products?category=vegetables',
    active: true,
    orderIndex: 1,
  },
  {
    id: 'b-02',
    title: 'Monthly Ration & Grocery Savings',
    subtitleTa: 'மாதாந்திர மளிகை பொருட்கள் தள்ளுபடி விலையில்',
    badgeText: 'SAVE UP TO 25%',
    placement: 'hero',
    imageUrl:
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    targetRoute: '/monthly-list',
    active: true,
    orderIndex: 2,
  },
  {
    id: 'b-03',
    title: '⚡ K.Pudur & Tallakulam Free Delivery on Orders Over ₹499!',
    subtitleTa: 'ரூ.499க்கு மேல் வாங்கும் பொருட்களுக்கு இலவச டெலிவரி',
    badgeText: 'LIMITED PERIOD',
    placement: 'top_strip',
    imageUrl: '',
    targetRoute: '/checkout',
    active: true,
    orderIndex: 3,
  },
  {
    id: 'b-04',
    title: 'Aavin Milk & Fresh Dairy Delivered by 7 AM',
    subtitleTa: 'ஆவின் பால் மற்றும் பால் பொருட்கள்',
    badgeText: 'MORNING DISPATCH',
    placement: 'spotlight',
    imageUrl:
      'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=800&q=80',
    targetRoute: '/products?category=dairy',
    active: true,
    orderIndex: 4,
  },
];

export const AdminBannersView: React.FC = () => {
  const [banners, setBanners] = useState<BannerItem[]>(INITIAL_BANNERS);
  const [placementFilter, setPlacementFilter] = useState<'all' | 'hero' | 'top_strip' | 'spotlight'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitleTa: '',
    badgeText: '',
    placement: 'hero' as 'hero' | 'top_strip' | 'spotlight',
    imageUrl: '',
    targetRoute: '/products',
    active: true,
  });
  const [formError, setFormError] = useState('');

  const filteredBanners = banners.filter((b) => {
    if (placementFilter !== 'all' && b.placement !== placementFilter) return false;
    return true;
  });

  const handleToggleActive = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
  };

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitleTa: '',
      badgeText: 'FEATURED',
      placement: 'hero',
      imageUrl:
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      targetRoute: '/products',
      active: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: BannerItem) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitleTa: banner.subtitleTa,
      badgeText: banner.badgeText,
      placement: banner.placement,
      imageUrl: banner.imageUrl,
      targetRoute: banner.targetRoute,
      active: banner.active,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Please enter a banner title.');
      return;
    }

    if (editingBanner) {
      setBanners((prev) =>
        prev.map((b) =>
          b.id === editingBanner.id
            ? {
                ...b,
                ...formData,
                title: formData.title.trim(),
                subtitleTa: formData.subtitleTa.trim(),
              }
            : b
        )
      );
    } else {
      const newBanner: BannerItem = {
        id: `banner-${Date.now()}`,
        ...formData,
        title: formData.title.trim(),
        subtitleTa: formData.subtitleTa.trim(),
        orderIndex: banners.length + 1,
      };
      setBanners((prev) => [...prev, newBanner]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteBanner = () => {
    if (!deleteConfirmId) return;
    setBanners((prev) => prev.filter((b) => b.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners & Content Merchandising"
        subtitle="Control storefront hero carousels, top urgent announcement strips, and promotional offer tiles."
        actions={
          <Button variant="primary" size="md" onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Promotional Banner
          </Button>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Banners"
          value={`${banners.filter((b) => b.active).length} / ${banners.length}`}
          icon={<Image className="w-5 h-5 text-[#143B0D]" />}
          description="Live on storefront"
        />
        <StatCard
          label="Hero Slider Slides"
          value={banners.filter((b) => b.placement === 'hero' && b.active).length}
          icon={<Sparkles className="w-5 h-5 text-[#D97706]" />}
          description="High-visibility home carousel"
        />
        <StatCard
          label="Top Promo Strip"
          value={banners.filter((b) => b.placement === 'top_strip' && b.active).length > 0 ? 'Active' : 'Off'}
          icon={<CheckCircle2 className="w-5 h-5 text-[#047857]" />}
          description="Sticky top alert bar"
        />
        <StatCard
          label="Featured Spotlights"
          value={banners.filter((b) => b.placement === 'spotlight' && b.active).length}
          icon={<Layers className="w-5 h-5 text-[#0047BF]" />}
          description="Category cards on floor"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setPlacementFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            placementFilter === 'all'
              ? 'bg-[#143B0D] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Banners ({banners.length})
        </button>
        <button
          onClick={() => setPlacementFilter('hero')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            placementFilter === 'hero'
              ? 'bg-[#143B0D] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Hero Slider ({banners.filter((b) => b.placement === 'hero').length})
        </button>
        <button
          onClick={() => setPlacementFilter('top_strip')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            placementFilter === 'top_strip'
              ? 'bg-[#143B0D] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Top Promo Strip
        </button>
        <button
          onClick={() => setPlacementFilter('spotlight')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            placementFilter === 'spotlight'
              ? 'bg-[#143B0D] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Category Spotlights
        </button>
      </div>

      {/* Banners Grid */}
      {filteredBanners.length === 0 ? (
        <EmptyState
          title="No banners found for this placement"
          description="Create a new promotional banner to feature special products or store discounts."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBanners.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs space-y-3 hover:border-[#76CA3E]/50 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Visual Banner Preview */}
                {b.imageUrl ? (
                  <div className="w-full h-36 bg-slate-100 relative overflow-hidden group">
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      {b.badgeText && (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#76CA3E] text-[#143B0D] text-[10px] font-extrabold uppercase mb-1 shadow-xs">
                          {b.badgeText}
                        </span>
                      )}
                      <h4 className="text-sm font-bold truncate drop-shadow-sm">{b.title}</h4>
                    </div>
                  </div>
                ) : (
                  <div className="w-full p-4 bg-[#143B0D] text-white flex flex-col justify-center">
                    <span className="text-[10px] font-extrabold uppercase text-[#97F5CC] tracking-wider mb-1">
                      {b.badgeText || 'ANNOUNCEMENT STRIP'}
                    </span>
                    <h4 className="text-sm font-bold">{b.title}</h4>
                  </div>
                )}

                {/* Info Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
                        Placement: {b.placement.replace('_', ' ')}
                      </span>
                      {b.subtitleTa && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {b.subtitleTa}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleActive(b.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                        b.active
                          ? 'bg-emerald-50 text-[#047857] border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          b.active ? 'bg-[#047857]' : 'bg-slate-400'
                        }`}
                      />
                      {b.active ? 'Live' : 'Hidden'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-1.5 font-mono pt-1">
                    <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{b.targetRoute}</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">ID: {b.id}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(b)}>
                    Edit Banner
                  </Button>
                  <button
                    onClick={() => setDeleteConfirmId(b.id)}
                    className="p-1.5 text-slate-400 hover:text-[#BA1A1A] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBanner ? 'Edit Promotional Banner' : 'Create Storefront Banner'}
        size="md"
      >
        <form onSubmit={handleSaveBanner} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#FFDAD6] text-[#BA1A1A] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Banner Title (English) *
            </label>
            <Input
              placeholder="e.g. Traditional Cold-Pressed Sesame Oil & Ghee"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Banner Subtitle (Tamil / தமிழ்)
            </label>
            <Input
              placeholder="e.g. பாரம்பரிய மரச்செக்கு நல்லெண்ணெய் மற்றும் நெய்"
              value={formData.subtitleTa}
              onChange={(e) => setFormData({ ...formData, subtitleTa: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Placement Slot</label>
              <select
                value={formData.placement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    placement: e.target.value as 'hero' | 'top_strip' | 'spotlight',
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#76CA3E]"
              >
                <option value="hero">Homepage Hero Slider</option>
                <option value="top_strip">Top Sticky Announcement</option>
                <option value="spotlight">Category Spotlight Card</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Badge Callout</label>
              <Input
                placeholder="e.g. FESTIVE 20% OFF"
                value={formData.badgeText}
                onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Image URL</label>
            <Input
              placeholder="https://images.unsplash.com/..."
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Click Destination Route
            </label>
            <Input
              placeholder="/products?category=oils or /monthly-list"
              value={formData.targetRoute}
              onChange={(e) => setFormData({ ...formData, targetRoute: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingBanner ? 'Save Changes' : 'Publish Banner'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteBanner}
        title="Delete Promotional Banner?"
        description="Are you sure you want to remove this banner from storefront displays? It will immediately stop appearing on customer browsers."
        confirmLabel="Confirm Delete"
        variant="danger"
      />
    </div>
  );
};
