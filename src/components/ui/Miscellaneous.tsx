'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, User, MoreVertical } from 'lucide-react';

/* =========================================================================
   BREADCRUMBS
========================================================================= */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const Breadcrumbs: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 font-medium">
      <ol className="flex items-center space-x-1 sm:space-x-2">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center">
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1 shrink-0" />}
              {isLast ? (
                <span className="font-bold text-slate-900" aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <a href={item.href} className="hover:text-slate-800 transition-colors">
                  {item.label}
                </a>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/* =========================================================================
   AVATAR
========================================================================= */
export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', status, className = '' }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  }[size];

  return (
    <div className="relative inline-block select-none">
      <div
        className={`rounded-full bg-[#F1F9EC] text-[#143B0D] border border-[#76CA3E]/30 font-bold flex items-center justify-center ${sizeClasses} ${className}`}
      >
        {initials || <User className="w-4 h-4" />}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
            status === 'online' ? 'bg-[#76CA3E]' : status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
          }`}
        />
      )}
    </div>
  );
};

/* =========================================================================
   TIMELINE (Order & Delivery Steps)
========================================================================= */
export interface TimelineStep {
  title: string;
  timestamp?: string;
  description?: string;
  completed: boolean;
  current?: boolean;
}

export const Timeline: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => {
  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;

        return (
          <div key={idx} className="flex items-start gap-3 relative">
            {!isLast && (
              <div
                className={`absolute left-3.5 top-7 bottom-0 w-0.5 -ml-px ${
                  step.completed ? 'bg-[#76CA3E]' : 'bg-slate-200'
                }`}
                style={{ height: 'calc(100% - 4px)' }}
              />
            )}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-mono transition-colors ${
                step.completed
                  ? 'bg-[#76CA3E] text-[#143B0D]'
                  : step.current
                  ? 'bg-[#143B0D] text-white ring-4 ring-[#76CA3E]/20'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p
                  className={`text-sm font-bold ${
                    step.current ? 'text-[#143B0D]' : step.completed ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </p>
                {step.timestamp && <span className="text-xs font-mono text-slate-400">{step.timestamp}</span>}
              </div>
              {step.description && <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* =========================================================================
   KEY-VALUE LIST
========================================================================= */
export interface KeyValueItem {
  label: string;
  value: React.ReactNode;
}

export const KeyValueList: React.FC<{ items: KeyValueItem[]; columns?: 1 | 2 }> = ({
  items,
  columns = 1,
}) => {
  return (
    <dl className={`grid gap-3 ${columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-baseline justify-between py-1 border-b border-slate-100 last:border-none">
          <dt className="text-xs font-semibold text-slate-500">{item.label}</dt>
          <dd className="text-xs sm:text-sm font-bold text-slate-900 text-right">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
};

/* =========================================================================
   SKELETON LOADER
========================================================================= */
export const SkeletonLoader: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200/80 rounded animate-pulse"
          style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
        />
      ))}
    </div>
  );
};

/* =========================================================================
   EMPTY STATE BLOCK
========================================================================= */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="p-8 text-center flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200/80">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#F8FAF7] text-slate-400 flex items-center justify-center mb-3">
          {icon}
        </div>
      )}
      <h4 className="text-base font-bold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

/* =========================================================================
   ACCORDION
========================================================================= */
export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export const Accordion: React.FC<{ items: AccordionItem[] }> = ({ items }) => {
  const [openIds, setOpenIds] = useState<string[]>([]);

  const toggle = (id: string) => {
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div key={item.id}>
            <button
              onClick={() => toggle(item.id)}
              className="w-full p-4 flex items-center justify-between text-left text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <span>{item.title}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-[#143B0D]' : ''
                }`}
              />
            </button>
            {isOpen && <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
};

/* =========================================================================
   TOOLTIP
========================================================================= */
export const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 text-[11px] font-bold text-white bg-slate-900 rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none"
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   DROPDOWN MENU
========================================================================= */
export interface DropdownMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

export const DropdownMenu: React.FC<{
  trigger?: React.ReactNode;
  items: DropdownMenuItem[];
}> = ({ trigger, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-50 animate-scale-up">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-full px-3.5 py-2 text-xs font-semibold flex items-center gap-2.5 text-left transition-colors ${
                item.danger
                  ? 'text-rose-600 hover:bg-rose-50'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   FORM SECTION (Structured form cards with unsaved warnings)
========================================================================= */
export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hasUnsavedChanges?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  footer,
  hasUnsavedChanges,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        {hasUnsavedChanges && (
          <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded bg-amber-100 text-amber-900 border border-amber-300">
            Unsaved Changes
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5 space-y-4">{children}</div>
      {footer && <div className="p-3.5 sm:p-4 bg-slate-50/70 border-t border-slate-100">{footer}</div>}
    </div>
  );
};
