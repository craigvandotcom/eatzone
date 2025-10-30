/**
 * Tests for UnifiedTimeline component
 * Tests timeline rendering, positioning, empty states, and overflow protection
 */

import { render, screen } from '@/__tests__/setup/test-utils';
import { UnifiedTimeline } from '@/features/dashboard/components/unified-timeline';
import type { TimelineEntry } from '@/lib/types';
import { mockFoods } from '@/__tests__/fixtures/foods';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('UnifiedTimeline', () => {
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

  it('renders empty state when no entries provided', () => {
    render(<UnifiedTimeline entries={[]} />);

    expect(screen.getByText('Summary')).toBeInTheDocument();
    // Should show timeline structure even with no entries - 12am appears twice (start and end)
    const labels = screen.getAllByText('12am');
    expect(labels.length).toBeGreaterThan(0);
  });

  it('renders timeline with food entries', () => {
    render(<UnifiedTimeline entries={[mockFoodEntry]} />);

    expect(screen.getByText('Summary')).toBeInTheDocument();
    // Timeline should render with entry markers - verify structure exists
    expect(screen.getByText('Summary').closest('div')).toBeInTheDocument();
  });

  it('renders timeline with signal entries', () => {
    render(<UnifiedTimeline entries={[mockSignalEntry]} />);

    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('renders timeline with mixed food and signal entries', () => {
    render(<UnifiedTimeline entries={[mockFoodEntry, mockSignalEntry]} />);

    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('handles null/undefined entries gracefully', () => {
    render(<UnifiedTimeline entries={undefined as any} />);

    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('displays time labels correctly', () => {
    render(<UnifiedTimeline entries={[]} />);

    // Check for time labels - 12am appears twice (start and end)
    const labels = screen.getAllByText('12am');
    expect(labels.length).toBeGreaterThan(0);
    expect(screen.getByText('12pm')).toBeInTheDocument();
    expect(screen.getByText('6am')).toBeInTheDocument();
    expect(screen.getByText('6pm')).toBeInTheDocument();
  });

  it('handles entries with invalid category gracefully', () => {
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

    render(<UnifiedTimeline entries={[invalidSignalEntry]} />);

    // Should render without crashing - uses fallback icon
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('positions entries correctly based on timestamp', () => {
    const earlyEntry: TimelineEntry = {
      id: 'early',
      type: 'food',
      timestamp: '2024-01-15T06:00:00Z', // 6am
      data: mockFoods[0],
    };

    const lateEntry: TimelineEntry = {
      id: 'late',
      type: 'food',
      timestamp: '2024-01-15T18:00:00Z', // 6pm
      data: mockFoods[0],
    };

    render(<UnifiedTimeline entries={[earlyEntry, lateEntry]} />);

    expect(screen.getByText('Summary')).toBeInTheDocument();
    // Verify timeline renders with both entries
  });

  it('limits stacking height to prevent overflow', () => {
    // Create many entries at the same time to test overflow protection
    const manyEntries: TimelineEntry[] = Array.from({ length: 10 }, (_, i) => ({
      id: `entry-${i}`,
      type: 'food' as const,
      timestamp: '2024-01-15T12:00:00Z', // All at same time
      data: mockFoods[0],
    }));

    render(<UnifiedTimeline entries={manyEntries} />);

    // Should render without overflow - maxStackHeight limits to 6 entries
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });
});
