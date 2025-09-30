/**
 * Camera Cycle Button Component
 *
 * Allows users to cycle through available rear-facing cameras.
 * Positioned in top-right corner with camera count badge.
 * Disabled when only one camera is available.
 */

'use client';

import { SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  // Don't render if only one camera available
  if (totalCameras <= 1) {
    return null;
  }

  return (
    <div className="absolute top-6 right-4 z-30">
      <Button
        onClick={onCycle}
        disabled={disabled}
        variant="secondary"
        size="icon"
        className="relative h-12 w-12 rounded-full bg-card/90 backdrop-blur-sm shadow-lg hover:bg-card border-2 border-white/40 transition-all"
        aria-label="Switch camera"
      >
        <SwitchCamera className="h-5 w-5 text-white" />

        {/* Camera count badge */}
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md">
          {currentIndex + 1}/{totalCameras}
        </span>
      </Button>
    </div>
  );
}
