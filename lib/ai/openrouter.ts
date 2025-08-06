import OpenAI from 'openai';
import { logger } from '@/lib/utils/logger';

// Check API key at initialization
const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  logger.error('OPENROUTER_API_KEY is not set in environment variables');
  // Don't throw in production to avoid app crashes
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
  }
}

// Log API key format (safely)
if (apiKey) {
  const keyPrefix = apiKey.substring(0, 10);
  const isValidFormat = apiKey.startsWith('sk-or-v1-');
  logger.debug('OpenRouter API key check', {
    keyPrefix: keyPrefix + '...',
    isValidFormat,
    keyLength: apiKey.length,
  });
}

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey || 'missing-key', // Provide fallback to prevent initialization errors
});
