'use client';

import { Plus } from 'lucide-react';
import { MetallicButton } from '@/components/ui/metallic-button';

type ViewType = 'insights' | 'food' | 'signals' | 'settings';

interface CentralPlusButtonProps {
  currentView: ViewType;
  onPlusClick: () => void;
}

export function CentralPlusButton({
  currentView,
  onPlusClick,
}: CentralPlusButtonProps) {
  const shouldShow = currentView === 'food' || currentView === 'signals';

  const getBorderStyle = () => {
    // No colored borders - consistent neutral appearance
    return '';
  };

  return (
    <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
      <div
        className="transition-all"
        style={{
          transform: shouldShow
            ? 'scale(1) rotate(0deg)'
            : 'scale(0.05) rotate(360deg)', // Even smaller start, full rotation
          opacity: shouldShow ? 1 : 0,
          transitionDuration: shouldShow ? '600ms' : '400ms', // Slower for visibility
          transitionTimingFunction: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', // More dramatic bounce
          transformOrigin: 'center',
        }}
      >
        <MetallicButton
          onClick={onPlusClick}
          size="lg"
          className={`min-h-[67px] min-w-[67px] w-[67px] h-[67px] rounded-full ${getBorderStyle()} aspect-square`}
          style={{
            transition: 'none', // Disable MetallicButton's built-in transitions
            transform: 'none', // Prevent transform conflicts
          }}
        >
          <Plus
            className="h-8 w-8 transition-all text-gray-700 dark:text-gray-200"
            style={{
              transform: shouldShow
                ? 'scale(1) rotate(0deg)'
                : 'scale(0.05) rotate(180deg)', // Match outer animation
              transitionDuration: shouldShow ? '600ms' : '400ms', // Match outer timing
              transitionTimingFunction: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', // Match bounce
              transformOrigin: 'center',
            }}
          />
        </MetallicButton>
      </div>
    </div>
  );
}
