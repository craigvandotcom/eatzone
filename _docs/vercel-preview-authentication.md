# Vercel Preview Authentication System

## 📋 Overview

The Puls Health Tracker includes an intelligent authentication system that automatically detects different deployment environments and provides appropriate demo access for testing and previewing.

## 🎯 Purpose

**Problem Solved**: When deploying branches to Vercel preview environments, you don't want to create new accounts every time. This system provides instant access to preview deployments while maintaining security in production.

## 🌍 Environment Detection

The system automatically detects three environments:

### 1. **Development Mode** 🔧

- **Triggers when**: `NODE_ENV === "development"`
- **URL**: `http://localhost:3000`
- **Auto-login**: Uses `dev@test.com` / `password`
- **UI**: Orange theme with dev-specific messaging

### 2. **Preview Mode** 🌐

- **Triggers when**:
  - Domain contains `.vercel.app`
  - Domain contains `netlify.app` or `netlify.live`
  - Domain contains `github.dev` or `githubpreview.dev`
  - URL parameter `?preview=true` or `?demo=true`
- **URL Examples**:
  - `https://puls-git-feature-abc123-your.vercel.app`
  - `https://your-app.netlify.app`
  - `https://your-site.com?preview=true`
- **Auto-login**: Uses demo accounts (see below)
- **UI**: Blue theme with multiple account options

### 3. **Production Mode** 🚀

- **Triggers when**: None of the above conditions are met
- **URL**: Your production domain
- **Authentication**: Standard login required
- **UI**: No demo mode cards shown

## 🏠 Demo Accounts

Three demo accounts are available for preview deployments:

| Account          | Email              | Password     | Description                |
| ---------------- | ------------------ | ------------ | -------------------------- |
| **Demo User**    | `demo@puls.app`    | `demo123`    | General demo account       |
| **Preview User** | `preview@puls.app` | `preview123` | Preview deployment testing |
| **Test User**    | `test@puls.app`    | `test123`    | Testing and QA             |

## 🚀 How to Use

### For Development

1. **Start dev server**: `npm run dev`
2. **Visit**: `http://localhost:3000`
3. **Result**: Auto-login with `dev@test.com`
4. **Manual login**: Orange "Quick Dev Login" button available

### For Vercel Preview Deployments

1. **Create branch**: `git checkout -b feature/my-feature`
2. **Push branch**: `git push origin feature/my-feature`
3. **Vercel auto-deploys**: Creates URL like `puls-git-feature-my-feature-abc123.vercel.app`
4. **Visit preview URL**: Shows blue "Preview Mode" card
5. **Quick access options**:
   - Click individual account buttons for specific accounts
   - Click "Quick Demo Login" for default account
   - Or use regular login form with demo credentials

### Manual Preview Mode

Add `?preview=true` to any URL to force preview mode:

```
https://your-production-site.com?preview=true
```

## 🔧 Technical Implementation

### Environment Detection Functions

```typescript
// Check if running in development
isDevelopment(): boolean

// Check if running in preview deployment
isPreviewDeployment(): boolean

// Check if demo mode should be active (dev OR preview)
isDemoMode(): boolean

// Get current environment type
getEnvironmentType(): 'development' | 'preview' | 'production'
```

### Authentication Flow

```typescript
// Auto-login in demo mode
quickDemoLogin(accountIndex?: number): Promise<{user, token} | null>

// Create specific demo account
createDemoUser(accountIndex: number): Promise<{user, token}>

// Get demo account info
getDemoAccounts(): DemoAccount[]
```

## 🔐 Security Considerations

### ✅ Safe Practices

- **Local-first storage**: All authentication is IndexedDB-based
- **No server secrets**: Demo accounts are created locally
- **Environment isolation**: Production never shows demo mode
- **Automatic detection**: No configuration needed

### ⚠️ Important Notes

- Demo accounts are **created locally** on each device/browser
- Data doesn't sync between preview deployments
- Each browser session is independent
- Demo accounts reset when browser storage is cleared

## 🎨 UI Experience

### Development Mode (Orange Theme)

- Simple interface with dev@test.com credentials shown
- "Quick Dev Login" button
- "Reset" button to clear dev user
- Orange color scheme

### Preview Mode (Blue Theme)

- Three individual account buttons with email addresses
- "Quick Demo Login" button for default account
- Blue color scheme
- Account count indicator
- Environment type badge

### Production Mode

- No demo mode cards shown
- Standard login/signup flow only
- Clean, professional interface

## 🛠️ Customization

### Adding New Demo Accounts

Edit `lib/db.ts`:

```typescript
const DEMO_ACCOUNTS = [
  {
    email: "demo@puls.app",
    password: "demo123",
    name: "Demo User",
    description: "General demo account",
  },
  // Add more accounts here
  {
    email: "new@puls.app",
    password: "new123",
    name: "New User",
    description: "New account description",
  },
];
```

### Adding New Deployment Platforms

Edit `isPreviewDeployment()` in `lib/db.ts`:

```typescript
export const isPreviewDeployment = (): boolean => {
  // Add your platform's hostname pattern
  return (
    hostname.includes('.vercel.app') ||
    hostname.includes('your-platform.com') || // Add this
    // ... other conditions
  );
};
```

## 📊 Logging & Debugging

The system provides detailed console logging:

```
🚀 Preview mode: Auto-logging in with demo user
🔧 Creating new demo user: demo@puls.app
✅ Demo user created and authenticated: demo@puls.app
✅ Logged in as: Demo User (demo@puls.app)
```

Monitor browser console to see authentication flow in action.

## 🔍 Troubleshooting

### Preview Mode Not Activating

**Check**:

1. URL contains supported preview patterns
2. Browser console for environment detection logs
3. Try adding `?preview=true` to URL manually

### Demo Login Failing

**Solutions**:

1. Clear browser storage/IndexedDB
2. Check browser console for errors
3. Try different demo account
4. Refresh page and try again

### Auto-Login Not Working

**Debug**:

1. Verify `isDemoMode()` returns `true` in console
2. Check localStorage for existing auth tokens
3. Clear all storage and reload page
4. Check network tab for any errors

## 🚦 Testing Checklist

Before deploying changes:

- [ ] **Development**: Auto-login works with `dev@test.com`
- [ ] **Preview**: All three demo accounts work
- [ ] **Production**: No demo mode elements visible
- [ ] **Manual preview**: `?preview=true` parameter works
- [ ] **Multiple browsers**: Each gets independent demo accounts
- [ ] **Console logs**: Proper environment detection logging

## 🎯 Benefits Summary

- ✅ **Zero setup** for preview deployments
- ✅ **Multiple test accounts** for different scenarios
- ✅ **Automatic environment detection**
- ✅ **Local-first privacy** maintained
- ✅ **Production security** preserved
- ✅ **Developer-friendly** with clear logging
- ✅ **Backwards compatible** with existing dev mode

This system makes preview deployments **instantly accessible** while maintaining the same local-first, privacy-focused approach of the main application! 🎉
