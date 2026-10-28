'use client';

import React from 'react';
import {
  Printer,
  PackageCheck,
  Bike,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CreditCard,
  Banknote,
  Clock,
} from 'lucide-react';

export type OrderStatusType = 0 | 1 | 2 | 3 | 4 | 'new' | 'packing' | 'out_for_delivery' | 'delivered' | 'cancelled' | string;
export type PaymentBadgeType = 'upi' | 'cod';
export type StockBadgeType = 'in_stock' | 'low_buffer' | 'out_of_stock';

export interface StatusBadgeProps {
  status?: OrderStatusType;
  payment?: PaymentBadgeType;
  stock?: StockBadgeType;
  customLabel?: string;
  customColor?: 'amber' | 'blue' | 'emerald' | 'rose' | 'slate';
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  payment,
  stock,
  customLabel,
  customColor,
  pulse = false,
  size = 'md',
  className = '',
}) => {
  let label = customLabel || '';
  let icon: React.ReactNode = null;
  let colorClasses = 'bg-slate-100 text-slate-800 border-slate-200';

  // 1. Order Status Lifecycle (Statuses 0, 1, 2, 3, 4 and string aliases)
  if (status !== undefined) {
    switch (status) {
      case 0:
      case 'new':
        label = label || 'Auto-Printed Slip';
        icon = <Printer className="w-3.5 h-3.5" />;
        colorClasses = 'bg-[#FFDCC3] text-[#2F1500] border-[#FE932C]/30';
        break;
      case 1:
      case 'packing':
        label = label || 'Bagged at Dock';
        icon = <PackageCheck className="w-3.5 h-3.5" />;
        colorClasses = 'bg-[#DBE1FF] text-[#0047BF] border-[#0047BF]/30';
        break;
      case 2:
      case 'out_for_delivery':
        label = label || 'On Route to Customer';
        icon = <Bike className="w-3.5 h-3.5" />;
        colorClasses = 'bg-[#97F5CC] text-[#002115] border-[#047857]/30';
        break;
      case 3:
      case 'delivered':
        label = label || 'Delivered & Settled';
        icon = <CheckCircle2 className="w-3.5 h-3.5" />;
        colorClasses = 'bg-slate-200 text-slate-800 border-slate-300';
        break;
      case 4:
      case 'cancelled':
        label = label || 'Void / Cancelled';
        icon = <XCircle className="w-3.5 h-3.5" />;
        colorClasses = 'bg-[#FFDAD6] text-[#BA1A1A] border-[#BA1A1A]/30';
        break;
    }
  }

  // 2. Payment Badges
  if (payment) {
    if (payment === 'upi') {
      label = label || 'UPI Paid';
      icon = <CreditCard className="w-3.5 h-3.5" />;
      colorClasses = 'bg-[#97F5CC] text-[#002115] border-[#047857]/30';
    } else {
      label = label || 'COD Cash';
      icon = <Banknote className="w-3.5 h-3.5" />;
      colorClasses = 'bg-[#FFDCC3] text-[#2F1500] border-[#FE932C]/30';
    }
  }

  // 3. Stock Buffer Badges
  if (stock) {
    switch (stock) {
      case 'in_stock':
        label = label || 'In Stock';
        icon = <CheckCircle2 className="w-3.5 h-3.5" />;
        colorClasses = 'bg-[#F1F9EC] text-[#143B0D] border-[#76CA3E]/30';
        break;
      case 'low_buffer':
        label = label || '< 5 Low Stock';
        icon = <AlertTriangle className="w-3.5 h-3.5" />;
        colorClasses = 'bg-[#FFDCC3] text-[#2F1500] border-[#FE932C]/40';
        break;
      case 'out_of_stock':
        label = label || 'Out of Stock';
        icon = <XCircle className="w-3.5 h-3.5" />;
        colorClasses = 'bg-[#FFDAD6] text-[#410002] border-[#BA1A1A]/30';
        break;
    }
  }

  // 4. Custom Override
  if (customColor) {
    const map = {
      amber: 'bg-[#FFDCC3] text-[#2F1500] border-[#FE932C]/30',
      blue: 'bg-[#DBE1FF] text-[#00174B] border-[#0047BF]/30',
      emerald: 'bg-[#97F5CC] text-[#002115] border-[#047857]/30',
      rose: 'bg-[#FFDAD6] text-[#410002] border-[#BA1A1A]/30',
      slate: 'bg-slate-100 text-slate-800 border-slate-200',
    };
    colorClasses = map[customColor];
  }

  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-[10px] gap-1' : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-bold font-mono tracking-tight rounded-lg border uppercase select-none ${sizeClasses} ${colorClasses} ${className}`}
    >
      {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />}
      {icon}
      <span>{label}</span>
    </span>
  );
};
