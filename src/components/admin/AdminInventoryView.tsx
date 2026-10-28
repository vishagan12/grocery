'use client';

import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Plus,
  Minus,
  Save,
  RefreshCw,
  SlidersHorizontal,
  Barcode,
  ExternalLink,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { SearchInput, Select } from '../ui/FormControls';
import { StatCard } from '../ui/StatCard';
import { StatusBadge } from '../ui/StatusBadge';
import { PageHeader } from './PageHeader';
import { AdminProductData, AdminCategoryData, ProductVariantData } from './AdminProductsView';

export interface AdminInventoryViewProps {
  products: AdminProductData[];
  categories: AdminCategoryData[];
  onUpdateVariant: (
    productId: string,
    variantId: string,
    field: 'price' | 'mrp' | 'stock_qty',
    value: number
  ) => Promise<void>;
  onToggleProductStock: (productId: string, inStock: boolean) => Promise<void>;
  onExportStockCsv: () => void;
  onRefresh: () => void;
}

export const AdminInventoryView: React.FC<AdminInventoryViewProps> = ({
  products,
  categories,
  onUpdateVariant,
  onToggleProductStock,
  onExportStockCsv,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockLevelFilter, setStockLevelFilter] = useState<'all' | 'low' | 'out' | 'safe'>('all');
  const [sortBy, setSortBy] = useState<'stock_asc' | 'stock_desc' | 'name_asc' | 'price_desc'>('stock_asc');

  // Track saved feedback per variant ID
  const [savedVariantIds, setSavedVariantIds] = useState<Record<string, boolean>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Compute overall inventory metrics
  const metrics = useMemo(() => {
    let totalSkus = 0;
    let totalUnits = 0;
    let lowBufferCount = 0;
    let outOfStockCount = 0;
    let safeBufferCount = 0;

    for (const p of products) {
      for (const v of p.variants) {
        totalSkus++;
        const stock = v.stock_qty ?? 0;
        totalUnits += stock;
        if (stock === 0) {
          outOfStockCount++;
        } else if (stock < 5) {
          lowBufferCount++;
        } else {
          safeBufferCount++;
        }
      }
    }

    return { totalSkus, totalUnits, lowBufferCount, outOfStockCount, safeBufferCount };
  }, [products]);

  // Handle Quick Stepper / Input Adjust
  const handleStockAdjust = async (
    productId: string,
    variantId: string,
    currentQty: number,
    delta: number
  ) => {
    const nextQty = Math.max(0, currentQty + delta);
    await onUpdateVariant(productId, variantId, 'stock_qty', nextQty);

    // Flash save feedback
    setSavedVariantIds((prev) => ({ ...prev, [variantId]: true }));
    setTimeout(() => {
      setSavedVariantIds((prev) => ({ ...prev, [variantId]: false }));
    }, 1500);
  };

  const handleStockDirectInput = async (
    productId: string,
    variantId: string,
    rawVal: string
  ) => {
    const val = parseInt(rawVal, 10);
    const nextQty = isNaN(val) ? 0 : Math.max(0, val);
    await onUpdateVariant(productId, variantId, 'stock_qty', nextQty);

    setSavedVariantIds((prev) => ({ ...prev, [variantId]: true }));
    setTimeout(() => {
      setSavedVariantIds((prev) => ({ ...prev, [variantId]: false }));
    }, 1500);
  };

  // Flatten products into variant rows for scannable inventory view
  const inventoryRows = useMemo(() => {
    const rows: {
      productId: string;
      productNameEn: string;
      productNameTa: string;
      productImage: string;
      inStock: boolean;
      categoryId: string;
      variantId: string;
      variantLabel: string;
      price: number;
      mrp: number;
      stock_qty: number;
    }[] = [];

    for (const p of products) {
      for (const v of p.variants) {
        rows.push({
          productId: p.id,
          productNameEn: p.nameEn,
          productNameTa: p.nameTa,
          productImage: p.image,
          inStock: p.inStock,
          categoryId: p.categoryId,
          variantId: v.id,
          variantLabel: v.label,
          price: v.price,
          mrp: v.mrp,
          stock_qty: v.stock_qty ?? 0,
        });
      }
    }

    return rows;
  }, [products]);

  // Filtering & Sorting
  const filteredRows = useMemo(() => {
    return inventoryRows
      .filter((row) => {
        // Category
        if (selectedCategory !== 'all' && row.categoryId !== selectedCategory) return false;

        // Stock Filter
        if (stockLevelFilter === 'low' && (row.stock_qty >= 5 || row.stock_qty === 0)) return false;
        if (stockLevelFilter === 'out' && row.stock_qty > 0) return false;
        if (stockLevelFilter === 'safe' && row.stock_qty < 5) return false;

        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = row.productNameEn.toLowerCase().includes(q);
          const matchTa = row.productNameTa ? row.productNameTa.toLowerCase().includes(q) : false;
          const matchId = row.productId.toLowerCase().includes(q) || row.variantId.toLowerCase().includes(q);
          if (!matchName && !matchTa && !matchId) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'stock_desc':
            return b.stock_qty - a.stock_qty;
          case 'name_asc':
            return a.productNameEn.localeCompare(b.productNameEn);
          case 'price_desc':
            return b.price - a.price;
          case 'stock_asc':
          default:
            return a.stock_qty - b.stock_qty;
        }
      });
  }, [inventoryRows, selectedCategory, stockLevelFilter, searchQuery, sortBy]);

  // Pagination slice
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  return (
    <div className="w-full space-y-6">
      {/* 1. Header with Breadcrumbs & Action Buttons */}
      <PageHeader
        title="Inventory & Stock Switchboard"
        subtitle="தானியங்கி கையிருப்பு மேலாண்மை • 5 அலகுகளுக்கு கீழ் உள்ள பொருட்கள் ஆன்லைனில் தானாகவே முடக்கப்படும்"
        breadcrumbs={[
          { label: 'Admin', href: '#' },
          { label: 'Inventory', href: '#' },
          { label: 'Stock Buffer' },
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
              onClick={onExportStockCsv}
              icon={<Download className="w-4 h-4" />}
            >
              Export Stock CSV
            </Button>
          </div>
        }
      />

      {/* 2. Top Metric KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Monitored SKUs"
          value={metrics.totalSkus}
          subtitle={`${metrics.totalUnits} total units in store`}
          icon={<Layers className="w-4 h-4" />}
        />
        <StatCard
          title="Safe Buffer (≥ 5 Units)"
          value={metrics.safeBufferCount}
          subtitle="Online & express fulfillable"
          icon={<CheckCircle2 className="w-4 h-4" />}
          badge={<StatusBadge stock="in_stock" size="sm" />}
        />
        <StatCard
          title="Low Buffer Alerts (< 5)"
          value={metrics.lowBufferCount}
          subtitle="Auto-disabled guard triggered"
          icon={<AlertTriangle className="w-4 h-4" />}
          badge={<StatusBadge stock="low_buffer" size="sm" pulse />}
        />
        <StatCard
          title="Out of Stock (0 Units)"
          value={metrics.outOfStockCount}
          subtitle="Unavailable to customers"
          icon={<XCircle className="w-4 h-4" />}
          badge={<StatusBadge stock="out_of_stock" size="sm" />}
        />
      </div>

      {/* 3. Category Horizontal Filter Pills */}
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
            {inventoryRows.length}
          </span>
        </button>

        {categories.map((cat) => {
          const count = inventoryRows.filter((r) => r.categoryId === cat.id).length;
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

      {/* 4. Search & Buffer Guard Filter Strip */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="lg:col-span-6">
            <SearchInput
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => setSearchQuery('')}
              placeholder="Filter by product name, Tamil title, or SKU barcode..."
            />
          </div>

          {/* Stock Level Quick Chips */}
          <div className="lg:col-span-3">
            <Select
              value={stockLevelFilter}
              onChange={(e) => {
                setStockLevelFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Inventory Levels' },
                { value: 'low', label: 'Low Stock Alert (< 5 Units)' },
                { value: 'out', label: 'Completely Out of Stock (0)' },
                { value: 'safe', label: 'Safe Buffer (≥ 5 Units)' },
              ]}
            />
          </div>

          {/* Sort By */}
          <div className="lg:col-span-3">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              options={[
                { value: 'stock_asc', label: 'Stock: Low to High (Urgent First)' },
                { value: 'stock_desc', label: 'Stock: High to Low' },
                { value: 'name_asc', label: 'Product Name (A to Z)' },
                { value: 'price_desc', label: 'Price: High to Low' },
              ]}
            />
          </div>
        </div>

        {/* Counter Info & Auto-Guard Alert Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span>Showing</span>
            <span className="font-bold text-slate-900 font-mono">
              {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredRows.length)}
            </span>
            <span>of</span>
            <span className="font-bold text-slate-900 font-mono">{filteredRows.length}</span>
            <span>variants</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#BA1A1A] bg-[#FFDAD6] px-2.5 py-1 rounded-md">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>AUTO OUT-OF-STOCK GUARD ACTIVE &lt; 5 UNITS</span>
          </div>
        </div>
      </div>

      {/* 5. Dense Scannable Stock Table (Desktop >= 1024px) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Pack Variant</th>
                <th className="py-3 px-3">Price (₹)</th>
                <th className="py-3 px-3">MRP (₹)</th>
                <th className="py-3 px-4 text-center">Stock Quick Stepper</th>
                <th className="py-3 px-3">Buffer Guard</th>
                <th className="py-3 px-4 text-right">Online Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.map((row) => {
                const isSaved = savedVariantIds[row.variantId];
                const isOutOfStock = row.stock_qty === 0;
                const isLowStock = row.stock_qty < 5;

                return (
                  <tr
                    key={`${row.productId}-${row.variantId}`}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isLowStock ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Product Name & Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={row.productImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                          alt={row.productNameEn}
                          width={44}
                          height={44}
                          className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{row.productNameEn}</p>
                          {row.productNameTa && (
                            <p className="text-xs text-slate-500 truncate">{row.productNameTa}</p>
                          )}
                          <p className="text-[10px] font-mono text-slate-400">ID: {row.productId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {categories.find((c) => c.id === row.categoryId)?.nameEn || row.categoryId}
                      </span>
                    </td>

                    {/* Pack Variant */}
                    <td className="py-3 px-3 font-mono font-bold text-xs text-slate-800">
                      {row.variantLabel}
                    </td>

                    {/* Price Input */}
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        value={row.price}
                        onChange={(e) =>
                          onUpdateVariant(
                            row.productId,
                            row.variantId,
                            'price',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-20 h-8 px-2 font-mono text-xs font-bold text-slate-900 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#143B0D]"
                      />
                    </td>

                    {/* MRP Input */}
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        value={row.mrp}
                        onChange={(e) =>
                          onUpdateVariant(
                            row.productId,
                            row.variantId,
                            'mrp',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-20 h-8 px-2 font-mono text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#143B0D]"
                      />
                    </td>

                    {/* Quick Stepper Stock Adjust */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleStockAdjust(row.productId, row.variantId, row.stock_qty, -1)
                          }
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors"
                          aria-label={`Decrease stock for ${row.productNameEn}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <input
                          type="number"
                          inputMode="numeric"
                          value={row.stock_qty}
                          onChange={(e) =>
                            handleStockDirectInput(row.productId, row.variantId, e.target.value)
                          }
                          className={`w-16 h-8 text-center font-mono text-xs font-bold rounded-lg border transition-all ${
                            isLowStock
                              ? 'bg-[#FFDAD6] text-[#BA1A1A] border-rose-300'
                              : 'bg-white text-[#143B0D] border-slate-200'
                          } ${isSaved ? 'ring-2 ring-[#76CA3E]' : ''}`}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            handleStockAdjust(row.productId, row.variantId, row.stock_qty, 1)
                          }
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors"
                          aria-label={`Increase stock for ${row.productNameEn}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Buffer Guard Status */}
                    <td className="py-3 px-3">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#FFDAD6] text-[#BA1A1A]">
                          <XCircle className="w-3 h-3" />
                          <span>OUT (0)</span>
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#FFDCC3] text-[#2F1500]">
                          <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                          <span>&lt; 5 AUTO-DISABLED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#97F5CC] text-[#002115]">
                          <CheckCircle2 className="w-3 h-3 text-[#143B0D]" />
                          <span>SAFE ({row.stock_qty})</span>
                        </span>
                      )}
                    </td>

                    {/* Online Toggle Switch */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onToggleProductStock(row.productId, !row.inStock)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono transition-colors ${
                          row.inStock
                            ? 'bg-[#F1F9EC] text-[#143B0D] hover:bg-[#F1F9EC] border border-[#76CA3E]/40'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            row.inStock ? 'bg-[#76CA3E]' : 'bg-slate-400'
                          }`}
                        ></span>
                        <span>{row.inStock ? 'ONLINE' : 'DISABLED'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono text-xs">
                    No items found matching the current inventory filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 6. Mobile Aisle Walk View (< 1024px) */}
        <div className="block lg:hidden divide-y divide-slate-100">
          {paginatedRows.map((row) => {
            const isSaved = savedVariantIds[row.variantId];
            const isLowStock = row.stock_qty < 5;
            const isOutOfStock = row.stock_qty === 0;

            return (
              <div
                key={`${row.productId}-${row.variantId}`}
                className={`p-4 space-y-3 ${isLowStock ? 'bg-amber-50/20' : 'bg-white'}`}
              >
                {/* Header: Thumbnail + Titles + Active Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={row.productImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80'}
                      alt={row.productNameEn}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{row.productNameEn}</p>
                      {row.productNameTa && (
                        <p className="text-xs text-slate-500 truncate">{row.productNameTa}</p>
                      )}
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                        Pack: {row.variantLabel}
                      </span>
                    </div>
                  </div>

                  {/* Online switch */}
                  <button
                    onClick={() => onToggleProductStock(row.productId, !row.inStock)}
                    className={`min-h-[44px] px-3 rounded-full text-xs font-bold font-mono flex items-center gap-1.5 shrink-0 ${
                      row.inStock
                        ? 'bg-[#F1F9EC] text-[#143B0D] border border-[#76CA3E]'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        row.inStock ? 'bg-[#76CA3E]' : 'bg-slate-400'
                      }`}
                    ></span>
                    <span>{row.inStock ? 'LIVE' : 'OFF'}</span>
                  </button>
                </div>

                {/* Stock Stepper & Quick Price Bar */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">
                      Price: ₹{row.price} <span className="line-through text-slate-400">₹{row.mrp}</span>
                    </span>
                    {isOutOfStock ? (
                      <span className="px-2 py-0.5 rounded font-bold bg-[#FFDAD6] text-[#BA1A1A]">
                        OUT OF STOCK
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2 py-0.5 rounded font-bold bg-[#FFDCC3] text-[#2F1500]">
                        &lt; 5 BUFFER AUTO-DISABLED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded font-bold bg-[#97F5CC] text-[#002115]">
                        SAFE BUFFER
                      </span>
                    )}
                  </div>

                  {/* 48px Thumb Stepper */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleStockAdjust(row.productId, row.variantId, row.stock_qty, -1)
                      }
                      className="min-h-[48px] flex-1 bg-white border border-slate-300 active:bg-slate-200 rounded-xl flex items-center justify-center font-bold text-lg text-slate-800 shadow-xs"
                      aria-label="Decrease stock"
                    >
                      <Minus className="w-5 h-5" />
                    </button>

                    <input
                      type="number"
                      inputMode="numeric"
                      value={row.stock_qty}
                      onChange={(e) =>
                        handleStockDirectInput(row.productId, row.variantId, e.target.value)
                      }
                      className={`min-h-[48px] w-24 text-center font-mono text-xl font-bold rounded-xl border ${
                        isLowStock
                          ? 'bg-[#FFDAD6] text-[#BA1A1A] border-rose-300'
                          : 'bg-white text-[#143B0D] border-slate-300'
                      } ${isSaved ? 'ring-2 ring-[#76CA3E]' : ''}`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        handleStockAdjust(row.productId, row.variantId, row.stock_qty, 1)
                      }
                      className="min-h-[48px] flex-1 bg-white border border-slate-300 active:bg-slate-200 rounded-xl flex items-center justify-center font-bold text-lg text-slate-800 shadow-xs"
                      aria-label="Increase stock"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 7. Pagination Controls */}
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
                <option value={20}>20</option>
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
    </div>
  );
};
