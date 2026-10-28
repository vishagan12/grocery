'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Eye, EyeOff, ShieldAlert, Sparkles, Store, Clock } from 'lucide-react';
import { Button } from '../ui/Button';

export interface AdminLoginViewProps {
  onUnlock: (pin: string) => boolean;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    if (!pin.trim()) {
      setErrorMsg('Please enter your admin PIN.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const success = onUnlock(pin.trim());
      setIsLoading(false);

      if (!success) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        setPin('');

        if (nextAttempts >= 5) {
          setLockoutSeconds(30);
          setErrorMsg('Too many failed attempts. Temporary lockout for 30 seconds.');
        } else {
          setErrorMsg(`Invalid passcode. ${5 - nextAttempts} attempts remaining.`);
        }
      } else {
        setFailedAttempts(0);
      }
    }, 350);
  };

  const handleKeypadDigit = (digit: string) => {
    if (lockoutSeconds > 0 || pin.length >= 8) return;
    setPin((prev) => prev + digit);
    setErrorMsg('');
  };

  const handleKeypadBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col justify-center items-center p-4 selection:bg-[#76CA3E] selection:text-[#143B0D]">
      {/* Decorative Brand Accent Pattern */}
      <div className="absolute inset-0 bg-radial from-[#F1F9EC] via-[#F8FAF7] to-[#F8FAF7] -z-10 pointer-events-none" />

      <main className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-8 animate-scale-up">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#F1F9EC] border border-[#76CA3E]/30 flex items-center justify-center text-[#143B0D] mb-4 shadow-xs">
            <Store className="w-8 h-8 text-[#143B0D]" />
          </div>

          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Sri Amman Supermarket
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட் • Admin Command Center
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F9EC] border border-[#76CA3E]/30 text-[11px] font-bold text-[#143B0D]">
            <Sparkles className="w-3.5 h-3.5 text-[#76CA3E]" />
            <span>Store Counter &amp; POS Master V4.2</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-pin-input" className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
              Enter Staff Security PIN
            </label>
            <div className="relative">
              <input
                id="admin-pin-input"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={pin}
                disabled={lockoutSeconds > 0}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="••••"
                autoComplete="current-password"
                className="w-full h-14 text-center text-2xl font-mono tracking-[0.4em] text-slate-900 bg-slate-50 rounded-2xl border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#76CA3E] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Feedback & Error Alerts */}
          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#BA1A1A] text-xs font-semibold flex items-center gap-2 animate-shake"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {lockoutSeconds > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-700 animate-spin" />
              <span>Retry permitted in {lockoutSeconds} seconds</span>
            </div>
          )}

          {/* Quick Touch Keypad for Counter Tablets / Mobiles */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={lockoutSeconds > 0}
                onClick={() => handleKeypadDigit(digit)}
                className="min-h-[48px] py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-[#F1F9EC] active:text-[#143B0D] border border-slate-200 font-mono font-bold text-lg text-slate-800 transition-all select-none"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              disabled={lockoutSeconds > 0}
              onClick={() => setPin('')}
              className="min-h-[48px] py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={lockoutSeconds > 0}
              onClick={() => handleKeypadDigit('0')}
              className="min-h-[48px] py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-mono font-bold text-lg text-slate-800 transition-all select-none"
            >
              0
            </button>
            <button
              type="button"
              disabled={lockoutSeconds > 0}
              onClick={handleKeypadBackspace}
              className="min-h-[48px] py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider"
            >
              ⌫
            </button>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-base font-extrabold shadow-md"
              loading={isLoading}
              disabled={lockoutSeconds > 0 || !pin}
              icon={lockoutSeconds > 0 ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            >
              {lockoutSeconds > 0 ? `Locked (${lockoutSeconds}s)` : 'Unlock Command Center'}
            </Button>
          </div>
        </form>

        {/* Footer Guidance */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-600 font-mono">
            Authorized supermarket supervisors and floor staff only.
          </p>
        </div>
      </main>
    </div>
  );
};
