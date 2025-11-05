import type { Config } from 'tailwindcss';

// all in fixtures is set to tailwind v3 as interims solutions

const config: Config = {
  // Dark mode only - no class switching needed
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Brand color classes - ensure they're always generated
    'bg-brand-primary',
    'bg-brand-red',
    'bg-brand-yellow',
    'text-brand-primary',
    'text-brand-red',
    'text-brand-yellow',
    'border-brand-primary',
    'border-brand-red',
    'border-brand-yellow',
    // Brand colors with opacity variants
    'bg-brand-primary/10',
    'bg-brand-primary/20',
    'bg-brand-primary/50',
    'bg-brand-primary/80',
    'bg-brand-red/10',
    'bg-brand-red/20',
    'bg-brand-red/50',
    'bg-brand-red/80',
    'bg-brand-yellow/10',
    'bg-brand-yellow/20',
    'bg-brand-yellow/50',
    'bg-brand-yellow/80',
    'text-brand-primary/70',
    'text-brand-red/70',
    'text-brand-yellow/70',
    'border-brand-primary/30',
    'border-brand-red/30',
    'border-brand-yellow/30',
    // Zone color classes - ensure they're always generated
    'bg-zone-green',
    'bg-zone-yellow',
    'bg-zone-red',
    'text-zone-green',
    'text-zone-yellow',
    'text-zone-red',
    'border-zone-green',
    'border-zone-yellow',
    'border-zone-red',
    // With opacity variants
    'bg-zone-green/10',
    'bg-zone-green/50',
    'bg-zone-green/80',
    'bg-zone-yellow/10',
    'bg-zone-yellow/50',
    'bg-zone-yellow/80',
    'bg-zone-red/10',
    'bg-zone-red/50',
    'bg-zone-red/80',
    'text-zone-green/70',
    'text-zone-yellow/70',
    'text-zone-red/70',
    'border-zone-green/30',
    'border-zone-yellow/30',
    'border-zone-red/30',
    // Animation classes for FAB and icon animations
    'scale-[0.1]',
    'scale-[0.05]',
    // Z-index classes for proper stacking
    'z-10',
    'z-50',
    'z-[60]',
    'z-[70]',
    // Transform classes for animations
    'scale-0',
    'scale-1',
    'rotate-0',
    'rotate-180',
    'rotate-[360deg]',
    // Opacity classes
    'opacity-0',
    'opacity-1',
    // Fixed positioning classes
    'fixed',
    'absolute',
    // Bottom positioning classes
    'bottom-0',
    'bottom-32',
    'right-8',
    'left-1/2',
    // Transform utilities
    'transform',
    '-translate-x-1/2',
    '-translate-y-1/2',
    'transition-all',
    // Min height/width for button consistency
    'min-h-[67px]',
    'min-w-[67px]',
    'w-[67px]',
    'h-[67px]',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Brand colors - New identity
        brand: {
          primary: {
            DEFAULT: 'hsl(var(--brand-primary))',
            rgb: 'rgb(var(--brand-primary-rgb))',
          },
          red: {
            DEFAULT: 'hsl(var(--brand-red))',
            rgb: 'rgb(var(--brand-red-rgb))',
          },
          yellow: {
            DEFAULT: 'hsl(var(--brand-yellow))',
            rgb: 'rgb(var(--brand-yellow-rgb))',
          },
        },
        // Add default yellow shades for zone visualization
        yellow: {
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          500: '#f59e0b',
          700: '#b45309',
        },
        // Zone colors using CSS variables for automatic light/dark mode support
        zone: {
          green: {
            DEFAULT: 'hsl(var(--zone-green))',
            rgb: 'rgb(var(--zone-green-rgb))',
            light: 'hsl(var(--zone-green) / 0.1)',
            medium: 'hsl(var(--zone-green) / 0.5)',
            dark: 'hsl(var(--zone-green) / 0.8)',
          },
          yellow: {
            DEFAULT: 'hsl(var(--zone-yellow))',
            rgb: 'rgb(var(--zone-yellow-rgb))',
            light: 'hsl(var(--zone-yellow) / 0.1)',
            medium: 'hsl(var(--zone-yellow) / 0.5)',
            dark: 'hsl(var(--zone-yellow) / 0.8)',
          },
          red: {
            DEFAULT: 'hsl(var(--zone-red))',
            rgb: 'rgb(var(--zone-red-rgb))',
            light: 'hsl(var(--zone-red) / 0.1)',
            medium: 'hsl(var(--zone-red) / 0.5)',
            dark: 'hsl(var(--zone-red) / 0.8)',
          },
        },
        // Semantic color tokens
        text: {
          primary: 'hsl(var(--text-primary))',
          secondary: 'hsl(var(--text-secondary))',
          tertiary: 'hsl(var(--text-tertiary))',
          disabled: 'hsl(var(--text-disabled))',
        },
        bg: {
          primary: 'hsl(var(--bg-primary))',
          secondary: 'hsl(var(--bg-secondary))',
          tertiary: 'hsl(var(--bg-tertiary))',
          elevated: 'hsl(var(--bg-elevated))',
          subtle: 'hsl(var(--bg-subtle))',
        },
        interactive: {
          DEFAULT: 'hsl(var(--interactive-default))',
          hover: 'hsl(var(--interactive-hover))',
          active: 'hsl(var(--interactive-active))',
          disabled: 'hsl(var(--interactive-disabled))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      height: {
        'screen-dynamic': '100dvh',
        'screen-small': '100svh',
        'screen-large': '100lvh',
      },
      minHeight: {
        'screen-dynamic': '100dvh',
        'screen-small': '100svh',
        'screen-large': '100lvh',
      },
      maxHeight: {
        'screen-dynamic': '100dvh',
        'screen-small': '100svh',
        'screen-large': '100lvh',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
