'use client';

import { BarChart3, Utensils, Activity, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from '@/components/ui/sidebar';

type ViewType = 'insights' | 'food' | 'signals' | 'settings';

interface DesktopSidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function DesktopSidebar({
  currentView,
  onViewChange,
}: DesktopSidebarProps) {
  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          Body Compass
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentView === 'insights'}
                onClick={() => onViewChange('insights')}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Insights</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentView === 'food'}
                onClick={() => onViewChange('food')}
              >
                <Utensils className="h-4 w-4" />
                <span>Food</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentView === 'signals'}
                onClick={() => onViewChange('signals')}
              >
                <Activity className="h-4 w-4" />
                <span>Signals</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentView === 'settings'}
                onClick={() => onViewChange('settings')}
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
