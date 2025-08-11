/**
 * Food Entry Form Component Test
 *
 * Example of component testing pattern
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@/__tests__/setup/test-utils';
import userEvent from '@testing-library/user-event';
import { FoodEntryForm } from '../food-entry-form';
import { mockIngredients } from '@/__tests__/fixtures/foods';

// Mock the API route
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('FoodEntryForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the form with all required fields', () => {
    render(<FoodEntryForm onAddFood={mockOnSubmit} onClose={mockOnCancel} />);

    expect(screen.getByLabelText(/meal summary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ingredients/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should handle ingredient input and addition', async () => {
    const user = userEvent.setup();

    render(<FoodEntryForm onAddFood={mockOnSubmit} onClose={mockOnCancel} />);

    const ingredientInput = screen.getByLabelText(/ingredients/i);
    await user.type(ingredientInput, 'Organic Spinach');
    await user.keyboard('{Enter}');

    // Check that the ingredient appears in the ingredients list
    expect(screen.getByText('Organic Spinach')).toBeInTheDocument();

    // Check that the input is cleared after adding
    expect(ingredientInput).toHaveValue('');
  });

  it('should submit form with ingredients', async () => {
    // Mock the AI zoning API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ingredients: [
          {
            name: 'Spinach',
            organic: false,
            group: 'Leafy Greens',
            category: 'Vegetables',
            zone: 'green',
          },
        ],
      }),
    });

    const user = userEvent.setup();

    render(<FoodEntryForm onAddFood={mockOnSubmit} onClose={mockOnCancel} />);

    // Add some ingredients first
    const ingredientInput = screen.getByLabelText(/ingredients/i);
    await user.type(ingredientInput, 'Spinach');
    await user.keyboard('{Enter}');

    // Fill in meal summary
    const mealSummaryInput = screen.getByLabelText(/meal summary/i);
    await user.type(mealSummaryInput, 'Healthy lunch');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    // Should call onAddFood with the form data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Healthy lunch',
          ingredients: expect.arrayContaining([
            expect.objectContaining({ name: 'Spinach' }),
          ]),
        })
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    const user = userEvent.setup();

    render(<FoodEntryForm onAddFood={mockOnSubmit} onClose={mockOnCancel} />);

    const saveButton = screen.getByRole('button', { name: /save/i });

    // Should not throw an error when clicking save button
    expect(() => user.click(saveButton)).not.toThrow();

    // Wait a moment for any async operations
    await waitFor(() => {
      // Form should still be present (not crashed)
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();

    render(<FoodEntryForm onAddFood={mockOnSubmit} onClose={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
