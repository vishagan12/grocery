'use client';

import React from 'react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import Toast from '@/components/Toast';
import LocationModal from '@/components/LocationModal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-brand-cream text-slate-900 w-full relative">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 w-full pb-28 sm:pb-16 focus:outline-none">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <MobileBottomNav />
      <Toast />
      <LocationModal />
    </div>
  );
}
