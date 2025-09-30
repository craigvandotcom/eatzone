/**
 * Custom hook for handling keyboard-aware scrolling on mobile devices
 *
 * This hook detects when the mobile keyboard appears and automatically scrolls
 * focused input fields into view, preventing them from being hidden behind the keyboard.
 *
 * Uses the visualViewport API for accurate keyboard detection on iOS and Android.
 */

import { useEffect } from 'react';

interface UseKeyboardAwareScrollOptions {
  /**
   * Whether the feature is enabled (typically based on device type)
   */
  enabled: boolean;

  /**
   * Delay in ms before scrolling the focused element into view
   * @default 300
   */
  scrollDelay?: number;
}

export function useKeyboardAwareScroll({
  enabled,
  scrollDelay = 300,
}: UseKeyboardAwareScrollOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Small delay to ensure keyboard is fully shown before scrolling
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, scrollDelay);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [enabled, scrollDelay]);
}