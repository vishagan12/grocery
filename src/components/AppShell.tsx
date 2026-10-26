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
    <div className="min-h-screen flex flex-col bg-[#F8FAF7] text-slate-900 w-full relative">
      <Header />
      <main className="flex-1 w-full pb-28 sm:pb-16">
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
