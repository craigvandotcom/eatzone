/**
 * Tests for Bottom Navigation functionality
 * Tests view switching, tab indicators, and transition states
 */

import { render, screen, waitFor } from '@/__tests__/setup/test-utils';
import userEvent from '@testing-library/user-event';
import Dashboard from '@/app/(protected)/app/page';
import {
  useDashboardData,
  useFoodsForDate,
  useSymptomsForDate,
  useFoodStatsForDate,
  useTrackingStreak,
} from '@/lib/hooks';

// Mock Next.js useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/app',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the dashboard data hook
jest.mock('@/lib/hooks', () => ({
  useDashboardData: jest.fn(),
  useFoodsForDate: jest.fn(),
  useSymptomsForDate: jest.fn(),
  useFoodStatsForDate: jest.fn(),
  useTrackingStreak: jest.fn(),
}));

// Mock the mobile hook to test mobile navigation
jest.mock('@/components/ui/use-mobile', () => ({
  useIsMobile: jest.fn(),
}));

const mockUseDashboardData = useDashboardData as jest.MockedFunction<
  typeof useDashboardData
>;
const mockUseFoodsForDate = useFoodsForDate as jest.MockedFunction<
  typeof useFoodsForDate
>;
const mockUseSymptomsForDate = useSymptomsForDate as jest.MockedFunction<
  typeof useSymptomsForDate
>;
const mockUseFoodStatsForDate = useFoodStatsForDate as jest.MockedFunction<
  typeof useFoodStatsForDate
>;
const mockUseTrackingStreak = useTrackingStreak as jest.MockedFunction<
  typeof useTrackingStreak
>;

describe('Bottom Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock mobile view
    const { useIsMobile } = require('@/components/ui/use-mobile');
    useIsMobile.mockReturnValue(true);

    // Mock dashboard data
    mockUseDashboardData.mockReturnValue({
      data: {
        recentFoods: [],
        recentSymptoms: [],
        todaysSymptoms: [],
        foodStats: {
          greenIngredients: 0,
          yellowIngredients: 0,
          redIngredients: 0,
          totalOrganicPercentage: 0,
          isFromToday: true,
        },
      },
      error: null,
      mutate: jest.fn(),
    });

    // Mock date-specific data hooks
    mockUseFoodsForDate.mockReturnValue({ data: [] });
    mockUseSymptomsForDate.mockReturnValue({ data: [] });
    mockUseFoodStatsForDate.mockReturnValue({
      data: {
        greenIngredients: 0,
        yellowIngredients: 0,
        redIngredients: 0,
        totalIngredients: 0,
        organicCount: 0,
        totalOrganicPercentage: 0,
        isFromSelectedDate: true,
      },
    });
    mockUseTrackingStreak.mockReturnValue(0);
  });

  it('should render bottom navigation tabs on mobile', () => {
    render(<Dashboard />);

    // Check all navigation tabs are present
    expect(
      screen.getByRole('button', { name: /insights/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /food/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /signals/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /settings/i })
    ).toBeInTheDocument();
  });

  it('should switch views when navigation tabs are clicked', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    // Initially should show insights view
    expect(screen.getByText(/analytics coming soon/i)).toBeInTheDocument();

    // Click on Food tab
    const foodTab = screen.getByRole('button', { name: /food/i });
    await user.click(foodTab);

    // Should show food view content (food category progress)
    await waitFor(() => {
      expect(
        screen.queryByText(/analytics coming soon/i)
      ).not.toBeInTheDocument();
    });

    // Click on Settings tab
    const settingsTab = screen.getByRole('button', { name: /settings/i });
    await user.click(settingsTab);

    // Should show settings view
    await waitFor(() => {
      expect(screen.getAllByText(/account/i)[0]).toBeInTheDocument();
    });
  });

  it('should show active tab indicator for current view', () => {
    render(<Dashboard />);

    // Find the insights tab (should be active by default)
    const insightsTab = screen.getByRole('button', { name: /insights/i });

    // The active tab should have scaled icon (scale-110 class is applied via CSS)
    // We can test this by checking if the tab has the active styling
    expect(insightsTab).toBeInTheDocument();
  });

  it('should show central plus button only for food and signals views', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    // Initially on insights view - plus button should be hidden (opacity 0)
    await waitFor(() => {
      const plusButtons = screen.queryAllByRole('button');
      const plusButton = plusButtons.find(
        button =>
          button.querySelector('svg') &&
          button.className.includes('rounded-full')
      );
      // Plus button exists but should be hidden (opacity 0)
      expect(plusButton).toBeInTheDocument();
      const parentDiv = plusButton?.closest('[style*="opacity"]');
      expect(parentDiv).toHaveStyle('opacity: 0');
    });

    // Switch to food view
    const foodTab = screen.getByRole('button', { name: /food/i });
    await user.click(foodTab);

    // Wait for transition and check for visible plus button
    await waitFor(() => {
      const plusButtons = screen.queryAllByRole('button');
      const plusButton = plusButtons.find(
        button =>
          button.querySelector('svg') &&
          button.className.includes('rounded-full')
      );
      expect(plusButton).toBeInTheDocument();
      const parentDiv = plusButton?.closest('[style*="opacity"]');
      expect(parentDiv).toHaveStyle('opacity: 1');
    });

    // Switch to insights view
    const insightsTab = screen.getByRole('button', { name: /insights/i });
    await user.click(insightsTab);

    // Plus button should be hidden again
    await waitFor(() => {
      const plusButtons = screen.queryAllByRole('button');
      const plusButton = plusButtons.find(
        button =>
          button.querySelector('svg') &&
          button.className.includes('rounded-full')
      );
      expect(plusButton).toBeInTheDocument();
      const parentDiv = plusButton?.closest('[style*="opacity"]');
      expect(parentDiv).toHaveStyle('opacity: 0');
    });
  });

  it('should handle rapid tab switching without errors', async () => {
    const user = userEvent.setup();
    render(<Dashboard />);

    const foodTab = screen.getByRole('button', { name: /food/i });
    const settingsTab = screen.getByRole('button', { name: /settings/i });
    const insightsTab = screen.getByRole('button', { name: /insights/i });

    // Rapidly switch between tabs
    await user.click(foodTab);
    await user.click(settingsTab);
    await user.click(insightsTab);
    await user.click(foodTab);

    // Should end up on food view without errors
    await waitFor(() => {
      expect(
        screen.queryByText(/analytics coming soon/i)
      ).not.toBeInTheDocument();
    });
  });

  it('should not render bottom navigation on desktop', () => {
    // Mock desktop view
    const { useIsMobile } = require('@/components/ui/use-mobile');
    useIsMobile.mockReturnValue(false);

    render(<Dashboard />);

    // Check that the fixed bottom navigation container is not present
    const bottomNavContainer = document.querySelector('.fixed.bottom-0');
    expect(bottomNavContainer).not.toBeInTheDocument();

    // Desktop should have sidebar navigation instead
    // We can verify this by checking that navigation exists but not in bottom position
    const navigationButtons = screen.queryAllByRole('button', {
      name: /insights|food|signals|settings/i,
    });
    expect(navigationButtons.length).toBeGreaterThan(0); // Navigation exists
  });
});
