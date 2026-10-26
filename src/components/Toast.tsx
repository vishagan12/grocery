'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { IconCheckCircle } from '@/components/Icons';

export default function Toast() {
  const { state } = useStore();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-3 sm:top-4 left-0 right-0 flex justify-center items-center z-[200] pointer-events-none px-4 box-border"
    >
      {state.toastMessage && (
        <div className="bg-brand-forest text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 border border-emerald-400/30 animate-fade-in pointer-events-auto backdrop-blur-md max-w-[calc(100vw-2rem)] break-words text-center">
          <IconCheckCircle className="w-4 h-4 text-yellow-300 shrink-0" />
          <span className="tracking-wide leading-snug">{state.toastMessage}</span>
        </div>
      )}
    </div>
  );
}
