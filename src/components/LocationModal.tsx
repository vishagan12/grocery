'use client';

import React, { useState } from 'react';
import { useStore, UserLocation } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { IconMapPin, IconNavigation, IconSearch, IconCheckCircle } from './Icons';

const maduraiLocalities: UserLocation[] = [
  { area: 'K.K. Nagar', city: 'Madurai', pincode: '625020', landmark: 'Near Meenakshi Mission', distanceKm: 1.8, deliveryMins: 20 },
  { area: 'Anna Nagar', city: 'Madurai', pincode: '625020', landmark: 'Near Ambika Theatre', distanceKm: 2.5, deliveryMins: 25 },
  { area: 'Simmakkal', city: 'Madurai', pincode: '625001', landmark: 'Near Sethupathi School', distanceKm: 3.2, deliveryMins: 30 },
  { area: 'Goripalayam', city: 'Madurai', pincode: '625002', landmark: 'Near Government Hospital', distanceKm: 3.8, deliveryMins: 30 },
  { area: 'Tallakulam', city: 'Madurai', pincode: '625002', landmark: 'Near Tamukkam Ground', distanceKm: 3.5, deliveryMins: 30 },
  { area: 'Mattuthavani', city: 'Madurai', pincode: '625007', landmark: 'Near Integrated Bus Terminus', distanceKm: 4.1, deliveryMins: 35 },
  { area: 'S.S. Colony', city: 'Madurai', pincode: '625016', landmark: 'Near Bye-pass Road', distanceKm: 4.5, deliveryMins: 35 },
  { area: 'TVS Nagar', city: 'Madurai', pincode: '625003', landmark: 'Near TVS Higher Sec School', distanceKm: 4.8, deliveryMins: 35 },
  { area: 'Villapuram', city: 'Madurai', pincode: '625012', landmark: 'Near Housing Board', distanceKm: 4.9, deliveryMins: 35 },
];

export default function LocationModal() {
  const { state, dispatch, showToast } = useStore();
  const lang = state.lang;
  const [search, setSearch] = useState('');
  const [detecting, setDetecting] = useState(false);

  if (!state.locationModalOpen) return null;

  const handleSelect = (loc: UserLocation) => {
    dispatch({ type: 'SET_LOCATION', location: loc });
    showToast(
      lang === 'ta'
        ? `இடம் மாற்றப்பட்டது: ${loc.area} (~${loc.deliveryMins} நிமிடங்களில் டெலிவரி)`
        : `Delivering to ${loc.area} (~${loc.deliveryMins} mins)`
    );
  };

  const handleDetectGPS = () => {
    setDetecting(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setTimeout(() => {
            const detected = maduraiLocalities[0]; // K.K. Nagar
            setDetecting(false);
            handleSelect(detected);
          }, 700);
        },
        () => {
          // Fallback gracefully on permission denial
          setTimeout(() => {
            const detected = maduraiLocalities[0];
            setDetecting(false);
            handleSelect(detected);
          }, 600);
        },
        { timeout: 3000 }
      );
    } else {
      setTimeout(() => {
        setDetecting(false);
        handleSelect(maduraiLocalities[0]);
      }, 500);
    }
  };

  const filtered = search.trim()
    ? maduraiLocalities.filter(
        (l) =>
          l.area.toLowerCase().includes(search.toLowerCase()) ||
          l.pincode.includes(search) ||
          l.landmark.toLowerCase().includes(search.toLowerCase())
      )
    : maduraiLocalities;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in"
      onClick={() => dispatch({ type: 'SET_LOCATION_MODAL', open: false })}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg p-5 md:p-6 animate-scale-up max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE2D5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-mint text-brand-primary flex items-center justify-center border border-emerald-200">
              <IconMapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-brand-slate leading-tight">
                {lang === 'ta' ? 'டெலிவரி இடத்தை தேர்வு செய்யவும்' : 'Select Delivery Location'}
              </h3>
              <p className="text-xs text-[#8A7B6D]">
                {lang === 'ta' ? 'ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட் • 5 கி.மீ. சுற்றளவு' : 'Sri Amman Supermarket • 5 km Express Radius'}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close location modal"
            onClick={() => dispatch({ type: 'SET_LOCATION_MODAL', open: false })}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8A7B6D] hover:text-brand-slate hover:bg-[#F5EFE6] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* GPS Auto-Detect Button */}
        <div className="pt-4 pb-3">
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={detecting}
            className="w-full bg-[#EBF3FB] hover:bg-[#DCE9F8] text-[#1E5B99] font-bold py-3 px-4 rounded-xl transition-all border border-[#C5DCF4] touch-target flex items-center justify-center gap-2.5 shadow-xs"
          >
            <IconNavigation className={`w-5 h-5 text-[#1E5B99] ${detecting ? 'animate-spin' : ''}`} />
            <span>
              {detecting
                ? (lang === 'ta' ? 'ஜிபிஎஸ் கண்டறிகிறது...' : 'Detecting GPS location...')
                : (lang === 'ta' ? 'தற்போதைய இருப்பிடத்தை பயன்படுத்தவும் (GPS)' : 'Use My Current Location (GPS Auto-Detect)')}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7B6D]">
            <IconSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ta' ? 'மதுரை பகுதி அல்லது பின்கோட் தேடவும்...' : 'Search area or pincode in Madurai...'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EAE2D5] bg-[#FCFAF6] text-sm text-brand-slate placeholder:text-[#8A7B6D] focus:border-brand-primary focus:bg-white outline-none transition-all"
          />
        </div>

        {/* Localities List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8A7B6D] mb-1.5 px-1">
            {lang === 'ta' ? 'மதுரை டெலிவரி பகுதிகள்' : 'Supported Madurai Localities'}
          </p>

          {filtered.map((loc) => {
            const isSelected = state.location.area === loc.area;
            return (
              <div
                key={loc.area}
                onClick={() => handleSelect(loc)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-brand-primary bg-[#EAF5E8] shadow-xs'
                    : 'border-[#EAE2D5] hover:border-brand-primary/40 bg-[#FFFFFF] hover:bg-[#FDFBF7]'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'bg-brand-primary text-white' : 'bg-[#F5EFE6] text-[#8A7B6D]'
                  }`}>
                    <IconMapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-bold text-sm text-brand-slate break-words leading-tight">{loc.area}</p>
                      <span className="text-[11px] text-[#8A7B6D] font-medium shrink-0">({loc.pincode})</span>
                    </div>
                    <p className="text-xs text-[#8A7B6D] break-words leading-snug mt-0.5">{loc.landmark}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block bg-[#EBF3FB] text-[#1E5B99] text-[11px] font-bold px-2 py-0.5 rounded-md border border-[#C5DCF4]">
                    {loc.deliveryMins} {lang === 'ta' ? 'நிமிடம்' : 'mins'}
                  </span>
                  <p className="text-[10px] text-[#8A7B6D] mt-0.5">
                    {loc.distanceKm} {lang === 'ta' ? 'கி.மீ. தூரம்' : 'km away'}
                  </p>
                  {isSelected && (
                    <div className="flex items-center justify-end gap-1 text-brand-primary text-xs font-bold mt-1">
                      <IconCheckCircle className="w-3.5 h-3.5" />
                      <span>{lang === 'ta' ? 'தேர்ந்தெடுக்கப்பட்டது' : 'Selected'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="pt-3 mt-3 border-t border-[#EAE2D5] flex items-center justify-between text-xs text-[#8A7B6D]">
          <span>{lang === 'ta' ? 'மெயின் ரோடு கடையிலிருந்து விரைவு டெலிவரி' : 'Fastest delivery from 123 Main Road store'}</span>
          <span className="font-bold text-brand-primary">{t('freeDelivery', lang)}</span>
        </div>
      </div>
    </div>
  );
}
