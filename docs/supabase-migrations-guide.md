# Supabase Migrations Guide

## Overview

Supabase CLI provides a robust migration system for managing database schema changes. Here's how to set it up and use it effectively.

## Initial Setup

### 1. Install Supabase CLI

```bash
# macOS with Homebrew
brew install supabase/tap/supabase

# Or with npm/pnpm
pnpm add -D supabase
```

### 2. Initialize Supabase in Your Project

```bash
# Initialize Supabase (creates supabase/ directory)
supabase init

# Link to your remote project
supabase link --project-ref ecvbexxmqlghzosgoiww
```

### 3. Pull Existing Schema (First Time Only)

```bash
# Pull the current database schema from remote
supabase db pull

# This creates a migration file with your current schema
```

## Migration Workflow

### Creating New Migrations

```bash
# Create a new migration file
supabase migration new fix_user_profile_trigger

# This creates: supabase/migrations/[timestamp]_fix_user_profile_trigger.sql
```

### Running Migrations

```bash
# Push migrations to remote database
supabase db push

# Or reset database and reapply all migrations (CAREFUL - this drops all data!)
supabase db reset
```

### Migration Best Practices

1. **Always create migrations for schema changes**

   ```bash
   supabase migration new add_user_preferences_table
   ```

2. **Test migrations locally first** (requires Docker)

   ```bash
   # Start local Supabase
   supabase start

   # Apply migrations locally
   supabase db push --local

   # Test your changes

   # Stop local Supabase
   supabase stop
   ```

3. **Generate TypeScript types after migrations**
   ```bash
   pnpm run supabase:types
   ```

## Recommended Package.json Scripts

Add these to your package.json:

```json
{
  "scripts": {
    "supabase:link": "supabase link --project-ref ecvbexxmqlghzosgoiww",
    "supabase:migration:new": "supabase migration new",
    "supabase:migration:push": "supabase db push",
    "supabase:migration:list": "supabase migration list",
    "supabase:db:diff": "supabase db diff",
    "supabase:types": "supabase gen types typescript --project-id ecvbexxmqlghzosgoiww > lib/supabase/types.ts",
    "supabase:types:prod": "supabase gen types typescript --project-id YOUR_PROD_PROJECT_ID > lib/supabase/types.ts",
    "supabase:status": "supabase projects list",
    "supabase:local:start": "supabase start",
    "supabase:local:stop": "supabase stop"
  }
}
```

## Migration File Structure

Your project should have:

```
supabase/
├── migrations/
│   ├── 20240101000000_initial_schema.sql
│   ├── 20240102000000_fix_user_profile_trigger.sql
│   └── ...
├── .gitignore
└── config.toml
```

## Current Migration Status

Based on your project, you should:

1. **Move existing migrations** to proper structure:

   ```bash
   # Your current migrations are in supabase/migrations/
   # This is correct! Just ensure they're named with timestamps
   ```

2. **Rename migrations with timestamps**:

   ```bash
   # Rename to include timestamps
   mv supabase/migrations/001_initial_schema.sql \
      supabase/migrations/20240101000000_initial_schema.sql

   mv supabase/migrations/002_fix_user_profile_trigger.sql \
      supabase/migrations/20240102000000_fix_user_profile_trigger.sql
   ```

## Environment-Specific Migrations

For different environments:

```bash
# Development
supabase link --project-ref ecvbexxmqlghzosgoiww
supabase db push

# Production (requires different project ref)
supabase link --project-ref YOUR_PROD_PROJECT_ID
supabase db push --dry-run  # Always dry-run first!
supabase db push
```

## Troubleshooting

### "Not linked to a project"

```bash
supabase link --project-ref ecvbexxmqlghzosgoiww
```

### "Migration already applied"

Check migration history:

```bash
supabase migration list
```

### "Permission denied"

Ensure you're logged in:

```bash
supabase login
```

## Alternative: Direct SQL Approach (Current Method)

If you prefer to continue using the SQL Editor directly:

1. Keep migrations in `supabase/migrations/` with descriptive names
2. Run them manually in order through Supabase Dashboard
3. Track which migrations have been applied in a migrations table:

```sql
-- Create migrations tracking table (run once)
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- After running each migration, record it:
INSERT INTO public.schema_migrations (version)
VALUES ('002_fix_user_profile_trigger');
```

## Next Steps

1. Install Supabase CLI: `brew install supabase/tap/supabase`
2. Link your project: `supabase link --project-ref ecvbexxmqlghzosgoiww`
3. Generate types: `pnpm run supabase:types`
4. Use CLI for future migrations: `supabase migration new <name>`

This provides version control, rollback capabilities, and team collaboration for database changes.
