/**
 * Basic CRUD Operations Test
 *
 * Tests the core user journey of creating, reading, and deleting data
 */

import * as dbModule from '@/lib/db';
import { mockSupabaseClient } from '../setup/jest.setup';

describe('Basic CRUD Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default auth mock
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    });
  });

  it('should complete a basic food tracking journey', async () => {
    const foodId = 'food-123';
    const foodData = {
      name: 'Breakfast Smoothie',
      ingredients: [
        { name: 'spinach', zone: 'green', organic: true },
        { name: 'banana', zone: 'yellow', organic: false },
      ],
    };

    // Mock successful food creation
    mockSupabaseClient.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: foodId, ...foodData },
            error: null,
          }),
        }),
      }),
    });

    // Create food
    const createdId = await dbModule.addFood(foodData);
    expect(createdId).toBe(foodId);

    // Mock successful food retrieval
    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [
            { id: foodId, ...foodData, timestamp: new Date().toISOString() },
          ],
          error: null,
        }),
      }),
    });

    // Get all foods and verify it exists
    const allFoods = await dbModule.getAllFoods();
    expect(allFoods).toHaveLength(1);
    expect(allFoods[0].name).toBe('Breakfast Smoothie');

    // Mock successful deletion
    mockSupabaseClient.from.mockReturnValueOnce({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      }),
    });

    // Delete the food
    await dbModule.deleteFood(foodId);

    // Verify delete was called with correct ID
    expect(mockSupabaseClient.from).toHaveBeenLastCalledWith('foods');
  });
});
