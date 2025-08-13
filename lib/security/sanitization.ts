/**
 * Input sanitization utilities using isomorphic-dompurify
 * Prevents XSS and other injection attacks
 * Works in both browser and server environments without JSDOM
 */

import DOMPurify from 'isomorphic-dompurify';

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
  maxLength?: number;
}

/**
 * Sanitize HTML content, removing potentially dangerous elements
 */
export function sanitizeHtml(
  input: string,
  options: SanitizationOptions = {}
): string {
  const config = {
    ALLOWED_TAGS: options.allowedTags || [],
    ALLOWED_ATTR: options.allowedAttributes || [],
    KEEP_CONTENT: !options.stripTags,
  };

  let sanitized = DOMPurify.sanitize(input, config);

  // Apply length limit if specified
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

/**
 * Sanitize plain text, removing all HTML and dangerous characters
 */
export function sanitizeText(input: string, maxLength?: number): string {
  // Strip all HTML tags and potentially dangerous characters
  let sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // Additional cleanup for special characters that could be problematic
  sanitized = sanitized
    .replace(/[<>'"&]/g, '') // Remove remaining dangerous chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Apply length limit
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize AI prompts - specifically designed for AI model inputs
 */
export function sanitizeAIPrompt(prompt: string): string {
  // Remove potential prompt injection attempts
  const sanitized = sanitizeText(prompt, 2000) // Reasonable limit for AI prompts
    .replace(/system:|assistant:|user:/gi, '') // Remove role indicators
    .replace(/\[INST\]|\[\/INST\]/gi, '') // Remove instruction markers
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/<\|[\s\S]*?\|>/g, '') // Remove special tokens
    .trim();

  return sanitized;
}

/**
 * Sanitize ingredient names for food tracking
 */
export function sanitizeIngredientName(name: string): string {
  return sanitizeText(name, 100) // Ingredients shouldn't be too long
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Only allow alphanumeric, spaces, and hyphens
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize user notes and descriptions
 */
export function sanitizeUserNote(note: string): string {
  return sanitizeText(note, 500); // Reasonable limit for notes
}

/**
 * Sanitize file names
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace unsafe chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 255); // Reasonable file name length limit
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeText(email, 254) // Max email length per RFC
    .toLowerCase();

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  return sanitized;
}

/**
 * Batch sanitization for arrays of strings
 */
export function sanitizeStringArray(
  items: string[],
  sanitizer: (item: string) => string = sanitizeText
): string[] {
  return items
    .filter(item => typeof item === 'string' && item.trim().length > 0)
    .map(sanitizer)
    .filter(item => item.length > 0);
}
