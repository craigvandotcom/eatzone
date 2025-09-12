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
        className={`transition-all duration-300 ease-out transform ${
          shouldShow ? 'scale-1 opacity-1' : 'scale-0 opacity-0'
        }`}
        style={{
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
          <Plus className="h-8 w-8 text-gray-700 dark:text-gray-200" />
        </MetallicButton>
      </div>
    </div>
  );
}
