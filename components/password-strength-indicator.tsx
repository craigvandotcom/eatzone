'use client';

import React from 'react';
import {
  calculatePasswordStrength,
  getStrengthColor,
  getStrengthBgColor,
} from '@/lib/utils/password-strength';
import { Info } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showFeedback?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  showFeedback = true,
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const { strength, score, feedback } = calculatePasswordStrength(password);
  const percentage = (score / 4) * 100;

  return (
    <div className="space-y-2 animate-in fade-in-50 duration-200">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className={`font-medium capitalize ${getStrengthColor(strength)}`}
          >
            {strength}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out ${
              strength === 'weak'
                ? 'bg-red-500'
                : strength === 'fair'
                  ? 'bg-amber-500'
                  : strength === 'good'
                    ? 'bg-blue-500'
                    : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Feedback */}
      {showFeedback && feedback.length > 0 && (
        <div
          className={`text-xs p-2 rounded-md flex items-start gap-1.5 ${getStrengthBgColor(strength)}`}
        >
          <Info
            className={`h-3 w-3 mt-0.5 flex-shrink-0 ${getStrengthColor(strength)}`}
          />
          <div className={`${getStrengthColor(strength)}`}>
            {feedback.join(' • ')}
          </div>
        </div>
      )}
    </div>
  );
}
