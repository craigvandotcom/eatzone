# Supabase Setup Guide

## Quick Start

1. **Create Projects**
   - Development: `puls-dev`
   - Production: `puls-prod`

2. **Get Your Keys**
   - Go to Settings → API in each project
   - Copy URL, anon key, and service role key

3. **Configure Environment**
   ```bash
   # Copy the appropriate env file
   cp .env.development .env.local  # for development
   # or
   cp .env.production .env.local   # for production
   
   # Fill in your actual keys
   ```

4. **Run Migrations**
   - Open SQL Editor in Supabase
   - Run `supabase/migrations/001_initial_schema.sql`

5. **Configure Auth**
   - Enable Email provider
   - Set redirect URLs
   - Disable email confirmation for dev (optional)

## Development Workflow

### Local Development
```bash
# Use development environment
cp .env.development .env.local
pnpm dev
```

### Testing with Production Schema
```bash
# Use production environment locally (be careful!)
cp .env.production .env.local
pnpm dev
```

### Creating Test Users

1. Go to Authentication → Users in Supabase
2. Click "Invite user"
3. Create users:
   - `dev@test.com` (password: test123)
   - `demo@puls.app` (password: demo123)

### Database Access

- **Supabase Studio**: Built-in database viewer
- **Direct Connection**: Use connection string from Settings → Database

## Deployment to Vercel

1. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Use production values for production deployment

## Security Checklist

- [ ] Never commit `.env.local`
- [ ] Keep service role key secret
- [ ] Enable RLS on all tables
- [ ] Test RLS policies thoroughly
- [ ] Use different passwords for dev/prod databases
- [ ] Regularly backup production data

## Troubleshooting

### "Permission denied" errors
- Check RLS policies
- Ensure user is authenticated
- Verify auth.uid() matches user_id

### "Table not found" errors
- Run migrations in SQL editor
- Check you're connected to right project

### Auth issues
- Verify redirect URLs in Supabase Auth settings
- Check CORS settings if needed
- Ensure cookies are enabled