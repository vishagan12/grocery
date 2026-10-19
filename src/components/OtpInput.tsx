'use client';

import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  value: string[];
  onChange: (digits: string[]) => void;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
}

export default function OtpInput({ value, onChange, onComplete, autoFocus = true }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    const newDigits = [...value];

    if (!val) {
      newDigits[index] = '';
      onChange(newDigits);
      return;
    }

    // Take the last entered character if replacing
    const lastChar = val.slice(-1);
    newDigits[index] = lastChar;
    onChange(newDigits);

    // Auto-advance to next input
    if (index < 3 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 4 && onComplete) {
      onComplete(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Box is empty, focus previous and clear it
        const newDigits = [...value];
        newDigits[index - 1] = '';
        onChange(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else if (value[index]) {
        // Clear current box
        const newDigits = [...value];
        newDigits[index] = '';
        onChange(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pastedData) return;

    const newDigits = ['', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    onChange(newDigits);

    const focusIndex = Math.min(pastedData.length, 3);
    inputRefs.current[focusIndex]?.focus();

    if (pastedData.length === 4 && onComplete) {
      onComplete(pastedData);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 my-2">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none bg-white text-slate-900 shadow-2xs ${
            value[i]
              ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/30'
              : 'border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15'
          }`}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
