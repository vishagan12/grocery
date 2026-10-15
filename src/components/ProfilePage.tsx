'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import {
  ArrowLeft,
  Wallet,
  Headphones,
  CreditCard,
  Sun,
  Sliders,
  ShoppingBag,
  Heart,
  BookOpen,
  FileText,
  MapPin,
  FileCheck,
  Gift,
  Share2,
  Info,
  Store,
  Lock,
  Bell,
  LogOut,
  ChevronRight,
  ChevronDown,
  Calendar,
  Phone,
  HeartHandshake,
  Receipt,
  Award,
} from 'lucide-react';

export default function ProfilePage() {
  const { state, dispatch, showToast } = useStore();
  const lang = state.lang;
  const [appearance, setAppearance] = useState<'Light' | 'Dark'>('Light');

  const handleAction = (label: string) => {
    showToast(label);
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    dispatch({ type: 'SET_PAGE', page: 'home' });
    showToast(lang === 'ta' ? 'வெற்றிகரமாக வெளியேறியது' : 'Logged out successfully');
  };

  return (
    <section className="py-4 sm:py-8 bg-white min-h-screen text-slate-800">
      <div className="max-w-2xl mx-auto px-4">
        {/* Top Header */}
        <div className="flex items-center justify-between py-3 mb-4">
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_PAGE', page: 'home' })}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors -ml-2"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-800" />
          </button>
          <h1 className="font-extrabold text-base sm:text-lg text-slate-900">
            {lang === 'ta' ? 'சுயவிவரம்' : 'Profile'}
          </h1>
          <div className="w-10" />
        </div>

        {/* User Info Header: Name, Phone, Birthday */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            {state.userName || 'Vishagan'}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 font-semibold mt-1.5">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{state.loginPhone || '+91-6379398981'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{state.userDob || '12 Dec 2006'}</span>
            </div>
          </div>
        </div>

        {/* 3 Quick Action Cards: Wallet Money, Support, Payments */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <button
            type="button"
            onClick={() => handleAction(lang === 'ta' ? 'அம்மன் வாலட் இருப்பு: ₹150' : 'Amman Money Balance: ₹150')}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs hover:border-[#4CB01E] transition-all text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100/90 flex items-center justify-center text-slate-800">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">
              {lang === 'ta' ? 'அம்மன் வாலட்' : 'Amman Money'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(lang === 'ta' ? '24x7 வாடிக்கையாளர் உதவி மையம்' : 'Support desk 24x7 connected')}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs hover:border-[#4CB01E] transition-all text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100/90 flex items-center justify-center text-slate-800">
              <Headphones className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">
              {lang === 'ta' ? 'உதவி மையம்' : 'Support'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleAction(lang === 'ta' ? 'UPI & கார்டு அமைப்புகள்' : 'Payment Methods & UPI')}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 shadow-2xs hover:shadow-xs hover:border-[#4CB01E] transition-all text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-100/90 flex items-center justify-center text-slate-800">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 leading-tight">
              {lang === 'ta' ? 'கட்டண முறைகள்' : 'Payments'}
            </span>
          </button>
        </div>

        {/* Appearance & Content Preferences Pills */}
        <div className="space-y-2.5 mb-7">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <Sun className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                {lang === 'ta' ? 'தோற்றம்' : 'Appearance'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700">
              <span>{appearance}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleAction(lang === 'ta' ? 'உள்ளடக்க விருப்பங்கள்' : 'Content preferences')}
            className="w-full bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <Sliders className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                {lang === 'ta' ? 'உள்ளடக்க விருப்பங்கள்' : 'Content preferences'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* SECTION 1: YOUR INFORMATION */}
        <div className="mb-7">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3 px-1">
            {lang === 'ta' ? 'உங்கள் தகவல்கள்' : 'YOUR INFORMATION'}
          </h3>
          <div className="space-y-1">
            {[
              {
                Icon: ShoppingBag,
                labelEn: 'Your orders',
                labelTa: 'உங்கள் ஆர்டர்கள்',
                action: () => dispatch({ type: 'SET_PAGE', page: 'orders' }),
              },
              {
                Icon: Heart,
                labelEn: `Your wishlist (${state.wishlist.length})`,
                labelTa: `விருப்பப்பட்டியல் (${state.wishlist.length})`,
                action: () => dispatch({ type: 'SET_PAGE', page: 'wishlist' }),
              },
              {
                Icon: BookOpen,
                labelEn: 'Bookmarked recipes',
                labelTa: 'சேமிக்கப்பட்ட சமையல் குறிப்புகள்',
                action: () => handleAction(lang === 'ta' ? 'சமையல் குறிப்புகள்' : 'Bookmarked recipes'),
              },
              {
                Icon: FileText,
                labelEn: 'Your prescriptions',
                labelTa: 'மருந்து சீட்டுகள்',
                action: () => handleAction(lang === 'ta' ? 'மருந்து சீட்டுகள்' : 'Prescriptions'),
              },
              {
                Icon: MapPin,
                labelEn: 'Address book',
                labelTa: 'முகவரி புத்தகம்',
                action: () => {
                  dispatch({ type: 'SET_LOCATION_MODAL', open: true });
                },
              },
              {
                Icon: FileCheck,
                labelEn: 'GST details',
                labelTa: 'GST விவரங்கள்',
                action: () => handleAction(lang === 'ta' ? 'GST விவரங்கள்' : 'GST details'),
              },
              {
                Icon: Gift,
                labelEn: 'E-gift cards',
                labelTa: 'பரிசு அட்டைகள்',
                action: () => handleAction(lang === 'ta' ? 'பரிசு அட்டைகள்' : 'E-gift cards'),
              },
            ].map((item, idx) => {
              const ItemIcon = item.Icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={item.action}
                  className="w-full flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      {lang === 'ta' ? item.labelTa : item.labelEn}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: ETERNAL FOUNDATION */}
        <div className="mb-7">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3 px-1">
            {lang === 'ta' ? 'அறக்கட்டளை உதவி' : 'ETERNAL FOUNDATION'}
          </h3>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleAction('Feeding India Impact')}
              className="w-full flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  Feeding India impact
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => handleAction('Donation receipt downloaded')}
              className="w-full flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  Get donation receipt
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* SECTION 3: PAYMENT AND COUPONS */}
        <div className="mb-7">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3 px-1">
            {lang === 'ta' ? 'கட்டணம் மற்றும் கூப்பன்கள்' : 'PAYMENT AND COUPONS'}
          </h3>
          <div className="space-y-1">
            {[
              { Icon: CreditCard, label: 'Payment settings' },
              { Icon: Wallet, label: 'Amman Money' },
              { Icon: CreditCard, label: 'SBI credit card' },
              { Icon: Gift, label: 'Claim Gift Card' },
              { Icon: Award, label: 'Your collected rewards' },
            ].map((item, idx) => {
              const ItemIcon = item.Icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAction(item.label)}
                  className="w-full flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: OTHER INFORMATION & LOGOUT */}
        <div className="mb-12">
          <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3 px-1">
            {lang === 'ta' ? 'இதர தகவல்கள்' : 'OTHER INFORMATION'}
          </h3>
          <div className="space-y-1">
            {[
              { Icon: Share2, label: 'Share the app', action: () => handleAction('App link copied!') },
              { Icon: Info, label: 'About us', action: () => handleAction('Sri Amman Supermarket, Madurai') },
              { Icon: Store, label: 'Sell on Sri Amman', action: () => handleAction('Partner registration') },
              { Icon: Lock, label: 'Account privacy', action: () => handleAction('Privacy & terms') },
              { Icon: Bell, label: 'Notification preferences', action: () => handleAction('Notifications enabled') },
            ].map((item, idx) => {
              const ItemIcon = item.Icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={item.action}
                  className="w-full flex items-center justify-between py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}

            {/* Log out Row */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-between py-3 px-2 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors text-left mt-2"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-rose-600">
                  {lang === 'ta' ? 'வெளியேறு' : 'Log out'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-300" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
