'use client';

import React, { useState, useEffect } from 'react';
import {
  Store,
  Printer,
  Volume2,
  VolumeX,
  Truck,
  Layers,
  ClipboardList,
  IndianRupee,
  Barcode,
  Settings,
  Languages,
  Lock,
  Menu,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Power,
  ShieldCheck,
  User,
  LayoutDashboard,
  Package,
  FolderTree,
  Users,
  Bike,
  MapPin,
  Tag,
  Image,
  BarChart3,
} from 'lucide-react';
import { Avatar } from '../ui/Miscellaneous';

export interface AdminNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  badgeColor?: string;
  external?: boolean;
  href?: string;
}

export interface AdminNavGroup {
  group: string;
  items: AdminNavItem[];
}

export interface AdminLayoutShellProps {
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  pendingOrdersCount?: number;
  lowStockCount?: number;
  acceptingOrders: boolean;
  onToggleStore: () => void;
  autoPrintEnabled: boolean;
  onToggleAutoPrint: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  lang: 'en' | 'ta';
  onToggleLang: () => void;
  onLock: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  children: React.ReactNode;
}

export const AdminLayoutShell: React.FC<AdminLayoutShellProps> = ({
  currentSection,
  onSectionChange,
  pendingOrdersCount = 0,
  lowStockCount = 0,
  acceptingOrders,
  onToggleStore,
  autoPrintEnabled,
  onToggleAutoPrint,
  soundEnabled,
  onToggleSound,
  lang,
  onToggleLang,
  onLock,
  searchQuery = '',
  onSearchChange,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Restore collapsed preference on desktop
  useEffect(() => {
    const saved = localStorage.getItem('sas_admin_sidebar_collapsed');
    if (saved === 'true') setIsCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sas_admin_sidebar_collapsed', String(next));
  };

  const navGroups: AdminNavGroup[] = [
    {
      group: 'Fulfillment & Orders',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Overview',
          icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'orders',
          label: 'Live Dispatch',
          icon: <ClipboardList className="w-4 h-4 shrink-0" />,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
          badgeColor: 'bg-[#FFDCC3] text-[#2F1500]',
        },
      ],
    },
    {
      group: 'Customers & Fleet',
      items: [
        {
          id: 'customers',
          label: 'Customer Directory',
          icon: <Users className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'riders',
          label: 'Rider Fleet',
          icon: <Bike className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'zones',
          label: 'Zones & Time Slots',
          icon: <MapPin className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'rider_portal',
          label: 'Rider Mobile App',
          icon: <Truck className="w-4 h-4 shrink-0" />,
          external: true,
          href: '/rider',
        },
      ],
    },
    {
      group: 'Catalog & Merchandising',
      items: [
        {
          id: 'products',
          label: 'Products Catalog',
          icon: <Package className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'categories',
          label: 'Store Categories',
          icon: <FolderTree className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'stock',
          label: 'Inventory & Stock',
          icon: <Layers className="w-4 h-4 shrink-0" />,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300',
        },
        {
          id: 'coupons',
          label: 'Coupons & Offers',
          icon: <Tag className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'banners',
          label: 'Banners & Content',
          icon: <Image className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      group: 'Financials & Bridge',
      items: [
        {
          id: 'revenue',
          label: 'Revenue & Daybook',
          icon: <IndianRupee className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'gayoo',
          label: 'Gayoo POS Bridge',
          icon: <Barcode className="w-4 h-4 shrink-0" />,
        },
      ],
    },
    {
      group: 'System & Roles',
      items: [
        {
          id: 'settings',
          label: 'Store Settings',
          icon: <Settings className="w-4 h-4 shrink-0" />,
        },
        {
          id: 'roles',
          label: 'Staff Roles & Audit',
          icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-slate-900 flex flex-col antialiased">
      {/* Skip to Content Accessibility Link */}
      <a href="#admin-main-content" className="skip-link">
        Skip to main admin content
      </a>

      {/* ==================================================================== */}
      {/* MOBILE HEADER & DRAWER TRIGGER (< 1024px) */}
      {/* ==================================================================== */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#143B0D] text-white px-4 h-14 flex items-center justify-between border-b border-[#1E4D12] shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Open administration navigation"
          >
            <Menu className="w-5 h-5 text-[#97F5CC]" />
          </button>
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#76CA3E]" />
            <span className="font-extrabold text-sm tracking-tight">Sri Amman Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Audio Chime Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg transition-colors ${
              soundEnabled ? 'text-[#97F5CC] bg-white/10' : 'text-slate-400 bg-black/20'
            }`}
            title="Toggle Order Chime"
            aria-label="Toggle Order Chime"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Quick Lock Button */}
          <button
            onClick={onLock}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
            title="Lock Counter Screen"
            aria-label="Lock Counter Screen"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[80vw] bg-[#143B0D] text-white h-full flex flex-col justify-between shadow-2xl z-10 p-4">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#1E4D12]">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#76CA3E]" />
                  <div>
                    <span className="font-extrabold text-sm block">Sri Amman</span>
                    <span className="text-[10px] text-[#97F5CC] font-mono">Madurai Counter POS</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="mt-4 space-y-6">
                {navGroups.map((grp, gIdx) => (
                  <div key={gIdx} className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#97F5CC]/70 px-2 font-mono">
                      {grp.group}
                    </p>
                    <div className="space-y-1">
                      {grp.items.map((item) => {
                        const isActive = currentSection === item.id;
                        if (item.external) {
                          return (
                            <a
                              key={item.id}
                              href={item.href}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#1E4D12] hover:text-white transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                {item.icon}
                                <span>{item.label}</span>
                              </div>
                              <span className="text-[10px] text-[#97F5CC]">↗</span>
                            </a>
                          );
                        }

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onSectionChange(item.id);
                              setMobileDrawerOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                              isActive
                                ? 'bg-[#76CA3E] text-[#143B0D]'
                                : 'text-slate-300 hover:bg-[#1E4D12] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {item.icon}
                              <span>{item.label}</span>
                            </div>
                            {item.badge !== undefined && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                                  isActive ? 'bg-[#143B0D] text-white' : item.badgeColor
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Bottom Drawer Actions */}
            <div className="pt-4 border-t border-[#1E4D12] space-y-2">
              <div className="p-2.5 rounded-xl bg-[#1E4D12] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Online Orders</span>
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      acceptingOrders ? 'text-[#97F5CC]' : 'text-rose-400'
                    }`}
                  >
                    {acceptingOrders ? 'ACCEPTING LIVE' : 'PAUSED'}
                  </span>
                </div>
                <button
                  onClick={onToggleStore}
                  className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${
                    acceptingOrders ? 'bg-[#76CA3E] justify-end' : 'bg-rose-500 justify-start'
                  }`}
                  aria-label="Toggle Online Orders"
                >
                  <div className="w-5 h-5 rounded-full bg-[#143B0D] shadow" />
                </button>
              </div>

              <button
                onClick={onLock}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors"
              >
                <Lock className="w-4 h-4 text-slate-300" />
                <span>Lock Counter PIN</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DESKTOP FIXED SIDEBAR (>= 1024px) */}
      {/* ==================================================================== */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-full bg-[#143B0D] text-white z-50 flex-col justify-between shadow-xl transition-all duration-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="p-4 bg-[#143B0D] border-b border-[#1E4D12] flex items-center justify-between">
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#76CA3E] text-[#143B0D] flex items-center justify-center shrink-0 shadow-xs">
                  <Store className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-sm text-white tracking-tight block truncate">
                    Sri Amman
                  </span>
                  <span className="text-[10px] text-[#97F5CC] font-mono block truncate">
                    Counter POS • Madurai
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-9 h-9 mx-auto rounded-xl bg-[#76CA3E] text-[#143B0D] flex items-center justify-center shadow-xs">
                <Store className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-180px)]">
            {navGroups.map((grp, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!isCollapsed && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#97F5CC]/60 px-3 font-mono">
                    {grp.group}
                  </p>
                )}
                <div className="space-y-0.5">
                  {grp.items.map((item) => {
                    const isActive = currentSection === item.id;

                    if (item.external) {
                      return (
                        <a
                          key={item.id}
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          title={isCollapsed ? item.label : undefined}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#1E4D12] hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            {item.icon}
                            {!isCollapsed && <span>{item.label}</span>}
                          </div>
                          {!isCollapsed && <span className="text-[10px] text-[#97F5CC]">↗</span>}
                        </a>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        onClick={() => onSectionChange(item.id)}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                          isActive
                            ? 'bg-[#76CA3E] text-[#143B0D] shadow-xs'
                            : 'text-slate-300 hover:bg-[#1E4D12] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {item.icon}
                          {!isCollapsed && <span>{item.label}</span>}
                        </div>
                        {!isCollapsed && item.badge !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                              isActive ? 'bg-[#143B0D] text-white' : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Area: Collapse & Identity */}
        <div className="p-3 bg-[#143B0D] border-t border-[#1E4D12] space-y-2">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Avatar name="Admin Counter" size="sm" status="online" />
                <div className="min-w-0">
                  <p className="text-white text-xs font-bold truncate">Counter Admin</p>
                  <p className="text-[10px] text-[#97F5CC] font-mono truncate">Terminal #1</p>
                </div>
              </div>
              <button
                onClick={onLock}
                className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                title="Lock Terminal"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Collapse Sidebar Toggle Button */}
          <button
            onClick={toggleCollapsed}
            className="w-full min-h-[36px] flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg text-slate-400 hover:bg-[#1E4D12] hover:text-white text-xs font-bold transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* DESKTOP TOP BAR (>= 1024px) */}
      {/* ==================================================================== */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <header className="hidden lg:flex sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-6 items-center justify-between gap-4">
          {/* Quick Search */}
          <div className="w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Quick search orders, bag PINs, or products..."
              className="w-full rounded-xl bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-[#76CA3E]/30 focus:border-[#143B0D] transition-all"
            />
          </div>

          {/* Controls Cluster */}
          <div className="flex items-center gap-2.5">
            {/* Auto-Print Kiosk Button */}
            <button
              onClick={onToggleAutoPrint}
              className={`min-h-[38px] px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                autoPrintEnabled
                  ? 'bg-[#F1F9EC] border-[#76CA3E] text-[#143B0D]'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              title="80mm Thermal Slip Auto-Print"
            >
              <Printer className="w-4 h-4" />
              <span>Auto-Print: {autoPrintEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Sound Chime Toggle */}
            <button
              onClick={onToggleSound}
              className={`min-h-[38px] px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                soundEnabled
                  ? 'bg-[#F1F9EC] border-[#76CA3E] text-[#143B0D]'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              title="Supermarket Audio Alert"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#143B0D]" /> : <VolumeX className="w-4 h-4" />}
              <span>Alerts</span>
            </button>

            {/* Language Switch */}
            <button
              onClick={onToggleLang}
              className="min-h-[38px] px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Languages className="w-4 h-4 text-slate-500" />
              <span>{lang === 'en' ? 'EN / தமிழ்' : 'தமிழ் / EN'}</span>
            </button>

            {/* Store Accepting Orders Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs font-bold text-slate-600">Online Orders:</span>
              <button
                onClick={onToggleStore}
                className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded transition-colors ${
                  acceptingOrders
                    ? 'bg-[#97F5CC] text-[#002115]'
                    : 'bg-[#FFDAD6] text-[#410002]'
                }`}
              >
                {acceptingOrders ? 'ACCEPTING' : 'PAUSED'}
              </button>
            </div>

            {/* Lock Screen */}
            <button
              onClick={onLock}
              className="min-h-[38px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Lock Screen"
            >
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              <span>Lock</span>
            </button>
          </div>
        </header>

        {/* ==================================================================== */}
        {/* MAIN BODY OUTLET */}
        {/* ==================================================================== */}
        <main id="admin-main-content" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1920px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
