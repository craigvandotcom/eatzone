/**
 * TypeScript interfaces for test objects and utilities
 * Improves type safety across Jest and Playwright tests
 */

import { Page } from '@playwright/test';

// Extended Page interface for Playwright tests
export interface ExtendedPage extends Page {
  consoleErrors: string[];
}

// Error handling interfaces for Jest tests
export interface SupabaseError {
  message: string;
  code?: string;
  status?: number;
  details?: string;
}

export interface AuthError extends SupabaseError {
  name: string;
}

export interface CameraError extends Error {
  name: string;
  constraint?: string;
}

export interface APIError extends Error {
  status?: number;
  statusText?: string;
  url?: string;
}

// Test data interfaces
export interface TestCredentials {
  email: string;
  password: string;
}

export interface MockFetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<any>;
  text: () => Promise<string>;
}

// AI Analysis test interfaces
export interface ZonedIngredient {
  name: string;
  zone: 'green' | 'yellow' | 'red';
  confidence?: number;
}

export interface AIAnalysisResponse {
  zonedIngredients: ZonedIngredient[];
  summary?: string;
  confidence?: number;
}

// Data transformation interfaces
export interface ImportDataValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Test utility function types
export type ErrorClassifier<T = any> = (error: T) => {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recoverable: boolean;
};

export type ErrorHandler<T = any> = (error: T) => {
  handled: boolean;
  action?: string;
  fallback?: any;
};

export type ErrorLogger = (error: any, context: string) => void;

export type ErrorSanitizer = (error: any) => {
  message: string;
  safe: boolean;
  sanitized: any;
};

// Test constants to avoid hardcoded emails throughout tests
export const TEST_CONSTANTS = {
  // Valid test email for form validation and mock testing
  MOCK_EMAIL: process.env.TEST_MOCK_EMAIL || 'test@example.com',
  // Invalid email for negative test cases
  INVALID_EMAIL: process.env.TEST_INVALID_EMAIL || 'invalid@example.com',
  // Test password for form validation
  MOCK_PASSWORD: 'testpassword123',
} as const;
