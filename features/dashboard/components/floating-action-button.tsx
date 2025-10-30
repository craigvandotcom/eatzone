'use client';

import { useState } from 'react';
import { Plus, Utensils, Activity } from 'lucide-react';

type ViewType = 'insights' | 'entries' | 'settings';

interface FloatingActionButtonProps {
  currentView: ViewType;
  onFoodClick: () => void;
  onSignalClick: () => void;
}

export function FloatingActionButton({
  currentView,
  onFoodClick,
  onSignalClick,
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldShow = currentView === 'entries';

  const handleMainClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleFoodClick = () => {
    setIsExpanded(false);
    onFoodClick();
  };

  const handleSignalClick = () => {
    setIsExpanded(false);
    onSignalClick();
  };

  const handleBackdropClick = () => {
    setIsExpanded(false);
  };

  if (!shouldShow) return null;

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={handleBackdropClick}
        />
      )}

      {/* Sub FABs */}
      <div className="fixed bottom-32 right-8 z-50 flex flex-col items-center gap-3">
        {/* Signal FAB */}
        <button
          onClick={handleSignalClick}
          className={`w-16 h-16 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
            isExpanded
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          style={{
            transitionDelay: isExpanded ? '0ms' : '0ms',
            minWidth: '64px',
            minHeight: '64px',
            maxWidth: '64px',
            maxHeight: '64px',
          }}
        >
          <Activity className="w-6 h-6" />
        </button>

        {/* Food FAB */}
        <button
          onClick={handleFoodClick}
          className={`w-16 h-16 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
            isExpanded
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
          style={{
            transitionDelay: isExpanded ? '50ms' : '0ms',
            minWidth: '64px',
            minHeight: '64px',
            maxWidth: '64px',
            maxHeight: '64px',
          }}
        >
          <Utensils className="w-6 h-6" />
        </button>

        {/* Main FAB */}
        <button
          onClick={handleMainClick}
          className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            isExpanded
              ? 'bg-black text-white border-2 border-white'
              : 'bg-white text-gray-700 border-0'
          }`}
          data-testid="floating-action-button"
          style={{
            minWidth: '64px',
            minHeight: '64px',
            maxWidth: '64px',
            maxHeight: '64px',
            width: '64px',
            height: '64px',
            transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </>
  );
}
