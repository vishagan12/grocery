'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { IconCheckCircle } from '@/components/Icons';

export default function Toast() {
  const { state } = useStore();

  if (!state.toastMessage) return null;

  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[200] animate-slide-up">
      <div className="bg-brand-deep text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-2.5 whitespace-nowrap border border-emerald-800">
        <IconCheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>{state.toastMessage}</span>
      </div>
    </div>
  );
}
