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

  // Add debugging info for mobile troubleshooting
  const debugInfo = `FAB-${shouldShow ? 'visible' : 'hidden'}-${currentView}`;

  return (
    <div 
      className="fixed bottom-32 right-4 z-[60] md:right-8"
      data-testid="floating-action-button"
      data-debug={debugInfo}
    >
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
          className="w-[67px] h-[67px] min-w-[67px] min-h-[67px] rounded-full shadow-lg bg-white hover:bg-gray-50 active:scale-95 flex items-center justify-center relative z-10 border-0"
          style={{
            aspectRatio: '1',
            touchAction: 'manipulation',
          }}
        >
          <Plus className="h-8 w-8 text-background" />
        </button>
      </div>
      
      {/* Fallback button for mobile debugging - simpler styling */}
      {shouldShow && (
        <div 
          className="fixed bottom-20 right-2 z-[70] bg-red-500 text-white p-2 text-xs rounded md:hidden"
          style={{ fontSize: '10px' }}
        >
          FAB: {currentView}
        </div>
      )}
    </div>
  );
}
