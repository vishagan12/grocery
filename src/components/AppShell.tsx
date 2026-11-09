'use client';

import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import Toast from '@/components/Toast';
import dynamic from 'next/dynamic';
import { useStore } from '@/context/StoreContext';

const CartDrawer = dynamic(() => import('@/components/CartDrawer'), { ssr: false });
const LocationModal = dynamic(() => import('@/components/LocationModal'), { ssr: false });

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('Service Worker registration skipped:', err);
        });
      });
    }
  }, []);

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
      {state.cartOpen && <CartDrawer />}
      <MobileBottomNav />
      <Toast />
      {state.locationModalOpen && <LocationModal />}
    </div>
  );
}
