'use client';

import React, { useState } from 'react';
import { categories } from '@/data/products';
import { IconPackage } from './Icons';

type Props = {
  src: string;
  alt: string;
  category?: string;
  className?: string;
};

export default function ProductImage({ src, alt, category, className = '' }: Props) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    const cat = categories.find((c) => c.id === category);
    if (cat?.image) {
      return (
        <div className={`relative overflow-hidden rounded-xl bg-[#F5EFE6] flex items-center justify-center ${className}`}>
          <img
            src={cat.image}
            alt={alt}
            className="w-full h-full object-cover rounded-xl"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
            <span className="text-[10px] font-semibold text-white drop-shadow break-words leading-tight w-full">{alt}</span>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl bg-[#F5EFE6] text-brand-slate/60 border border-[#EAE2D5] ${className}`}
        style={{ minHeight: '120px' }}
      >
        <IconPackage className="w-8 h-8 text-brand-primary/60 mb-2" />
        <span className="text-xs font-semibold text-center px-2 text-brand-slate leading-tight">{alt}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#F5EFE6] flex items-center justify-center ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-xl transition-transform duration-500 hover:scale-105"
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
}
