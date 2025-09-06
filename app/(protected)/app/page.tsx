'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Utensils, Activity, Plus, Settings, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CameraCapture } from '@/features/camera/components/camera-capture';
import { MetallicButton } from '@/components/ui/metallic-button';
import { FoodCompositionBar } from '@/features/foods/components/food-composition-bar';
import { OrganicCompositionBar } from '@/features/foods/components/organic-composition-bar';
import { FoodZoneSummaryBar } from '@/features/foods/components/food-zone-summary-bar';
import { SymptomTimeline } from '@/features/symptoms/components/symptom-timeline';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { useIsMobile } from '@/components/ui/use-mobile';
import { AnimatedComponentErrorBoundary } from '@/components/animated-component-error-boundary';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarHeader,
} from '@/components/ui/sidebar';
import {
  FoodEntrySkeleton,
  SymptomEntrySkeleton,
  EmptyOrLoadingState,
} from '@/components/ui/loading-states';
import {
  ErrorBoundary,
  SupabaseErrorFallback,
} from '@/components/error-boundary';
import { logger } from '@/lib/utils/logger';
import { InsightsView } from '@/features/dashboard/components/insights-view';
import { SettingsView } from '@/features/dashboard/components/settings-view';
import { DayNavigationHeader } from '@/components/ui/day-navigation-header';

// Import types
import { Food, Symptom } from '@/lib/types';

// Import custom hooks
import {
  useDashboardData,
  useFoodsForDate,
  useSymptomsForDate,
  useFoodStatsForDate,
} from '@/lib/hooks';
import { useAuth } from '@/features/auth/components/auth-provider';
import { useToast } from '@/components/ui/use-toast';

// Import data management functions

// Import symptom utilities
import { getCategoryInfo } from '@/lib/symptoms/symptom-index';

type ViewType = 'insights' | 'food' | 'signals' | 'settings';

// Constants
const TRANSITION_DURATION = 150; // Half of fade duration in milliseconds
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB limit for sessionStorage

function Dashboard() {
  // Use consolidated dashboard data hook to prevent infinite loops
  const {
    data: dashboardData,
    // error: dashboardError,
    // mutate: retryDashboard,
  } = useDashboardData();

  // Settings state management
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const { user, logout } = useAuth();

  // Extract data from consolidated hook
  const recentFoods = dashboardData?.recentFoods;
  const recentSymptoms = dashboardData?.recentSymptoms;
  const allFoods = dashboardData?.allFoods;
  const allSymptoms = dashboardData?.allSymptoms;

  const router = useRouter();
  const isMobile = useIsMobile();

  // View state
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('insights');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Date-specific data hooks - pass existing data to prevent duplicate API calls
  const { data: foodsForSelectedDate } = useFoodsForDate(
    selectedDate,
    allFoods
  );
  const { data: symptomsForSelectedDate } = useSymptomsForDate(
    selectedDate,
    allSymptoms
  );
  const { data: foodStatsForSelectedDate } = useFoodStatsForDate(selectedDate);

  // Helper function to get ingredients for selected date
  const getIngredientsForSelectedDate = useCallback(() => {
    if (!foodsForSelectedDate) return [];
    return foodsForSelectedDate.flatMap(food => food.ingredients || []);
  }, [foodsForSelectedDate]);

  // Ref to store timeout ID for cleanup
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleViewChange = useCallback(
    (newView: ViewType) => {
      if (newView === currentView) return;

      // Clear any existing timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      setIsTransitioning(true);
      transitionTimeoutRef.current = setTimeout(() => {
        setCurrentView(newView);
        setIsTransitioning(false);
        transitionTimeoutRef.current = null;
      }, TRANSITION_DURATION);
    },
    [currentView]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handleCameraCapture = useCallback(
    async (imageData: string) => {
      try {
        // Validate image data size before storing (sessionStorage has ~5MB limit)
        const imageSize = new Blob([imageData]).size;

        if (imageSize > MAX_IMAGE_SIZE) {
          toast({
            title: 'Image too large',
            description:
              'Please try capturing a smaller image or use manual entry.',
            variant: 'destructive',
          });
          return;
        }

        // Store the image data temporarily in sessionStorage for the add food page
        sessionStorage.setItem('pendingFoodImage', imageData);
        router.push('/app/foods/add');
      } catch (error) {
        logger.error('Failed to store image data', error);
        toast({
          title: 'Failed to save image',
          description: 'Please try again or use manual entry.',
          variant: 'destructive',
        });
      }
    },
    [router, toast]
  );

  const handleManualEntry = useCallback(() => {
    router.push('/app/foods/add');
  }, [router]);

  const handleQuickCapture = useCallback(() => {
    setShowCameraCapture(true);
  }, []);

  // Get the active tab styling based on current view
  const getActiveTabStyle = (view: ViewType) => {
    if (currentView !== view)
      return 'text-muted-foreground hover:text-foreground';

    switch (view) {
      case 'insights':
        return 'text-blue-600';
      case 'food':
        return 'text-green-600';
      case 'signals':
        return 'text-red-600';
      case 'settings':
        return 'text-purple-600';
      default:
        return 'text-foreground';
    }
  };

  const handleEditFood = useCallback(
    (food: Food) => {
      router.push(`/app/foods/edit/${food.id}`);
    },
    [router]
  );

  const handleEditSymptom = useCallback(
    (symptom: Symptom) => {
      router.push(`/app/symptoms/edit/${symptom.id}`);
    },
    [router]
  );

  const handleAddSymptom = useCallback(() => {
    router.push('/app/symptoms/add');
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      });
      router.push('/');
    } catch (error) {
      logger.error('Logout failed', error);
      toast({
        title: 'Logout failed',
        description: 'There was an error logging out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Desktop sidebar navigation
  const DesktopSidebar = () => (
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
                onClick={() => handleViewChange('insights')}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Insights</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentView === 'food'}
                onClick={() => handleViewChange('food')}
              >
                <Utensils className="h-4 w-4" />
                <span>Food</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentView === 'signals'}
                onClick={() => handleViewChange('signals')}
              >
                <Activity className="h-4 w-4" />
                <span>Signals</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={currentView === 'settings'}
                onClick={() => handleViewChange('settings')}
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

  // Central Plus Button handler
  const handlePlusClick = useCallback(() => {
    if (currentView === 'food') {
      handleQuickCapture();
    } else if (currentView === 'signals') {
      handleAddSymptom();
    }
  }, [currentView, handleQuickCapture, handleAddSymptom]);

  // Central Plus Button component with organic bubble pop animation
  const CentralPlusButton = () => {
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
      <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
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
          <MetallicButton
            onClick={handlePlusClick}
            size="lg"
            className={`min-h-[67px] min-w-[67px] w-[67px] h-[67px] rounded-full ${getBorderStyle()} aspect-square`}
            style={{
              transition: 'none', // Disable MetallicButton's built-in transitions
              transform: 'none', // Prevent transform conflicts
            }}
          >
            <Plus
              className="h-8 w-8 transition-all text-gray-700 dark:text-gray-200"
              style={{
                transform: shouldShow
                  ? 'scale(1) rotate(0deg)'
                  : 'scale(0.05) rotate(180deg)', // Match outer animation
                transitionDuration: shouldShow ? '600ms' : '400ms', // Match outer timing
                transitionTimingFunction: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', // Match bounce
                transformOrigin: 'center',
              }}
            />
          </MetallicButton>
        </div>
      </div>
    );
  };

  // Bottom Navigation component with synchronized icon spacing
  const BottomNavigation = () => {
    const tabs = [
      { id: 'insights' as ViewType, label: 'Insights', icon: BarChart3 },
      { id: 'food' as ViewType, label: 'Food', icon: Utensils },
      { id: 'signals' as ViewType, label: 'Signals', icon: Activity },
      { id: 'settings' as ViewType, label: 'Settings', icon: Settings },
    ];

    const isPlusButtonVisible =
      currentView === 'food' || currentView === 'signals';

    // Get transform style for Food and Signals icons with staggered spring physics
    const getIconTransform = (tabId: ViewType) => {
      if (!isPlusButtonVisible) {
        return {
          transform: 'translateX(0) scale(1)',
          transitionDuration: '600ms', // Slower return animation
          transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.4)', // Bounce return
          transitionDelay: '0ms',
        };
      }

      if (tabId === 'food') {
        return {
          transform: 'translateX(-40px) scale(1)', // Movement only, no scaling
          transitionDuration: '800ms', // Slower for visibility
          transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.6)', // More bounce
          transitionDelay: '0ms',
        };
      } else if (tabId === 'signals') {
        return {
          transform: 'translateX(40px) scale(1)', // Movement only, no scaling
          transitionDuration: '800ms', // Slower for visibility
          transitionTimingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.6)', // More bounce
          transitionDelay: '100ms', // Longer stagger delay
        };
      }

      return {
        transform: 'translateX(0) scale(1)',
        transitionDuration: '400ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        transitionDelay: '0ms',
      };
    };

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
        <div className="relative">
          <CentralPlusButton />
          <div className="flex items-center h-20">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleViewChange(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full px-2 py-3 transition-all ${getActiveTabStyle(tab.id)}`}
                style={getIconTransform(tab.id)}
              >
                <tab.icon
                  className={`h-6 w-6 mb-1 transition-transform duration-200 ${
                    currentView === tab.id ? 'scale-110' : ''
                  }`}
                />
                <span className="text-sm font-medium">{tab.label}</span>
                {currentView === tab.id && !isTransitioning && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-current rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex bg-background ${isMobile ? 'mobile-container h-[100dvh]' : 'h-[100dvh]'}`}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <SidebarProvider>
          <DesktopSidebar />
        </SidebarProvider>
      )}

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col min-h-0">
        {/* Content Area with Fade Transition */}
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden ${isMobile ? 'pb-20' : ''} transition-opacity duration-300 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="px-4 py-6 space-y-6 max-w-full">
            {currentView === 'insights' && (
              <InsightsView
                recentFoods={recentFoods}
                recentSymptoms={recentSymptoms}
                allFoods={allFoods}
                allSymptoms={allSymptoms}
              />
            )}
            {currentView === 'settings' && (
              <SettingsView
                user={user}
                isLoggingOut={isLoggingOut}
                handleLogout={handleLogout}
              />
            )}
            {currentView === 'food' && (
              <ErrorBoundary fallback={SupabaseErrorFallback}>
                {/* Day Navigation Header */}
                <DayNavigationHeader
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  allFoods={allFoods}
                  allSymptoms={allSymptoms}
                />

                {/* Food Zone Summary Bar for Selected Date */}
                <div className="space-y-4">
                  {foodStatsForSelectedDate === undefined ? (
                    <div className="bg-green-50 rounded-lg p-4 h-32 flex items-center justify-center">
                      <div className="animate-pulse text-gray-500">
                        Loading food data...
                      </div>
                    </div>
                  ) : (
                    <FoodZoneSummaryBar
                      ingredients={getIngredientsForSelectedDate()}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                      Food Entries
                    </h2>
                    <span className="text-muted-foreground text-sm">
                      {foodsForSelectedDate?.length || 0} entries
                    </span>
                  </div>
                  <div className="space-y-3">
                    <EmptyOrLoadingState
                      isLoading={foodsForSelectedDate === undefined}
                      isEmpty={foodsForSelectedDate?.length === 0}
                      loadingMessage="Loading foods for selected date..."
                      emptyTitle="No foods logged for this date"
                      emptyDescription="Tap the eat icon below to add a food entry"
                      emptyIcon="🍽️"
                    />
                    {foodsForSelectedDate === undefined && (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <FoodEntrySkeleton key={i} />
                        ))}
                      </div>
                    )}
                    {foodsForSelectedDate &&
                      foodsForSelectedDate.length > 0 && (
                        <div className="space-y-3 overflow-hidden">
                          {foodsForSelectedDate.map(food => (
                            <Card
                              key={food.id}
                              className="cursor-pointer hover:shadow-xl transition-shadow duration-200"
                              onClick={() => handleEditFood(food)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    {food.photo_url ? (
                                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                                        <Image
                                          src={
                                            food.photo_url || '/placeholder.svg'
                                          }
                                          alt={food.name}
                                          className="w-full h-full object-cover"
                                          width={48}
                                          height={48}
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-lg">
                                          🍽️
                                        </span>
                                      </div>
                                    )}
                                    <div className="text-left flex-1 min-w-0">
                                      <p className="font-medium text-foreground truncate">
                                        {food.status === 'analyzing'
                                          ? 'New Food'
                                          : food.name}
                                      </p>
                                      <p className="text-sm text-muted-foreground truncate">
                                        {food.ingredients
                                          ?.map(ing => ing.name)
                                          .join(', ') || 'No ingredients'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 flex items-center space-x-2 ml-2">
                                    <div className="w-16 sm:w-20 md:w-24 space-y-1.5">
                                      <AnimatedComponentErrorBoundary>
                                        <FoodCompositionBar
                                          ingredients={food.ingredients || []}
                                        />
                                      </AnimatedComponentErrorBoundary>
                                      <AnimatedComponentErrorBoundary>
                                        <OrganicCompositionBar
                                          ingredients={food.ingredients || []}
                                        />
                                      </AnimatedComponentErrorBoundary>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </ErrorBoundary>
            )}

            {currentView === 'signals' && (
              <ErrorBoundary fallback={SupabaseErrorFallback}>
                {/* Day Navigation Header */}
                <DayNavigationHeader
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  allFoods={allFoods}
                  allSymptoms={allSymptoms}
                />

                {/* Symptom Timeline for Selected Date */}
                <div className="space-y-4">
                  {symptomsForSelectedDate === undefined ? (
                    <div className="bg-red-50 rounded-lg p-4 h-32 flex items-center justify-center">
                      <div className="animate-pulse text-gray-500">
                        Loading symptom data...
                      </div>
                    </div>
                  ) : (
                    <SymptomTimeline symptoms={symptomsForSelectedDate} />
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                      Signal Entries
                    </h2>
                    <span className="text-muted-foreground text-sm">
                      {symptomsForSelectedDate?.length || 0} entries
                    </span>
                  </div>
                  <div className="space-y-3">
                    <EmptyOrLoadingState
                      isLoading={symptomsForSelectedDate === undefined}
                      isEmpty={symptomsForSelectedDate?.length === 0}
                      loadingMessage="Loading symptoms for selected date..."
                      emptyTitle="No signals logged for this date"
                      emptyDescription="Tap the signals icon below to add a symptom entry"
                      emptyIcon="⚡"
                    />
                    {symptomsForSelectedDate === undefined && (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <SymptomEntrySkeleton key={i} />
                        ))}
                      </div>
                    )}
                    {symptomsForSelectedDate &&
                      symptomsForSelectedDate.length > 0 &&
                      symptomsForSelectedDate.map(symptom => (
                        <Card
                          key={symptom.id}
                          className="cursor-pointer hover:shadow-xl transition-shadow duration-200"
                          onClick={() => handleEditSymptom(symptom)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-lg">
                                    {getCategoryInfo(symptom.category)?.icon ||
                                      '⚡'}
                                  </span>
                                </div>
                                <div className="text-left">
                                  <p className="font-medium text-foreground">
                                    {symptom.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(symptom.timestamp).toLocaleString(
                                      'en-US',
                                      {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                      }
                                    )}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {symptom.category}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              </ErrorBoundary>
            )}
          </div>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        {isMobile && <BottomNavigation />}
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        open={showCameraCapture}
        onOpenChange={setShowCameraCapture}
        onCapture={handleCameraCapture}
        onManualEntry={handleManualEntry}
        title="Capture Food"
      />
    </div>
  );
}

export default function ProtectedDashboard() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}
