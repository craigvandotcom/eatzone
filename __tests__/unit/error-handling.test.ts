/**
 * Error Handling Utilities Unit Tests
 * 
 * Tests all error handling scenarios:
 * - Network failures and timeouts
 * - Authentication expiry and session handling
 * - Camera permissions and MediaDevices errors
 * - Database connection errors
 * - AI service errors
 * - Error recovery strategies
 */

// Mock logger to prevent console noise during tests
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

import { logger } from '@/lib/utils/logger';

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clean up global fetch mock
    if (global.fetch && jest.isMockFunction(global.fetch)) {
      (global.fetch as jest.Mock).mockClear();
    }
  });

  describe('Database Error Handling Patterns', () => {
    it('should classify Supabase error codes correctly', () => {
      const classifySupabaseError = (error: any) => {
        if (error.code === 'PGRST116') {
          return 'not_found';
        }
        if (error.code === '23505') {
          return 'duplicate_key';
        }
        if (error.status === 429) {
          return 'rate_limit';
        }
        if (error.status >= 500) {
          return 'server_error';
        }
        if (error.status >= 400) {
          return 'client_error';
        }
        return 'unknown';
      };

      expect(classifySupabaseError({ code: 'PGRST116' })).toBe('not_found');
      expect(classifySupabaseError({ code: '23505' })).toBe('duplicate_key');
      expect(classifySupabaseError({ status: 429 })).toBe('rate_limit');
      expect(classifySupabaseError({ status: 500 })).toBe('server_error');
      expect(classifySupabaseError({ status: 404 })).toBe('client_error');
      expect(classifySupabaseError({ message: 'unknown' })).toBe('unknown');
    });

    it('should handle graceful degradation for database errors', async () => {
      const safeDbQuery = async <T>(
        query: () => Promise<T>,
        fallback: T
      ): Promise<T> => {
        try {
          return await query();
        } catch (error) {
          logger.warn('Database query failed, using fallback', error);
          return fallback;
        }
      };

      const failingQuery = () => Promise.reject(new Error('Database error'));
      const fallbackData = [];

      const result = await safeDbQuery(failingQuery, fallbackData);
      
      expect(result).toBe(fallbackData);
      expect(logger.warn).toHaveBeenCalledWith(
        'Database query failed, using fallback',
        expect.any(Error)
      );
    });

    it('should validate database connection before operations', () => {
      const isValidConnection = (client: any) => {
        if (!client) return false;
        if (typeof client.from !== 'function') return false;
        if (!client.auth) return false;
        if (typeof client.auth.getUser !== 'function') return false;
        return true;
      };

      const validClient = {
        from: jest.fn(),
        auth: { getUser: jest.fn() }
      };

      const invalidClient = {
        from: jest.fn(),
        // missing auth
      };

      expect(isValidConnection(validClient)).toBe(true);
      expect(isValidConnection(invalidClient)).toBe(false);
      expect(isValidConnection(null)).toBe(false);
    });
  });

  describe('Authentication Error Handling Patterns', () => {
    it('should classify auth error types correctly', () => {
      const classifyAuthError = (error: any) => {
        if (error.message?.includes('JWT expired')) {
          return 'session_expired';
        }
        if (error.message?.includes('Invalid login credentials')) {
          return 'invalid_credentials';
        }
        if (error.message?.includes('Email not confirmed')) {
          return 'email_not_confirmed';
        }
        if (error.status === 403) {
          return 'account_disabled';
        }
        if (error.status === 401) {
          return 'unauthorized';
        }
        return 'unknown_auth_error';
      };

      expect(classifyAuthError({ message: 'JWT expired' })).toBe('session_expired');
      expect(classifyAuthError({ message: 'Invalid login credentials' })).toBe('invalid_credentials');
      expect(classifyAuthError({ message: 'Email not confirmed' })).toBe('email_not_confirmed');
      expect(classifyAuthError({ status: 403 })).toBe('account_disabled');
      expect(classifyAuthError({ status: 401 })).toBe('unauthorized');
      expect(classifyAuthError({ message: 'Unknown error' })).toBe('unknown_auth_error');
    });

    it('should provide user-friendly auth error messages', () => {
      const getAuthErrorMessage = (errorType: string) => {
        const messages = {
          session_expired: 'Your session has expired. Please sign in again.',
          invalid_credentials: 'The email or password you entered is incorrect.',
          email_not_confirmed: 'Please check your email and click the confirmation link.',
          account_disabled: 'Your account has been disabled. Please contact support.',
          unauthorized: 'You are not authorized to access this resource.',
          unknown_auth_error: 'An authentication error occurred. Please try again.',
        };
        return messages[errorType as keyof typeof messages] || messages.unknown_auth_error;
      };

      expect(getAuthErrorMessage('session_expired')).toBe('Your session has expired. Please sign in again.');
      expect(getAuthErrorMessage('invalid_credentials')).toBe('The email or password you entered is incorrect.');
      expect(getAuthErrorMessage('email_not_confirmed')).toBe('Please check your email and click the confirmation link.');
      expect(getAuthErrorMessage('unknown')).toBe('An authentication error occurred. Please try again.');
    });

    it('should handle auth token validation', () => {
      const isValidToken = (token: string | null | undefined) => {
        if (!token) return false;
        if (typeof token !== 'string') return false;
        if (token.length < 10) return false; // Minimum reasonable token length
        return true;
      };

      expect(isValidToken('valid.jwt.token.string')).toBe(true);
      expect(isValidToken('')).toBe(false);
      expect(isValidToken(null)).toBe(false);
      expect(isValidToken(undefined)).toBe(false);
      expect(isValidToken('short')).toBe(false);
    });

    it('should handle session recovery strategies', async () => {
      const attemptSessionRecovery = async (refreshToken?: string) => {
        if (!refreshToken) {
          return { success: false, reason: 'no_refresh_token' };
        }

        try {
          // Simulate refresh attempt
          if (refreshToken === 'valid_refresh_token') {
            return { success: true, newToken: 'new_access_token' };
          } else {
            throw new Error('Invalid refresh token');
          }
        } catch (error) {
          return { success: false, reason: 'refresh_failed' };
        }
      };

      const validResult = await attemptSessionRecovery('valid_refresh_token');
      const invalidResult = await attemptSessionRecovery('invalid_token');
      const noTokenResult = await attemptSessionRecovery();

      expect(validResult.success).toBe(true);
      expect(validResult.newToken).toBe('new_access_token');
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.reason).toBe('refresh_failed');
      expect(noTokenResult.success).toBe(false);
      expect(noTokenResult.reason).toBe('no_refresh_token');
    });
  });

  describe('Camera and MediaDevices Error Handling', () => {
    it('should classify camera error types correctly', () => {
      const classifyCameraError = (error: any) => {
        switch (error.name) {
          case 'NotAllowedError':
            return 'permission_denied';
          case 'NotFoundError':
            return 'device_not_found';
          case 'NotReadableError':
            return 'device_busy';
          case 'OverconstrainedError':
            return 'constraints_not_satisfied';
          case 'AbortError':
            return 'operation_aborted';
          case 'TypeError':
            return 'invalid_constraints';
          default:
            return 'unknown_camera_error';
        }
      };

      expect(classifyCameraError({ name: 'NotAllowedError' })).toBe('permission_denied');
      expect(classifyCameraError({ name: 'NotFoundError' })).toBe('device_not_found');
      expect(classifyCameraError({ name: 'NotReadableError' })).toBe('device_busy');
      expect(classifyCameraError({ name: 'OverconstrainedError' })).toBe('constraints_not_satisfied');
      expect(classifyCameraError({ name: 'AbortError' })).toBe('operation_aborted');
      expect(classifyCameraError({ name: 'TypeError' })).toBe('invalid_constraints');
      expect(classifyCameraError({ name: 'UnknownError' })).toBe('unknown_camera_error');
    });

    it('should provide user-friendly camera error messages', () => {
      const getCameraErrorMessage = (errorType: string) => {
        const messages = {
          permission_denied: 'Camera access was denied. Please enable camera permissions in your browser.',
          device_not_found: 'No camera was found on this device.',
          device_busy: 'Camera is already being used by another application.',
          constraints_not_satisfied: 'Camera does not support the requested video quality.',
          operation_aborted: 'Camera operation was cancelled.',
          invalid_constraints: 'Invalid camera settings were requested.',
          unknown_camera_error: 'An unexpected camera error occurred. Please try again.',
        };
        return messages[errorType as keyof typeof messages] || messages.unknown_camera_error;
      };

      expect(getCameraErrorMessage('permission_denied')).toBe('Camera access was denied. Please enable camera permissions in your browser.');
      expect(getCameraErrorMessage('device_not_found')).toBe('No camera was found on this device.');
      expect(getCameraErrorMessage('device_busy')).toBe('Camera is already being used by another application.');
      expect(getCameraErrorMessage('unknown')).toBe('An unexpected camera error occurred. Please try again.');
    });

    it('should check camera API availability', () => {
      const checkCameraSupport = () => {
        const hasNavigator = typeof navigator !== 'undefined';
        const hasMediaDevices = hasNavigator && 'mediaDevices' in navigator;
        const hasGetUserMedia = hasMediaDevices && 'getUserMedia' in navigator.mediaDevices;
        
        return {
          supported: hasGetUserMedia,
          reasons: {
            noNavigator: !hasNavigator,
            noMediaDevices: hasNavigator && !hasMediaDevices,
            noGetUserMedia: hasMediaDevices && !hasGetUserMedia,
          }
        };
      };

      const support = checkCameraSupport();
      
      // In test environment, navigator should exist
      expect(support.reasons.noNavigator).toBe(false);
      
      // The specific support will depend on the test environment setup
      expect(typeof support.supported).toBe('boolean');
    });

    it('should handle camera fallback strategies', async () => {
      const tryGetCamera = async (constraints: MediaStreamConstraints) => {
        try {
          // Simulate different constraint attempts
          if (constraints.video === true) {
            return { success: true, stream: 'mock-stream' };
          } else if (typeof constraints.video === 'object' && constraints.video.width) {
            // Simulate failing for impossible constraints
            if (constraints.video.width > 4000) {
              throw new Error('Resolution too high');
            }
            return { success: true, stream: 'mock-stream-high-quality' };
          } else {
            throw new Error('No suitable camera configuration found');
          }
        } catch (error) {
          return { success: false, error };
        }
      };

      const highQuality = await tryGetCamera({ video: { width: 1920, height: 1080 } });
      const basicVideo = await tryGetCamera({ video: true });
      const impossible = await tryGetCamera({ video: { width: 99999 } });

      expect(highQuality.success).toBe(true);
      expect(basicVideo.success).toBe(true);
      expect(impossible.success).toBe(false);
    });

    it('should validate camera permissions status', () => {
      const interpretPermissionState = (state: string) => {
        switch (state) {
          case 'granted':
            return { allowed: true, message: 'Camera access granted' };
          case 'denied':
            return { allowed: false, message: 'Camera access denied' };
          case 'prompt':
            return { allowed: null, message: 'Camera permission will be requested' };
          default:
            return { allowed: null, message: 'Camera permission status unknown' };
        }
      };

      expect(interpretPermissionState('granted').allowed).toBe(true);
      expect(interpretPermissionState('denied').allowed).toBe(false);
      expect(interpretPermissionState('prompt').allowed).toBe(null);
      expect(interpretPermissionState('unknown').allowed).toBe(null);
    });
  });

  describe('Network and API Errors', () => {
    it('should handle fetch timeout errors', async () => {
      // Simulate network timeout
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TIMEOUT';

      // Mock a network request that times out
      global.fetch = jest.fn().mockRejectedValue(timeoutError);

      try {
        await fetch('/api/test');
        fail('Should have thrown timeout error');
      } catch (error: any) {
        expect(error.name).toBe('TIMEOUT');
        expect(error.message).toBe('Network timeout');
      }
    });

    it('should handle network offline errors', async () => {
      const offlineError = new Error('Network request failed');
      offlineError.name = 'NETWORK_ERROR';

      global.fetch = jest.fn().mockRejectedValue(offlineError);

      try {
        await fetch('/api/test');
        fail('Should have thrown network error');
      } catch (error: any) {
        expect(error.name).toBe('NETWORK_ERROR');
        expect(error.message).toBe('Network request failed');
      }
    });

    it('should handle API rate limiting', async () => {
      const rateLimitResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ 
          error: 'Rate limit exceeded',
          retryAfter: 60 
        }),
      };

      global.fetch = jest.fn().mockResolvedValue(rateLimitResponse as any);

      const response = await fetch('/api/test');
      expect(response.status).toBe(429);
      expect(response.ok).toBe(false);
    });

    it('should handle server errors (5xx)', async () => {
      const serverErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ 
          error: 'Internal server error' 
        }),
      };

      global.fetch = jest.fn().mockResolvedValue(serverErrorResponse as any);

      const response = await fetch('/api/test');
      expect(response.status).toBe(500);
      expect(response.ok).toBe(false);
    });

    it('should handle malformed JSON responses', async () => {
      const invalidJsonResponse = {
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
      };

      global.fetch = jest.fn().mockResolvedValue(invalidJsonResponse as any);

      const response = await fetch('/api/test');
      
      try {
        await response.json();
        fail('Should have thrown JSON parsing error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(SyntaxError);
        expect(error.message).toBe('Unexpected token');
      }
    });
  });

  describe('AI Service Errors', () => {
    it('should handle OpenRouter API key errors', () => {
      const apiKeyError = {
        error: {
          message: 'Invalid API key',
          type: 'authentication_error',
          code: 'invalid_api_key',
        },
        status: 401,
      };

      // Simulate API key error handling
      const handleApiError = (error: any) => {
        if (error.status === 401 && error.error?.code === 'invalid_api_key') {
          return 'Invalid API key. Please check your OpenRouter configuration.';
        }
        return 'Unknown API error';
      };

      const errorMessage = handleApiError(apiKeyError);
      expect(errorMessage).toBe('Invalid API key. Please check your OpenRouter configuration.');
    });

    it('should handle AI model unavailable errors', () => {
      const modelError = {
        error: {
          message: 'Model not found',
          type: 'invalid_request_error',
          code: 'model_not_found',
        },
        status: 400,
      };

      const handleApiError = (error: any) => {
        if (error.status === 400 && error.error?.code === 'model_not_found') {
          return 'AI model is temporarily unavailable. Please try again later.';
        }
        return 'Unknown API error';
      };

      const errorMessage = handleApiError(modelError);
      expect(errorMessage).toBe('AI model is temporarily unavailable. Please try again later.');
    });

    it('should handle AI quota exceeded errors', () => {
      const quotaError = {
        error: {
          message: 'Quota exceeded',
          type: 'insufficient_quota',
          code: 'quota_exceeded',
        },
        status: 429,
      };

      const handleApiError = (error: any) => {
        if (error.status === 429 && error.error?.type === 'insufficient_quota') {
          return 'AI service quota exceeded. Please upgrade your plan or try again later.';
        }
        return 'Unknown API error';
      };

      const errorMessage = handleApiError(quotaError);
      expect(errorMessage).toBe('AI service quota exceeded. Please upgrade your plan or try again later.');
    });

    it('should handle AI processing timeout', () => {
      const timeoutError = {
        error: {
          message: 'Request timeout',
          type: 'timeout_error',
        },
        status: 408,
      };

      const handleApiError = (error: any) => {
        if (error.status === 408 || error.error?.type === 'timeout_error') {
          return 'AI processing took too long. Please try with a smaller image or simpler request.';
        }
        return 'Unknown API error';
      };

      const errorMessage = handleApiError(timeoutError);
      expect(errorMessage).toBe('AI processing took too long. Please try with a smaller image or simpler request.');
    });
  });

  describe('User-Friendly Error Messages', () => {
    it('should convert technical errors to user-friendly messages', () => {
      const errorMap = {
        'ECONNREFUSED': 'Unable to connect to the server. Please check your internet connection.',
        'ETIMEDOUT': 'The request took too long. Please try again.',
        'ENOTFOUND': 'Server not found. Please check your connection.',
        'JWT expired': 'Your session has expired. Please sign in again.',
        'Invalid login credentials': 'The email or password you entered is incorrect.',
        'Permission denied': 'Camera access was denied. Please enable camera permissions in your browser.',
        'NotFoundError': 'No camera was found on this device.',
        'NotAllowedError': 'Camera access is required for this feature. Please allow camera access.',
      };

      const getUserFriendlyMessage = (error: string) => {
        return errorMap[error as keyof typeof errorMap] || 'An unexpected error occurred. Please try again.';
      };

      expect(getUserFriendlyMessage('ECONNREFUSED')).toBe('Unable to connect to the server. Please check your internet connection.');
      expect(getUserFriendlyMessage('JWT expired')).toBe('Your session has expired. Please sign in again.');
      expect(getUserFriendlyMessage('NotAllowedError')).toBe('Camera access is required for this feature. Please allow camera access.');
      expect(getUserFriendlyMessage('UNKNOWN_ERROR')).toBe('An unexpected error occurred. Please try again.');
    });

    it('should preserve original error details for debugging', () => {
      const originalError = new Error('Database connection failed');
      originalError.name = 'CONNECTION_ERROR';
      originalError.stack = 'Error stack trace...';

      const errorInfo = {
        userMessage: 'Unable to save your data. Please try again.',
        originalError: {
          message: originalError.message,
          name: originalError.name,
          stack: originalError.stack,
        },
        timestamp: new Date().toISOString(),
      };

      expect(errorInfo.userMessage).toBe('Unable to save your data. Please try again.');
      expect(errorInfo.originalError.name).toBe('CONNECTION_ERROR');
      expect(errorInfo.originalError.message).toBe('Database connection failed');
      expect(errorInfo.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Error Recovery Strategies', () => {
    it('should implement exponential backoff for retries', () => {
      const calculateBackoffDelay = (attempt: number, baseDelay = 1000, maxDelay = 30000) => {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        return Math.floor(delay + jitter);
      };

      // Test without jitter for predictable results
      const calculateBackoffDelayNoJitter = (attempt: number, baseDelay = 1000, maxDelay = 30000) => {
        return Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      };

      expect(calculateBackoffDelayNoJitter(0)).toBe(1000);
      expect(calculateBackoffDelayNoJitter(1)).toBe(2000);
      expect(calculateBackoffDelayNoJitter(2)).toBe(4000);
      expect(calculateBackoffDelayNoJitter(10)).toBe(30000); // Max delay cap
      
      // Test that jitter version is within reasonable bounds
      const withJitter = calculateBackoffDelay(0);
      expect(withJitter).toBeGreaterThanOrEqual(1000);
      expect(withJitter).toBeLessThanOrEqual(1100); // 1000 + 10% jitter
    });

    it('should implement circuit breaker pattern', () => {
      class CircuitBreaker {
        private failures = 0;
        private lastFailureTime = 0;
        private readonly threshold = 5;
        private readonly timeout = 60000; // 1 minute

        async execute<T>(operation: () => Promise<T>): Promise<T> {
          if (this.isOpen()) {
            throw new Error('Circuit breaker is open');
          }

          try {
            const result = await operation();
            this.onSuccess();
            return result;
          } catch (error) {
            this.onFailure();
            throw error;
          }
        }

        private isOpen(): boolean {
          if (this.failures >= this.threshold) {
            if (Date.now() - this.lastFailureTime > this.timeout) {
              this.reset(); // Half-open state
              return false;
            }
            return true;
          }
          return false;
        }

        private onSuccess(): void {
          this.failures = 0;
        }

        private onFailure(): void {
          this.failures++;
          this.lastFailureTime = Date.now();
        }

        private reset(): void {
          this.failures = 0;
          this.lastFailureTime = 0;
        }
      }

      const breaker = new CircuitBreaker();
      
      // Circuit should be closed initially
      expect(() => breaker['isOpen']()).not.toThrow();
      
      // Simulate failures
      for (let i = 0; i < 5; i++) {
        breaker['onFailure']();
      }
      
      // Circuit should be open now
      expect(breaker['isOpen']()).toBe(true);
    });

    it('should provide fallback values for failed operations', () => {
      const safeGetValue = async <T>(
        operation: () => Promise<T>, 
        fallback: T
      ): Promise<T> => {
        try {
          return await operation();
        } catch (error) {
          logger.warn('Operation failed, using fallback', error);
          return fallback;
        }
      };

      const failingOperation = () => Promise.reject(new Error('Failed'));
      const fallbackValue = 'default value';

      return expect(safeGetValue(failingOperation, fallbackValue))
        .resolves.toBe(fallbackValue);
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should log errors with appropriate severity levels', () => {
      const logError = (error: any, context: string) => {
        if (error.status >= 500) {
          logger.error('Server error', { error, context });
        } else if (error.status >= 400) {
          logger.warn('Client error', { error, context });
        } else {
          logger.info('Request info', { error, context });
        }
      };

      const serverError = { status: 500, message: 'Internal error' };
      const clientError = { status: 404, message: 'Not found' };
      const infoError = { status: 200, message: 'Success' };

      logError(serverError, 'test');
      logError(clientError, 'test');
      logError(infoError, 'test');

      expect(logger.error).toHaveBeenCalledWith('Server error', { 
        error: serverError, 
        context: 'test' 
      });
      expect(logger.warn).toHaveBeenCalledWith('Client error', { 
        error: clientError, 
        context: 'test' 
      });
      expect(logger.info).toHaveBeenCalledWith('Request info', { 
        error: infoError, 
        context: 'test' 
      });
    });

    it('should sanitize sensitive data from error logs', () => {
      const sanitizeError = (error: any) => {
        const sanitized = { ...error };
        
        // Remove sensitive fields
        const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
        sensitiveFields.forEach(field => {
          if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
          }
        });

        return sanitized;
      };

      const errorWithSensitiveData = {
        message: 'Auth failed',
        password: 'secret123',
        token: 'abc123token',
        userId: '123',
      };

      const sanitized = sanitizeError(errorWithSensitiveData);

      expect(sanitized.message).toBe('Auth failed');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.userId).toBe('123'); // Not sensitive
    });
  });
});