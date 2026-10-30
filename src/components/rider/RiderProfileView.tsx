'use client';

import React, { useState } from 'react';
import {
  User,
  Bike,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  LogOut,
  Globe,
  HelpCircle,
  AlertTriangle,
  Award,
  ChevronRight,
  Shield,
  KeyRound,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { RiderSession } from './RiderAuthView';

export interface RiderProfileViewProps {
  session: RiderSession;
  onLogout: () => void;
  onToggleShiftStatus: () => void;
  lang?: 'en' | 'ta';
  onToggleLang?: () => void;
}

export const RiderProfileView: React.FC<RiderProfileViewProps> = ({
  session,
  onLogout,
  onToggleShiftStatus,
  lang = 'en',
  onToggleLang,
}) => {
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Password confirmation does not match.');
      return;
    }

    setPwLoading(true);
    setPwError(null);

    try {
      const res = await fetch('/api/rider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHANGE_PASSWORD',
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || 'Failed to update password.');
        setPwLoading(false);
        return;
      }

      setPwSuccess(true);
      setTimeout(() => {
        setPwSuccess(false);
        setPasswordModalOpen(false);
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch {
      setPwError('Network error while updating password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 font-sans max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
            {lang === 'ta' ? 'ரைடர் சுயவிவரம்' : 'Rider Profile'}
          </h2>
          <span className="text-xs text-[#475569]">
            {lang === 'ta' ? 'ஷிப்ட் & அமைப்புகள்' : 'Shift cockpit & settings'}
          </span>
        </div>
        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-[#F1F9EC] border border-[#76CA3E]/30 text-[#143B0D]">
          ID #{session.id}
        </span>
      </div>

      {/* Main Profile Card */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm space-y-3.5">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#143B0D] flex items-center justify-center text-white ring-4 ring-[#76CA3E]/20 shrink-0">
            <User className="w-7 h-7 text-[#76CA3E]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[#0F172A] truncate leading-tight">
                {session.name}
              </h3>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#F1F9EC] text-[#047857] font-mono text-[10px] font-bold shrink-0">
                ★ 4.9
              </span>
            </div>
            <p className="font-mono text-xs text-[#475569] font-bold mt-0.5">
              +91 {session.phone.replace(/\D/g, '').slice(-10)}
            </p>
            <span className="inline-block text-[11px] text-[#047857] font-medium">
              Madurai Urban Dispatch Partner
            </span>
          </div>
        </div>

        {/* Vehicle Badge */}
        <div className="p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#0F172A]">
            <Bike className="w-4 h-4 text-[#0047BF]" />
            <span className="font-bold">{session.vehicle}</span>
          </div>
          <span className="font-mono text-[10px] font-bold bg-white border border-[#E2E8F0] px-2 py-0.5 rounded text-[#047857]">
            VERIFIED
          </span>
        </div>
      </section>

      {/* Shift Status Switchboard */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#475569]">
          {lang === 'ta' ? 'ஷிப்ட் நிலை' : 'Shift Duty Status'}
        </h3>

        <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0]">
          <div>
            <span className="text-sm font-bold text-[#0F172A] block leading-snug">
              {session.shiftStatus === 'active'
                ? lang === 'ta'
                  ? 'ஷிப்ட் ஆன்லைன் (ஆர்டர்கள் ஏற்கப்படுகின்றன)'
                  : 'Shift Online (Accepting Orders)'
                : lang === 'ta'
                ? 'ஓய்வு நேரம் (ஆர்டர்கள் இடைநிறுத்தம்)'
                : 'On Break (Duty Paused)'}
            </span>
            <span className="text-[11px] text-[#475569]">
              {session.shiftStatus === 'active'
                ? 'Ready for instant bag dispatch at store counter'
                : 'Take your meal or fuel break'}
            </span>
          </div>

          <button
            onClick={onToggleShiftStatus}
            className={`min-h-[44px] min-w-[70px] px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all border ${
              session.shiftStatus === 'active'
                ? 'bg-[#143B0D] text-[#76CA3E] border-[#143B0D]'
                : 'bg-white text-slate-700 border-[#E2E8F0]'
            }`}
          >
            {session.shiftStatus === 'active' ? 'ONLINE' : 'BREAK'}
          </button>
        </div>
      </section>

      {/* Safety & Compliance Checklist */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#475569]">
          Safety &amp; Compliance Protocol
        </h3>

        <div className="space-y-2 divide-y divide-[#E2E8F0] text-xs">
          <div className="pt-2 first:pt-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#047857]" />
              <span className="font-bold text-[#0F172A]">Helmet &amp; Two-Wheeler Gear</span>
            </div>
            <span className="font-mono text-[10px] text-[#047857] font-bold">Compliant</span>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#047857]" />
              <span className="font-bold text-[#0F172A]">Driving License (TN Transport)</span>
            </div>
            <span className="font-mono text-[10px] text-[#047857] font-bold">Active Valid</span>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0047BF]" />
              <span className="font-bold text-[#0F172A]">Amman Partner Delivery Insurance</span>
            </div>
            <span className="font-mono text-[10px] text-[#0047BF] font-bold">Active 2026</span>
          </div>
        </div>
      </section>

      {/* Language Preference & Emergency Hotline */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#475569]">
          App Preferences &amp; Support
        </h3>

        {/* Language switch */}
        {onToggleLang && (
          <button
            onClick={onToggleLang}
            className="w-full min-h-[48px] p-3 rounded-xl bg-[#F8FAF7] hover:bg-[#F1F9EC] border border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#0F172A] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#143B0D]" />
              <span>Language: {lang === 'en' ? 'English (ஆங்கிலம்)' : 'தமிழ் (Tamil)'}</span>
            </div>
            <span className="font-mono text-[10px] text-[#047857]">Switch</span>
          </button>
        )}

        {/* Emergency Dispatch Phone */}
        <a
          href="tel:+919842100000"
          className="w-full min-h-[48px] p-3 rounded-xl bg-[#F8FAF7] hover:bg-[#F1F9EC] border border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#0F172A] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#047857]" />
            <span>Store Dispatch Helpline (+91 98421 00000)</span>
          </div>
          <span className="font-mono text-[10px] text-[#047857]">Call Store</span>
        </a>
      </section>

      {/* Change Password Trigger */}
      <button
        onClick={() => setPasswordModalOpen(true)}
        className="w-full min-h-[48px] p-3 rounded-2xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAF7] flex items-center justify-between text-xs font-bold text-[#0F172A] shadow-xs transition-colors"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#0047BF]" />
          <span>{lang === 'ta' ? 'கடவுச்சொல் மாற்றம்' : 'Change Account Password'}</span>
        </div>
        <span className="font-mono text-[10px] text-[#0047BF]">Update</span>
      </button>

      {/* Logout Trigger (Touch Target >= 48px) */}
      <button
        onClick={() => setLogoutModalOpen(true)}
        className="w-full min-h-[50px] rounded-2xl bg-white border border-[#BA1A1A]/40 text-[#BA1A1A] hover:bg-[#FFDAD6]/30 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>{lang === 'ta' ? 'ஷிப்ட் முடிக்க & வெளியேற' : 'End Shift & Log Out'}</span>
      </button>

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-xl bg-[#F1F9EC] mx-auto flex items-center justify-center text-[#143B0D]">
                <KeyRound className="w-5 h-5 text-[#047857]" />
              </div>
              <h4 className="text-base font-black text-[#0F172A]">
                {lang === 'ta' ? 'கடவுச்சொல் மாற்று' : 'Update Password'}
              </h4>
            </div>

            {pwError && (
              <div className="p-2.5 rounded-xl bg-[#FFDAD6] text-[#BA1A1A] text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="p-2.5 rounded-xl bg-[#F1F9EC] text-[#143B0D] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
                <span>Password updated!</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">New Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#76CA3E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F8FAF7] border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#76CA3E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setPwError(null);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="min-h-[44px] rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="min-h-[44px] rounded-xl bg-[#143B0D] text-white text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#FFDAD6] mx-auto flex items-center justify-center text-[#BA1A1A]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-black text-[#0F172A]">End Delivery Shift?</h4>
              <p className="text-xs text-[#475569] mt-1">
                Make sure any collected cash has been handed over to the counter cashier before logging out.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="min-h-[44px] rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutModalOpen(false);
                  onLogout();
                }}
                className="min-h-[44px] rounded-xl bg-[#BA1A1A] text-white text-xs font-bold"
              >
                Yes, End Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
