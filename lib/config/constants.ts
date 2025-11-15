/**
 * Application configuration constants
 * Centralizes all magic numbers and configurable limits
 */

// Environment variable parsing with defaults
const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Helper to parse float with validation
const getEnvFloat = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Image processing configuration
export const IMAGE_CONFIG = {
  // File size limits
  MAX_FILE_SIZE: getEnvNumber('MAX_IMAGE_FILE_SIZE', 10 * 1024 * 1024), // 10MB default (for storage)

  // API transmission limits (more aggressive due to Vercel 4.5MB request body limit)
  // With 3 images + JSON overhead, target 1.2MB per image = ~3.6MB total
  MAX_API_IMAGE_SIZE: getEnvNumber('MAX_API_IMAGE_SIZE', 1.2 * 1024 * 1024), // 1.2MB per image for API calls
  MAX_TOTAL_API_PAYLOAD: getEnvNumber('MAX_TOTAL_API_PAYLOAD', 4 * 1024 * 1024), // 4MB total (safety margin under 4.5MB)

  // Image dimensions
  MAX_DIMENSION: 800, // 800px max dimension (for storage)
  API_MAX_DIMENSION: 1024, // 1024px for API calls (good quality/size balance)
  QUALITY: 0.75, // 75% JPEG quality
  FORMAT: 'image/jpeg' as const,

  // Multi-image limits
  MAX_IMAGES_PER_REQUEST: getEnvNumber('MAX_IMAGES_PER_REQUEST', 5),
  MAX_CAMERA_IMAGES: getEnvNumber('MAX_CAMERA_IMAGES', 3),

  // Allowed file types
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ] as const,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'] as const,

  // Magic numbers for file type validation
  MAGIC_NUMBERS: {
    'image/jpeg': [0xff, 0xd8, 0xff],
    'image/png': [0x89, 0x50, 0x4e, 0x47],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header for WebP
  } as const,
} as const;

// API rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  // Image analysis rate limits (vision AI - expensive/slow)
  IMAGE_ANALYSIS_REQUESTS_PER_MINUTE: getEnvNumber(
    'IMAGE_ANALYSIS_RATE_LIMIT',
    10
  ),

  // Ingredient zoning rate limits (text AI - cheaper/faster)
  ZONING_REQUESTS_PER_MINUTE: getEnvNumber('ZONING_RATE_LIMIT', 50),

  RATE_LIMIT_WINDOW: '60 s',

  // Background processing limits
  BACKGROUND_BATCH_SIZE: getEnvNumber('BACKGROUND_BATCH_SIZE', 10),
  BACKGROUND_RETRY_DELAY_MS: getEnvNumber('BACKGROUND_RETRY_DELAY_MS', 5000), // 5 seconds
} as const;

// Background processing configuration
export const BACKGROUND_CONFIG = {
  // Retry configuration
  MAX_RETRY_ATTEMPTS: getEnvNumber('MAX_RETRY_ATTEMPTS', 3),
  BASE_RETRY_DELAY_MS: 1000, // 1 second base delay
  MAX_RETRY_DELAY_MS: 30000, // 30 seconds max delay
  RETRY_MULTIPLIER: 2, // Exponential backoff multiplier

  // Batch processing
  BATCH_SIZE: getEnvNumber('BACKGROUND_BATCH_SIZE', 10),
  PROCESS_INTERVAL_MS: getEnvNumber('BACKGROUND_PROCESS_INTERVAL_MS', 60000), // 1 minute
} as const;

// Database operation configuration
export const DATABASE_CONFIG = {
  // Migration batch size
  MIGRATION_BATCH_SIZE: getEnvNumber('MIGRATION_BATCH_SIZE', 100),
  MIGRATION_DELAY_MS: getEnvNumber('MIGRATION_DELAY_MS', 500),

  // Query limits
  DEFAULT_RECENT_LIMIT: 5,
  MAX_QUERY_LIMIT: 100,
} as const;

// Validation configuration
export const VALIDATION_CONFIG = {
  // File validation
  MIN_FILENAME_LENGTH: 1,
  MIN_FILE_SIZE: 1, // 1 byte minimum

  // String validation
  MIN_INGREDIENT_NAME_LENGTH: 1,
  MAX_INGREDIENT_NAME_LENGTH: 100,

  // Array validation
  MIN_INGREDIENTS_COUNT: 1,
  MAX_INGREDIENTS_COUNT: 50,
} as const;

// Camera configuration
export const CAMERA_CONFIG = {
  // LocalStorage key for preferred camera device ID
  PREFERRED_CAMERA_KEY: 'preferredCameraDeviceId',

  // Default facing mode for camera
  DEFAULT_FACING_MODE: 'environment' as const, // Rear-facing camera on mobile
} as const;

// AI Model configuration
export const AI_CONFIG = {
  // Image analysis model (vision AI)
  // Default: openai/gpt-4o
  //   - Fast, accurate vision model for ingredient extraction
  //   - Cost: ~$0.01-0.03 per image (varies by image size/complexity)
  //   - Performance: ~2-4 seconds per request
  // Alternative: anthropic/claude-3.5-sonnet
  //   - Strong multimodal capabilities with good ingredient recognition
  //   - Cost: ~$0.015-0.025 per image
  IMAGE_ANALYSIS_MODEL: process.env.IMAGE_ANALYSIS_MODEL || 'openai/gpt-4o',
  IMAGE_ANALYSIS_MAX_TOKENS: getEnvNumber('IMAGE_ANALYSIS_MAX_TOKENS', 600),
  IMAGE_ANALYSIS_TEMPERATURE: getEnvFloat('IMAGE_ANALYSIS_TEMPERATURE', 0.1),

  // Ingredient zoning model (text AI)
  // Default: anthropic/claude-3.7-sonnet
  //   - Excellent at structured JSON output and zone classification
  //   - Cost: ~$0.003 per 1K tokens (very cost-effective for text)
  //   - Performance: ~1-2 seconds per request
  // Alternative: openai/gpt-4o or openai/gpt-4-turbo
  //   - Good JSON output capabilities
  //   - Cost: ~$0.01 per 1K tokens (3x more expensive)
  ZONING_MODEL: process.env.ZONING_MODEL || 'anthropic/claude-3.7-sonnet',
  ZONING_MAX_TOKENS: getEnvNumber('ZONING_MAX_TOKENS', 4096),
  ZONING_TEMPERATURE: getEnvFloat('ZONING_TEMPERATURE', 0.1),
} as const;

// Export all configs as a single object for convenience
export const APP_CONFIG = {
  IMAGE: IMAGE_CONFIG,
  RATE_LIMIT: RATE_LIMIT_CONFIG,
  BACKGROUND: BACKGROUND_CONFIG,
  DATABASE: DATABASE_CONFIG,
  VALIDATION: VALIDATION_CONFIG,
  CAMERA: CAMERA_CONFIG,
  AI: AI_CONFIG,
} as const;
