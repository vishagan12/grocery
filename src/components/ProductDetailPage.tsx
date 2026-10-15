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
        <div className="bg-[#FFFFFF] rounded-3xl shadow-sm border border-[#EAE2D5] overflow-hidden mb-10">
          <div className="grid md:grid-cols-12 gap-0">
            {/* Left Image Section (5 cols) */}
            <div className="md:col-span-5 p-6 md:p-10 bg-[#FDFBF7] border-b md:border-b-0 md:border-r border-[#EAE2D5] flex flex-col items-center justify-center relative">
              {product.badge && (
                <span className="absolute top-4 left-4 bg-[#C62828] text-white text-xs font-bold px-3 py-1 rounded-md shadow-sm">
                  {lang === 'ta' && product.badgeTa ? product.badgeTa : product.badge}
                </span>
              )}

              <ProductImage
                src={product.image}
                alt={lang === 'ta' ? product.nameTa : product.nameEn}
                category={product.category}
                className="w-full h-56 md:h-80 mx-auto"
              />

              <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-brand-primary bg-brand-mint px-3 py-1 rounded-full border border-brand-primary/10">
                <IconCheckCircle className="w-3.5 h-3.5" />
                <span>{lang === 'ta' ? '100% தூய கவுண்டர் தரம்' : '100% Genuine Counter Quality'}</span>
              </div>
            </div>

            {/* Right Details Section (7 cols) */}
            <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between bg-[#FFFFFF] space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 bg-brand-mint text-brand-primary text-xs font-bold px-2.5 py-1 rounded-lg border border-brand-primary/20">
                    <span className="w-2 h-2 rounded-full bg-brand-primary inline-block" />
                    <span>{t('inStock', lang)}</span>
                  </span>
                  <span className="text-xs text-brand-slate/50 font-semibold bg-[#F5EFE6] px-2.5 py-1 rounded-lg">
                    {product.category}
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold text-brand-slate mb-1 leading-snug">
                  {lang === 'ta' ? product.nameTa : product.nameEn}
                </h1>
                <p className="text-sm text-brand-slate/50 mb-4 font-semibold">
                  {lang === 'ta' ? product.nameEn : product.nameTa}
                </p>

                {/* Description */}
                {(product.descriptionEn || product.descriptionTa) && (
                  <p className="text-xs md:text-sm text-brand-slate/70 mb-5 leading-relaxed bg-[#FDFBF7] p-3.5 rounded-xl border border-[#EAE2D5]">
                    {lang === 'ta' && product.descriptionTa ? product.descriptionTa : product.descriptionEn}
                  </p>
                )}

                {/* Variant Selector */}
                <div className="mb-5">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-brand-slate/60 mb-2">
                    {t('selectPackSize', lang)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedVariant(i)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs md:text-sm transition-all border-2 touch-target ${
                          i === activeVariantIndex
                            ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                            : 'bg-[#FDFBF7] text-brand-slate border-[#EAE2D5] hover:border-brand-primary/40'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-3xl font-black text-brand-slate">₹{variant.price}</span>
                  <span className="text-base text-brand-slate/40 line-through">₹{variant.mrp}</span>
                  {discount > 0 && (
                    <span className="text-xs font-bold text-white bg-[#C62828] px-2 py-0.5 rounded shadow-xs">
                      {discount}% {lang === 'ta' ? 'தள்ளுபடி' : 'OFF'}
                    </span>
                  )}
                </div>

                {/* Savings Callout */}
                {savings > 0 && (
                  <div className="bg-brand-mint rounded-xl p-3 mb-6 text-xs md:text-sm font-bold text-brand-primary border border-brand-primary/20 flex items-center gap-2">
                    <IconCheckCircle className="w-4 h-4 shrink-0" />
                    <span>{t('savingsCallout', lang, { amount: savings })}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div>
                {quantity === 0 ? (
                  <button
                    onClick={() => {
                      dispatch({ type: 'ADD_TO_CART', productId: product.id, variantIndex: activeVariantIndex });
                      showToast(t('addedToCart', lang));
                    }}
                    className="w-full bg-brand-primary hover:bg-brand-highlight text-white font-extrabold text-base rounded-xl transition-all shadow-md shadow-brand-primary/20 touch-target flex items-center justify-center gap-2"
                    style={{ minHeight: '52px' }}
                  >
                    <IconCart className="w-5 h-5 text-white" />
                    <span>{t('addToCart', lang)}</span>
                  </button>
                ) : (
                  <div
                    className="flex items-center justify-between bg-brand-primary rounded-xl overflow-hidden shadow-md px-4"
                    style={{ minHeight: '52px' }}
                  >
                    <span className="text-white text-xs font-bold">
                      {lang === 'ta' ? 'கூடையில் உள்ளது:' : 'In Cart:'}
                    </span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() =>
                          dispatch({
                            type: 'UPDATE_QUANTITY',
                            productId: product.id,
                            variantIndex: activeVariantIndex,
                            quantity: quantity - 1,
                          })
                        }
                        className="text-white font-bold text-2xl hover:scale-110 transition-transform"
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
                        className="text-white font-bold text-2xl hover:scale-110 transition-transform"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Assurance Points */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#EAE2D5] text-[11px] text-brand-slate/70">
                  <div className="flex items-center gap-1.5">
                    <IconTruck className="w-3.5 h-3.5 text-brand-primary shrink-0" />
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
