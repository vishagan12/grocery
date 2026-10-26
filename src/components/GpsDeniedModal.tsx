'use client';

import React from 'react';
import { Compass, Search, Navigation, X } from 'lucide-react';
import { useDialog } from '@/hooks/useDialog';

interface GpsDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchManually: () => void;
  onRetryGps: () => void;
  lang: 'en' | 'ta';
}

export default function GpsDeniedModal({
  isOpen,
  onClose,
  onSearchManually,
  onRetryGps,
  lang,
}: GpsDeniedModalProps) {
  const panelRef = useDialog(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-fade-in text-slate-900"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gps-denied-title"
        aria-describedby="gps-denied-desc"
        tabIndex={-1}
        className="relative w-full max-w-sm sm:max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 sm:p-6 overflow-hidden text-center box-border animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={lang === 'ta' ? 'மூடு' : 'Close dialog'}
          className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Icon Badge */}
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
          <Compass className="w-6 h-6 stroke-[2.2]" />
        </div>

        {/* Title */}
        <h2 id="gps-denied-title" className="text-base sm:text-lg font-black text-slate-900 leading-snug">
          {lang === 'ta' ? 'இட அனுமதி மறுக்கப்பட்டது' : 'Location Permission Denied'}
        </h2>

        {/* Description */}
        <p id="gps-denied-desc" className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words mt-2 mb-5">
          {lang === 'ta'
            ? 'உங்கள் பிரவுசரில் லொகேஷன் அனுமதி நிறுத்தப்பட்டுள்ளது. பிரவுசர் செட்டிங்ஸில் அனுமதியை ஆன் செய்யவும் அல்லது கீழே உள்ள தேடல் பெட்டியில் உங்கள் தெரு/பகுதியை உள்ளிடவும்.'
            : 'Browser location access is turned off. Please allow location access in your browser settings, or simply type your street/area in the search box below to auto-fill your address.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSearchManually();
            }}
            className="w-full sm:flex-1 min-h-[44px] bg-apple hover:bg-apple-hover text-brand-forest font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 box-border"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="break-words">
              {lang === 'ta' ? 'முகவரியைத் தேடுங்கள்' : 'Search Address Manually'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onRetryGps();
            }}
            className="w-full sm:w-auto min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all active:scale-98 flex items-center justify-center gap-1.5 box-border shrink-0"
          >
            <Navigation className="w-3.5 h-3.5 shrink-0 text-slate-600" />
            <span className="whitespace-nowrap">{lang === 'ta' ? 'மீண்டும் முயற்சி செய்' : 'Try GPS Again'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
