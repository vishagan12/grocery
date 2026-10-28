'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Check,
  X,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input, SearchInput, Select, Toggle, Textarea } from '../ui/FormControls';
import { StatusBadge } from '../ui/StatusBadge';
import { Modal, ConfirmationDialog, SideDrawer } from '../ui/Overlays';
import { FormSection } from '../ui/Miscellaneous';
import { PageHeader } from './PageHeader';

export interface ProductVariantData {
  id: string;
  label: string;
  price: number;
  mrp: number;
  stock_qty: number;
}

export interface AdminProductData {
  id: string;
  nameEn: string;
  nameTa: string;
  categoryId: string;
  image: string;
  inStock: boolean;
  variants: ProductVariantData[];
  descriptionEn?: string;
  descriptionTa?: string;
  badge?: string;
  originEn?: string;
}

export interface AdminCategoryData {
  id: string;
  nameEn: string;
  nameTa: string;
  image: string;
}

export interface AdminProductsViewProps {
  products: AdminProductData[];
  categories: AdminCategoryData[];
  onCreateProduct: (product: any) => Promise<void>;
  onUpdateProduct: (product: any) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onToggleProductStock: (productId: string, inStock: boolean) => Promise<void>;
  onBulkToggleStock: (productIds: string[], inStock: boolean) => Promise<void>;
  onRefresh: () => void;
  initialFilterCategory?: string;
}

export const AdminProductsView: React.FC<AdminProductsViewProps> = ({
  products,
  categories,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onToggleProductStock,
  onBulkToggleStock,
  onRefresh,
  initialFilterCategory,
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilterCategory || 'all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('name_asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Bulk Selection
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Add / Edit Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form Field States
  const [formData, setFormData] = useState({
    id: '',
    nameEn: '',
    nameTa: '',
    categoryId: categories[0]?.id || 'rice-grains',
    image: '',
    inStock: true,
    descriptionEn: '',
    descriptionTa: '',
    originEn: '',
    badge: '',
    variants: [
      { id: 'v1', label: '1 pack', price: 50, mrp: 60, stock_qty: 20 },
    ],
  });

  // Delete Confirmation State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<AdminProductData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync category if prop changes
  useEffect(() => {
    if (initialFilterCategory) setSelectedCategory(initialFilterCategory);
  }, [initialFilterCategory]);

  // Open Form for Adding New Product
  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setFormErrors({});
    setFormData({
      id: '',
      nameEn: '',
      nameTa: '',
      categoryId: categories[0]?.id || 'rice-grains',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
      inStock: true,
      descriptionEn: '',
      descriptionTa: '',
      originEn: 'Madurai, Tamil Nadu',
      badge: '',
      variants: [
        { id: `v-${Date.now()}-1`, label: '1 kg', price: 60, mrp: 75, stock_qty: 25 },
      ],
    });
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Product
  const handleOpenEditForm = (prod: AdminProductData) => {
    setEditingProduct(prod);
    setFormErrors({});
    setFormData({
      id: prod.id,
      nameEn: prod.nameEn,
      nameTa: prod.nameTa || '',
      categoryId: prod.categoryId,
      image: prod.image,
      inStock: prod.inStock,
      descriptionEn: prod.descriptionEn || '',
      descriptionTa: prod.descriptionTa || '',
      originEn: prod.originEn || '',
      badge: prod.badge || '',
      variants: prod.variants && prod.variants.length > 0
        ? prod.variants.map((v) => ({ ...v }))
        : [{ id: `${prod.id}-v1`, label: 'Standard Pack', price: 50, mrp: 60, stock_qty: 20 }],
    });
    setIsFormOpen(true);
  };

  // Form Field Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.nameEn.trim()) errors.nameEn = 'English product name is required';
    if (!formData.categoryId) errors.categoryId = 'Category selection is required';

    if (!formData.variants || formData.variants.length === 0) {
      errors.variants = 'At least one variant must be defined';
    } else {
      formData.variants.forEach((v, idx) => {
        if (!v.label.trim()) errors[`var_label_${idx}`] = 'Pack label required (e.g. 1 kg)';
        if (v.price < 0) errors[`var_price_${idx}`] = 'Price cannot be negative';
        if (v.stock_qty < 0) errors[`var_stock_${idx}`] = 'Stock cannot be negative';
        if (v.mrp < v.price) errors[`var_mrp_${idx}`] = 'MRP should be ≥ selling price';
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (editingProduct) {
        await onUpdateProduct({
          ...formData,
          id: editingProduct.id,
        });
      } else {
        await onCreateProduct(formData);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Save product failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Product Delete
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteProduct(productToDelete.id);
      setDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Delete product failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Add a new variant row in the form
  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: `v-${Date.now()}-${prev.variants.length + 1}`,
          label: `${prev.variants.length + 1} kg`,
          price: 100,
          mrp: 120,
          stock_qty: 20,
        },
      ],
    }));
  };

  // Remove a variant row from form
  const handleRemoveVariant = (index: number) => {
    if (formData.variants.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index),
    }));
  };

  // Update a single field inside a variant
  const handleUpdateVariantField = (
    index: number,
    field: keyof ProductVariantData,
    value: any
  ) => {
    setFormData((prev) => {
      const nextVars = [...prev.variants];
      nextVars[index] = { ...nextVars[index], [field]: value };
      return { ...prev, variants: nextVars };
    });
  };

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category Filter
        if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;

        // Active Online Filter
        if (activeFilter === 'active' && !p.inStock) return false;
        if (activeFilter === 'inactive' && p.inStock) return false;

        // Stock Filter
        const minStock = Math.min(...p.variants.map((v) => v.stock_qty ?? 0));
        if (stockFilter === 'out_of_stock' && minStock > 0) return false;
        if (stockFilter === 'low_stock' && (minStock >= 5 || minStock === 0)) return false;
        if (stockFilter === 'in_stock' && minStock < 5) return false;

        // Search Query (English name, Tamil name, ID)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNameEn = p.nameEn.toLowerCase().includes(q);
          const matchNameTa = p.nameTa ? p.nameTa.toLowerCase().includes(q) : false;
          const matchId = p.id.toLowerCase().includes(q);
          if (!matchNameEn && !matchNameTa && !matchId) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aMinPrice = a.variants[0]?.price ?? 0;
        const bMinPrice = b.variants[0]?.price ?? 0;
        const aTotalStock = a.variants.reduce((acc, v) => acc + (v.stock_qty ?? 0), 0);
        const bTotalStock = b.variants.reduce((acc, v) => acc + (v.stock_qty ?? 0), 0);

        switch (sortBy) {
          case 'price_asc':
            return aMinPrice - bMinPrice;
          case 'price_desc':
            return bMinPrice - aMinPrice;
          case 'stock_asc':
            return aTotalStock - bTotalStock;
          case 'stock_desc':
            return bTotalStock - aTotalStock;
          case 'name_asc':
          default:
            return a.nameEn.localeCompare(b.nameEn);
        }
      });
  }, [products, selectedCategory, stockFilter, activeFilter, searchQuery, sortBy]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Bulk Selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(paginatedProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleToggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header with Breadcrumbs & Action Button */}
      <PageHeader
        title="Products & Catalog Master"
        subtitle="முழுமையான பொருட்கள் மற்றும் விலை மேலாண்மை • Manage 1,000+ grocery SKUs, pricing & auto-buffer alerts"
        breadcrumbs={[
          { label: 'Admin', href: '#' },
          { label: 'Catalog', href: '#' },
          { label: 'Products' },
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
              onClick={handleOpenAddForm}
              icon={<Plus className="w-4 h-4" />}
            >
              Add New Product
            </Button>
          </div>
        }
      />

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => {
            setSelectedCategory('all');
            setCurrentPage(1);
          }}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-[#143B0D] text-white shadow-sm ring-2 ring-[#76CA3E]/30'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>All Categories</span>
          <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
            {products.length}
          </span>
        </button>

        {categories.map((cat) => {
          const count = products.filter((p) => p.categoryId === cat.id).length;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#143B0D] text-white shadow-sm ring-2 ring-[#76CA3E]/30'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{cat.nameEn}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Multi-Filter Control Strip */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-5">
            <SearchInput
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => setSearchQuery('')}
              placeholder="Search by product name in EN / தமிழ், barcode, or ID..."
            />
          </div>

          {/* Stock Filter Dropdown */}
          <div className="lg:col-span-3">
            <Select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Stock Levels' },
                { value: 'in_stock', label: 'In Stock (≥ 5 buffer)' },
                { value: 'low_stock', label: 'Low Stock (< 5 buffer)' },
                { value: 'out_of_stock', label: 'Out of Stock (0 units)' },
              ]}
            />
          </div>

          {/* Active Online Status Filter */}
          <div className="lg:col-span-2">
            <Select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'Active: All' },
                { value: 'active', label: 'Active (Online)' },
                { value: 'inactive', label: 'Disabled (Offline)' },
              ]}
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="lg:col-span-2">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              options={[
                { value: 'name_asc', label: 'Name (A to Z)' },
                { value: 'price_asc', label: 'Price (Low to High)' },
                { value: 'price_desc', label: 'Price (High to Low)' },
                { value: 'stock_asc', label: 'Stock (Low to High)' },
                { value: 'stock_desc', label: 'Stock (High to Low)' },
              ]}
            />
          </div>
        </div>

        {/* Results count & bulk actions banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span>Showing</span>
            <span className="font-bold text-slate-900 font-mono">
              {filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredProducts.length)}
            </span>
            <span>of</span>
            <span className="font-bold text-slate-900 font-mono">{filteredProducts.length}</span>
            <span>products</span>
            {searchQuery && (
              <span className="text-[#143B0D] font-semibold">matching &ldquo;{searchQuery}&rdquo;</span>
            )}
          </div>

          {/* Bulk Selection Actions */}
          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-2 bg-[#F1F9EC] border border-[#76CA3E]/30 px-3 py-1.5 rounded-xl">
              <span className="font-bold text-[#143B0D] font-mono">
                {selectedProductIds.length} selected
              </span>
              <div className="h-3 w-px bg-slate-300"></div>
              <button
                onClick={() => onBulkToggleStock(selectedProductIds, true)}
                className="text-xs font-bold text-[#143B0D] hover:underline"
              >
                Set Online
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => onBulkToggleStock(selectedProductIds, false)}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Set Offline
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => setSelectedProductIds([])}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Products Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedProducts.length > 0 &&
                      paginatedProducts.every((p) => selectedProductIds.includes(p.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#76CA3E] focus:ring-[#76CA3E]"
                    aria-label="Select all products on page"
                  />
                </th>
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Pack Variants &amp; Price</th>
                <th className="py-3 px-3">Stock Buffer</th>
                <th className="py-3 px-3 text-center">Online Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedProducts.map((product) => {
                const isSelected = selectedProductIds.includes(product.id);
                const firstVar = product.variants[0] || { label: '1 pack', price: 0, mrp: 0, stock_qty: 0 };
                const totalStock = product.variants.reduce((acc, v) => acc + (v.stock_qty ?? 0), 0);
                const isLowStock = product.variants.some((v) => (v.stock_qty ?? 0) < 5);
                const isOutOfStock = totalStock === 0;

                return (
                  <tr
                    key={product.id}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isSelected ? 'bg-[#F1F9EC]/50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectProduct(product.id)}
                        className="w-4 h-4 rounded border-slate-300 text-[#76CA3E] focus:ring-[#76CA3E]"
                        aria-label={`Select product ${product.nameEn}`}
                      />
                    </td>

                    {/* Product Name & Image */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80'}
                          alt={product.nameEn}
                          width={48}
                          height={48}
                          loading="lazy"
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200/80 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{product.nameEn}</p>
                          {product.nameTa && (
                            <p className="text-xs text-slate-500 truncate">{product.nameTa}</p>
                          )}
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">SKU: {product.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {categories.find((c) => c.id === product.categoryId)?.nameEn || product.categoryId}
                      </span>
                    </td>

                    {/* Variants & Price */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        {product.variants.map((v, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {v.label}
                            </span>
                            <span className="font-bold text-slate-900">₹{v.price}</span>
                            {v.mrp > v.price && (
                              <span className="text-slate-400 line-through text-[11px]">
                                ₹{v.mrp}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Stock Buffer Status */}
                    <td className="py-3 px-3">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold font-mono bg-[#FFDAD6] text-[#BA1A1A] border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>OUT OF STOCK</span>
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold font-mono bg-[#FFDCC3] text-[#2F1500] border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                          <span>&lt; 5 BUFFER ({totalStock} qty)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold font-mono bg-[#97F5CC] text-[#002115] border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#143B0D] shrink-0" />
                          <span>In Stock ({totalStock} qty)</span>
                        </span>
                      )}
                    </td>

                    {/* Online Active Switch */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onToggleProductStock(product.id, !product.inStock)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono transition-colors ${
                          product.inStock
                            ? 'bg-[#F1F9EC] text-[#143B0D] hover:bg-[#F1F9EC] border border-[#76CA3E]/40'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                        }`}
                        title={product.inStock ? 'Visible to customers' : 'Hidden from storefront'}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            product.inStock ? 'bg-[#76CA3E] animate-pulse' : 'bg-slate-400'
                          }`}
                        ></span>
                        <span>{product.inStock ? 'ONLINE' : 'OFFLINE'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 className="w-4 h-4" />}
                          onClick={() => handleOpenEditForm(product)}
                          aria-label={`Edit ${product.nameEn}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => {
                            setProductToDelete(product);
                            setDeleteModalOpen(true);
                          }}
                          aria-label={`Delete ${product.nameEn}`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                    No products found matching the current search &amp; filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View (< 1024px) */}
        <div className="block lg:hidden divide-y divide-slate-100">
          {paginatedProducts.map((product) => {
            const isSelected = selectedProductIds.includes(product.id);
            const totalStock = product.variants.reduce((acc, v) => acc + (v.stock_qty ?? 0), 0);
            const isLowStock = product.variants.some((v) => (v.stock_qty ?? 0) < 5);
            const isOutOfStock = totalStock === 0;

            return (
              <div
                key={product.id}
                className={`p-4 space-y-3 transition-colors ${
                  isSelected ? 'bg-[#F1F9EC]/50' : 'bg-white'
                }`}
              >
                {/* Top Row: Thumbnail + Titles + Active Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80'}
                      alt={product.nameEn}
                      width={52}
                      height={52}
                      loading="lazy"
                      className="w-13 h-13 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm leading-snug truncate">
                        {product.nameEn}
                      </p>
                      {product.nameTa && (
                        <p className="text-xs text-slate-500 truncate">{product.nameTa}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-slate-400">
                          {product.id}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          {categories.find((c) => c.id === product.categoryId)?.nameEn || product.categoryId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Online Switch */}
                  <button
                    onClick={() => onToggleProductStock(product.id, !product.inStock)}
                    className={`min-h-[44px] px-3 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 shrink-0 ${
                      product.inStock
                        ? 'bg-[#F1F9EC] text-[#143B0D] border border-[#76CA3E]'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        product.inStock ? 'bg-[#76CA3E]' : 'bg-slate-400'
                      }`}
                    ></span>
                    <span>{product.inStock ? 'ONLINE' : 'OFFLINE'}</span>
                  </button>
                </div>

                {/* Variants & Stock Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {product.variants.map((v, idx) => (
                      <span key={idx} className="text-xs font-mono font-bold text-slate-800">
                        {v.label}: ₹{v.price}
                      </span>
                    ))}
                  </div>

                  {/* Stock Badge */}
                  <div>
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#FFDAD6] text-[#BA1A1A]">
                        OUT OF STOCK
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#FFDCC3] text-[#2F1500]">
                        &lt; 5 BUFFER ({totalStock})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#97F5CC] text-[#002115]">
                        {totalStock} in stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile Bottom Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectProduct(product.id)}
                      className="w-4 h-4 rounded border-slate-300 text-[#76CA3E]"
                    />
                    <span>Select for bulk</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditForm(product)}
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600"
                      onClick={() => {
                        setProductToDelete(product);
                        setDeleteModalOpen(true);
                      }}
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {paginatedProducts.length === 0 && (
            <div className="py-12 px-4 text-center text-slate-400 font-mono text-xs">
              No products found matching the criteria.
            </div>
          )}
        </div>

        {/* 5. Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-mono"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

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
      {/* 6. PRODUCT ADD / EDIT MODAL & SIDE DRAWER */}
      {/* ==================================================================== */}
      <SideDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduct ? `Edit Product • ${editingProduct.nameEn}` : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-6">
          {/* Section 1: Basic Information */}
          <FormSection
            title="Basic Information"
            description="Product identity, English and Tamil titles, and storefront presentation"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Product Name (English) *"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="e.g. Ponni Boiled Rice"
                error={formErrors.nameEn}
                required
              />

              <Input
                label="Product Name (Tamil - தமிழ்)"
                value={formData.nameTa}
                onChange={(e) => setFormData({ ...formData, nameTa: e.target.value })}
                placeholder="e.g. பொன்னி புழுங்கல் அரிசி"
              />

              <Input
                label="Product SKU / ID"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="auto-generated-from-name"
                disabled={Boolean(editingProduct)}
                helperText={editingProduct ? 'ID cannot be changed after creation' : 'Leave empty to auto-generate'}
              />

              <Select
                label="Category *"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                options={categories.map((c) => ({ value: c.id, label: c.nameEn }))}
                error={formErrors.categoryId}
                required
              />

              <Input
                label="Storefront Badge (Optional)"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="e.g. Best Seller, Organic, Local Madurai"
              />

              <Input
                label="Origin / Source"
                value={formData.originEn}
                onChange={(e) => setFormData({ ...formData, originEn: e.target.value })}
                placeholder="e.g. Madurai, Tamil Nadu"
              />

              <div className="sm:col-span-2">
                <Textarea
                  label="Product Description"
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  placeholder="Describe the product quality, usage, and express delivery details..."
                  rows={2}
                />
              </div>
            </div>
          </FormSection>

          {/* Section 2: Pack Variants & Pricing */}
          <FormSection
            title="Pack Variants & Pricing"
            description="Define pack sizes, selling prices, MRP, and stock inventory. Auto-calculates savings %"
          >
            <div className="space-y-3">
              {formData.variants.map((v, idx) => {
                const discountPct = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;
                const isVariantLow = v.stock_qty < 5;

                return (
                  <div
                    key={v.id || idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono uppercase text-slate-700">
                        Variant #{idx + 1}
                      </span>
                      {formData.variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                        >
                          Remove Variant
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Input
                        label="Pack Label *"
                        value={v.label}
                        onChange={(e) => handleUpdateVariantField(idx, 'label', e.target.value)}
                        placeholder="e.g. 1 kg, 500 g"
                        error={formErrors[`var_label_${idx}`]}
                        required
                      />

                      <Input
                        label="Price (₹) *"
                        type="number"
                        value={v.price}
                        onChange={(e) =>
                          handleUpdateVariantField(idx, 'price', parseFloat(e.target.value) || 0)
                        }
                        error={formErrors[`var_price_${idx}`]}
                        required
                      />

                      <Input
                        label="MRP (₹) *"
                        type="number"
                        value={v.mrp}
                        onChange={(e) =>
                          handleUpdateVariantField(idx, 'mrp', parseFloat(e.target.value) || 0)
                        }
                        error={formErrors[`var_mrp_${idx}`]}
                        required
                      />

                      <Input
                        label="Stock (Units) *"
                        type="number"
                        value={v.stock_qty}
                        onChange={(e) =>
                          handleUpdateVariantField(idx, 'stock_qty', parseInt(e.target.value, 10) || 0)
                        }
                        error={formErrors[`var_stock_${idx}`]}
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                      <span className="text-slate-500">
                        Savings to Customer: <span className="text-[#143B0D] font-bold">{discountPct}% OFF</span>
                      </span>
                      {isVariantLow && (
                        <span className="text-[#BA1A1A] font-bold">
                          ⚠️ Warning: &lt; 5 buffer auto-disables item online
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVariant}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Another Pack Size / Variant
              </Button>
            </div>
          </FormSection>

          {/* Section 3: Product Image */}
          <FormSection
            title="Product Image & Media"
            description="Provide an image URL or choose a high quality grocery visual"
          >
            <div className="space-y-3">
              <Input
                label="Image URL"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />

              {formData.image && (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <img
                    src={formData.image}
                    alt={formData.nameEn || 'Preview'}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">Image Preview</p>
                    <p className="text-[11px] text-slate-500 truncate">{formData.image}</p>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="text-[11px] text-rose-600 hover:underline mt-1 font-semibold"
                    >
                      Clear image
                    </button>
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          {/* Section 4: Storefront Visibility */}
          <FormSection
            title="Storefront Visibility"
            description="Control whether customers can browse and purchase this product"
          >
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="font-bold text-sm text-slate-900">Active &amp; Available Online</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  When enabled, this item appears in customer catalog search &amp; category lists
                </p>
              </div>
              <Toggle
                checked={formData.inStock}
                onChange={(checked) => setFormData({ ...formData, inStock: checked })}
              />
            </div>
          </FormSection>

          {/* Sticky Bottom Submit Bar */}
          <div className="sticky bottom-0 -mx-6 -mb-6 p-4 bg-white/95 backdrop-blur-xs border-t border-slate-200 flex items-center justify-end gap-3 z-10">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsFormOpen(false)}
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
              {editingProduct ? 'Save Product Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </SideDrawer>

      {/* ==================================================================== */}
      {/* 7. DELETE CONFIRMATION DIALOG */}
      {/* ==================================================================== */}
      <ConfirmationDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Product"
        description={`Are you sure you want to permanently remove "${productToDelete?.nameEn}" from the catalog? This will also remove its associated pack variants.`}
        confirmText="Yes, Delete Product"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
