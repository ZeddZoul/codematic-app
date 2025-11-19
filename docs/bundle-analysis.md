# Bundle Analysis Documentation

## Overview

This document provides guidelines for monitoring and maintaining optimal bundle sizes in the Themis Checker application.

## Running Bundle Analysis

To analyze the application bundle:

```bash
npm run analyze
```

This will:
1. Create a production build with bundle analysis enabled
2. Generate interactive HTML reports in `.next/analyze/`
3. Open the reports in your default browser

The analyzer creates separate reports for:
- **Client bundles**: JavaScript sent to the browser
- **Server bundles**: Code running on the server

## Bundle Size Baselines

### Initial Bundle Sizes (Baseline)

These baselines were established after implementing performance optimizations:

| Bundle Type | Size (gzipped) | Target | Status |
|-------------|----------------|--------|--------|
| Initial JS (First Load) | < 100 KB | < 100 KB | ✅ Target |
| Main App Bundle | < 150 KB | < 200 KB | ✅ Target |
| Total Client JS | < 300 KB | < 400 KB | ✅ Target |

### Page-Specific Bundles

| Page | Size (gzipped) | Notes |
|------|----------------|-------|
| `/` (Landing) | ~20 KB | Static content |
| `/dashboard` | ~45 KB | Includes TanStack Query |
| `/dashboard/repos` | ~35 KB | Shared chunks |
| `/dashboard/issues` | ~40 KB | Includes filters (lazy loaded) |
| `/check/[repoId]` | ~30 KB | Results display |

### Third-Party Dependencies

| Package | Size (gzipped) | Purpose |
|---------|----------------|---------|
| React + React DOM | ~45 KB | Core framework |
| Next.js Runtime | ~30 KB | Framework runtime |
| @tanstack/react-query | ~15 KB | Data fetching |
| react-icons | ~5-10 KB | Icons (tree-shaken) |

## Monitoring Guidelines

### When to Run Analysis

1. **Before merging PRs**: Check for unexpected bundle size increases
2. **After adding dependencies**: Verify impact on bundle size
3. **Monthly**: Regular monitoring to catch gradual increases
4. **After major refactors**: Ensure optimizations are working

### Warning Thresholds

- ⚠️ **Warning**: Any page bundle > 50 KB (gzipped)
- 🚨 **Critical**: Initial JS bundle > 100 KB (gzipped)
- 🚨 **Critical**: Total client JS > 400 KB (gzipped)

### Optimization Strategies

If bundle sizes exceed thresholds:

1. **Check for duplicate dependencies**
   - Look for multiple versions of the same package
   - Use `npm dedupe` to consolidate

2. **Review dynamic imports**
   - Ensure large components are lazy-loaded
   - Check that code splitting is working correctly

3. **Analyze third-party packages**
   - Look for heavy dependencies
   - Consider lighter alternatives
   - Use tree-shaking friendly imports

4. **Optimize images and assets**
   - Use Next.js Image component
   - Compress images before committing
   - Use SVGs for icons when possible

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Bundle Size Check

on:
  pull_request:
    branches: [main]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build and analyze
        run: npm run analyze
      
      - name: Check bundle size
        run: npm run check-bundle-size
```

## Troubleshooting

### Large Bundle Size

If you notice unexpectedly large bundles:

1. Run `npm run analyze` to see the breakdown
2. Look for:
   - Entire libraries being imported instead of specific components
   - Missing dynamic imports for large components
   - Duplicate code across chunks
   - Large JSON files or data being bundled

### Slow Build Times

If bundle analysis is slow:

1. Ensure you're using the latest Next.js version
2. Check that SWC minification is enabled
3. Consider using `--experimental-build-mode=compile` for faster builds

## Best Practices

1. **Import only what you need**
   ```typescript
   // ❌ Bad: Imports entire library
   import * as Icons from 'react-icons/fa';
   
   // ✅ Good: Imports specific icon
   import { FaCheckCircle } from 'react-icons/fa';
   ```

2. **Use dynamic imports for large components**
   ```typescript
   // ✅ Good: Lazy load heavy components
   const HeavyChart = dynamic(() => import('./HeavyChart'), {
     loading: () => <Skeleton />,
   });
   ```

3. **Leverage Next.js optimizations**
   - Use Server Components for static content
   - Enable `optimizePackageImports` in next.config.mjs
   - Use the Next.js Image component

4. **Monitor regularly**
   - Set up automated bundle size checks in CI
   - Review bundle analysis reports monthly
   - Document any intentional size increases

## Resources

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Web.dev: Optimize JavaScript](https://web.dev/fast/#optimize-your-javascript)
- [Next.js: Optimizing Bundle Size](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
