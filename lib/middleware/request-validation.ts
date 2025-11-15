/**
 * Request validation and size limiting middleware
 * Prevents abuse through oversized requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { APP_CONFIG } from '@/lib/config/constants';

export interface RequestValidationOptions {
  maxBodySize?: number;
  maxImageSize?: number;
  maxImageCount?: number;
  allowedContentTypes?: string[];
  requireAuth?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: {
    message: string;
    code: string;
    statusCode: number;
  };
  data?: unknown;
}

/**
 * Validate request body size
 */
export async function validateRequestSize(
  request: NextRequest,
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): Promise<ValidationResult> {
  try {
    const contentLength = request.headers.get('content-length');

    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > maxSize) {
        logger.warn('Request body too large', {
          size,
          maxSize,
          url: request.url,
        });

        return {
          isValid: false,
          error: {
            message: `Request body too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`,
            code: 'REQUEST_TOO_LARGE',
            statusCode: 413,
          },
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    logger.error('Error validating request size', error);
    return {
      isValid: false,
      error: {
        message: 'Invalid request',
        code: 'INVALID_REQUEST',
        statusCode: 400,
      },
    };
  }
}

/**
 * Validate and parse JSON body with size limits
 */
export async function validateAndParseJSON(
  request: NextRequest,
  maxSize?: number
): Promise<ValidationResult> {
  try {
    // First validate size
    const sizeValidation = await validateRequestSize(request, maxSize);
    if (!sizeValidation.isValid) {
      return sizeValidation;
    }

    // Parse JSON body
    const body = await request.json();

    return {
      isValid: true,
      data: body,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        isValid: false,
        error: {
          message: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
          statusCode: 400,
        },
      };
    }

    logger.error('Error parsing request body', error);
    return {
      isValid: false,
      error: {
        message: 'Failed to process request',
        code: 'REQUEST_PROCESSING_ERROR',
        statusCode: 400,
      },
    };
  }
}

/**
 * Validate image data in request
 */
export function validateImageData(data: unknown): ValidationResult {
  // Check if we have images
  const imageData = data as { images?: unknown[]; image?: unknown };
  const images = imageData.images || (imageData.image ? [imageData.image] : []);

  if (!Array.isArray(images)) {
    return {
      isValid: false,
      error: {
        message: 'Images must be provided as an array',
        code: 'INVALID_IMAGE_FORMAT',
        statusCode: 400,
      },
    };
  }

  // Check image count
  if (images.length > APP_CONFIG.IMAGE.MAX_IMAGES_PER_REQUEST) {
    return {
      isValid: false,
      error: {
        message: `Too many images. Maximum ${APP_CONFIG.IMAGE.MAX_IMAGES_PER_REQUEST} images allowed`,
        code: 'TOO_MANY_IMAGES',
        statusCode: 400,
      },
    };
  }

  // Validate each image
  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    if (typeof image !== 'string') {
      return {
        isValid: false,
        error: {
          message: `Image ${i + 1} must be a string`,
          code: 'INVALID_IMAGE_TYPE',
          statusCode: 400,
        },
      };
    }

    if (!image.startsWith('data:image/')) {
      return {
        isValid: false,
        error: {
          message: `Image ${i + 1} must be a valid data URL`,
          code: 'INVALID_IMAGE_FORMAT',
          statusCode: 400,
        },
      };
    }

    // Estimate base64 decoded size (rough calculation)
    // Base64 encoded data is ~33% larger than original
    const estimatedSize = (image.length * 3) / 4;

    // Use API-specific size limit (more aggressive than storage limit)
    if (estimatedSize > APP_CONFIG.IMAGE.MAX_API_IMAGE_SIZE) {
      return {
        isValid: false,
        error: {
          message: `Image ${i + 1} is too large. Maximum size is ${Math.round(APP_CONFIG.IMAGE.MAX_API_IMAGE_SIZE / (1024 * 1024))}MB`,
          code: 'IMAGE_TOO_LARGE',
          statusCode: 400,
        },
      };
    }
  }

  return { isValid: true };
}

/**
 * Comprehensive request validation for image analysis
 */
export async function validateImageAnalysisRequest(
  request: NextRequest
): Promise<ValidationResult> {
  // Validate request size first - use API-specific total payload limit
  // This ensures we stay under Vercel's 4.5MB serverless function limit
  const sizeValidation = await validateRequestSize(
    request,
    APP_CONFIG.IMAGE.MAX_TOTAL_API_PAYLOAD
  );

  if (!sizeValidation.isValid) {
    logger.debug('Image analysis request size validation failed', {
      error: sizeValidation.error,
      url: request.url,
    });
    return sizeValidation;
  }

  // Parse and validate JSON
  const jsonValidation = await validateAndParseJSON(request);
  if (!jsonValidation.isValid) {
    logger.debug('Image analysis request JSON validation failed', {
      error: jsonValidation.error,
      url: request.url,
    });
    return jsonValidation;
  }

  // Validate image data
  const imageValidation = validateImageData(jsonValidation.data);
  if (!imageValidation.isValid) {
    logger.debug('Image analysis request image validation failed', {
      error: imageValidation.error,
      url: request.url,
    });
    return imageValidation;
  }

  logger.debug('Image analysis request validation completed successfully', {
    url: request.url,
  });

  return {
    isValid: true,
    data: jsonValidation.data,
  };
}

/**
 * Create error response from validation result
 */
export function createValidationErrorResponse(
  result: ValidationResult
): NextResponse {
  if (!result.error) {
    throw new Error('No error in validation result');
  }

  return NextResponse.json(
    {
      error: {
        message: result.error.message,
        code: result.error.code,
        statusCode: result.error.statusCode,
      },
    },
    {
      status: result.error.statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
