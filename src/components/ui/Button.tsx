'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      loading = false,
      isLoading,
      disabled = false,
      icon,
      iconPosition = 'left',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex flex-row items-center justify-center font-bold tracking-tight rounded-xl transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143B0D] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 whitespace-nowrap';

    const variantStyles = {
      // Apple green primary with Forest text for AA contrast compliance
      primary: 'bg-[#76CA3E] text-[#143B0D] hover:bg-[#60B328] shadow-xs active:bg-[#60B328]',
      // Forest deep green secondary
      secondary: 'bg-[#143B0D] text-white hover:bg-[#1E4D12] shadow-xs active:bg-[#1E4D12]',
      // Outline with brand border
      outline:
        'bg-white text-[#143B0D] border border-[#CBD5E1] hover:bg-[#F1F9EC] hover:border-[#76CA3E] shadow-2xs',
      // Ghost transparent
      ghost: 'bg-transparent text-[#143B0D] hover:bg-[#F1F9EC] active:bg-[#EAEFE7]',
      // Destructive Rose danger
      danger: 'bg-[#BA1A1A] text-white hover:bg-[#930006] shadow-xs active:bg-[#930006]',
    };

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
      md: 'text-sm px-4 py-2 min-h-[44px] gap-2',
      lg: 'text-base px-5 py-3 min-h-[50px] gap-2.5',
      icon: 'p-2 min-h-[44px] min-w-[44px] rounded-xl',
    };

    const isBusy = Boolean(loading || isLoading);
    const isDisabled = disabled || isBusy;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isBusy}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isBusy && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
        {!isBusy && icon && iconPosition === 'left' && <span className="shrink-0 inline-flex items-center">{icon}</span>}
        {children && <span className="inline-flex flex-row items-center gap-1.5 whitespace-nowrap">{children}</span>}
        {!isBusy && icon && iconPosition === 'right' && <span className="shrink-0 inline-flex items-center">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
