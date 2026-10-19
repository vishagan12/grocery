'use client';

import React, { useState, useRef } from 'react';
import { useStore, UserLocation } from '@/context/StoreContext';
import { calculateDistanceKm, SHOP_MAPS_URL } from '@/lib/geofence';
import { PlaceSuggestion } from '@/app/api/places/route';
import GpsDeniedModal from '@/components/GpsDeniedModal';
import {
  MapPin,
  Navigation,
  Search,
  Check,
  X,
  Loader2,
  Home,
  Briefcase,
  ExternalLink,
} from 'lucide-react';

export default function LocationModal() {
  const { state, dispatch, showToast, selectAddress } = useStore();
  const lang = state.lang;
  const [search, setSearch] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [gpsDeniedOpen, setGpsDeniedOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  if (!state.locationModalOpen) return null;

  // Handle selecting a location
  const handleSelect = (loc: UserLocation) => {
    dispatch({ type: 'SET_LOCATION', location: loc });
    dispatch({ type: 'SET_LOCATION_MODAL', open: false });
    showToast(
      lang === 'ta'
        ? `இடம் மாற்றப்பட்டது: ${loc.area} (~${loc.deliveryMins} நிமிடங்களில் டெலிவரி)`
        : `Delivering to ${loc.area} (~${loc.deliveryMins} mins)`
    );
  };

  // Live Autocomplete search via /api/places with 150ms debounce and AbortController
  const handleSearchChange = (val: string) => {
    setSearch(val);
    const clean = val.trim();
    if (clean.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/places?q=${encodeURIComponent(clean)}&shopLat=${state.shopCoords.lat}&shopLng=${state.shopCoords.lng}`,
          { signal: abortControllerRef.current.signal }
        );
        const data = await res.json();
        if (data && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        } else {
          setSuggestions([]);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 150);
  };

  // Real GPS Auto-Detect via /api/places
  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      showToast(lang === 'ta' ? 'உங்கள் சாதனத்தில் GPS இல்லை' : 'Geolocation is not supported by your browser');
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await fetch(
            `/api/places?lat=${lat}&lng=${lng}&shopLat=${state.shopCoords.lat}&shopLng=${state.shopCoords.lng}`
          );
          const data = await res.json();

          if (data && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            const first = data.suggestions[0];
            const loc: UserLocation = {
              area: first.area || first.title || 'Madurai',
              city: first.city || 'Madurai',
              pincode: first.pincode || '625020',
              landmark: first.street || '',
              distanceKm: first.distanceKm,
              deliveryMins: Math.min(30, Math.max(15, Math.round(first.distanceKm * 7))),
              lat: first.lat,
              lng: first.lng,
            };
            handleSelect(loc);
          } else {
            const dist = calculateDistanceKm(state.shopCoords.lat, state.shopCoords.lng, lat, lng);
            const loc: UserLocation = {
              area: 'Current Location',
              city: 'Madurai',
              pincode: '625020',
              landmark: '',
              distanceKm: dist,
              deliveryMins: Math.min(30, Math.max(15, Math.round(dist * 7))),
              lat,
              lng,
            };
            handleSelect(loc);
          }
        } catch {
          showToast(lang === 'ta' ? 'இருப்பிடத்தை கண்டறிய இயலவில்லை' : 'Could not detect your GPS location');
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        setDetecting(false);
        console.warn('Geolocation error:', error);
        setGpsDeniedOpen(true);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in text-slate-900 box-border"
        onClick={() => dispatch({ type: 'SET_LOCATION_MODAL', open: false })}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg p-5 md:p-6 animate-scale-up max-h-[85vh] flex flex-col box-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight break-words">
                  {lang === 'ta' ? 'டெலிவரி இடத்தை தேர்வு செய்யவும்' : 'Select Delivery Location'}
                </h3>
                <p className="text-xs text-slate-500 break-words mt-0.5">
                  {lang === 'ta' ? 'ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட் • 3.0 கி.மீ. சுற்றளவு' : 'Sri Amman Supermarket • 3.0 km Express Radius'}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close location modal"
              onClick={() => dispatch({ type: 'SET_LOCATION_MODAL', open: false })}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* GPS Auto-Detect Button */}
          <div className="pt-4 pb-3">
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={detecting}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold py-3 px-4 rounded-xl transition-all border border-blue-200 touch-target flex items-center justify-center gap-2.5 shadow-xs text-xs sm:text-sm box-border active:scale-98"
            >
              {detecting ? (
                <Loader2 className="w-4 h-4 text-blue-700 animate-spin shrink-0" />
              ) : (
                <Navigation className="w-4 h-4 text-blue-700 shrink-0" />
              )}
              <span className="truncate">
                {detecting
                  ? lang === 'ta'
                    ? 'GPS கண்டறிகிறது...'
                    : 'Detecting GPS location...'
                  : lang === 'ta'
                  ? 'தற்போதைய இருப்பிடத்தை பயன்படுத்தவும் (GPS)'
                  : 'Use My Current Location (GPS Auto-Detect)'}
              </span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3 w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={lang === 'ta' ? 'மதுரை பகுதி அல்லது தெரு தேடவும்...' : 'Search street or area in Madurai...'}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white outline-none transition-all box-border"
            />
            {isSearching && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </span>
            )}
          </div>

          {/* Suggestions or Saved Addresses List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar w-full">
            {/* Autocomplete Results if search typed */}
            {suggestions.length > 0 && (
              <div className="space-y-1.5 pb-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 px-1">
                  {lang === 'ta' ? 'தேடல் முடிவுகள்' : 'Search Results'}
                </p>
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect({
                        area: item.area || item.title,
                        city: item.city || 'Madurai',
                        pincode: item.pincode,
                        landmark: item.street || '',
                        distanceKm: item.distanceKm,
                        deliveryMins: Math.min(30, Math.max(15, Math.round(item.distanceKm * 7))),
                        lat: item.lat,
                        lng: item.lng,
                      });
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-3 transition-all box-border"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 break-words leading-tight">{item.title}</p>
                      <p className="text-[11px] text-slate-500 break-words mt-0.5">{item.fullAddress}</p>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                        item.deliverable ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {item.deliverable ? `${item.distanceKm} km` : `${item.distanceKm} km • Out of 3km`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* User's Saved Addresses */}
            {state.savedAddresses.length > 0 && !search && (
              <div className="space-y-1.5 pb-2">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 px-1">
                  {lang === 'ta' ? 'சேமிக்கப்பட்ட முகவரிகள்' : 'Your Saved Addresses'}
                </p>
                {state.savedAddresses.map((addr) => {
                  const isSelected = state.selectedAddressId === addr.id;
                  const within3km = addr.distanceKm <= 3.0;

                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        selectAddress(addr.id);
                        dispatch({ type: 'SET_LOCATION_MODAL', open: false });
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 box-border ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          {addr.tag === 'Home' ? (
                            <Home className="w-4 h-4 text-emerald-600" />
                          ) : addr.tag === 'Work' ? (
                            <Briefcase className="w-4 h-4 text-blue-600" />
                          ) : (
                            <MapPin className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-xs text-slate-900">{addr.customLabel || addr.tag}</p>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                                within3km ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {within3km ? `${addr.distanceKm} km` : 'Out of 3km'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 break-words mt-0.5 font-medium leading-tight">
                            {addr.houseNo}, {addr.street}, {addr.area}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <a
              href={SHOP_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-bold"
            >
              <span>{lang === 'ta' ? 'Google Maps கடை இருப்பிடம்' : 'Store on Google Maps'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="font-extrabold text-emerald-700">3.0 km Express</span>
          </div>
        </div>
      </div>

      {/* Centered GPS Denied Modal */}
      <GpsDeniedModal
        isOpen={gpsDeniedOpen}
        onClose={() => setGpsDeniedOpen(false)}
        onSearchManually={() => {
          setGpsDeniedOpen(false);
          setTimeout(() => {
            searchInputRef.current?.focus();
          }, 100);
        }}
        onRetryGps={() => {
          setGpsDeniedOpen(false);
          handleDetectGPS();
        }}
        lang={lang}
      />
    </>
  );
}
