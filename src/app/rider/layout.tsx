import type { Metadata, Viewport } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Rider Delivery Portal | Sri Amman Supermarket',
  description: 'Express local delivery dispatch, bag lookup, and doorstep settlement.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#143B0D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#0F172A] selection:bg-[#76CA3E] selection:text-[#143B0D]">
      {children}
    </div>
  );
}
