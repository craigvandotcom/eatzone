# Development Workflow

This document outlines the development workflow and available scripts for the Health Tracker PWA.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000 in your browser
```

## Available Scripts

### Development

- **`pnpm dev`**: Starts the development server with hot-reloading at `http://localhost:3000`.
- **`pnpm dev:clean`**: A "hard reset" script. Deletes build caches (`.next`), `node_modules`, and reinstalls all dependencies. Use this to resolve stubborn dependency or caching issues.
- **`pnpm type-check`**: Runs the TypeScript compiler (`tsc`) to check for type errors across the project without generating JavaScript files.

### Code Quality

- **`pnpm lint`**: Analyzes the codebase with ESLint to find and report potential errors and style violations.
- **`pnpm format`**: Formats all relevant files in the project with Prettier to ensure a consistent code style.
- **`pnpm format:check`**: Checks if all files are correctly formatted with Prettier without making any changes. Ideal for use in CI pipelines.

### Building & Testing

- **`pnpm build`**: Creates a production-ready, optimized build of the application.
- **`pnpm build:check`**: A pre-deployment quality check. It runs a full production build and lints the code to catch issues beforehand.
- **`pnpm test:pwa`**: Builds the application and serves it locally to allow for testing PWA features (like offline support and installability) in a production-like environment.
- **`pnpm start`**: Starts a local server to serve the production build created by `pnpm build`.

### Database Development

- **`pnpm db:reset`**: Clears all user data from Supabase (dev only). Resets the database to a clean state for testing.
- **`pnpm db:seed`**: Seeds test data into Supabase (dev only). Useful for populating sample foods and symptoms.
- **`pnpm db:status`**: Checks database connection and displays current status.

## Development Workflow

### 1. Starting Development

```bash
# Clone and setup
git clone <repository>
cd eatZone
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# Start development
pnpm dev
```

### 2. Code Quality Workflow

```bash
# Before committing
pnpm format          # Format code
pnpm lint           # Check for linting errors
pnpm type-check     # Verify TypeScript
pnpm build:check    # Ensure build works
```

### 3. Testing Workflow

```bash
# Test PWA functionality
pnpm test:pwa

# Test in different browsers
# - Chrome (primary)
# - Safari (iOS compatibility)
# - Firefox (additional testing)
```

## VS Code Setup

### Recommended Extensions

The project includes `.vscode/extensions.json` with recommended extensions:

- Prettier (code formatting)
- ESLint (linting)
- Tailwind CSS IntelliSense
- TypeScript support
- Error Lens (inline error display)

### Automatic Setup

VS Code will automatically:

- Format code on save
- Fix ESLint errors on save
- Provide TypeScript IntelliSense
- Highlight Tailwind CSS classes

## File Structure

```
eatZone/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── *.tsx             # Custom components
├── lib/                  # Utility functions
│   ├── db.ts            # Supabase database client and operations
│   ├── hooks/           # Custom React hooks
│   └── utils.ts         # Utility functions
├── public/              # Static assets
├── _docs/               # Documentation
├── .vscode/             # VS Code settings
└── package.json         # Dependencies and scripts
```

## Common Development Tasks

### Adding a New Component

```bash
# Create component file
touch components/my-component.tsx

# Add to shadcn/ui if it's a UI component
npx shadcn-ui@latest add <component-name>
```

### Adding Dependencies

```bash
# Add runtime dependency
pnpm add <package-name>

# Add development dependency
pnpm add -D <package-name>
```

### Database Development

```bash
# Reset database (clears all user data)
pnpm db:reset

# Seed test data
pnpm db:seed

# Check database status
pnpm db:status
```

### Environment Variables

```bash
# Add new environment variable
# 1. Update .env.example with the new variable
# 2. Add to .env.local with actual value
# 3. Use in code: process.env.VARIABLE_NAME
# 4. Update _docs/specs/environment-setup.md if needed
```

## Troubleshooting

### Common Issues

**Build Errors**

```bash
# Clean and rebuild
pnpm dev:clean
pnpm build:check
```

**Type Errors**

```bash
# Check TypeScript
pnpm type-check
```

**Formatting Issues**

```bash
# Auto-fix formatting
pnpm format
```

**PWA Issues**

```bash
# Test PWA functionality
pnpm test:pwa
# Check manifest.json and service worker
```

### Performance Tips

- Use `pnpm` instead of `npm` for faster installs
- Enable VS Code auto-save for immediate feedback
- Use TypeScript strict mode for better code quality
- Run `pnpm build:check` before committing

## Git Workflow

### Recommended Workflow

```bash
# Before starting work
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, commit frequently
git add .
git commit -m "feat: add new feature"

# Before pushing
pnpm build:check  # Ensure everything works

# Push and create PR
git push origin feature/your-feature-name
```

### Commit Message Format

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: code formatting
refactor: code restructure
test: add tests
chore: maintenance tasks
```
