/**
 * Client IP extraction utility for consistent IP handling across API routes
 * Handles various proxy scenarios and provides fallback for local development
 */

import { NextRequest } from 'next/server';
import { logger } from '@/lib/utils/logger';

/**
 * Extract client IP address from request headers
 * Follows the same pattern used across existing API endpoints
 *
 * @param request - Next.js request object
 * @returns Client IP address or fallback
 */
export function getClientIP(request: NextRequest): string {
  // Check X-Forwarded-For header (most common proxy header)
  const forwardedFor = request.headers.get('x-forwarded-for');

  // Check X-Real-IP header (nginx proxy)
  const realIp = request.headers.get('x-real-ip');

  // Check CF-Connecting-IP (Cloudflare)
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  // Check X-Client-IP (some proxies)
  const clientIp = request.headers.get('x-client-ip');

  // Priority order for IP extraction
  let ip: string;

  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one (original client)
    ip = forwardedFor.split(',')[0].trim();
  } else if (cfConnectingIp) {
    // Cloudflare provides the real client IP
    ip = cfConnectingIp.trim();
  } else if (realIp) {
    // X-Real-IP typically contains a single IP
    ip = realIp.trim();
  } else if (clientIp) {
    // X-Client-IP fallback
    ip = clientIp.trim();
  } else {
    // Default fallback for local development
    ip = '127.0.0.1';
  }

  // Basic IP validation and sanitization
  const sanitizedIP = sanitizeIP(ip);

  logger.debug('Client IP extracted', {
    forwardedFor,
    realIp,
    cfConnectingIp,
    clientIp,
    extractedIP: sanitizedIP,
  });

  return sanitizedIP;
}

/**
 * Sanitize and validate IP address
 * @param ip - Raw IP address string
 * @returns Sanitized IP address or fallback
 */
function sanitizeIP(ip: string): string {
  // Remove whitespace
  const cleaned = ip.trim();

  // Basic validation for IPv4 format
  if (isValidIPv4(cleaned)) {
    return cleaned;
  }

  // Basic validation for IPv6 format
  if (isValidIPv6(cleaned)) {
    return cleaned;
  }

  // Log suspicious IP format and return fallback
  logger.warn('Invalid IP format detected, using fallback', {
    invalidIP: cleaned,
  });
  return '127.0.0.1';
}

/**
 * Basic IPv4 validation
 * @param ip - IP address string
 * @returns true if valid IPv4 format
 */
function isValidIPv4(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Regex);

  if (!match) return false;

  // Check each octet is between 0-255
  return match.slice(1).every(octet => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * Basic IPv6 validation
 * @param ip - IP address string
 * @returns true if valid IPv6 format
 */
function isValidIPv6(ip: string): boolean {
  // Simplified IPv6 validation - matches basic format
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(ip) || ip === '::1'; // Also allow localhost
}

/**
 * Get client IP for rate limiting with consistent identifier
 * Useful for creating rate limit keys that are consistent across requests
 *
 * @param request - Next.js request object
 * @param prefix - Optional prefix for the rate limit key
 * @returns Rate limit identifier
 */
export function getRateLimitIdentifier(
  request: NextRequest,
  prefix?: string
): string {
  const ip = getClientIP(request);
  return prefix ? `${prefix}:${ip}` : ip;
}
