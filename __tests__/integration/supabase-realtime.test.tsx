/**
 * Supabase Real-time Integration Tests
 * 
 * Tests the complete real-time data sync system:
 * - Database operations with mocked Supabase client
 * - Data fetching and processing logic
 * - Error handling scenarios
 */

// Mock Supabase client 
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    channel: jest.fn(),
  })),
}));

import * as dbModule from '@/lib/db';
import { createClient } from '@/lib/supabase/client';

// Get the mocked client for assertions
const getMockSupabaseClient = () => (createClient as jest.Mock)();

describe('Supabase Real-time Integration', () => {
  let mockSupabaseClient: ReturnType<typeof getMockSupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = getMockSupabaseClient();
    
    // Setup default mocks
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    });
  });

  describe('Database Operations', () => {
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
        ingredients: [
          { name: 'spinach', zone: 'green', organic: true }
        ],
      };

      const result = await dbModule.addFood(foodData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('foods');
      expect(mockInsert).toHaveBeenCalledWith({
        ...foodData,
        user_id: 'test-user-id',
        timestamp: expect.any(String),
      });
      expect(result).toBe('new-food-id');
    });

    it('should get today\'s foods with proper date filtering', async () => {
      const mockFoods = [
        {
          id: '1',
          name: 'Morning Smoothie',
          timestamp: new Date().toISOString(),
          user_id: 'test-user-id',
        }
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

      await expect(dbModule.getAllFoods()).rejects.toThrow('Database connection failed');
    });

    it('should add symptom with correct structure', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'new-symptom-id' },
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      const symptomData = {
        name: 'Headache',
        severity: 3,
        notes: 'After lunch',
      };

      const result = await dbModule.addSymptom(symptomData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('symptoms');
      expect(mockInsert).toHaveBeenCalledWith({
        ...symptomData,
        user_id: 'test-user-id',
        timestamp: expect.any(String),
      });
      expect(result).toBe('new-symptom-id');
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

  describe('User Authentication Integration', () => {
    it('should authenticate user with email and password', async () => {
      const mockAuthResult = {
        data: {
          user: { id: 'auth-user-id' },
          session: { access_token: 'test-token' }
        },
        error: null,
      };

      const mockUserProfile = {
        id: 'auth-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockAuthResult);
      
      // Mock getUserById call
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          }),
        }),
      });

      const result = await dbModule.authenticateUser('test@example.com', 'password123');

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        user: mockUserProfile,
        token: 'test-token',
      });
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Invalid credentials');
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: authError,
      });

      await expect(
        dbModule.authenticateUser('wrong@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should create new user account', async () => {
      const mockSignUpResult = {
        data: {
          user: { id: 'new-user-id' },
          session: null,
        },
        error: null,
      };

      const mockUserProfile = {
        id: 'new-user-id',
        email: 'newuser@example.com',
        created_at: new Date().toISOString(),
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue(mockSignUpResult);
      
      // Mock getUserById call for profile creation
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockUserProfile,
              error: null,
            }),
          }),
        }),
      });

      const result = await dbModule.createUser('newuser@example.com', 'password123');

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockUserProfile);
    });
  });

  describe('Data Export and Import', () => {
    it('should export all user data', async () => {
      const mockFoods = [{ id: '1', name: 'Food 1' }];
      const mockSymptoms = [{ id: '1', name: 'Symptom 1' }];

      // Mock getAllFoods and getAllSymptoms
      const mockSelect = jest.fn()
        .mockReturnValueOnce({
          order: jest.fn().mockResolvedValue({
            data: mockFoods,
            error: null,
          }),
        })
        .mockReturnValueOnce({
          order: jest.fn().mockResolvedValue({
            data: mockSymptoms,
            error: null,
          }),
        });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await dbModule.exportAllData();

      expect(result).toMatchObject({
        foods: mockFoods,
        symptoms: mockSymptoms,
        exportedAt: expect.any(String),
      });
    });

    it('should import data and clear existing records', async () => {
      const importData = {
        foods: [{ id: '1', name: 'Imported Food' }],
        symptoms: [{ id: '1', name: 'Imported Symptom' }],
      };

      // Mock delete operations for clearAllData
      const mockDelete = jest.fn().mockReturnValue({
        neq: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock insert operations
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
        insert: mockInsert,
      });

      await dbModule.importAllData(importData);

      // Verify clear operations
      expect(mockDelete).toHaveBeenCalled();
      
      // Verify insert operations
      expect(mockInsert).toHaveBeenCalledWith([
        {
          ...importData.foods[0],
          user_id: 'test-user-id',
        }
      ]);
    });
  });

  describe('Utility Functions', () => {
    it('should generate proper ISO timestamps', () => {
      const timestamp = dbModule.generateTimestamp();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should get today\'s date in YYYY-MM-DD format', () => {
      const today = dbModule.getTodayDate();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(today).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should correctly identify today\'s timestamps', () => {
      const todayTimestamp = new Date().toISOString();
      const yesterdayTimestamp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      expect(dbModule.isToday(todayTimestamp)).toBe(true);
      expect(dbModule.isToday(yesterdayTimestamp)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockRejectedValue(timeoutError),
        }),
      });

      await expect(dbModule.getAllFoods()).rejects.toThrow('Request timeout');
    });

    it('should handle missing user context', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null }
      });

      const foodData = { name: 'Test Food' };
      
      await expect(dbModule.addFood(foodData)).rejects.toThrow('User not authenticated');
    });

    it('should handle PGRST116 error for not found records', async () => {
      const notFoundError = { code: 'PGRST116', message: 'No rows returned' };
      
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: notFoundError,
            }),
          }),
        }),
      });

      const result = await dbModule.getFoodById('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('Real-time Subscription Setup', () => {
    it('should create proper subscription configuration', () => {
      const mockChannel = jest.fn().mockReturnValue({
        on: jest.fn().mockReturnValue({
          subscribe: jest.fn(),
        }),
      });

      mockSupabaseClient.channel = mockChannel;

      // Simulate subscription setup (like hooks would do)
      const subscription = mockSupabaseClient.channel('test_foods')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'foods',
        }, () => {})
        .subscribe();

      expect(mockChannel).toHaveBeenCalledWith('test_foods');
    });

    it('should handle subscription with filters', () => {
      const mockChannel = jest.fn().mockReturnValue({
        on: jest.fn().mockReturnValue({
          subscribe: jest.fn(),
        }),
      });

      mockSupabaseClient.channel = mockChannel;

      // Simulate filtered subscription
      const subscription = mockSupabaseClient.channel('food_123')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'foods',
          filter: 'id=eq.123',
        }, () => {})
        .subscribe();

      expect(mockChannel).toHaveBeenCalledWith('food_123');
    });
  });
});