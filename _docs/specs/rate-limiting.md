# Rate Limiting Specification

## Overview

Rate limiting protects API endpoints from abuse and controls costs for expensive AI operations. The system uses **distributed Redis-based rate limiting** in production with **in-memory fallback** for development and resilience.

## Architecture

### Two-Tier System

1. **Redis Rate Limiter (Production)**
   - Uses Upstash Redis (Vercel KV) for distributed rate limiting
   - Global limits across all server instances
   - Persistent storage survives restarts/deploys
   - Required environment variables: `KV_REST_API_URL`, `KV_REST_API_TOKEN`

2. **Memory Fallback (Development/Resilience)**
   - In-memory rate limiting per server instance
   - Automatically used when Redis unavailable
   - Cleans up expired entries every 5 minutes

### Separate Limiters

Each endpoint type has its own Redis limiter with appropriate limits:

- **Image Analysis Limiter**: Expensive vision AI (10/minute)
- **Zoning Limiter**: Text AI for ingredient classification (50/minute)
- **Generic Limiter**: Other endpoints (configurable per endpoint)

## Endpoint Limits

| Endpoint                 | Method                 | Limit  | Window | Purpose               |
| ------------------------ | ---------------------- | ------ | ------ | --------------------- |
| `/api/analyze-image`     | `limitImageAnalysis()` | 10/min | 60s    | Vision AI (expensive) |
| `/api/zone-ingredients`  | `limitZoning()`        | 50/min | 60s    | Text AI (cheaper)     |
| `/api/upload-validation` | `limitGeneric()`       | 30/min | 60s    | File validation       |

## How It Works

### Sliding Window Algorithm

- Uses **sliding window** rate limiting (not fixed window)
- Requests are tracked per IP address
- Window continuously slides forward
- Old requests gradually "fall off" the window

### Request Flow

```
User Request
    ↓
Rate Limiter Check (Redis or Memory)
    ↓
    ├─→ Allowed → Process Request
    └─→ Blocked → Return 429 Too Many Requests
```

### Rate Limit Response

When rate limit is exceeded:

- **Status**: `429 Too Many Requests`
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining (0 when blocked)
  - `X-RateLimit-Reset`: Timestamp when limit resets

## Configuration

### Environment Variables

```bash
# Redis Configuration (Production)
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_redis_token

# Override Default Limits (Optional)
IMAGE_ANALYSIS_RATE_LIMIT=10      # Default: 10/minute
ZONING_RATE_LIMIT=50              # Default: 50/minute
```

### Code Configuration

Limits are defined in `lib/config/constants.ts`:

```typescript
RATE_LIMIT_CONFIG = {
  IMAGE_ANALYSIS_REQUESTS_PER_MINUTE: 10,
  ZONING_REQUESTS_PER_MINUTE: 50,
  RATE_LIMIT_WINDOW: '60 s',
};
```

## Implementation Details

### Rate Limiter Methods

- **`limitImageAnalysis(identifier: string)`**: Image analysis endpoint (10/min)
- **`limitZoning(identifier: string)`**: Ingredient zoning endpoint (50/min)
- **`limitGeneric(identifier, limit, windowMs)`**: Generic endpoints (memory-only)

### Identifier Strategy

Currently uses **IP address** as identifier:

- Extracts from `x-forwarded-for` or `x-real-ip` headers
- Falls back to `127.0.0.1` if unavailable

### Redis Key Prefixes

- `ratelimit:image-analysis:{identifier}` - Image analysis requests
- `ratelimit:zoning:{identifier}` - Zoning requests

## Critical Implementation Guidelines

### Why Separate Limiters Are Required

**⚠️ CRITICAL**: Each endpoint type MUST have its own Redis limiter initialized with the correct limit.

**The Bug We Fixed**: Previously, a single Redis limiter was initialized with the image analysis limit (10/minute) and used for ALL endpoints. This caused:

- Zoning endpoint getting 10/minute instead of 50/minute
- Legitimate users hitting limits with normal usage (15 ingredients = 15 API calls)

**The Fix**: Separate Redis limiters are initialized once per endpoint type with their specific limits.

### Method Selection Rules

**Use dedicated methods for endpoints with Redis rate limiting:**

- `limitImageAnalysis()` → `/api/analyze-image` (10/min, Redis-backed)
- `limitZoning()` → `/api/zone-ingredients` (50/min, Redis-backed)

**Use `limitGeneric()` ONLY for:**

- Endpoints that don't need Redis-backed distributed limiting
- Endpoints with variable/ad-hoc limits
- Currently uses memory fallback only (not Redis)

**⚠️ DO NOT** use `limitGeneric()` for endpoints that need Redis rate limiting - it will only use memory fallback, which doesn't work across multiple server instances.

### Adding New Endpoints

When adding a new endpoint that needs rate limiting:

1. **If it needs Redis-backed distributed limiting:**
   - Add a new dedicated method in `lib/rate-limit/index.ts`
   - Initialize a new Redis limiter in `initializeRedis()`
   - Use a unique prefix (e.g., `ratelimit:new-endpoint`)
   - Call the dedicated method in your API route

2. **If it only needs per-instance limiting:**
   - Use `limitGeneric()` with appropriate limit
   - Will use memory fallback (works for single-instance deployments)

### Common Pitfalls

❌ **Wrong**: Using `limitGeneric()` for endpoints that need Redis

```typescript
// This only uses memory fallback, not Redis!
const result = await rateLimiter.limitGeneric(ip, 50, 60000);
```

✅ **Correct**: Using dedicated method for Redis-backed endpoints

```typescript
// This uses Redis limiter with correct 50/minute limit
const result = await rateLimiter.limitZoning(ip);
```

❌ **Wrong**: Sharing a single Redis limiter across endpoints

```typescript
// DON'T: One limiter for all endpoints
this.redisRateLimit = new Ratelimit({
  /* fixed limit */
});
```

✅ **Correct**: Separate limiters per endpoint type

```typescript
// DO: Separate limiters with appropriate limits
this.redisImageAnalysisLimiter = new Ratelimit({ limit: 10 });
this.redisZoningLimiter = new Ratelimit({ limit: 50 });
```

## Common Scenarios

### Scenario: 15 Ingredients in One Meal

When saving a food with 15 ingredients:

- 15 parallel API calls to `/api/zone-ingredients`
- Each call consumes 1 slot from the 50/minute limit
- All 15 requests succeed (well under 50 limit)
- Ingredients get zoned successfully

### Scenario: Rate Limit Exceeded

When limit is exceeded:

- API returns `429` status
- Frontend handles gracefully
- Ingredients remain "unzoned" but food still saves
- User can retry after window resets

## Troubleshooting

### Issue: Rate limiting too strict

**Symptoms**: Legitimate users hitting limits with normal usage

**Solutions**:

1. Check environment variables are set correctly
2. Verify Redis is connected (check logs for "Redis backend initialized")
3. Increase limits via environment variables
4. Consider user-based rate limiting instead of IP-based

### Issue: Rate limiting not working

**Symptoms**: No rate limiting happening, all requests succeed

**Check**:

1. Redis credentials configured in production?
2. Check logs for "using memory fallback" (Redis not connected)
3. Verify rate limiter is called in API routes

### Issue: Different limits in dev vs prod

**Cause**: Redis uses configured limits, memory fallback uses defaults

**Solution**: Ensure environment variables match in both environments

## Future Considerations

- **User-based rate limiting**: Use authenticated user ID instead of IP
- **Dynamic limits**: Adjust limits based on user tier/subscription
- **Rate limit bypass**: Skip limits for admin users or internal services
