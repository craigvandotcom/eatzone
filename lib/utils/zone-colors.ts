import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Zone type definition
export type ZoneType = 'green' | 'yellow' | 'red';

// Color format options
export type ColorFormat = 'hex' | 'hsl' | 'rgb' | 'className' | 'tailwind';

// Zone color definitions
export const zoneColors = {
  green: {
    // Light mode hex
    hex: '#27a69a',
    // CSS variable references
    hsl: 'hsl(var(--zone-green))',
    rgb: 'rgb(var(--zone-green-rgb))',
    // Tailwind classes
    bg: 'bg-zone-green',
    text: 'text-zone-green',
    border: 'border-zone-green',
    // With transparency
    bgLight: 'bg-zone-green/10',
    bgMedium: 'bg-zone-green/50',
    bgDark: 'bg-zone-green/80',
    textLight: 'text-zone-green/70',
    borderLight: 'border-zone-green/30',
  },
  yellow: {
    hex: '#ffc00a',
    hsl: 'hsl(var(--zone-yellow))',
    rgb: 'rgb(var(--zone-yellow-rgb))',
    bg: 'bg-zone-yellow',
    text: 'text-zone-yellow',
    border: 'border-zone-yellow',
    bgLight: 'bg-zone-yellow/10',
    bgMedium: 'bg-zone-yellow/50',
    bgDark: 'bg-zone-yellow/80',
    textLight: 'text-zone-yellow/70',
    borderLight: 'border-zone-yellow/30',
  },
  red: {
    hex: '#fe5151',
    hsl: 'hsl(var(--zone-red))',
    rgb: 'rgb(var(--zone-red-rgb))',
    bg: 'bg-zone-red',
    text: 'text-zone-red',
    border: 'border-zone-red',
    bgLight: 'bg-zone-red/10',
    bgMedium: 'bg-zone-red/50',
    bgDark: 'bg-zone-red/80',
    textLight: 'text-zone-red/70',
    borderLight: 'border-zone-red/30',
  },
} as const;

/**
 * Get zone color in specified format
 * @param zone - The zone type ('green', 'yellow', 'red')
 * @param format - The desired color format
 * @returns The color value in the specified format
 */
export function getZoneColor(
  zone: ZoneType,
  format: ColorFormat = 'hsl',
): string {
  const colorConfig = zoneColors[zone];

  switch (format) {
    case 'hex':
      return colorConfig.hex;
    case 'hsl':
      return colorConfig.hsl;
    case 'rgb':
      return colorConfig.rgb;
    case 'className':
    case 'tailwind':
      return colorConfig.bg;
    default:
      return colorConfig.hsl;
  }
}

/**
 * Get zone background class with optional opacity
 * @param zone - The zone type
 * @param opacity - Optional opacity level ('light', 'medium', 'dark')
 * @returns Tailwind background class
 */
export function getZoneBgClass(
  zone: ZoneType,
  opacity?: 'light' | 'medium' | 'dark',
): string {
  const colorConfig = zoneColors[zone];

  switch (opacity) {
    case 'light':
      return colorConfig.bgLight;
    case 'medium':
      return colorConfig.bgMedium;
    case 'dark':
      return colorConfig.bgDark;
    default:
      return colorConfig.bg;
  }
}

/**
 * Get zone background style for reliable inline styling
 * @param zone - The zone type
 * @param opacity - Optional opacity level (0-1)
 * @returns CSS style object with background color
 */
export function getZoneBgStyle(
  zone: ZoneType,
  opacity?: number,
): React.CSSProperties {
  const colorConfig = zoneColors[zone];

  if (opacity !== undefined) {
    // Use CSS variable with opacity for dark mode support
    return {
      backgroundColor: `hsl(var(--zone-${zone}) / ${opacity})`,
    };
  }

  return {
    backgroundColor: colorConfig.hsl,
  };
}

/**
 * Get zone text class with optional opacity
 * @param zone - The zone type
 * @param light - Whether to use light opacity
 * @returns Tailwind text class
 */
export function getZoneTextClass(zone: ZoneType, light = false): string {
  const colorConfig = zoneColors[zone];
  return light ? colorConfig.textLight : colorConfig.text;
}

/**
 * Get zone border class with optional opacity
 * @param zone - The zone type
 * @param light - Whether to use light opacity
 * @returns Tailwind border class
 */
export function getZoneBorderClass(zone: ZoneType, light = false): string {
  const colorConfig = zoneColors[zone];
  return light ? colorConfig.borderLight : colorConfig.border;
}

/**
 * Generate complete zone styling classes
 * @param zone - The zone type
 * @param variant - The styling variant
 * @returns Combined Tailwind classes
 */
export function getZoneClasses(
  zone: ZoneType,
  variant: 'solid' | 'outline' | 'ghost' | 'indicator' = 'solid',
): string {
  const colorConfig = zoneColors[zone];

  switch (variant) {
    case 'solid':
      return twMerge(colorConfig.bg, 'text-white');
    case 'outline':
      return twMerge(
        colorConfig.border,
        colorConfig.text,
        'border-2 bg-transparent',
      );
    case 'ghost':
      return twMerge(colorConfig.bgLight, colorConfig.text);
    case 'indicator':
      return colorConfig.bg;
    default:
      return colorConfig.bg;
  }
}

/**
 * Get zone color with alpha transparency for SVG/Canvas usage
 * @param zone - The zone type
 * @param alpha - Alpha value (0-100) as string, e.g. "40" for 40% opacity
 * @returns Hex color with alpha for SVG usage
 */
export function getZoneColorWithAlpha(zone: ZoneType, alpha?: string): string {
  const colorConfig = zoneColors[zone];

  if (alpha) {
    return `${colorConfig.hex}${alpha}`;
  }

  return colorConfig.hex;
}

/**
 * Get inline style object for zone color
 * @param zone - The zone type
 * @param property - CSS property to style ('backgroundColor', 'color', 'borderColor')
 * @returns Style object for React components
 */
export function getZoneStyle(
  zone: ZoneType,
  property: 'backgroundColor' | 'color' | 'borderColor' = 'backgroundColor',
): React.CSSProperties {
  const colorConfig = zoneColors[zone];

  return {
    [property]: colorConfig.hsl,
  };
}

/**
 * Utility to combine zone classes with other classes
 * @param zoneClasses - Zone-specific classes
 * @param additionalClasses - Additional classes to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Export zone type for use in other components
export { type ZoneType as Zone };
