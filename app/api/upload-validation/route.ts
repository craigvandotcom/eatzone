import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';
import { APP_CONFIG } from '@/lib/config/constants';
import { getRateLimiter } from '@/lib/rate-limit';
import { getClientIP } from '@/lib/utils/client-ip';

// Use centralized configuration
const FILE_CONFIG = {
  maxSize: APP_CONFIG.IMAGE.MAX_FILE_SIZE,
  allowedTypes: APP_CONFIG.IMAGE.ALLOWED_TYPES,
  allowedExtensions: APP_CONFIG.IMAGE.ALLOWED_EXTENSIONS,
  magicNumbers: APP_CONFIG.IMAGE.MAGIC_NUMBERS,
} as const;

// Request validation schema
const validateFileSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().positive('File size must be positive'),
  base64Data: z.string().min(1, 'File data is required'),
});

interface ValidationResponse {
  valid: boolean;
  error?: {
    message: string;
    code: string;
    statusCode: number;
  };
}

interface ValidationErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
}

/**
 * Validate file magic numbers (first few bytes) to ensure file type matches MIME type
 */
function validateMagicNumbers(base64Data: string, mimeType: string): boolean {
  try {
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

    // Convert first few bytes from base64
    const binaryString = atob(base64.substring(0, 12)); // First ~9 bytes should be enough
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Check magic numbers based on MIME type
    const expectedMagic =
      FILE_CONFIG.magicNumbers[
        mimeType as keyof typeof FILE_CONFIG.magicNumbers
      ];
    if (!expectedMagic) {
      return false; // Unknown MIME type
    }

    // Verify the first bytes match
    for (let i = 0; i < expectedMagic.length && i < bytes.length; i++) {
      if (bytes[i] !== expectedMagic[i]) {
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('Magic number validation failed', error);
    return false;
  }
}

/**
 * Validate file extension matches MIME type
 */
function validateFileExtension(filename: string, mimeType: string): boolean {
  const extension = filename.toLowerCase().split('.').pop();
  if (!extension) return false;

  const fullExtension = `.${extension}`;

  // Check if extension is allowed
  if (
    !FILE_CONFIG.allowedExtensions.includes(
      fullExtension as (typeof FILE_CONFIG.allowedExtensions)[number]
    )
  ) {
    return false;
  }

  // Check if extension matches MIME type
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return fullExtension === '.jpg' || fullExtension === '.jpeg';
    case 'image/png':
      return fullExtension === '.png';
    case 'image/webp':
      return fullExtension === '.webp';
    default:
      return false;
  }
}

export async function POST(request: NextRequest) {
  logger.info('File validation request received');

  try {
    // Rate limiting check - prevent abuse of upload validation endpoint
    const rateLimiter = getRateLimiter();
    const clientIP = getClientIP(request);

    const rateLimitResult = await rateLimiter.limitGeneric(
      clientIP,
      30, // 30 requests per minute - reasonable for file uploads
      60 * 1000 // 60 seconds window
    );

    if (!rateLimitResult.success) {
      logger.warn('Upload validation rate limit exceeded', {
        ip: clientIP,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
      });

      return NextResponse.json(
        {
          error: {
            message:
              'Too many upload validation requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429,
          },
        } as ValidationErrorResponse,
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.resetTime
              ? Math.ceil(
                  (rateLimitResult.resetTime - Date.now()) / 1000
                ).toString()
              : '60',
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = validateFileSchema.parse(body);

    const { filename, mimeType, size, base64Data } = validatedData;

    // 1. Validate file size
    if (size > FILE_CONFIG.maxSize) {
      return NextResponse.json(
        {
          error: {
            message: `File size exceeds maximum limit of ${Math.round(FILE_CONFIG.maxSize / 1024 / 1024)}MB`,
            code: 'FILE_TOO_LARGE',
            statusCode: 400,
          },
        } as ValidationErrorResponse,
        { status: 400 }
      );
    }

    // 2. Validate MIME type
    if (
      !FILE_CONFIG.allowedTypes.includes(
        mimeType as (typeof FILE_CONFIG.allowedTypes)[number]
      )
    ) {
      return NextResponse.json(
        {
          error: {
            message: `File type ${mimeType} is not allowed. Allowed types: ${FILE_CONFIG.allowedTypes.join(', ')}`,
            code: 'INVALID_MIME_TYPE',
            statusCode: 400,
          },
        } as ValidationErrorResponse,
        { status: 400 }
      );
    }

    // 3. Validate file extension matches MIME type
    if (!validateFileExtension(filename, mimeType)) {
      return NextResponse.json(
        {
          error: {
            message: 'File extension does not match MIME type',
            code: 'EXTENSION_MISMATCH',
            statusCode: 400,
          },
        } as ValidationErrorResponse,
        { status: 400 }
      );
    }

    // 4. Validate magic numbers (file signature)
    if (!validateMagicNumbers(base64Data, mimeType)) {
      return NextResponse.json(
        {
          error: {
            message: 'File content does not match declared type',
            code: 'INVALID_FILE_SIGNATURE',
            statusCode: 400,
          },
        } as ValidationErrorResponse,
        { status: 400 }
      );
    }

    // 5. Validate base64 data format
    if (!base64Data.startsWith('data:image/')) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid base64 data format. Expected data URL format.',
            code: 'INVALID_DATA_FORMAT',
            statusCode: 400,
          },
        } as ValidationErrorResponse,
        { status: 400 }
      );
    }

    logger.debug('File validation successful', {
      filename,
      mimeType,
      size,
    });

    // All validations passed
    return NextResponse.json(
      {
        valid: true,
      } as ValidationResponse,
      { status: 200 }
    );
  } catch (error) {
    logger.error('File validation error', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request data',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
          },
        } as ValidationErrorResponse,
        { status: 400 }
      );
    }

    // Generic server error
    return NextResponse.json(
      {
        error: {
          message: 'File validation failed due to server error',
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500,
        },
      } as ValidationErrorResponse,
      { status: 500 }
    );
  }
}
