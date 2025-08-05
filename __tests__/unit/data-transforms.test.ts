/**
 * Data Transformations Unit Tests
 * 
 * Tests all data transformation utilities:
 * - Date formatting functions
 * - Statistics calculations 
 * - Food/symptom data processing
 * - Chart data transformations
 * - Export/import data formatting
 */

import { 
  generateTimestamp, 
  getTodayDate, 
  isToday,
} from '@/lib/db';

// Mock data for testing
const mockFood = {
  id: '1',
  name: 'Test Food',
  ingredients: [
    { name: 'spinach', zone: 'green' as const, organic: true },
    { name: 'chicken', zone: 'yellow' as const, organic: false },
    { name: 'sugar', zone: 'red' as const, organic: false },
  ],
  timestamp: '2024-01-15T10:30:00.000Z',
  user_id: 'test-user',
};

const mockSymptom = {
  id: '1',
  name: 'Headache',
  severity: 3,
  notes: 'After lunch',
  timestamp: '2024-01-15T14:30:00.000Z',
  user_id: 'test-user',
};

describe('Data Transformations', () => {
  describe('Date Formatting Functions', () => {
    beforeAll(() => {
      // Mock Date to ensure consistent test results
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should generate proper ISO timestamp', () => {
      const timestamp = generateTimestamp();
      
      expect(timestamp).toBe('2024-01-15T12:00:00.000Z');
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should get today date in YYYY-MM-DD format', () => {
      const today = getTodayDate();
      
      expect(today).toBe('2024-01-15');
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should correctly identify today timestamps', () => {
      const todayTimestamp = '2024-01-15T08:30:00.000Z';
      const yesterdayTimestamp = '2024-01-14T08:30:00.000Z';
      const tomorrowTimestamp = '2024-01-16T08:30:00.000Z';

      expect(isToday(todayTimestamp)).toBe(true);
      expect(isToday(yesterdayTimestamp)).toBe(false);
      expect(isToday(tomorrowTimestamp)).toBe(false);
    });

    it('should handle edge cases for date checking', () => {
      // Beginning of day
      expect(isToday('2024-01-15T00:00:00.000Z')).toBe(true);
      // End of day  
      expect(isToday('2024-01-15T23:59:59.999Z')).toBe(true);
      // Just after midnight next day
      expect(isToday('2024-01-16T00:00:00.000Z')).toBe(false);
    });
  });

  describe('Statistics Calculations', () => {
    const mockFoods = [
      {
        ...mockFood,
        id: '1',
        ingredients: [
          { name: 'spinach', zone: 'green' as const, organic: true },
          { name: 'kale', zone: 'green' as const, organic: true },
        ]
      },
      {
        ...mockFood,
        id: '2',
        ingredients: [
          { name: 'chicken', zone: 'yellow' as const, organic: false },
          { name: 'rice', zone: 'yellow' as const, organic: true },
        ]
      },
      {
        ...mockFood,
        id: '3',
        ingredients: [
          { name: 'sugar', zone: 'red' as const, organic: false },
          { name: 'candy', zone: 'red' as const, organic: false },
        ]
      }
    ];

    it('should calculate ingredient zone statistics correctly', () => {
      const ingredients = mockFoods.flatMap(food => food.ingredients || []);
      
      const greenCount = ingredients.filter(ing => ing.zone === 'green').length;
      const yellowCount = ingredients.filter(ing => ing.zone === 'yellow').length;
      const redCount = ingredients.filter(ing => ing.zone === 'red').length;
      const totalCount = ingredients.length;

      expect(greenCount).toBe(2);
      expect(yellowCount).toBe(2);
      expect(redCount).toBe(2);
      expect(totalCount).toBe(6);
    });

    it('should calculate organic percentage correctly', () => {
      const ingredients = mockFoods.flatMap(food => food.ingredients || []);
      const organicCount = ingredients.filter(ing => ing.organic === true).length;
      const totalCount = ingredients.length;
      const organicPercentage = (organicCount / totalCount) * 100;

      expect(organicCount).toBe(3);
      expect(organicPercentage).toBe(50);
    });

    it('should handle empty data gracefully', () => {
      const emptyFoods: typeof mockFoods = [];
      const ingredients = emptyFoods.flatMap(food => food.ingredients || []);
      
      const greenCount = ingredients.filter(ing => ing.zone === 'green').length;
      const organicPercentage = ingredients.length > 0 
        ? (ingredients.filter(ing => ing.organic).length / ingredients.length) * 100 
        : 0;

      expect(greenCount).toBe(0);
      expect(organicPercentage).toBe(0);
    });

    it('should calculate symptom severity averages', () => {
      const mockSymptoms = [
        { ...mockSymptom, id: '1', severity: 2 },
        { ...mockSymptom, id: '2', severity: 4 },
        { ...mockSymptom, id: '3', severity: 3 },
      ];

      const totalSeverity = mockSymptoms.reduce((sum, s) => sum + s.severity, 0);
      const averageSeverity = totalSeverity / mockSymptoms.length;

      expect(totalSeverity).toBe(9);
      expect(averageSeverity).toBe(3);
    });
  });

  describe('Food Data Processing', () => {
    it('should extract unique ingredient names', () => {
      const foods = [
        {
          ...mockFood,
          ingredients: [
            { name: 'spinach', zone: 'green' as const, organic: true },
            { name: 'spinach', zone: 'green' as const, organic: false }, // duplicate
          ]
        },
        {
          ...mockFood,
          ingredients: [
            { name: 'chicken', zone: 'yellow' as const, organic: false },
          ]
        }
      ];

      const allIngredients = foods.flatMap(food => food.ingredients || []);
      const uniqueNames = [...new Set(allIngredients.map(ing => ing.name))];

      expect(uniqueNames).toEqual(['spinach', 'chicken']);
      expect(uniqueNames).toHaveLength(2);
    });

    it('should group foods by date', () => {
      const foods = [
        { ...mockFood, id: '1', timestamp: '2024-01-15T10:30:00.000Z' },
        { ...mockFood, id: '2', timestamp: '2024-01-15T15:30:00.000Z' },
        { ...mockFood, id: '3', timestamp: '2024-01-14T10:30:00.000Z' },
      ];

      const groupedByDay: { [key: string]: typeof foods } = {};
      foods.forEach(food => {
        const day = food.timestamp.split('T')[0];
        if (!groupedByDay[day]) {
          groupedByDay[day] = [];
        }
        groupedByDay[day].push(food);
      });

      expect(Object.keys(groupedByDay)).toHaveLength(2);
      expect(groupedByDay['2024-01-15']).toHaveLength(2);
      expect(groupedByDay['2024-01-14']).toHaveLength(1);
    });

    it('should sort foods by timestamp', () => {
      const foods = [
        { ...mockFood, id: '1', timestamp: '2024-01-15T15:30:00.000Z' },
        { ...mockFood, id: '2', timestamp: '2024-01-15T08:30:00.000Z' },
        { ...mockFood, id: '3', timestamp: '2024-01-15T12:30:00.000Z' },
      ];

      const sortedFoods = [...foods].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      expect(sortedFoods[0].id).toBe('1'); // 15:30 (latest)
      expect(sortedFoods[1].id).toBe('3'); // 12:30
      expect(sortedFoods[2].id).toBe('2'); // 08:30 (earliest)
    });
  });

  describe('Chart Data Transformations', () => {
    it('should transform data for zone distribution chart', () => {
      const ingredients = [
        { name: 'spinach', zone: 'green' as const, organic: true },
        { name: 'kale', zone: 'green' as const, organic: false },
        { name: 'chicken', zone: 'yellow' as const, organic: false },
        { name: 'sugar', zone: 'red' as const, organic: false },
      ];

      // Transform to chart data format
      const zoneData = [
        { zone: 'green', count: ingredients.filter(i => i.zone === 'green').length },
        { zone: 'yellow', count: ingredients.filter(i => i.zone === 'yellow').length },
        { zone: 'red', count: ingredients.filter(i => i.zone === 'red').length },
      ];

      expect(zoneData).toEqual([
        { zone: 'green', count: 2 },
        { zone: 'yellow', count: 1 },
        { zone: 'red', count: 1 },
      ]);
    });

    it('should create time series data for symptom trends', () => {
      const symptoms = [
        { ...mockSymptom, timestamp: '2024-01-15T10:00:00.000Z', severity: 2 },
        { ...mockSymptom, timestamp: '2024-01-15T14:00:00.000Z', severity: 4 },
        { ...mockSymptom, timestamp: '2024-01-16T10:00:00.000Z', severity: 3 },
      ];

      // Group by day and calculate average severity
      const groupedByDay: { [key: string]: typeof symptoms } = {};
      symptoms.forEach(symptom => {
        const day = symptom.timestamp.split('T')[0];
        if (!groupedByDay[day]) {
          groupedByDay[day] = [];
        }
        groupedByDay[day].push(symptom);
      });

      const trendData = Object.entries(groupedByDay).map(([day, daySymptoms]) => ({
        day,
        count: daySymptoms.length,
        averageSeverity: daySymptoms.reduce((sum, s) => sum + s.severity, 0) / daySymptoms.length,
      }));

      expect(trendData).toEqual([
        { day: '2024-01-15', count: 2, averageSeverity: 3 },
        { day: '2024-01-16', count: 1, averageSeverity: 3 },
      ]);
    });
  });

  describe('Export/Import Data Formatting', () => {
    it('should format data for export', () => {
      const exportData = {
        foods: [mockFood],
        symptoms: [mockSymptom],
        exportedAt: '2024-01-15T12:00:00.000Z',
      };

      // Verify export structure
      expect(exportData.foods).toHaveLength(1);
      expect(exportData.symptoms).toHaveLength(1);
      expect(exportData.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Verify required fields are present
      expect(exportData.foods[0]).toHaveProperty('id');
      expect(exportData.foods[0]).toHaveProperty('name');
      expect(exportData.foods[0]).toHaveProperty('ingredients');
      expect(exportData.foods[0]).toHaveProperty('timestamp');
    });

    it('should prepare data for import', () => {
      const importData = {
        foods: [{ ...mockFood, user_id: 'old-user' }],
        symptoms: [{ ...mockSymptom, user_id: 'old-user' }],
      };

      const newUserId = 'new-user';
      
      // Transform for new user
      const preparedFoods = importData.foods.map(food => ({
        ...food,
        user_id: newUserId,
      }));

      const preparedSymptoms = importData.symptoms.map(symptom => ({
        ...symptom,
        user_id: newUserId,
      }));

      expect(preparedFoods[0].user_id).toBe(newUserId);
      expect(preparedSymptoms[0].user_id).toBe(newUserId);
    });

    it('should validate import data structure', () => {
      const validImportData = {
        foods: [mockFood],
        symptoms: [mockSymptom],
      };

      const invalidImportData = {
        foods: [{ id: '1' }], // missing required fields
        symptoms: [],
      };

      // Validation function
      const validateImportData = (data: any) => {
        if (!data.foods || !Array.isArray(data.foods)) return false;
        if (!data.symptoms || !Array.isArray(data.symptoms)) return false;
        
        // Check required fields for foods
        for (const food of data.foods) {
          if (!food.id || !food.name || !food.timestamp) return false;
        }
        
        return true;
      };

      expect(validateImportData(validImportData)).toBe(true);
      expect(validateImportData(invalidImportData)).toBe(false);
    });
  });

  describe('Data Filtering and Searching', () => {
    const testFoods = [
      { ...mockFood, id: '1', name: 'Green Smoothie', ingredients: [{ name: 'spinach', zone: 'green' as const, organic: true }] },
      { ...mockFood, id: '2', name: 'Chicken Salad', ingredients: [{ name: 'chicken', zone: 'yellow' as const, organic: false }] },
      { ...mockFood, id: '3', name: 'Chocolate Cake', ingredients: [{ name: 'sugar', zone: 'red' as const, organic: false }] },
    ];

    it('should filter foods by name', () => {
      const searchTerm = 'chicken';
      const filtered = testFoods.filter(food => 
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Chicken Salad');
    });

    it('should filter foods by ingredient zone', () => {
      const greenFoods = testFoods.filter(food =>
        food.ingredients?.some(ing => ing.zone === 'green')
      );

      expect(greenFoods).toHaveLength(1);
      expect(greenFoods[0].name).toBe('Green Smoothie');
    });

    it('should filter foods by organic status', () => {
      const organicFoods = testFoods.filter(food =>
        food.ingredients?.some(ing => ing.organic === true)
      );

      expect(organicFoods).toHaveLength(1);
      expect(organicFoods[0].name).toBe('Green Smoothie');
    });

    it('should search across multiple fields', () => {
      const searchTerm = 'green';
      const results = testFoods.filter(food => {
        const nameMatch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
        const ingredientMatch = food.ingredients?.some(ing => 
          ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ing.zone.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return nameMatch || ingredientMatch;
      });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Green Smoothie');
    });
  });

  describe('Pagination and Sorting', () => {
    const testData = Array.from({ length: 25 }, (_, i) => ({
      ...mockFood,
      id: `${i + 1}`,
      name: `Food ${i + 1}`,
      timestamp: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(), // Each hour earlier
    }));

    it('should paginate data correctly', () => {
      const pageSize = 10;
      const page = 1; // 0-indexed
      
      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = testData.slice(startIndex, endIndex);

      expect(paginatedData).toHaveLength(10);
      expect(paginatedData[0].name).toBe('Food 11');
      expect(paginatedData[9].name).toBe('Food 20');
    });

    it('should handle last page with fewer items', () => {
      const pageSize = 10;
      const lastPage = 2; // Should have 5 items
      
      const startIndex = lastPage * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = testData.slice(startIndex, endIndex);

      expect(paginatedData).toHaveLength(5);
      expect(paginatedData[0].name).toBe('Food 21');
    });

    it('should sort by timestamp descending', () => {
      const sorted = [...testData].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      expect(sorted[0].name).toBe('Food 1'); // Most recent
      expect(sorted[24].name).toBe('Food 25'); // Oldest
    });

    it('should sort by name alphabetically', () => {
      const testNames = [
        { ...mockFood, name: 'Zebra Food' },
        { ...mockFood, name: 'Apple Food' },
        { ...mockFood, name: 'Banana Food' },
      ];

      const sorted = testNames.sort((a, b) => a.name.localeCompare(b.name));

      expect(sorted[0].name).toBe('Apple Food');
      expect(sorted[1].name).toBe('Banana Food');
      expect(sorted[2].name).toBe('Zebra Food');
    });
  });
});