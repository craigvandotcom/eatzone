# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Files
See @package.json for available npm commands and dependencies
See @.env.example for required environment variables
See @app/globals.css for CSS variables and theming system

## Project Overview

This is "Puls", a privacy-first health tracking Progressive Web App (PWA) built with Next.js 15, React 19, and TypeScript. The app helps users track food intake and symptoms with AI-powered ingredient analysis using Supabase for secure cloud storage and authentication.

**Development Context:**
- Solo developer project (no team coordination needed)
- Local development on macOS with VS Code
- Deployment via Vercel (git push → auto-deploy)

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

**Testing Philosophy:**
- Test user behavior and contracts, not implementation details
- Follow testing trophy: focus on integration/component tests with unit test foundation
- Test Supabase integration and real-time sync features
- Reference @_docs/guidelines/testing-best-practices.md for comprehensive patterns

**Commands:**
- `pnpm test` - Run all unit tests
- `pnpm test:watch` - Run tests in watch mode during development
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:ci` - Run tests optimized for CI environment
- `pnpm test:pwa` - Build and serve for PWA testing (offline, installability)

**Testing Stack:**
- **Jest** + **@testing-library/react** + **user-event** for component testing
- **MSW** for API mocking (recommended over global mocks for new tests)
- **Playwright MCP** for E2E and browser testing
- **jest-axe** for accessibility validation
- Global Supabase mocks in `__tests__/setup/jest.setup.ts`

**Pre-flight Checks for Playwright Testing:**
1. Ensure `.env.local` exists with valid Supabase credentials
2. Run `pnpm build:check` to verify no build errors
3. Kill any existing dev servers: `kill $(lsof -ti:3000) $(lsof -ti:3001) 2>/dev/null || true`
4. Clear Next.js cache if needed: `rm -rf .next`
5. For most stable results, use production build (`pnpm build && pnpm start`)

**Testing Layers:**
1. **Unit tests** - Utils, hooks logic, data transformations
2. **Component tests** - User interactions, UI state, form validation
3. **Integration tests** - Feature slices with real routing/data flow
4. **E2E tests** - Critical user journeys via Playwright MCP

**Pre-Commit Sequence:**
```bash
pnpm format          # Auto-format code
pnpm lint           # ESLint checks
pnpm type-check     # TypeScript validation
pnpm test           # Run unit tests
pnpm build:check    # Production build + lint
```

**Browser Testing (when UI changes made):**
- Use Playwright MCP tools for UI validation
- Test critical workflows: auth, food/symptom tracking, camera
- Check console for errors, validate real-time sync
- Validate PWA features and responsive design
- Run accessibility checks with axe-core

### Database
- `pnpm run db:reset` - Clear all user data from current Supabase session
- `pnpm run db:seed` - Seed database with test data (development only)
- `pnpm run db:status` - Check database connection and status

### Supabase CLI (Read-Only)
- `pnpm run supabase:types` - Generate TypeScript types from development database
- `pnpm run supabase:types:prod` - Generate TypeScript types from production database (requires prod project ID)
- `pnpm run supabase:status` - List Supabase projects (requires authentication)

**Note**: Supabase CLI is configured for read-only operations. We use remote projects only (no local instances).

## Architecture Overview

### Core Stack
- **Next.js 15** with App Router and React Server Components
- **React 19** with modern concurrent features
- **TypeScript** with strict mode enabled
- **Tailwind CSS** with shadcn/ui components
- **Supabase** for secure cloud data storage with real-time sync
- **PWA** with installation capabilities and real-time cloud sync

### Key Directories
- `/app` - Next.js App Router (auth pages, protected routes, API routes)
- `/features` - Domain-specific functionality (auth, camera, foods, symptoms)
- `/components` - UI components following shadcn/ui patterns
- `/lib` - Core utilities (db.ts, types.ts, utils.ts, ai/)

### Data & Auth
- **Cloud-based**: Secure data storage with Supabase
- **Supabase Auth**: Built-in authentication with session management
- **Authentication**: Standard Supabase Auth with email/password
- **Middleware protection** for `/app/(protected)/` routes with Supabase session validation

### AI Integration
- **OpenRouter API** for ingredient analysis
- API routes handle processing
- Prompts in `/prompts/` as markdown
- Rate limiting via Upstash Redis

## Development Guidelines

### Git & Code Quality
- **Branches**: `feature/`, `fix/`, `refactor/` + description (solo development)
- **Commits**: `type: brief description` (feat, fix, docs, style, refactor, test, chore)
- **Before pushing**: Always run `pnpm build:check`
- **Deployment**: Direct push to main triggers Vercel auto-deployment

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
- All CRUD through `lib/db.ts` using Supabase client
- Test with `pnpm db:reset` to clear user data
- Verify real-time sync and cloud data persistence
- Test iOS Safari compatibility and PWA installation

**Testing Patterns:**
- **Supabase Integration**: Use existing global mocks for consistent behavior; consider MSW for new API-heavy features
- **Cloud-based Architecture**: Test data persistence, real-time sync, and authentication flows
- **PWA Testing**: Verify installation process, service worker updates, and app-like experience
- **Accessibility**: Query by role/label (Testing Library default), validate with jest-axe
- **Component Isolation**: Test behavior, not implementation; avoid testing library internals

### MCP Server Integration

**Available MCP Servers:**
- **Playwright MCP** - Browser automation and testing
- **Context7 MCP** - Enhanced context understanding and knowledge retrieval

**Browser Testing with Playwright MCP:**

**When to Use:**
- After UI/UX changes
- Testing auth flows or protected routes
- PWA functionality validation
- Debugging browser-specific issues

**IMPORTANT - Troubleshooting Webpack/Build Issues:**
If you encounter webpack errors (e.g., "Cannot read properties of undefined (reading 'call')") when using Playwright:
1. **Use production build instead of dev server** - The production build is more stable
2. Kill any existing processes on ports 3000/3001
3. Run `pnpm build` first, then `pnpm start`
4. Production server runs on port 3000 by default

**Starting Server for Playwright Testing (Recommended Approach):**
```bash
# OPTION 1: Production Build (More Stable - RECOMMENDED)
# Kill any existing processes
kill $(lsof -ti:3000) 2>/dev/null || true

# Build and start production server
pnpm build
nohup pnpm start > /tmp/puls-prod.log 2>&1 & echo $!
sleep 3  # Wait for server to start
tail -20 /tmp/puls-prod.log

# OPTION 2: Development Server (If needed for hot reload)
# Only use if production build works but you need dev features
kill $(lsof -ti:3001) 2>/dev/null || true
nohup pnpm dev > /tmp/puls-dev.log 2>&1 & echo $!
sleep 5  # Dev server takes longer
tail -20 /tmp/puls-dev.log
```

**Port Handling:**
- Production build: Always uses port 3000
- Dev server: Uses 3000, or 3001 if 3000 is busy
- Check logs to confirm which port is being used
- Navigate to the correct URL based on server output

**Quick Workflow:**
1. Kill any existing processes: `kill $(lsof -ti:3000) 2>/dev/null || true`
2. Build and start production server (see above)
3. Navigate to `http://localhost:3000` with Playwright
4. If you see an offline screen, click "Try Again" or check network
5. Take snapshots, check console for errors
6. Test critical user paths (auth, tracking, dashboard)
7. Validate real-time data sync with Supabase
8. Check accessibility (keyboard nav, ARIA)
9. When done, kill the server: `kill <PID>` or `lsof -ti:3000 | xargs kill -9`

**Common Playwright Issues & Solutions:**
- **Blank page with console errors**: Use production build instead of dev server
- **"Port in use" errors**: Kill existing processes before starting
- **Offline state persisting**: Clear browser state or use incognito mode
- **CSS/JS 404 errors**: Wait longer for compilation or use production build
- **Manifest errors**: Normal in development, can be ignored

**Context7 MCP Usage:**
- Fetches up-to-date, version-specific documentation and code examples directly from source
- Available via HTTP transport at `https://mcp.context7.com/mcp`
- **How to use:** Write prompts naturally, then tell Claude to `use Context7` for current documentation
- **Benefits:** Get working code answers with the latest API changes and best practices
- **Use cases:** When you need current framework docs, library examples, or API references

### Error Prevention
- Always use `pnpm` not `npm`
- Use `@/` path aliases
- Verify `.env.local` for API issues
- Check Supabase connection in browser network tab

## Environment Configuration

### Environment Files
- **`.env.local`** - Local development environment (gitignored)
  - Uses development Supabase project
  - No Redis rate limiting (empty Redis vars)
  - OpenRouter API key for AI features
- **`.env.prod`** - Production secrets (gitignored)
  - Uses production Supabase project
  - Upstash Redis enabled for API rate limiting
  - Used for Vercel production deployment
- **`.env.example`** - Template showing required variables (committed)
  - Reference for setting up local environment
  - Documents all required environment variables
  - Note: Using Supabase's new API key naming (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` instead of `ANON_KEY`)

### Environment Modes
- **Development**: No rate limiting, local Supabase project
- **Production**: Full security enabled, Redis rate limiting active

## Troubleshooting

**Common Issues:**
- **Build fails**: Run `pnpm type-check` first
- **PWA not installing**: Check manifest.json and service worker
- **Database issues**: Run `pnpm db:reset` or check Supabase dashboard
- **API errors**: Verify OpenRouter API key in `.env.local`

**Debug Commands:**
- `pnpm dev:clean` - Hard reset development
- `pnpm db:reset` - Clear all local data

When working with this codebase, prioritize maintaining secure cloud storage with Supabase, PWA compatibility, and type safety throughout all changes.