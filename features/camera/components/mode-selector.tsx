'use client';

import {
  Camera,
  Images,
  X,
  ScanBarcode,
  ScanText,
  Check,
  Edit,
  Loader2,
} from 'lucide-react';

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
    { mode: 'barcode' as const, icon: ScanBarcode, disabled: true },
    { mode: 'label' as const, icon: ScanText, disabled: true },
    { mode: 'manual' as const, icon: Edit, disabled: false },
    { mode: 'submit' as const, icon: Check, disabled: !hasImages || !onSubmit },
  ];

  // All modes are now always present - no conditional array modification
  const modes = allModes;

  const handleModeClick = (mode: CameraMode | 'submit') => {
    if (mode === 'submit' && onSubmit && hasImages) {
      onSubmit();
    } else if (mode !== 'submit') {
      onModeChange(mode);
    }
  };

  return (
    <div className="flex justify-center">
      {/* Single horizontal icon bar with responsive sizing */}
      <div
        className="mode-selector-container flex items-center bg-card/90 backdrop-blur-sm rounded-full shadow-lg"
        style={{
          gap: 'var(--mode-gap)',
          paddingLeft: 'var(--mode-container-px)',
          paddingRight: 'var(--mode-container-px)',
          paddingTop: 'var(--mode-container-py)',
          paddingBottom: 'var(--mode-container-py)',
          /* Container sizing transitions removed for instant feedback */
        }}
      >
        {modes.map(({ mode, icon: Icon, disabled }) => (
          <button
            key={mode}
            onClick={() => !disabled && !isSubmitting && handleModeClick(mode)}
            disabled={disabled || isSubmitting}
            aria-label={mode === 'submit' ? 'Done' : mode}
            className={`
              mode-selector-button rounded-full flex items-center justify-center
              ${
                selectedMode === mode && mode !== 'cancel'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : mode === 'cancel'
                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    : mode === 'submit' &&
                        hasImages &&
                        onSubmit &&
                        !isSubmitting
                      ? 'bg-brand-primary text-primary-foreground hover:bg-brand-primary/90'
                      : mode === 'submit' && isSubmitting
                        ? 'bg-brand-primary/80 text-primary-foreground'
                        : mode === 'submit'
                          ? 'bg-muted/40 text-muted-foreground/60'
                          : 'hover:bg-muted text-muted-foreground'
              }
              ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={{
              width: 'var(--mode-button-size)',
              height: 'var(--mode-button-size)',
            }}
          >
            {mode === 'submit' && isSubmitting ? (
              <Loader2
                style={{
                  width: 'var(--mode-icon-size)',
                  height: 'var(--mode-icon-size)',
                }}
                className="animate-spin"
              />
            ) : (
              <Icon
                style={{
                  width: 'var(--mode-icon-size)',
                  height: 'var(--mode-icon-size)',
                }}
              />
            )}
          </button>
        ))}
      </div>

      <style jsx>{`
        .mode-selector-container {
          /* Default sizing (xl breakpoint) */
          --mode-icon-size: 20px;
          --mode-button-size: 44px;
          --mode-gap: 12px;
          --mode-container-px: 12px;
          --mode-container-py: 12px;
        }

        /* Large screens (lg) - delay shrinking until ~420px */
        @media (max-width: 420px) {
          .mode-selector-container {
            --mode-icon-size: 18px;
            --mode-button-size: 40px;
            --mode-gap: 11px;
            --mode-container-px: 10px;
            --mode-container-py: 10px;
          }
        }

        /* Medium-large screens - more conservative shrinking */
        @media (max-width: 390px) {
          .mode-selector-container {
            --mode-icon-size: 16px;
            --mode-button-size: 36px;
            --mode-gap: 10px;
            --mode-container-px: 9px;
            --mode-container-py: 9px;
          }
        }

        /* Medium screens (md) - preserve more space */
        @media (max-width: 360px) {
          .mode-selector-container {
            --mode-icon-size: 14px;
            --mode-button-size: 32px;
            --mode-gap: 8px;
            --mode-container-px: 8px;
            --mode-container-py: 8px;
          }
        }

        /* Small screens (sm) - only for very tight spaces */
        @media (max-width: 330px) {
          .mode-selector-container {
            --mode-icon-size: 12px;
            --mode-button-size: 28px;
            --mode-gap: 7px;
            --mode-container-px: 7px;
            --mode-container-py: 7px;
          }
        }

        /* Extra small screens (xs) */
        @media (max-width: 320px) {
          .mode-selector-container {
            --mode-icon-size: 10px;
            --mode-button-size: 24px;
            --mode-gap: 5px;
            --mode-container-px: 6px;
            --mode-container-py: 6px;
          }
        }

        /* Instant mode changes - no transitions */
        .mode-selector-button {
          /* No transitions for instant feedback */
        }
      `}</style>
    </div>
  );
}
