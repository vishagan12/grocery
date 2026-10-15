'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { t } from '@/data/translations';
import { products } from '@/data/products';
import {
  IconCart,
  IconCheck,
  IconCheckCircle,
  IconMapPin,
  IconCreditCard,
  IconHome,
  IconTruck,
  IconClock,
  IconShield,
} from '@/components/Icons';
import { Zap, Clock, ArrowLeft, ArrowRight } from 'lucide-react';

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
  } = useStore();
  const lang = state.lang;
  // Direct Payment Mode: Every order directly shows payment options, fetching saved address & profile data automatically
  const [step, setStep] = useState(3);

  // User Profile & Mobile Information
  const [phone, setPhone] = useState(state.loginPhone || '+91-6379398981');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [phoneVerified, setPhoneVerified] = useState(true);

  // Address & Slot state
  const [savedProfileAddress, setSavedProfileAddress] = useState<any | null>(null);
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState(state.location?.area || 'Madurai');
  const [city, setCity] = useState('Madurai');
  const [pincode, setPincode] = useState(state.location?.pincode || '625020');
  const [landmark, setLandmark] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('express');

  useEffect(() => {
    if (state.loginPhone) {
      setPhone(state.loginPhone);
    }

    try {
      const stored = localStorage.getItem('sriAmmaAddresses');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.length > 0) {
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          setSavedProfileAddress(defaultAddr);
          setHouseNo(defaultAddr.house || '');
          setStreet(defaultAddr.street || '');
          setArea(defaultAddr.city || state.location?.area || 'Madurai');
          setCity(defaultAddr.city || 'Madurai');
          setPincode(defaultAddr.pincode || '625020');
          setLandmark(defaultAddr.landmark || '');
        } else {
          setSavedProfileAddress(null);
        }
      } else {
        setSavedProfileAddress(null);
      }
    } catch {
      setSavedProfileAddress(null);
    }
  }, [state.loginPhone, state.location]);

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [addressDetected, setAddressDetected] = useState(false);

  const handleAutoDetect = () => {
    setAddressDetected(true);
    setHouseNo('12/B, Sri Meenakshi Residency');
    setStreet(`${state.location.area} Main Road`);
    setArea(state.location.area || 'Madurai');
    setCity('Madurai');
    setPincode(state.location.pincode || '625020');
    setLandmark(state.location.landmark || 'Near Temple');
  };

  const handleSendOtp = () => {
    if (phone.length === 10) {
      setOtpSent(true);
      setTimeout(() => {
        setOtp(['4', '8', '2', '9']);
        setTimeout(() => {
          setPhoneVerified(true);
          dispatch({ type: 'SET_LOGIN', phone, loggedIn: true });
        }, 500);
      }, 700);
    }
  };

  const handlePlaceOrder = () => {
    if (!savedProfileAddress && (!houseNo.trim() || !street.trim() || !pincode.trim())) {
      showToast(lang === 'ta' ? 'தயவுசெய்து முழு முகவரியை உள்ளிடவும்' : 'Please complete your delivery address');
      return;
    }

    const orderId = `#SAS-${1000 + Math.floor(Math.random() * 9000)}`;
    const fullAddressString = savedProfileAddress
      ? `${savedProfileAddress.house}, ${savedProfileAddress.street}, ${savedProfileAddress.city} - ${savedProfileAddress.pincode}`
      : `${houseNo}, ${street}, ${area}, ${city} - ${pincode}${landmark ? `, Near ${landmark}` : ''}`;

    const order = {
      id: orderId,
      items: [...state.cart],
      subtotal: getCartMrpTotal(),
      discount: getCartDiscount(),
      deliveryFee: getDeliveryFee(),
      total: getCartTotal(),
      paymentMethod,
      address: fullAddressString,
      phone,
      status: 0,
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_ORDER', order });
    dispatch({ type: 'CLEAR_CART' });
    dispatch({ type: 'SET_PAGE', page: 'orders' });
    showToast(t('orderPlacedToast', lang));
  };

  if (getCartItemCount() === 0 && step < 3) {
    return (
      <section className="py-20 text-center min-h-screen bg-[#FBF8F3] flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-[#F5EFE6] border border-[#EAE2D5] flex items-center justify-center text-brand-primary mb-4 shadow-xs">
          <IconCart className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-brand-slate mb-1">{t('cartEmpty', lang)}</h2>
        <p className="text-sm text-brand-slate/60 mb-5">{t('cartEmptyDesc', lang)}</p>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_PAGE', page: 'products' })}
          className="bg-brand-primary hover:bg-brand-highlight text-white px-8 py-3.5 rounded-xl font-bold touch-target shadow-md transition-all text-sm"
        >
          {t('shopNow', lang)}
        </button>
      </section>
    );
  }

  return (
    <section className="py-6 md:py-10 bg-[#FBF8F3] min-h-screen w-full max-w-full overflow-x-hidden touch-pan-y">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 w-full">
        <div className="mb-6">
          <h1 className="text-xl md:text-3xl font-extrabold text-brand-slate tracking-tight">
            {t('checkout', lang)}
          </h1>
          <p className="text-xs md:text-sm text-brand-slate/60 mt-0.5 font-medium">
            {lang === 'ta'
              ? 'மதுரை விரைவு ஹோம் டெலிவரி & பாதுகாப்பான ஆர்டர் உறுதிப்படுத்தல்'
              : 'Madurai Express 30-Minute Doorstep Delivery & Verified Order Processing'}
          </p>
        </div>

        {/* 2-Column Responsive Checkout Layout */}
        <div className="grid lg:grid-cols-12 gap-6 md:gap-8 items-start w-full">
          {/* Left Column (Steps 1, 2, 3) */}
          <div className="lg:col-span-7 space-y-5 w-full">

            {/* STEP 1: Phone Verification */}
            {step === 1 && (
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE2D5] p-6 shadow-sm animate-fade-in space-y-5">
                <h3 className="text-lg md:text-xl font-extrabold text-brand-slate">
                  {t('step1Title', lang)}
                </h3>

                {phoneVerified ? (
                  <div className="text-center py-6 bg-[#FDFBF7] rounded-xl border border-emerald-100">
                    <div className="inline-flex items-center gap-2 bg-brand-mint border border-emerald-200 text-brand-primary px-4 py-2 rounded-xl font-bold text-sm mb-3">
                      <IconCheckCircle className="w-4 h-4 text-brand-primary" />
                      <span>{t('phoneVerified', lang)}</span>
                    </div>
                    <p className="text-brand-slate font-extrabold text-base">+91 {phone}</p>
                    <p className="text-xs text-brand-slate/50 mt-1">
                      {lang === 'ta'
                        ? 'ஆர்டர் மற்றும் டெலிவரி நிலை WhatsApp வழியாக அனுப்பப்படும்.'
                        : 'Order confirmation and rider tracking updates will be sent via WhatsApp.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="mt-6 w-full max-w-sm bg-brand-primary hover:bg-brand-highlight text-white py-3.5 rounded-xl font-bold text-sm touch-target transition-all shadow-md shadow-brand-primary/20 inline-flex items-center justify-center gap-1.5"
                    >
                      <span>{t('continueBtn', lang)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-slate/70">
                      {t('enterMobile', lang)}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-brand-slate/70 bg-[#F5EFE6] px-3.5 py-3 rounded-xl border border-[#EAE2D5]">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="98765 43210"
                        className="flex-1 border-2 border-[#EAE2D5] bg-[#FDFBF7] rounded-xl px-4 py-3 text-base font-semibold outline-none focus:border-brand-primary focus:bg-white transition-all text-brand-slate"
                        disabled={otpSent}
                      />
                    </div>

                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={phone.length !== 10}
                        className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all touch-target ${
                          phone.length === 10
                            ? 'bg-brand-primary hover:bg-brand-highlight text-white shadow-md'
                            : 'bg-[#EAE2D5] text-[#8A7B6D] cursor-not-allowed'
                        }`}
                      >
                        {t('sendOtp', lang)}
                      </button>
                    ) : (
                      <div className="mt-4 p-4 bg-[#F5EFE6] rounded-xl border border-[#EAE2D5] space-y-3">
                        <p className="text-xs font-bold text-brand-slate text-center">
                          {t('enterOtpTitle', lang)} (+91 {phone})
                        </p>
                        <div className="flex gap-2.5 justify-center">
                          {otp.map((digit, i) => (
                            <div
                              key={i}
                              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all ${
                                digit
                                  ? 'border-brand-primary bg-brand-mint text-brand-primary'
                                  : 'border-[#EAE2D5] bg-white text-brand-slate'
                              }`}
                            >
                              {digit || '•'}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-brand-slate/60 justify-center pt-2">
                          <div className="w-3.5 h-3.5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                          <span>{t('verifying', lang)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Address & Slot */}
            {step === 2 && (
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE2D5] p-6 shadow-sm animate-fade-in space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg md:text-xl font-extrabold text-brand-slate">
                    {t('step2Title', lang)}
                  </h3>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_LOCATION_MODAL', open: true })}
                    className="text-xs font-bold text-brand-primary hover:underline"
                  >
                    {t('changeLocation', lang)}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAutoDetect}
                  className="w-full bg-[#EBF3FB] hover:bg-[#DCE9F8] text-[#1E5B99] font-bold py-3 rounded-xl transition-all border border-[#C5DCF4] touch-target text-xs md:text-sm flex items-center justify-center gap-2 shadow-xs"
                >
                  <IconMapPin className="w-4 h-4 text-[#1E5B99]" />
                  <span>{t('autoDetect', lang)} ({state.location.area})</span>
                </button>

                {addressDetected && (
                  <div className="bg-brand-mint rounded-xl p-3 text-xs font-bold text-brand-primary border border-emerald-200 flex items-center gap-2">
                    <IconCheckCircle className="w-4 h-4 text-brand-primary flex-shrink-0" />
                    <span>{t('addressVerified', lang)}</span>
                  </div>
                )}

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-brand-slate mb-1">
                      {t('houseNo', lang)}
                    </label>
                    <input
                      type="text"
                      value={houseNo}
                      onChange={(e) => setHouseNo(e.target.value)}
                      placeholder="e.g. 12/B, Amman Illam, 2nd Floor"
                      className="w-full border-2 border-[#EAE2D5] bg-[#FDFBF7] rounded-xl px-4 py-3 outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-semibold text-brand-slate"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-slate mb-1">
                      {t('street', lang)}
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. 80 Feet Road, KK Nagar, Madurai - 625020"
                      className="w-full border-2 border-[#EAE2D5] bg-[#FDFBF7] rounded-xl px-4 py-3 outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-semibold text-brand-slate"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-slate mb-1">
                      {t('landmark', lang)}
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Opposite Bus Stop / Near Temple"
                      className="w-full border-2 border-[#EAE2D5] bg-[#FDFBF7] rounded-xl px-4 py-3 outline-none focus:border-brand-primary focus:bg-white transition-all text-sm font-semibold text-brand-slate"
                    />
                  </div>
                </div>

                {/* Delivery Slot Choice */}
                <div className="pt-3 border-t border-[#EAE2D5]">
                  <p className="font-bold text-xs uppercase tracking-wider text-brand-slate/70 mb-2.5">
                    {t('deliverySlot', lang)}
                  </p>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {[
                      { key: 'express', label: t('slotExpress', lang), sub: '25–30 Mins', isExpress: true },
                      { key: 'evening', label: t('slotEvening', lang), sub: '6–8 PM', isExpress: false },
                      { key: 'morning', label: t('slotMorning', lang), sub: 'Tomorrow 8 AM', isExpress: false },
                    ].map((slot) => (
                      <button
                        key={slot.key}
                        type="button"
                        onClick={() => setDeliverySlot(slot.key)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          deliverySlot === slot.key
                            ? 'border-brand-primary bg-brand-mint text-brand-primary font-bold shadow-xs'
                            : 'border-[#EAE2D5] bg-white text-brand-slate/80 hover:bg-[#F5EFE6]'
                        }`}
                      >
                        <p className="text-xs leading-tight font-extrabold flex items-center gap-1.5">
                          {slot.isExpress ? (
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-brand-slate/60 flex-shrink-0" />
                          )}
                          <span>{slot.sub}</span>
                        </p>
                        <p className="text-[10px] text-brand-slate/60 mt-0.5 break-words leading-tight">{slot.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded-xl border-2 border-[#EAE2D5] font-bold text-xs text-brand-slate hover:bg-[#F5EFE6] transition-all touch-target inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t('backBtn', lang)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!houseNo || !street}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all touch-target inline-flex items-center justify-center gap-1.5 ${
                      houseNo && street
                        ? 'bg-brand-primary hover:bg-brand-highlight text-white shadow-md'
                        : 'bg-[#EAE2D5] text-[#8A7B6D] cursor-not-allowed'
                    }`}
                  >
                    <span>{t('continueBtn', lang)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Payment Method */}
            {step === 3 && (
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE2D5] p-5 sm:p-6 shadow-sm animate-fade-in space-y-4">
                {/* Saved Address Summary Card or Full Address Input Form */}
                {savedProfileAddress ? (
                  <div className="bg-[#F8F5EE] border border-[#EAE2D5] rounded-2xl p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-brand-primary flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <IconMapPin className="w-4 h-4 text-emerald-800" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-xs text-brand-slate uppercase tracking-wide">
                            {lang === 'ta' ? 'டெலிவரி முகவரி' : 'Delivering To'}
                          </span>
                          <span className="bg-emerald-100/90 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-md">
                            {lang === 'ta' ? 'சேமிக்கப்பட்ட முகவரி' : 'Saved Address'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-brand-slate mt-1.5 truncate">
                          {state.userName || 'Vishagan'} • {phone}
                        </p>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed break-words font-medium">
                          {houseNo}, {street}, {city} - {pincode}
                        </p>
                        {landmark && (
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                            {lang === 'ta' ? 'அடையாளம்' : 'Landmark'}: {landmark}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'SET_PAGE', page: 'profile' })}
                      className="text-xs font-bold text-brand-primary hover:underline shrink-0 pt-0.5"
                    >
                      {lang === 'ta' ? 'மாற்று' : 'Change'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#FDFBF7] border border-[#EAE2D5] rounded-2xl p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#EAE2D5]">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-brand-primary flex items-center justify-center shrink-0">
                        <IconMapPin className="w-4 h-4 text-emerald-800" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs sm:text-sm text-brand-slate">
                          {lang === 'ta' ? 'டெலிவரி முகவரியை உள்ளிடவும்' : 'Enter Delivery Address'}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {lang === 'ta'
                            ? 'விரைவான டெலிவரிக்கு உங்கள் முகவரி விவரங்களை அளிக்கவும்'
                            : 'Provide your address for 30-min express delivery'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-brand-slate mb-1">
                          {lang === 'ta' ? 'வீடு / பிளாட் எண்' : 'House / Flat No'} *
                        </label>
                        <input
                          type="text"
                          required
                          value={houseNo}
                          onChange={(e) => setHouseNo(e.target.value)}
                          placeholder="e.g. 12/B, Sri Amman Illam"
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-800 outline-none focus:border-[#4CB01E]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-brand-slate mb-1">
                          {lang === 'ta' ? 'தெரு பெயர்' : 'Street Name'} *
                        </label>
                        <input
                          type="text"
                          required
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="e.g. KK Nagar Main Road"
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-800 outline-none focus:border-[#4CB01E]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-brand-slate mb-1">
                          {lang === 'ta' ? 'பகுதி / ஏரியா' : 'Area'} *
                        </label>
                        <input
                          type="text"
                          required
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          placeholder="e.g. KK Nagar"
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-800 outline-none focus:border-[#4CB01E]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-brand-slate mb-1">
                          {lang === 'ta' ? 'நகரம்' : 'City'} *
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Madurai"
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-800 outline-none focus:border-[#4CB01E]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-brand-slate mb-1">
                          {lang === 'ta' ? 'அஞ்சல் குறியீடு (Pincode)' : 'Pincode'} *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                          placeholder="625020"
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-800 outline-none focus:border-[#4CB01E]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-brand-slate mb-1">
                          {lang === 'ta' ? 'அடையாளம் (Landmark)' : 'Landmark'} ({lang === 'ta' ? 'விருப்பம்' : 'Optional'})
                        </label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. Near Meenakshi Temple"
                          className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white text-slate-800 outline-none focus:border-[#4CB01E]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Options Header without instant checkout badge */}
                <div className="pt-1">
                  <h3 className="text-base md:text-lg font-extrabold text-brand-slate">
                    {t('step3Title', lang)}
                  </h3>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3.5 ${
                      paymentMethod === 'upi'
                        ? 'border-brand-primary bg-brand-mint'
                        : 'border-[#EAE2D5] hover:border-brand-primary/50 bg-[#FDFBF7]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-brand-primary flex items-center justify-center shrink-0">
                      <IconCreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-sm text-brand-slate">{t('payOnline', lang)}</p>
                      <p className="text-xs text-brand-primary font-semibold mt-0.5">{t('zeroFee', lang)}</p>
                    </div>
                    {paymentMethod === 'upi' && <IconCheckCircle className="w-5 h-5 text-brand-primary shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`w-full p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3.5 ${
                      paymentMethod === 'cod'
                        ? 'border-brand-primary bg-brand-mint'
                        : 'border-[#EAE2D5] hover:border-brand-primary/50 bg-[#FDFBF7]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <IconHome className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-sm text-brand-slate">{t('cashOnDelivery', lang)}</p>
                      <p className="text-xs text-brand-slate/60 mt-0.5">{t('codDesc', lang)}</p>
                    </div>
                    {paymentMethod === 'cod' && <IconCheckCircle className="w-5 h-5 text-brand-primary shrink-0" />}
                  </button>
                </div>

                {/* Bottom Action Row: Back Button + Confirm & Place Order in Single Line */}
                <div className="flex items-center gap-2 sm:gap-3 pt-3 border-t border-[#EAE2D5]">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-3.5 sm:px-4 py-3 rounded-xl border-2 border-[#EAE2D5] font-bold text-xs text-brand-slate hover:bg-[#F5EFE6] transition-all touch-target inline-flex items-center justify-center gap-1 shrink-0"
                    style={{ minHeight: '48px' }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('backBtn', lang)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={!paymentMethod}
                    className="flex-1 px-3 sm:px-4 py-3 rounded-xl font-black text-xs xs:text-sm bg-brand-primary hover:bg-brand-highlight text-white shadow-md shadow-brand-primary/30 transition-all touch-target whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-center text-center"
                    style={{ minHeight: '48px' }}
                  >
                    {t('confirmOrder', lang)} (₹{getCartTotal()})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Sticky Real-Time Order Summary) */}
          <div className="lg:col-span-5 sticky top-36 space-y-4">
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#EAE2D5] shadow-lg p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE2D5]">
                <h3 className="font-extrabold text-base text-brand-slate">
                  {t('billDetails', lang)}
                </h3>
                <span className="text-xs font-bold text-brand-primary bg-brand-mint px-2 py-0.5 rounded-full">
                  {getCartItemCount()} {t('items', lang)}
                </span>
              </div>

              {/* Items Preview */}
              <div className="max-h-56 overflow-y-auto divide-y divide-[#F5EFE6] pr-1">
                {state.cart.map((item) => {
                  const product = products.find((p) => p.id === item.productId);
                  if (!product) return null;
                  const variant = product.variants[item.variantIndex];
                  if (!variant) return null;

                  return (
                    <div key={`${item.productId}-${item.variantIndex}`} className="py-2.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F5EFE6] shrink-0 border border-[#EAE2D5] p-0.5">
                        <img src={product.image} alt={product.nameEn} className="w-full h-full object-cover rounded" />
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-brand-slate break-words leading-tight">
                          {lang === 'ta' ? product.nameTa : product.nameEn}
                        </p>
                        <p className="text-brand-slate/50 break-words mt-0.5">{variant.label} × {item.quantity}</p>
                      </div>
                      <span className="font-bold text-xs text-brand-slate">
                        ₹{variant.price * item.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-[#EAE2D5] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-brand-slate/70">{t('itemTotal', lang)}</span>
                  <span className="font-semibold text-brand-slate">₹{getCartMrpTotal()}</span>
                </div>
                <div className="flex justify-between text-brand-primary">
                  <span>{t('productDiscount', lang)}</span>
                  <span className="font-bold">-₹{getCartDiscount()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-slate/70">{t('deliveryFee', lang)}</span>
                  <span className="font-bold text-brand-slate">
                    {getDeliveryFee() === 0 ? <span className="text-brand-primary">{t('free', lang)}</span> : `₹${getDeliveryFee()}`}
                  </span>
                </div>
                <div className="border-t border-[#EAE2D5] pt-2 flex justify-between font-black text-base text-brand-slate">
                  <span>{t('grandTotal', lang)}</span>
                  <span className="text-brand-primary">₹{getCartTotal()}</span>
                </div>
              </div>

              {/* Delivery Guarantee Card */}
              <div className="p-3 bg-brand-mint rounded-xl border border-emerald-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-brand-primary">
                  <IconTruck className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>{t('delivery30', lang)}</span>
                </div>
                <p className="text-[11px] text-brand-slate/70 leading-relaxed">
                  {lang === 'ta'
                    ? `டெலிவரி முகவரி: ${state.location.area} (~${state.location.deliveryMins} நிமிடம்)`
                    : `Delivering directly to ${state.location.area} in ~${state.location.deliveryMins} mins.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
