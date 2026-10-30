'use client';

import React, { useState } from 'react';
import {
  Bike,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
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

export const RiderAuthView: React.FC<RiderAuthViewProps> = ({
  onLoginSuccess,
  lang = 'en',
  onToggleLang,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMessage(
        lang === 'ta' ? 'பயனர் பெயரை உள்ளிடவும்' : 'Please enter your portal username'
      );
      return;
    }

    if (!password) {
      setErrorMessage(
        lang === 'ta' ? 'கடவுச்சொல்லை உள்ளிடவும்' : 'Please enter your password'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rider-login',
          username: cleanUsername,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          data.error ||
            (lang === 'ta'
              ? 'தவறான பயனர் பெயர் அல்லது கடவுச்சொல்'
              : 'Invalid username or password')
        );
        setLoading(false);
        return;
      }

      const session: RiderSession = {
        id: data.rider?.id || `rider-${cleanUsername}`,
        name: data.rider?.name || cleanUsername,
        phone: data.rider?.phone || '',
        vehicle: 'Two Wheeler',
        shiftStatus: 'active',
        loginTime: new Date().toISOString(),
      };

      try {
        sessionStorage.setItem('sas_rider_session', JSON.stringify(session));
      } catch {}

      onLoginSuccess(session);
    } catch {
      setErrorMessage(
        lang === 'ta'
          ? 'சர்வர் இணைப்பு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.'
          : 'Unable to connect to server. Please try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#0F172A] flex flex-col justify-between p-4 max-w-md mx-auto font-sans antialiased">
      {/* Top Bar with Language Switcher */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#143B0D] flex items-center justify-center text-white">
            <Bike className="w-4 h-4 text-[#76CA3E]" />
          </div>
          <span className="font-extrabold text-xs tracking-tight">Sri Amman Dispatch</span>
        </div>

        {onToggleLang && (
          <button
            onClick={onToggleLang}
            className="min-h-[36px] px-3 rounded-xl bg-white border border-[#E2E8F0] text-xs font-mono font-bold text-[#0F172A] hover:bg-[#F1F9EC]"
          >
            {lang === 'en' ? 'தமிழ்' : 'English'}
          </button>
        )}
      </div>

      {/* Main Authentication Form Card */}
      <main className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-6 my-auto">
        <div className="text-center space-y-1">
          <div className="w-16 h-16 rounded-2xl bg-[#F1F9EC] mx-auto flex items-center justify-center text-[#143B0D] mb-2 border border-[#76CA3E]/30">
            <Bike className="w-8 h-8 text-[#047857]" />
          </div>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight">
            {lang === 'ta' ? 'ரைடர் உள்நுழைவு' : 'Rider Duty Login'}
          </h1>
          <p className="text-xs text-[#475569]">
            {lang === 'ta'
              ? 'மதுரை எக்ஸ்பிரஸ் டெலிவரி போர்ட்டல்'
              : 'Sri Amman Supermarket • Madurai Urban Fleet'}
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-[#FFDAD6] border border-[#BA1A1A]/30 text-[#BA1A1A] text-xs font-bold flex items-center gap-2.5 animate-shake"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-[#BA1A1A]" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="rider-username"
              className="block text-xs font-bold text-[#0F172A] flex items-center justify-between"
            >
              <span>{lang === 'ta' ? 'பயனர் பெயர்' : 'Rider Username'}</span>
              <span className="text-[10px] text-[#475569] font-mono">Assigned by Store</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#475569]">
                <User className="w-4 h-4" />
              </div>
              <input
                id="rider-username"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder={lang === 'ta' ? 'எ.கா. muthu_k' : 'e.g. muthu_k'}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase());
                  setErrorMessage(null);
                }}
                disabled={loading}
                className="w-full min-h-[48px] pl-10 pr-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0] text-sm font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#76CA3E] transition-all"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="rider-password"
              className="block text-xs font-bold text-[#0F172A] flex items-center justify-between"
            >
              <span>{lang === 'ta' ? 'கடவுச்சொல்' : 'Account Password'}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#475569]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="rider-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                disabled={loading}
                className="w-full min-h-[48px] pl-10 pr-11 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#76CA3E] transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#475569] hover:text-[#0F172A]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Duty Start Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[50px] rounded-2xl bg-[#143B0D] hover:bg-[#1E4D12] text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#76CA3E]" />
                <span>{lang === 'ta' ? 'சரிபார்க்கிறது...' : 'Starting Shift...'}</span>
              </>
            ) : (
              <>
                <span>{lang === 'ta' ? 'ஷிப்ட் தொடங்க' : 'Sign In & Start Shift'}</span>
                <ArrowRight className="w-4 h-4 text-[#76CA3E]" />
              </>
            )}
          </button>
        </form>

        <div className="p-3 rounded-2xl bg-[#F8FAF7] border border-[#E2E8F0] text-center">
          <p className="text-[11px] text-[#475569]">
            {lang === 'ta'
              ? 'புதிய ரைடர் கணக்குக்கு ஸ்டோர் மேலாளரை அணுகவும்.'
              : 'Need a rider account or password reset? Contact Store Admin.'}
          </p>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="text-center py-2 text-[10px] text-[#475569] space-y-0.5">
        <p className="font-bold">Sri Amman Supermarket • 2026 Fleet Security</p>
        <p>Verified with Supabase Auth &amp; Server-Side Session RLS</p>
      </footer>
    </div>
  );
};
