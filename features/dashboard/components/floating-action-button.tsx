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

  if (!shouldShow) return null;

  return (
    <button
      onClick={onPlusClick}
      className="fixed bottom-32 right-8 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center z-50 border-0 flex-shrink-0"
      data-testid="floating-action-button"
      style={{ 
        minWidth: '64px', 
        minHeight: '64px',
        maxWidth: '64px',
        maxHeight: '64px',
        width: '64px',
        height: '64px'
      }}
    >
      <Plus className="w-7 h-7 text-gray-700" />
    </button>
  );
}
