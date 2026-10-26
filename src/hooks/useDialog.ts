'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const dialogStack: symbol[] = [];
let savedBodyStyles: { overflow: string; touchAction: string } | null = null;

function lockScroll(id: symbol) {
  if (dialogStack.length === 0) {
    savedBodyStyles = {
      overflow: document.body.style.overflow,
      touchAction: document.body.style.touchAction,
    };
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }
  dialogStack.push(id);
}

function unlockScroll(id: symbol) {
  const index = dialogStack.indexOf(id);
  if (index !== -1) dialogStack.splice(index, 1);
  if (dialogStack.length === 0 && savedBodyStyles) {
    document.body.style.overflow = savedBodyStyles.overflow;
    document.body.style.touchAction = savedBodyStyles.touchAction;
    savedBodyStyles = null;
  }
}

/**
 * Modal dialog behavior: locks page scroll, traps Tab focus inside the panel,
 * closes on Escape, and restores focus to the previously focused element.
 * Attach the returned ref to the dialog panel element.
 */
export function useDialog<T extends HTMLElement = HTMLDivElement>(open: boolean, onClose: () => void) {
  const panelRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const id = Symbol('dialog');
    const previouslyFocused = document.activeElement as HTMLElement | null;
    lockScroll(id);

    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) {
      const firstFocusable = panel.querySelector<HTMLElement>('[data-autofocus]') ?? panel.querySelector<HTMLElement>(FOCUSABLE);
      (firstFocusable ?? panel).focus({ preventScroll: true });
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (dialogStack[dialogStack.length - 1] !== id) return;
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || !panelRef.current.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      unlockScroll(id);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [open]);

  return panelRef;
}
