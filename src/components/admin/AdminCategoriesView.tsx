'use client';

import React, { useState, useMemo } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  ExternalLink,
  Package,
  Layers,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  RefreshCw,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input, SearchInput } from '../ui/FormControls';
import { Modal, ConfirmationDialog } from '../ui/Overlays';
import { PageHeader } from './PageHeader';
import { AdminCategoryData, AdminProductData } from './AdminProductsView';

export interface AdminCategoriesViewProps {
  categories: AdminCategoryData[];
  products: AdminProductData[];
  onCreateCategory: (category: AdminCategoryData) => Promise<void>;
  onUpdateCategory: (category: AdminCategoryData) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onSelectCategory: (categoryId: string) => void;
  onRefresh: () => void;
}

export const AdminCategoriesView: React.FC<AdminCategoriesViewProps> = ({
  categories,
  products,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onSelectCategory,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<AdminCategoryData>({
    id: '',
    nameEn: '',
    nameTa: '',
    image: '',
  });

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategoryData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute product counts per category
  const categoryProductCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      map[p.categoryId] = (map[p.categoryId] || 0) + 1;
    }
    return map;
  }, [products]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.nameEn.toLowerCase().includes(q) ||
        (c.nameTa && c.nameTa.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormErrors({});
    setFormData({
      id: '',
      nameEn: '',
      nameTa: '',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: AdminCategoryData) => {
    setEditingCategory(cat);
    setFormErrors({});
    setFormData({ ...cat });
    setIsModalOpen(true);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.nameEn.trim()) errors.nameEn = 'Category English name is required';
    if (!editingCategory && !formData.id.trim() && !formData.nameEn.trim()) {
      errors.id = 'Category ID is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const slug = formData.id
        ? formData.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        : formData.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const payload = {
        ...formData,
        id: editingCategory ? editingCategory.id : slug,
      };

      if (editingCategory) {
        await onUpdateCategory(payload);
      } else {
        await onCreateCategory(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Save category failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteCategory(categoryToDelete.id);
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Delete category failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const productsInSelectedCategory = categoryToDelete
    ? categoryProductCounts[categoryToDelete.id] || 0
    : 0;

  return (
    <div className="w-full space-y-6">
      {/* 1. Header with Breadcrumbs & Actions */}
      <PageHeader
        title="Store Categories & Aisles"
        subtitle="பொருட்கள் வகைகள் • Organize product hierarchy, aisle cards, and customer navigation"
        breadcrumbs={[
          { label: 'Admin', href: '#' },
          { label: 'Catalog', href: '#' },
          { label: 'Categories' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              icon={<Plus className="w-4 h-4" />}
            >
              Add New Category
            </Button>
          </div>
        }
      />

      {/* 2. Search & View Mode Switcher */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search categories in English or தமிழ்..."
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono">
            {filteredCategories.length} Categories Defined
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
              aria-label="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Grid Mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => {
            const count = categoryProductCounts[cat.id] || 0;
            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category Image Header */}
                  <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={cat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'}
                      alt={cat.nameEn}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-2.5 left-3 right-3 text-white">
                      <span className="text-[10px] font-mono uppercase tracking-wider bg-[#143B0D]/80 backdrop-blur-xs px-2 py-0.5 rounded-md font-bold text-[#97F5CC]">
                        {count} SKUs
                      </span>
                      <h3 className="font-bold text-sm leading-tight mt-1 truncate drop-shadow-sm">
                        {cat.nameEn}
                      </h3>
                      {cat.nameTa && (
                        <p className="text-[11px] text-white/90 truncate">{cat.nameTa}</p>
                      )}
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">Category Slug:</span>
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {cat.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-700 text-xs"
                    onClick={() => onSelectCategory(cat.id)}
                    icon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    View Items
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(cat)}
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                      aria-label={`Edit ${cat.nameEn}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => {
                        setCategoryToDelete(cat);
                        setDeleteModalOpen(true);
                      }}
                      aria-label={`Delete ${cat.nameEn}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-4 py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-mono text-xs">
              No categories found matching &ldquo;{searchQuery}&rdquo;.
            </div>
          )}
        </div>
      )}

      {/* 4. Table Mode */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-3">Slug / ID</th>
                  <th className="py-3 px-3 text-center">Products Count</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat) => {
                  const count = categoryProductCounts[cat.id] || 0;
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={cat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=80&q=80'}
                            alt={cat.nameEn}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                            loading="lazy"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{cat.nameEn}</p>
                            {cat.nameTa && <p className="text-xs text-slate-500">{cat.nameTa}</p>}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-xs text-slate-600">
                        {cat.id}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#F1F9EC] text-[#143B0D] border border-[#76CA3E]/30">
                          {count} Products
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSelectCategory(cat.id)}
                            icon={<ExternalLink className="w-3.5 h-3.5" />}
                          >
                            Browse
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(cat)}
                            icon={<Edit2 className="w-3.5 h-3.5" />}
                            aria-label={`Edit ${cat.nameEn}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => {
                              setCategoryToDelete(cat);
                              setDeleteModalOpen(true);
                            }}
                            aria-label={`Delete ${cat.nameEn}`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. ADD / EDIT CATEGORY MODAL */}
      {/* ==================================================================== */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? `Edit Category • ${editingCategory.nameEn}` : 'Create New Category'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Category Name (English) *"
            value={formData.nameEn}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
            placeholder="e.g. Rice, Atta & Grains"
            error={formErrors.nameEn}
            required
          />

          <Input
            label="Category Name (Tamil - தமிழ்)"
            value={formData.nameTa}
            onChange={(e) => setFormData({ ...formData, nameTa: e.target.value })}
            placeholder="e.g. அரிசி, மாவு & தானியங்கள்"
          />

          <Input
            label="Category Slug / ID"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="e.g. rice-grains"
            disabled={Boolean(editingCategory)}
            helperText={editingCategory ? 'ID cannot be modified once created' : 'Leave empty to auto-slugify English name'}
            error={formErrors.id}
          />

          <Input
            label="Banner Image URL"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://images.unsplash.com/..."
          />

          {formData.image && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={formData.image}
                alt="Preview"
                className="w-14 h-14 rounded-lg object-cover bg-white"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800">Banner Preview</p>
                <p className="text-[11px] text-slate-400 truncate">{formData.image}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              icon={<Check className="w-4 h-4" />}
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ==================================================================== */}
      {/* 6. SAFE DELETE CONFIRMATION MODAL */}
      {/* ==================================================================== */}
      <ConfirmationDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        description={
          productsInSelectedCategory > 0
            ? `⚠️ Cannot delete "${categoryToDelete?.nameEn}" because it currently contains ${productsInSelectedCategory} products. Please reassign or delete these products first.`
            : `Are you sure you want to delete the category "${categoryToDelete?.nameEn}"? This action cannot be undone.`
        }
        confirmText={productsInSelectedCategory > 0 ? 'Cannot Delete (Contains Products)' : 'Yes, Delete Category'}
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
