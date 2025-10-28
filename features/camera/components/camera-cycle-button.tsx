/**
 * Camera Cycle Button Component
 *
 * Allows users to cycle through available rear-facing cameras.
 * Positioned in top-right corner with camera count badge.
 * Badge shows temporarily after button press then fades out.
 * Disabled when only one camera is available.
 */

'use client';

import { SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface CameraCycleButtonProps {
  onCycle: () => void;
  currentIndex: number;
  totalCameras: number;
  disabled?: boolean;
}

export function CameraCycleButton({
  onCycle,
  currentIndex,
  totalCameras,
  disabled = false,
}: CameraCycleButtonProps) {
  const [showBadge, setShowBadge] = useState(false);

  // Hide badge after 2 seconds
  useEffect(() => {
    if (showBadge) {
      const timer = setTimeout(() => {
        setShowBadge(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [showBadge]);

  // Don't render if only one camera available
  // IMPORTANT: This early return must come AFTER all hooks to comply with Rules of Hooks
  if (totalCameras <= 1) {
    return null;
  }

  const handleCycle = () => {
    onCycle();
    setShowBadge(true);
  };

  return (
    <div className="absolute top-6 right-4 z-30">
      <Button
        onClick={handleCycle}
        disabled={disabled}
        variant="secondary"
        size="icon"
        className="relative h-12 w-12 rounded-full bg-card/90 backdrop-blur-sm shadow-lg hover:bg-card border-2 border-white/40 transition-all"
        aria-label="Switch camera"
      >
        <SwitchCamera className="h-5 w-5 text-white" />

        {/* Camera count badge - shows temporarily after click */}
        <span
          className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md transition-all duration-300 ${
            showBadge
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-75 pointer-events-none'
          }`}
        >
          {currentIndex + 1}/{totalCameras}
        </span>
      </Button>
    </div>
  );
}
