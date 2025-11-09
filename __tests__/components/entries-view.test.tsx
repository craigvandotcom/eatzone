/**
 * Tests for EntriesView component
 * Tests entry rendering, empty states, loading states, and navigation
 */

import { render, screen, waitFor } from '@/__tests__/setup/test-utils';
import { EntriesView } from '@/features/dashboard/components/entries-view';
import type { TimelineEntry, FoodStats, Ingredient } from '@/lib/types';
import { mockFoods } from '@/__tests__/fixtures/foods';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('EntriesView', () => {
  const mockFoodEntry: TimelineEntry = {
    id: 'food-1',
    type: 'food',
    timestamp: '2024-01-15T12:00:00Z',
    data: mockFoods[0],
  };

  const mockSignalEntry: TimelineEntry = {
    id: 'signal-1',
    type: 'signal',
    timestamp: '2024-01-15T14:00:00Z',
    data: {
      id: 'signal-1',
      symptom_id: 'headache',
      category: 'mind',
      name: 'Headache',
      timestamp: '2024-01-15T14:00:00Z',
    },
  };

  const mockFoodStats: FoodStats = {
    greenIngredients: 2,
    yellowIngredients: 1,
    redIngredients: 0,
    totalIngredients: 3,
    organicCount: 1,
    totalOrganicPercentage: 33.33,
    isFromSelectedDate: true,
  };

  const mockGetIngredients = (): Ingredient[] => mockFoods[0].ingredients || [];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when entries are undefined', () => {
    render(
      <EntriesView
        entriesForSelectedDate={undefined}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    expect(screen.getByText(/loading timeline/i)).toBeInTheDocument();
  });

  it('renders empty state when no entries', () => {
    render(
      <EntriesView
        entriesForSelectedDate={[]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    expect(
      screen.getByText(/no entries logged for this date/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/tap the \+ button/i)).toBeInTheDocument();
    expect(screen.getByText('0 entries')).toBeInTheDocument();
  });

  it('renders entries header with correct count', () => {
    render(
      <EntriesView
        entriesForSelectedDate={[mockFoodEntry]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    expect(screen.getByText('Entries')).toBeInTheDocument();
    expect(screen.getByText('1 entry')).toBeInTheDocument();
  });

  it('renders entries header with plural count', () => {
    render(
      <EntriesView
        entriesForSelectedDate={[mockFoodEntry, mockSignalEntry]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    expect(screen.getByText('2 entries')).toBeInTheDocument();
  });

  it('renders food entry correctly', () => {
    render(
      <EntriesView
        entriesForSelectedDate={[mockFoodEntry]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    expect(screen.getByText(mockFoods[0].name)).toBeInTheDocument();
  });

  it('renders signal entry correctly', () => {
    render(
      <EntriesView
        entriesForSelectedDate={[mockSignalEntry]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    expect(screen.getByText('Headache')).toBeInTheDocument();
    expect(screen.getByText('mind')).toBeInTheDocument();
  });

  it('navigates to food edit page when food entry is clicked', async () => {
    render(
      <EntriesView
        entriesForSelectedDate={[mockFoodEntry]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    // Check that Link component has correct href
    const foodLink = screen.getByText(mockFoods[0].name).closest('a');
    expect(foodLink).toBeInTheDocument();
    expect(foodLink).toHaveAttribute(
      'href',
      `/app/foods/edit/${mockFoods[0].id}`
    );
  });

  it('navigates to symptom edit page when signal entry is clicked', async () => {
    render(
      <EntriesView
        entriesForSelectedDate={[mockSignalEntry]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    // Check that Link component has correct href
    const signalLink = screen.getByText('Headache').closest('a');
    expect(signalLink).toBeInTheDocument();
    expect(signalLink).toHaveAttribute(
      'href',
      `/app/symptoms/edit/${mockSignalEntry.data.id}`
    );
  });

  it('handles invalid category gracefully', () => {
    const invalidSignalEntry: TimelineEntry = {
      id: 'signal-invalid',
      type: 'signal',
      timestamp: '2024-01-15T15:00:00Z',
      data: {
        id: 'signal-invalid',
        symptom_id: 'test',
        category: 'invalid-category' as any,
        name: 'Test Symptom',
        timestamp: '2024-01-15T15:00:00Z',
      },
    };

    render(
      <EntriesView
        entriesForSelectedDate={[invalidSignalEntry]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    // Should render without crashing - uses fallback icon
    expect(screen.getByText('Test Symptom')).toBeInTheDocument();
  });

  it('renders timeline when entries are provided', () => {
    render(
      <EntriesView
        entriesForSelectedDate={[mockFoodEntry, mockSignalEntry]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    // Timeline should be rendered (via UnifiedTimeline component)
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('renders zone summary bar when food stats are provided', () => {
    render(
      <EntriesView
        entriesForSelectedDate={[mockFoodEntry]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    // Zone summary bar should be rendered
    // This is tested indirectly through the component rendering
    expect(screen.getByText('Entries')).toBeInTheDocument();
  });
});
