#!/usr/bin/env node

/**
 * TanStack Query Integration Validation Script
 * 
 * This script validates that TanStack Query is properly configured
 * and integrated throughout the application.
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

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

function validateTanStackQuery() {
  log('\n🔍 Validating TanStack Query Integration...\n', 'blue');

  let hasErrors = false;
  let hasWarnings = false;
  const results = [];

  // Check 1: Package installation
  log('1. Checking package installation...', 'bold');
  const packageJson = readFile('package.json');
  if (packageJson) {
    const pkg = JSON.parse(packageJson);
    if (pkg.dependencies['@tanstack/react-query']) {
      log(`   ✅ @tanstack/react-query installed (${pkg.dependencies['@tanstack/react-query']})`, 'green');
      results.push({ test: 'Package Installation', status: 'pass' });
    } else {
      log('   ❌ @tanstack/react-query not found in dependencies', 'red');
      hasErrors = true;
      results.push({ test: 'Package Installation', status: 'fail' });
    }
  } else {
    log('   ❌ package.json not found', 'red');
    hasErrors = true;
  }

  // Check 2: Query client configuration
  log('\n2. Checking QueryClient configuration...', 'bold');
  const queryClientFile = readFile('lib/query-client.ts');
  if (queryClientFile) {
    const hasQueryClient = queryClientFile.includes('QueryClient');
    const hasDefaultOptions = queryClientFile.includes('defaultOptions');
    const hasStaleTime = queryClientFile.includes('staleTime');
    const hasCacheTime = queryClientFile.includes('cacheTime') || queryClientFile.includes('gcTime');
    const hasRetry = queryClientFile.includes('retry');

    if (hasQueryClient && hasDefaultOptions) {
      log('   ✅ QueryClient properly configured', 'green');
      results.push({ test: 'QueryClient Configuration', status: 'pass' });
    } else {
      log('   ❌ QueryClient configuration incomplete', 'red');
      hasErrors = true;
      results.push({ test: 'QueryClient Configuration', status: 'fail' });
    }

    if (hasStaleTime) {
      log('   ✅ staleTime configured for caching', 'green');
    } else {
      log('   ⚠️  staleTime not configured (default will be used)', 'yellow');
      hasWarnings = true;
    }

    if (hasCacheTime) {
      log('   ✅ Cache time configured', 'green');
    } else {
      log('   ⚠️  Cache time not explicitly configured', 'yellow');
      hasWarnings = true;
    }

    if (hasRetry) {
      log('   ✅ Retry logic configured', 'green');
    } else {
      log('   ⚠️  Retry logic not configured (default will be used)', 'yellow');
      hasWarnings = true;
    }
  } else {
    log('   ❌ lib/query-client.ts not found', 'red');
    hasErrors = true;
    results.push({ test: 'QueryClient Configuration', status: 'fail' });
  }

  // Check 3: Query keys structure
  log('\n3. Checking query keys structure...', 'bold');
  const queryKeysFile = readFile('lib/query-keys.ts');
  if (queryKeysFile) {
    const hasRepositoriesKeys = queryKeysFile.includes('repositories');
    const hasChecksKeys = queryKeysFile.includes('checks');
    const hasStatsKeys = queryKeysFile.includes('stats');
    const hasUserKeys = queryKeysFile.includes('user');

    if (hasRepositoriesKeys && hasChecksKeys && hasStatsKeys && hasUserKeys) {
      log('   ✅ All query key categories defined', 'green');
      results.push({ test: 'Query Keys Structure', status: 'pass' });
    } else {
      log('   ⚠️  Some query key categories missing', 'yellow');
      hasWarnings = true;
      results.push({ test: 'Query Keys Structure', status: 'warning' });
    }

    // Check for hierarchical structure
    const hasHierarchy = queryKeysFile.includes('list') && queryKeysFile.includes('detail');
    if (hasHierarchy) {
      log('   ✅ Hierarchical query key structure implemented', 'green');
    } else {
      log('   ⚠️  Query keys may not be hierarchical', 'yellow');
      hasWarnings = true;
    }
  } else {
    log('   ❌ lib/query-keys.ts not found', 'red');
    hasErrors = true;
    results.push({ test: 'Query Keys Structure', status: 'fail' });
  }

  // Check 4: Custom hooks
  log('\n4. Checking custom data fetching hooks...', 'bold');
  const hooks = [
    { name: 'useRepositories', file: 'lib/hooks/useRepositories.ts' },
    { name: 'useDashboardStats', file: 'lib/hooks/useDashboardStats.ts' },
    { name: 'useCheckHistory', file: 'lib/hooks/useCheckHistory.ts' },
    { name: 'useUser', file: 'lib/hooks/useUser.ts' },
  ];

  let hooksFound = 0;
  hooks.forEach(hook => {
    const hookFile = readFile(hook.file);
    if (hookFile) {
      const hasUseQuery = hookFile.includes('useQuery');
      const hasQueryKey = hookFile.includes('queryKey');
      const hasQueryFn = hookFile.includes('queryFn');

      if (hasUseQuery && hasQueryKey && hasQueryFn) {
        log(`   ✅ ${hook.name} properly implemented`, 'green');
        hooksFound++;
      } else {
        log(`   ⚠️  ${hook.name} may be incomplete`, 'yellow');
        hasWarnings = true;
      }
    } else {
      log(`   ⚠️  ${hook.name} not found at ${hook.file}`, 'yellow');
      hasWarnings = true;
    }
  });

  if (hooksFound >= 3) {
    results.push({ test: 'Custom Hooks', status: 'pass' });
  } else if (hooksFound > 0) {
    results.push({ test: 'Custom Hooks', status: 'warning' });
  } else {
    results.push({ test: 'Custom Hooks', status: 'fail' });
    hasErrors = true;
  }

  // Check 5: Provider setup
  log('\n5. Checking QueryClientProvider setup...', 'bold');
  const layoutFile = readFile('app/layout.tsx');
  const providersFile = readFile('components/providers.tsx');

  let providerFound = false;
  if (layoutFile && layoutFile.includes('Providers')) {
    log('   ✅ Providers component used in root layout', 'green');

    if (providersFile && providersFile.includes('QueryClientProvider')) {
      log('   ✅ QueryClientProvider configured in Providers component', 'green');
      providerFound = true;
      results.push({ test: 'Provider Setup', status: 'pass' });
    } else if (providersFile) {
      log('   ⚠️  QueryClientProvider not found in Providers component', 'yellow');
      hasWarnings = true;
      results.push({ test: 'Provider Setup', status: 'warning' });
    }
  } else if (layoutFile && layoutFile.includes('QueryClientProvider')) {
    log('   ✅ QueryClientProvider configured in root layout', 'green');
    providerFound = true;
    results.push({ test: 'Provider Setup', status: 'pass' });
  } else if (layoutFile) {
    log('   ❌ QueryClientProvider not found in layout or providers', 'red');
    hasErrors = true;
    results.push({ test: 'Provider Setup', status: 'fail' });
  } else {
    log('   ❌ app/layout.tsx not found', 'red');
    hasErrors = true;
  }

  // Check 6: Stale time configuration
  log('\n6. Checking stale time configuration...', 'bold');
  const staleTimeConfigs = [];

  hooks.forEach(hook => {
    const hookFile = readFile(hook.file);
    if (hookFile) {
      const staleTimeMatch = hookFile.match(/staleTime:\s*(\d+)/);
      if (staleTimeMatch) {
        const staleTimeMs = parseInt(staleTimeMatch[1]);
        const staleTimeMin = staleTimeMs / 60000;
        staleTimeConfigs.push({ hook: hook.name, time: staleTimeMin });
        log(`   ✅ ${hook.name}: ${staleTimeMin} minutes`, 'green');
      }
    }
  });

  if (staleTimeConfigs.length > 0) {
    results.push({ test: 'Stale Time Configuration', status: 'pass' });
  } else {
    log('   ⚠️  No custom stale times configured', 'yellow');
    hasWarnings = true;
    results.push({ test: 'Stale Time Configuration', status: 'warning' });
  }

  // Check 7: Error handling
  log('\n7. Checking error handling...', 'bold');
  let errorHandlingCount = 0;

  hooks.forEach(hook => {
    const hookFile = readFile(hook.file);
    if (hookFile) {
      const hasErrorHandling = hookFile.includes('throw new Error') ||
        hookFile.includes('onError') ||
        hookFile.includes('catch');
      if (hasErrorHandling) {
        errorHandlingCount++;
      }
    }
  });

  if (errorHandlingCount >= 2) {
    log(`   ✅ Error handling implemented in ${errorHandlingCount} hooks`, 'green');
    results.push({ test: 'Error Handling', status: 'pass' });
  } else if (errorHandlingCount > 0) {
    log(`   ⚠️  Error handling found in only ${errorHandlingCount} hooks`, 'yellow');
    hasWarnings = true;
    results.push({ test: 'Error Handling', status: 'warning' });
  } else {
    log('   ⚠️  No explicit error handling found', 'yellow');
    hasWarnings = true;
    results.push({ test: 'Error Handling', status: 'warning' });
  }

  // Check 8: Polling configuration
  log('\n8. Checking polling configuration...', 'bold');
  const checkHistoryFile = readFile('lib/hooks/useCheckHistory.ts');
  if (checkHistoryFile) {
    const hasRefetchInterval = checkHistoryFile.includes('refetchInterval');
    const hasPollingParam = checkHistoryFile.includes('enablePolling');

    if (hasRefetchInterval && hasPollingParam) {
      log('   ✅ Polling functionality implemented in useCheckHistory', 'green');
      results.push({ test: 'Polling Configuration', status: 'pass' });
    } else {
      log('   ⚠️  Polling functionality may not be fully implemented', 'yellow');
      hasWarnings = true;
      results.push({ test: 'Polling Configuration', status: 'warning' });
    }
  } else {
    log('   ⚠️  useCheckHistory hook not found', 'yellow');
    hasWarnings = true;
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

  log('\n📋 Test Results:', 'blue');
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    const color = result.status === 'pass' ? 'green' : result.status === 'warning' ? 'yellow' : 'red';
    log(`   ${icon} ${result.test}`, color);
  });

  // Manual testing recommendations
  log('\n📝 Manual Testing Required:', 'blue');
  log('   1. Verify caching behavior by navigating between pages', 'blue');
  log('   2. Test background revalidation after stale time expires', 'blue');
  log('   3. Test error handling by simulating network failures', 'blue');
  log('   4. Verify polling functionality on check history page', 'blue');
  log('   5. Use React Query DevTools for debugging (optional)', 'blue');

  log('\n💡 Recommendations:', 'blue');
  if (hasErrors) {
    log('   • Fix critical errors before deploying to production', 'yellow');
  }
  if (hasWarnings) {
    log('   • Review warnings and consider improvements', 'yellow');
  }
  log('   • Install @tanstack/react-query-devtools for development', 'blue');
  log('   • Monitor query performance in production', 'blue');
  log('   • Consider implementing optimistic updates for mutations', 'blue');

  log('');

  if (hasErrors) {
    process.exit(1);
  } else if (hasWarnings) {
    process.exit(0);
  } else {
    log('✅ All TanStack Query integration checks passed!\n', 'green');
    process.exit(0);
  }
}

// Run validation
validateTanStackQuery();
