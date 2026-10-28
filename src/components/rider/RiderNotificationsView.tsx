'use client';

import React, { useState } from 'react';
import {
  Bell,
  Sparkles,
  CloudRain,
  Receipt,
  ShieldCheck,
  Check,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react';

export interface RiderNotification {
  id: string;
  title: string;
  titleTa?: string;
  message: string;
  messageTa?: string;
  type: 'surge' | 'reminder' | 'safety' | 'info';
  timestamp: string;
  read: boolean;
}

export interface RiderNotificationsViewProps {
  lang?: 'en' | 'ta';
  onNavigateTab?: (tab: string) => void;
}

const INITIAL_NOTIFICATIONS: RiderNotification[] = [
  {
    id: 'notif-1',
    title: 'Rain Surge Incentive Active (+₹15/drop)',
    titleTa: 'மழைக்கால கூடுதல் சன்மானம் (+₹15/டெலிவரி)',
    message: 'Monsoon surge pricing is active for Madurai urban deliveries. Ride safely with helmet.',
    messageTa: 'மதுரை நகர டெலிவரிகளுக்கு கூடுதல் கட்டணம் வழங்கப்படுகிறது. எச்சரிக்கையுடன் ஓட்டவும்.',
    type: 'surge',
    timestamp: '15 mins ago',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Counter Cash Reconciliation Open',
    titleTa: 'கவுண்டர் ரொக்க ஒப்படைப்பு திறக்கப்பட்டுள்ளது',
    message: 'Cashier dock is ready to receive your collected COD cash for shift settlement.',
    messageTa: 'வசூலிக்கப்பட்ட ரொக்கத்தை ஒப்படைக்க கவுண்டர் தயாராக உள்ளது.',
    type: 'reminder',
    timestamp: '1 hour ago',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Bag Slip 4-Digit PIN System',
    titleTa: '4-இலக்க பை எண் சரிபார்ப்பு முறை',
    message: 'All order bags from packing counter feature a 4-digit code. Enter on your keypad to claim bag.',
    messageTa: 'பேக்கிங் கவுண்டரிலிருந்து எடுக்கப்படும் பைகளில் 4 இலக்க குறியீடு இருக்கும்.',
    type: 'info',
    timestamp: '3 hours ago',
    read: true,
  },
];

export const RiderNotificationsView: React.FC<RiderNotificationsViewProps> = ({
  lang = 'en',
  onNavigateTab,
}) => {
  const [notifications, setNotifications] = useState<RiderNotification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  return (
    <div className="space-y-4 pb-28 font-sans max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
            {lang === 'ta' ? 'அறிவிப்புகள்' : 'Dispatch Alerts'}
          </h2>
          <span className="text-xs text-[#475569]">
            {unreadCount > 0
              ? `${unreadCount} ${lang === 'ta' ? 'புதிய அறிவிப்புகள்' : 'unread messages'}`
              : lang === 'ta'
              ? 'அனைத்தும் படிக்கப்பட்டன'
              : 'All caught up'}
          </span>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="min-h-[40px] px-3 rounded-xl bg-[#F1F9EC] hover:bg-[#76CA3E]/20 text-[#143B0D] text-xs font-bold transition-colors"
          >
            {lang === 'ta' ? 'அனைத்தும் படி' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {notifications.map((n) => {
          return (
            <article
              key={n.id}
              onClick={() => handleToggleRead(n.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                n.read
                  ? 'bg-white border-[#E2E8F0]'
                  : 'bg-[#F1F9EC] border-[#76CA3E] shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    n.type === 'surge'
                      ? 'bg-[#FE932C] text-white'
                      : n.type === 'reminder'
                      ? 'bg-[#143B0D] text-white'
                      : 'bg-[#0047BF] text-white'
                  }`}
                >
                  {n.type === 'surge' ? (
                    <CloudRain className="w-5 h-5" />
                  ) : n.type === 'reminder' ? (
                    <Receipt className="w-5 h-5 text-[#76CA3E]" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-[#0F172A] leading-tight">
                      {lang === 'ta' && n.titleTa ? n.titleTa : n.title}
                    </h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-[#047857] shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-[#475569] leading-snug mt-1">
                    {lang === 'ta' && n.messageTa ? n.messageTa : n.message}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#E2E8F0] text-[10px] text-[#94A3B8] font-mono">
                    <span>{n.timestamp}</span>
                    <span className="font-bold text-[#143B0D]">
                      {n.read ? 'Tap to mark unread' : 'Tap to mark read'}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
