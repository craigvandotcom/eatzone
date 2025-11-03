/**
 * Tests for environment variable parsing in constants.ts
 *
 * These tests verify that:
 * - Environment variables are correctly parsed with proper type conversion
 * - Invalid values fallback to sensible defaults
 * - Configuration remains consistent across different environments
 */

describe('Configuration Parsing', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to get fresh config with current env vars
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  describe('AI_CONFIG.IMAGE_ANALYSIS_MODEL', () => {
    it('should use environment variable when set', () => {
      process.env.IMAGE_ANALYSIS_MODEL = 'anthropic/claude-3.5-sonnet';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_MODEL).toBe(
        'anthropic/claude-3.5-sonnet'
      );
    });

    it('should fallback to default when not set', () => {
      delete process.env.IMAGE_ANALYSIS_MODEL;
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_MODEL).toBe('openai/gpt-4o');
    });

    it('should accept any model string for flexibility', () => {
      process.env.IMAGE_ANALYSIS_MODEL = 'custom/model-name';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_MODEL).toBe('custom/model-name');
    });
  });

  describe('AI_CONFIG.IMAGE_ANALYSIS_TEMPERATURE', () => {
    it('should parse valid float from environment', () => {
      process.env.IMAGE_ANALYSIS_TEMPERATURE = '0.7';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_TEMPERATURE).toBe(0.7);
    });

    it('should parse zero correctly', () => {
      process.env.IMAGE_ANALYSIS_TEMPERATURE = '0';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_TEMPERATURE).toBe(0);
    });

    it('should parse decimal values correctly', () => {
      process.env.IMAGE_ANALYSIS_TEMPERATURE = '0.95';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_TEMPERATURE).toBe(0.95);
    });

    it('should fallback to default for invalid float', () => {
      process.env.IMAGE_ANALYSIS_TEMPERATURE = 'invalid';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_TEMPERATURE).toBe(0.1);
    });

    it('should fallback to default for empty string', () => {
      process.env.IMAGE_ANALYSIS_TEMPERATURE = '';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_TEMPERATURE).toBe(0.1);
    });

    it('should fallback to default when not set', () => {
      delete process.env.IMAGE_ANALYSIS_TEMPERATURE;
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_TEMPERATURE).toBe(0.1);
    });

    it('should not return NaN for malformed input', () => {
      process.env.IMAGE_ANALYSIS_TEMPERATURE = 'abc123';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_TEMPERATURE).not.toBeNaN();
      expect(AI_CONFIG.IMAGE_ANALYSIS_TEMPERATURE).toBe(0.1);
    });
  });

  describe('AI_CONFIG.ZONING_TEMPERATURE', () => {
    it('should parse valid float from environment', () => {
      process.env.ZONING_TEMPERATURE = '0.5';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.ZONING_TEMPERATURE).toBe(0.5);
    });

    it('should fallback to default for invalid float', () => {
      process.env.ZONING_TEMPERATURE = 'not-a-number';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.ZONING_TEMPERATURE).toBe(0.1);
    });

    it('should not return NaN for malformed input', () => {
      process.env.ZONING_TEMPERATURE = '###';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.ZONING_TEMPERATURE).not.toBeNaN();
    });
  });

  describe('AI_CONFIG.IMAGE_ANALYSIS_MAX_TOKENS', () => {
    it('should parse valid number from environment', () => {
      process.env.IMAGE_ANALYSIS_MAX_TOKENS = '1000';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_MAX_TOKENS).toBe(1000);
    });

    it('should fallback to default for invalid number', () => {
      process.env.IMAGE_ANALYSIS_MAX_TOKENS = 'not-a-number';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_MAX_TOKENS).toBe(600);
    });

    it('should fallback to default when not set', () => {
      delete process.env.IMAGE_ANALYSIS_MAX_TOKENS;
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_MAX_TOKENS).toBe(600);
    });
  });

  describe('AI_CONFIG.ZONING_MAX_TOKENS', () => {
    it('should parse valid number from environment', () => {
      process.env.ZONING_MAX_TOKENS = '8192';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.ZONING_MAX_TOKENS).toBe(8192);
    });

    it('should fallback to default for invalid number', () => {
      process.env.ZONING_MAX_TOKENS = 'abc';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.ZONING_MAX_TOKENS).toBe(4096);
    });

    it('should handle float strings by truncating to integer', () => {
      process.env.ZONING_MAX_TOKENS = '4096.7';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.ZONING_MAX_TOKENS).toBe(4096);
    });
  });

  describe('AI_CONFIG.ZONING_MODEL', () => {
    it('should use environment variable when set', () => {
      process.env.ZONING_MODEL = 'openai/gpt-4';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.ZONING_MODEL).toBe('openai/gpt-4');
    });

    it('should fallback to default when not set', () => {
      delete process.env.ZONING_MODEL;
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.ZONING_MODEL).toBe('anthropic/claude-3.7-sonnet');
    });
  });

  describe('RATE_LIMIT_CONFIG', () => {
    it('should use different defaults for image vs zoning', () => {
      delete process.env.IMAGE_ANALYSIS_RATE_LIMIT;
      delete process.env.ZONING_RATE_LIMIT;
      const { RATE_LIMIT_CONFIG } = require('@/lib/config/constants');

      expect(RATE_LIMIT_CONFIG.IMAGE_ANALYSIS_REQUESTS_PER_MINUTE).toBe(10);
      expect(RATE_LIMIT_CONFIG.ZONING_REQUESTS_PER_MINUTE).toBe(50);
    });

    it('should parse custom image analysis rate limit', () => {
      process.env.IMAGE_ANALYSIS_RATE_LIMIT = '20';
      const { RATE_LIMIT_CONFIG } = require('@/lib/config/constants');
      expect(RATE_LIMIT_CONFIG.IMAGE_ANALYSIS_REQUESTS_PER_MINUTE).toBe(20);
    });

    it('should parse custom zoning rate limit', () => {
      process.env.ZONING_RATE_LIMIT = '100';
      const { RATE_LIMIT_CONFIG } = require('@/lib/config/constants');
      expect(RATE_LIMIT_CONFIG.ZONING_REQUESTS_PER_MINUTE).toBe(100);
    });

    it('should fallback to defaults for invalid rate limits', () => {
      process.env.IMAGE_ANALYSIS_RATE_LIMIT = 'invalid';
      process.env.ZONING_RATE_LIMIT = 'invalid';
      const { RATE_LIMIT_CONFIG } = require('@/lib/config/constants');

      expect(RATE_LIMIT_CONFIG.IMAGE_ANALYSIS_REQUESTS_PER_MINUTE).toBe(10);
      expect(RATE_LIMIT_CONFIG.ZONING_REQUESTS_PER_MINUTE).toBe(50);
    });
  });

  describe('APP_CONFIG integration', () => {
    it('should expose AI config through APP_CONFIG', () => {
      const { APP_CONFIG } = require('@/lib/config/constants');

      expect(APP_CONFIG.AI).toBeDefined();
      expect(APP_CONFIG.AI.IMAGE_ANALYSIS_MODEL).toBeDefined();
      expect(APP_CONFIG.AI.ZONING_MODEL).toBeDefined();
    });

    it('should maintain type consistency', () => {
      const { APP_CONFIG, AI_CONFIG } = require('@/lib/config/constants');

      expect(APP_CONFIG.AI).toBe(AI_CONFIG);
    });
  });

  describe('Edge cases and boundary values', () => {
    it('should handle negative temperature gracefully', () => {
      process.env.IMAGE_ANALYSIS_TEMPERATURE = '-0.5';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_TEMPERATURE).toBe(-0.5); // Allow negative, let API validate
    });

    it('should handle very large token counts', () => {
      process.env.ZONING_MAX_TOKENS = '100000';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.ZONING_MAX_TOKENS).toBe(100000);
    });

    it('should handle zero token count', () => {
      process.env.IMAGE_ANALYSIS_MAX_TOKENS = '0';
      const { AI_CONFIG } = require('@/lib/config/constants');
      expect(AI_CONFIG.IMAGE_ANALYSIS_MAX_TOKENS).toBe(0);
    });

    it('should handle whitespace in string values', () => {
      process.env.IMAGE_ANALYSIS_MODEL = '  openai/gpt-4o  ';
      const { AI_CONFIG } = require('@/lib/config/constants');
      // Note: We don't trim, API will handle this
      expect(AI_CONFIG.IMAGE_ANALYSIS_MODEL).toBe('  openai/gpt-4o  ');
    });
  });
});
