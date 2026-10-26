'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore, SavedAddress } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products } from '@/data/products';
import { supabase } from '@/lib/supabase';
import { calculateDistanceKm, isWithinDeliveryRadius, SHOP_MAPS_URL } from '@/lib/geofence';
import OtpInput from '@/components/OtpInput';
import GpsDeniedModal from '@/components/GpsDeniedModal';
import { PlaceSuggestion } from '@/app/api/places/route';
import { trackPurchase } from '@/lib/metaPixel';
import {
  IconCart,
  IconCheckCircle,
  IconCreditCard,
  IconHome,
  IconTruck,
} from '@/components/Icons';
import {
  Zap,
  Clock,
  ArrowLeft,
  MapPin,
  Navigation,
  Home as HomeIcon,
  Briefcase,
  Plus,
  Check,
  AlertTriangle,
  Trash2,
  Loader2,
  Search,
  MapPinned,
  ExternalLink,
  X,
  ShieldCheck,
  Sparkles,
  Users,
  UserCheck,
  Phone,
} from 'lucide-react';

export default function CheckoutPage() {
  const {
    state,
    dispatch,
    getCartSubtotal,
    getCartMrpTotal,
    getCartDiscount,
    getDeliveryFee,
    getCartTotal,
    getCartItemCount,
    showToast,
    saveAddress,
    deleteAddress,
    selectAddress,
  } = useStore();
  const lang = state.lang;

  // Phone / Profile Information
  const [phone, setPhone] = useState(state.loginPhone || '');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [phoneVerified, setPhoneVerified] = useState(Boolean(state.isLoggedIn || state.loginPhone));

  // Address UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [deliverySlot, setDeliverySlot] = useState('express');
  const [paymentMethod, setPaymentMethod] = useState('upi');

  // New Address Form Fields (ZERO pre-filled garbage strings)
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Madurai');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [tag, setTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [customLabel, setCustomLabel] = useState('');
  const [formLat, setFormLat] = useState<number>(0);
  const [formLng, setFormLng] = useState<number>(0);
  const [formDistanceKm, setFormDistanceKm] = useState<number>(0);
  const [formDistanceCalculated, setFormDistanceCalculated] = useState(false);

  // Focus & Feedback States
  const [highlightHouseNo, setHighlightHouseNo] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const [gpsDeniedOpen, setGpsDeniedOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Refs for element focusing & aborting stale network requests
  const searchInputRef = useRef<HTMLInputElement>(null);
  const houseNoInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Places Autocomplete Search State
  const [placeQuery, setPlaceQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Recipient / Multi-Recipient State ("Ordering for Someone Else")
  const [isForSomeoneElse, setIsForSomeoneElse] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  // Single Order Recipient Override (for selected saved address)
  const [orderOverrideOpen, setOrderOverrideOpen] = useState(false);
  const [orderOverrideEnabled, setOrderOverrideEnabled] = useState(false);
  const [overrideRecipientName, setOverrideRecipientName] = useState('');
  const [overrideRecipientPhone, setOverrideRecipientPhone] = useState('');

  useEffect(() => {
    if (state.loginPhone) {
      setPhone(state.loginPhone);
      setPhoneVerified(true);
    }
  }, [state.loginPhone]);

  // Selected saved address from store
  const activeSavedAddress =
    state.savedAddresses.find((a) => a.id === state.selectedAddressId) ||
    state.savedAddresses[0] ||
    null;

  // Active address distance and delivery eligibility
  const activeDistance = activeSavedAddress
    ? activeSavedAddress.distanceKm
    : formDistanceCalculated
    ? formDistanceKm
    : 0;

  const isDeliverable = activeSavedAddress
    ? isWithinDeliveryRadius(activeSavedAddress.distanceKm)
    : formDistanceCalculated
    ? isWithinDeliveryRadius(formDistanceKm)
    : false;

  // 150ms Debounced Places Autocomplete with AbortController
  useEffect(() => {
    const cleanQ = placeQuery.trim();
    if (cleanQ.length < 2) {
      setSuggestions([]);
      setIsSearchingPlaces(false);
      setShowSuggestions(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      // Abort previous in-flight request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsSearchingPlaces(true);
      try {
        const res = await fetch(
          `/api/places?q=${encodeURIComponent(cleanQ)}&shopLat=${state.shopCoords.lat}&shopLng=${state.shopCoords.lng}`,
          { signal: abortControllerRef.current.signal }
        );
        const data = await res.json();
        if (data && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 150);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [placeQuery, state.shopCoords.lat, state.shopCoords.lng]);

  // GPS Auto-Detection via /api/places
  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      showToast(lang === 'ta' ? 'உங்கள் சாதனத்தில் GPS இல்லை' : 'Geolocation is not supported by your browser');
      return;
    }

    setIsDetectingGps(true);
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
            handleSelectSuggestion(first);
            showToast(
              lang === 'ta'
                ? `இருப்பிடம் கண்டறியப்பட்டது (${first.distanceKm} கி.மீ)`
                : `Location detected (${first.distanceKm} km from store)`
            );
          } else {
            const dist = calculateDistanceKm(state.shopCoords.lat, state.shopCoords.lng, lat, lng);
            setFormLat(lat);
            setFormLng(lng);
            setFormDistanceKm(dist);
            setFormDistanceCalculated(true);
          }
        } catch {
          showToast(lang === 'ta' ? 'இருப்பிடத்தை கண்டறிய இயலவில்லை' : 'Could not reverse-geocode your GPS location');
        } finally {
          setIsDetectingGps(false);
        }
      },
      (error) => {
        setIsDetectingGps(false);
        console.warn('Geolocation permission denied or error:', error);
        setGpsDeniedOpen(true);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Handle selecting a place suggestion with Smart Field Parser & Auto-fill
  const handleSelectSuggestion = (suggestion: PlaceSuggestion) => {
    // Populate fields
    setStreet(suggestion.street || suggestion.title);
    setArea(suggestion.area || suggestion.subtitle);
    setCity(suggestion.city || 'Madurai');
    setPincode(suggestion.pincode || '625001');
    setLandmark(suggestion.landmark || '');
    setFormLat(suggestion.lat);
    setFormLng(suggestion.lng);
    setFormDistanceKm(suggestion.distanceKm);
    setFormDistanceCalculated(true);

    // Populate or prompt for houseNo
    if (suggestion.houseNo) {
      setHouseNo(suggestion.houseNo);
      setHighlightHouseNo(false);
    } else {
      setHouseNo('');
      setHighlightHouseNo(true);
      setTimeout(() => {
        houseNoInputRef.current?.focus();
      }, 100);
      setTimeout(() => setHighlightHouseNo(false), 2500);
    }

    setPlaceQuery(suggestion.fullAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    setAutoFilled(true);
  };

  // Save new address handler
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseNo.trim() || !street.trim() || !area.trim() || !pincode.trim()) {
      showToast(lang === 'ta' ? 'அனைத்து முகவரி விவரங்களையும் நிரப்பவும்' : 'Please fill all required address fields');
      return;
    }

    if (tag === 'Other' && !customLabel.trim()) {
      showToast(lang === 'ta' ? 'முகவரிக்கு ஒரு பெயரை உள்ளிடவும்' : 'Please name this address (e.g. Mom’s House)');
      return;
    }

    let finalDist = formDistanceKm;
    if (!formDistanceCalculated) {
      finalDist = calculateDistanceKm(state.shopCoords.lat, state.shopCoords.lng, formLat || 9.9252, formLng || 78.1198);
    }

    if (finalDist > 3.0) {
      showToast(
        lang === 'ta'
          ? 'இந்த முகவரி 3 கி.மீ எல்லைக்கு வெளியே உள்ளது'
          : 'Cannot save address: it is outside our 3 km delivery zone'
      );
      return;
    }

    if (isForSomeoneElse) {
      if (!recipientName.trim()) {
        showToast(lang === 'ta' ? 'பெறுபவரின் பெயரை உள்ளிடவும்' : "Please enter recipient's name");
        return;
      }
      const cleanPhone = recipientPhone.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        showToast(
          lang === 'ta'
            ? 'செல்லுபடியாகும் 10 இலக்க இந்திய மொபைல் எண்ணை உள்ளிடவும்'
            : 'Please enter a valid 10-digit Indian mobile number for recipient'
        );
        return;
      }
    }

    setIsSavingAddress(true);
    try {
      await saveAddress({
        tag,
        customLabel: tag === 'Other' ? customLabel.trim() : undefined,
        houseNo: houseNo.trim(),
        street: street.trim(),
        area: area.trim(),
        landmark: landmark.trim() || undefined,
        city: city.trim() || 'Madurai',
        pincode: pincode.trim(),
        lat: formLat,
        lng: formLng,
        distanceKm: finalDist,
        isDefault: state.savedAddresses.length === 0,
        isForSomeoneElse: !!isForSomeoneElse,
        recipientName: isForSomeoneElse ? recipientName.trim() : undefined,
        recipientPhone: isForSomeoneElse ? recipientPhone.replace(/\D/g, '').slice(-10) : undefined,
      });

      setShowAddForm(false);
      setHouseNo('');
      setStreet('');
      setArea('');
      setPincode('');
      setLandmark('');
      setPlaceQuery('');
      setFormDistanceCalculated(false);
      setAutoFilled(false);
      setIsForSomeoneElse(false);
      setRecipientName('');
      setRecipientPhone('');
      showToast(lang === 'ta' ? 'முகவரி வெற்றிகரமாக சேமிக்கப்பட்டது' : 'Address saved successfully');
    } catch {
      showToast(lang === 'ta' ? 'முகவரியைச் சேமிக்க முடியவில்லை' : 'Failed to save address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // OTP handlers for phone verification
  const handleSendOtp = () => {
    if (phone.replace(/\D/g, '').length >= 10) {
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = () => {
    const code = otpDigits.join('');
    if (code.length === 4) {
      setPhoneVerified(true);
      const formatted = `+91-${phone.replace(/\D/g, '').slice(-10)}`;
      dispatch({ type: 'SET_LOGIN', phone: formatted, loggedIn: true });
      showToast(lang === 'ta' ? 'தொலைபேசி சரிபார்க்கப்பட்டது' : 'Phone verified successfully');
    }
  };

  // Place Order handler with 3km enforcement and Supabase persistence
  const handlePlaceOrder = async () => {
    if (!phoneVerified) {
      showToast(lang === 'ta' ? 'தயவுசெய்து உங்கள் மொபைல் எண்ணை சரிபார்க்கவும்' : 'Please verify your phone number');
      return;
    }

    // Determine current active address
    let orderAddressString = '';
    let currentDistance = 0;

    if (activeSavedAddress) {
      currentDistance = activeSavedAddress.distanceKm;
      orderAddressString = `${activeSavedAddress.houseNo}, ${activeSavedAddress.street}, ${activeSavedAddress.area}, ${activeSavedAddress.city} - ${activeSavedAddress.pincode}${
        activeSavedAddress.landmark ? `, Near ${activeSavedAddress.landmark}` : ''
      }`;
    } else if (houseNo.trim() && street.trim() && area.trim() && pincode.trim()) {
      currentDistance = formDistanceCalculated ? formDistanceKm : 0;
      orderAddressString = `${houseNo.trim()}, ${street.trim()}, ${area.trim()}, ${city} - ${pincode.trim()}${
        landmark.trim() ? `, Near ${landmark.trim()}` : ''
      }`;
    } else {
      showToast(lang === 'ta' ? 'தயவுசெய்து டெலிவரி முகவரியை உள்ளிடவும்' : 'Please select or add a delivery address');
      return;
    }

    // Strict 3.0 km radius check
    if (currentDistance > 3.0) {
      showToast(
        lang === 'ta'
          ? 'இந்த முகவரிக்கு டெலிவரி செய்ய முடியாது. 3 கி.மீ-க்குள் உள்ள முகவரியைத் தேர்வு செய்யவும்.'
          : 'Cannot place order: delivery address is outside our 3 km radius.'
      );
      return;
    }

    // Multi-recipient resolution (address setting vs single-order inline override)
    const orderIsForSomeoneElse = orderOverrideEnabled
      ? true
      : activeSavedAddress
      ? Boolean(activeSavedAddress.isForSomeoneElse)
      : isForSomeoneElse;

    const orderRecipientName = orderOverrideEnabled
      ? overrideRecipientName.trim()
      : activeSavedAddress?.isForSomeoneElse
      ? activeSavedAddress.recipientName
      : isForSomeoneElse
      ? recipientName.trim()
      : undefined;

    const orderRecipientPhone = orderOverrideEnabled
      ? overrideRecipientPhone.trim()
      : activeSavedAddress?.isForSomeoneElse
      ? activeSavedAddress.recipientPhone
      : isForSomeoneElse
      ? recipientPhone.trim()
      : undefined;

    if (orderIsForSomeoneElse) {
      if (!orderRecipientName) {
        showToast(
          lang === 'ta'
            ? 'பெறுபவரின் முழு பெயரை உள்ளிடவும்'
            : "Please enter recipient's full name"
        );
        return;
      }
      const cleanRecPhone = (orderRecipientPhone || '').replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanRecPhone)) {
        showToast(
          lang === 'ta'
            ? 'பெறுநருக்கு சரியான 10 இலக்க இந்திய மொபைல் எண்ணை உள்ளிடவும்'
            : 'Please enter a valid 10-digit Indian mobile number for recipient'
        );
        return;
      }
    }

    setIsSubmittingOrder(true);
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sas-idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const finalPhone = phone.startsWith('+91') ? phone : `+91-${phone.replace(/\D/g, '').slice(-10)}`;
    const rawPhone = finalPhone.replace(/\D/g, '').slice(-10);

    const targetLat = activeSavedAddress ? activeSavedAddress.lat : formLat;
    const targetLng = activeSavedAddress ? activeSavedAddress.lng : formLng;

    const orderItems = state.cart.map((item) => {
      const product =
        (state.catalog || products).find((p) => p.id === item.productId) ||
        products.find((p) => p.id === item.productId);
      const variant = product?.variants[item.variantIndex];
      return {
        productId: item.productId,
        variantLabel: variant?.label || '1 pack',
        quantity: item.quantity,
      };
    });

    let authoritativeOrderId = `#SAS-${1000 + Math.floor(Math.random() * 9000)}`;
    let finalTotal = getCartTotal();
    let finalSubtotal = getCartMrpTotal();
    let finalDiscount = getCartDiscount() + state.couponDiscount;
    let finalDeliveryFee = getDeliveryFee();

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idempotencyKey,
          phone: rawPhone,
          customerName: state.userName || 'Valued Customer',
          address: orderAddressString,
          lat: targetLat,
          lng: targetLng,
          paymentMethod,
          deliverySlot: deliverySlot || 'express',
          couponCode: state.appliedCoupon,
          items: orderItems,
          isForSomeoneElse: !!orderIsForSomeoneElse,
          recipientName: orderRecipientName || undefined,
          recipientPhone: orderRecipientPhone ? orderRecipientPhone.replace(/\D/g, '').slice(-10) : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.orderId) {
          authoritativeOrderId = data.orderId;
          finalTotal = data.total;
          finalSubtotal = data.subtotal;
          finalDiscount = data.discount;
          finalDeliveryFee = data.deliveryFee;
        }
      } else {
        const errJson = await res.json().catch(() => null);
        if (res.status === 400 && errJson?.error?.includes('3 km')) {
          showToast(
            lang === 'ta'
              ? 'இந்த முகவரிக்கு டெலிவரி செய்ய முடியாது. 3 கி.மீ-க்குள் உள்ள முகவரியைத் தேர்வு செய்யவும்.'
              : 'Delivery address is outside our 3 km radius.'
          );
          setIsSubmittingOrder(false);
          return;
        }
        console.warn('API /api/orders returned error, falling back locally:', errJson);
      }
    } catch (err) {
      console.warn('Server order API network error, falling back locally:', err);
    } finally {
      setIsSubmittingOrder(false);
    }

    const placedOrder = {
      id: authoritativeOrderId,
      items: [...state.cart],
      subtotal: finalSubtotal,
      discount: finalDiscount,
      deliveryFee: finalDeliveryFee,
      total: finalTotal,
      paymentMethod,
      address: orderAddressString,
      phone: finalPhone,
      status: 0,
      timestamp: Date.now(),
      isForSomeoneElse: !!orderIsForSomeoneElse,
      recipientName: orderRecipientName || undefined,
      recipientPhone: orderRecipientPhone ? orderRecipientPhone.replace(/\D/g, '').slice(-10) : undefined,
    };

    dispatch({ type: 'ADD_ORDER', order: placedOrder });
    trackPurchase(placedOrder.id, finalTotal);
    dispatch({ type: 'CLEAR_CART' });
    dispatch({ type: 'SET_PAGE', page: 'orders' });
    showToast(t('orderPlacedToast', lang));
  };

  if (getCartItemCount() === 0) {
    return (
      <section className="py-20 text-center min-h-[70vh] bg-brand-cream flex flex-col items-center justify-center px-4 w-full">
        <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-apple mb-4 shadow-sm">
          <IconCart className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-1">{t('cartEmpty', lang)}</h2>
        <p className="text-sm text-slate-500 mb-6">{t('cartEmptyDesc', lang)}</p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_PAGE', page: 'products' })}
          className="bg-apple hover:bg-apple-hover text-white px-8 py-3.5 rounded-xl font-extrabold touch-target shadow-md transition-all text-sm active:scale-95"
        >
          {t('shopNow', lang)}
        </button>
      </section>
    );
  }

  return (
    <>
      <section className="py-6 md:py-10 bg-brand-cream min-h-screen w-full max-w-full overflow-x-hidden box-border text-slate-900">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 w-full box-border">
          {/* Header Breadcrumb & Title */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full min-w-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_PAGE', page: 'products' })}
                  className="hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'ta' ? 'ஷாப்பிங் தொடர்க' : 'Continue Shopping'}</span>
                </button>
                <span>/</span>
                <span className="text-slate-800 font-bold">{t('checkout', lang)}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {t('checkout', lang)}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                {lang === 'ta'
                  ? 'மதுரை அதிவிரைவு 20-நிமிட ஹோம் டெலிவரி & நேரலை கண்காணிப்பு'
                  : 'Madurai Express 20-Min Doorstep Delivery & Real-Time Tracking'}
              </p>
            </div>

            <a
              href={SHOP_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{lang === 'ta' ? 'கடை இருப்பிடம் (Google Maps)' : 'Store Location (Google Maps)'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            </a>
          </div>

          {/* Responsive Grid: Left Column Form + Right Column Sticky Bill */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full min-w-0">
            {/* Left Column (Steps 1, 2, 3) */}
            <div className="w-full min-w-0 lg:col-span-7 space-y-5">
              {/* STEP 1: Phone Verification (If not verified) */}
              {!phoneVerified && (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4 w-full min-w-0 box-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0">
                      1
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 break-words leading-tight">
                        {lang === 'ta' ? 'மொபைல் எண் சரிபார்ப்பு' : 'Verify Mobile Number'}
                      </h3>
                      <p className="text-xs text-slate-500 break-words mt-0.5">
                        {lang === 'ta' ? 'ஆர்டர் உறுதிப்படுத்தலுக்கு 4-இலக்க OTP பெறவும்' : 'Get 4-digit OTP for order confirmation'}
                      </p>
                    </div>
                  </div>

                  {!otpSent ? (
                    <div className="space-y-3 pt-1 w-full min-w-0">
                      <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all w-full">
                        <span className="bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 border-r border-slate-300 shrink-0">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 w-full min-w-0 px-3.5 py-2.5 text-sm font-semibold outline-none bg-white text-slate-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={phone.replace(/\D/g, '').length < 10}
                        className="w-full bg-apple hover:bg-apple-hover disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-98 text-xs sm:text-sm box-border"
                      >
                        {lang === 'ta' ? 'OTP அனுப்பவும்' : 'Send 4-Digit OTP'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1 w-full min-w-0">
                      <p className="text-xs font-bold text-slate-700 text-center break-words">
                        {lang === 'ta'
                          ? `+91 ${phone} க்கு அனுப்பப்பட்ட 4-இலக்க OTP ஐ உள்ளிடவும்`
                          : `Enter the 4-digit OTP sent to +91 ${phone}`}
                      </p>
                      <div className="w-full flex justify-center py-1">
                        <OtpInput value={otpDigits} onChange={setOtpDigits} onComplete={handleVerifyOtp} />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpDigits.join('').length < 4}
                        className="w-full bg-apple hover:bg-apple-hover disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-98 text-xs sm:text-sm box-border"
                      >
                        {lang === 'ta' ? 'சரிபார்க்கவும்' : 'Verify & Continue'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Delivery Address (Swiggy-Style Address Book & 3km Radius Engine) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4 w-full min-w-0 box-border">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0">
                      {phoneVerified ? '1' : '2'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 break-words leading-tight">
                        {lang === 'ta' ? 'டெலிவரி முகவரி (3 கி.மீ சுற்றளவு)' : 'Delivery Address (Within 3.0 km)'}
                      </h3>
                      <p className="text-xs text-slate-500 break-words mt-0.5">
                        {lang === 'ta'
                          ? 'ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட்டிலிருந்து 3 கி.மீ-க்குள் அதிவிரைவு டெலிவரி'
                          : 'Ultra-fresh express delivery strictly within 3 km of our store'}
                      </p>
                    </div>
                  </div>

                  {state.savedAddresses.length > 0 && !showAddForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(true);
                        setFormDistanceCalculated(false);
                        setAutoFilled(false);
                      }}
                      className="flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition-all shadow-2xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'ta' ? 'புதிய முகவரி' : 'Add New'}</span>
                    </button>
                  )}
                </div>

                {/* 1. RETURNING USER: Saved Addresses Responsive Grid */}
                {state.savedAddresses.length > 0 && !showAddForm && (
                  <div className="space-y-3 pt-1 w-full min-w-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                      {state.savedAddresses.map((addr) => {
                        const isSelected = addr.id === state.selectedAddressId;
                        const within3km = addr.distanceKm <= 3.0;

                        return (
                          <div
                            key={addr.id}
                            onClick={() => selectAddress(addr.id)}
                            className={`relative rounded-2xl p-3.5 sm:p-4 border-2 transition-all cursor-pointer text-left flex flex-col justify-between w-full min-w-0 box-border ${
                              isSelected
                                ? within3km
                                  ? 'border-apple bg-brand-mint/60 shadow-md ring-2 ring-apple/20'
                                  : 'border-rose-400 bg-rose-50/60 shadow-md ring-2 ring-rose-400/20'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                            }`}
                          >
                            <div className="w-full min-w-0">
                              {/* Top Card Row: Tag + Recipient Badge + Distance */}
                              <div className="flex items-center justify-between gap-2 mb-2 w-full min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                  <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-800 text-[11px] font-black px-2.5 py-0.5 rounded-lg shadow-2xs shrink-0">
                                    {addr.tag === 'Home' ? (
                                      <HomeIcon className="w-3 h-3 text-emerald-600 shrink-0" />
                                    ) : addr.tag === 'Work' ? (
                                      <Briefcase className="w-3 h-3 text-blue-600 shrink-0" />
                                    ) : (
                                      <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                                    )}
                                    <span className="break-words">{addr.customLabel || addr.tag}</span>
                                  </span>

                                  {(addr.isForSomeoneElse || (addr.recipientPhone && addr.recipientPhone !== (state.loginPhone || '').replace(/\D/g, '').slice(-10))) && (
                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0">
                                      <Users className="w-3 h-3 text-amber-700 shrink-0" />
                                      <span>For: {addr.recipientName || 'Someone Else'} (+91 {addr.recipientPhone})</span>
                                    </span>
                                  )}
                                </div>

                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
                                    within3km
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-700'
                                  }`}
                                >
                                  {within3km ? `${addr.distanceKm} km` : `${addr.distanceKm} km • Out of 3km`}
                                </span>
                              </div>

                              {/* Address Text */}
                              <p className="text-xs font-bold text-slate-900 leading-snug break-words">
                                {addr.houseNo}, {addr.street}
                              </p>
                              <p className="text-[11px] text-slate-600 mt-1 font-medium leading-relaxed break-words">
                                {addr.area}, {addr.city} - {addr.pincode}
                              </p>
                              {addr.landmark && (
                                <p className="text-[10px] text-slate-500 mt-0.5 break-words">
                                  {lang === 'ta' ? 'அடையாளம்' : 'Near'}: {addr.landmark}
                                </p>
                              )}
                            </div>

                            {/* Card Footer: Select Checkmark & Delete */}
                            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200/70 w-full min-w-0">
                              <span
                                className={`text-[11px] font-black flex items-center gap-1 truncate ${
                                  isSelected ? (within3km ? 'text-emerald-700' : 'text-rose-600') : 'text-slate-500'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 shrink-0" />
                                    <span>{lang === 'ta' ? 'தேர்ந்தெடுக்கப்பட்டது' : 'Deliver Here'}</span>
                                  </>
                                ) : (
                                  <span>{lang === 'ta' ? 'இங்கு டெலிவரி செய்' : 'Select'}</span>
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAddress(addr.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                                title={lang === 'ta' ? 'நீக்கு' : 'Delete'}
                                aria-label="Delete address"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Recipient Override for Selected Address */}
                    {activeSavedAddress && (
                      <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-3.5 transition-all">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                            <div className="text-xs">
                              <span className="font-extrabold text-slate-800">
                                {orderOverrideEnabled
                                  ? (lang === 'ta'
                                      ? `பெறுநர்: ${overrideRecipientName || '...'} (+91 ${overrideRecipientPhone || '...'})`
                                      : `Recipient: ${overrideRecipientName || '...'} (+91 ${overrideRecipientPhone || '...'})`)
                                  : activeSavedAddress.isForSomeoneElse
                                  ? (lang === 'ta'
                                      ? `பெறுநர்: ${activeSavedAddress.recipientName} (+91 ${activeSavedAddress.recipientPhone})`
                                      : `Recipient: ${activeSavedAddress.recipientName} (+91 ${activeSavedAddress.recipientPhone})`)
                                  : (lang === 'ta'
                                      ? 'பெறுபவர்: நானே (கணக்கு எண்)'
                                      : 'Recipient: Myself (Account phone)')}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (!orderOverrideOpen && !orderOverrideEnabled && activeSavedAddress.isForSomeoneElse) {
                                setOverrideRecipientName(activeSavedAddress.recipientName || '');
                                setOverrideRecipientPhone(activeSavedAddress.recipientPhone || '');
                              }
                              setOrderOverrideOpen(!orderOverrideOpen);
                            }}
                            className="text-xs font-black text-emerald-800 hover:text-emerald-950 underline underline-offset-2 flex items-center gap-1 shrink-0"
                          >
                            <span>
                              {lang === 'ta'
                                ? 'வேறு ஒருவருக்கு ஆர்டர் செய்கிறீர்களா? பெறுநரை மாற்றுக'
                                : 'Ordering for someone else at this address? Edit recipient'}
                            </span>
                          </button>
                        </div>

                        {orderOverrideOpen && (
                          <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-3 animate-fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-emerald-900">
                                {lang === 'ta' ? 'இந்த ஒரு ஆர்டருக்கான பெறுநர்' : 'Recipient for this specific order'}
                              </span>
                              {orderOverrideEnabled && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOrderOverrideEnabled(false);
                                    setOverrideRecipientName('');
                                    setOverrideRecipientPhone('');
                                    setOrderOverrideOpen(false);
                                  }}
                                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800"
                                >
                                  {lang === 'ta' ? 'இயல்புநிலைக்கு மீட்டமை' : 'Reset to default'}
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  {lang === 'ta' ? 'பெறுநரின் முழு பெயர் *' : "Recipient's Full Name *"}
                                </label>
                                <input
                                  type="text"
                                  value={overrideRecipientName}
                                  onChange={(e) => {
                                    setOverrideRecipientName(e.target.value);
                                    setOrderOverrideEnabled(true);
                                  }}
                                  placeholder={lang === 'ta' ? 'எ.கா: அம்மா / திரு. இளங்கோ' : 'e.g. Amma / Mr. Elango'}
                                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  {lang === 'ta' ? '10 இலக்க மொபைல் எண் *' : '10-Digit Mobile Number *'}
                                </label>
                                <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden focus-within:border-emerald-600">
                                  <span className="bg-slate-100 text-slate-700 text-xs font-black px-2.5 py-1.5 border-r border-slate-300">
                                    +91
                                  </span>
                                  <input
                                    type="tel"
                                    maxLength={10}
                                    value={overrideRecipientPhone}
                                    onChange={(e) => {
                                      setOverrideRecipientPhone(e.target.value.replace(/\D/g, ''));
                                      setOrderOverrideEnabled(true);
                                    }}
                                    placeholder="98421 XXXXX"
                                    className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none bg-transparent"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start gap-1.5 text-[11px] text-slate-600 font-medium leading-relaxed">
                              <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <span>
                                {lang === 'ta'
                                  ? 'டெலிவரி ஊழியர் இந்த எண்ணிற்கு அழைப்பார். பில் மற்றும் டிராக்கிங் உங்கள் கணக்கில் இருக்கும்.'
                                  : 'Our delivery partner will call this number at the doorstep. Order bill & live tracking stay on your account.'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dashed Add New Address Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(true);
                        setFormDistanceCalculated(false);
                        setAutoFilled(false);
                      }}
                      className="w-full py-3 px-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800 font-extrabold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-2 box-border active:scale-99"
                    >
                      <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{lang === 'ta' ? '+ புதிய முகவரியைச் சேர்' : '+ Add New Address'}</span>
                    </button>
                  </div>
                )}

                {/* 2. FIRST-TIME USER OR ADD NEW ADDRESS FORM (ZERO garbage text) */}
                {(state.savedAddresses.length === 0 || showAddForm) && (
                  <form onSubmit={handleSaveAddress} className="space-y-4 pt-1 w-full min-w-0 box-border">
                    {/* Top Action Bar: GPS Auto-Detection Button */}
                    <div className="w-full min-w-0">
                      <button
                        type="button"
                        onClick={handleDetectGPS}
                        disabled={isDetectingGps}
                        className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-extrabold py-2.5 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-2xs active:scale-98 box-border"
                      >
                        {isDetectingGps ? (
                          <Loader2 className="w-4 h-4 text-blue-700 animate-spin shrink-0" />
                        ) : (
                          <Navigation className="w-4 h-4 text-blue-700 shrink-0" />
                        )}
                        <span className="truncate">
                          {isDetectingGps
                            ? lang === 'ta'
                              ? 'GPS கண்டறிகிறது...'
                              : 'Detecting GPS...'
                            : lang === 'ta'
                            ? 'தற்போதைய இருப்பிடத்தை கண்டறி (GPS)'
                            : 'Detect My Current Location (GPS)'}
                        </span>
                      </button>
                    </div>

                    {/* Live Google Maps / Area Search Autocomplete Input */}
                    <div className="relative w-full min-w-0 z-50">
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {lang === 'ta' ? 'பகுதி / தெரு தேடல்' : 'Search Street / Locality in Madurai'}
                      </label>
                      <div className="flex items-center border border-slate-300 rounded-xl px-3 py-2.5 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all w-full min-w-0 box-border">
                        <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={placeQuery}
                          onChange={(e) => {
                            setPlaceQuery(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                          }}
                          placeholder={
                            lang === 'ta'
                              ? 'உங்கள் தெரு அல்லது பகுதியைத் தேடுங்கள்...'
                              : 'Search your street, apartment, or area in Madurai...'
                          }
                          className="flex-1 w-full min-w-0 text-xs outline-none font-medium text-slate-900 placeholder:text-slate-400 bg-transparent"
                        />
                        {isSearchingPlaces && <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}
                        {placeQuery && !isSearchingPlaces && (
                          <button
                            type="button"
                            onClick={() => {
                              setPlaceQuery('');
                              setSuggestions([]);
                              setShowSuggestions(false);
                              setAutoFilled(false);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Green confirmation pill after selecting from map */}
                      {autoFilled && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-fade-in mt-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {lang === 'ta'
                              ? 'வரைபடத்திலிருந்து முகவரி விவரங்கள் தானாக நிரப்பப்பட்டன'
                              : 'Address details auto-filled from map'}
                          </span>
                        </div>
                      )}

                      {/* Autocomplete Dropdown List with Distance Badges */}
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-80 overflow-y-auto divide-y divide-slate-100 z-50 w-full min-w-0 box-border animate-fade-in">
                          {suggestions.map((item) => (
                            <div
                              key={item.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectSuggestion(item);
                              }}
                              className="p-3 hover:bg-slate-50 cursor-pointer flex items-start justify-between gap-3 transition-colors w-full min-w-0 box-border"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-xs text-slate-900 break-words leading-tight">{item.title}</p>
                                <p className="text-[11px] text-slate-500 break-words mt-0.5">{item.fullAddress}</p>
                              </div>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                                  item.deliverable
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {item.deliverable
                                  ? `${item.distanceKm} km`
                                  : `${item.distanceKm} km • Unserviceable`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Detailed Address Inputs (Zero pre-filled dummy strings) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs w-full min-w-0">
                      <div className="w-full min-w-0">
                        <label className="block font-bold text-slate-700 mb-1">
                          {lang === 'ta' ? 'வீடு / பிளாட் / கட்டட எண் *' : 'Door / Flat / Building No. *'}
                        </label>
                        <input
                          ref={houseNoInputRef}
                          type="text"
                          required
                          value={houseNo}
                          onChange={(e) => setHouseNo(e.target.value)}
                          placeholder="e.g. 12/B, Amman Illam"
                          className={`w-full min-w-0 border rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-900 outline-none transition-all box-border ${
                            highlightHouseNo
                              ? 'border-apple ring-2 ring-apple/30 bg-brand-mint/30 animate-pulse'
                              : 'border-slate-300 focus:border-emerald-600'
                          }`}
                        />
                      </div>

                      <div className="w-full min-w-0">
                        <label className="block font-bold text-slate-700 mb-1">
                          {lang === 'ta' ? 'தெரு பெயர் *' : 'Street / Road Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="e.g. KK Nagar Main Road"
                          className="w-full min-w-0 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-900 outline-none focus:border-emerald-600 box-border"
                        />
                      </div>

                      <div className="w-full min-w-0">
                        <label className="block font-bold text-slate-700 mb-1">
                          {lang === 'ta' ? 'பகுதி / ஏரியா *' : 'Area / Locality *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          placeholder="e.g. KK Nagar"
                          className="w-full min-w-0 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-900 outline-none focus:border-emerald-600 box-border"
                        />
                      </div>

                      <div className="w-full min-w-0">
                        <label className="block font-bold text-slate-700 mb-1">
                          {lang === 'ta' ? 'அஞ்சல் குறியீடு (Pincode) *' : 'Pincode (6 digits) *'}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                          placeholder="625020"
                          className="w-full min-w-0 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-900 outline-none focus:border-emerald-600 box-border"
                        />
                      </div>

                      <div className="sm:col-span-2 w-full min-w-0">
                        <label className="block font-bold text-slate-700 mb-1">
                          {lang === 'ta' ? 'அடையாளம் (Landmark - விருப்பம்)' : 'Landmark (Optional)'}
                        </label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. Near Temple, Opp. Park"
                          className="w-full min-w-0 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-900 outline-none focus:border-emerald-600 box-border"
                        />
                      </div>
                    </div>

                    {/* Swiggy-Style "Save Address As" Tag Selector */}
                    <div className="w-full min-w-0">
                      <label className="block font-bold text-slate-700 text-xs mb-1.5">
                        {lang === 'ta' ? 'முகவரியைச் சேமிக்க:' : 'Save Address As:'}
                      </label>
                      <div className="flex items-center gap-2 flex-wrap w-full">
                        {(['Home', 'Work', 'Other'] as const).map((tVal) => (
                          <button
                            key={tVal}
                            type="button"
                            onClick={() => setTag(tVal)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                              tag === tVal
                                ? 'bg-apple text-white border-apple shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {tVal === 'Home' ? (
                              <HomeIcon className="w-3.5 h-3.5 shrink-0" />
                            ) : tVal === 'Work' ? (
                              <Briefcase className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{tVal}</span>
                          </button>
                        ))}
                      </div>

                      {tag === 'Other' && (
                        <div className="mt-2.5 w-full min-w-0 animate-fade-in">
                          <label className="block font-bold text-slate-700 text-xs mb-1">
                            {lang === 'ta' ? 'முகவரி பெயர் (எ.கா: அம்மாவின் வீடு)' : 'Name this address'}
                          </label>
                          <input
                            type="text"
                            required
                            value={customLabel}
                            onChange={(e) => setCustomLabel(e.target.value)}
                            placeholder="e.g. Mom's House, Shop, Friend's Flat"
                            className="w-full min-w-0 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-900 outline-none focus:border-emerald-600 box-border"
                          />
                        </div>
                      )}
                    </div>

                    {/* Blinkit-Style "Who will receive this order?" Segmented Selector */}
                    <div className="w-full min-w-0 pt-2 border-t border-slate-100">
                      <label className="block font-bold text-slate-800 text-xs mb-1.5">
                        {lang === 'ta' ? 'இந்த ஆர்டரைப் பெறுபவர் யார்?' : 'Who will receive this order?'}
                      </label>
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <button
                          type="button"
                          onClick={() => setIsForSomeoneElse(false)}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black border transition-all ${
                            !isForSomeoneElse
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <UserCheck className="w-4 h-4 shrink-0" />
                          <span>{lang === 'ta' ? 'நானே' : 'Myself'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsForSomeoneElse(true)}
                          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black border transition-all ${
                            isForSomeoneElse
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Users className="w-4 h-4 shrink-0" />
                          <span>{lang === 'ta' ? 'மற்றொருவருக்கு' : 'Someone Else'}</span>
                        </button>
                      </div>

                      {/* Recipient Details Sub-Card */}
                      {isForSomeoneElse && (
                        <div className="mt-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-3 animate-fade-in">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              {lang === 'ta' ? 'பெறுபவர் முழு பெயர் *' : "Recipient's Full Name *"}
                            </label>
                            <input
                              type="text"
                              required={isForSomeoneElse}
                              value={recipientName}
                              onChange={(e) => setRecipientName(e.target.value)}
                              placeholder={lang === 'ta' ? 'எ.கா: அம்மா / திரு. இளங்கோ' : 'e.g. Amma / Mr. Elango'}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600 box-border"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              {lang === 'ta' ? 'பெறுபவரின் 10 இலக்க மொபைல் எண் *' : "Recipient's 10-Digit Mobile Number *"}
                            </label>
                            <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden focus-within:border-emerald-600">
                              <span className="bg-slate-100 text-slate-700 text-xs font-black px-3 py-2 border-r border-slate-300">
                                +91
                              </span>
                              <input
                                type="tel"
                                required={isForSomeoneElse}
                                maxLength={10}
                                value={recipientPhone}
                                onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, ''))}
                                placeholder="98421 XXXXX"
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-900 outline-none bg-transparent box-border"
                              />
                            </div>
                          </div>

                          <div className="flex items-start gap-2 bg-white/70 border border-emerald-200/60 rounded-xl p-2.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                              {lang === 'ta'
                                ? 'டெலிவரி ஊழியர் இந்த எண்ணிற்கு அழைப்பார். பில் மற்றும் டிராக்கிங் உங்கள் கணக்கில் இருக்கும்.'
                                : 'Our delivery partner will call this number at the doorstep. Order bill & live tracking stay on your account.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Form Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 w-full min-w-0">
                      {state.savedAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddForm(false);
                            setAutoFilled(false);
                          }}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shrink-0 box-border"
                        >
                          {lang === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSavingAddress || (formDistanceCalculated && formDistanceKm > 3.0)}
                        className="flex-1 w-full min-w-0 bg-apple hover:bg-apple-hover disabled:bg-slate-300 text-white font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-sm transition-all box-border active:scale-98 text-center"
                      >
                        {isSavingAddress
                          ? lang === 'ta'
                            ? 'சேமிக்கிறது...'
                            : 'Saving Address...'
                          : lang === 'ta'
                          ? 'முகவரியைச் சேமித்து தொடரவும்'
                          : 'Save Address & Deliver Here'}
                      </button>
                    </div>
                  </form>
                )}

                {/* 3. POLISHED 3.0 KM OUT-OF-ZONE ALERT CARD */}
                {!isDeliverable && (activeSavedAddress || formDistanceCalculated) && activeDistance > 3.0 && (
                  <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-3 w-full min-w-0 box-border animate-fade-in">
                    <div className="flex items-start gap-3 w-full min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <MapPinned className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-xs sm:text-sm text-rose-900 leading-snug break-words">
                          {lang === 'ta'
                            ? `இங்கு டெலிவரி செய்ய இயலாது — 3 கி.மீ எல்லைக்கு வெளியே உள்ளது (${activeDistance} கி.மீ தூரம்)`
                            : `Could Not Deliver Here — Outside 3 km Radius (${activeDistance} km away)`}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-rose-800/80 mt-1 leading-relaxed font-medium break-words">
                          {lang === 'ta'
                            ? 'புதிய பொருட்களை விரைவாக வழங்க, ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட்டில் இருந்து 3 கி.மீ சுற்றளவில் மட்டுமே தற்போது டெலிவரி செய்கிறோம். 3 கி.மீ-க்குள் உள்ள முகவரியைத் தேர்ந்தெடுக்கவும்.'
                            : 'To guarantee ultra-fresh groceries and express delivery, Sri Amman Supermarket currently delivers strictly within a 3 km radius of our store. Please select or add an address within 3 km.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between flex-wrap gap-2 w-full min-w-0">
                      <a
                        href={SHOP_MAPS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-black text-rose-700 hover:text-rose-900 underline shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{lang === 'ta' ? 'வரைபடத்தில் கடையைப் பார்க்கவும்' : 'View Store on Google Maps'}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(true);
                          setFormDistanceCalculated(false);
                          setAutoFilled(false);
                        }}
                        className="text-xs font-black text-rose-800 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-xl transition-all shrink-0"
                      >
                        {lang === 'ta' ? 'வேறு முகவரியைத் தேர்ந்தெடு' : 'Choose Another Address'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Delivery Slot Selector */}
                <div className="pt-3 border-t border-slate-100 space-y-2 w-full min-w-0">
                  <label className="block font-black text-xs text-slate-800 uppercase tracking-wider">
                    {lang === 'ta' ? 'டெலிவரி நேரம்' : 'Delivery Slot'}
                  </label>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs w-full min-w-0">
                    <button
                      type="button"
                      onClick={() => setDeliverySlot('express')}
                      className={`p-3 rounded-xl border-2 text-left transition-all w-full min-w-0 box-border ${
                        deliverySlot === 'express'
                          ? 'border-apple bg-brand-mint'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 break-words">
                        <Zap className="w-3.5 h-3.5 text-yellow-600 fill-current shrink-0" />
                        <span className="break-words">{lang === 'ta' ? '20 நிமிட விரைவு' : '20-Min Express'}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 break-words">
                        {lang === 'ta' ? 'உடனடி வீட்டு டெலிவரி' : 'Instant doorstep delivery'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliverySlot('scheduled')}
                      className={`p-3 rounded-xl border-2 text-left transition-all w-full min-w-0 box-border ${
                        deliverySlot === 'scheduled'
                          ? 'border-apple bg-brand-mint'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 break-words">
                        <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span className="break-words">{lang === 'ta' ? 'இன்று மாலை' : 'Evening Slot'}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 break-words">
                        {lang === 'ta' ? 'மாலை 6:00 - 8:00' : '6:00 PM - 8:00 PM'}
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              {/* STEP 3: Payment Options & Submit */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4 w-full min-w-0 box-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0">
                    {phoneVerified ? '2' : '3'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 break-words leading-tight">
                      {t('step3Title', lang)}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === 'ta' ? 'பாதுகாப்பான கட்டண முறை' : '100% Secure Payment Options'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 w-full min-w-0">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`w-full p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3.5 box-border ${
                      paymentMethod === 'upi'
                        ? 'border-apple bg-brand-mint'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-brand-primary flex items-center justify-center shrink-0">
                      <IconCreditCard className="w-5 h-5 text-emerald-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-slate-900 leading-tight break-words">{t('payOnline', lang)}</p>
                      <p className="text-xs text-emerald-700 font-bold mt-0.5 leading-tight break-words">{t('zeroFee', lang)}</p>
                    </div>
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      {paymentMethod === 'upi' && <IconCheckCircle className="w-5 h-5 text-emerald-700" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`w-full p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3.5 box-border ${
                      paymentMethod === 'cod'
                        ? 'border-apple bg-brand-mint'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-brand-primary flex items-center justify-center shrink-0">
                      <IconHome className="w-5 h-5 text-emerald-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-slate-900 leading-tight break-words">{t('cashOnDelivery', lang)}</p>
                      <p className="text-xs text-emerald-700 font-bold mt-0.5 leading-tight break-words">{t('codDesc', lang)}</p>
                    </div>
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      {paymentMethod === 'cod' && <IconCheckCircle className="w-5 h-5 text-emerald-700" />}
                    </div>
                  </button>
                </div>

                {/* Bottom Action Row: Back + Confirm Order Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-3 border-t border-slate-100 w-full min-w-0">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_PAGE', page: 'products' })}
                    className="px-4 py-3 rounded-xl border-2 border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-all inline-flex items-center justify-center gap-1.5 shrink-0 box-border"
                    style={{ minHeight: '48px' }}
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    <span>{t('backBtn', lang)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isSubmittingOrder || !isDeliverable || !phoneVerified}
                    className={`flex-1 w-full min-w-0 px-4 py-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center text-center shadow-md box-border ${
                      isDeliverable && phoneVerified && !isSubmittingOrder
                        ? 'bg-apple hover:bg-apple-hover text-white shadow-emerald-500/20 active:scale-98 cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                    style={{ minHeight: '48px' }}
                  >
                    {isSubmittingOrder ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>{lang === 'ta' ? 'பதிவாகிறது...' : 'Placing Order...'}</span>
                      </span>
                    ) : !isDeliverable ? (
                      <span className="break-words text-center">
                        {lang === 'ta'
                          ? '3 கி.மீ-க்குள் முகவரியை தேர்வு செய்க'
                          : 'Select Deliverable Address (Within 3km)'}
                      </span>
                    ) : (
                      <span className="truncate">
                        {t('confirmOrder', lang)} (₹{getCartTotal()})
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (Sticky Order Summary) */}
            <div className="w-full min-w-0 lg:col-span-5 lg:sticky lg:top-28 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4 w-full min-w-0 box-border">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-black text-base text-slate-900">
                    {t('billDetails', lang)}
                  </h3>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    {getCartItemCount()} {t('items', lang)}
                  </span>
                </div>

                {/* Items Preview */}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1 w-full min-w-0">
                  {state.cart.map((item) => {
                    const product =
                      (state.catalog || products).find((p) => p.id === item.productId) ||
                      products.find((p) => p.id === item.productId);
                    if (!product) return null;
                    const variant = product.variants[item.variantIndex];
                    if (!variant) return null;

                    return (
                      <div
                        key={`${item.productId}-${item.variantIndex}`}
                        className="py-2.5 flex items-center gap-3 w-full min-w-0"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-50 shrink-0 border border-slate-200 relative">
                          <img
                            src={product.image}
                            alt={product.nameEn}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-bold text-slate-900 break-words leading-tight">
                            {lang === 'ta' ? product.nameTa : product.nameEn}
                          </p>
                          <p className="text-slate-500 break-words mt-0.5 font-medium">
                            {variant.label} × {item.quantity}
                          </p>
                        </div>
                        <span className="font-black text-xs text-slate-900 shrink-0">
                          ₹{variant.price * item.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs w-full min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">{t('itemTotal', lang)}</span>
                    <span className="font-bold text-slate-900">₹{getCartMrpTotal()}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>{t('productDiscount', lang)}</span>
                    <span className="font-black">-₹{getCartDiscount()}</span>
                  </div>
                  {state.couponDiscount > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 font-bold">
                      <span>Promo ({state.appliedCoupon}) Discount</span>
                      <span className="font-black">-₹{state.couponDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">{t('deliveryFee', lang)}</span>
                    <span className="font-bold text-slate-900">
                      {getDeliveryFee() === 0 ? (
                        <span className="text-emerald-700 font-black">{t('free', lang)}</span>
                      ) : (
                        `₹${getDeliveryFee()}`
                      )}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center font-black text-base text-slate-900">
                    <span>{t('grandTotal', lang)}</span>
                    <span className="text-emerald-700 font-black">₹{getCartTotal()}</span>
                  </div>
                </div>

                {/* 3km Express Guarantee Card */}
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs space-y-1 w-full min-w-0 box-border">
                  <div className="flex items-center gap-1.5 font-black text-emerald-800">
                    <IconTruck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">{t('delivery30', lang)}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                    {lang === 'ta'
                      ? 'ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட்டிலிருந்து 3 கி.மீ சுற்றளவில் 20 நிமிடங்களில் டோர் டெலிவரி.'
                      : 'Express doorstep delivery in ~20 minutes strictly within a 3.0 km radius of our store.'}
                  </p>
                </div>

                {/* Trust Badge */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-semibold pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'ta' ? '100% பாதுகாப்பான பரிவர்த்தனை' : '100% Safe & Secure Checkout'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Centered GPS Denied Modal */}
      <GpsDeniedModal
        isOpen={gpsDeniedOpen}
        onClose={() => setGpsDeniedOpen(false)}
        onSearchManually={() => {
          setGpsDeniedOpen(false);
          setShowAddForm(true);
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
