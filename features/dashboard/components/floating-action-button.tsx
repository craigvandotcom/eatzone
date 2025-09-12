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
      className="fixed bottom-24 right-6 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center z-50"
      data-testid="floating-action-button"
    >
      <Plus className="w-6 h-6 text-black" />
    </button>
  );
}
