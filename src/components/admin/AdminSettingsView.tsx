'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Store,
  Printer,
  Volume2,
  VolumeX,
  Lock,
  Save,
  Clock,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Receipt,
  Headphones,
} from 'lucide-react';
import { PageHeader } from './PageHeader';
import { Input, Toggle } from '../ui/FormControls';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Overlays';

export interface AdminSettingsViewProps {
  acceptingOrders: boolean;
  onToggleStore: () => void;
  autoPrintEnabled: boolean;
  onToggleAutoPrint: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTriggerTestPrint?: () => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  acceptingOrders,
  onToggleStore,
  autoPrintEnabled,
  onToggleAutoPrint,
  soundEnabled,
  onToggleSound,
  onTriggerTestPrint,
}) => {
  // Store Info & Thermal Slip configuration
  const [storeName, setStoreName] = useState('Sri Amman Supermarket');
  const [storeTaglineTa, setStoreTaglineTa] = useState('ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட் • மதுரை');
  const [storeAddress, setStoreAddress] = useState('Alagar Kovil Road, K.Pudur, Madurai - 625007');
  const [storePhone, setStorePhone] = useState('9842198421');
  const [gstin, setGstin] = useState('33AAAAA0000A1Z5');
  const [receiptFooter, setReceiptFooter] = useState('நன்றி! மீண்டும் வருக! • Thank you! Visit Again!');

  // Hours
  const [openTime, setOpenTime] = useState('06:30');
  const [closeTime, setCloseTime] = useState('22:30');

  // Change PIN modal
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);

  // Unsaved changes state
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);

  // Restore saved store settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('sas_store_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.storeName) setStoreName(parsed.storeName);
          if (parsed.storeTaglineTa) setStoreTaglineTa(parsed.storeTaglineTa);
          if (parsed.storeAddress) setStoreAddress(parsed.storeAddress);
          if (parsed.storePhone) setStorePhone(parsed.storePhone);
          if (parsed.gstin) setGstin(parsed.gstin);
          if (parsed.receiptFooter) setReceiptFooter(parsed.receiptFooter);
          if (parsed.openTime) setOpenTime(parsed.openTime);
          if (parsed.closeTime) setCloseTime(parsed.closeTime);
        } catch {}
      }
    }
  }, []);

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSaveSettings = () => {
    const payload = {
      storeName,
      storeTaglineTa,
      storeAddress,
      storePhone,
      gstin,
      receiptFooter,
      openTime,
      closeTime,
    };
    localStorage.setItem('sas_store_settings', JSON.stringify(payload));
    setHasChanges(false);
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3000);
  };

  // Play test sound chime
  const handleTestChime = () => {
    try {
      const audio = new Audio('/sounds/order-chime.mp3');
      audio.play().catch(() => {
        // Web Audio Synth Fallback
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      });
    } catch {}
  };

  // Handle Admin Password update via Supabase Auth
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 6) {
      setPinError('New password must be at least 6 characters.');
      return;
    }
    if (newPin.trim() !== confirmPin.trim()) {
      setPinError('New password confirmation does not match.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPin.trim(),
      });

      if (error) {
        setPinError(error.message);
        return;
      }

      setPinSuccess(true);
      setPinError('');
      setTimeout(() => {
        setPinSuccess(false);
        setIsPinModalOpen(false);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      }, 1500);
    } catch {
      setPinError('Failed to update password.');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <PageHeader
        title="Store Settings & POS Kiosk"
        subtitle="Manage store operating hours, 80mm ESC/POS thermal receipt formatting, and audio chimes."
      />

      {/* Success Save Notification */}
      {saveSuccessToast && (
        <div className="p-4 rounded-2xl bg-[#F1F9EC] border border-[#76CA3E]/40 text-[#143B0D] text-sm font-bold flex items-center gap-2.5 animate-scale-up shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-[#047857]" />
          <span>Store settings and thermal receipt layout saved successfully!</span>
        </div>
      )}

      {/* Group 1: Store Status & Operating Hours */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F1F9EC] text-[#143B0D] flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0F172A] text-base">Store Operations &amp; Status</h3>
              <p className="text-xs text-slate-500">Live ordering switch and daily dispatch windows</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold font-mono uppercase ${
                acceptingOrders ? 'text-[#047857]' : 'text-[#BA1A1A]'
              }`}
            >
              {acceptingOrders ? 'Open for Orders' : 'Store Paused'}
            </span>
            <button
              onClick={onToggleStore}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none focus:ring-2 focus:ring-[#76CA3E] ${
                acceptingOrders ? 'bg-[#76CA3E]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  acceptingOrders ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Store Opening Time</label>
            <Input
              type="time"
              value={openTime}
              onChange={(e) => handleFieldChange(setOpenTime, e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Store Closing Time</label>
            <Input
              type="time"
              value={closeTime}
              onChange={(e) => handleFieldChange(setCloseTime, e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Store Support Phone (WhatsApp)
            </label>
            <Input
              type="tel"
              value={storePhone}
              onChange={(e) => handleFieldChange(setStorePhone, e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              GSTIN / Merchant Tax ID
            </label>
            <Input
              value={gstin}
              onChange={(e) => handleFieldChange(setGstin, e.target.value.toUpperCase())}
            />
          </div>
        </div>
      </div>

      {/* Group 2: 80mm ESC/POS Thermal Receipt Layout */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DBE1FF] text-[#0047BF] flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0F172A] text-base">
                80mm Thermal Receipt Kiosk
              </h3>
              <p className="text-xs text-slate-500">
                ESC/POS counter receipt formatting and auto-print triggers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onTriggerTestPrint && (
              <Button
                variant="outline"
                size="sm"
                onClick={onTriggerTestPrint}
                icon={<Printer className="w-3.5 h-3.5 shrink-0" />}
                className="text-xs whitespace-nowrap shrink-0 inline-flex flex-row items-center"
              >
                Test Print 80mm Slip
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAF7] border border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              Auto-Print Slips on Order Arrival
            </span>
            <span className="text-[11px] text-slate-500 block">
              Automatically trigger browser print dialog whenever a new customer order arrives
            </span>
          </div>
          <button
            onClick={onToggleAutoPrint}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none focus:ring-2 focus:ring-[#76CA3E] ${
              autoPrintEnabled ? 'bg-[#76CA3E]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                autoPrintEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Store Header (English)
            </label>
            <Input
              value={storeName}
              onChange={(e) => handleFieldChange(setStoreName, e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Store Tagline (Tamil / தமிழ்)
            </label>
            <Input
              value={storeTaglineTa}
              onChange={(e) => handleFieldChange(setStoreTaglineTa, e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Receipt Store Address Line
            </label>
            <Input
              value={storeAddress}
              onChange={(e) => handleFieldChange(setStoreAddress, e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Thermal Slip Footer Message
            </label>
            <Input
              value={receiptFooter}
              onChange={(e) => handleFieldChange(setReceiptFooter, e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Group 3: Audio Chime & Kiosk Sounds */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#78350F] flex items-center justify-center">
              <Headphones className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0F172A] text-base">Audio Rush Chime Kiosk</h3>
              <p className="text-xs text-slate-500">Audio feedback when orders are placed</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTestChime}
            icon={<Volume2 className="w-3.5 h-3.5 shrink-0" />}
            className="text-xs whitespace-nowrap shrink-0 inline-flex flex-row items-center"
          >
            Play Sound Test
          </Button>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAF7] border border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              Audible Order Notification Chime
            </span>
            <span className="text-[11px] text-slate-500 block">
              Plays chime bell to alert floor packing staff of incoming deliveries
            </span>
          </div>
          <button
            onClick={onToggleSound}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none focus:ring-2 focus:ring-[#76CA3E] ${
              soundEnabled ? 'bg-[#76CA3E]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                soundEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Group 4: Security PIN Management */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#0F172A] text-base">Store Staff Security PIN</h3>
              <p className="text-xs text-slate-500">Counter lock protection &amp; staff gate</p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => setIsPinModalOpen(true)} className="text-xs gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Change Security PIN
          </Button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F8FAF7] border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800 block">Security Lock Status</span>
            <span className="text-slate-500">Active • 4-digit code required to unlock POS counter</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#047857] font-bold text-[11px] border border-emerald-200/60">
            PIN Protected
          </span>
        </div>
      </div>

      {/* Sticky Save Bar (if changes exist) */}
      {hasChanges && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40 bg-[#0F172A] text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#FE932C]" />
            <span className="text-xs font-bold">You have unsaved store settings</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHasChanges(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              Discard
            </button>
            <Button variant="primary" size="sm" onClick={handleSaveSettings} className="gap-1.5">
              <Save className="w-3.5 h-3.5" /> Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        title="Update Admin Account Password"
        size="sm"
      >
        <form onSubmit={handleChangePin} className="space-y-4">
          {pinError && (
            <div className="p-3 rounded-xl bg-[#FFDAD6] text-[#BA1A1A] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}
          {pinSuccess && (
            <div className="p-3 rounded-xl bg-[#F1F9EC] text-[#143B0D] text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
              <span>Admin password updated successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password (min 6 chars) *</label>
            <Input
              type="password"
              placeholder="Enter new password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
            <Input
              type="password"
              placeholder="Repeat new password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsPinModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
