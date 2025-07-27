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

### Testing & Pre-Commit Workflow
- `pnpm test:pwa` - Build and serve for PWA testing (offline, installability)
- **No unit test framework configured** - manual testing via browser and DevTools

**Pre-Commit Sequence:**
```bash
pnpm format          # Auto-format code
pnpm lint           # ESLint checks
pnpm type-check     # TypeScript validation
pnpm build:check    # Production build + lint
```

**Browser Testing (when UI changes made):**
- Use Playwright MCP tools for UI validation
- Test critical workflows: auth, food/symptom tracking, camera
- Check console for errors, test offline mode
- Validate PWA features and responsive design

### Database
- `pnpm run db:reset` - Manual task: Clear IndexedDB via DevTools → Application → Storage → IndexedDB → Delete "HealthTrackerDB"

## Architecture Overview

### Core Stack
- **Next.js 15** with App Router and React Server Components
- **React 19** with modern concurrent features
- **TypeScript** with strict mode enabled
- **Tailwind CSS** with shadcn/ui components
- **IndexedDB** via Dexie for local-first data storage
- **PWA** with full offline support and installation capabilities

### Key Directories
- `/app` - Next.js App Router (auth pages, protected routes, API routes)
- `/features` - Domain-specific functionality (auth, camera, foods, symptoms)
- `/components` - UI components following shadcn/ui patterns
- `/lib` - Core utilities (db.ts, types.ts, utils.ts, ai/)

### Data & Auth
- **Local-first**: All user data in IndexedDB
- **JWT auth** with jose library, bcrypt hashing
- **Demo users**: dev@test.com (dev), demo/preview/test@puls.app (preview)
- **Middleware protection** for `/app/(protected)/` routes

### AI Integration
- **OpenRouter API** for ingredient analysis
- API routes handle processing
- Prompts in `/prompts/` as markdown
- Rate limiting via Upstash Redis

## Development Guidelines

### Git & Code Quality
- **Branches**: `feature/`, `fix/`, `refactor/` + description
- **Commits**: `type: brief description` (feat, fix, docs, style, refactor, test, chore)
- **Before pushing**: Always run `pnpm build:check`
- **PR requirements**: Lint pass, type check, manual testing

### Best Practices

**TypeScript & React:**
- Strict mode, no `any` types
- Functional components with Hooks
- Keep state close to usage
- Use react-hook-form + zod for forms

**Performance & Styling:**
- Code splitting with React.lazy()
- Next.js Image optimization
- Tailwind utilities only
- Mobile-first responsive design

**Database & PWA:**
- All CRUD through `lib/db.ts`
- Test by clearing IndexedDB
- Verify offline functionality
- Test iOS Safari compatibility

### Browser Testing with Playwright MCP

**When to Use:**
- After UI/UX changes
- Testing auth flows or protected routes
- PWA functionality validation
- Debugging browser-specific issues

**Quick Workflow:**
1. Navigate to `http://localhost:3000`
2. Take snapshots, check console
3. Test critical user paths
4. Validate offline mode and IndexedDB
5. Check accessibility (keyboard nav, ARIA)

### Error Prevention
- Always use `pnpm` not `npm`
- Use `@/` path aliases
- Verify `.env.local` for API issues
- Check IndexedDB state in DevTools

## Environment Modes
- **Development**: Auto-creates dev@test.com user
- **Preview**: Auto-creates demo accounts
- **Production**: Full security enabled

## Troubleshooting

**Common Issues:**
- **Build fails**: Run `pnpm type-check` first
- **PWA not installing**: Check manifest.json and service worker
- **Database issues**: Clear IndexedDB in DevTools
- **API errors**: Verify OpenRouter API key in `.env.local`

**Debug Commands:**
- `pnpm dev:clean` - Hard reset development
- `pnpm db:reset` - Clear all local data

When working with this codebase, prioritize maintaining the local-first architecture, PWA compatibility, and type safety throughout all changes.