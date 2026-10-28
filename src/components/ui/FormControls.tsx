'use client';

import React, { forwardRef } from 'react';
import { Search, Calendar, AlertCircle } from 'lucide-react';

/* =========================================================================
   TEXT INPUT
========================================================================= */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, className = '', id, disabled, ...props }, ref) => {
    const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={generatedId} className="block text-xs font-bold text-slate-700 tracking-wide">
            {label}
            {props.required && <span className="text-rose-600 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && <span className="absolute left-3 text-slate-400 pointer-events-none">{leftIcon}</span>}
          <input
            ref={ref}
            id={generatedId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${generatedId}-error` : helperText ? `${generatedId}-help` : undefined}
            className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-150 min-h-[44px]
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${
                error
                  ? 'border-rose-400 ring-2 ring-rose-100 focus:border-rose-600'
                  : 'border-slate-300 focus:border-[#143B0D] focus:ring-2 focus:ring-[#76CA3E]/30'
              }
              disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {rightIcon && <span className="absolute right-3 text-slate-400 pointer-events-none">{rightIcon}</span>}
        </div>
        {error && (
          <p id={`${generatedId}-error`} className="flex items-center gap-1 text-xs font-semibold text-rose-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && (
          <p id={`${generatedId}-help`} className="text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

/* =========================================================================
   SEARCH INPUT
========================================================================= */
export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        placeholder="Search orders, products, or customers..."
        className={`bg-slate-50 hover:bg-white focus:bg-white ${className}`}
        {...props}
      />
    );
  }
);
SearchInput.displayName = 'SearchInput';

/* =========================================================================
   TEXTAREA
========================================================================= */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = '', id, disabled, rows = 3, ...props }, ref) => {
    const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={generatedId} className="block text-xs font-bold text-slate-700 tracking-wide">
            {label}
            {props.required && <span className="text-rose-600 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={generatedId}
          rows={rows}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-150
            ${
              error
                ? 'border-rose-400 ring-2 ring-rose-100 focus:border-rose-600'
                : 'border-slate-300 focus:border-[#143B0D] focus:ring-2 focus:ring-[#76CA3E]/30'
            }
            disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error && (
          <p className="flex items-center gap-1 text-xs font-semibold text-rose-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

/* =========================================================================
   SELECT DROPDOWN
========================================================================= */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: Array<{ value: string | number; label: string }>;
  helperText?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, children, helperText, error, className = '', id, disabled, ...props }, ref) => {
    const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={generatedId} className="block text-xs font-bold text-slate-700 tracking-wide">
            {label}
            {props.required && <span className="text-rose-600 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={generatedId}
          disabled={disabled}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all duration-150 min-h-[44px] cursor-pointer
            ${
              error
                ? 'border-rose-400 ring-2 ring-rose-100 focus:border-rose-600'
                : 'border-slate-300 focus:border-[#143B0D] focus:ring-2 focus:ring-[#76CA3E]/30'
            }
            disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        {!error && helperText && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

/* =========================================================================
   CHECKBOX
========================================================================= */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', id, ...props }, ref) => {
    const generatedId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <label htmlFor={generatedId} className="flex items-start gap-3 cursor-pointer select-none group min-h-[36px]">
        <input
          ref={ref}
          type="checkbox"
          id={generatedId}
          className={`mt-0.5 w-4 h-4 rounded border-slate-300 text-[#143B0D] accent-[#76CA3E] focus:ring-2 focus:ring-[#76CA3E]/30 cursor-pointer ${className}`}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-semibold text-slate-800 leading-tight">{label}</span>}
            {description && <span className="text-xs text-slate-500 mt-0.5">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

/* =========================================================================
   TOGGLE SWITCH
========================================================================= */
export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
}) => {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143B0D] focus-visible:ring-offset-2
          ${size === 'sm' ? 'w-9 h-5' : 'w-11 h-6'}
          ${checked ? 'bg-[#76CA3E]' : 'bg-slate-300'}`}
      >
        <span
          className={`inline-block rounded-full bg-white shadow transform transition-transform duration-200
            ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}
            ${checked ? (size === 'sm' ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0.5'}`}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-bold text-slate-800">{label}</span>}
          {description && <span className="text-xs text-slate-500">{description}</span>}
        </div>
      )}
    </label>
  );
};

/* =========================================================================
   DATE INPUT
========================================================================= */
export interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(({ label, className = '', ...props }, ref) => {
  return (
    <Input
      ref={ref}
      type="date"
      label={label}
      leftIcon={<Calendar className="w-4 h-4 text-slate-400" />}
      className={className}
      {...props}
    />
  );
});
DateInput.displayName = 'DateInput';
