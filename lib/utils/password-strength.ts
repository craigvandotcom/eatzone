/**
 * Password strength utility
 * Provides visual feedback without enforcing complexity requirements
 */

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number; // 0-4
  feedback: string[];
}

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Use at least 8 characters');
  }

  if (password.length >= 12) {
    score += 0.5;
  }

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (hasLowercase) score += 0.5;
  if (hasUppercase) score += 0.5;
  if (hasNumbers) score += 0.5;
  if (hasSpecialChars) score += 1;

  // Provide feedback for missing character types
  const missingTypes: string[] = [];
  if (!hasLowercase) missingTypes.push('lowercase letters');
  if (!hasUppercase) missingTypes.push('uppercase letters');
  if (!hasNumbers) missingTypes.push('numbers');
  if (!hasSpecialChars) missingTypes.push('special characters');

  if (missingTypes.length > 0) {
    feedback.push(`Add ${missingTypes.join(', ')}`);
  }

  // Common patterns to avoid
  const commonPatterns = [
    /^12345/,
    /^password/i,
    /^qwerty/i,
    /^abc123/i,
    /(.)\1{2,}/, // Repeated characters
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid common patterns');
  }

  // Determine strength based on score
  let strength: PasswordStrength;
  if (score < 2) {
    strength = 'weak';
  } else if (score < 3) {
    strength = 'fair';
  } else if (score < 4) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  // Ensure minimum feedback
  if (feedback.length === 0 && strength !== 'strong') {
    feedback.push('Keep improving your password');
  }

  return {
    strength,
    score: Math.min(4, score),
    feedback,
  };
}

export function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'text-red-600';
    case 'fair':
      return 'text-amber-600';
    case 'good':
      return 'text-blue-600';
    case 'strong':
      return 'text-green-600';
  }
}

export function getStrengthBgColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'bg-red-100';
    case 'fair':
      return 'bg-amber-100';
    case 'good':
      return 'bg-blue-100';
    case 'strong':
      return 'bg-green-100';
  }
}