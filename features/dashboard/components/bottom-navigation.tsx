'use client';

import { BarChart3, Utensils, Activity, Settings } from 'lucide-react';

type ViewType = 'insights' | 'food' | 'signals' | 'settings';

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
          className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-lg ${
            currentView === 'insights'
              ? 'text-brand-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onViewChange('insights')}
        >
          <BarChart3 className="h-6 w-6" />
          <span className="text-xs font-medium">Insights</span>
        </button>

        <button
          className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-lg ${
            currentView === 'food'
              ? 'text-brand-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onViewChange('food')}
        >
          <Utensils className="h-6 w-6" />
          <span className="text-xs font-medium">Food</span>
        </button>

        <button
          className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-lg ${
            currentView === 'signals'
              ? 'text-brand-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onViewChange('signals')}
        >
          <Activity className="h-6 w-6" />
          <span className="text-xs font-medium">Signals</span>
        </button>

        <button
          className={`flex flex-col items-center space-y-0.5 p-1.5 rounded-lg ${
            currentView === 'settings'
              ? 'text-brand-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => onViewChange('settings')}
        >
          <Settings className="h-6 w-6" />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
