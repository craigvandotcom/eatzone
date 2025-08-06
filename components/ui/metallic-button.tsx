import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const metallicButtonVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden transition-all duration-300 ease-out',
  {
    variants: {
      variant: {
        metallic: [
          // Base metallic styling
          'bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100',
          'border border-slate-200/60',
          'backdrop-blur-sm',

          // Multi-layer shadows for depth
          'shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]',
          'hover:shadow-[0_2px_6px_rgba(0,0,0,0.08),0_6px_20px_rgba(0,0,0,0.12),0_12px_32px_rgba(0,0,0,0.10)]',

          // Subtle inner highlights
          'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:via-transparent before:to-transparent',
          'before:rounded-full before:pointer-events-none',

          // Pressed state
          'active:scale-95 active:shadow-inner',
          'active:shadow-[inset_0_2px_8px_rgba(0,0,0,0.12)]',
        ],
      },
      accent: {
        food: [
          'ring-2 ring-offset-2 ring-offset-white',
          'ring-green-400/30 hover:ring-green-400/50',
          'hover:bg-gradient-to-br hover:from-green-50 hover:via-slate-50 hover:to-green-50',
          'after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-green-400/5 after:to-transparent after:pointer-events-none',
        ],
        symptom: [
          'ring-2 ring-offset-2 ring-offset-white',
          'ring-red-400/30 hover:ring-red-400/50',
          'hover:bg-gradient-to-br hover:from-red-50 hover:via-slate-50 hover:to-red-50',
          'after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-red-400/5 after:to-transparent after:pointer-events-none',
        ],
      },
      size: {
        default: 'h-14 w-14 rounded-full',
        lg: 'h-16 w-16 rounded-full',
        xl: 'h-20 w-20 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'metallic',
      size: 'default',
    },
  }
);

export interface MetallicButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof metallicButtonVariants> {}

const MetallicButton = React.forwardRef<HTMLButtonElement, MetallicButtonProps>(
  ({ className, variant, accent, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          metallicButtonVariants({ variant, accent, size }),
          className
        )}
        ref={ref}
        {...props}
      >
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);
MetallicButton.displayName = 'MetallicButton';

export { MetallicButton, metallicButtonVariants };
