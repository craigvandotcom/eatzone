'use client';

import { BarChart3, BookText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewType = 'insights' | 'entries' | 'settings';

interface BottomNavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function BottomNavigation({
  currentView,
  onViewChange,
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm rounded-t-J[40px] safe-area-pb bottom-nav bottom-nav-blur">
      <div className="flex items-center justify-around pt-2 pb-0 px-4 relative">
        <button
          className={cn(
            'flex flex-col items-center space-y-0.5 p-1.5 rounded-lg transition-all duration-150',
            currentView === 'insights'
              ? 'text-brand-primary scale-105'
              : 'text-muted-foreground scale-100',
            'active:scale-95 active:bg-muted/20'
          )}
          onClick={() => onViewChange('insights')}
        >
          <BarChart3 className="h-6 w-6" />
          <span className="text-xs font-medium">Insights</span>
        </button>

        <button
          className={cn(
            'flex flex-col items-center space-y-0.5 p-1.5 rounded-lg transition-all duration-150',
            currentView === 'entries'
              ? 'text-brand-primary scale-105'
              : 'text-muted-foreground scale-100',
            'active:scale-95 active:bg-muted/20'
          )}
          onClick={() => onViewChange('entries')}
        >
          <BookText className="h-6 w-6" />
          <span className="text-xs font-medium">Entries</span>
        </button>

        <button
          className={cn(
            'flex flex-col items-center space-y-0.5 p-1.5 rounded-lg transition-all duration-150',
            currentView === 'settings'
              ? 'text-brand-primary scale-105'
              : 'text-muted-foreground scale-100',
            'active:scale-95 active:bg-muted/20'
          )}
          onClick={() => onViewChange('settings')}
        >
          <Settings className="h-6 w-6" />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
