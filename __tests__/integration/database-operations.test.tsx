/**
 * Database Operations Tests
 *
 * Tests the core database operations:
 * - CRUD operations with mocked Supabase client
 * - Data fetching and processing logic
 * - Error handling scenarios
 */

import * as dbModule from '@/lib/db';
import { mockSupabaseClient } from '../setup/jest.setup';

describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
    });
  });

  it('should add food with user context', async () => {
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: 'new-food-id' },
          error: null,
        }),
      }),
    });

    mockSupabaseClient.from.mockReturnValue({
      insert: mockInsert,
    });

    const foodData = {
      name: 'Test Food',
      ingredients: [{ name: 'spinach', zone: 'green', organic: true }],
    };

    const result = await dbModule.addFood(foodData);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('foods');
    expect(mockInsert).toHaveBeenCalledWith({
      id: expect.any(String),
      name: foodData.name,
      ingredients: foodData.ingredients,
      notes: undefined,
      meal_type: undefined,
      status: 'processed',
      photo_url: undefined,
      image_urls: null,
      user_id: 'test-user-id',
      timestamp: expect.any(String),
    });
    expect(result).toBe('new-food-id');
  });

  it("should get today's foods with proper date filtering", async () => {
    const mockFoods = [
      {
        id: '1',
        name: 'Morning Smoothie',
        timestamp: new Date().toISOString(),
        user_id: 'test-user-id',
      },
    ];

    const mockSelect = jest.fn().mockReturnValue({
      gte: jest.fn().mockReturnValue({
        lte: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockFoods,
            error: null,
          }),
        }),
      }),
    });

    mockSupabaseClient.from.mockReturnValue({
      select: mockSelect,
    });

    const result = await dbModule.getTodaysFoods();

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('foods');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(result).toEqual(mockFoods);
  });

  it('should handle database errors gracefully', async () => {
    const mockError = new Error('Database connection failed');

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    });

    await expect(dbModule.getAllFoods()).rejects.toThrow(
      'Database connection failed'
    );
  });

  it('should update food by ID', async () => {
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        error: null,
      }),
    });

    mockSupabaseClient.from.mockReturnValue({
      update: mockUpdate,
    });

    const updates = { name: 'Updated Food Name' };
    await dbModule.updateFood('food-123', updates);

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('foods');
    expect(mockUpdate).toHaveBeenCalledWith(updates);
  });

  it('should delete food by ID', async () => {
    const mockDelete = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        error: null,
      }),
    });

    mockSupabaseClient.from.mockReturnValue({
      delete: mockDelete,
    });

    await dbModule.deleteFood('food-123');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('foods');
    expect(mockDelete).toHaveBeenCalled();
  });
});
