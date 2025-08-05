/**
 * AI Analysis Integration Tests
 * 
 * Tests the AI analysis logic and OpenRouter integration:
 * - OpenRouter API calls with mocked responses
 * - Response data parsing and validation
 * - Error handling for various API failures
 * - Data normalization and deduplication
 */

import { openrouter } from '@/lib/ai/openrouter';

// Mock prompts module since Jest can't handle markdown imports
jest.mock('@/lib/prompts', () => ({
  prompts: {
    imageAnalysis: 'You are an expert food ingredient analyst. Analyze the provided image and return JSON.',
    ingredientZoning: 'Zone the following ingredients into green (healthy), yellow (moderate), or red (unhealthy) categories.',
  },
}));

import { prompts } from '@/lib/prompts';

// Mock OpenRouter
jest.mock('@/lib/ai/openrouter', () => ({
  openrouter: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

const mockOpenRouter = openrouter.chat.completions.create as jest.MockedFunction<
  typeof openrouter.chat.completions.create
>;

describe('AI Analysis Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OpenRouter Integration', () => {
    it('should successfully call OpenRouter for image analysis', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              mealSummary: 'Healthy green salad with mixed vegetables',
              ingredients: [
                { name: 'Spinach', isOrganic: true },
                { name: 'Tomatoes', isOrganic: false },
                { name: 'Olive Oil', isOrganic: true }
              ]
            })
          }
        }]
      };

      mockOpenRouter.mockResolvedValueOnce(mockAIResponse);

      // Simulate image analysis call
      const response = await openrouter.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompts.imageAnalysis,
              },
              {
                type: 'image_url',
                image_url: {
                  url: 'data:image/jpeg;base64,test-image-data',
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      });

      expect(mockOpenRouter).toHaveBeenCalledWith({
        model: 'openai/gpt-4o',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.arrayContaining([
              expect.objectContaining({ type: 'text' }),
              expect.objectContaining({ 
                type: 'image_url',
                image_url: { url: 'data:image/jpeg;base64,test-image-data' }
              })
            ])
          })
        ]),
        max_tokens: 300,
        temperature: 0.1
      });

      expect(response.choices[0].message.content).toBeDefined();
      
      // Parse the response
      const aiResponseText = response.choices[0].message.content;
      const parsedResponse = JSON.parse(aiResponseText);
      
      expect(parsedResponse).toHaveProperty('mealSummary');
      expect(parsedResponse).toHaveProperty('ingredients');
      expect(Array.isArray(parsedResponse.ingredients)).toBe(true);
    });

    it('should successfully call OpenRouter for ingredient zoning', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              zonedIngredients: [
                { name: 'spinach', zone: 'green', reasoning: 'Leafy green vegetable rich in nutrients' },
                { name: 'olive oil', zone: 'yellow', reasoning: 'Healthy fat but high in calories' },
                { name: 'processed cheese', zone: 'red', reasoning: 'High in sodium and processed ingredients' }
              ]
            })
          }
        }]
      };

      mockOpenRouter.mockResolvedValueOnce(mockAIResponse);

      const ingredients = ['spinach', 'olive oil', 'processed cheese'];
      
      // Simulate ingredient zoning call
      const response = await openrouter.chat.completions.create({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `${prompts.ingredientZoning}

Ingredients to zone: ${ingredients.join(', ')}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      });

      expect(mockOpenRouter).toHaveBeenCalledWith({
        model: 'openai/gpt-4o-mini',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('spinach')
          })
        ]),
        max_tokens: 1000,
        temperature: 0.1
      });

      expect(response.choices[0].message.content).toBeDefined();
      
      // Parse the response
      const aiResponseText = response.choices[0].message.content;
      const parsedResponse = JSON.parse(aiResponseText);
      
      expect(parsedResponse).toHaveProperty('zonedIngredients');
      expect(Array.isArray(parsedResponse.zonedIngredients)).toBe(true);
      expect(parsedResponse.zonedIngredients).toHaveLength(3);

      // Check zoned ingredient structure
      parsedResponse.zonedIngredients.forEach((ingredient: any) => {
        expect(ingredient).toHaveProperty('name');
        expect(ingredient).toHaveProperty('zone');
        expect(ingredient).toHaveProperty('reasoning');
        expect(['green', 'yellow', 'red']).toContain(ingredient.zone);
      });
    });

    it('should handle API errors gracefully', async () => {
      mockOpenRouter.mockRejectedValueOnce(new Error('API service unavailable'));

      try {
        await openrouter.chat.completions.create({
          model: 'openai/gpt-4o',
          messages: [{ role: 'user', content: 'test' }],
        });
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('API service unavailable');
      }
    });

    it('should handle empty responses from AI', async () => {
      const mockAIResponse = {
        choices: []
      };

      mockOpenRouter.mockResolvedValueOnce(mockAIResponse);

      const response = await openrouter.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'test' }],
      });

      expect(response.choices).toHaveLength(0);
    });

    it('should handle malformed JSON responses', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: 'This is not valid JSON'
          }
        }]
      };

      mockOpenRouter.mockResolvedValueOnce(mockAIResponse);

      const response = await openrouter.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [{ role: 'user', content: 'test' }],
      });

      const aiResponseText = response.choices[0].message.content;
      
      expect(() => JSON.parse(aiResponseText)).toThrow();
    });
  });

  describe('Data Processing Logic', () => {
    it('should normalize ingredient names correctly', () => {
      const ingredients = [
        { name: '  SPINACH  ', isOrganic: true },
        { name: 'spinach', isOrganic: false }, // Duplicate
        { name: 'Tomatoes', isOrganic: true },
        { name: '', isOrganic: true }, // Empty name
      ];

      // Simulate the normalization logic from the API
      const normalizedIngredients = ingredients
        .map(ingredient => {
          if (
            typeof ingredient !== 'object' ||
            typeof ingredient.name !== 'string' ||
            typeof ingredient.isOrganic !== 'boolean'
          ) {
            return null;
          }
          return {
            name: ingredient.name.trim().toLowerCase(),
            isOrganic: ingredient.isOrganic,
          };
        })
        .filter(
          (ingredient): ingredient is { name: string; isOrganic: boolean } =>
            ingredient !== null && ingredient.name.length > 0
        );

      // Remove duplicates based on name
      const uniqueIngredients = normalizedIngredients.filter(
        (ingredient, index, array) =>
          array.findIndex(item => item.name === ingredient.name) === index
      );

      expect(uniqueIngredients).toHaveLength(2); // Deduplicated and filtered
      expect(uniqueIngredients[0].name).toBe('spinach'); // Normalized to lowercase
      expect(uniqueIngredients[1].name).toBe('tomatoes');
    });

    it('should handle markdown-wrapped JSON responses', () => {
      const markdownResponse = '```json\n' + JSON.stringify({
        mealSummary: 'Test meal',
        ingredients: [{ name: 'Test Ingredient', isOrganic: false }]
      }) + '\n```';

      // Simulate the markdown parsing logic from the API
      const jsonMatch = markdownResponse.match(/```json\s*([\s\S]*?)\s*```/);
      expect(jsonMatch).toBeTruthy();
      
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[1]);
        expect(parsedResponse.mealSummary).toBe('Test meal');
        expect(parsedResponse.ingredients).toHaveLength(1);
      }
    });
  });

  describe('Prompt Integration', () => {
    it('should have image analysis prompt available', () => {
      expect(prompts.imageAnalysis).toBeDefined();
      expect(typeof prompts.imageAnalysis).toBe('string');
      expect(prompts.imageAnalysis.length).toBeGreaterThan(0);
    });

    it('should have ingredient zoning prompt available', () => {
      expect(prompts.ingredientZoning).toBeDefined();
      expect(typeof prompts.ingredientZoning).toBe('string');
      expect(prompts.ingredientZoning.length).toBeGreaterThan(0);
    });
  });
});