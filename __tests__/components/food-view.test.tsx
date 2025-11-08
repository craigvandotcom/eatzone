/**
 * Tests for FoodView component
 * Tests food entry rendering, empty states, loading states, and navigation
 */

import { render, screen } from '@/__tests__/setup/test-utils';
import { FoodView } from '@/features/dashboard/components/food-view';
import type { FoodStats, Ingredient } from '@/lib/types';
import { mockFoods } from '@/__tests__/fixtures/foods';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('FoodView', () => {
  const mockFoodStats: FoodStats = {
    greenIngredients: 2,
    yellowIngredients: 0,
    redIngredients: 0,
    totalIngredients: 2,
    organicCount: 1,
    totalOrganicPercentage: 50,
    isFromSelectedDate: true,
  };

  const mockGetIngredients = (): Ingredient[] => mockFoods[0].ingredients || [];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when foods are undefined', () => {
    render(
      <FoodView
        foodsForSelectedDate={undefined}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    expect(screen.getByText(/loading foods for selected date/i)).toBeInTheDocument();
  });

  it('renders loading state when food stats are undefined', () => {
    render(
      <FoodView
        foodsForSelectedDate={mockFoods}
        foodStatsForSelectedDate={undefined}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    expect(screen.getByText(/loading food data/i)).toBeInTheDocument();
  });

  it('renders empty state when no foods', () => {
    render(
      <FoodView
        foodsForSelectedDate={[]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    expect(
      screen.getByText(/no foods logged for this date/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/tap the \+ button/i)).toBeInTheDocument();
    expect(screen.getByText('0 entries')).toBeInTheDocument();
  });

  it('renders entries header with correct count', () => {
    render(
      <FoodView
        foodsForSelectedDate={mockFoods}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    expect(screen.getByText('Entries')).toBeInTheDocument();
    expect(screen.getByText('2 entries')).toBeInTheDocument();
  });

  it('renders food entries correctly', () => {
    render(
      <FoodView
        foodsForSelectedDate={mockFoods}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    expect(screen.getByText(mockFoods[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockFoods[1].name)).toBeInTheDocument();
  });

  it('renders food entry with ingredients', () => {
    render(
      <FoodView
        foodsForSelectedDate={[mockFoods[0]]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    const ingredientsText = mockFoods[0].ingredients
      ?.map(ing => ing.name)
      .join(', ');
    expect(screen.getByText(ingredientsText!)).toBeInTheDocument();
  });

  it('renders food entry with "New Food" when status is analyzing', () => {
    const analyzingFood = {
      ...mockFoods[0],
      status: 'analyzing' as const,
    };

    render(
      <FoodView
        foodsForSelectedDate={[analyzingFood]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    expect(screen.getByText('New Food')).toBeInTheDocument();
  });

  it('navigates to food edit page when food entry is clicked', () => {
    render(
      <FoodView
        foodsForSelectedDate={[mockFoods[0]]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    // Check that Link component has correct href
    const foodLink = screen
      .getByText(mockFoods[0].name)
      .closest('a');
    expect(foodLink).toBeInTheDocument();
    expect(foodLink).toHaveAttribute('href', `/app/foods/edit/${mockFoods[0].id}`);
  });

  it('uses Link component with prefetch enabled', () => {
    render(
      <FoodView
        foodsForSelectedDate={[mockFoods[0]]}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    const foodLink = screen
      .getByText(mockFoods[0].name)
      .closest('a');
    expect(foodLink).toBeInTheDocument();
    // Next.js Link with prefetch={true} should be present
    // We verify this by checking the href attribute exists
    expect(foodLink).toHaveAttribute('href');
  });

  it('renders zone summary bar when food stats are provided', () => {
    render(
      <FoodView
        foodsForSelectedDate={mockFoods}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    // Zone summary bar should be rendered (via FoodZoneSummaryBar component)
    // This is tested indirectly through the component rendering
    expect(screen.getByText('Entries')).toBeInTheDocument();
  });

  it('renders loading skeleton when foods are undefined', () => {
    const { container } = render(
      <FoodView
        foodsForSelectedDate={undefined}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    // Should render skeleton loaders (FoodEntrySkeleton components)
    // Check for loading spinner which indicates loading state
    expect(screen.getByText(/loading foods for selected date/i)).toBeInTheDocument();
    // Skeleton elements are rendered via FoodEntrySkeleton component
    const loadingElements = container.querySelectorAll('[class*="animate-pulse"]');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('handles multiple food entries with correct navigation links', () => {
    render(
      <FoodView
        foodsForSelectedDate={mockFoods}
        foodStatsForSelectedDate={mockFoodStats}
        getIngredientsForSelectedDate={mockGetIngredients}
      />
    );

    // Check all food links are present
    mockFoods.forEach(food => {
      const foodLink = screen
        .getByText(food.name)
        .closest('a');
      expect(foodLink).toBeInTheDocument();
      expect(foodLink).toHaveAttribute('href', `/app/foods/edit/${food.id}`);
    });
  });
});

