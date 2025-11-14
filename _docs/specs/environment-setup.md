# Environment Variables Setup

This document explains how to set up environment variables for the Health Tracker PWA.

## Quick Setup

1. Create a `.env.local` file in the project root
2. Copy the template below and fill in your actual values
3. Never commit `.env.local` to version control

## Environment Variables Template

```bash
# ======================
# AI & API Configuration
# ======================

# OpenRouter API Key (for AI model access)
# Get your key from: https://openrouter.ai/keys
OPENROUTER_API_KEY=your_openrouter_api_key_here

# n8n Webhook Configuration
# Your n8n instance URL and webhook authentication
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/analyze
N8N_WEBHOOK_TOKEN=your_secure_webhook_token_here

# ======================
# Error Tracking
# ======================

# Using Vercel's built-in monitoring (no additional configuration required)

# ======================
# Rate Limiting (Upstash)
# ======================

# Upstash Redis for rate limiting
# Get these from: https://console.upstash.com/
# Note: These use KV_ prefix for consistency with Vercel KV naming
KV_REST_API_URL=your_upstash_redis_url_here
KV_REST_API_TOKEN=your_upstash_redis_token_here

# ======================
# Development Configuration
# ======================

# Next.js Environment
NODE_ENV=development

# Base URL for API calls (used in production builds)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# ======================
# Future: Cloud Sync (Optional)
# ======================

# Supabase Configuration (for future E2EE sync feature)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
# SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Security Best Practices

### Development

- Use `.env.local` for local development (automatically ignored by Git)
- Never commit API keys or sensitive data to version control
- Use different keys for development and production

### Production (Vercel)

- Set environment variables in Vercel dashboard
- Use Vercel's environment variable encryption
- Rotate API keys regularly

### API Key Management

- **OpenRouter**: Keep your API key secure, monitor usage
- **n8n**: Use strong webhook tokens, consider IP whitelisting
- **Upstash Redis**: Use separate Redis instances for dev/prod (configured via `KV_REST_API_URL` and `KV_REST_API_TOKEN`)

## Environment Variable Types

### Server-Side Only

These are only available in API routes and server components:

- `OPENROUTER_API_KEY`
- `N8N_WEBHOOK_TOKEN`
- `KV_REST_API_TOKEN`

### Client-Side (Public)

These are exposed to the browser (prefix with `NEXT_PUBLIC_`):

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Build-Time Only

No build-time environment variables are required (monitoring is handled by Vercel).

## Vercel Deployment

When deploying to Vercel, add these environment variables in the dashboard:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with appropriate values
4. Set the correct environment (Development/Preview/Production)

## Troubleshooting

### Common Issues

- **API calls failing**: Check if environment variables are set correctly
- **Build errors**: Ensure all required variables are defined
- **CORS issues**: Verify `NEXT_PUBLIC_API_BASE_URL` is correct

### Testing Environment Variables

```bash
# Check if variables are loaded (in API route)
console.log('OpenRouter Key:', process.env.OPENROUTER_API_KEY ? 'Set' : 'Missing');
console.log('n8n Webhook Token:', process.env.N8N_WEBHOOK_TOKEN ? 'Set' : 'Missing');
```
