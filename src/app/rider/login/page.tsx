'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bike, Lock, User, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function RiderLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rider-login',
          username: username.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid rider credentials.');
        setLoading(false);
        return;
      }

      if (data.rider) {
        sessionStorage.setItem('sas_rider_session', JSON.stringify(data.rider));
      }

      router.push('/rider');
      router.refresh();
    } catch {
      setErrorMsg('Unable to connect to login server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col justify-center items-center p-4 selection:bg-[#76CA3E] selection:text-[#143B0D]">
      <main className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-8 animate-scale-up">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#143B0D] flex items-center justify-center text-[#76CA3E] mb-4 shadow-sm ring-4 ring-[#76CA3E]/20">
            <Bike className="w-8 h-8 text-[#76CA3E]" />
          </div>

          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Sri Amman Delivery Fleet
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            ஸ்ரீ அம்மன் ரைடர் போர்ட்டல் • Rider Partner Portal
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rider-username" className="block text-xs font-bold text-slate-700 mb-1.5">
              Rider Username (ரைடர் பெயர்)
            </label>
            <div className="relative">
              <input
                id="rider-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="muthukumar"
                required
                autoCapitalize="none"
                autoComplete="username"
                disabled={loading}
                className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#143B0D] focus:border-[#143B0D] text-sm text-[#0F172A] bg-[#F8FAF7]/50 lowercase font-mono"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Provided by store admin</p>
          </div>

          <div>
            <label htmlFor="rider-password" className="block text-xs font-bold text-slate-700 mb-1.5">
              Rider Password (கடவுச்சொல்)
            </label>
            <div className="relative">
              <input
                id="rider-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
                className="w-full min-h-[48px] pl-10 pr-11 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#143B0D] focus:border-[#143B0D] text-sm text-[#0F172A] bg-[#F8FAF7]/50 font-mono"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-2xl bg-[#143B0D] text-white hover:bg-[#1a4a12] font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#76CA3E]" /> Logging in...
              </>
            ) : (
              'Start Delivery Shift'
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            Internal partner application • Sri Amman Supermarket
          </p>
        </div>
      </main>
    </div>
  );
}
