'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { IconCheckCircle } from '@/components/Icons';

export default function Toast() {
  const { state } = useStore();

  if (!state.toastMessage) return null;

  return (
    <div className="fixed bottom-24 md:bottom-10 left-0 right-0 flex justify-center items-center z-[200] pointer-events-none px-4">
      <div className="bg-[#143B0D] text-white px-5 py-3 rounded-2xl shadow-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 whitespace-nowrap border border-emerald-400/30 animate-fade-in pointer-events-auto backdrop-blur-md">
        <IconCheckCircle className="w-4 h-4 text-yellow-300 shrink-0" />
        <span className="tracking-wide">{state.toastMessage}</span>
      </div>
    </div>
  );
}
