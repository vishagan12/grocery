'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

/* =========================================================================
   INLINE ALERT
========================================================================= */
export interface InlineAlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const InlineAlert: React.FC<InlineAlertProps> = ({
  variant = 'info',
  title,
  message,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const styles = {
    info: {
      bg: 'bg-[#DBE1FF]',
      border: 'border-[#0047BF]/30',
      text: 'text-[#00174B]',
      icon: <Info className="w-4 h-4 text-[#0047BF] shrink-0" />,
    },
    success: {
      bg: 'bg-[#97F5CC]',
      border: 'border-[#047857]/30',
      text: 'text-[#002115]',
      icon: <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />,
    },
    warning: {
      bg: 'bg-[#FFDCC3]',
      border: 'border-[#FE932C]/30',
      text: 'text-[#2F1500]',
      icon: <AlertTriangle className="w-4 h-4 text-[#FE932C] shrink-0" />,
    },
    error: {
      bg: 'bg-[#FFDAD6]',
      border: 'border-[#BA1A1A]/30',
      text: 'text-[#410002]',
      icon: <AlertCircle className="w-4 h-4 text-[#BA1A1A] shrink-0" />,
    },
  }[variant];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`p-3.5 rounded-xl border flex items-start gap-3 select-none ${styles.bg} ${styles.border} ${styles.text} ${className}`}
    >
      <div className="mt-0.5">{styles.icon}</div>
      <div className="flex-1 text-xs leading-relaxed">
        {title && <p className="font-bold text-sm mb-0.5">{title}</p>}
        <p className="font-medium">{message}</p>
      </div>
      {dismissible && (
        <button
          onClick={() => {
            setVisible(false);
            if (onDismiss) onDismiss();
          }}
          className="p-1 rounded text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

/* =========================================================================
   TOAST NOTIFICATION
========================================================================= */
export interface ToastNotificationProps {
  id: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  message: string;
  durationMs?: number;
  onClose: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  id,
  type = 'info',
  message,
  durationMs = 4000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, durationMs);
    return () => clearTimeout(timer);
  }, [id, durationMs, onClose]);

  const typeMap = {
    success: 'bg-[#143B0D] text-white border-[#76CA3E]/40',
    error: 'bg-[#BA1A1A] text-white border-rose-800',
    warning: 'bg-[#FE932C] text-[#2F1500] border-amber-600',
    info: 'bg-[#0047BF] text-white border-blue-700',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold animate-slide-up max-w-sm w-full ${typeMap[type]}`}
    >
      <span>{message}</span>
      <button
        onClick={() => onClose(id)}
        className="p-1 rounded hover:bg-white/20 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
