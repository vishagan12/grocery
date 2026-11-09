'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { categories } from '@/data/products';
import { ArrowRight } from 'lucide-react';

export default function CategoryGrid() {
  const { state, dispatch } = useStore();
  const lang = state.lang;

  const navigateCategory = (categoryId: string) => {
    dispatch({ type: 'SET_CATEGORY', category: categoryId });
    dispatch({ type: 'SET_PAGE', page: 'products' });
  };

  // Grouped sections matching Blinkit's layout in the reference screenshot
  const categorySections = [
    {
      titleEn: 'Grocery & Kitchen',
      titleTa: 'மளிகை & சமையலறை பொருட்கள்',
      items: [
        {
          id: 'vegetables-fruits',
          nameEn: 'Vegetables & Fruits',
          nameTa: 'காய்கறி & பழங்கள்',
          image: '/images/cat-vegetables-fruits.webp',
        },
        {
          id: 'rice-grains',
          nameEn: 'Atta, Rice & Dal',
          nameTa: 'மாவு, அரிசி & பருப்பு',
          image: '/images/cat-rice-grains.webp',
        },
        {
          id: 'oils-ghee',
          nameEn: 'Oil, Ghee & Masala',
          nameTa: 'எண்ணெய் & மசாலா',
          image: '/images/cat-oils-ghee.webp',
        },
        {
          id: 'dairy-eggs',
          nameEn: 'Dairy, Bread & Eggs',
          nameTa: 'பால், ரொட்டி & முட்டை',
          image: '/images/cat-dairy-eggs.webp',
        },
      ],
    },
    {
      titleEn: 'Snacks & Drinks',
      titleTa: 'சிற்றுண்டி & குளிர்பானங்கள்',
      items: [
        {
          id: 'snacks-biscuits',
          nameEn: 'Chips & Namkeen',
          nameTa: 'சிப்ஸ் & முறுக்கு',
          image: '/images/cat-snacks-biscuits.webp',
        },
        {
          id: 'dals-pulses',
          nameEn: 'Dals, Pulses & Spices',
          nameTa: 'பருப்பு & மசாலா',
          image: '/images/cat-dals-pulses.webp',
        },
        {
          id: 'beverages',
          nameEn: 'Tea, Coffee & Drinks',
          nameTa: 'டீ, காபி & பானங்கள்',
          image: '/images/cat-beverages.webp',
        },
        {
          id: 'household-pooja',
          nameEn: 'Kitchenware & Pooja',
          nameTa: 'வீட்டு உபயோகம் & பூஜை',
          image: '/images/cat-household-pooja.webp',
        },
      ],
    },
  ];

  return (
    <section className="py-4 sm:py-7 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {categorySections.map((sec, secIdx) => (
          <div key={sec.titleEn} className={secIdx > 0 ? 'mt-6 sm:mt-8' : ''}>
            {/* Department Section Title matching Blinkit Screenshot 2 */}
            <div className="flex items-center justify-between mb-3 pb-1 border-b border-slate-100">
              <h3 className="text-base sm:text-xl font-black text-[#0F172A] tracking-tight">
                {lang === 'ta' ? sec.titleTa : sec.titleEn}
              </h3>
              {secIdx === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'SET_CATEGORY', category: 'all' });
                    dispatch({ type: 'SET_PAGE', page: 'products' });
                  }}
                  className="text-xs sm:text-sm font-black text-apple hover:text-apple-hover transition-colors flex items-center gap-1"
                >
                  <span>{lang === 'ta' ? 'அனைத்தும்' : 'See all'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 4-column rounded cards matching reference screenshot */}
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3.5">
              {sec.items.map((cat) => {
                const isSelected = state.activeCategory === cat.id;

                return (
                  <div
                    key={cat.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigateCategory(cat.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigateCategory(cat.id);
                      }
                    }}
                    className="flex flex-col items-center cursor-pointer group text-center select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-apple rounded-2xl p-1"
                  >
                    {/* Full-bleed rounded image container where image occupies the entire box uniformly */}
                    <div
                      className={`w-full aspect-square rounded-2xl overflow-hidden mb-1.5 transition-all flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-apple border-2 border-apple'
                          : 'border border-slate-200/90 hover:border-apple'
                      } shadow-2xs hover:shadow-xs bg-slate-100`}
                    >
                      <img
                        src={cat.image}
                        alt={cat.nameEn}
                        width={120}
                        height={120}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    {/* Category Label (Full text visible, no ellipsis, centered) */}
                    <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight text-center break-words w-full px-0.5">
                      {lang === 'ta' ? cat.nameTa : cat.nameEn}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
