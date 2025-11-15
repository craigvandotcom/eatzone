'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MultiCameraCapture } from '@/features/camera/components/multi-camera-capture';
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
import { EntriesView } from '@/features/dashboard/components/entries-view';
import { DesktopSidebar } from '@/features/dashboard/components/desktop-sidebar';
import { BottomNavigation } from '@/features/dashboard/components/bottom-navigation';
import { FloatingActionButton } from '@/features/dashboard/components/floating-action-button';
import { FullWidthHeader } from '@/components/ui/full-width-header';

// Import custom hooks
import {
  useDashboardData,
  useFoodsForDate,
  useFoodStatsForDate,
  useEntriesForDate,
} from '@/lib/hooks';
import { useAuth } from '@/features/auth/components/auth-provider';
import { useToast } from '@/components/ui/use-toast';
import { usePersistentTab } from '@/lib/hooks/use-persistent-tab';
import { getBase64ImageSize, formatFileSize } from '@/lib/utils/image-utils';

// Import data management functions

// Import symptom utilities

type ViewType = 'insights' | 'entries' | 'settings';

// Constants
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
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  // View state
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [currentView, setCurrentView] = usePersistentTab('insights');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Read view query param from URL and set view accordingly
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && ['insights', 'entries', 'settings'].includes(viewParam)) {
      setCurrentView(viewParam as ViewType);
    }
  }, [searchParams, setCurrentView]);

  // Date-specific data hooks - pass existing data to prevent duplicate API calls
  const { data: foodsForSelectedDate } = useFoodsForDate(
    selectedDate,
    allFoods
  );
  const { data: foodStatsForSelectedDate } = useFoodStatsForDate(selectedDate);
  const { data: entriesForSelectedDate } = useEntriesForDate(selectedDate);

  // Helper function to get ingredients for selected date
  const getIngredientsForSelectedDate = useCallback(() => {
    if (!foodsForSelectedDate) return [];
    return foodsForSelectedDate.flatMap(food => food.ingredients || []);
  }, [foodsForSelectedDate]);

  const handleViewChange = useCallback(
    (newView: ViewType) => {
      if (newView === currentView) return;
      setCurrentView(newView);
    },
    [currentView, setCurrentView]
  );

  // Prefetch food and symptom add page routes for faster navigation
  useEffect(() => {
    router.prefetch('/app/foods/add');
    router.prefetch('/app/symptoms/add');
  }, [router]);

  const handleCameraCapture = useCallback(
    async (images: string[]) => {
      try {
        if (images.length === 0) {
          logger.warn('No images provided to handleCameraCapture');
          return;
        }

        // Validate total size with streaming approach to prevent memory spikes
        let totalSize = 0;
        for (let i = 0; i < images.length; i++) {
          const imageSize = getBase64ImageSize(images[i]);
          totalSize += imageSize;

          // Early exit if we exceed the limit to save processing
          if (totalSize > MAX_IMAGE_SIZE) {
            toast({
              title: 'Images too large',
              description: `Total image size (${formatFileSize(totalSize)}) exceeds the ${formatFileSize(MAX_IMAGE_SIZE)} limit. Please try capturing fewer or smaller images.`,
              variant: 'destructive',
            });
            return;
          }
        }

        // Check current storage usage and estimate required space
        const imagesJson = JSON.stringify(images);
        const requiredStorage = new Blob([imagesJson]).size;
        const currentStorageUsed = new Blob([JSON.stringify(sessionStorage)])
          .size;
        const estimatedTotal = currentStorageUsed + requiredStorage;

        // Browser sessionStorage limit is typically 5-10MB, warn at 80% of 5MB
        const STORAGE_WARNING_LIMIT = 4 * 1024 * 1024; // 4MB warning threshold

        if (estimatedTotal > STORAGE_WARNING_LIMIT) {
          logger.warn('SessionStorage usage approaching limit', {
            currentUsage: formatFileSize(currentStorageUsed),
            requiredSpace: formatFileSize(requiredStorage),
            estimatedTotal: formatFileSize(estimatedTotal),
          });

          // Clear old pending images to make space
          sessionStorage.removeItem('pendingFoodImages');
          sessionStorage.removeItem('pendingFoodImage');
        }

        // Store all captured images as JSON array in sessionStorage
        sessionStorage.setItem('pendingFoodImages', imagesJson);

        // Fix C: Verify storage succeeded - detect truncation or quota exceeded
        const stored = sessionStorage.getItem('pendingFoodImages');
        if (!stored) {
          logger.error('SessionStorage write failed - data was not stored');
          toast({
            title: 'Storage error',
            description:
              'Failed to save images. Please try again with fewer or smaller images.',
            variant: 'destructive',
          });
          return;
        }

        // Verify stored data matches what we wrote (detects truncation)
        if (stored !== imagesJson) {
          logger.error('SessionStorage write failed - data was truncated', {
            expectedLength: imagesJson.length,
            actualLength: stored.length,
            difference: imagesJson.length - stored.length,
          });
          toast({
            title: 'Storage error',
            description:
              'Images too large for storage. Please try with fewer or smaller images.',
            variant: 'destructive',
          });
          return;
        }

        logger.debug('Images successfully stored in sessionStorage', {
          imageCount: images.length,
          storageSize: stored.length,
        });

        // Route is prefetched on mount for instant navigation
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
    // Route is prefetched on mount for instant navigation
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

  // No longer need central plus button handler - FAB handles it internally

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
        {/* Content Area */}
        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden ${isMobile ? 'pb-20' : ''}`}
        >
          {/* Full Width Header - Only for Entries view */}
          {currentView === 'entries' && (
            <FullWidthHeader
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              allFoods={allFoods}
              allSymptoms={allSymptoms}
            />
          )}

          <div
            className={`px-4 py-6 space-y-6 max-w-full ${currentView === 'entries' ? 'pt-20' : ''}`}
          >
            {/* pt-20 (~80px) accounts for fixed header height when entries view is active */}
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
            {currentView === 'entries' && (
              <ErrorBoundary fallback={SupabaseErrorFallback}>
                <EntriesView
                  entriesForSelectedDate={entriesForSelectedDate}
                  foodStatsForSelectedDate={foodStatsForSelectedDate}
                  getIngredientsForSelectedDate={getIngredientsForSelectedDate}
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
            onFoodClick={handleQuickCapture}
            onSignalClick={handleAddSymptom}
          />
        )}
      </div>

      {/* Camera Capture Modal */}
      <MultiCameraCapture
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
