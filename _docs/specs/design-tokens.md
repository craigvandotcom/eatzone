# Design Token Standards

This document defines the design tokens used throughout the eatZone application to ensure visual consistency and maintainability.

## Color System

### Semantic Color Tokens

Use semantic tokens instead of hardcoded colors for better maintainability and theme support.

**Text Colors:**
- `text-primary` - Primary text (foreground)
- `text-secondary` - Secondary text (muted-foreground)
- `text-tertiary` - Tertiary text (60% opacity)
- `text-disabled` - Disabled text (40% opacity)

**Background Colors:**
- `bg-primary` - Primary background
- `bg-secondary` - Secondary background (cards)
- `bg-tertiary` - Tertiary background
- `bg-elevated` - Elevated surfaces (cards)
- `bg-subtle` - Subtle backgrounds (muted)

**Interactive States:**
- `interactive` - Default interactive element color
- `interactive-hover` - Hover state
- `interactive-active` - Active state (brand primary)
- `interactive-disabled` - Disabled state

### Zone Colors

**Brand zone colors for food classification:**
- `bg-zone-green` / `text-zone-green` / `border-zone-green` - Healthy foods (#01a878)
- `bg-zone-yellow` / `text-zone-yellow` / `border-zone-yellow` - Moderate foods (#fad046)
- `bg-zone-red` / `text-zone-red` / `border-zone-red` - Avoid foods (#f84f36)

**With opacity variants:**
- `bg-zone-green/10`, `bg-zone-green/50`, `bg-zone-green/80`
- Same pattern for yellow and red

### System Colors

- `destructive` - Error/delete actions
- `muted-foreground` - Secondary text
- `border` - Border colors
- `card` - Card backgrounds

## Icon Sizes

Standardized icon sizes for consistency:

- **icon-xs**: 16px (`h-4 w-4`) - Inline text icons, sidebar navigation
- **icon-sm**: 20px (`h-5 w-5`) - Small buttons, form inputs
- **icon-md**: 24px (`h-6 w-6`) - Standard buttons, navigation (DEFAULT)
- **icon-lg**: 32px (`h-8 w-8`) - Headers, loading states, featured elements
- **icon-xl**: 48px (`h-12 w-12`) - Feature icons, empty states, placeholders

**Current Usage:**
- Bottom nav icons: `h-6 w-6` ✅
- Desktop sidebar icons: `h-4 w-4` ✅
- FAB icons: `w-6 h-6` ✅
- Loading spinners: `h-8 w-8` ✅
- Camera placeholders: `h-12 w-12` ✅

All icon sizes are standardized - no changes needed.

## Typography Scale

### Headings

- **Display**: `text-4xl font-bold` (36px) - Hero sections, landing pages
- **H1**: `text-3xl font-bold` (30px) - Page titles
- **H2**: `text-2xl font-semibold` (24px) - Section headers
- **H3**: `text-xl font-semibold` (20px) - Subsection headers
- **H4**: `text-lg font-semibold` (18px) - Card titles

### Body Text

- **Large**: `text-base` (16px) - Primary content, important text
- **Default**: `text-sm` (14px) - Most UI elements, standard body text
- **Small**: `text-xs` (12px) - Captions, labels, helper text

### Current Usage

- Bottom nav labels: `text-xs` ✅
- Sidebar header: `text-lg` ✅
- Button text: `text-sm` ✅
- Helper text: `text-xs text-muted-foreground` ✅

Typography is consistent across the application.

## Border Radius

### CSS Variable
`--radius: 0.75rem` (12px)

### Standard Values

- **sm**: `calc(var(--radius) - 4px)` = 8px - Small elements
- **md**: `calc(var(--radius) - 2px)` = 10px - Medium elements  
- **lg**: `var(--radius)` = 12px - Large elements (default)
- **xl**: 16px - Extra large
- **2xl**: 24px - Very large
- **3xl**: 32px - Massive
- **full**: `rounded-full` - Circles, pills, circular buttons

### Current Usage

- Cards: `rounded-lg` ✅
- Buttons: `rounded-md` ✅
- Inputs: `rounded-md` ✅
- FAB/circular buttons: `rounded-full` ✅
- Badges: `rounded-full` ✅
- Bottom nav: `rounded-t-[40px]` (custom for iOS feel) ✅

Border radius is intentionally varied for UX purposes.

## Spacing Scale

Standard spacing values (Tailwind defaults):

- **xs**: 0.25rem (4px) - Tight spacing
- **sm**: 0.5rem (8px) - Component internal spacing
- **md**: 1rem (16px) - Default spacing
- **lg**: 1.5rem (24px) - Section spacing
- **xl**: 2rem (32px) - Large gaps
- **2xl**: 3rem (48px) - Major sections

## Button Heights

Standard button sizes for touch-friendly interactions:

- **button-sm**: `h-8` (32px) - Compact buttons
- **button-md**: `h-10` (40px) - Default button size
- **button-lg**: `h-11` (44px) - Touch targets (mobile recommended)
- **button-xl**: `h-14` (56px) - Primary CTAs, hero buttons

**Mobile minimum**: 44px for touch accessibility (iOS/Android guidelines)

## Migration Guidelines

### Avoid Hardcoded Colors

❌ **Don't:**
```tsx
className="bg-red-500 text-gray-700"
className="hover:bg-emerald-500"
```

✅ **Do:**
```tsx
className="bg-destructive text-foreground"
className="hover:bg-zone-green"
```

### Use Semantic Tokens

❌ **Don't:**
```tsx
className="text-gray-400 bg-gray-100"
```

✅ **Do:**
```tsx
className="text-muted-foreground bg-secondary"
```

### Zone Colors for Food Features

❌ **Don't:**
```tsx
className="bg-green-500" // Generic green
```

✅ **Do:**
```tsx
className="bg-zone-green" // Semantic zone color
```

## Examples

### Button with Semantic Colors
```tsx
<button className="bg-zone-green hover:bg-zone-green/90 text-white">
  Add Food
</button>
```

### Card with Proper Tokens
```tsx
<Card className="bg-card border-border">
  <p className="text-primary">Main text</p>
  <p className="text-secondary">Secondary text</p>
</Card>
```

### Progress Bar
```tsx
<div className="h-3 w-full bg-secondary border border-border rounded-full">
  <div className="h-full bg-zone-green" style={{ width: '60%' }} />
</div>
```

## Design Token Reference

All tokens are defined in:
- **CSS Variables**: `app/globals.css`
- **Tailwind Config**: `tailwind.config.ts`
- **Zone Utilities**: `lib/utils/zone-colors.ts`

## Maintenance

When adding new components:
1. Use semantic tokens from this guide
2. Avoid hardcoded Tailwind color utilities (except zone colors)
3. Reference existing components for patterns
4. Update this document if new tokens are needed

