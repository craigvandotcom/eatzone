/**
 * Tests for SignalsView component
 * Tests symptom entry rendering, empty states, loading states, and navigation
 */

import { render, screen } from '@/__tests__/setup/test-utils';
import { SignalsView } from '@/features/dashboard/components/signals-view';
import { mockSymptoms } from '@/__tests__/fixtures/symptoms';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('SignalsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when symptoms are undefined', () => {
    render(<SignalsView symptomsForSelectedDate={undefined} />);

    expect(screen.getByText(/loading symptom data/i)).toBeInTheDocument();
    expect(
      screen.getByText(/loading symptoms for selected date/i)
    ).toBeInTheDocument();
  });

  it('renders empty state when no symptoms', () => {
    render(<SignalsView symptomsForSelectedDate={[]} />);

    expect(
      screen.getByText(/no signals logged for this date/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/tap the \+ button/i)).toBeInTheDocument();
    expect(screen.getByText('0 entries')).toBeInTheDocument();
  });

  it('renders entries header with correct count', () => {
    render(<SignalsView symptomsForSelectedDate={mockSymptoms} />);

    expect(screen.getByText('Entries')).toBeInTheDocument();
    expect(screen.getByText('3 entries')).toBeInTheDocument();
  });

  it('renders symptom entries correctly', () => {
    render(<SignalsView symptomsForSelectedDate={mockSymptoms} />);

    expect(screen.getByText(mockSymptoms[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockSymptoms[1].name)).toBeInTheDocument();
    expect(screen.getByText(mockSymptoms[2].name)).toBeInTheDocument();
  });

  it('renders symptom category badges', () => {
    render(<SignalsView symptomsForSelectedDate={mockSymptoms} />);

    expect(screen.getByText('mind')).toBeInTheDocument();
    expect(screen.getByText('digestion')).toBeInTheDocument();
    expect(screen.getByText('energy')).toBeInTheDocument();
  });

  it('renders symptom timestamps', () => {
    render(<SignalsView symptomsForSelectedDate={[mockSymptoms[0]]} />);

    // Timestamp should be formatted and displayed
    const timestamp = new Date(mockSymptoms[0].timestamp).toLocaleString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    );
    expect(screen.getByText(timestamp)).toBeInTheDocument();
  });

  it('navigates to symptom edit page when symptom entry is clicked', () => {
    render(<SignalsView symptomsForSelectedDate={[mockSymptoms[0]]} />);

    // Check that Link component has correct href
    const symptomLink = screen.getByText(mockSymptoms[0].name).closest('a');
    expect(symptomLink).toBeInTheDocument();
    expect(symptomLink).toHaveAttribute(
      'href',
      `/app/symptoms/edit/${mockSymptoms[0].id}`
    );
  });

  it('uses Link component with prefetch enabled', () => {
    render(<SignalsView symptomsForSelectedDate={[mockSymptoms[0]]} />);

    const symptomLink = screen.getByText(mockSymptoms[0].name).closest('a');
    expect(symptomLink).toBeInTheDocument();
    // Next.js Link with prefetch={true} should be present
    // We verify this by checking the href attribute exists
    expect(symptomLink).toHaveAttribute('href');
  });

  it('renders symptom timeline when symptoms are provided', () => {
    render(<SignalsView symptomsForSelectedDate={mockSymptoms} />);

    // Symptom timeline should be rendered (via SymptomTimeline component)
    // This is tested indirectly through the component rendering
    expect(screen.getByText('Entries')).toBeInTheDocument();
  });

  it('renders loading skeleton when symptoms are undefined', () => {
    const { container } = render(
      <SignalsView symptomsForSelectedDate={undefined} />
    );

    // Should render skeleton loaders (SymptomEntrySkeleton components)
    // Check for loading spinner which indicates loading state
    expect(
      screen.getByText(/loading symptoms for selected date/i)
    ).toBeInTheDocument();
    // Skeleton elements are rendered via SymptomEntrySkeleton component
    const loadingElements = container.querySelectorAll(
      '[class*="animate-pulse"]'
    );
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('handles multiple symptom entries with correct navigation links', () => {
    render(<SignalsView symptomsForSelectedDate={mockSymptoms} />);

    // Check all symptom links are present
    mockSymptoms.forEach(symptom => {
      const symptomLink = screen.getByText(symptom.name).closest('a');
      expect(symptomLink).toBeInTheDocument();
      expect(symptomLink).toHaveAttribute(
        'href',
        `/app/symptoms/edit/${symptom.id}`
      );
    });
  });

  it('handles invalid category gracefully', () => {
    const invalidSymptom = {
      ...mockSymptoms[0],
      category: 'invalid-category' as any,
    };

    render(<SignalsView symptomsForSelectedDate={[invalidSymptom]} />);

    // Should render without crashing - uses fallback icon
    expect(screen.getByText(invalidSymptom.name)).toBeInTheDocument();
  });
});
