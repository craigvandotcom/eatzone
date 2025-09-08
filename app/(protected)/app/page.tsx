'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CameraCapture } from '@/features/camera/components/camera-capture';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { useIsMobile } from '@/components/ui/use-mobile';
import { SidebarProvider } from '@/components/ui/sidebar';
import { logger } from '@/lib/utils/logger';
import {
  ErrorBoundary,
  SupabaseErrorFallback,
} from '@/components/error-boundary';
import { InsightsView } from '@/features/dashboard/components/insights-view';
import { SettingsView } from '@/features/dashboard/components/settings-view';
import { FoodView } from '@/features/dashboard/components/food-view';
import { SignalsView } from '@/features/dashboard/components/signals-view';
import { DesktopSidebar } from '@/features/dashboard/components/desktop-sidebar';
import { BottomNavigation } from '@/features/dashboard/components/bottom-navigation';
import { FloatingActionButton } from '@/features/dashboard/components/floating-action-button';

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
        router.replace('/app/foods/add');
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
    router.replace('/app/foods/add');
  }, [router]);

  const handleQuickCapture = useCallback(() => {
    setShowCameraCapture(true);
  }, []);

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

  // Central Plus Button handler
  const handlePlusClick = useCallback(() => {
    if (currentView === 'food') {
      handleQuickCapture();
    } else if (currentView === 'signals') {
      handleAddSymptom();
    }
  }, [currentView, handleQuickCapture, handleAddSymptom]);

  return (
    <div
      className={`flex bg-background ${isMobile ? 'mobile-container h-[100dvh]' : 'h-[100dvh]'}`}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <SidebarProvider>
          <DesktopSidebar
            currentView={currentView}
            onViewChange={handleViewChange}
          />
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
              <ErrorBoundary fallback={SupabaseErrorFallback}>
                <InsightsView
                  recentFoods={recentFoods}
                  recentSymptoms={recentSymptoms}
                  allFoods={allFoods}
                  allSymptoms={allSymptoms}
                />
              </ErrorBoundary>
            )}
            {currentView === 'settings' && (
              <ErrorBoundary fallback={SupabaseErrorFallback}>
                <SettingsView
                  user={user}
                  isLoggingOut={isLoggingOut}
                  handleLogout={handleLogout}
                />
              </ErrorBoundary>
            )}
            {currentView === 'food' && (
              <ErrorBoundary fallback={SupabaseErrorFallback}>
                <FoodView
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  allFoods={allFoods}
                  allSymptoms={allSymptoms}
                  foodsForSelectedDate={foodsForSelectedDate}
                  foodStatsForSelectedDate={foodStatsForSelectedDate}
                  getIngredientsForSelectedDate={getIngredientsForSelectedDate}
                />
              </ErrorBoundary>
            )}

            {currentView === 'signals' && (
              <ErrorBoundary fallback={SupabaseErrorFallback}>
                <SignalsView
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  allFoods={allFoods}
                  allSymptoms={allSymptoms}
                  symptomsForSelectedDate={symptomsForSelectedDate}
                />
              </ErrorBoundary>
            )}
          </div>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        {isMobile && (
          <BottomNavigation
            currentView={currentView}
            onViewChange={handleViewChange}
          />
        )}

        {/* Floating Action Button - Mobile Only */}
        {isMobile && (
          <FloatingActionButton
            currentView={currentView}
            onPlusClick={handlePlusClick}
          />
        )}
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
