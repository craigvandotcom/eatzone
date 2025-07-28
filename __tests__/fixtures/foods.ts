import { Food, Ingredient } from '@/lib/types'

export const mockIngredients: Ingredient[] = [
  {
    name: 'Organic Spinach',
    organic: true,
    zone: 'green',
    foodGroup: 'vegetables',
  },
  {
    name: 'Wild Salmon',
    organic: false,
    zone: 'green',
    foodGroup: 'protein',
  },
  {
    name: 'White Sugar',
    organic: false,
    zone: 'red',
    foodGroup: 'sweets',
  },
]

export const mockFoods: Food[] = [
  {
    id: '1',
    name: 'Healthy Lunch',
    timestamp: new Date('2024-01-15T12:00:00Z').toISOString(),
    meal_type: 'lunch',
    ingredients: [mockIngredients[0], mockIngredients[1]],
    photo_url: '/test-image-1.jpg',
    notes: 'Healthy lunch',
    status: 'processed',
  },
  {
    id: '2',
    name: 'Mixed Dinner',
    timestamp: new Date('2024-01-15T19:00:00Z').toISOString(),
    meal_type: 'dinner',
    ingredients: mockIngredients,
    photo_url: '/test-image-2.jpg',
    notes: 'Mixed meal',
    status: 'processed',
  },
]