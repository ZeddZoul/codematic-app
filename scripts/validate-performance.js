#!/usr/bin/env node

/**
 * Performance Validation Script
 * 
 * This script validates performance optimizations including:
 * - Bundle size limits
 * - Code splitting configuration
 * - Memoization implementation
 * - Performance monitoring setup
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

function checkMemoization(content) {
  return {
    reactMemo: content.includes('React.memo'),
    useCallback: content.includes('useCallback'),
    useMemo: content.includes('useMemo'),
    customComparison: content.includes('prevProps') && content.includes('nextProps'),
  };
}

function validatePerformance() {
  log('\n⚡ Validating Performance Optimizations...\n', 'blue');

  let hasErrors = false;
  let hasWarnings = false;
  const results = [];

  // Check 1: Bundle Analyzer Configuration
  log('1. Checking Bundle Analyzer Configuration...', 'bold');
  const nextConfig = readFile('next.config.mjs');
  const packageJson = readFile('package.json');

  if (nextConfig) {
    const hasBundleAnalyzer = nextConfig.includes('bundle-analyzer') || nextConfig.includes('bundleAnalyzer');
    if (hasBundleAnalyzer) {
      log('   ✅ Bundle analyzer configured in next.config.mjs', 'green');
    } else {
      log('   ⚠️  Bundle analyzer not configured', 'yellow');
      hasWarnings = true;
    }

    const hasAnalyzeEnv = nextConfig.includes('ANALYZE');
    if (hasAnalyzeEnv) {
      log('   ✅ ANALYZE environment variable check present', 'green');
    } else {
      log('   ⚠️  ANALYZE environment variable check missing', 'yellow');
      hasWarnings = true;
    }
  } else {
    log('   ❌ next.config.mjs not found', 'red');
    hasErrors = true;
  }

  if (packageJson) {
    const pkg = JSON.parse(packageJson);
    const hasAnalyzeScript = pkg.scripts?.analyze;
    const hasCheckBundleScript = pkg.scripts?.['check-bundle-size'];

    if (hasAnalyzeScript) {
      log('   ✅ "analyze" script configured in package.json', 'green');
    } else {
      log('   ⚠️  "analyze" script missing from package.json', 'yellow');
      hasWarnings = true;
    }

    if (hasCheckBundleScript) {
      log('   ✅ "check-bundle-size" script configured', 'green');
    } else {
      log('   ⚠️  "check-bundle-size" script missing', 'yellow');
      hasWarnings = true;
    }

    const hasBundleAnalyzerDep = pkg.devDependencies?.['@next/bundle-analyzer'];
    if (hasBundleAnalyzerDep) {
      log('   ✅ @next/bundle-analyzer installed', 'green');
      results.push({ test: 'Bundle Analyzer', status: 'pass' });
    } else {
      log('   ❌ @next/bundle-analyzer not installed', 'red');
      hasErrors = true;
      results.push({ test: 'Bundle Analyzer', status: 'fail' });
    }
  }

  // Check 2: Next.js Optimizations
  log('\n2. Checking Next.js Optimizations...', 'bold');
  if (nextConfig) {
    const hasSwcMinify = nextConfig.includes('swcMinify');
    if (hasSwcMinify) {
      log('   ✅ SWC minification enabled', 'green');
    } else {
      log('   ⚠️  SWC minification not explicitly enabled', 'yellow');
      hasWarnings = true;
    }

    const hasImageOptimization = nextConfig.includes('images');
    if (hasImageOptimization) {
      log('   ✅ Image optimization configured', 'green');
    } else {
      log('   ⚠️  Image optimization not configured', 'yellow');
      hasWarnings = true;
    }

    const hasOptimizePackageImports = nextConfig.includes('optimizePackageImports');
    if (hasOptimizePackageImports) {
      log('   ✅ Package import optimization configured', 'green');
    } else {
      log('   ⚠️  Package import optimization not configured', 'yellow');
      hasWarnings = true;
    }

    const hasCompilerOptions = nextConfig.includes('compiler');
    if (hasCompilerOptions) {
      log('   ✅ Compiler options configured', 'green');
    } else {
      log('   ⚠️  Compiler options not configured', 'yellow');
      hasWarnings = true;
    }

    results.push({ test: 'Next.js Optimizations', status: hasWarnings ? 'warning' : 'pass' });
  }

  // Check 3: Component Memoization
  log('\n3. Checking Component Memoization...', 'bold');
  const componentsToCheck = [
    { name: 'StatsCard', path: 'components/dashboard/StatsCard.tsx' },
    { name: 'RepositoryCard', path: 'components/dashboard/RepositoryCard.tsx' },
    { name: 'IssueCard', path: 'components/results/IssueCard.tsx' },
  ];

  let memoizedCount = 0;
  let totalComponents = 0;

  componentsToCheck.forEach(component => {
    const content = readFile(component.path);
    if (content) {
      totalComponents++;
      const memo = checkMemoization(content);

      if (memo.reactMemo) {
        log(`   ✅ ${component.name} is memoized with React.memo`, 'green');
        memoizedCount++;

        if (memo.customComparison) {
          log(`      ✅ Custom comparison function implemented`, 'green');
        }
      } else {
        log(`   ⚠️  ${component.name} may not be memoized`, 'yellow');
        hasWarnings = true;
      }
    }
  });

  if (memoizedCount >= 2) {
    results.push({ test: 'Component Memoization', status: 'pass' });
  } else if (memoizedCount > 0) {
    results.push({ test: 'Component Memoization', status: 'warning' });
  } else {
    results.push({ test: 'Component Memoization', status: 'fail' });
    hasErrors = true;
  }

  // Check 4: Hook Memoization (useCallback, useMemo)
  log('\n4. Checking Hook Memoization...', 'bold');
  const pagesWithHooks = [
    { name: 'Dashboard', path: 'app/dashboard/page.tsx' },
    { name: 'DashboardClient', path: 'app/dashboard/DashboardClient.tsx' },
    { name: 'Repositories', path: 'app/dashboard/repos/page.tsx' },
  ];

  let useCallbackCount = 0;
  let useMemoCount = 0;

  pagesWithHooks.forEach(page => {
    const content = readFile(page.path);
    if (content) {
      const memo = checkMemoization(content);

      if (memo.useCallback) {
        useCallbackCount++;
        log(`   ✅ ${page.name} uses useCallback`, 'green');
      }

      if (memo.useMemo) {
        useMemoCount++;
        log(`   ✅ ${page.name} uses useMemo`, 'green');
      }
    }
  });

  if (useCallbackCount > 0 || useMemoCount > 0) {
    log(`   ✅ Found ${useCallbackCount} useCallback and ${useMemoCount} useMemo implementations`, 'green');
    results.push({ test: 'Hook Memoization', status: 'pass' });
  } else {
    log('   ⚠️  No useCallback or useMemo found in checked files', 'yellow');
    hasWarnings = true;
    results.push({ test: 'Hook Memoization', status: 'warning' });
  }

  // Check 5: Dynamic Imports (Code Splitting)
  log('\n5. Checking Dynamic Imports...', 'bold');
  const filesToCheckForDynamic = [
    'app/dashboard/page.tsx',
    'app/dashboard/DashboardClient.tsx',
    'app/dashboard/repos/page.tsx',
    'app/dashboard/issues/page.tsx',
  ];

  let dynamicImportCount = 0;

  filesToCheckForDynamic.forEach(file => {
    const content = readFile(file);
    if (content) {
      const hasDynamic = content.includes('dynamic(') || content.includes('import(');
      if (hasDynamic) {
        dynamicImportCount++;
        log(`   ✅ ${path.basename(file)} uses dynamic imports`, 'green');
      }
    }
  });

  if (dynamicImportCount > 0) {
    log(`   ✅ Found ${dynamicImportCount} files with dynamic imports`, 'green');
    results.push({ test: 'Code Splitting', status: 'pass' });
  } else {
    log('   ⚠️  No dynamic imports found (may not be needed)', 'yellow');
    hasWarnings = true;
    results.push({ test: 'Code Splitting', status: 'warning' });
  }

  // Check 6: Performance Monitoring
  log('\n6. Checking Performance Monitoring...', 'bold');
  const webVitalsFile = readFile('components/WebVitals.tsx');
  const performancePanelFile = readFile('components/PerformancePanel.tsx');
  const performanceLibFile = readFile('lib/performance.ts');

  if (webVitalsFile) {
    log('   ✅ WebVitals component exists', 'green');

    const hasWebVitalsTracking = webVitalsFile.includes('onCLS') ||
      webVitalsFile.includes('onFID') ||
      webVitalsFile.includes('onLCP');
    if (hasWebVitalsTracking) {
      log('   ✅ Core Web Vitals tracking implemented', 'green');
    } else {
      log('   ⚠️  Core Web Vitals tracking may be incomplete', 'yellow');
      hasWarnings = true;
    }
  } else {
    log('   ⚠️  WebVitals component not found', 'yellow');
    hasWarnings = true;
  }

  if (performancePanelFile) {
    log('   ✅ PerformancePanel component exists', 'green');
  } else {
    log('   ⚠️  PerformancePanel component not found', 'yellow');
    hasWarnings = true;
  }

  if (performanceLibFile) {
    log('   ✅ Performance library exists', 'green');

    const hasRenderTracking = performanceLibFile.includes('useRenderTracking');
    if (hasRenderTracking) {
      log('   ✅ Render tracking utility implemented', 'green');
    } else {
      log('   ⚠️  Render tracking utility may be missing', 'yellow');
      hasWarnings = true;
    }
  } else {
    log('   ⚠️  Performance library not found', 'yellow');
    hasWarnings = true;
  }

  if (webVitalsFile || performancePanelFile) {
    results.push({ test: 'Performance Monitoring', status: 'pass' });
  } else {
    results.push({ test: 'Performance Monitoring', status: 'warning' });
  }

  // Check 7: Image Optimization
  log('\n7. Checking Image Optimization...', 'bold');
  const layoutFile = readFile('app/layout.tsx');
  const sidebarFile = readFile('components/layout/Sidebar.tsx');

  let nextImageCount = 0;
  const filesToCheckImages = [layoutFile, sidebarFile];

  filesToCheckImages.forEach(content => {
    if (content) {
      const hasNextImage = content.includes('next/image') || content.includes('from "next/image"');
      if (hasNextImage) {
        nextImageCount++;
      }
    }
  });

  if (nextImageCount > 0) {
    log(`   ✅ Next.js Image component used in ${nextImageCount} files`, 'green');
    results.push({ test: 'Image Optimization', status: 'pass' });
  } else {
    log('   ⚠️  Next.js Image component may not be used', 'yellow');
    hasWarnings = true;
    results.push({ test: 'Image Optimization', status: 'warning' });
  }

  // Check 8: Bundle Size Check Script
  log('\n8. Checking Bundle Size Validation...', 'bold');
  const bundleSizeScript = readFile('scripts/check-bundle-size.js');

  if (bundleSizeScript) {
    log('   ✅ Bundle size check script exists', 'green');

    const hasLimits = bundleSizeScript.includes('LIMITS') || bundleSizeScript.includes('limit');
    if (hasLimits) {
      log('   ✅ Bundle size limits defined', 'green');
    } else {
      log('   ⚠️  Bundle size limits may not be defined', 'yellow');
      hasWarnings = true;
    }

    results.push({ test: 'Bundle Size Validation', status: 'pass' });
  } else {
    log('   ⚠️  Bundle size check script not found', 'yellow');
    hasWarnings = true;
    results.push({ test: 'Bundle Size Validation', status: 'warning' });
  }

  // Summary
  log('\n' + '─'.repeat(60), 'blue');
  log('Summary:', 'bold');
  log('─'.repeat(60), 'blue');

  const passed = results.filter(r => r.status === 'pass').length;
  const warned = results.filter(r => r.status === 'warning').length;
  const failed = results.filter(r => r.status === 'fail').length;

  log(`\nTests Passed: ${passed}`, 'green');
  if (warned > 0) log(`Tests with Warnings: ${warned}`, 'yellow');
  if (failed > 0) log(`Tests Failed: ${failed}`, 'red');

  log('\n📋 Performance Test Results:', 'blue');
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    const color = result.status === 'pass' ? 'green' : result.status === 'warning' ? 'yellow' : 'red';
    log(`   ${icon} ${result.test}`, color);
  });

  // Performance testing commands
  log('\n📝 Performance Testing Commands:', 'blue');
  log('   # Build production bundle', 'blue');
  log('   npm run build', 'blue');
  log('', 'blue');
  log('   # Analyze bundle size', 'blue');
  log('   npm run analyze', 'blue');
  log('', 'blue');
  log('   # Check bundle size limits', 'blue');
  log('   npm run check-bundle-size', 'blue');
  log('', 'blue');
  log('   # Run Lighthouse audit', 'blue');
  log('   lighthouse http://localhost:3000/dashboard --view', 'blue');

  log('\n💡 Performance Targets:', 'blue');
  log('   • Initial JS bundle: < 100KB (gzipped)', 'blue');
  log('   • Page bundles: < 50KB (gzipped)', 'blue');
  log('   • Total client JS: < 400KB (gzipped)', 'blue');
  log('   • First Contentful Paint (FCP): < 1.5s', 'blue');
  log('   • Largest Contentful Paint (LCP): < 2.5s', 'blue');
  log('   • Time to Interactive (TTI): < 3.5s', 'blue');
  log('   • Cumulative Layout Shift (CLS): < 0.1', 'blue');

  log('\n🔍 Manual Performance Testing:', 'blue');
  log('   1. Build production bundle and check sizes', 'blue');
  log('   2. Run bundle analyzer to identify large dependencies', 'blue');
  log('   3. Use React DevTools Profiler to check re-renders', 'blue');
  log('   4. Run Lighthouse audit for Core Web Vitals', 'blue');
  log('   5. Test page load times with throttled network', 'blue');
  log('   6. Monitor performance in production with real users', 'blue');

  log('');

  if (hasErrors) {
    process.exit(1);
  } else if (hasWarnings) {
    process.exit(0);
  } else {
    log('✅ All performance optimization checks passed!\n', 'green');
    process.exit(0);
  }
}

// Run validation
validatePerformance();
