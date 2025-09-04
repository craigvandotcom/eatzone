'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Utensils,
  Activity,
  Plus,
  Leaf,
  Settings,
  BarChart3,
  RefreshCw,
  TrendingUp,
  PieChart,
  LineChart,
  Calendar,
  Clock,
  User,
  Download,
  Upload,
  Trash2,
  TestTube,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CameraCapture } from '@/features/camera/components/camera-capture';
import { MetallicButton } from '@/components/ui/metallic-button';
import { FoodCategoryProgress } from '@/features/foods/components/food-category-progress';
import { FoodCompositionBar } from '@/features/foods/components/food-composition-bar';
import { OrganicCompositionBar } from '@/features/foods/components/organic-composition-bar';
import { VerticalProgressBar } from '@/features/foods/components/vertical-progress-bar';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { useIsMobile } from '@/components/ui/use-mobile';
import { needsZoningRetry } from '@/lib/utils/food-zoning';
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
import { getZoneBgClass, getZoneTextClass } from '@/lib/utils/zone-colors';
import {
  FoodEntrySkeleton,
  SymptomEntrySkeleton,
  ProgressCircleSkeleton,
  EmptyOrLoadingState,
  NetworkRetryState,
} from '@/components/ui/loading-states';
import {
  ErrorBoundary,
  SupabaseErrorFallback,
} from '@/components/error-boundary';
import { logger } from '@/lib/utils/logger';

// Import types
import { Food, Symptom } from '@/lib/types';

// Import custom hooks
import { useDashboardData } from '@/lib/hooks';
import { useAuth } from '@/features/auth/components/auth-provider';
import { useTheme } from 'next-themes';
import { useToast } from '@/components/ui/use-toast';

// Import data management functions
import { exportAllData, importAllData, clearAllData, addFood } from '@/lib/db';

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
    error: dashboardError,
    mutate: retryDashboard,
  } = useDashboardData();

  // Settings state management
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  // Extract data from consolidated hook
  const recentFoods = dashboardData?.recentFoods;
  const recentSymptoms = dashboardData?.recentSymptoms;
  const todaysSymptoms = dashboardData?.todaysSymptoms;
  const foodStats = dashboardData?.foodStats;

  // Use single error and retry for all data
  const foodsError = dashboardError;
  const recentSymptomsError = dashboardError;
  const statsError = dashboardError;
  const retryFoods = retryDashboard;
  const retryRecentSymptoms = retryDashboard;
  const retryStats = retryDashboard;

  const router = useRouter();
  const isMobile = useIsMobile();

  // View state
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('insights');
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Settings handler functions
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();

      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data exported successfully',
        description: `Exported ${data.foods.length} foods and ${data.symptoms.length} symptoms.`,
      });
    } catch (error) {
      logger.error('Export failed', error);
      toast({
        title: 'Export failed',
        description:
          'There was an error exporting your data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate the data structure
      if (!data.foods || !data.symptoms) {
        throw new Error('Invalid backup file format');
      }

      await importAllData(data);

      toast({
        title: 'Data imported successfully',
        description: `Imported ${data.foods.length} foods and ${data.symptoms.length} symptoms.`,
      });
    } catch (error) {
      logger.error('Import failed', error);
      toast({
        title: 'Import failed',
        description:
          'There was an error importing your data. Please check the file format and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await clearAllData();
      toast({
        title: 'All data cleared',
        description:
          'All your health tracking data has been permanently deleted.',
      });
    } catch (error) {
      logger.error('Clear failed', error);
      toast({
        title: 'Clear failed',
        description: 'There was an error clearing your data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

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

  const handleAddTestData = async () => {
    setIsAddingTest(true);
    try {
      // Add a test food with organic and non-organic ingredients
      await addFood({
        name: 'Test Organic Meal',
        ingredients: [
          {
            name: 'organic spinach',
            organic: true,
            zone: 'green',
            group: 'Leafy Greens',
            category: 'Vegetables',
          },
          {
            name: 'organic quinoa',
            organic: true,
            zone: 'green',
            group: 'Pseudo-Grains',
            category: 'Grains & Starches',
          },
          {
            name: 'salmon',
            organic: false,
            zone: 'green',
            group: 'Wild-Caught Seafood',
            category: 'Proteins',
          },
        ],
        status: 'processed',
        notes: 'Test data to verify organic tracking',
      });

      toast({
        title: 'Test data added',
        description:
          'Added a test meal with 2/3 organic ingredients to verify the organic tracking works.',
      });
    } catch (error) {
      logger.error('Failed to add test data', error);
      toast({
        title: 'Test data failed',
        description: 'There was an error adding test data.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingTest(false);
    }
  };

  const handleRetryZoning = async (
    e: React.MouseEvent | React.KeyboardEvent,
    foodId: string
  ) => {
    e.stopPropagation(); // Prevent triggering the edit food handler

    try {
      const { retryFoodZoningManually } = await import(
        '@/lib/background-zoning'
      );
      const success = await retryFoodZoningManually(foodId);

      if (success) {
        // Refresh dashboard data to show updated zones
        retryDashboard();
      }
    } catch (error) {
      logger.error('Manual retry failed', error);
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

  // InsightsView component
  const InsightsView = () => (
    <div className="space-y-6">
      {/* Coming Soon Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analytics Coming Soon
          </CardTitle>
          <CardDescription>
            Advanced insights and trend analysis for your health data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              What&apos;s Coming
            </h4>
            <p className="text-xs text-blue-700">
              This section will provide deep insights into your health patterns,
              correlations between different metrics, and trends over time.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <LineChart className="h-4 w-4" />
              Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Visualize how your health metrics change over time with
              interactive charts.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Correlation Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Discover relationships between different health inputs and
              outputs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <PieChart className="h-4 w-4" />
              Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Get an overall health score based on your tracked metrics.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Pattern Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Identify recurring patterns and cycles in your health data.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Data Summary
          </CardTitle>
          <CardDescription>
            Basic overview of your tracked data (placeholder).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div
              className={`p-4 ${getZoneBgClass('green', 'light')} rounded-lg`}
            >
              <div
                className={`text-2xl font-bold ${getZoneTextClass('green')}`}
              >
                {recentFoods?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Foods</div>
            </div>
            <div className={`p-4 ${getZoneBgClass('red', 'light')} rounded-lg`}>
              <div className={`text-2xl font-bold ${getZoneTextClass('red')}`}>
                {recentSymptoms?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Symptoms</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // SettingsView component
  const SettingsView = () => (
    <div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your account details and privacy information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">
                {user?.email || 'Not available'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Account Created
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Last Login</p>
              <p className="text-sm text-muted-foreground">N/A</p>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Privacy Reminder
            </h4>
            <p className="text-xs text-blue-700">
              Your account and all health data are stored securely with
              Supabase. Regular data exports are recommended for backup
              purposes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export, import, or delete your health tracking data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium text-foreground">Export Data</p>
            <p className="text-sm text-muted-foreground mb-3">
              Download all your data as a JSON file. This is your primary backup
              method.
            </p>
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export All Data'}
            </Button>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Import Data</p>
            <p className="text-sm text-muted-foreground mb-3">
              Upload a previously exported JSON file to restore your data.
            </p>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
              <Button
                onClick={() => document.getElementById('import-file')?.click()}
                disabled={isImporting}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? 'Importing...' : 'Import Data'}
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Danger Zone</p>
            <p className="text-sm text-muted-foreground mb-3">
              Permanently delete all your health tracking data. This cannot be
              undone.
            </p>
            <Button
              onClick={handleClearAllData}
              disabled={isClearing}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isClearing ? 'Deleting...' : 'Delete All Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Debug Tools
          </CardTitle>
          <CardDescription>
            Tools for testing and debugging the organic tracking system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleAddTestData}
            disabled={isAddingTest}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isAddingTest ? 'Adding...' : 'Add Test Organic Food'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            This will add a test meal with 2/3 organic ingredients to help you
            verify the organic tracking bars are working.
          </p>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes.
              </p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Account Actions
          </CardTitle>
          <CardDescription>Sign out of your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Central Plus Button handler
  const handlePlusClick = useCallback(() => {
    if (currentView === 'food') {
      handleQuickCapture();
    } else if (currentView === 'signals') {
      handleAddSymptom();
    }
  }, [currentView, handleQuickCapture, handleAddSymptom]);

  // Central Plus Button component
  const CentralPlusButton = () => {
    if (currentView !== 'food' && currentView !== 'signals') return null;

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
        <MetallicButton
          onClick={handlePlusClick}
          size="lg"
          className={`min-h-[56px] min-w-[56px] w-14 h-14 rounded-full ${getBorderStyle()} hover:scale-105 transition-all duration-200 aspect-square`}
        >
          <Plus className="h-7 w-7" />
        </MetallicButton>
      </div>
    );
  };

  // Bottom Navigation component
  const BottomNavigation = () => {
    const tabs = [
      { id: 'insights' as ViewType, label: 'Insights', icon: BarChart3 },
      { id: 'food' as ViewType, label: 'Food', icon: Utensils },
      { id: 'signals' as ViewType, label: 'Signals', icon: Activity },
      { id: 'settings' as ViewType, label: 'Settings', icon: Settings },
    ];

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
        <div className="relative">
          <CentralPlusButton />
          <div className="flex items-center h-16">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleViewChange(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full px-2 py-2 transition-all duration-200 ${getActiveTabStyle(tab.id)}`}
              >
                <tab.icon
                  className={`h-5 w-5 mb-1 transition-transform duration-200 ${
                    currentView === tab.id ? 'scale-110' : ''
                  }`}
                />
                <span className="text-xs font-medium">{tab.label}</span>
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
            {currentView === 'insights' && <InsightsView />}
            {currentView === 'settings' && <SettingsView />}
            {currentView === 'food' && (
              <ErrorBoundary fallback={SupabaseErrorFallback}>
                {/* Food Category Progress */}
                <div className="relative flex flex-col items-center h-64">
                  {statsError ? (
                    <NetworkRetryState
                      onRetry={retryStats}
                      message="Failed to load stats. Tap to retry."
                      className="h-64"
                    />
                  ) : foodStats === undefined ? (
                    <ProgressCircleSkeleton />
                  ) : (
                    <>
                      <FoodCategoryProgress
                        greenCount={foodStats?.greenIngredients || 0}
                        yellowCount={foodStats?.yellowIngredients || 0}
                        redCount={foodStats?.redIngredients || 0}
                        size={200}
                        strokeWidth={12}
                        isFromToday={foodStats?.isFromToday ?? true}
                      />
                      <div className="absolute right-0 top-0 flex flex-col items-center space-y-2">
                        <VerticalProgressBar
                          percentage={foodStats?.totalOrganicPercentage || 0}
                          height={200}
                        />
                        <Leaf
                          className={`h-5 w-5 ${getZoneTextClass('green')}`}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                      Recent Entries
                    </h2>
                    <button className="text-muted-foreground text-sm">
                      View more
                    </button>
                  </div>
                  <div className="space-y-3">
                    {foodsError ? (
                      <NetworkRetryState
                        onRetry={retryFoods}
                        message="Failed to load foods. Tap to retry."
                      />
                    ) : (
                      <EmptyOrLoadingState
                        isLoading={recentFoods === undefined}
                        isEmpty={recentFoods?.length === 0}
                        loadingMessage="Loading recent foods..."
                        emptyTitle="No foods logged yet"
                        emptyDescription="Tap the eat icon below to get started"
                        emptyIcon="🍽️"
                      />
                    )}
                    {recentFoods === undefined && (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <FoodEntrySkeleton key={i} />
                        ))}
                      </div>
                    )}
                    {recentFoods && recentFoods.length > 0 && (
                      <div className="space-y-3 overflow-hidden">
                        {recentFoods.map(food => (
                          <button
                            key={food.id}
                            onClick={() => handleEditFood(food)}
                            className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors overflow-hidden"
                          >
                            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                              {food.photo_url ? (
                                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                                  <Image
                                    src={food.photo_url || '/placeholder.svg'}
                                    alt={food.name}
                                    className="w-full h-full object-cover"
                                    width={48}
                                    height={48}
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-lg">🍽️</span>
                                </div>
                              )}
                              <div className="text-left flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {food.status === 'analyzing'
                                    ? 'New Food'
                                    : food.name}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {food.ingredients
                                    ?.map(ing => ing.name)
                                    .join(', ') || 'No ingredients'}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 flex items-center space-x-2 ml-1 sm:ml-2">
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
                              {needsZoningRetry(food) && (
                                <div
                                  onClick={e => handleRetryZoning(e, food.id)}
                                  className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0 cursor-pointer"
                                  title="Retry ingredient zoning"
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      handleRetryZoning(e, food.id);
                                    }
                                  }}
                                >
                                  <RefreshCw className="h-3 w-3 text-gray-600" />
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ErrorBoundary>
            )}

            {currentView === 'signals' && (
              <ErrorBoundary fallback={SupabaseErrorFallback}>
                <div className="flex flex-col items-center space-y-4 h-64">
                  <div className="w-48 h-48 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">
                        {todaysSymptoms?.length || 0}
                      </p>
                      <p className="text-sm text-gray-600">Symptoms Today</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">
                      Recent Entries
                    </h2>
                    <button className="text-muted-foreground text-sm">
                      View more
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentSymptomsError ? (
                      <NetworkRetryState
                        onRetry={retryRecentSymptoms}
                        message="Failed to load symptoms. Tap to retry."
                      />
                    ) : (
                      <EmptyOrLoadingState
                        isLoading={recentSymptoms === undefined}
                        isEmpty={recentSymptoms?.length === 0}
                        loadingMessage="Loading recent symptoms..."
                        emptyTitle="No symptoms logged yet"
                        emptyDescription="Tap the signals icon below to get started"
                        emptyIcon="⚡"
                      />
                    )}
                    {recentSymptoms === undefined && (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <SymptomEntrySkeleton key={i} />
                        ))}
                      </div>
                    )}
                    {recentSymptoms &&
                      recentSymptoms.length > 0 &&
                      recentSymptoms.map(symptom => (
                        <button
                          key={symptom.id}
                          onClick={() => handleEditSymptom(symptom)}
                          className="w-full flex items-center justify-between py-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-lg">
                                {getCategoryInfo(symptom.category)?.icon ||
                                  '⚡'}
                              </span>
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-gray-900">
                                {symptom.name}
                              </p>
                              <p className="text-sm text-gray-500">
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
                        </button>
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
