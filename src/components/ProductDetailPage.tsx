'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products } from '@/data/products';
import ProductImage from './ProductImage';
import ProductCard from './ProductCard';
import { IconCart, IconSearch, IconCheckCircle, IconTruck, IconShield, IconRefresh } from './Icons';
import { ArrowLeft } from 'lucide-react';

export default function ProductDetailPage() {
  const { state, dispatch, getItemQuantity, showToast } = useStore();
  const lang = state.lang;
  const product = products.find((p) => p.id === state.productDetailId);
  const [selectedVariant, setSelectedVariant] = useState(0);

  useEffect(() => {
    setSelectedVariant(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product?.id]);

  if (!product) {
    return (
      <section className="py-20 text-center min-h-screen bg-[#FBF8F3]">
        <IconSearch className="w-12 h-12 text-brand-slate/30 mx-auto mb-3" />
        <p className="text-lg font-semibold text-brand-slate/60 mb-4">
          {lang === 'ta' ? 'பொருள் கிடைக்கவில்லை' : 'Product not found'}
        </p>
        <button
          onClick={() => dispatch({ type: 'SET_PAGE', page: 'products' })}
          className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold touch-target shadow-sm"
        >
          {t('shopNow', lang)}
        </button>
      </section>
    );
  }

  const activeVariantIndex = selectedVariant < product.variants.length ? selectedVariant : 0;
  const variant = product.variants[activeVariantIndex] || product.variants[0];
  const quantity = getItemQuantity(product.id, activeVariantIndex);
  const discount = Math.round(((variant.mrp - variant.price) / variant.mrp) * 100);
  const savings = variant.mrp - variant.price;

  // Frequently bought together
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <section className="py-6 md:py-10 bg-[#FBF8F3] min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => {
            dispatch({ type: 'SET_PRODUCT_DETAIL', id: null });
            dispatch({ type: 'SET_PAGE', page: 'products' });
          }}
          className="mb-6 text-xs md:text-sm font-bold text-brand-slate/70 hover:text-brand-primary transition-all inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToProducts', lang)}</span>
        </button>

        {/* Product Details Hero Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden mb-10">
          <div className="grid md:grid-cols-12 gap-0">
            {/* Left Image Section (5 cols) */}
            <div className="md:col-span-5 p-6 md:p-10 bg-[#F8FAF7] border-b md:border-b-0 md:border-r border-slate-200/80 flex flex-col items-center justify-center relative">
              {product.badge && (
                <span className="absolute top-4 left-4 bg-[#C62828] text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs">
                  {lang === 'ta' && product.badgeTa ? product.badgeTa : product.badge}
                </span>
              )}

              <ProductImage
                src={product.image}
                alt={lang === 'ta' ? product.nameTa : product.nameEn}
                category={product.category}
                className="w-full h-64 md:h-80 mx-auto"
              />

              <div className="mt-4 flex items-center gap-2 text-xs font-black text-[#1E4D12] bg-[#F1F9EC] px-3.5 py-1.5 rounded-full border border-[#4CB01E]/20 shadow-2xs">
                <IconCheckCircle className="w-4 h-4 text-[#4CB01E]" />
                <span>{lang === 'ta' ? '100% நேரடி கவுண்டர் தரம்' : '100% Genuine Counter Quality'}</span>
              </div>
            </div>

            {/* Right Details Section (7 cols) */}
            <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between bg-white space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 bg-[#F1F9EC] text-[#1E4D12] text-xs font-black px-3 py-1 rounded-full border border-[#4CB01E]/30">
                    <span className="w-2 h-2 rounded-full bg-[#4CB01E] inline-block animate-pulse" />
                    <span>{t('inStock', lang)}</span>
                  </span>
                  <span className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 leading-snug">
                  {lang === 'ta' ? product.nameTa : product.nameEn}
                </h1>
                <p className="text-sm sm:text-base text-slate-500 mb-4 font-semibold">
                  {lang === 'ta' ? product.nameEn : product.nameTa}
                </p>

                {/* Description */}
                {(product.descriptionEn || product.descriptionTa) && (
                  <p className="text-xs sm:text-sm text-slate-700 mb-5 leading-relaxed bg-[#F8FAF7] p-4 rounded-2xl border border-slate-200/80">
                    {lang === 'ta' && product.descriptionTa ? product.descriptionTa : product.descriptionEn}
                  </p>
                )}

                {/* Variant Selector */}
                <div className="mb-5">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5">
                    {t('selectPackSize', lang)}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {product.variants.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedVariant(i)}
                        className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all border-2 touch-target ${
                          i === activeVariantIndex
                            ? 'bg-[#1E4D12] text-white border-[#1E4D12] shadow-sm'
                            : 'bg-[#F8FAF7] text-slate-800 border-slate-200 hover:border-[#4CB01E]'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prominent Price & Active Offer Display */}
                <div className="bg-gradient-to-r from-[#F1F9EC] to-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 mb-5">
                  <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900">₹{variant.price}</span>
                    <span className="text-base sm:text-lg text-slate-400 line-through">MRP ₹{variant.mrp}</span>
                    {discount > 0 && (
                      <span className="text-xs sm:text-sm font-black text-white bg-[#C62828] px-2.5 py-1 rounded-lg shadow-xs">
                        {discount}% {lang === 'ta' ? 'தள்ளுபடி' : 'OFF'}
                      </span>
                    )}
                  </div>
                  {savings > 0 && (
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#1E4D12] pt-1">
                      <IconCheckCircle className="w-4 h-4 text-[#4CB01E] shrink-0" />
                      <span>{t('savingsCallout', lang, { amount: savings })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div>
                {quantity === 0 ? (
                  <button
                    onClick={() => {
                      dispatch({ type: 'ADD_TO_CART', productId: product.id, variantIndex: activeVariantIndex });
                      showToast(t('addedToCart', lang));
                    }}
                    className="w-full bg-[#4CB01E] hover:bg-[#3D9415] text-white font-black text-base sm:text-lg py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-98"
                  >
                    <IconCart className="w-5 h-5 text-white" />
                    <span>{t('addToCart', lang)}</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between bg-[#1E4D12] rounded-2xl overflow-hidden shadow-md px-5 py-2.5">
                    <span className="text-white text-xs sm:text-sm font-black">
                      {lang === 'ta' ? 'கூடையில் உள்ளது:' : 'In Cart:'}
                    </span>
                    <div className="flex items-center gap-5">
                      <button
                        onClick={() =>
                          dispatch({
                            type: 'UPDATE_QUANTITY',
                            productId: product.id,
                            variantIndex: activeVariantIndex,
                            quantity: quantity - 1,
                          })
                        }
                        className="text-white font-black text-2xl hover:scale-125 transition-transform"
                      >
                        −
                      </button>
                      <span className="text-white font-black text-xl min-w-[2rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() =>
                          dispatch({
                            type: 'UPDATE_QUANTITY',
                            productId: product.id,
                            variantIndex: activeVariantIndex,
                            quantity: quantity + 1,
                          })
                        }
                        className="text-white font-black text-2xl hover:scale-125 transition-transform"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Assurance Points */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <IconTruck className="w-4 h-4 text-[#4CB01E] shrink-0" />
                    <span>{t('delivery30', lang)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <IconShield className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                    <span>{t('directReturn', lang)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Frequently Bought Together */}
        {related.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl md:text-2xl font-extrabold text-brand-slate mb-4">
              {t('frequentlyBought', lang)}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
