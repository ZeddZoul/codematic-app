# Caching Strategy

This document outlines the caching and revalidation strategy implemented for the Themis Checker application.

## Overview

The application uses a multi-layered caching approach:
1. **Server-side caching** with Next.js `unstable_cache` and ISR
2. **HTTP caching** with Cache-Control headers
3. **Client-side caching** with TanStack Query

## Server-Side Caching (Next.js)

### ISR (Incremental Static Regeneration)

The dashboard page uses ISR with a 2-minute revalidation period:

```typescript
// app/dashboard/page.tsx
export const revalidate = 120; // 2 minutes
```

This means:
- The page is statically generated at build time
- After 2 minutes, the next request triggers a background regeneration
- Users always get a fast response (either cached or regenerating)

### Data Fetching Cache

Server-side data fetching functions use `unstable_cache`:

```typescript
// lib/server-data.ts
const getCachedStats = unstable_cache(
  async (userId: number) => fetchDashboardStatsInternal(userId),
  ['dashboard-stats'],
  {
    revalidate: 120, // 2 minutes
    tags: ['dashboard-stats'],
  }
);
```

Benefits:
- Reduces database queries
- Faster server-side rendering
- Can be invalidated by tags when data changes

## HTTP Caching (Cache-Control Headers)

### Dashboard Stats API
```
Cache-Control: public, s-maxage=120, stale-while-revalidate=240, max-age=60
```

- `public`: Can be cached by CDN and browsers
- `s-maxage=120`: CDN/edge cache for 2 minutes
- `stale-while-revalidate=240`: Serve stale content for 4 minutes while revalidating
- `max-age=60`: Browser cache for 1 minute

**Rationale**: Stats change moderately, 2-minute cache balances freshness and performance.

### Repositories API
```
Cache-Control: public, s-maxage=300, stale-while-revalidate=600, max-age=120
```

- CDN cache: 5 minutes
- Stale-while-revalidate: 10 minutes
- Browser cache: 2 minutes

**Rationale**: Repository lists change infrequently, longer cache is acceptable.

### Check History API
```
Cache-Control: public, s-maxage=30, stale-while-revalidate=60, max-age=15
```

- CDN cache: 30 seconds
- Stale-while-revalidate: 1 minute
- Browser cache: 15 seconds

**Rationale**: Check runs update frequently, shorter cache ensures freshness.

### User API
```
Cache-Control: private, max-age=300, stale-while-revalidate=600
```

- `private`: Only browser can cache (not CDN)
- Browser cache: 5 minutes
- Stale-while-revalidate: 10 minutes

**Rationale**: User data is private and changes infrequently.

## Client-Side Caching (TanStack Query)

### Configuration

```typescript
// lib/query-client.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});
```

### Per-Hook Configuration

| Hook | Stale Time | Rationale |
|------|------------|-----------|
| `useUser` | 5 minutes | User data rarely changes |
| `useDashboardStats` | 2 minutes | Stats need moderate freshness |
| `useRepositories` | 5 minutes | Repository lists change infrequently |
| `useCheckHistory` | 30 seconds | Check runs update frequently |

### Initial Data from Server

Hooks accept `initialData` from Server Components:

```typescript
const { data: stats } = useDashboardStats({
  initialData: serverStats,
});
```

Benefits:
- Instant initial render (no loading state)
- Background revalidation for freshness
- Best of both worlds: SSR + client-side updates

## Stale-While-Revalidate Pattern

The application extensively uses the stale-while-revalidate pattern:

1. **First request**: Fetch fresh data, cache it
2. **Within cache time**: Serve cached data instantly
3. **After cache expires but within SWR window**:
   - Serve stale cached data instantly
   - Fetch fresh data in background
   - Update cache when fresh data arrives
4. **After SWR window**: Fetch fresh data, show loading state

This pattern provides:
- Fast response times (always serve cached data first)
- Fresh data (background updates)
- Better user experience (no loading spinners for stale data)

## Cache Invalidation

### Manual Invalidation

TanStack Query provides methods to invalidate cache:

```typescript
// Invalidate specific query
queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard });

// Invalidate all queries with a prefix
queryClient.invalidateQueries({ queryKey: queryKeys.repositories.all });
```

### Automatic Invalidation

- `refetchOnWindowFocus`: Refetch when user returns to tab
- `refetchOnReconnect`: Refetch when network reconnects
- Background revalidation: Automatic based on stale time

### Server-Side Invalidation

Next.js cache can be invalidated by tags:

```typescript
import { revalidateTag } from 'next/cache';

// Invalidate dashboard stats cache
revalidateTag('dashboard-stats');
```

## Performance Benefits

1. **Reduced Server Load**: Fewer database queries and API calls
2. **Faster Page Loads**: Server-side rendering with cached data
3. **Better UX**: Instant navigation with cached data
4. **Lower Latency**: CDN edge caching reduces round-trip time
5. **Resilience**: Stale data served during outages

## Monitoring

To monitor cache effectiveness:

1. Check Next.js build output for static/dynamic pages
2. Monitor API response times (should be faster with caching)
3. Check browser DevTools Network tab for cache hits
4. Monitor database query counts (should decrease)

## Future Improvements

1. **Redis Cache**: Add Redis for distributed caching
2. **Cache Warming**: Pre-populate cache for common queries
3. **Conditional Requests**: Use ETags for efficient revalidation
4. **Service Worker**: Add offline support with service worker caching
