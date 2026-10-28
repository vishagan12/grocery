'use client';

import React, { useState } from 'react';
import {
  Bike,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles,
} from 'lucide-react';

export interface RiderSession {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  shiftStatus: 'active' | 'on_break';
  loginTime: string;
}

export interface RiderAuthViewProps {
  onLoginSuccess: (session: RiderSession) => void;
  lang?: 'en' | 'ta';
  onToggleLang?: () => void;
}

// Demo roster matching store records in Madurai
export const REGISTERED_RIDERS: Array<{
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  pin: string;
}> = [
  {
    id: 'rider-01',
    name: 'Muthu Kumar',
    phone: '9842198421',
    vehicle: 'Hero Splendor (TN-59-AB-1234)',
    pin: '1234',
  },
  {
    id: 'rider-02',
    name: 'Karthik Raja',
    phone: '9789097890',
    vehicle: 'TVS Jupiter (TN-58-XY-9876)',
    pin: '1234',
  },
  {
    id: 'rider-03',
    name: 'Senthil Nathan',
    phone: '9944099440',
    vehicle: 'Honda Activa (TN-59-CZ-4321)',
    pin: '1234',
  },
  {
    id: 'rider-04',
    name: 'Vigneshwaran P.',
    phone: '9843398433',
    vehicle: 'Bajaj Pulsar (TN-59-DE-5566)',
    pin: '1234',
  },
];

export const RiderAuthView: React.FC<RiderAuthViewProps> = ({
  onLoginSuccess,
  lang = 'en',
  onToggleLang,
}) => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickSelectRider = (rider: typeof REGISTERED_RIDERS[0]) => {
    setPhone(rider.phone);
    setPin(rider.pin);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanPin = pin.trim();

    if (cleanPhone.length < 10) {
      setErrorMessage(
        lang === 'ta'
          ? 'சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்'
          : 'Please enter a valid 10-digit mobile number'
      );
      return;
    }

    if (!cleanPin) {
      setErrorMessage(
        lang === 'ta' ? 'ஷிப்ட் கடவுச்சொல்லை உள்ளிடவும்' : 'Please enter your shift passcode'
      );
      return;
    }

    setLoading(true);

    try {
      // Find matching rider
      const matched = REGISTERED_RIDERS.find(
        (r) => r.phone.replace(/\D/g, '').slice(-10) === cleanPhone
      );

      // Verify credentials (default fallback PIN 1234 for demo)
      const validPin = matched ? matched.pin : '1234';

      if (cleanPin !== validPin) {
        setErrorMessage(
          lang === 'ta'
            ? 'தவறான மொபைல் எண் அல்லது கடவுச்சொல்'
            : 'Invalid mobile number or passcode'
        );
        setLoading(false);
        return;
      }

      // Successful authentication
      const session: RiderSession = {
        id: matched ? matched.id : `rider-${cleanPhone.slice(-4)}`,
        name: matched ? matched.name : 'Delivery Partner',
        phone: cleanPhone,
        vehicle: matched ? matched.vehicle : 'Two Wheeler',
        shiftStatus: 'active',
        loginTime: new Date().toISOString(),
      };

      // Store in sessionStorage and localStorage for offline persistence
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('sas_rider_session', JSON.stringify(session));
          localStorage.setItem('sas_last_rider', JSON.stringify(session));
        }
      } catch {}

      // Slight intentional delay for smooth haptic perception
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess(session);
      }, 350);
    } catch {
      setErrorMessage(
        lang === 'ta' ? 'அங்கீகார பிழை ஏற்பட்டது' : 'Authentication failed. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#0F172A] flex flex-col justify-between max-w-md mx-auto px-4 py-6 font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-[#143B0D] flex items-center justify-center text-white shadow-sm">
            <Bike className="w-6 h-6 text-[#76CA3E]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#143B0D] block">
              Sri Amman Supermarket
            </span>
            <h1 className="text-base font-black tracking-tight leading-none text-[#0F172A]">
              {lang === 'ta' ? 'விநியோக ஷிப்ட் நுழைவு' : 'Rider Dispatch Portal'}
            </h1>
          </div>
        </div>

        {onToggleLang && (
          <button
            type="button"
            onClick={onToggleLang}
            className="min-h-[44px] px-3 rounded-xl bg-white border border-[#E2E8F0] text-xs font-mono font-bold text-[#0F172A] hover:bg-[#F1F9EC] transition-colors"
            aria-label="Toggle language"
          >
            {lang === 'en' ? 'தமிழ்' : 'English'}
          </button>
        )}
      </header>

      {/* Main Login Card */}
      <main className="my-auto py-6 space-y-5">
        {/* Welcome Tagline */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F1F9EC] border border-[#76CA3E]/30 text-[#143B0D] text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#76CA3E] animate-pulse" />
            <span>Madurai Urban Delivery Hub</span>
          </div>
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">
            {lang === 'ta' ? 'ஷிப்ட் தொடங்கவும்' : 'Sign In to Shift'}
          </h2>
          <p className="text-xs text-[#475569] leading-relaxed">
            {lang === 'ta'
              ? 'உங்கள் மொபைல் எண் மற்றும் 4 இலக்க ஷிப்ட் கடவுச்சொல்லை உள்ளிடவும்.'
              : 'Enter your registered rider mobile number and shift passcode.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3.5 rounded-2xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#410002] flex items-start gap-2.5 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 text-[#BA1A1A] shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              <span className="font-bold block">
                {lang === 'ta' ? 'உள்நுழைவு பிழை' : 'Authentication Error'}
              </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Mobile Number Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="rider-phone"
              className="text-xs font-bold uppercase tracking-wide text-[#475569] flex items-center justify-between"
            >
              <span>{lang === 'ta' ? 'மொபைல் எண்' : 'Mobile Number'}</span>
              <span className="font-mono text-[10px] text-[#94A3B8]">10 Digits</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none text-[#475569]">
                <Phone className="w-4 h-4 text-[#143B0D]" />
                <span className="text-xs font-mono font-bold border-r border-[#E2E8F0] pr-1.5">
                  +91
                </span>
              </div>
              <input
                id="rider-phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ''));
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="98421 00000"
                className="w-full h-14 pl-20 pr-4 rounded-2xl bg-white border-2 border-[#E2E8F0] focus:border-[#143B0D] focus:ring-2 focus:ring-[#76CA3E]/30 text-base font-mono font-bold text-[#0F172A] placeholder:text-[#94A3B8] transition-all outline-none"
              />
            </div>
          </div>

          {/* Shift PIN Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="rider-pin"
              className="text-xs font-bold uppercase tracking-wide text-[#475569] flex items-center justify-between"
            >
              <span>{lang === 'ta' ? 'ஷிப்ட் கடவுச்சொல்' : 'Shift Passcode (PIN)'}</span>
              <span className="font-mono text-[10px] text-[#94A3B8]">Demo: 1234</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#143B0D]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="rider-pin"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={6}
                required
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••"
                className="w-full h-14 pl-11 pr-12 rounded-2xl bg-white border-2 border-[#E2E8F0] focus:border-[#143B0D] focus:ring-2 focus:ring-[#76CA3E]/30 text-lg font-mono font-bold text-[#0F172A] placeholder:text-[#94A3B8] tracking-widest transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#475569] hover:text-[#0F172A]"
                aria-label={showPin ? 'Hide passcode' : 'Show passcode'}
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[52px] rounded-2xl bg-[#143B0D] hover:bg-[#1E4D12] active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{lang === 'ta' ? 'ஷிப்ட் தொடங்க' : 'Unlock & Start Shift'}</span>
                <ArrowRight className="w-4 h-4 text-[#76CA3E]" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Rider Selector */}
        <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#475569] font-bold">
            <span>{lang === 'ta' ? 'டெமோ ரைடர் தேர்வு (1-கிளிக்):' : 'Demo Rider Roster (1-Tap Fill):'}</span>
            <span className="font-mono text-[10px] text-[#047857]">4 Active</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {REGISTERED_RIDERS.map((r) => {
              const isSelected = phone === r.phone;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleQuickSelectRider(r)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-[#F1F9EC] border-[#76CA3E] ring-2 ring-[#76CA3E]/30'
                      : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAF7]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A] truncate">{r.name}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] shrink-0" />}
                  </div>
                  <span className="block text-[10px] font-mono text-[#475569] mt-0.5">
                    {r.vehicle.split(' ')[0]} • #{r.id.slice(-2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Safety & Shift Footnote */}
      <footer className="text-center pt-4 border-t border-[#E2E8F0] space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#143B0D]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" />
          <span>Amman Store Verified Dispatch Protocol</span>
        </div>
        <p className="text-[10px] text-[#94A3B8]">
          Helmet mandatory • Safe riding • Madurai dispatch helpline: +91 98421 00000
        </p>
      </footer>
    </div>
  );
};
