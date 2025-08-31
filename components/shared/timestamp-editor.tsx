'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { DayTimePicker } from '@/components/ui/day-time-picker';

interface TimestampEditorProps {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
  description?: string;
  className?: string;
}

export function TimestampEditor({
  value,
  onChange,
  label,
  description,
  className = '',
}: TimestampEditorProps) {
  return (
    <div className={className}>
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-gray-600 mb-2">{description}</p>
      )}
      <DayTimePicker
        value={value}
        onChange={onChange}
        className="w-full"
      />
    </div>
  );
}
