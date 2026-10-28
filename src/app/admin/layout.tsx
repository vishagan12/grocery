import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Admin Command Center | Sri Amman Supermarket',
  description: 'Internal store management, order fulfillment, stock switches, and Gayoo POS sync.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#0F172A] selection:bg-[#76CA3E] selection:text-[#143B0D]">
      {children}
    </div>
  );
}
