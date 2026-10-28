'use client';

import React from 'react';

export interface StatCardProps {
  label?: string;
  title?: string;
  value: string | number;
  icon: React.ReactNode;
  subtext?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  title,
  value,
  icon,
  subtext,
  subtitle,
  badge,
  trend,
  onClick,
  className = '',
}) => {
  const cardLabel = label || title || '';
  const cardSubtext = subtext || subtitle;

  return (
    <div
      onClick={onClick}
      className={`p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs transition-all duration-150 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-[#76CA3E] hover:shadow-xs active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">{cardLabel}</span>
        <div className="w-9 h-9 rounded-xl bg-[#F1F9EC] text-[#143B0D] flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tabular-nums tracking-tight">
          {value}
        </span>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {(cardSubtext || trend) && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {cardSubtext && <span className="truncate">{cardSubtext}</span>}
          {trend && (
            <span className={`font-bold font-mono ${trend.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
