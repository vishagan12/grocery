'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, Store, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin-login',
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid login credentials.');
        setLoading(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setErrorMsg('Unable to connect to login server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] flex flex-col justify-center items-center p-4 selection:bg-[#76CA3E] selection:text-[#143B0D]">
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
            <span>Store Counter &amp; POS Master</span>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700 animate-fade-in font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-bold text-slate-700 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                required
                autoComplete="email"
                disabled={loading}
                className="w-full min-h-[48px] pl-10 pr-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#76CA3E] focus:border-[#76CA3E] text-sm text-[#0F172A] bg-[#F8FAF7]/50"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-bold text-slate-700 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                disabled={loading}
                className="w-full min-h-[48px] pl-10 pr-11 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#76CA3E] focus:border-[#76CA3E] text-sm text-[#0F172A] bg-[#F8FAF7]/50 font-mono"
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full mt-2 font-bold min-h-[48px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...
              </span>
            ) : (
              'Sign In to Command Center'
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            Protected by Supabase Auth with Row Level Security.
          </p>
        </div>
      </main>
    </div>
  );
}
