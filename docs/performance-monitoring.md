# Performance Monitoring Guide

## Overview

The Themis Checker application includes comprehensive performance monitoring capabilities to track Core Web Vitals, user interaction timings, and component render counts. This guide explains how to use these tools effectively.

## Features

### 1. Core Web Vitals Tracking

The application automatically tracks the following Core Web Vitals metrics:

- **LCP (Largest Contentful Paint)**: Time until the largest content element is rendered
  - Good: ≤ 2.5s
  - Needs Improvement: ≤ 4.0s
  - Poor: > 4.0s

- **FID (First Input Delay)**: Time from first user interaction to browser response
  - Good: ≤ 100ms
  - Needs Improvement: ≤ 300ms
  - Poor: > 300ms

- **CLS (Cumulative Layout Shift)**: Visual stability score
  - Good: ≤ 0.1
  - Needs Improvement: ≤ 0.25
  - Poor: > 0.25

- **FCP (First Contentful Paint)**: Time until first content is rendered
  - Good: ≤ 1.8s
  - Needs Improvement: ≤ 3.0s
  - Poor: > 3.0s

- **TTFB (Time to First Byte)**: Server response time
  - Good: ≤ 800ms
  - Needs Improvement: ≤ 1.8s
  - Poor: > 1.8s

### 2. User Interaction Tracking

Track the performance of user interactions like clicks, form submissions, and navigation:

```typescript
import { trackInteraction } from '@/lib/performance';

function handleClick() {
  const startTime = performance.now();
  
  // Perform operation
  doSomething();
  
  // Track the interaction
  trackInteraction('Button Click', startTime);
}
```

Or use the hook:

```typescript
import { useInteractionTracking } from '@/lib/hooks/usePerformance';

function MyComponent() {
  const { trackClick } = useInteractionTracking();
  
  const handleClick = () => {
    const endTracking = trackClick('Button Click');
    doSomething();
    endTracking();
  };
}
```

### 3. Component Render Tracking

Track how many times components render in development:

```typescript
import { useRenderTracking } from '@/lib/hooks/usePerformance';

function MyComponent() {
  // Automatically tracks renders in development
  useRenderTracking('MyComponent');
  
  return <div>Content</div>;
}
```

The system will warn you if a component renders excessively (>10 times), suggesting you consider memoization.

### 4. Async Operation Measurement

Measure the performance of async operations:

```typescript
import { measureAsync } from '@/lib/performance';

async function fetchData() {
  return measureAsync('Fetch User Data', async () => {
    const response = await fetch('/api/user');
    return response.json();
  });
}
```

## Development Tools

### Performance Panel

In development mode, press `Ctrl+Shift+P` to open the Performance Panel. This panel shows:

- Real-time Core Web Vitals metrics
- User interaction statistics
- Component render counts
- Performance warnings

The panel updates every 2 seconds and provides buttons to:
- Log detailed metrics to the console
- Refresh the data manually

### Console Logging

Performance metrics are automatically logged to the console in development:

```
✅ [Performance] LCP: 1234.56ms (good)
⚡ [Performance] Button Click completed in 45.23ms
🔄 [Performance] MyComponent has rendered 15 times. Consider memoization.
```

### Performance Summary

Get a complete performance summary:

```typescript
import { getPerformanceSummary, logPerformanceSummary } from '@/lib/performance';

// Get summary object
const summary = getPerformanceSummary();

// Or log to console
logPerformanceSummary();
```

## Best Practices

### 1. Track Key User Interactions

Focus on tracking interactions that are critical to the user experience:

```typescript
// Good: Track important actions
trackInteraction('Repository Check Started', startTime);
trackInteraction('Filter Applied', startTime);
trackInteraction('Navigation to Dashboard', startTime);

// Avoid: Don't track every tiny interaction
// trackInteraction('Mouse Moved', startTime); ❌
```

### 2. Use Render Tracking Strategically

Add render tracking to components that:
- Are frequently rendered
- Have complex render logic
- Are part of lists or tables
- Are suspected of causing performance issues

```typescript
// Good: Track complex components
function RepositoryCard() {
  useRenderTracking('RepositoryCard');
  // Complex rendering logic
}

// Avoid: Don't track simple components
function SimpleButton() {
  useRenderTracking('SimpleButton'); // ❌ Overkill
  return <button>Click</button>;
}
```

### 3. Monitor Slow Operations

Set up warnings for operations that exceed acceptable thresholds:

```typescript
const startTime = performance.now();
await fetchData();
const duration = performance.now() - startTime;

if (duration > 1000) {
  console.warn(`Slow operation: fetchData took ${duration}ms`);
}
```

### 4. Regular Performance Audits

Schedule regular performance audits:

1. **Weekly**: Check the Performance Panel during development
2. **Before Releases**: Run bundle analysis and check Core Web Vitals
3. **Monthly**: Review performance trends and identify regressions

## Performance Optimization Workflow

### 1. Identify Issues

Use the Performance Panel to identify:
- Components with high render counts
- Slow user interactions (>100ms)
- Poor Core Web Vitals scores

### 2. Investigate

For high render counts:
```typescript
// Check if component needs memoization
const MyComponent = React.memo(({ data }) => {
  // Component logic
});

// Or use useMemo for expensive computations
const sortedData = useMemo(() => {
  return data.sort(compareFn);
}, [data]);
```

For slow interactions:
```typescript
// Consider code splitting
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});

// Or optimize the operation
const optimizedOperation = useCallback(() => {
  // Optimized logic
}, [dependencies]);
```

### 3. Verify Improvements

After optimization:
1. Check the Performance Panel for reduced render counts
2. Verify interaction times are under 100ms
3. Confirm Core Web Vitals are in the "good" range
4. Run bundle analysis to check size impact

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Performance Check

on:
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Check bundle size
        run: npm run check-bundle-size
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/dashboard
          uploadArtifacts: true
```

## Troubleshooting

### High Render Counts

**Problem**: Component renders 20+ times

**Solutions**:
1. Add `React.memo` to the component
2. Use `useCallback` for event handlers
3. Use `useMemo` for computed values
4. Check parent component for unnecessary re-renders

### Slow Interactions

**Problem**: User interactions take >100ms

**Solutions**:
1. Use code splitting for heavy components
2. Debounce or throttle frequent operations
3. Move expensive computations to Web Workers
4. Optimize database queries

### Poor Core Web Vitals

**Problem**: LCP, FID, or CLS scores are poor

**Solutions**:
1. **LCP**: Optimize images, use CDN, implement lazy loading
2. **FID**: Reduce JavaScript execution time, use code splitting
3. **CLS**: Reserve space for dynamic content, avoid layout shifts

## API Reference

### Functions

- `reportWebVitals(metric)`: Report a Core Web Vital metric
- `trackInteraction(action, startTime)`: Track user interaction timing
- `measureAsync(label, operation)`: Measure async operation performance
- `measureSync(label, operation)`: Measure sync operation performance
- `mark(name)`: Create a performance mark
- `measure(name, startMark, endMark)`: Measure between marks
- `getMetrics()`: Get all recorded metrics
- `getInteractions()`: Get all recorded interactions
- `getPerformanceSummary()`: Get performance summary
- `logPerformanceSummary()`: Log summary to console
- `trackRender(componentName)`: Track component render
- `getRenderCounts()`: Get render counts for all components
- `logRenderCounts()`: Log render counts to console

### Hooks

- `useRenderTracking(componentName)`: Track component renders
- `useInteractionTracking()`: Get interaction tracking utilities
- `useComponentTiming(componentName)`: Track mount/unmount timing
- `useRenderPerformance(componentName, threshold)`: Warn about slow renders

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
