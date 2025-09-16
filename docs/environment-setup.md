# Environment Setup Guide

## Feature Flags

### Signup Control

To temporarily disable new user signups, set the following environment variable:

```bash
NEXT_PUBLIC_SIGNUP_ENABLED=false
```

**Default behavior:** When this variable is not set or set to any value other than `'false'`, signups are enabled.

**When disabled:**

- Landing page shows "Coming Soon" button instead of signup
- Signup page shows a friendly disabled message
- Login page header shows "Coming Soon" instead of "Get Started"
- Login page signup link shows "Signup coming soon"

### How to Enable/Disable

1. **To disable signups:** Add `NEXT_PUBLIC_SIGNUP_ENABLED=false` to your `.env.local` file
2. **To re-enable signups:** Remove the variable or set it to `true`
3. **Restart your development server** after changing environment variables

### Production Deployment

For Vercel deployment, set the environment variable in your project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add `NEXT_PUBLIC_SIGNUP_ENABLED` with value `false`
4. Redeploy your application

This gives you instant control over signup availability without code changes.
