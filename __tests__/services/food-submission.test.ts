/**
 * Essential tests for food-submission service MVP
 * Focused on critical business logic and error scenarios
 */

import {
  processFoodSubmission,
  type FoodSubmissionData,
} from '@/lib/services/food-submission';

// Mock the logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock the sanitization functions
jest.mock('@/lib/security/sanitization', () => ({
  sanitizeText: jest.fn(text => text.toLowerCase().trim()),
  sanitizeIngredientName: jest.fn(name => name.toLowerCase().trim()),
  sanitizeUserNote: jest.fn(note => note.trim()),
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('processFoodSubmission', () => {
  const baseData: FoodSubmissionData = {
    name: 'Test Meal',
    ingredients: [],
    currentIngredient: '',
    notes: '',
    selectedDateTime: new Date('2024-01-01T12:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Functionality', () => {
    it('should reject submission with no ingredients', async () => {
      const result = await processFoodSubmission(baseData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NO_VALID_INGREDIENTS');
    });

    it('should successfully process ingredient with AI zoning', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ingredients: [
            {
              name: 'spinach',
              zone: 'green',
              category: 'Vegetables',
              group: 'Leafy Greens',
            },
          ],
        }),
      });

      const data: FoodSubmissionData = {
        ...baseData,
        currentIngredient: 'Spinach',
      };

      const result = await processFoodSubmission(data);

      expect(result.success).toBe(true);
      expect(result.food?.ingredients[0]).toEqual({
        name: 'spinach',
        organic: false,
        category: 'Vegetables',
        group: 'Leafy Greens',
        zone: 'green',
      });
      expect(result.food?.status).toBe('processed');
    });

    it('should handle AI zoning API failures gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Server error' } }),
      });

      const data: FoodSubmissionData = {
        ...baseData,
        currentIngredient: 'Apple',
      };

      const result = await processFoodSubmission(data);

      expect(result.success).toBe(true);
      expect(result.food?.ingredients[0].zone).toBe('unzoned');
      expect(result.warnings).toContain(
        'Server error. Saving with default values.'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during zoning gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const data: FoodSubmissionData = {
        ...baseData,
        currentIngredient: 'Apple',
      };

      const result = await processFoodSubmission(data);

      expect(result.success).toBe(true);
      expect(result.food?.ingredients[0].zone).toBe('unzoned');
      expect(result.warnings).toContain(
        'Could not process ingredient zones. Using default values.'
      );
    });
  });
});
