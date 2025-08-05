/**
 * Zone Colors Unit Tests
 * 
 * Tests the complete ingredient zoning color system:
 * - Zone color definitions and formats
 * - Color utility functions
 * - Tailwind class generation
 * - CSS style object generation
 * - Alpha transparency handling
 */

import {
  getZoneColor,
  getZoneBgClass,
  getZoneBgStyle,
  getZoneTextClass,
  getZoneBorderClass,
  getZoneClasses,
  getZoneColorWithAlpha,
  getZoneStyle,
  cn,
  zoneColors,
  type ZoneType,
  type ColorFormat,
} from '@/lib/utils/zone-colors';

describe('Zone Colors System', () => {
  describe('Zone Color Definitions', () => {
    it('should define all three zone colors', () => {
      expect(zoneColors.green).toBeDefined();
      expect(zoneColors.yellow).toBeDefined();
      expect(zoneColors.red).toBeDefined();
    });

    it('should have consistent structure for all zones', () => {
      const zones: ZoneType[] = ['green', 'yellow', 'red'];
      
      zones.forEach(zone => {
        const config = zoneColors[zone];
        
        // Check required properties
        expect(config.hex).toMatch(/^#[0-9a-f]{6}$/i);
        expect(config.hsl).toContain('var(--zone-');
        expect(config.rgb).toContain('var(--zone-');
        
        // Check Tailwind classes
        expect(config.bg).toBe(`bg-zone-${zone}`);
        expect(config.text).toBe(`text-zone-${zone}`);
        expect(config.border).toBe(`border-zone-${zone}`);
        
        // Check opacity variants
        expect(config.bgLight).toBe(`bg-zone-${zone}/10`);
        expect(config.bgMedium).toBe(`bg-zone-${zone}/50`);
        expect(config.bgDark).toBe(`bg-zone-${zone}/80`);
        expect(config.textLight).toBe(`text-zone-${zone}/70`);
        expect(config.borderLight).toBe(`border-zone-${zone}/30`);
      });
    });

    it('should have correct hex color values', () => {
      expect(zoneColors.green.hex).toBe('#27a69a');
      expect(zoneColors.yellow.hex).toBe('#ffc00a');
      expect(zoneColors.red.hex).toBe('#fe5151');
    });
  });

  describe('getZoneColor', () => {
    it('should return correct colors for different formats', () => {
      // Test green zone
      expect(getZoneColor('green', 'hex')).toBe('#27a69a');
      expect(getZoneColor('green', 'hsl')).toBe('hsl(var(--zone-green))');
      expect(getZoneColor('green', 'rgb')).toBe('rgb(var(--zone-green-rgb))');
      expect(getZoneColor('green', 'className')).toBe('bg-zone-green');
      expect(getZoneColor('green', 'tailwind')).toBe('bg-zone-green');
    });

    it('should default to hsl format when no format specified', () => {
      expect(getZoneColor('yellow')).toBe('hsl(var(--zone-yellow))');
    });

    it('should handle all zone types', () => {
      const zones: ZoneType[] = ['green', 'yellow', 'red'];
      
      zones.forEach(zone => {
        expect(getZoneColor(zone, 'hex')).toMatch(/^#[0-9a-f]{6}$/i);
        expect(getZoneColor(zone, 'hsl')).toContain(`var(--zone-${zone})`);
      });
    });
  });

  describe('getZoneBgClass', () => {
    it('should return base background class without opacity', () => {
      expect(getZoneBgClass('green')).toBe('bg-zone-green');
      expect(getZoneBgClass('yellow')).toBe('bg-zone-yellow');
      expect(getZoneBgClass('red')).toBe('bg-zone-red');
    });

    it('should return opacity variants when specified', () => {
      expect(getZoneBgClass('green', 'light')).toBe('bg-zone-green/10');
      expect(getZoneBgClass('green', 'medium')).toBe('bg-zone-green/50');
      expect(getZoneBgClass('green', 'dark')).toBe('bg-zone-green/80');
    });

    it('should work for all zones with opacity', () => {
      const zones: ZoneType[] = ['green', 'yellow', 'red'];
      
      zones.forEach(zone => {
        expect(getZoneBgClass(zone, 'light')).toBe(`bg-zone-${zone}/10`);
        expect(getZoneBgClass(zone, 'medium')).toBe(`bg-zone-${zone}/50`);
        expect(getZoneBgClass(zone, 'dark')).toBe(`bg-zone-${zone}/80`);
      });
    });
  });

  describe('getZoneBgStyle', () => {
    it('should return CSS style object with background color', () => {
      const style = getZoneBgStyle('green');
      
      expect(style).toEqual({
        backgroundColor: 'hsl(var(--zone-green))',
      });
    });

    it('should handle opacity when specified', () => {
      const style = getZoneBgStyle('yellow', 0.5);
      
      expect(style).toEqual({
        backgroundColor: 'hsl(var(--zone-yellow) / 0.5)',
      });
    });

    it('should work for all zones', () => {
      const zones: ZoneType[] = ['green', 'yellow', 'red'];
      
      zones.forEach(zone => {
        const style = getZoneBgStyle(zone);
        expect(style.backgroundColor).toBe(`hsl(var(--zone-${zone}))`);
        
        const styleWithOpacity = getZoneBgStyle(zone, 0.3);
        expect(styleWithOpacity.backgroundColor).toBe(`hsl(var(--zone-${zone}) / 0.3)`);
      });
    });
  });

  describe('getZoneTextClass', () => {
    it('should return standard text class', () => {
      expect(getZoneTextClass('green')).toBe('text-zone-green');
      expect(getZoneTextClass('yellow')).toBe('text-zone-yellow');
      expect(getZoneTextClass('red')).toBe('text-zone-red');
    });

    it('should return light text class when specified', () => {
      expect(getZoneTextClass('green', true)).toBe('text-zone-green/70');
      expect(getZoneTextClass('yellow', true)).toBe('text-zone-yellow/70');
      expect(getZoneTextClass('red', true)).toBe('text-zone-red/70');
    });

    it('should default to standard when light is false', () => {
      expect(getZoneTextClass('green', false)).toBe('text-zone-green');
    });
  });

  describe('getZoneBorderClass', () => {
    it('should return standard border class', () => {
      expect(getZoneBorderClass('green')).toBe('border-zone-green');
      expect(getZoneBorderClass('yellow')).toBe('border-zone-yellow');
      expect(getZoneBorderClass('red')).toBe('border-zone-red');
    });

    it('should return light border class when specified', () => {
      expect(getZoneBorderClass('green', true)).toBe('border-zone-green/30');
      expect(getZoneBorderClass('yellow', true)).toBe('border-zone-yellow/30');
      expect(getZoneBorderClass('red', true)).toBe('border-zone-red/30');
    });
  });

  describe('getZoneClasses', () => {
    it('should return solid variant classes', () => {
      const classes = getZoneClasses('green', 'solid');
      expect(classes).toContain('bg-zone-green');
      expect(classes).toContain('text-white');
    });

    it('should return outline variant classes', () => {
      const classes = getZoneClasses('yellow', 'outline');
      expect(classes).toContain('border-zone-yellow');
      expect(classes).toContain('text-zone-yellow');
      expect(classes).toContain('border-2');
      expect(classes).toContain('bg-transparent');
    });

    it('should return ghost variant classes', () => {
      const classes = getZoneClasses('red', 'ghost');
      expect(classes).toContain('bg-zone-red/10');
      expect(classes).toContain('text-zone-red');
    });

    it('should return indicator variant classes', () => {
      const classes = getZoneClasses('green', 'indicator');
      expect(classes).toBe('bg-zone-green');
    });

    it('should default to solid variant', () => {
      const defaultClasses = getZoneClasses('green');
      const solidClasses = getZoneClasses('green', 'solid');
      expect(defaultClasses).toBe(solidClasses);
    });
  });

  describe('getZoneColorWithAlpha', () => {
    it('should return hex color without alpha when not specified', () => {
      expect(getZoneColorWithAlpha('green')).toBe('#27a69a');
      expect(getZoneColorWithAlpha('yellow')).toBe('#ffc00a');
      expect(getZoneColorWithAlpha('red')).toBe('#fe5151');
    });

    it('should append alpha value when specified', () => {
      expect(getZoneColorWithAlpha('green', '80')).toBe('#27a69a80');
      expect(getZoneColorWithAlpha('yellow', '40')).toBe('#ffc00a40');
      expect(getZoneColorWithAlpha('red', 'FF')).toBe('#fe5151FF');
    });

    it('should handle different alpha formats', () => {
      // Test with percentage-like values
      expect(getZoneColorWithAlpha('green', '50')).toBe('#27a69a50');
      // Test with hex-like values
      expect(getZoneColorWithAlpha('green', 'CC')).toBe('#27a69aCC');
    });
  });

  describe('getZoneStyle', () => {
    it('should return style object with backgroundColor by default', () => {
      const style = getZoneStyle('green');
      expect(style).toEqual({
        backgroundColor: 'hsl(var(--zone-green))',
      });
    });

    it('should handle different CSS properties', () => {
      const bgStyle = getZoneStyle('yellow', 'backgroundColor');
      expect(bgStyle).toEqual({
        backgroundColor: 'hsl(var(--zone-yellow))',
      });

      const colorStyle = getZoneStyle('red', 'color');
      expect(colorStyle).toEqual({
        color: 'hsl(var(--zone-red))',
      });

      const borderStyle = getZoneStyle('green', 'borderColor');
      expect(borderStyle).toEqual({
        borderColor: 'hsl(var(--zone-green))',
      });
    });

    it('should work for all zones and properties', () => {
      const zones: ZoneType[] = ['green', 'yellow', 'red'];
      const properties = ['backgroundColor', 'color', 'borderColor'] as const;
      
      zones.forEach(zone => {
        properties.forEach(property => {
          const style = getZoneStyle(zone, property);
          expect(style[property]).toBe(`hsl(var(--zone-${zone}))`);
        });
      });
    });
  });

  describe('Utility Functions', () => {
    it('should export cn function for class merging', () => {
      expect(typeof cn).toBe('function');
      
      // Test basic functionality
      const result = cn('class1', 'class2');
      expect(typeof result).toBe('string');
    });

    it('should handle class conflicts with cn', () => {
      // This tests that twMerge is working correctly
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500'); // Later class should win
    });
  });

  describe('Type Safety', () => {
    it('should enforce ZoneType constraint', () => {
      // These should work (compile-time check)
      const validZones: ZoneType[] = ['green', 'yellow', 'red'];
      validZones.forEach(zone => {
        expect(() => getZoneColor(zone)).not.toThrow();
      });
    });

    it('should enforce ColorFormat constraint', () => {
      // These should work (compile-time check)
      const validFormats: ColorFormat[] = ['hex', 'hsl', 'rgb', 'className', 'tailwind'];
      validFormats.forEach(format => {
        expect(() => getZoneColor('green', format)).not.toThrow();
      });
    });
  });

  describe('Integration with CSS Variables', () => {
    it('should generate CSS variable references correctly', () => {
      expect(getZoneColor('green', 'hsl')).toBe('hsl(var(--zone-green))');
      expect(getZoneColor('yellow', 'rgb')).toBe('rgb(var(--zone-yellow-rgb))');
      expect(getZoneColor('red', 'hsl')).toBe('hsl(var(--zone-red))');
    });

    it('should support theme switching through CSS variables', () => {
      // The functions should return variable references that work with both light and dark themes
      const zones: ZoneType[] = ['green', 'yellow', 'red'];
      
      zones.forEach(zone => {
        const hslColor = getZoneColor(zone, 'hsl');
        const rgbColor = getZoneColor(zone, 'rgb');
        
        expect(hslColor).toMatch(/var\(--zone-\w+\)/);
        expect(rgbColor).toMatch(/var\(--zone-\w+-rgb\)/);
      });
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should generate classes for ingredient zone badges', () => {
      // Simulate creating badge classes for different ingredient zones
      const greenBadge = getZoneClasses('green', 'ghost');
      const yellowBadge = getZoneClasses('yellow', 'outline');
      const redBadge = getZoneClasses('red', 'solid');
      
      expect(greenBadge).toContain('bg-zone-green/10');
      expect(yellowBadge).toContain('border-zone-yellow');
      expect(redBadge).toContain('bg-zone-red');
    });

    it('should support chart/visualization colors', () => {
      // Simulate getting colors for chart libraries
      const chartColors = ['green', 'yellow', 'red'].map(zone => 
        getZoneColorWithAlpha(zone as ZoneType, '80')
      );
      
      expect(chartColors).toEqual([
        '#27a69a80',
        '#ffc00a80',
        '#fe515180'
      ]);
    });

    it('should support inline styling for dynamic components', () => {
      // Simulate dynamic component styling
      const zones: ZoneType[] = ['green', 'yellow', 'red'];
      const styles = zones.map(zone => getZoneBgStyle(zone, 0.2));
      
      styles.forEach((style, index) => {
        const zone = zones[index];
        expect(style.backgroundColor).toBe(`hsl(var(--zone-${zone}) / 0.2)`);
      });
    });
  });
});