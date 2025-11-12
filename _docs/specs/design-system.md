# Design System Documentation

## Overview

This document provides comprehensive guidelines for using the eatZone design system. It ensures consistency, maintainability, and adherence to brand standards across the application.

## Quick Reference

**Before starting any UI work, review:**

1. [Design Tokens](./ design-tokens.md) - Color, typography, spacing standards
2. This document - Usage patterns and best practices

## Color Usage Guidelines

### When to Use Semantic Tokens

Semantic tokens adapt to theme changes and ensure consistency.

**Use semantic tokens for:**

- General UI elements (buttons, cards, text)
- Backgrounds and borders
- Interactive states
- Form elements

```tsx
// ✅ Good - Semantic tokens
<button className="bg-card text-foreground hover:bg-card/80">
  Click me
</button>

<div className="bg-secondary border-border">
  <p className="text-primary">Main content</p>
  <p className="text-secondary">Helper text</p>
</div>
```

### When to Use Zone Colors

Zone colors are domain-specific for food classification.

**Use zone colors for:**

- Food-related features (composition bars, badges)
- Zone indicators and charts
- Food entry buttons

**Zone Color Semantic Meaning:**

- **Green Zone** (#01a878): Whole, nutritious foods - eat freely
- **Yellow Zone** (#fad046): Processed or individual-dependent foods - moderate
- **Red Zone** (#f84f36): Ultra-processed or inflammatory foods - avoid

```tsx
// ✅ Good - Zone colors for food features
<button className="bg-zone-green text-white">
  Add Food
</button>

<div className={`${getZoneBgClass('green', 'light')} ${getZoneTextClass('green')}`}>
  Green Zone: 15 ingredients
</div>

// Progress bar with zone colors
<div className="bg-secondary border-border h-3 rounded-full overflow-hidden">
  <div className="bg-zone-green h-full" style={{ width: '60%' }} />
</div>
```

### When to Use System Colors

System colors communicate state and actions.

**Destructive actions:**

```tsx
<button className="bg-destructive text-white">
  Delete Entry
</button>

<div className="border-destructive text-destructive">
  ⚠️ Warning message
</div>
```

**Brand colors (sparingly):**

```tsx
// Active navigation states
<button className="text-brand-primary">Active Tab</button>
```

## Common Patterns

### Buttons

```tsx
// Primary action (zone green for food-related)
<button className="bg-zone-green hover:bg-zone-green/90 text-white h-11 px-4 rounded-md">
  Add Food
</button>

// Secondary action
<button className="bg-secondary hover:bg-secondary/80 text-foreground h-11 px-4 rounded-md">
  Cancel
</button>

// Destructive action
<button className="bg-destructive hover:bg-destructive/90 text-white h-11 px-4 rounded-md">
  Delete
</button>

// Ghost button
<button className="hover:bg-accent text-foreground h-11 px-4 rounded-md">
  Learn More
</button>
```

### Cards

```tsx
// Standard card
<div className="bg-card border-border border rounded-lg p-6">
  <h3 className="text-foreground font-semibold mb-2">Card Title</h3>
  <p className="text-muted-foreground text-sm">Card content</p>
</div>

// Interactive card
<div className="bg-card hover:bg-card/80 border-border border rounded-lg p-6 cursor-pointer transition-colors">
  <h3 className="text-foreground font-semibold">Clickable Card</h3>
</div>
```

### Forms

```tsx
// Input field
<div className="space-y-2">
  <label className="text-sm font-medium text-foreground">
    Food Name
  </label>
  <input
    type="text"
    className="w-full h-10 px-3 bg-input border-border border rounded-md text-foreground"
    placeholder="Enter food name..."
  />
  <p className="text-xs text-muted-foreground">
    Helper text goes here
  </p>
</div>

// Select dropdown
<select className="w-full h-10 px-3 bg-input border-border border rounded-md text-foreground">
  <option>Select zone...</option>
  <option>Green Zone</option>
  <option>Yellow Zone</option>
  <option>Red Zone</option>
</select>
```

### Progress Indicators

```tsx
// Food composition bar
<div className="h-3 w-full bg-secondary border-border border rounded-full overflow-hidden">
  <div className="flex h-full">
    <div className="bg-zone-green" style={{ width: '40%' }} />
    <div className="bg-zone-yellow" style={{ width: '30%' }} />
    <div className="bg-zone-red" style={{ width: '30%' }} />
  </div>
</div>

// Loading state
<div className="h-3 w-full bg-secondary border-border border rounded-full overflow-hidden">
  <div className="h-full bg-tertiary w-full animate-pulse" />
</div>
```

### Empty States

```tsx
<div className="flex flex-col items-center justify-center p-8 text-center">
  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
    <Icon className="h-6 w-6 text-muted-foreground" />
  </div>
  <h3 className="text-foreground font-semibold mb-2">No entries yet</h3>
  <p className="text-muted-foreground text-sm max-w-sm">
    Start tracking your food to see your zone breakdown
  </p>
</div>
```

### Error States

```tsx
<div className="bg-destructive/10 border-destructive border rounded-lg p-4">
  <div className="flex items-start gap-3">
    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
    <div>
      <h4 className="text-destructive font-semibold mb-1">Error</h4>
      <p className="text-destructive/80 text-sm">
        Something went wrong. Please try again.
      </p>
    </div>
  </div>
</div>
```

## Anti-Patterns (Avoid These)

### ❌ Hardcoded Color Utilities

```tsx
// ❌ Don't use hardcoded Tailwind colors
<button className="bg-red-500 text-gray-700">Delete</button>
<div className="bg-emerald-500">Food item</div>
<p className="text-gray-400">Helper text</p>

// ✅ Do use semantic or zone colors
<button className="bg-destructive text-foreground">Delete</button>
<div className="bg-zone-green">Food item</div>
<p className="text-muted-foreground">Helper text</p>
```

### ❌ Inconsistent Spacing

```tsx
// ❌ Don't use arbitrary values
<div className="mb-[13px] pt-[27px]">Content</div>

// ✅ Do use spacing scale
<div className="mb-3 pt-6">Content</div>
```

### ❌ Mixed Color Systems

```tsx
// ❌ Don't mix hardcoded and semantic colors
<div className="bg-card border-gray-400">
  <p className="text-gray-600">Mixed approach</p>
</div>

// ✅ Do use consistent semantic tokens
<div className="bg-card border-border">
  <p className="text-muted-foreground">Consistent approach</p>
</div>
```

### ❌ Ignoring Touch Targets

```tsx
// ❌ Don't make buttons too small
<button className="h-8 w-8">Delete</button>

// ✅ Do use minimum 44px for mobile
<button className="h-11 w-11 min-h-[44px] min-w-[44px]">Delete</button>
```

## Mobile Touch Interactions

### State-Driven Styling (Not Hover-Based)

**Critical Rule:** On mobile, visual state must be driven by React state, not CSS `:hover` pseudo-classes. Hover states are disabled on touch devices and will not provide feedback.

```tsx
// ❌ WRONG - Hover classes don't work on mobile
<button
  className={`text-muted-foreground hover:${getZoneTextClass('green')}`}
  onClick={() => setOrganic(true)}
>
  <Leaf />
</button>

// ✅ CORRECT - State-driven styling
<button
  className={cn(
    'text-muted-foreground transition-all',
    isOrganic ? getZoneTextClass('green') : 'text-muted-foreground',
    'active:scale-110 active:opacity-80' // Touch feedback
  )}
  onClick={() => setIsOrganic(!isOrganic)}
>
  <Leaf />
</button>
```

### Active States for Touch Feedback

Use `:active` pseudo-classes to provide immediate tactile feedback on touch devices:

```tsx
// ✅ Good - Immediate feedback on tap
<button className="
  text-muted-foreground
  transition-all
  active:scale-95
  active:bg-muted/20
  active:text-foreground
">
  Tap me
</button>

// ✅ Toggle buttons - State determines appearance
<button className={cn(
  'transition-all',
  isActive ? 'text-brand-primary scale-105' : 'text-muted-foreground scale-100',
  'active:scale-95 active:bg-muted/20' // Press feedback
)}>
  Tab
</button>
```

### Common Touch Feedback Patterns

**Icon Buttons:**

```tsx
<button
  className="
  p-1 
  text-muted-foreground 
  transition-all 
  active:scale-110 
  active:opacity-80
"
>
  <Edit2 className="h-3 w-3" />
</button>
```

**Navigation Tabs:**

```tsx
<button
  className={cn(
    'transition-all duration-150',
    currentView === 'insights'
      ? 'text-brand-primary scale-105'
      : 'text-muted-foreground scale-100',
    'active:scale-95 active:bg-muted/20'
  )}
>
  <BarChart3 />
</button>
```

**List Items:**

```tsx
<div
  className="
    p-3 
    bg-muted 
    rounded-lg 
    transition-colors 
    cursor-pointer 
    active:bg-muted/50 
    active:scale-[0.99]
  "
  onClick={handleClick}
>
  Content
</div>
```

### Scale Values for Active States

- **Small buttons (icons):** `active:scale-110` or `active:scale-95`
- **Medium buttons:** `active:scale-105` or `active:scale-95`
- **Large buttons/tabs:** `active:scale-[0.98]` or `active:scale-95`
- **List items:** `active:scale-[0.99]` or `active:scale-[0.98]`

### Transition Timing

Always include `transition-all` or specific transition properties for smooth state changes:

```tsx
// ✅ Smooth transitions
className = 'transition-all duration-150';

// ✅ Specific transitions
className = 'transition-colors transition-transform';
```

### Never Use Hover Classes for Mobile

```tsx
// ❌ WRONG - These don't work on touch devices
className="hover:text-foreground hover:bg-accent"

// ✅ CORRECT - Use active states + state-driven styling
className={cn(
  isActive ? 'text-foreground bg-accent' : 'text-muted-foreground',
  'active:scale-95'
)}
```

## Responsive Design

### Mobile-First Approach

```tsx
// Start with mobile, enhance for desktop
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">Responsive Title</h1>
</div>
```

### Safe Areas (iOS)

```tsx
// Account for notches and home indicators
<div className="pb-safe-area">
  <nav className="pb-20">Bottom Navigation</nav>
</div>
```

## Accessibility

### Color Contrast

- All text must meet WCAG AA standards (4.5:1 for normal text)
- Zone colors are tested for contrast
- Use semantic tokens which handle contrast automatically

### Focus States

```tsx
// Always include focus states
<button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
  Accessible Button
</button>
```

### Screen Readers

```tsx
// Provide meaningful labels
<button aria-label="Add new food entry" title="Add Food">
  <Plus className="h-6 w-6" />
</button>

// Progress bars need descriptions
<div
  className="h-3 w-full bg-secondary"
  role="progressbar"
  aria-valuenow={60}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Green zone percentage"
>
  <div className="bg-zone-green h-full" style={{ width: '60%' }} />
</div>
```

## Testing Your Changes

### Visual Checklist

Before submitting changes, verify:

- [ ] Colors use semantic tokens or zone colors (no `bg-red-500`, `text-gray-400`)
- [ ] Touch targets are minimum 44px on mobile
- [ ] Focus states are visible
- [ ] Text contrast meets accessibility standards
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Loading and error states are handled
- [ ] Empty states provide guidance

### Browser Testing

Test in:

- Safari (iOS) - PWA primary target
- Chrome (desktop)
- Firefox (desktop)

### Dark Mode

- All semantic tokens support dark mode by default
- Verify contrast in dark mode
- Test zone colors remain distinguishable

## Migration Guide

### For Existing Components

1. **Identify hardcoded colors:**

   ```bash
   grep -r "bg-red-5\|text-gray-\|bg-emerald" features/
   ```

2. **Replace with semantic tokens:**
   - `text-gray-400` → `text-muted-foreground`
   - `bg-gray-100` → `bg-secondary`
   - `text-gray-900` → `text-foreground`
   - `bg-red-500` → `bg-destructive`
   - `bg-emerald-500` → `bg-zone-green`

3. **Update tests to match new classes**

4. **Verify build and tests pass:**
   ```bash
   pnpm type-check && pnpm lint && pnpm test && pnpm build
   ```

### For New Components

1. **Start with shadcn/ui base** (if applicable)
2. **Use semantic tokens from day one**
3. **Reference existing components** for patterns
4. **Write tests with semantic classes**

## Resources

- **Design Tokens**: `_docs/specs/design-tokens.md`
- **CSS Variables**: `app/globals.css`
- **Tailwind Config**: `tailwind.config.ts`
- **Zone Utilities**: `lib/utils/zone-colors.ts`
- **Brand Identity**: `_docs/specs/brand-identity.md`

## Support

Questions about the design system? Check:

1. This document for usage patterns
2. Existing components for examples
3. Design tokens doc for available tokens
4. Codebase search for similar implementations

## Maintenance

### Adding New Tokens

1. Define CSS variable in `app/globals.css`
2. Extend Tailwind config in `tailwind.config.ts`
3. Document in `design-tokens.md`
4. Update this guide with usage examples

### Deprecating Tokens

1. Mark as deprecated in documentation
2. Create migration path
3. Update all usages
4. Remove from configs after migration

---

**Last Updated**: November 2025
**Version**: 1.0.0
