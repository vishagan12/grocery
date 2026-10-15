'use client';

import React, { useState } from 'react';
import { Product } from '@/data/products';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import ProductImage from './ProductImage';
import { Clock, Plus, Minus } from 'lucide-react';

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const { state, dispatch, getItemQuantity, showToast } = useStore();
  const lang = state.lang;
  const [selectedVariant, setSelectedVariant] = useState(0);

  const activeVariantIndex = selectedVariant < product.variants.length ? selectedVariant : 0;
  const variant = product.variants[activeVariantIndex] || product.variants[0];
  const quantity = getItemQuantity(product.id, activeVariantIndex);
  const discount = variant && variant.mrp > variant.price ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md p-2 sm:p-2.5 flex flex-col justify-between relative bg-white transition-all duration-200 group select-none">
      {/* Top-Left Discount Ribbon */}
      {discount > 0 && (
        <span className="bg-[#4CB01E] text-white text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-tl-xl rounded-br-xl absolute top-0 left-0 z-10 shadow-2xs whitespace-nowrap">
          {discount}% {lang === 'ta' ? 'தள்ளுபடி' : 'OFF'}
        </span>
      )}

      {/* Prominent Product Image Box */}
      <div
        className="w-full aspect-square rounded-xl bg-[#F8FAF7] p-1.5 sm:p-2 mb-2 relative flex items-center justify-center cursor-pointer overflow-hidden group-hover:bg-[#F1F9EC]/50 transition-colors border border-slate-100"
        onClick={() => {
          dispatch({ type: 'SET_PRODUCT_DETAIL', id: product.id });
          dispatch({ type: 'SET_PAGE', page: 'product-detail' });
        }}
      >
        <ProductImage
          src={product.image}
          alt={lang === 'ta' ? product.nameTa : product.nameEn}
          category={product.category}
          className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Details Section */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Delivery Time Micro-Badge with Lucide Clock */}
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit mb-1.5 whitespace-nowrap">
          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
          <span>{lang === 'ta' ? '20 நிமிடம்' : '20 MINS'}</span>
        </div>

        {/* Product Title - Prominent, natural font size for elders, fully visible */}
        <h3
          className="text-xs xs:text-sm sm:text-base font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-[#4CB01E] transition-colors break-words mb-1"
          onClick={() => {
            dispatch({ type: 'SET_PRODUCT_DETAIL', id: product.id });
            dispatch({ type: 'SET_PAGE', page: 'product-detail' });
          }}
          title={lang === 'ta' ? product.nameTa : product.nameEn}
        >
          {lang === 'ta' ? product.nameTa : product.nameEn}
        </h3>

        {/* Pack Weight / Variant Pill Selector */}
        <div className="my-1 sm:my-1.5">
          {product.variants.length > 1 ? (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {product.variants.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedVariant(i)}
                  className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-lg border whitespace-nowrap transition-all ${
                    i === activeVariantIndex
                      ? 'bg-[#4CB01E] text-white border-[#4CB01E]'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-[#4CB01E]/40'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="inline-block text-[10px] sm:text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 break-words">
              {variant.label}
            </span>
          )}
        </div>

        {/* Bottom Action Row (Price Left, ADD Button Right - Never Overlap) */}
        <div className="flex items-center justify-between gap-1.5 mt-auto pt-2 border-t border-slate-50">
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
              ₹{variant.price}
            </span>
            {variant.mrp > variant.price && (
              <span className="text-[10px] sm:text-xs text-slate-400 line-through mt-0.5 leading-none">
                ₹{variant.mrp}
              </span>
            )}
          </div>

          <div className="min-w-[64px] sm:min-w-[80px]">
            {quantity === 0 ? (
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: 'ADD_TO_CART', productId: product.id, variantIndex: activeVariantIndex });
                  showToast(t('addedToCart', lang));
                }}
                className="w-full border-2 border-[#4CB01E] bg-[#F1F9EC] hover:bg-[#4CB01E] text-[#1E4D12] hover:text-white font-extrabold text-xs sm:text-sm px-2.5 min-h-[34px] sm:min-h-[40px] rounded-xl shadow-2xs transition-all flex items-center justify-center select-none active:scale-95 whitespace-nowrap"
              >
                {lang === 'ta' ? 'சேர்' : 'ADD'}
              </button>
            ) : (
              <div className="w-full bg-[#4CB01E] text-white font-bold min-h-[34px] sm:min-h-[40px] rounded-xl flex items-center justify-between px-1.5 sm:px-2 shadow-sm select-none">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'UPDATE_QUANTITY', productId: product.id, variantIndex: activeVariantIndex, quantity: quantity - 1 })}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-transparent active:scale-90 select-none touch-manipulation focus:outline-none"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4 text-white stroke-[2.5]" />
                </button>
                <span className="text-xs sm:text-sm font-black px-1 select-none tabular-nums text-white">{quantity}</span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'UPDATE_QUANTITY', productId: product.id, variantIndex: activeVariantIndex, quantity: quantity + 1 })}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-transparent active:scale-90 select-none touch-manipulation focus:outline-none"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4 text-white stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
