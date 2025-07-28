/**
 * Food Entry Form Component Test
 * 
 * Example of component testing pattern
 */

import { render, screen, fireEvent, waitFor } from '@/__tests__/setup/test-utils'
import userEvent from '@testing-library/user-event'
import { FoodEntryForm } from '../food-entry-form'
import { mockIngredients } from '@/__tests__/fixtures/foods'

// Mock the API route
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('FoodEntryForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the form with all required fields', () => {
    render(
      <FoodEntryForm
        onAddFood={mockOnSubmit}
        onClose={mockOnCancel}
      />
    )

    expect(screen.getByLabelText(/meal type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ingredients/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should handle ingredient input and addition', async () => {
    const user = userEvent.setup()
    
    render(
      <FoodEntryForm
        onAddFood={mockOnSubmit}
        onClose={mockOnCancel}
      />
    )

    const ingredientInput = screen.getByLabelText(/ingredients/i)
    const addButton = screen.getByRole('button', { name: /add/i })

    await user.type(ingredientInput, 'Organic Spinach')
    await user.click(addButton)

    expect(screen.getByText('Organic Spinach')).toBeInTheDocument()
  })

  it('should call AI zoning API when analyzing ingredients', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ingredients: mockIngredients
      })
    })

    const user = userEvent.setup()
    
    render(
      <FoodEntryForm
        onAddFood={mockOnSubmit}
        onClose={mockOnCancel}
      />
    )

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/zone-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ['Spinach', 'Salmon'] })
      })
    })
  })

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    const user = userEvent.setup()
    
    render(
      <FoodEntryForm
        onAddFood={mockOnSubmit}
        onClose={mockOnCancel}
      />
    )

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <FoodEntryForm
        onAddFood={mockOnSubmit}
        onClose={mockOnCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })
})