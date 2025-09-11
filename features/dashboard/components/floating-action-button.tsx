'use client';

import { Plus } from 'lucide-react';

type ViewType = 'insights' | 'food' | 'signals' | 'settings';

interface FloatingActionButtonProps {
  currentView: ViewType;
  onPlusClick: () => void;
}

export function FloatingActionButton({
  currentView,
  onPlusClick,
}: FloatingActionButtonProps) {
  const shouldShow = currentView === 'food' || currentView === 'signals';

  const getBorderStyle = () => {
    if (currentView === 'food') {
      return 'border-2 border-green-600 hover:border-green-700';
    } else if (currentView === 'signals') {
      return 'border-2 border-red-600 hover:border-red-700';
    }
    return 'border-2 border-foreground';
  };

  return (
    <div className="fixed bottom-32 right-8 z-50">
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
        <button
          onClick={onPlusClick}
          className={`min-h-[67px] min-w-[67px] w-[67px] h-[67px] rounded-full ${getBorderStyle()} aspect-square shadow-lg bg-white hover:bg-gray-50 active:scale-95 transition-all duration-200 flex items-center justify-center`}
        >
          <Plus
            className="h-8 w-8 transition-all text-background"
            style={{
              transform: shouldShow
                ? 'scale(1) rotate(0deg)'
                : 'scale(0.05) rotate(180deg)', // Match outer animation
              transitionDuration: shouldShow ? '600ms' : '400ms', // Match outer timing
              transitionTimingFunction: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', // Match bounce
              transformOrigin: 'center',
            }}
          />
        </button>
      </div>
    </div>
  );
}
