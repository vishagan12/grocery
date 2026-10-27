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
  status: number; // 0: New, 1: Packing/Ready, 2: Out for delivery, 3: Delivered
  deliverySlot: string;
  createdAt: string;
  isForSomeoneElse?: boolean;
  recipientName?: string;
  recipientPhone?: string;
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
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [loading, setLoading] = useState(true);

  // Settings & Filter states
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [barcodeSearch, setBarcodeSearch] = useState('');

  // Mobile navigation & stage switcher state
  const [mobileTab, setMobileTab] = useState<'orders' | 'stock' | 'gayoo' | 'revenue'>('orders');
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

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '2026';
    if (pinInput.trim() === correctPin) {
      sessionStorage.setItem('sas_admin_unlocked', 'true');
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // Fetch initial Admin Dashboard data
  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/admin');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setCatalog(data.catalog || []);
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

  // Lock Screen Overlay
  if (!unlocked) {
    return (
      <div className="fixed inset-0 bg-[#0F172A] z-50 flex items-center justify-center p-4 min-h-[100dvh]">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#047857]/10 flex items-center justify-center text-[#047857] mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Store Counter Lock</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Sri Amman Supermarket • Admin PIN required
          </p>

          <form onSubmit={handleUnlock} className="w-full space-y-4">
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter 4-digit PIN..."
              className="w-full text-center text-xl sm:text-2xl tracking-widest font-mono py-3 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] min-h-[48px]"
            />
            {pinError && (
              <p className="text-xs text-rose-600 font-semibold">
                Incorrect PIN. Default is 2026.
              </p>
            )}
            <button
              type="submit"
              className="w-full min-h-[48px] py-3 bg-[#047857] hover:bg-[#035f44] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-base active:scale-[0.98]"
            >
              <Unlock className="w-4 h-4" />
              Unlock Command Center
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Helper render for single order card (used in both desktop columns and mobile stage stack)
  const renderOrderCard = (order: AdminOrder) => {
    return (
      <article key={order.id} className="p-3.5 sm:p-4 rounded-xl bg-white shadow-sm border border-slate-200 space-y-3">
        {/* Header Badge & ID */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          {order.status === 0 && (
            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#ffdcc3] text-[#2f1500] uppercase font-bold animate-pulse">
              AUTO-PRINTED SLIP
            </span>
          )}
          {order.status === 1 && (
            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#dbe1ff] text-[#00174b] font-bold uppercase">
              BAGGED AT DOCK
            </span>
          )}
          {order.status === 2 && (
            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#97f5cc] text-[#002115] font-bold uppercase">
              ON ROUTE TO CUSTOMER
            </span>
          )}
          {order.status === 3 && (
            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-200 text-slate-800 font-bold uppercase">
              DELIVERED &amp; SETTLED
            </span>
          )}
          <span className="font-mono font-bold text-sm text-slate-900">{order.id}</span>
        </div>

        {/* Packing Code Box (Status 1) */}
        {order.status === 1 && (
          <div className="p-2.5 rounded-lg bg-[#0047bf] text-white flex flex-col items-center justify-center text-center shadow-sm">
            <span className="text-[10px] tracking-widest uppercase opacity-80 font-mono">Rider Pickup Pin</span>
            <span className="text-xl tracking-wider font-extrabold font-mono">
              PICKUP CODE: {order.id.replace(/\D/g, '').slice(-4) || 'BAG'}
            </span>
          </div>
        )}

        {/* Customer & Recipient Details */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="font-bold text-xs sm:text-sm text-slate-900">
              {order.isForSomeoneElse ? `For: ${order.recipientName}` : order.customerName}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {order.isForSomeoneElse ? `+91 ${order.recipientPhone}` : order.phone}
            </span>
          </div>
          {order.isForSomeoneElse && (
            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
              Ordered by: {order.customerName || 'Account Holder'} ({order.phone})
            </p>
          )}
          <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1">
            <MapPin className="w-3.5 h-3.5 text-[#005d42] shrink-0" />
            <span className="truncate">{order.address} • {order.distanceKm} km</span>
          </div>
        </div>

        {/* Amount & Payment Status */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">
          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
            order.paymentMethod === 'upi' ? 'bg-[#97f5cc] text-[#002115]' : 'bg-[#ffdcc3] text-[#2f1500]'
          }`}>
            {order.paymentMethod === 'upi' ? `UPI PAID • ₹${order.total}` : `COD CASH • ₹${order.total}`}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">{order.items.length} Items</span>
        </div>

        {/* Interactive Packing Checklist (Status 0 & 1) */}
        {(order.status === 0 || order.status === 1) && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
            <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 mb-1">
              Packing Checklist:
            </div>
            {order.items.map((it, idx) => {
              const itemKey = `${order.id}-${idx}`;
              const isPacked = Boolean(packedItems[order.id]?.[itemKey]);
              return (
                <label
                  key={idx}
                  className="flex items-start gap-2.5 cursor-pointer select-none py-1.5 px-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isPacked}
                    onChange={() => toggleItemPacked(order.id, itemKey)}
                    className="mt-0.5 accent-[#005d42] w-4 h-4 rounded cursor-pointer"
                  />
                  <div className="leading-tight flex-1 min-w-0">
                    <span className={`text-slate-800 font-medium ${isPacked ? 'line-through text-slate-400' : ''}`}>
                      {it.productNameEn} ({it.variantLabel}) x{it.quantity}
                    </span>
                    {it.productNameTa && (
                      <span className="block text-[10px] text-slate-500">{it.productNameTa}</span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-slate-600 shrink-0">₹{it.price * it.quantity}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* COD banner for status 1 */}
        {order.status === 1 && order.paymentMethod === 'cod' && (
          <div className="px-2.5 py-1.5 rounded bg-[#ffdcc3] text-[#2f1500] flex items-center justify-between font-mono text-xs font-bold">
            <span>COD CASH ORDER</span>
            <span>COLLECT ₹{order.total}</span>
          </div>
        )}

        {/* Quick Contact & Map Actions for Transit/Delivered/Active orders */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <a
            href={`tel:${order.recipientPhone || order.phone}`}
            className="min-h-[44px] py-2 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Phone className="w-4 h-4 text-slate-700" />
            <span>Call</span>
          </a>
          <a
            href={`https://wa.me/${(order.recipientPhone || order.phone).replace(/\D/g, '')}?text=Your%20Sri%20Amman%20Supermarket%20order%20is%20on%20the%20way!`}
            target="_blank"
            rel="noreferrer"
            className="min-h-[44px] py-2 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp</span>
          </a>
          <a
            href={
              order.lat && order.lng
                ? `https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ', Madurai')}`
            }
            target="_blank"
            rel="noreferrer"
            className="min-h-[44px] py-2 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <MapPin className="w-4 h-4 text-[#005d42]" />
            <span>Maps</span>
          </a>
        </div>

        {/* Stage Progression Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => triggerPrintSlip(order.id)}
            className="min-h-[44px] py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Re-Print Slip</span>
          </button>

          {order.status === 0 && (
            <button
              onClick={() => handleUpdateOrderStatus(order.id, 1)}
              className="min-h-[44px] py-2 px-2.5 rounded-lg bg-[#047857] hover:bg-[#005d42] active:bg-[#004732] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Ready for Rider</span>
            </button>
          )}

          {order.status === 1 && (
            <button
              onClick={() => handleUpdateOrderStatus(order.id, 2)}
              className="min-h-[44px] py-2 px-2.5 rounded-lg bg-[#0047bf] hover:bg-[#003ea8] active:bg-[#002f80] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>Dispatch Order</span>
            </button>
          )}

          {order.status === 2 && (
            <button
              onClick={() => handleUpdateOrderStatus(order.id, 3, 'paid')}
              className="min-h-[44px] py-2 px-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Mark Delivered</span>
            </button>
          )}

          {order.status === 3 && (
            <div className="min-h-[44px] py-2 px-2 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 font-mono">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Order Complete</span>
            </div>
          )}
        </div>
      </article>
    );
  };

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

      {/* ==================================================================== */}
      {/* MOBILE COMPACT STICKY TOP APP BAR (< 1024px) */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-30 bg-[#064e3b] text-white px-4 py-3 shadow-md flex items-center justify-between gap-3 lg:hidden">
        {/* Left: Hamburger Drawer Toggle */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-[#005d42] active:bg-[#004732] transition-colors -ml-1"
          aria-label="Open Admin Menu"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>

        {/* Center: Brand Title + Online Dot */}
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-[#97f5cc]" />
          <span className="font-bold text-base tracking-tight">Sri Amman Admin</span>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              acceptingOrders ? 'bg-[#97f5cc] animate-pulse' : 'bg-rose-500'
            }`}
            title={acceptingOrders ? 'Store Online' : 'Store Paused'}
          />
        </div>

        {/* Right: Quick Active Orders Count Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (soundEnabled) playNewOrderChime();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#97f5cc] hover:bg-[#005d42] active:bg-[#004732]"
            aria-label="Sound Test"
            title="Test Audio Chime"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <span className="bg-amber-500 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-full font-mono">
            {activeOrdersCount} Active
          </span>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MOBILE SLIDE-OVER DRAWER OVERLAY (< 1024px) */}
      {/* ==================================================================== */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-[#005d42] text-white h-full shadow-2xl flex flex-col justify-between p-4 overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#00513a]">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#97f5cc]" />
                  <div>
                    <h3 className="font-bold text-sm leading-tight">Sri Amman Store</h3>
                    <p className="text-[10px] text-[#7bd8b1]">Admin Control Hub</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#97f5cc] hover:bg-[#00513a]"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Hardware & Kiosk Controls */}
              <div className="my-4 p-3 rounded-xl bg-[#00513a] space-y-3">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#7bd8b1] block">
                  Hardware &amp; Kiosk
                </span>

                {/* Auto Print Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Printer className="w-4 h-4 text-[#97f5cc]" />
                    <span>80mm Auto-Print</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !autoPrintEnabled;
                      setAutoPrintEnabled(next);
                      localStorage.setItem('sas_autoprint_enabled', String(next));
                    }}
                    className={`min-h-[44px] px-3 py-1.5 rounded-lg font-mono text-xs font-bold uppercase transition-colors ${
                      autoPrintEnabled ? 'bg-[#97f5cc] text-[#005d42]' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {autoPrintEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Sound Alerts Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-[#005d42]">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-[#97f5cc]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    <span>Chime Sounds</span>
                  </div>
                  <button
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      localStorage.setItem('sas_sound_enabled', String(next));
                    }}
                    className={`min-h-[44px] px-3 py-1.5 rounded-lg font-mono text-xs font-bold uppercase transition-colors ${
                      soundEnabled ? 'bg-[#97f5cc] text-[#005d42]' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {soundEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Navigation Quick Links inside drawer */}
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    setMobileTab('orders');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full min-h-[44px] px-3 rounded-lg flex items-center justify-between ${
                    mobileTab === 'orders' ? 'bg-[#047857] text-white font-bold' : 'text-[#7bd8b1] hover:bg-[#00513a]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    <span>Live Dispatch Board</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-amber-500 text-slate-950 font-bold">
                    {activeOrdersCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setMobileTab('stock');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full min-h-[44px] px-3 rounded-lg flex items-center justify-between ${
                    mobileTab === 'stock' ? 'bg-[#047857] text-white font-bold' : 'text-[#7bd8b1] hover:bg-[#00513a]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Inventory &amp; Buffer</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#ffdad6] text-[#ba1a1a] font-bold">
                    {lowStockCount} Low
                  </span>
                </button>

                <button
                  onClick={() => {
                    setMobileTab('gayoo');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full min-h-[44px] px-3 rounded-lg flex items-center justify-between ${
                    mobileTab === 'gayoo' ? 'bg-[#047857] text-white font-bold' : 'text-[#7bd8b1] hover:bg-[#00513a]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>Gayoo POS Bridge</span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-[#97f5cc]" />
                </button>

                <button
                  onClick={() => {
                    setMobileTab('revenue');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full min-h-[44px] px-3 rounded-lg flex items-center justify-between ${
                    mobileTab === 'revenue' ? 'bg-[#047857] text-white font-bold' : 'text-[#7bd8b1] hover:bg-[#00513a]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" />
                    <span>Daily Revenue &amp; Cash</span>
                  </div>
                  <span className="font-mono text-xs text-[#97f5cc] font-bold">₹{kpis.rev}</span>
                </button>

                <a
                  href="/rider"
                  target="_blank"
                  className="w-full min-h-[44px] px-3 rounded-lg flex items-center justify-between text-[#7bd8b1] hover:bg-[#00513a]"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>Launch Rider Portal</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              {/* Extra Tools: Language & Daybook */}
              <div className="pt-4 border-t border-[#00513a] space-y-2">
                <button
                  onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
                  className="w-full min-h-[44px] px-3 rounded-lg bg-[#00513a] hover:bg-[#047857] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Languages className="w-4 h-4 text-[#97f5cc]" />
                  <span>Language: {lang === 'en' ? 'English (தமிழ்)' : 'தமிழ் (English)'}</span>
                </button>

                <button
                  onClick={handleExportDaybook}
                  className="w-full min-h-[44px] px-3 rounded-lg bg-[#047857] hover:bg-[#00513a] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4 text-[#97f5cc]" />
                  <span>Export Daybook CSV</span>
                </button>
              </div>
            </div>

            {/* Bottom Master Kill-Switch in Drawer */}
            <div className="pt-4 border-t border-[#00513a]">
              <div className="p-3 rounded-xl bg-[#00513a] flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Online Orders</span>
                  <span className={`text-[10px] font-mono font-bold ${acceptingOrders ? 'text-[#97f5cc]' : 'text-rose-400'}`}>
                    {acceptingOrders ? 'ACCEPTING LIVE' : 'PAUSED'}
                  </span>
                </div>
                <button
                  onClick={handleToggleStore}
                  className={`min-h-[44px] min-w-[56px] rounded-full flex items-center px-1 transition-colors shadow-inner ${
                    acceptingOrders ? 'bg-[#97f5cc] justify-end' : 'bg-rose-500 justify-start'
                  }`}
                  aria-label="Toggle Online Orders"
                >
                  <div className="w-6 h-6 rounded-full bg-[#005d42] shadow"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DESKTOP FIXED LEFT SIDEBAR (hidden on < 1024px) */}
      {/* ==================================================================== */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[260px] bg-[#005d42] text-white z-50 flex-col justify-between shadow-xl">
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="p-3 bg-[#00513a]">
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-5 h-5 text-[#97f5cc]" />
              <span className="font-bold text-base tracking-tight leading-tight">Sri Amman</span>
            </div>
            <div className="text-[11px] text-[#7bd8b1]">ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட்</div>
            <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-[#7bd8b1] uppercase tracking-wider bg-[#005d42]/60 px-2 py-0.5 rounded font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#97f5cc] animate-pulse"></span>
              Counter POS • Madurai
            </div>
          </div>

          {/* Thermal Printer Kiosk Control */}
          <div className="m-2 p-2.5 rounded bg-[#047857] text-white text-xs shadow-sm">
            <div className="flex items-center justify-between pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${autoPrintEnabled ? 'bg-[#97f5cc] shadow-[0_0_6px_rgba(151,245,204,0.9)]' : 'bg-slate-400'}`}></span>
                <span className="font-bold text-[11px] tracking-wide">80mm Auto-Print</span>
              </div>
              <button
                onClick={() => {
                  const next = !autoPrintEnabled;
                  setAutoPrintEnabled(next);
                  localStorage.setItem('sas_autoprint_enabled', String(next));
                }}
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase transition-colors ${
                  autoPrintEnabled ? 'bg-[#005d42] text-[#97f5cc]' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {autoPrintEnabled ? 'KIOSK ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-[#00513a] text-[#7bd8b1] text-[11px]">
              <span className="flex items-center gap-1">
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                Sound Alerts
              </span>
              <button
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  localStorage.setItem('sas_sound_enabled', String(next));
                }}
                className={`w-7 h-4 rounded-full flex items-center px-0.5 transition-colors ${
                  soundEnabled ? 'bg-[#97f5cc] justify-end' : 'bg-slate-600 justify-start'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${soundEnabled ? 'bg-[#005d42]' : 'bg-slate-300'}`}></div>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-2 mt-2 font-medium text-xs">
            <button
              onClick={() => setMobileTab('orders')}
              className={`flex items-center justify-between px-3 py-2 rounded font-bold shadow-sm transition-colors text-left ${
                mobileTab === 'orders' ? 'bg-[#047857] text-white' : 'text-[#7bd8b1] hover:bg-[#047857] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span>Live Dispatch Queue</span>
              </div>
              <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-[#fe932c] text-[#663500] font-bold">
                {activeOrdersCount} Active
              </span>
            </button>

            <a
              href="#inventory-section"
              onClick={() => setMobileTab('stock')}
              className={`flex items-center justify-between px-3 py-2 rounded transition-colors ${
                mobileTab === 'stock' ? 'bg-[#047857] text-white font-bold' : 'text-[#7bd8b1] hover:bg-[#047857] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>Inventory &amp; Buffer</span>
              </div>
              <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-[#ffdad6] text-[#ba1a1a] font-bold">
                {lowStockCount} Low
              </span>
            </a>

            <a
              href="#gayoo-section"
              onClick={() => setMobileTab('gayoo')}
              className={`flex items-center justify-between px-3 py-2 rounded transition-colors ${
                mobileTab === 'gayoo' ? 'bg-[#047857] text-white font-bold' : 'text-[#7bd8b1] hover:bg-[#047857] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Gayoo POS Bridge</span>
              </div>
              <CheckCircle className="w-3.5 h-3.5 text-[#7bd8b1]" />
            </a>

            <button
              onClick={() => setMobileTab('revenue')}
              className={`flex items-center justify-between px-3 py-2 rounded transition-colors text-left ${
                mobileTab === 'revenue' ? 'bg-[#047857] text-white font-bold' : 'text-[#7bd8b1] hover:bg-[#047857] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                <span>Revenue &amp; Settlement</span>
              </div>
              <span className="font-mono text-[10px] text-[#97f5cc] font-bold">₹{kpis.rev}</span>
            </button>

            <a
              href="/rider"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded text-[#7bd8b1] hover:bg-[#047857] hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span>Launch Rider Portal</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </nav>
        </div>

        {/* Online Orders Accepting Switch */}
        <div className="p-2">
          <div className="p-2.5 rounded bg-[#00513a] shadow-sm flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-white">Online Orders</span>
              <span className={`text-[10px] font-mono font-bold ${acceptingOrders ? 'text-[#97f5cc]' : 'text-rose-400'}`}>
                {acceptingOrders ? 'ACCEPTING LIVE' : 'PAUSED'}
              </span>
            </div>
            <button
              onClick={handleToggleStore}
              className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors shadow-inner ${
                acceptingOrders ? 'bg-[#97f5cc] justify-end' : 'bg-rose-500 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-[#005d42] shadow"></div>
            </button>
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* MAIN CONTENT WRAPPER (Desktop pl-[260px], Mobile w-full) */}
      {/* ==================================================================== */}
      <div className="w-full lg:pl-[260px] flex-1 flex flex-col">
        {/* Desktop Sticky Header (hidden on mobile) */}
        <header className="hidden lg:flex fixed top-0 left-[260px] right-0 h-16 bg-white/90 backdrop-blur-md z-40 border-b border-slate-200 items-center justify-between px-6 gap-4">
          {/* Real-Time Revenue Ticker */}
          <div className="flex items-center gap-3 overflow-x-auto py-1">
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#f2f3ff] border border-slate-200">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Revenue</span>
              <span className="font-bold text-sm text-[#005d42]">₹{kpis.rev}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#f2f3ff] border border-slate-200">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500">UPI Paid</span>
              <span className="font-bold text-sm text-slate-900">₹{kpis.upiRev}</span>
              <span className="text-[10px] text-slate-500">({kpis.upiCount})</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#f2f3ff] border border-slate-200">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500">COD Collect</span>
              <span className="font-bold text-sm text-[#904d00]">₹{kpis.codRev}</span>
              <span className="text-[10px] text-slate-500">({kpis.codCount})</span>
            </div>
          </div>

          {/* Quick Search & Actions */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center">
              <Barcode className="w-4 h-4 absolute left-2.5 text-slate-400" />
              <input
                type="text"
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
                placeholder="Scan barcode or #SAS-ID..."
                className="h-8 w-56 pl-8 pr-3 text-xs bg-slate-100 text-slate-800 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#005d42]"
              />
            </div>

            <button
              onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
              className="h-8 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
            >
              <Languages className="w-3.5 h-3.5" />
              {lang === 'en' ? 'EN / தமிழ்' : 'தமிழ் / EN'}
            </button>

            <button
              onClick={handleExportDaybook}
              className="h-8 px-3 rounded bg-[#047857] hover:bg-[#005d42] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Daybook CSV
            </button>

            <button
              onClick={loadDashboardData}
              className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
              title="Refresh Live Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Sync Toast Notification */}
        {syncToast && (
          <div className="fixed top-16 lg:top-20 right-4 lg:right-6 z-50 bg-[#005d42] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-[#97f5cc] flex items-center gap-2 max-w-sm">
            <CheckCircle className="w-4 h-4 text-[#97f5cc] shrink-0" />
            <span>{syncToast}</span>
          </div>
        )}

        {/* Main Floor Container */}
        <main className="w-full pt-4 lg:pt-20 px-3.5 sm:px-6 pb-28 lg:pb-12 space-y-4 sm:space-y-6">
          {/* Sub-Banner / Floor Terminal Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#005d42] animate-pulse shrink-0"></span>
              <div>
                <h1 className="font-bold text-sm text-slate-900 leading-tight">Fulfillment Floor Terminal • Madurai West</h1>
                <p className="text-[11px] text-slate-500">விற்பனை மற்றும் விநியோக கட்டுப்பாட்டு மையம்</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ffdcc3] text-[#2f1500] font-mono text-[11px] font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>SLA: &lt; 8 MINS</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#97f5cc] text-[#002115] font-mono text-[11px] font-bold">
                <Truck className="w-3.5 h-3.5" />
                <span>3KM GEOFENCE</span>
              </div>
            </div>
          </div>

          {/* Global Order Search Bar on Mobile */}
          <div className="block lg:hidden">
            <div className="relative flex items-center">
              <Barcode className="w-5 h-5 absolute left-3 text-slate-400" />
              <input
                type="text"
                value={barcodeSearch}
                onChange={(e) => setBarcodeSearch(e.target.value)}
                placeholder="Search order ID, phone, or name..."
                className="w-full h-11 pl-10 pr-4 text-base bg-white text-slate-900 rounded-xl border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#005d42]"
              />
            </div>
          </div>

          {/* ==================================================================== */}
          {/* ZONE A: LIVE ORDER DISPATCH BOARD */}
          {/* Visible always on Desktop, or when mobileTab === 'orders' */}
          {/* ==================================================================== */}
          <div className={`${mobileTab === 'orders' ? 'block' : 'hidden lg:block'} space-y-4`}>
            {/* KPI Cards on Mobile for Orders Tab */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 lg:hidden">
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Today&apos;s Total</span>
                <span className="font-extrabold text-lg text-[#005d42] font-mono">₹{kpis.rev}</span>
                <span className="text-[10px] text-slate-500 block">{orders.length} orders</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">UPI Settled</span>
                <span className="font-extrabold text-lg text-slate-900 font-mono">₹{kpis.upiRev}</span>
                <span className="text-[10px] text-emerald-600 font-bold block">{kpis.upiCount} paid</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">COD Pending</span>
                <span className="font-extrabold text-lg text-[#904d00] font-mono">₹{kpis.codRev}</span>
                <span className="text-[10px] text-amber-700 font-bold block">{kpis.codCount} riders</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Active / Pack</span>
                <span className="font-extrabold text-lg text-blue-700 font-mono">{activeOrdersCount}</span>
                <span className="text-[10px] text-slate-500 block">&lt; 8 min avg</span>
              </div>
            </div>

            {/* Dispatch Floor Header & Live Status */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#005d42]" />
                <h2 className="font-bold text-base text-slate-900">Active Dispatch Floor</h2>
                <span className="text-[11px] text-slate-500 hidden sm:inline">நேரடி விநியோக வரிசை</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#005d42]" />
                <span>REALTIME ACTIVE</span>
              </div>
            </div>

            {/* Mobile Status Stage Filter Pills (Sticky horizontal bar on phone) */}
            <div className="flex lg:hidden gap-2 overflow-x-auto no-scrollbar py-2 -mx-3.5 px-3.5 sticky top-[56px] z-20 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200/70">
              <button
                onClick={() => setMobileStage('all')}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-xs ${
                  mobileStage === 'all'
                    ? 'bg-[#005d42] text-white'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <span>All Orders</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/10">
                  {filteredOrders.length}
                </span>
              </button>

              <button
                onClick={() => setMobileStage('new')}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-xs ${
                  mobileStage === 'new'
                    ? 'bg-[#fe932c] text-[#2f1500]'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#fe932c]"></span>
                <span>New</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/10">
                  {ordersCol0.length}
                </span>
              </button>

              <button
                onClick={() => setMobileStage('packing')}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-xs ${
                  mobileStage === 'packing'
                    ? 'bg-[#0047bf] text-white'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#0047bf]"></span>
                <span>Packing</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/10">
                  {ordersCol1.length}
                </span>
              </button>

              <button
                onClick={() => setMobileStage('out')}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-xs ${
                  mobileStage === 'out'
                    ? 'bg-[#047857] text-white'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#047857]"></span>
                <span>On Route</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/10">
                  {ordersCol2.length}
                </span>
              </button>

              <button
                onClick={() => setMobileStage('delivered')}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-xs ${
                  mobileStage === 'delivered'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span>Delivered</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/10">
                  {ordersCol3.length}
                </span>
              </button>
            </div>

            {/* Mobile Single-Column Order Stack (< 1024px) */}
            <div className="grid grid-cols-1 gap-3 lg:hidden">
              {mobileDisplayOrders.map((order) => renderOrderCard(order))}
              {mobileDisplayOrders.length === 0 && (
                <div className="text-center py-12 px-4 rounded-xl bg-white border border-slate-200 text-slate-400 font-mono text-xs">
                  No orders currently in this status stage.
                </div>
              )}
            </div>

            {/* Desktop 4-Column Pipeline Grid (hidden on mobile, visible lg:grid) */}
            <div className="hidden lg:grid lg:grid-cols-4 lg:gap-4 items-start">
              {/* COLUMN 1: NEW / AUTO-PRINTED */}
              <div className="flex flex-col gap-3 rounded-xl bg-slate-100/70 p-3 border border-slate-200">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#fe932c]"></span>
                    <span className="font-bold text-xs text-slate-800 tracking-wide uppercase">NEW / AUTO-PRINTED</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-[#ffdcc3] text-[#2f1500] font-bold">
                    {ordersCol0.length}
                  </span>
                </div>
                {ordersCol0.map((order) => renderOrderCard(order))}
                {ordersCol0.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400 font-mono">No new orders waiting</div>
                )}
              </div>

              {/* COLUMN 2: PACKED & WAITING */}
              <div className="flex flex-col gap-3 rounded-xl bg-slate-100/70 p-3 border border-slate-200">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0047bf]"></span>
                    <span className="font-bold text-xs text-slate-800 tracking-wide uppercase">PACKED &amp; WAITING</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-[#dbe1ff] text-[#00174b] font-bold">
                    {ordersCol1.length}
                  </span>
                </div>
                {ordersCol1.map((order) => renderOrderCard(order))}
                {ordersCol1.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400 font-mono">No bags awaiting pickup</div>
                )}
              </div>

              {/* COLUMN 3: OUT FOR DELIVERY */}
              <div className="flex flex-col gap-3 rounded-xl bg-slate-100/70 p-3 border border-slate-200">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#047857]"></span>
                    <span className="font-bold text-xs text-slate-800 tracking-wide uppercase">OUT FOR DELIVERY</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-[#97f5cc] text-[#002115] font-bold">
                    {ordersCol2.length}
                  </span>
                </div>
                {ordersCol2.map((order) => renderOrderCard(order))}
                {ordersCol2.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400 font-mono">No riders currently on bike</div>
                )}
              </div>

              {/* COLUMN 4: DELIVERED TODAY */}
              <div className="flex flex-col gap-3 rounded-xl bg-slate-100/70 p-3 border border-slate-200">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                    <span className="font-bold text-xs text-slate-800 tracking-wide uppercase">DELIVERED TODAY</span>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-200 text-slate-800 font-bold">
                    {ordersCol3.length} Done
                  </span>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {ordersCol3.map((order) => renderOrderCard(order))}
                  {ordersCol3.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400 font-mono">No deliveries completed yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* ZONE B: LIVE STOCK SWITCHBOARD & GAYOO POS SYNC PANEL */}
          {/* ==================================================================== */}
          <div
            id="inventory-section"
            className={`${
              mobileTab === 'stock' || mobileTab === 'gayoo'
                ? 'block'
                : 'hidden lg:block'
            }`}
          >
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch pt-2">
              {/* LEFT PANEL: INSTANT STOCK & PRICE SWITCHBOARD */}
              <div
                className={`xl:col-span-8 flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm ${
                  mobileTab === 'stock' || mobileTab === 'orders' ? 'flex' : 'hidden lg:flex'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Instant Stock &amp; Price Switchboard</h3>
                    <p className="text-[11px] text-slate-500">
                      தானியங்கி கையிருப்பு மேலாண்மை • 5 அலகுகளுக்கு கீழ் இருந்தால் ஆன்லைனில் முடக்கப்படும்
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded font-mono text-[10px] bg-[#ffdad6] text-[#ba1a1a] font-bold uppercase">
                    Auto Out-of-Stock Guard &lt; 5 Units
                  </span>
                </div>

                {/* Mobile & Desktop Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search 1,000+ products in English, Tamil, or ID..."
                      className="h-10 w-full pl-9 pr-3 text-sm bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#005d42]"
                    />
                  </div>

                  {/* Mobile Quick Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    <button
                      onClick={() => setStockQuickFilter('all')}
                      className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                        stockQuickFilter === 'all'
                          ? 'bg-[#005d42] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      All Items ({catalog.length})
                    </button>
                    <button
                      onClick={() => setStockQuickFilter('low')}
                      className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                        stockQuickFilter === 'low'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      }`}
                    >
                      Low Stock (&lt;5)
                    </button>
                    <button
                      onClick={() => setStockQuickFilter('out')}
                      className={`min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                        stockQuickFilter === 'out'
                          ? 'bg-slate-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Out of Stock
                    </button>
                  </div>
                </div>

                {/* Category Horizontal Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {[
                    { id: 'All', label: 'All Categories' },
                    { id: 'rice-grains', label: 'Rice & Grains' },
                    { id: 'dals-pulses', label: 'Dals & Spices' },
                    { id: 'oils-ghee', label: 'Oils & Ghee' },
                    { id: 'dairy-eggs', label: 'Dairy & Milk' },
                    { id: 'vegetables-fruits', label: 'Fruits & Veg' },
                    { id: 'snacks-biscuits', label: 'Snacks' },
                    { id: 'beverages', label: 'Beverages' },
                    { id: 'household-pooja', label: 'Household & Pooja' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`min-h-[36px] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-[#005d42] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* MOBILE AISLE-WALK VIEW (< 768px): Thumb-Friendly Mobile Cards */}
                <div className="block md:hidden space-y-3">
                  {filteredCatalog.slice(0, 30).map((product) => {
                    const firstVariant = product.variants[0] || { id: 'v1', label: '1 pack', price: 50, mrp: 60, stock_qty: 15 };
                    const isLowStock = (firstVariant.stock_qty ?? 0) < 5;
                    const isSaved = modifiedVariants[firstVariant.id];

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs space-y-3"
                      >
                        {/* Top Row: Thumbnail + Names + Online Toggle */}
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.nameEn}
                                width={48}
                                height={48}
                                loading="lazy"
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-slate-900 truncate leading-tight">
                                {product.nameEn}
                              </h4>
                              {product.nameTa && (
                                <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                                  {product.nameTa}
                                </p>
                              )}
                              <span className="inline-block mt-1 font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                                {firstVariant.label}
                              </span>
                            </div>
                          </div>

                          {/* Online Toggle */}
                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-[10px] font-mono font-bold text-slate-500 mb-1">Online</span>
                            <button
                              onClick={() => handleToggleInStock(product.id, product.inStock)}
                              className={`min-h-[44px] min-w-[52px] rounded-full flex items-center px-1 transition-colors shadow-inner ${
                                product.inStock ? 'bg-[#97f5cc] justify-end' : 'bg-[#ffdad6] justify-start'
                              }`}
                              aria-label={`Toggle online status for ${product.nameEn}`}
                            >
                              <div className={`w-5 h-5 rounded-full ${product.inStock ? 'bg-[#005d42]' : 'bg-[#ba1a1a]'} shadow`}></div>
                            </button>
                          </div>
                        </div>

                        {/* Alert Banner for Low Stock */}
                        {isLowStock && (
                          <div className="w-full py-1.5 px-3 rounded-lg bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-mono font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>AUTO-DISABLED ONLINE (&lt;5 BUFFER • {firstVariant.stock_qty ?? 0} left)</span>
                          </div>
                        )}

                        {/* Bottom Inline Edit Row: Price, MRP, Stock Qty with touch steppers */}
                        <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100">
                          {/* Price */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                              Price (₹)
                            </label>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={firstVariant.price}
                              onChange={(e) =>
                                handleUpdateVariant(product.id, firstVariant.id, 'price', parseFloat(e.target.value) || 0)
                              }
                              className="w-full h-10 px-2 font-mono text-base font-bold text-slate-900 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                            />
                          </div>

                          {/* MRP */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                              MRP (₹)
                            </label>
                            <input
                              type="number"
                              inputMode="numeric"
                              value={firstVariant.mrp}
                              onChange={(e) =>
                                handleUpdateVariant(product.id, firstVariant.id, 'mrp', parseFloat(e.target.value) || 0)
                              }
                              className="w-full h-10 px-2 font-mono text-base text-slate-600 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#005d42]"
                            />
                          </div>

                          {/* Stock Qty Stepper */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-mono uppercase font-bold text-slate-500 block">
                                Stock Qty
                              </label>
                              {isSaved && (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Saved
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const current = firstVariant.stock_qty ?? 0;
                                  if (current > 0) {
                                    handleUpdateVariant(product.id, firstVariant.id, 'stock_qty', current - 1);
                                  }
                                }}
                                className="min-h-[40px] min-w-[36px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg flex items-center justify-center text-slate-700"
                                aria-label="Decrease stock"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <input
                                type="number"
                                inputMode="numeric"
                                value={firstVariant.stock_qty}
                                onChange={(e) =>
                                  handleUpdateVariant(product.id, firstVariant.id, 'stock_qty', parseInt(e.target.value, 10) || 0)
                                }
                                className={`w-full h-10 text-center font-mono text-base font-bold rounded-lg border ${
                                  isLowStock
                                    ? 'bg-[#ffdad6] text-[#ba1a1a] border-rose-300'
                                    : 'bg-slate-50 text-[#005d42] border-slate-200'
                                } focus:outline-none focus:ring-2 focus:ring-[#005d42]`}
                              />

                              <button
                                onClick={() => {
                                  const current = firstVariant.stock_qty ?? 0;
                                  handleUpdateVariant(product.id, firstVariant.id, 'stock_qty', current + 1);
                                }}
                                className="min-h-[40px] min-w-[36px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg flex items-center justify-center text-slate-700"
                                aria-label="Increase stock"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* DESKTOP VIEW (hidden md:block): Dense Data Table */}
                <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-mono text-[11px] uppercase tracking-wider text-slate-600">
                      <tr>
                        <th className="py-2.5 px-3">Product Name / தமிழ் விவரம்</th>
                        <th className="py-2.5 px-2">Pack Variant</th>
                        <th className="py-2.5 px-2">Price (₹)</th>
                        <th className="py-2.5 px-2">MRP (₹)</th>
                        <th className="py-2.5 px-2">Stock (Qty)</th>
                        <th className="py-2.5 px-3">Buffer Status</th>
                        <th className="py-2.5 px-3 text-right">Online Toggle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredCatalog.slice(0, 30).map((product) => {
                        const firstVariant = product.variants[0] || { id: 'v1', label: '1 pack', price: 50, mrp: 60, stock_qty: 15 };
                        const isLowStock = (firstVariant.stock_qty ?? 0) < 5;

                        return (
                          <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3">
                              <div className="font-bold text-slate-900">{product.nameEn}</div>
                              {product.nameTa && (
                                <div className="text-[11px] text-slate-500">{product.nameTa}</div>
                              )}
                            </td>
                            <td className="py-2 px-2 font-mono text-[11px] text-slate-700">
                              {firstVariant.label}
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={firstVariant.price}
                                onChange={(e) =>
                                  handleUpdateVariant(product.id, firstVariant.id, 'price', parseFloat(e.target.value) || 0)
                                }
                                className="w-16 h-7 px-1.5 font-mono text-xs text-slate-900 bg-slate-100 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#005d42]"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={firstVariant.mrp}
                                onChange={(e) =>
                                  handleUpdateVariant(product.id, firstVariant.id, 'mrp', parseFloat(e.target.value) || 0)
                                }
                                className="w-16 h-7 px-1.5 font-mono text-xs text-slate-500 bg-slate-100 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#005d42]"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={firstVariant.stock_qty}
                                onChange={(e) =>
                                  handleUpdateVariant(product.id, firstVariant.id, 'stock_qty', parseInt(e.target.value, 10) || 0)
                                }
                                className={`w-16 h-7 px-1.5 font-mono text-xs font-bold rounded border ${
                                  isLowStock
                                    ? 'bg-[#ffdad6] text-[#ba1a1a] border-rose-300'
                                    : 'bg-slate-100 text-[#005d42] border-slate-200'
                                } focus:outline-none focus:ring-1 focus:ring-[#005d42]`}
                              />
                            </td>
                            <td className="py-2 px-3">
                              {isLowStock ? (
                                <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-[#ffdad6] text-[#ba1a1a] font-bold uppercase">
                                  AUTO-DISABLED (&lt;5 BUFFER)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded font-mono text-[9px] bg-[#97f5cc] text-[#002115] font-bold uppercase">
                                  Active &amp; In Stock
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                onClick={() => handleToggleInStock(product.id, product.inStock)}
                                className={`w-8 h-4 rounded-full inline-flex items-center px-0.5 transition-colors shadow-inner ${
                                  product.inStock ? 'bg-[#97f5cc] justify-end' : 'bg-[#ffdad6] justify-start'
                                }`}
                              >
                                <div className={`w-3 h-3 rounded-full ${product.inStock ? 'bg-[#005d42]' : 'bg-[#ba1a1a]'}`}></div>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px] pt-1">
                  <span>Showing {Math.min(30, filteredCatalog.length)} of {catalog.length} items</span>
                  <span className="text-[#005d42] font-bold">POS Master Sync V4.19</span>
                </div>
              </div>

              {/* RIGHT PANEL: GAYOO POS / ERP SYNC */}
              <div
                id="gayoo-section"
                className={`xl:col-span-4 flex-col justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm ${
                  mobileTab === 'gayoo' || mobileTab === 'orders' ? 'flex' : 'hidden lg:flex'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#005d42]" />
                      <h3 className="font-bold text-base text-slate-900">Gayoo POS / ERP Sync</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#97f5cc] text-[#002115] font-bold uppercase">
                      Live Bridge
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    கேயூ பில்லிங் மென்பொருள் ஒருங்கிணைப்பு
                  </p>

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
                    className="min-h-[140px] p-5 sm:p-6 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 hover:border-[#005d42] active:bg-slate-100 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#97f5cc] text-[#005d42] flex items-center justify-center mb-2 shadow-sm">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-xs sm:text-sm text-slate-800">
                      Tap or Drop Gayoo POS Stock CSV
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      1-Click sync counter stock &amp; selling prices from phone/desktop
                    </span>
                    <div className="mt-2 px-2 py-1 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">
                      Columns: Name/ID, Variant, Price, MRP, Stock
                    </div>
                  </div>

                  {/* Live Indicator Card */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#005d42]">
                      <span className="w-2 h-2 rounded-full bg-[#005d42] animate-pulse"></span>
                      <span>Last Synced with Counter Gayoo POS: Today</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>0 Conflicts</span>
                      <span className="font-mono font-bold text-slate-900">{catalog.length} SKUs Monitored</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#005d42] h-full w-full"></div>
                    </div>
                  </div>
                </div>

                {/* Action Export Button */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={handleExportDaybook}
                    className="w-full min-h-[44px] h-11 px-3 rounded-xl bg-[#283044] hover:bg-[#1e2330] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Today&apos;s Online Bills (CSV)</span>
                  </button>
                  <p className="text-center font-mono text-[10px] text-slate-400">
                    Formatted for Gayoo Tally XML &amp; Daybook Auto-Import
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* ZONE C: REVENUE & DAILY SETTLEMENT VIEW */}
          {/* Rendered when mobileTab === 'revenue', or at bottom of command center */}
          {/* ==================================================================== */}
          <div
            className={`${
              mobileTab === 'revenue' ? 'block' : 'hidden'
            } space-y-4`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-[#005d42]" />
                <h2 className="font-bold text-base text-slate-900">Daily Cash &amp; UPI Settlement</h2>
              </div>
              <button
                onClick={handleExportDaybook}
                className="min-h-[44px] px-3.5 py-1.5 rounded-lg bg-[#005d42] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* 4 Metrics in responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-mono uppercase text-slate-500 font-bold block">Total Online Revenue</span>
                <span className="text-2xl font-extrabold text-[#005d42] font-mono block mt-1">₹{kpis.rev}</span>
                <span className="text-[11px] text-slate-500">{orders.length} orders today</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-mono uppercase text-slate-500 font-bold block">UPI Auto-Settled</span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono block mt-1">₹{kpis.upiRev}</span>
                <span className="text-[11px] text-emerald-600 font-bold">{kpis.upiCount} orders online</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-mono uppercase text-slate-500 font-bold block">COD Cash to Collect</span>
                <span className="text-2xl font-extrabold text-[#904d00] font-mono block mt-1">₹{kpis.codRev}</span>
                <span className="text-[11px] text-amber-700 font-bold">{kpis.codCount} riders collecting</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-mono uppercase text-slate-500 font-bold block">Average Order Value</span>
                <span className="text-2xl font-extrabold text-blue-700 font-mono block mt-1">
                  ₹{orders.length ? Math.round(kpis.rev / orders.length) : 0}
                </span>
                <span className="text-[11px] text-slate-500">Express delivery</span>
              </div>
            </div>

            {/* Order Payment Ledger */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Order-Wise Payment Ledger</h3>
              <div className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{o.id}</span>
                      <span className="text-slate-500 ml-2">{o.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          o.paymentMethod === 'upi' ? 'bg-[#97f5cc] text-[#002115]' : 'bg-[#ffdcc3] text-[#2f1500]'
                        }`}
                      >
                        {o.paymentMethod.toUpperCase()}
                      </span>
                      <span className="font-mono font-bold text-slate-900">₹{o.total}</span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400 font-mono">No transactions recorded yet today</div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MOBILE STICKY BOTTOM TAB SWITCHER (< 1024px) */}
      {/* ==================================================================== */}
      <nav
        aria-label="Admin Navigation Tabs"
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] flex items-center justify-around lg:hidden shadow-lg"
      >
        {/* Tab 1: Orders */}
        <button
          onClick={() => setMobileTab('orders')}
          className={`min-h-[44px] flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors relative ${
            mobileTab === 'orders' ? 'text-[#005d42] font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <ClipboardList className="w-5 h-5" />
            {activeOrdersCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 font-extrabold text-[9px] px-1 rounded-full font-mono min-w-[16px] text-center">
                {activeOrdersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Orders</span>
        </button>

        {/* Tab 2: Stock */}
        <button
          onClick={() => setMobileTab('stock')}
          className={`min-h-[44px] flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors relative ${
            mobileTab === 'stock' ? 'text-[#005d42] font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <Package className="w-5 h-5" />
            {lowStockCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-600 text-white font-extrabold text-[9px] px-1 rounded-full font-mono min-w-[16px] text-center">
                {lowStockCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Stock</span>
        </button>

        {/* Tab 3: Gayoo Sync */}
        <button
          onClick={() => setMobileTab('gayoo')}
          className={`min-h-[44px] flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
            mobileTab === 'gayoo' ? 'text-[#005d42] font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <RefreshCw className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Gayoo</span>
        </button>

        {/* Tab 4: Revenue */}
        <button
          onClick={() => setMobileTab('revenue')}
          className={`min-h-[44px] flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors ${
            mobileTab === 'revenue' ? 'text-[#005d42] font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <IndianRupee className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">Revenue</span>
        </button>
      </nav>
    </div>
  );
}
