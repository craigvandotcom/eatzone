import React from 'react';
import { render, screen } from '@testing-library/react';
import { FoodCompositionBar } from '@/features/foods/components/food-composition-bar';
import type { Ingredient } from '@/lib/types';

// Mock the zone color utilities
jest.mock('@/lib/utils/zone-colors', () => ({
  getZoneColor: jest.fn((zone: string, format: string) => {
    const colors = {
      green: { hex: '#10b981', rgb: 'rgb(16, 185, 129)' },
      yellow: { hex: '#f59e0b', rgb: 'rgb(245, 158, 11)' },
      red: { hex: '#ef4444', rgb: 'rgb(239, 68, 68)' },
      unzoned: { hex: '#6b7280', rgb: 'rgb(107, 114, 128)' },
    };
    return (
      colors[zone as keyof typeof colors]?.[
        format as keyof typeof colors.green
      ] || '#6b7280'
    );
  }),
  getZoneBgClass: jest.fn((zone: string) => {
    const classes = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      unzoned: 'bg-gray-500',
    };
    return classes[zone as keyof typeof classes] || 'bg-gray-500';
  }),
  getZoneBgStyle: jest.fn((zone: string) => {
    const styles = {
      green: { backgroundColor: '#10b981' },
      yellow: { backgroundColor: '#f59e0b' },
      red: { backgroundColor: '#ef4444' },
      unzoned: { backgroundColor: '#6b7280' },
    };
    return (
      styles[zone as keyof typeof styles] || { backgroundColor: '#6b7280' }
    );
  }),
}));

describe('FoodCompositionBar', () => {
  const createMockIngredient = (
    name: string,
    zone: 'green' | 'yellow' | 'red' | 'unzoned' = 'green',
    organic: boolean = false
  ): Ingredient => ({
    name,
    organic,
    zone,
    category: 'Test Category',
    group: 'Test Group',
  });

  describe('Empty state', () => {
    it('renders loading animation when no ingredients provided', () => {
      render(<FoodCompositionBar ingredients={[]} />);

      const container = document.querySelector(
        '.h-3.w-full.bg-gray-200.rounded-full.overflow-hidden.border.border-gray-400'
      );
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass(
        'h-3',
        'w-full',
        'bg-gray-200',
        'rounded-full',
        'overflow-hidden',
        'border',
        'border-gray-400'
      );

      const loadingBar = container?.querySelector('.animate-pulse');
      expect(loadingBar).toBeInTheDocument();
      expect(loadingBar).toHaveClass('h-full', 'bg-gray-300', 'w-full');
    });

    it('renders loading animation when ingredients is null', () => {
      render(<FoodCompositionBar ingredients={null as any} />);

      const container = document.querySelector(
        '.h-3.w-full.bg-gray-200.rounded-full.overflow-hidden.border.border-gray-400'
      );
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass(
        'h-3',
        'w-full',
        'bg-gray-200',
        'rounded-full',
        'overflow-hidden',
        'border',
        'border-gray-400'
      );

      const loadingBar = container?.querySelector('.animate-pulse');
      expect(loadingBar).toBeInTheDocument();
    });

    it('renders loading animation when ingredients is undefined', () => {
      render(<FoodCompositionBar ingredients={undefined as any} />);

      const container = document.querySelector(
        '.h-3.w-full.bg-gray-200.rounded-full.overflow-hidden.border.border-gray-400'
      );
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass(
        'h-3',
        'w-full',
        'bg-gray-200',
        'rounded-full',
        'overflow-hidden',
        'border',
        'border-gray-400'
      );

      const loadingBar = container?.querySelector('.animate-pulse');
      expect(loadingBar).toBeInTheDocument();
    });
  });

  describe('Unzoned ingredients only', () => {
    it('renders loading animation with shimmer when only unzoned ingredients', () => {
      const ingredients = [
        createMockIngredient('Unknown Ingredient 1', 'unzoned'),
        createMockIngredient('Unknown Ingredient 2', 'unzoned'),
      ];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const container = document.querySelector(
        '.h-3.w-full.bg-gray-200.rounded-full.overflow-hidden.border.border-gray-400'
      );
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass(
        'h-3',
        'w-full',
        'bg-gray-200',
        'rounded-full',
        'overflow-hidden',
        'border',
        'border-gray-400'
      );

      const loadingBar = container?.querySelector('.zone-bar-loading');
      expect(loadingBar).toBeInTheDocument();
      expect(loadingBar).toHaveClass(
        'transition-all',
        'duration-500',
        'zone-bar-loading',
        'relative'
      );
      expect(loadingBar).toHaveStyle({ width: '100%', height: '100%' });

      const shimmer = container?.querySelector('.zone-bar-shimmer');
      expect(shimmer).toBeInTheDocument();
      expect(shimmer).toHaveClass('absolute', 'inset-0', 'zone-bar-shimmer');

      // Check tooltip
      expect(loadingBar).toHaveAttribute(
        'title',
        '2 unzoned ingredients - analyzing zones...'
      );
    });

    it('renders correct tooltip for single unzoned ingredient', () => {
      const ingredients = [
        createMockIngredient('Unknown Ingredient', 'unzoned'),
      ];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const loadingBar = screen.getByTitle(
        '1 unzoned ingredient - analyzing zones...'
      );
      expect(loadingBar).toBeInTheDocument();
    });
  });

  describe('Mixed ingredients with zones', () => {
    it('renders correct proportions for mixed ingredients', () => {
      const ingredients = [
        createMockIngredient('Spinach', 'green'),
        createMockIngredient('Banana', 'yellow'),
        createMockIngredient('Sugar', 'red'),
        createMockIngredient('Unknown', 'unzoned'),
      ];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const container = screen.getByTitle(
        'Green: 1, Yellow: 1, Red: 1, Unzoned: 1'
      );
      expect(container).toHaveClass(
        'flex',
        'h-3',
        'w-full',
        'rounded-full',
        'overflow-hidden',
        'border',
        'border-gray-400',
        'bg-gray-200'
      );

      // Check that all zone segments are rendered
      const zoneSegments = container.querySelectorAll(
        '[class*="transition-all duration-500"]'
      );
      expect(zoneSegments).toHaveLength(4); // green, yellow, red, unzoned
    });

    it('renders only green ingredients correctly', () => {
      const ingredients = [
        createMockIngredient('Spinach', 'green'),
        createMockIngredient('Kale', 'green'),
        createMockIngredient('Broccoli', 'green'),
      ];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const container = screen.getByTitle('Green: 3, Yellow: 0, Red: 0');
      expect(container).toHaveAttribute('title', 'Green: 3, Yellow: 0, Red: 0');

      // Should have only one zone segment (green)
      const zoneSegments = container.querySelectorAll(
        '[class*="transition-all duration-500"]'
      );
      expect(zoneSegments).toHaveLength(1);
    });

    it('renders only yellow ingredients correctly', () => {
      const ingredients = [
        createMockIngredient('Banana', 'yellow'),
        createMockIngredient('Apple', 'yellow'),
      ];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const container = screen.getByTitle('Green: 0, Yellow: 2, Red: 0');
      expect(container).toHaveAttribute('title', 'Green: 0, Yellow: 2, Red: 0');
    });

    it('renders only red ingredients correctly', () => {
      const ingredients = [
        createMockIngredient('Sugar', 'red'),
        createMockIngredient('Candy', 'red'),
      ];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const container = screen.getByTitle('Green: 0, Yellow: 0, Red: 2');
      expect(container).toHaveAttribute('title', 'Green: 0, Yellow: 0, Red: 2');
    });
  });

  describe('Percentage calculations', () => {
    it('calculates correct percentages for equal distribution', () => {
      const ingredients = [
        createMockIngredient('Green1', 'green'),
        createMockIngredient('Yellow1', 'yellow'),
        createMockIngredient('Red1', 'red'),
        createMockIngredient('Unzoned1', 'unzoned'),
      ];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const container = screen.getByTitle(
        'Green: 1, Yellow: 1, Red: 1, Unzoned: 1'
      );
      const zoneSegments = container.querySelectorAll(
        '[class*="transition-all duration-500"]'
      );

      // Each should be 25% (1/4)
      zoneSegments.forEach(segment => {
        expect(segment).toHaveStyle({ width: '25%' });
      });
    });

    it('calculates correct percentages for uneven distribution', () => {
      const ingredients = [
        createMockIngredient('Green1', 'green'),
        createMockIngredient('Green2', 'green'),
        createMockIngredient('Yellow1', 'yellow'),
      ];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const container = screen.getByTitle('Green: 2, Yellow: 1, Red: 0');
      const zoneSegments = container.querySelectorAll(
        '[class*="transition-all duration-500"]'
      );

      // Green: 2/3 = 66.67%, Yellow: 1/3 = 33.33%
      expect(zoneSegments[0]).toHaveStyle({ width: '66.66666666666666%' }); // Green
      expect(zoneSegments[1]).toHaveStyle({ width: '33.33333333333333%' }); // Yellow
    });

    it('handles single ingredient correctly', () => {
      const ingredients = [createMockIngredient('Single Ingredient', 'green')];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const container = screen.getByTitle('Green: 1, Yellow: 0, Red: 0');
      const zoneSegments = container.querySelectorAll(
        '[class*="transition-all duration-500"]'
      );

      expect(zoneSegments).toHaveLength(1);
      expect(zoneSegments[0]).toHaveStyle({ width: '100%' });
      expect(container).toHaveAttribute('title', 'Green: 1, Yellow: 0, Red: 0');
    });
  });

  describe('Minimum width handling', () => {
    it('applies minimum width for small percentages', () => {
      const ingredients = [
        createMockIngredient('Green1', 'green'),
        createMockIngredient('Green2', 'green'),
        createMockIngredient('Green3', 'green'),
        createMockIngredient('Green4', 'green'),
        createMockIngredient('Green5', 'green'),
        createMockIngredient('Green6', 'green'),
        createMockIngredient('Green7', 'green'),
        createMockIngredient('Green8', 'green'),
        createMockIngredient('Green9', 'green'),
        createMockIngredient('Red1', 'red'), // 10% - should get minWidth
      ];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const container = screen.getByTitle('Green: 9, Yellow: 0, Red: 1');
      const zoneSegments = container.querySelectorAll(
        '[class*="transition-all duration-500"]'
      );

      // Red segment should have minWidth applied
      const redSegment = Array.from(zoneSegments).find(segment =>
        segment.getAttribute('style')?.includes('width: 10%')
      );
      expect(redSegment).toHaveStyle({ minWidth: '2px' });
    });
  });

  describe('Unzoned ingredients with shimmer', () => {
    it('renders shimmer effect for unzoned ingredients in mixed composition', () => {
      const ingredients = [
        createMockIngredient('Green1', 'green'),
        createMockIngredient('Unzoned1', 'unzoned'),
      ];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const container = screen.getByTitle(
        'Green: 1, Yellow: 0, Red: 0, Unzoned: 1'
      );
      const unzonedSegment = container.querySelector('.zone-bar-loading');

      expect(unzonedSegment).toBeInTheDocument();
      expect(unzonedSegment).toHaveClass('zone-bar-loading', 'relative');

      const shimmer = unzonedSegment?.querySelector('.zone-bar-shimmer');
      expect(shimmer).toBeInTheDocument();
      expect(shimmer).toHaveClass('absolute', 'inset-0', 'zone-bar-shimmer');
    });

    it('shows correct tooltip for unzoned ingredients in mixed composition', () => {
      const ingredients = [
        createMockIngredient('Green1', 'green'),
        createMockIngredient('Unzoned1', 'unzoned'),
        createMockIngredient('Unzoned2', 'unzoned'),
      ];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const container = screen.getByTitle(
        'Green: 1, Yellow: 0, Red: 0, Unzoned: 2'
      );
      expect(container).toHaveAttribute(
        'title',
        'Green: 1, Yellow: 0, Red: 0, Unzoned: 2'
      );

      const unzonedSegment = container.querySelector('.zone-bar-loading');
      expect(unzonedSegment).toHaveAttribute(
        'title',
        '2 ingredients analyzing...'
      );
    });
  });

  describe('Edge cases', () => {
    it('handles ingredients with missing zone property gracefully', () => {
      const ingredients = [
        {
          name: 'Test Ingredient',
          organic: false,
          category: 'Test',
          group: 'Test',
        } as Ingredient,
      ];

      // This should not crash and should render the empty state
      render(<FoodCompositionBar ingredients={ingredients} />);

      // Should render the loading state since no valid zones are found
      const container = document.querySelector(
        '.h-3.w-full.bg-gray-200.rounded-full.overflow-hidden.border.border-gray-400'
      );
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass(
        'h-3',
        'w-full',
        'bg-gray-200',
        'rounded-full',
        'overflow-hidden',
        'border',
        'border-gray-400'
      );
    });

    it('handles very large number of ingredients', () => {
      const ingredients = Array.from({ length: 100 }, (_, i) =>
        createMockIngredient(`Ingredient ${i}`, i % 2 === 0 ? 'green' : 'red')
      );

      render(<FoodCompositionBar ingredients={ingredients} />);

      const container = screen.getByTitle('Green: 50, Yellow: 0, Red: 50');
      expect(container).toHaveAttribute(
        'title',
        'Green: 50, Yellow: 0, Red: 50'
      );

      const zoneSegments = container.querySelectorAll(
        '[class*="transition-all duration-500"]'
      );
      expect(zoneSegments).toHaveLength(2); // green and red
    });
  });

  describe('Accessibility', () => {
    it('provides meaningful tooltips for screen readers', () => {
      const ingredients = [
        createMockIngredient('Spinach', 'green'),
        createMockIngredient('Banana', 'yellow'),
        createMockIngredient('Sugar', 'red'),
      ];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const container = screen.getByTitle('Green: 1, Yellow: 1, Red: 1');
      expect(container).toHaveAttribute('title', 'Green: 1, Yellow: 1, Red: 1');
    });

    it('provides tooltip for unzoned ingredients', () => {
      const ingredients = [createMockIngredient('Unknown', 'unzoned')];

      render(<FoodCompositionBar ingredients={ingredients} />);

      const loadingBar = screen.getByTitle(
        '1 unzoned ingredient - analyzing zones...'
      );
      expect(loadingBar).toBeInTheDocument();
    });
  });
});
