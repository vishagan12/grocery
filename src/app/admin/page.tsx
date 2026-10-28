'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Store,
  Printer,
  Volume2,
  VolumeX,
  Truck,
  Package,
  Layers,
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Search,
  Download,
  Upload,
  User,
  Barcode,
  Languages,
  Check,
  AlertCircle,
  RefreshCw,
  Lock,
  Unlock,
  Radio,
  FileText,
  DollarSign,
  Share2,
  Menu,
  X,
  ClipboardList,
  IndianRupee,
  Power,
  AlertTriangle,
  Plus,
  Minus,
  Save,
} from 'lucide-react';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';
import {
  AdminDashboard,
  AdminOrdersView,
  AdminProductsView,
  AdminCategoriesView,
  AdminInventoryView,
  AdminLoginView,
  AdminCustomersView,
  AdminRidersView,
  AdminZonesSlotsView,
  AdminCouponsView,
  AdminReportsView,
  AdminBannersView,
  AdminSettingsView,
  AdminRolesView,
  AdminCategoryData,
} from '@/components/admin';

interface OrderItem {
  id: string;
  productId: string;
  productNameEn: string;
  productNameTa: string;
  variantLabel: string;
  price: number;
  quantity: number;
  packed?: boolean;
}

interface AdminOrder {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  status: number; // 0: New, 1: Packing/Ready, 2: Out for delivery, 3: Delivered, 4: Cancelled
  deliverySlot: string;
  createdAt: string;
  isForSomeoneElse?: boolean;
  recipientName?: string;
  recipientPhone?: string;
  assignedRiderName?: string;
  assignedRiderPhone?: string;
  items: OrderItem[];
}

interface ProductVariant {
  id: string;
  label: string;
  price: number;
  mrp: number;
  stock_qty: number;
}

interface AdminProduct {
  id: string;
  nameEn: string;
  nameTa: string;
  categoryId: string;
  image: string;
  inStock: boolean;
  variants: ProductVariant[];
}

// Web Audio API Synthesizer for supermarket two-tone chime (880Hz -> 1174Hz)
function playNewOrderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // Tone A5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.18); // Tone D6
    gain2.gain.setValueAtTime(0.35, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.7);
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
}

export default function AdminPage() {
  // Passcode Lock Screen
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Core Data
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [catalog, setCatalog] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategoryData[]>([]);
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [loading, setLoading] = useState(true);

  // Settings & Filter states
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [barcodeSearch, setBarcodeSearch] = useState('');

  // Navigation & stage switcher state
  const [mobileTab, setMobileTab] = useState<
    | 'dashboard'
    | 'orders'
    | 'products'
    | 'categories'
    | 'stock'
    | 'gayoo'
    | 'revenue'
    | 'customers'
    | 'riders'
    | 'zones'
    | 'coupons'
    | 'banners'
    | 'settings'
    | 'roles'
  >('dashboard');
  const [filterCategoryForProducts, setFilterCategoryForProducts] = useState<string | undefined>(undefined);
  const [inspectedOrderId, setInspectedOrderId] = useState<string | null>(null);
  const [mobileStage, setMobileStage] = useState<'all' | 'new' | 'packing' | 'out' | 'delivered'>('all');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [stockQuickFilter, setStockQuickFilter] = useState<'all' | 'low' | 'out'>('all');

  // Track modified variants for instant save feedback
  const [modifiedVariants, setModifiedVariants] = useState<Record<string, boolean>>({});

  // Active Print Order State
  const [printOrder, setPrintOrder] = useState<AdminOrder | null>(null);

  // Packing Checkboxes (orderId -> Set of item keys)
  const [packedItems, setPackedItems] = useState<Record<string, Record<string, boolean>>>({});

  // Sync notification banner
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Session Lock on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isUnlocked = sessionStorage.getItem('sas_admin_unlocked') === 'true';
      if (isUnlocked) setUnlocked(true);

      const savedAutoPrint = localStorage.getItem('sas_autoprint_enabled');
      if (savedAutoPrint !== null) setAutoPrintEnabled(savedAutoPrint === 'true');

      const savedSound = localStorage.getItem('sas_sound_enabled');
      if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    }
  }, []);

  const handleVerifyPin = (enteredPin: string) => {
    const correctPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '2026';
    if (enteredPin.trim() === correctPin) {
      sessionStorage.setItem('sas_admin_unlocked', 'true');
      setUnlocked(true);
      return true;
    }
    return false;
  };

  // Fetch initial Admin Dashboard data
  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/admin');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setCatalog(data.catalog || []);
        if (data.categories) {
          setCategories(data.categories);
        }
        if (typeof data.acceptingOrders === 'boolean') {
          setAcceptingOrders(data.acceptingOrders);
        }
      }
    } catch (err) {
      console.warn('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (unlocked) {
      loadDashboardData();
    }
  }, [unlocked]);

  const triggerPrintSlipRef = useRef<(orderId: string) => void>();

  // Realtime Supabase Subscription on 'orders'
  useEffect(() => {
    if (!unlocked) return;

    const channel = supabase
      .channel('admin_realtime_orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          if (soundEnabled) playNewOrderChime();
          await loadDashboardData();

          // Auto-print triggered if enabled
          const newRow = payload.new as any;
          if (autoPrintEnabled && newRow?.id) {
            triggerPrintSlipRef.current?.(newRow.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [unlocked, autoPrintEnabled, soundEnabled]);

  // Trigger 80mm Print
  const triggerPrintSlip = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    setPrintOrder(target);

    // If order was in status 0, advance to status 1 (Packing)
    if (target.status === 0) {
      handleUpdateOrderStatus(target.id, 1);
    }

    setTimeout(() => {
      window.print();
    }, 320);
  };
  triggerPrintSlipRef.current = triggerPrintSlip;

  // Status transitions
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: number, paymentStatus?: string) => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus, paymentStatus: paymentStatus || o.paymentStatus } : o))
      );

      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_ORDER_STATUS',
          orderId,
          status: nextStatus,
          paymentStatus,
        }),
      });
    } catch (err) {
      console.warn('Status update failed:', err);
    }
  };

  // Assign Rider
  const handleAssignRider = async (orderId: string, riderName: string, riderPhone: string) => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, assignedRiderName: riderName, assignedRiderPhone: riderPhone } : o))
      );

      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN_RIDER',
          orderId,
          riderName,
          riderPhone,
        }),
      });
    } catch (err) {
      console.warn('Assign rider failed:', err);
    }
  };

  // Cancel Order
  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 4 } : o))
      );

      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CANCEL_ORDER',
          orderId,
          reason,
        }),
      });
    } catch (err) {
      console.warn('Cancel order failed:', err);
    }
  };

  // Toggle Store Status
  const handleToggleStore = async () => {
    const nextVal = !acceptingOrders;
    setAcceptingOrders(nextVal);
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TOGGLE_STORE_STATUS',
        enabled: nextVal,
      }),
    });
  };

  // Inline Stock & Price Editing
  const handleUpdateVariant = async (
    productId: string,
    variantId: string,
    field: 'price' | 'mrp' | 'stock_qty',
    value: number
  ) => {
    setCatalog((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const nextVariants = p.variants.map((v) =>
          v.id === variantId ? { ...v, [field]: value } : v
        );
        // Automatic <5 stock buffer evaluation
        const allBelowFive = nextVariants.every((v) => (v.stock_qty ?? 0) < 5);
        return {
          ...p,
          inStock: !allBelowFive,
          variants: nextVariants,
        };
      })
    );

    // Mark as modified
    setModifiedVariants((prev) => ({ ...prev, [variantId]: true }));

    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_VARIANT_STOCK_PRICE',
        productId,
        variantId,
        [field === 'stock_qty' ? 'stockQty' : field]: value,
      }),
    });

    // Clear modified status after 2 seconds
    setTimeout(() => {
      setModifiedVariants((prev) => ({ ...prev, [variantId]: false }));
    }, 2000);
  };

  // Toggle In-Stock
  const handleToggleInStock = async (productId: string, current: boolean) => {
    const next = !current;
    setCatalog((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, inStock: next } : p))
    );
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TOGGLE_PRODUCT_STOCK',
        productId,
        inStock: next,
      }),
    });
  };

  // Toggle Item Packed Checkbox
  const toggleItemPacked = (orderId: string, itemKey: string) => {
    setPackedItems((prev) => {
      const orderPack = prev[orderId] || {};
      return {
        ...prev,
        [orderId]: {
          ...orderPack,
          [itemKey]: !orderPack[itemKey],
        },
      };
    });
  };

  // Gayoo POS CSV Drag & Drop Upload
  const handleCsvFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length <= 1) return;

      const header = lines[0].toLowerCase();
      const hasHeader = header.includes('name') || header.includes('price') || header.includes('stock');
      const dataRows = hasHeader ? lines.slice(1) : lines;

      const parsedRows = dataRows.map((line) => {
        const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        return {
          itemNameOrId: parts[0] || '',
          variantLabel: parts[1] || '1 pack',
          price: parts[2] ? parseFloat(parts[2]) : undefined,
          mrp: parts[3] ? parseFloat(parts[3]) : undefined,
          stockQty: parts[4] ? parseInt(parts[4], 10) : undefined,
        };
      });

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows }),
      });

      if (res.ok) {
        const data = await res.json();
        setSyncToast(`Synced ${data.updatedCount} items with Gayoo POS • ${data.autoDisabledCount} items (<5 buffer) auto-disabled`);
        setTimeout(() => setSyncToast(null), 6000);
        loadDashboardData();
      }
    } catch (err) {
      console.warn('CSV sync error:', err);
    }
  };

  // Export Today's Online Bills for Gayoo Daybook
  const handleExportDaybook = () => {
    const today = new Date().toISOString().slice(0, 10);
    const headers = ['Order_ID', 'Date', 'Customer_Name', 'Phone', 'Subtotal', 'Discount', 'Delivery_Fee', 'Total', 'Payment_Method', 'Status'];
    const rows = orders.map((o) => [
      o.id,
      o.createdAt,
      `"${o.customerName}"`,
      o.phone,
      o.subtotal,
      o.discount,
      o.deliveryFee,
      o.total,
      o.paymentMethod.toUpperCase(),
      o.status === 3 ? 'DELIVERED' : 'IN_TRANSIT',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gayoo_daybook_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Amman Store Stock Inventory CSV
  const handleExportStockCsv = () => {
    const today = new Date().toISOString().slice(0, 10);
    const headers = ['Product_ID', 'Name_EN', 'Name_TA', 'Category', 'Variant_ID', 'Variant_Label', 'Price', 'MRP', 'Stock_Qty', 'In_Stock'];
    const rows: string[][] = [];
    catalog.forEach((p) => {
      p.variants.forEach((v) => {
        rows.push([
          p.id,
          `"${p.nameEn.replace(/"/g, '""')}"`,
          `"${(p.nameTa || '').replace(/"/g, '""')}"`,
          p.categoryId,
          v.id,
          `"${v.label.replace(/"/g, '""')}"`,
          String(v.price),
          String(v.mrp),
          String(v.stock_qty ?? 0),
          p.inStock ? 'TRUE' : 'FALSE',
        ]);
      });
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `amman_stock_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInventoryStockStep = (productId: string, variantId: string, newStock: number) => {
    handleUpdateVariant(productId, variantId, 'stock_qty', newStock);
  };

  const handleInventoryPriceChange = async (productId: string, variantId: string, newPrice: number, newMrp: number) => {
    await handleUpdateVariant(productId, variantId, 'price', newPrice);
    if (newMrp !== undefined) {
      await handleUpdateVariant(productId, variantId, 'mrp', newMrp);
    }
  };

  // Product CRUD
  const handleCreateProduct = async (productData: any) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_PRODUCT', product: productData }),
      });
      if (res.ok) {
        setCatalog((prev) => [productData, ...prev]);
        setSyncToast(`Added product "${productData.nameEn}" successfully`);
        setTimeout(() => setSyncToast(null), 4000);
      }
    } catch (err) {
      console.warn('Create product failed:', err);
    }
  };

  const handleUpdateProduct = async (productData: any) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_PRODUCT', product: productData }),
      });
      if (res.ok) {
        setCatalog((prev) => prev.map((p) => (p.id === productData.id ? productData : p)));
        setSyncToast(`Updated product "${productData.nameEn}"`);
        setTimeout(() => setSyncToast(null), 4000);
      }
    } catch (err) {
      console.warn('Update product failed:', err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_PRODUCT', productId }),
      });
      if (res.ok) {
        setCatalog((prev) => prev.filter((p) => p.id !== productId));
        setSyncToast('Product removed');
        setTimeout(() => setSyncToast(null), 4000);
      }
    } catch (err) {
      console.warn('Delete product failed:', err);
    }
  };

  // Category CRUD
  const handleCreateCategory = async (catData: any) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE_CATEGORY', category: catData }),
      });
      if (res.ok) {
        setCategories((prev) => [...prev, catData]);
        setSyncToast(`Category "${catData.nameEn}" created`);
        setTimeout(() => setSyncToast(null), 4000);
      }
    } catch (err) {
      console.warn('Create category failed:', err);
    }
  };

  const handleUpdateCategory = async (catData: any) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_CATEGORY', category: catData }),
      });
      if (res.ok) {
        setCategories((prev) => prev.map((c) => (c.id === catData.id ? catData : c)));
        setSyncToast(`Category "${catData.nameEn}" updated`);
        setTimeout(() => setSyncToast(null), 4000);
      }
    } catch (err) {
      console.warn('Update category failed:', err);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_CATEGORY', categoryId }),
      });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
        setSyncToast('Category deleted');
        setTimeout(() => setSyncToast(null), 4000);
      }
    } catch (err) {
      console.warn('Delete category failed:', err);
    }
  };

  const handleBulkToggleStock = async (productIds: string[], inStock: boolean) => {
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'BULK_TOGGLE_STOCK', productIds, inStock }),
      });
      if (res.ok) {
        const idSet = new Set(productIds);
        setCatalog((prev) => prev.map((p) => (idSet.has(p.id) ? { ...p, inStock } : p)));
        setSyncToast(`Updated ${productIds.length} items to ${inStock ? 'Online' : 'Offline'}`);
        setTimeout(() => setSyncToast(null), 4000);
      }
    } catch (err) {
      console.warn('Bulk toggle stock failed:', err);
    }
  };

  // KPI calculations
  const kpis = useMemo(() => {
    let rev = 0;
    let upiRev = 0;
    let upiCount = 0;
    let codRev = 0;
    let codCount = 0;

    for (const o of orders) {
      rev += o.total;
      if (o.paymentMethod === 'upi') {
        upiRev += o.total;
        upiCount++;
      } else {
        codRev += o.total;
        codCount++;
      }
    }

    return { rev, upiRev, upiCount, codRev, codCount };
  }, [orders]);

  // Catalog filtering
  const filteredCatalog = useMemo(() => {
    return catalog.filter((p) => {
      const matchSearch =
        p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nameTa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'All' || p.categoryId === selectedCategory;

      let matchQuick = true;
      if (stockQuickFilter === 'low') {
        matchQuick = p.variants.some((v) => (v.stock_qty ?? 0) < 5);
      } else if (stockQuickFilter === 'out') {
        matchQuick = !p.inStock || p.variants.every((v) => (v.stock_qty ?? 0) === 0);
      }

      return matchSearch && matchCat && matchQuick;
    });
  }, [catalog, searchTerm, selectedCategory, stockQuickFilter]);

  // Filtered orders for barcode/ID lookup
  const filteredOrders = useMemo(() => {
    if (!barcodeSearch.trim()) return orders;
    const q = barcodeSearch.trim().toLowerCase();
    return orders.filter(
      (o) => o.id.toLowerCase().includes(q) || o.phone.includes(q) || o.customerName.toLowerCase().includes(q)
    );
  }, [orders, barcodeSearch]);

  const ordersCol0 = filteredOrders.filter((o) => o.status === 0);
  const ordersCol1 = filteredOrders.filter((o) => o.status === 1);
  const ordersCol2 = filteredOrders.filter((o) => o.status === 2);
  const ordersCol3 = filteredOrders.filter((o) => o.status === 3);

  const activeOrdersCount = ordersCol0.length + ordersCol1.length + ordersCol2.length;
  const lowStockCount = catalog.filter((p) => p.variants.some((v) => (v.stock_qty ?? 0) < 5)).length;

  // Mobile filtered orders for Stage Switcher
  const mobileDisplayOrders = useMemo(() => {
    switch (mobileStage) {
      case 'new':
        return ordersCol0;
      case 'packing':
        return ordersCol1;
      case 'out':
        return ordersCol2;
      case 'delivered':
        return ordersCol3;
      case 'all':
      default:
        return filteredOrders;
    }
  }, [mobileStage, ordersCol0, ordersCol1, ordersCol2, ordersCol3, filteredOrders]);

  // Lock Screen / Admin Login
  if (!unlocked) {
    return <AdminLoginView onUnlock={handleVerifyPin} />;
  }


  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] antialiased flex flex-col font-sans overflow-x-hidden">
      {/* 80mm Hidden Print Container */}
      {printOrder && (
        <div id="thermal-print-slip" className="hidden">
          <div className="text-center pb-2 border-b border-black">
            <h2 className="font-bold text-sm tracking-wider uppercase">SRI AMMAN SUPERMARKET</h2>
            <p className="text-[10px]">ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட் • மதுரை</p>
            <p className="text-[9px] mt-0.5">Alagar Kovil Road, K.Pudur, Madurai - 625007</p>
            <p className="text-[9px]">Ph: +91 94432 00000 • GSTIN: 33AAAAA0000A1Z5</p>
          </div>

          <div className="my-2 p-1.5 border-2 border-black text-center font-bold">
            <span className="text-[9px] block uppercase tracking-widest">RIDER PICKUP CODE</span>
            <span className="text-base font-mono">{printOrder.id}</span>
          </div>

          <div className="text-[10px] space-y-0.5 pb-2 border-b border-black">
            <div><b>Date:</b> {new Date(printOrder.createdAt).toLocaleString()}</div>
            {printOrder.isForSomeoneElse ? (
              <>
                <div className="font-bold text-[11px] text-black">
                  <b>DELIVER TO:</b> {printOrder.recipientName} (Ph: +91 {printOrder.recipientPhone})
                </div>
                <div>
                  <b>ORDERED BY:</b> {printOrder.customerName || 'Account Holder'} (+91 {printOrder.phone})
                </div>
              </>
            ) : (
              <>
                <div><b>Customer:</b> {printOrder.customerName}</div>
                <div><b>Phone:</b> {printOrder.phone}</div>
              </>
            )}
            <div><b>Address:</b> {printOrder.address}</div>
            <div><b>Distance:</b> {printOrder.distanceKm} km from store</div>
            <div><b>Slot:</b> {printOrder.deliverySlot.toUpperCase()}</div>
          </div>

          <div className="py-2 border-b border-black text-[10px]">
            <div className="font-bold pb-1 flex justify-between">
              <span>ITEM (PACK)</span>
              <span>QTY x PRICE</span>
            </div>
            {printOrder.items.map((it, idx) => (
              <div key={idx} className="flex justify-between py-0.5 leading-tight">
                <span>[ ] {it.productNameEn} ({it.variantLabel})</span>
                <span className="font-mono">{it.quantity} x ₹{it.price}</span>
              </div>
            ))}
          </div>

          <div className="py-2 border-b border-black text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span>Item Subtotal:</span>
              <span>₹{printOrder.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Savings / Discount:</span>
              <span>-₹{printOrder.discount}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span>₹{printOrder.deliveryFee}</span>
            </div>
          </div>

          <div className="py-2 text-center font-bold">
            {printOrder.paymentMethod === 'cod' ? (
              <div className="p-1.5 border-2 border-black bg-black text-white text-xs">
                COLLECT CASH: ₹{printOrder.total}
              </div>
            ) : (
              <div className="p-1 border border-black text-xs">
                PAID ONLINE VIA UPI: ₹{printOrder.total}
              </div>
            )}
          </div>

          <div className="text-center pt-2 text-[9px]">
            <p>Thank you for shopping with Sri Amman!</p>
            <p>20-min express fulfillment guarantee.</p>
          </div>
        </div>
      )}

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="fixed top-16 lg:top-20 right-4 lg:right-6 z-50 bg-[#143B0D] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-[#76CA3E] flex items-center gap-2 max-w-sm">
          <CheckCircle className="w-4 h-4 text-[#97F5CC] shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Main Responsive Admin Command Shell */}
      <AdminLayoutShell
        currentSection={mobileTab}
        onSectionChange={(sec) => setMobileTab(sec as any)}
        pendingOrdersCount={ordersCol0.length}
        lowStockCount={lowStockCount}
        acceptingOrders={acceptingOrders}
        onToggleStore={handleToggleStore}
        autoPrintEnabled={autoPrintEnabled}
        onToggleAutoPrint={() => {
          const next = !autoPrintEnabled;
          setAutoPrintEnabled(next);
          localStorage.setItem('sas_autoprint_enabled', String(next));
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          localStorage.setItem('sas_sound_enabled', String(next));
        }}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'ta' : 'en')}
        onLock={() => {
          sessionStorage.removeItem('sas_admin_unlocked');
          setUnlocked(false);
        }}
        searchQuery={barcodeSearch}
        onSearchChange={setBarcodeSearch}
      >
        <div className="w-full space-y-4 sm:space-y-6">
          {/* ==================================================================== */}
          {/* ZONE 1: ADMIN DASHBOARD */}
          {/* ==================================================================== */}
          {mobileTab === 'dashboard' && (
            <AdminDashboard
              orders={orders}
              lowStockCount={lowStockCount}
              acceptingOrders={acceptingOrders}
              onNavigateSection={(sec) => setMobileTab(sec as any)}
              onSelectOrder={(order) => {
                setInspectedOrderId(order.id);
                setMobileTab('orders');
              }}
              onQuickPackOrder={(orderId) => handleUpdateOrderStatus(orderId, 1)}
              onPrintOrder={(order) => triggerPrintSlip(order.id)}
              onExportDaybook={handleExportDaybook}
              onRefreshData={loadDashboardData}
              onTestChime={playNewOrderChime}
            />
          )}

          {/* ==================================================================== */}
          {/* ZONE 2: ORDERS MANAGEMENT BOARD & DETAIL INSPECTOR */}
          {/* ==================================================================== */}
          {mobileTab === 'orders' && (
            <AdminOrdersView
              orders={orders}
              onUpdateStatus={handleUpdateOrderStatus}
              onAssignRider={handleAssignRider}
              onCancelOrder={handleCancelOrder}
              onPrintOrder={(order) => triggerPrintSlip(order.id)}
              onRefresh={loadDashboardData}
              packedItems={packedItems}
              onTogglePackedItem={toggleItemPacked}
              initialSelectedOrderId={inspectedOrderId}
              onClearSelectedOrder={() => setInspectedOrderId(null)}
            />
          )}

          {/* ==================================================================== */}
          {/* ZONE 3: PRODUCTS CATALOG (LIST, ADD, EDIT, DELETE, VARIANTS) */}
          {/* ==================================================================== */}
          {mobileTab === 'products' && (
            <AdminProductsView
              products={catalog as any}
              categories={categories}
              initialFilterCategory={filterCategoryForProducts}
              onUpdateProduct={handleUpdateProduct}
              onCreateProduct={handleCreateProduct}
              onDeleteProduct={handleDeleteProduct}
              onToggleProductStock={handleToggleInStock}
              onBulkToggleStock={handleBulkToggleStock}
              onRefresh={loadDashboardData}
            />
          )}

          {/* ==================================================================== */}
          {/* ZONE 4: STORE CATEGORIES (LIST, ADD, EDIT, DELETE, SAFE GUARD) */}
          {/* ==================================================================== */}
          {mobileTab === 'categories' && (
            <AdminCategoriesView
              categories={categories}
              products={catalog as any}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onSelectCategory={(catId) => {
                setFilterCategoryForProducts(catId);
                setMobileTab('products');
              }}
              onRefresh={loadDashboardData}
            />
          )}

          {/* ==================================================================== */}
          {/* ZONE 5: INVENTORY & STOCK BUFFER SWITCHBOARD */}
          {/* ==================================================================== */}
          {mobileTab === 'stock' && (
            <AdminInventoryView
              products={catalog as any}
              categories={categories}
              onUpdateVariant={handleUpdateVariant}
              onToggleProductStock={handleToggleInStock}
              onExportStockCsv={handleExportStockCsv}
              onRefresh={loadDashboardData}
            />
          )}

          {/* ==================================================================== */}
          {/* ZONE 6: GAYOO POS / ERP SYNC PANEL */}
          {/* ==================================================================== */}
          {mobileTab === 'gayoo' && (
            <div className="max-w-2xl mx-auto p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#F1F9EC] text-[#143B0D] flex items-center justify-center">
                    <Layers className="w-5 h-5 text-[#143B0D]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Gayoo POS / ERP Sync Bridge</h3>
                    <p className="text-xs text-slate-500">கேயூ பில்லிங் மென்பொருள் ஒருங்கிணைப்பு</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded font-mono text-[10px] bg-[#F1F9EC] text-[#143B0D] font-bold uppercase tracking-wider">
                  Live Bridge
                </span>
              </div>

              {/* Drag and Drop / Tap Zone */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleCsvFileUpload(f);
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleCsvFileUpload(f);
                }}
                className="min-h-[160px] p-6 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-[#76CA3E] active:bg-slate-100 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[#F1F9EC] text-[#143B0D] flex items-center justify-center mb-2 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="font-bold text-sm text-slate-800">Tap or Drop Gayoo POS Stock CSV</span>
                <span className="text-xs text-slate-500 mt-1">1-Click sync counter stock &amp; selling prices from phone or desktop</span>
                <div className="mt-3 px-2.5 py-1 rounded bg-slate-200 text-slate-700 font-mono text-xs">
                  Columns: Name/ID, Variant, Price, MRP, Stock
                </div>
              </div>

              {/* Live Status Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#143B0D]">
                  <span className="w-2 h-2 rounded-full bg-[#76CA3E] animate-pulse"></span>
                  <span>Last Synced with Counter Gayoo POS: Today</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>0 Conflicts</span>
                  <span className="font-mono font-bold text-slate-900">{catalog.length} SKUs Monitored</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#76CA3E] h-full w-full"></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleExportDaybook}
                  className="flex-1 min-h-[44px] h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Today&apos;s Online Bills (CSV)</span>
                </button>
                <button
                  onClick={handleExportStockCsv}
                  className="min-h-[44px] h-11 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Export Master Stock CSV</span>
                </button>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* ZONE 7: FINANCIAL REPORTS & REVENUE DAYBOOK */}
          {/* ==================================================================== */}
          {mobileTab === 'revenue' && <AdminReportsView orders={orders} />}

          {/* ==================================================================== */}
          {/* ZONE 8: CUSTOMER DIRECTORY & PROFILES */}
          {/* ==================================================================== */}
          {mobileTab === 'customers' && (
            <AdminCustomersView
              orders={orders}
              onSelectOrder={(orderId) => {
                setInspectedOrderId(orderId);
                setMobileTab('orders');
              }}
            />
          )}

          {/* ==================================================================== */}
          {/* ZONE 9: RIDER FLEET & LOGISTICS */}
          {/* ==================================================================== */}
          {mobileTab === 'riders' && (
            <AdminRidersView
              orders={orders}
              onNavigateToOrders={() => setMobileTab('orders')}
            />
          )}

          {/* ==================================================================== */}
          {/* ZONE 10: DELIVERY GEOFENCED ZONES & TIME SLOTS */}
          {/* ==================================================================== */}
          {mobileTab === 'zones' && <AdminZonesSlotsView />}

          {/* ==================================================================== */}
          {/* ZONE 11: COUPONS & PROMOTIONAL OFFERS */}
          {/* ==================================================================== */}
          {mobileTab === 'coupons' && <AdminCouponsView />}

          {/* ==================================================================== */}
          {/* ZONE 12: BANNERS & CONTENT MERCHANDISING */}
          {/* ==================================================================== */}
          {mobileTab === 'banners' && <AdminBannersView />}

          {/* ==================================================================== */}
          {/* ZONE 13: STORE SETTINGS & KIOSK HARDWARE */}
          {/* ==================================================================== */}
          {mobileTab === 'settings' && (
            <AdminSettingsView
              acceptingOrders={acceptingOrders}
              onToggleStore={handleToggleStore}
              autoPrintEnabled={autoPrintEnabled}
              onToggleAutoPrint={() => {
                const next = !autoPrintEnabled;
                setAutoPrintEnabled(next);
                localStorage.setItem('sas_autoprint_enabled', String(next));
              }}
              soundEnabled={soundEnabled}
              onToggleSound={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                localStorage.setItem('sas_sound_enabled', String(next));
              }}
              onTriggerTestPrint={() => orders[0] && triggerPrintSlip(orders[0].id)}
            />
          )}

          {/* ==================================================================== */}
          {/* ZONE 14: STAFF ROLES & SECURITY AUDIT LOG */}
          {/* ==================================================================== */}
          {mobileTab === 'roles' && <AdminRolesView />}
        </div>
      </AdminLayoutShell>
    </div>
  );
}
