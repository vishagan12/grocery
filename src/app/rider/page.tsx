'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Bike,
  Package,
  Clock,
  LogOut,
  Wifi,
  WifiOff,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { RiderAuthView, RiderSession } from '@/components/rider/RiderAuthView';
import { RiderHomeView, RiderOrder } from '@/components/rider/RiderHomeView';
import { RiderOrdersListView } from '@/components/rider/RiderOrdersListView';
import { RiderOrderDetailView } from '@/components/rider/RiderOrderDetailView';
import { RiderBottomNav, RiderNavItem } from '@/components/rider/ui/RiderPrimitives';

export default function RiderPage() {
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [session, setSession] = useState<RiderSession | null>(null);
  const [currentTab, setCurrentTab] = useState<'home' | 'orders' | 'detail'>('home');
  const [activeOrder, setActiveOrder] = useState<RiderOrder | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<RiderOrder | null>(null);
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // 2. Fetch Orders Scoped to Rider
  const fetchOrders = useCallback(async () => {
    if (!session) return;
    setIsSyncing(true);

    try {
      const res = await fetch(`/api/rider?riderPhone=${encodeURIComponent(session.phone)}`);
      if (res.ok) {
        const data = await res.json();
        const fetched: RiderOrder[] = data.orders || [];
        setOrders(fetched);

        // Find active in-transit order assigned to this rider
        const ongoing = fetched.find((o) => o.status === 2 && o.assignedRiderPhone === session.phone);
        setActiveOrder(ongoing || null);

        // If viewing an order, refresh its state
        if (selectedDetailOrder) {
          const updated = fetched.find((o) => o.id === selectedDetailOrder.id);
          if (updated) {
            setSelectedDetailOrder((prev) => (prev ? { ...prev, ...updated } : updated));
          }
        }
      }
    } catch {
      console.warn('Network issue fetching rider orders');
    } finally {
      setIsSyncing(false);
    }
  }, [session, selectedDetailOrder]);

  // 3. Offline Queue Sync (BUG-05)
  const replayOfflineQueue = useCallback(async () => {
    try {
      const rawQueue = localStorage.getItem('sas_rider_pending_mutations');
      if (!rawQueue) return;

      const queue: Array<{ orderId: string; status: number; paymentCollectedMethod?: string }> =
        JSON.parse(rawQueue);

      if (queue.length === 0) return;

      for (const item of queue) {
        await fetch('/api/rider', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }

      localStorage.removeItem('sas_rider_pending_mutations');
      setNotificationMsg('Offline delivery updates synced successfully.');
      setTimeout(() => setNotificationMsg(null), 3000);
      fetchOrders();
    } catch {}
  }, [fetchOrders]);

  // 1. Session Initialization & Network listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('sas_rider_session');
        if (stored) {
          setSession(JSON.parse(stored));
        }
      } catch {}

      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        replayOfflineQueue();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [replayOfflineQueue]);

  // Periodic and on-mount sync
  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session, fetchOrders]);

  // Realtime Supabase Subscription
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('rider_portal_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, fetchOrders]);

  const queueOfflineAction = (action: {
    orderId: string;
    status: number;
    paymentCollectedMethod?: string;
  }) => {
    try {
      const rawQueue = localStorage.getItem('sas_rider_pending_mutations');
      const queue = rawQueue ? JSON.parse(rawQueue) : [];
      queue.push(action);
      localStorage.setItem('sas_rider_pending_mutations', JSON.stringify(queue));
    } catch {}
  };

  // 4. Quick Bag Lookup
  const handleLookupCode = async (code: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/rider?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setSelectedDetailOrder(data.order);
          setCurrentTab('detail');
        }
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || (lang === 'ta' ? 'ஆர்டர் கிடைக்கவில்லை' : 'Order not found'));
      }
    } catch {
      alert(lang === 'ta' ? 'நெட்வொர்க் பிழை' : 'Network error during lookup');
    } finally {
      setIsSyncing(false);
    }
  };

  // 5. Shift Availability Toggle
  const handleToggleShiftStatus = () => {
    if (!session) return;
    const nextStatus = session.shiftStatus === 'active' ? 'on_break' : 'active';
    const updated: RiderSession = { ...session, shiftStatus: nextStatus };
    setSession(updated);
    try {
      sessionStorage.setItem('sas_rider_session', JSON.stringify(updated));
    } catch {}
  };

  // 6. Stage 1: Confirm Pickup & Start Ride
  const handleStartRide = async (orderId: string): Promise<boolean> => {
    if (!session) return false;

    // Optimistic UI update
    setActiveOrder((prev) => (prev ? { ...prev, status: 2 } : null));
    if (selectedDetailOrder && selectedDetailOrder.id === orderId) {
      setSelectedDetailOrder((prev) => (prev ? { ...prev, status: 2 } : null));
    }

    if (!isOnline) {
      queueOfflineAction({ orderId, status: 2 });
      return true;
    }

    try {
      const res = await fetch('/api/rider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: 2,
          riderName: session.name,
          riderPhone: session.phone,
        }),
      });

      if (res.ok) {
        fetchOrders();
        return true;
      }
      return false;
    } catch {
      queueOfflineAction({ orderId, status: 2 });
      return true;
    }
  };

  // 7. Stage 2: Mark Order Delivered
  const handleMarkDelivered = async (
    orderId: string,
    cashCollected: boolean
  ): Promise<boolean> => {
    if (!session) return false;

    // Optimistic UI update
    if (activeOrder && activeOrder.id === orderId) {
      setActiveOrder(null);
    }
    if (selectedDetailOrder && selectedDetailOrder.id === orderId) {
      setSelectedDetailOrder((prev) =>
        prev ? { ...prev, status: 3, paymentStatus: 'paid' } : null
      );
    }

    const payload = {
      orderId,
      status: 3,
      paymentCollectedMethod: cashCollected ? 'cash' : 'upi',
      riderName: session.name,
      riderPhone: session.phone,
    };

    if (!isOnline) {
      queueOfflineAction(payload);
      return true;
    }

    try {
      const res = await fetch('/api/rider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchOrders();
        return true;
      }
      return false;
    } catch {
      queueOfflineAction(payload);
      return true;
    }
  };

  // 8. Logout
  const handleLogout = () => {
    try {
      sessionStorage.removeItem('sas_rider_session');
    } catch {}
    setSession(null);
    setActiveOrder(null);
    setSelectedDetailOrder(null);
    setCurrentTab('home');
  };

  // If unauthenticated, show Rider Login
  if (!session) {
    return (
      <RiderAuthView
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          setCurrentTab('home');
        }}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'ta' : 'en')}
      />
    );
  }

  // Navigation Items for Bottom Bar
  const navItems: RiderNavItem[] = [
    {
      id: 'home',
      label: lang === 'ta' ? 'முகப்பு' : 'Active HUD',
      icon: <Bike className="w-5 h-5" />,
      badge: activeOrder ? 1 : undefined,
    },
    {
      id: 'orders',
      label: lang === 'ta' ? 'ஆர்டர்கள்' : 'Orders List',
      icon: <Package className="w-5 h-5" />,
      badge: orders.filter((o) => o.status === 0 || o.status === 1).length,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#0F172A] flex flex-col font-sans antialiased max-w-md mx-auto relative">
      {/* Top Mobile Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#143B0D] flex items-center justify-center text-white">
            <Bike className="w-5 h-5 text-[#76CA3E]" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-tight leading-none text-[#0F172A]">
              Sri Amman Dispatch
            </h1>
            <span className="text-[10px] font-mono text-[#047857] font-bold">
              {session.name.split(' ')[0]} • #{session.id.slice(-2)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online status indicator */}
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? 'bg-[#76CA3E]' : 'bg-[#BA1A1A] animate-pulse'
            }`}
            title={isOnline ? 'Online' : 'Offline'}
          />

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
            className="min-h-[36px] px-2 rounded-lg bg-[#F8FAF7] border border-[#E2E8F0] text-[11px] font-mono font-bold text-[#0F172A] hover:bg-[#F1F9EC]"
          >
            {lang === 'en' ? 'தமிழ்' : 'EN'}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="min-h-[36px] min-w-[36px] rounded-lg bg-[#F8FAF7] border border-[#E2E8F0] text-[#475569] hover:text-[#BA1A1A] flex items-center justify-center"
            title="End shift & log out"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Realtime / Offline Notification Banner */}
      {notificationMsg && (
        <div
          role="status"
          aria-live="polite"
          className="bg-[#047857] text-white text-xs font-bold px-4 py-2 text-center"
        >
          {notificationMsg}
        </div>
      )}

      {/* Main Screen Views */}
      <main className="p-4 flex-1">
        {currentTab === 'detail' && selectedDetailOrder ? (
          <RiderOrderDetailView
            order={selectedDetailOrder}
            onBack={() => setCurrentTab('home')}
            onStartRide={handleStartRide}
            onMarkDelivered={handleMarkDelivered}
            onResetToNext={() => {
              setSelectedDetailOrder(null);
              setCurrentTab('home');
              fetchOrders();
            }}
            isOnline={isOnline}
            lang={lang}
          />
        ) : currentTab === 'orders' ? (
          <RiderOrdersListView
            orders={orders}
            onSelectOrder={(ord) => {
              setSelectedDetailOrder(ord);
              setCurrentTab('detail');
            }}
            onRefresh={fetchOrders}
            isSyncing={isSyncing}
            lang={lang}
          />
        ) : (
          <RiderHomeView
            session={session}
            activeOrder={activeOrder}
            readyOrders={orders.filter((o) => o.status === 0 || o.status === 1)}
            isOnline={isOnline}
            isSyncing={isSyncing}
            onRefresh={fetchOrders}
            onSelectOrder={(ord) => {
              setSelectedDetailOrder(ord);
              setCurrentTab('detail');
            }}
            onLookupCode={handleLookupCode}
            onToggleShiftStatus={handleToggleShiftStatus}
            lang={lang}
          />
        )}
      </main>

      {/* Rider Bottom Navigation Dock (Hidden in Order Detail to leave room for Sticky Action Bar) */}
      {currentTab !== 'detail' && (
        <RiderBottomNav
          items={navItems}
          activeId={currentTab}
          onChange={(id) => setCurrentTab(id as 'home' | 'orders')}
        />
      )}
    </div>
  );
}
