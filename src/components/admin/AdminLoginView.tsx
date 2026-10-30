'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Mail, Lock, ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/FormControls';

export interface AdminLoginViewProps {
  onUnlock?: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onUnlock }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

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
        setIsLoading(false);
        return;
      }

      if (onUnlock) {
        onUnlock();
      } else {
        router.refresh();
      }
    } catch {
      setErrorMsg('Unable to connect to authentication service.');
      setIsLoading(false);
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
            <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" />
            <span>Supabase Auth • Role Verified</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-2xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#BA1A1A] text-xs font-semibold flex items-center gap-2 animate-shake"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-[#BA1A1A]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@sriamman.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                }}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Admin Password
            </label>
            <Input
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg('');
              }}
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full justify-center gap-2 mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
};
