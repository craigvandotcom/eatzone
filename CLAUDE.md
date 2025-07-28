# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Context Files
See @package.json for available npm commands and dependencies
See @.env.example for required environment variables
See @app/globals.css for CSS variables and theming system

## Project Overview

This is "Puls", a privacy-first health tracking Progressive Web App (PWA) built with Next.js 15, React 19, and TypeScript. The app helps users track food intake and symptoms with AI-powered ingredient analysis while keeping all data local via IndexedDB.

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
- `pnpm test` - Run all unit tests
- `pnpm test:watch` - Run tests in watch mode during development
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:ci` - Run tests optimized for CI environment
- `pnpm test:pwa` - Build and serve for PWA testing (offline, installability)

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
- All CRUD through `lib/db.ts`
- Test by clearing IndexedDB
- Verify offline functionality
- Test iOS Safari compatibility

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

**Quick Workflow:**
1. Navigate to `http://localhost:3000`
2. Take snapshots, check console
3. Test critical user paths
4. Validate offline mode and IndexedDB
5. Check accessibility (keyboard nav, ARIA)

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
- Check IndexedDB state in DevTools

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
- **Development**: Auto-creates dev@test.com user, no rate limiting
- **Preview**: Auto-creates demo accounts
- **Production**: Full security enabled, Redis rate limiting active

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