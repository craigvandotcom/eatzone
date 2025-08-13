import { Food, Ingredient } from '@/lib/types';

export const mockIngredients: Ingredient[] = [
  {
    name: 'Organic Spinach',
    organic: true,
    zone: 'green',
    category: 'Vegetables',
    group: 'Leafy Greens',
  },
  {
    name: 'Wild Salmon',
    organic: false,
    zone: 'green',
    category: 'Proteins',
    group: 'Wild-Caught Seafood',
  },
  {
    name: 'White Sugar',
    organic: false,
    zone: 'red',
    category: 'Sweeteners',
    group: 'Refined Sugars',
  },
];

export const mockFoods: Food[] = [
  {
    id: '1',
    name: 'Healthy Lunch',
    timestamp: new Date('2024-01-15T12:00:00Z').toISOString(),
    ingredients: [mockIngredients[0], mockIngredients[1]],
    photo_url: '/test-image-1.jpg',
    notes: 'Healthy lunch',
    status: 'processed',
  },
  {
    id: '2',
    name: 'Mixed Dinner',
    timestamp: new Date('2024-01-15T19:00:00Z').toISOString(),
    ingredients: mockIngredients,
    photo_url: '/test-image-2.jpg',
    notes: 'Mixed meal',
    status: 'processed',
  },
];
