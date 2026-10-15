'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { products } from '@/data/products';
import { t } from '@/data/translations';
import ProductCard from './ProductCard';
import { Heart, ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';

export default function WishlistPage() {
  const { state, dispatch, showToast } = useStore();
  const lang = state.lang;

  // Filter products that are in the user's wishlist
  const wishlistedProducts = products.filter((p) => state.wishlist.includes(p.id));

  const handleClearWishlist = () => {
    dispatch({ type: 'CLEAR_WISHLIST' });
    showToast(lang === 'ta' ? 'விருப்பப்பட்டியல் அழிக்கப்பட்டது' : 'Wishlist cleared');
  };

  const handleAddAllToCart = () => {
    if (wishlistedProducts.length === 0) return;
    wishlistedProducts.forEach((p) => {
      dispatch({ type: 'ADD_TO_CART', productId: p.id, variantIndex: 0, quantity: 1 });
    });
    showToast(
      lang === 'ta'
        ? `${wishlistedProducts.length} பொருட்கள் கூடையில் சேர்க்கப்பட்டன!`
        : `Added ${wishlistedProducts.length} items to your cart!`
    );
  };

  return (
    <section className="py-6 sm:py-10 bg-[#FBF8F3] min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Breadcrumb & Back */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_PAGE', page: 'products' })}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#4CB01E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('backToProducts', lang)}</span>
          </button>

          {wishlistedProducts.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddAllToCart}
                className="inline-flex items-center gap-1.5 bg-[#4CB01E] hover:bg-[#3D9415] text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{lang === 'ta' ? 'அனைத்தையும் சேர்' : 'Add All to Cart'}</span>
              </button>
              <button
                type="button"
                onClick={handleClearWishlist}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs sm:text-sm font-bold px-3 py-2 rounded-xl transition-all active:scale-95"
                title="Clear all wishlist items"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{lang === 'ta' ? 'அழி' : 'Clear'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Title Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-2xs mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 shadow-2xs shrink-0">
              <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {lang === 'ta' ? 'உங்கள் விருப்பப்பட்டியல்' : 'Your Wishlist'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {wishlistedProducts.length}{' '}
                {wishlistedProducts.length === 1
                  ? lang === 'ta'
                    ? 'பொருள் சேமிக்கப்பட்டது'
                    : 'item saved'
                  : lang === 'ta'
                  ? 'பொருட்கள் சேமிக்கப்பட்டுள்ளன'
                  : 'items saved for later'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {wishlistedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-10 sm:p-16 text-center shadow-2xs max-w-xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 mx-auto flex items-center justify-center mb-4 border border-rose-100">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mb-2">
              {lang === 'ta' ? 'உங்கள் விருப்பப்பட்டியல் காலியாக உள்ளது' : 'Your wishlist is empty'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              {lang === 'ta'
                ? 'உங்களுக்கு பிடித்த மளிகைப் பொருட்களில் உள்ள இதய குறியீட்டை அழுத்தி இங்கே சேமியுங்கள்.'
                : 'Explore our catalog and tap the heart icon on any product to save it here for later shopping.'}
            </p>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_PAGE', page: 'products' })}
              className="bg-[#4CB01E] hover:bg-[#3D9415] text-white px-7 py-3 rounded-2xl font-black text-sm shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
            >
              <span>{t('shopNow', lang)}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {wishlistedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
