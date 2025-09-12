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
    // No colored borders - consistent neutral appearance
    return '';
  };

  return (
    <div className="fixed bottom-32 right-8 z-50">
      <div
        className={`transition-all duration-300 ease-out transform ${
          shouldShow ? 'scale-1 opacity-1' : 'scale-0 opacity-0'
        }`}
        style={{
          transformOrigin: 'center',
        }}
      >
        <button
          onClick={onPlusClick}
          className={`min-h-[67px] min-w-[67px] w-[67px] h-[67px] rounded-full ${getBorderStyle()} aspect-square shadow-lg bg-white hover:bg-gray-50 active:scale-95 transition-all duration-200 flex items-center justify-center relative z-10`}
        >
          <Plus className="h-8 w-8 text-background" />
        </button>
      </div>
    </div>
  );
}
