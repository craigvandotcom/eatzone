# Project Alignment Issues

This document lists areas where the project code does not fully adhere to the specifications. The specs themselves are correct and represent best practices - these are items to address in the codebase.

**Last Updated:** 2025-01-XX

## Mobile Touch Interactions

### Issue: Hover Classes Used in Components

**Spec Reference:** `design-system.md` - "Mobile Touch Interactions" section

**Problem:** Several components use `hover:` classes which don't work on touch devices. Visual state should be driven by React state, not CSS `:hover` pseudo-classes.

**Affected Files:**

- `features/symptoms/components/symptom-entry-form.tsx` (line 326)
- `features/foods/components/food-entry-form.tsx` (lines 1004, 1021)
- `features/dashboard/components/entries-view.tsx` (lines 180, 296, 367)
- `features/dashboard/components/signals-view.tsx` (line 71)
- `features/dashboard/components/food-view.tsx` (line 79)
- `features/dashboard/components/unified-timeline.tsx` (line 183)
- `features/symptoms/components/symptom-timeline.tsx` (line 142)
- `features/camera/components/image-processing-error-boundary.tsx` (line 139)

**Example Violations:**

```tsx
// ❌ WRONG - Hover classes don't work on mobile
className = 'hover:shadow-xl transition-shadow duration-200';
className = 'hover:bg-destructive hover:text-destructive-foreground';
className = 'hover:shadow-lg hover:scale-110';
```

**Required Fix:**
Replace with state-driven styling and `:active` pseudo-classes:

```tsx
// ✅ CORRECT - State-driven styling
className={cn(
  isActive ? 'shadow-xl' : 'shadow-md',
  'transition-shadow duration-200',
  'active:scale-95 active:bg-muted/20'
)}
```

**Priority:** High (affects mobile UX)

---

## Coding Standards

### Issue: IndexedDB/Dexie References in Specs

**Status:** ✅ Fixed - Updated `coding-standards.md` to reflect Supabase architecture

**Changes Made:**

- Replaced `useLiveQuery` references with SWR + Supabase patterns
- Updated state management section to reflect Supabase client-side data fetching
- Updated database queries section to reference Supabase query builder and RLS
- Updated security section to reflect Supabase Auth session management

**Note:** Specs now accurately reflect the current Supabase-based architecture.

---

## Testing Practices

### Issue: Test Credentials Configuration

**Spec Reference:** `testing-strategy.md` and `testing-practices.md`

**Status:** ✅ Fixed in specs - now correctly references `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`

**Note:** The code already uses the correct environment variables. The spec was updated to match.

---

## Environment Variables

### Issue: Environment Variable Naming Consistency

**Spec Reference:** `environment-setup.md` and `rate-limiting.md`

**Status:** ✅ Fixed in specs - `environment-setup.md` now uses `KV_REST_API_URL` and `KV_REST_API_TOKEN` to match the code

**Note:** The code uses `KV_REST_API_URL` and `KV_REST_API_TOKEN`. The spec was updated to match.

---

## Summary

### High Priority

1. **Mobile Touch Interactions** - Remove hover classes, implement state-driven styling

### Medium Priority

1. **Coding Standards** - Update IndexedDB references to Supabase patterns

### Low Priority

1. None currently identified

---

## Next Steps

1. **Immediate:** Fix hover classes in components (High Priority)
2. **Soon:** Update coding-standards.md to reflect Supabase architecture (Medium Priority)
3. **Ongoing:** Review new components for mobile touch interaction compliance
