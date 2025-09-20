'use client';

import { Camera, Images, X, Scan, Type, Check, Edit } from 'lucide-react';

export type CameraMode =
  | 'camera'
  | 'upload'
  | 'cancel'
  | 'manual'
  | 'barcode'
  | 'label'
  | 'submit';

interface ModeSelectorProps {
  selectedMode: CameraMode;
  onModeChange: (mode: CameraMode) => void;
  hasImages?: boolean;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export function ModeSelector({
  selectedMode,
  onModeChange,
  hasImages = false,
  onSubmit,
  isSubmitting = false,
}: ModeSelectorProps) {
  const allModes = [
    { mode: 'cancel' as const, icon: X, disabled: false },
    { mode: 'upload' as const, icon: Images, disabled: false },
    { mode: 'camera' as const, icon: Camera, disabled: false },
    { mode: 'barcode' as const, icon: Scan, disabled: true },
    { mode: 'label' as const, icon: Type, disabled: true },
    { mode: 'manual' as const, icon: Edit, disabled: false },
  ];

  // Add submit button when images are captured
  const modes =
    hasImages && onSubmit
      ? [...allModes, { mode: 'submit' as const, icon: Check, disabled: false }]
      : allModes;

  const handleModeClick = (mode: CameraMode | 'submit') => {
    if (mode === 'submit' && onSubmit) {
      onSubmit();
    } else if (mode !== 'submit') {
      onModeChange(mode);
    }
  };

  return (
    <div className="flex justify-center">
      {/* Single horizontal icon bar */}
      <div className="flex items-center gap-4 px-6 py-3 bg-card/90 backdrop-blur-sm rounded-full shadow-lg">
        {modes.map(({ mode, icon: Icon, disabled }) => (
          <button
            key={mode}
            onClick={() => !disabled && !isSubmitting && handleModeClick(mode)}
            disabled={disabled || isSubmitting}
            aria-label={mode === 'submit' ? 'Done' : mode}
            className={`
              p-3 rounded-full transition-all duration-200
              ${
                selectedMode === mode && mode !== 'cancel'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : mode === 'cancel'
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    : 'hover:bg-muted text-muted-foreground'
              }
              ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              ${mode === 'submit' ? 'bg-brand-primary text-primary-foreground hover:bg-brand-primary/90' : ''}
            `}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>
    </div>
  );
}
