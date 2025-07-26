# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Development Guidelines

### Code Quality Requirements
Always run these commands before committing:
```bash
pnpm format
pnpm lint
pnpm type-check
pnpm build:check
```

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

When working with this codebase, prioritize maintaining the local-first architecture, PWA compatibility, and type safety throughout all changes.