'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { categories } from '@/data/products';
import { IconPackage } from './Icons';

type Props = {
  src: string;
  alt: string;
  category?: string;
  className?: string;
  priority?: boolean;
  eager?: boolean;
};

export default function ProductImage({
  src,
  alt,
  category,
  className = '',
  priority = false,
  eager = false,
}: Props) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    const cat = categories.find((c) => c.id === category);
    if (cat?.image) {
      return (
        <div className={`relative overflow-hidden rounded-xl bg-[#F5EFE6] flex items-center justify-center ${className}`}>
          <Image
            src={cat.image}
            alt={alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
            className="object-cover rounded-xl"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2 pointer-events-none">
            <span className="text-[10px] font-semibold text-white drop-shadow break-words leading-tight w-full">
              {alt}
            </span>
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
        <span className="text-xs font-semibold text-center px-2 text-brand-slate leading-tight">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#F5EFE6] flex items-center justify-center ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
        className="object-cover rounded-xl transition-transform duration-500 hover:scale-105"
        onError={() => setHasError(true)}
        priority={priority}
        loading={priority ? undefined : (eager ? 'eager' : 'lazy')}
      />
    </div>
  );
}
