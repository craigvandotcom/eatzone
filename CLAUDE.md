# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Files
See @package.json for available npm commands and dependencies
See @.env.example for required environment variables
See @app/globals.css for CSS variables and theming system

## Project Overview

This is "Puls", a privacy-first health tracking Progressive Web App (PWA) built with Next.js 15, React 19, and TypeScript. The app helps users track food intake and symptoms with AI-powered ingredient analysis while keeping all data local via IndexedDB.

## Essential Commands

### Development
- `pnpm dev` - Start development server at http://localhost:3000
- `pnpm dev:clean` - Hard reset: clears .next, node_modules, and reinstalls dependencies
- `pnpm type-check` - Run TypeScript compiler check without emitting files

### Code Quality & Build
- `pnpm lint` - Run ESLint checks
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check if code is formatted without making changes
- `pnpm build:check` - Full production build + lint check (run before commits)
- `pnpm build` - Production build
- `pnpm start` - Serve production build

### Testing
- `pnpm test:pwa` - Build and serve for PWA testing (offline, installability)
- **No unit test framework configured** - manual testing via browser and DevTools
- **PWA testing**: Use `pnpm test:pwa` then test offline mode, installation
- **Database testing**: Clear IndexedDB in DevTools between tests

### Database
- `pnpm run db:reset` - Manual task: Clear IndexedDB via DevTools → Application → Storage → IndexedDB → Delete "HealthTrackerDB"

## Architecture Overview

### Core Technologies
- **Next.js 15** with App Router and React Server Components
- **React 19** with modern concurrent features
- **TypeScript** with strict mode enabled
- **Tailwind CSS** with shadcn/ui components
- **IndexedDB** via Dexie for local-first data storage
- **PWA** with full offline support and installation capabilities

### Data Storage
- **Local-first architecture**: All user data stored in browser's IndexedDB
- **Authentication**: JWT tokens stored in cookies/localStorage with bcrypt hashing
- **Database layer**: `lib/db.ts` contains all CRUD operations and auth functions
- **Demo mode**: Auto-creates test users in development/preview environments

### Key Directories

#### `/app` - Next.js App Router
- `(auth)/` - Authentication pages (login, signup)
- `(protected)/` - Protected app pages requiring authentication
- `api/` - API routes for AI integration and backend services
- `globals.css` - Global styles and CSS variables
- `layout.tsx` - Root layout with auth and theme providers

#### `/features` - Domain-specific functionality
- `auth/` - Authentication components, hooks, and providers
- `camera/` - Camera capture functionality for food photos
- `foods/` - Food tracking UI components and forms
- `symptoms/` - Symptom tracking components

#### `/components`
- `ui/` - shadcn/ui components (accordion, button, dialog, etc.)
- `shared/` - Reusable components across features
- Component system follows shadcn/ui patterns with Radix UI primitives

#### `/lib` - Core utilities
- `db.ts` - Main database layer with Dexie operations
- `types.ts` - TypeScript interfaces for Food, Symptom, User, etc.
- `utils.ts` - Utility functions and helpers
- `ai/` - AI integration modules (OpenRouter API)

### Authentication System
- **Local JWT authentication** using jose library
- **Demo accounts** for preview deployments (demo@puls.app, preview@puls.app, test@puls.app)
- **Development quick login** with dev@test.com
- **Middleware protection** for routes in `/app/(protected)/`
- **PWA-aware authentication** with iOS-specific handling

### Styling System
- **Tailwind CSS** with custom configuration
- **CSS variables** for theming with light/dark mode support
- **Zone colors** (green/yellow/red) for food categorization
- **Mobile-first responsive design** with PWA viewport settings

### AI Integration
- **OpenRouter API** for ingredient analysis and food zone classification
- **Image analysis** via API routes for food photo processing
- **Prompts** stored in `/prompts/` directory as markdown files

## Development Workflow

### Git Conventions
- **Branch naming**: `feature/description`, `fix/issue-description`, `refactor/component-name`
- **Commit format**: `type: brief description` (feat, fix, docs, style, refactor, test, chore)
- **Before pushing**: Always run `pnpm build:check` (includes build + lint)
- **PR requirements**: Lint pass, type check, manual testing confirmation

### Code Quality Requirements
Always run these commands before committing:
```bash
pnpm format
pnpm lint
pnpm type-check
pnpm build:check
```

### Error Prevention
- **Always use `pnpm`** not `npm` for this project
- **Run `pnpm type-check`** before `pnpm build` to catch errors early
- **Use absolute paths** with `@/` aliases, avoid unnecessary `cd` commands
- **Check IndexedDB state** via DevTools before debugging database issues
- **Verify environment variables** in `.env.local` if API calls fail

### HTML & Accessibility Best Practices
- **Semantic HTML First**: Use appropriate semantic elements (`<header>`, `<nav>`, `<main>`, `<button>`, `<h1>-<h6>`) over generic `<div>`/`<span>`
- **Accessible Forms**: Always use `<label>` elements with `for` attributes linked to input `id`s
- **Alt Text**: Provide meaningful `alt` attributes for images; use `alt=""` for decorative images
- **ARIA Usage**: Use ARIA attributes surgically to enhance semantics, not replace proper HTML structure
- **Test Accessibility**: Use keyboard navigation, screen readers (VoiceOver), and tools like Lighthouse accessibility audits

### TypeScript Best Practices  
- **Strict Configuration**: Enable `strictNullChecks` and all strict compiler options
- **Avoid `any`**: Never use `any` type - use proper interfaces, unions, or utility types instead
- **Type Inference**: Leverage TypeScript's type inference; add explicit types only when needed for clarity
- **Component Typing**: Define clear interfaces for React component props and state
- **Utility Types**: Use built-in utility types (`Partial<T>`, `Pick<T>`, `Omit<T>`, `NonNullable<T>`)

### React Component Architecture
- **Functional Components**: Use functional components with Hooks as the default pattern
- **State Colocation**: Keep state as close as possible to where it's used to minimize re-renders
- **Derived State**: Compute values from existing state/props rather than storing redundant data
- **Custom Hooks**: Extract reusable logic into custom hooks for better code organization
- **Component Composition**: Prefer composition over inheritance; use compound components for complex UI

### Performance Optimization
- **Code Splitting**: Use `React.lazy()` and `Suspense` for route-based and component-based splitting
- **Memoization**: Apply `React.memo`, `useMemo`, `useCallback` judiciously after profiling performance issues
- **Image Optimization**: Use Next.js Image component with proper sizing and lazy loading
- **Bundle Analysis**: Monitor bundle size and eliminate unused dependencies

### Styling Guidelines
- **Tailwind Consistency**: Use Tailwind utility classes consistently; avoid mixing with custom CSS
- **Component-Scoped Styles**: Keep styles close to components; use CSS modules for component-specific styles
- **Mobile-First**: Design and develop with mobile-first responsive approach
- **Design System**: Follow shadcn/ui patterns and maintain consistent spacing/typography scales

### Component Patterns
- Use existing shadcn/ui components when possible
- Follow feature-based organization in `/features/` directories
- Maintain TypeScript strict mode compliance
- Use proper form handling with react-hook-form and zod validation

### Database Operations
- All CRUD operations go through `lib/db.ts`
- Use generated IDs and ISO timestamps for data consistency
- Leverage IndexedDB transactions for data integrity
- Test database operations by clearing IndexedDB in DevTools

### PWA Considerations
- Test offline functionality with `pnpm test:pwa`
- Verify iOS Safari compatibility for PWA features
- Check manifest.json and service worker functionality
- Test installability across different devices

### AI Integration
- API routes handle AI processing to keep client-side code clean
- Prompts are versioned and stored as markdown files
- Rate limiting implemented via Upstash Redis for API protection

## File Path Aliases
- `@/` maps to project root
- `@/components` for UI components
- `@/lib` for utilities and core functions
- `@/features` for domain-specific code

## Environment Modes
- **Development**: Auto-creates dev@test.com user, enables debug logging
- **Preview**: Auto-creates demo accounts for testing deployments
- **Production**: Full security and optimization enabled

## Security Notes
- JWT secrets are for local storage only (not production-grade)
- All user data remains local via IndexedDB
- API keys should be stored in environment variables
- No sensitive data logging in production builds

## PWA-Specific Features
- Offline support with service worker
- App installation capability
- iOS Safari compatibility with specific viewport and theme settings
- Camera integration for food photo capture
- Background sync capabilities (future feature)

## Troubleshooting

### Common Issues
- **Build fails**: Run `pnpm type-check` first, then check for missing dependencies
- **PWA not installing**: Verify manifest.json and service worker registration
- **Database not persisting**: Check IndexedDB permissions and clear browser data
- **AI API errors**: Verify OpenRouter API key in `.env.local`
- **iOS Safari issues**: Test with iOS viewport settings and PWA-specific CSS

### Debug Commands
- `pnpm dev:clean` - Hard reset when development server acts unexpectedly
- `pnpm db:reset` - Clear all local data when database state is corrupted
- Check console for hydration errors on page refresh

When working with this codebase, prioritize maintaining the local-first architecture, PWA compatibility, and type safety throughout all changes.