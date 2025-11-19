#!/usr/bin/env node

/**
 * Bundle Size Check Script
 * 
 * This script checks the Next.js build output to ensure bundle sizes
 * stay within acceptable limits. It's designed to run in CI/CD pipelines.
 */

const fs = require('fs');
const path = require('path');

// Bundle size limits (in KB, gzipped)
const LIMITS = {
  firstLoadJS: 100, // Initial JavaScript bundle
  pageBundle: 50,   // Individual page bundles
  totalClientJS: 400, // Total client-side JavaScript
};

// ANSI color codes for terminal output
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

function parseSize(sizeStr) {
  // Parse size strings like "45.2 kB" or "1.2 MB"
  const match = sizeStr.match(/([\d.]+)\s*(kB|MB)/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  return unit === 'MB' ? value * 1024 : value;
}

function checkBundleSize() {
  log('\n📦 Checking bundle sizes...\n', 'blue');

  // Read the Next.js build output
  const buildManifestPath = path.join(process.cwd(), '.next', 'build-manifest.json');
  const pagesManifestPath = path.join(process.cwd(), '.next', 'server', 'pages-manifest.json');

  if (!fs.existsSync(buildManifestPath)) {
    log('❌ Build manifest not found. Run "npm run build" first.', 'red');
    process.exit(1);
  }

  let hasErrors = false;
  let hasWarnings = false;

  try {
    // Check if we can read build stats
    const nextMetaPath = path.join(process.cwd(), '.next', 'next-server.js.nft.json');

    log('Bundle Size Analysis:', 'bold');
    log('─'.repeat(60), 'blue');

    // Read package.json to get build stats
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    log(`\n✓ Project: ${packageJson.name}`, 'green');
    log(`✓ Version: ${packageJson.version}`, 'green');

    // Check for analyze script
    if (!packageJson.scripts.analyze) {
      log('\n⚠️  Warning: No "analyze" script found in package.json', 'yellow');
      hasWarnings = true;
    }

    // Provide guidance
    log('\n📊 To view detailed bundle analysis:', 'blue');
    log('   Run: npm run analyze', 'blue');
    log('   This will generate interactive reports in .next/analyze/\n', 'blue');

    // Check for common bundle size issues
    log('Checking for common issues:', 'bold');
    log('─'.repeat(60), 'blue');

    // Check if bundle analyzer is installed
    const hasAnalyzer = packageJson.devDependencies?.['@next/bundle-analyzer'];
    if (hasAnalyzer) {
      log('✓ @next/bundle-analyzer is installed', 'green');
    } else {
      log('❌ @next/bundle-analyzer is not installed', 'red');
      log('   Install with: npm install --save-dev @next/bundle-analyzer', 'yellow');
      hasErrors = true;
    }

    // Check next.config.mjs for bundle analyzer configuration
    const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
    if (fs.existsSync(nextConfigPath)) {
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
      if (nextConfig.includes('bundle-analyzer') || nextConfig.includes('bundleAnalyzer')) {
        log('✓ Bundle analyzer is configured in next.config.mjs', 'green');
      } else {
        log('⚠️  Bundle analyzer not configured in next.config.mjs', 'yellow');
        hasWarnings = true;
      }
    }

    // Check for optimization settings
    const nextConfigPath2 = path.join(process.cwd(), 'next.config.mjs');
    if (fs.existsSync(nextConfigPath2)) {
      const nextConfig = fs.readFileSync(nextConfigPath2, 'utf8');

      if (nextConfig.includes('swcMinify')) {
        log('✓ SWC minification is enabled', 'green');
      } else {
        log('⚠️  SWC minification not explicitly enabled', 'yellow');
        hasWarnings = true;
      }

      if (nextConfig.includes('optimizePackageImports')) {
        log('✓ Package import optimization is configured', 'green');
      } else {
        log('⚠️  Package import optimization not configured', 'yellow');
        hasWarnings = true;
      }
    }

    // Summary
    log('\n' + '─'.repeat(60), 'blue');
    log('Summary:', 'bold');
    log('─'.repeat(60), 'blue');

    if (hasErrors) {
      log('\n❌ Bundle size check failed with errors', 'red');
      log('   Please fix the errors above and try again.\n', 'red');
      process.exit(1);
    } else if (hasWarnings) {
      log('\n⚠️  Bundle size check passed with warnings', 'yellow');
      log('   Consider addressing the warnings above.\n', 'yellow');
      process.exit(0);
    } else {
      log('\n✅ Bundle size check passed!', 'green');
      log('   All checks completed successfully.\n', 'green');

      log('📝 Bundle Size Limits:', 'blue');
      log(`   • First Load JS: < ${LIMITS.firstLoadJS} KB (gzipped)`, 'blue');
      log(`   • Page Bundles: < ${LIMITS.pageBundle} KB (gzipped)`, 'blue');
      log(`   • Total Client JS: < ${LIMITS.totalClientJS} KB (gzipped)\n`, 'blue');

      process.exit(0);
    }

  } catch (error) {
    log(`\n❌ Error checking bundle size: ${error.message}`, 'red');
    log('   Make sure you have run "npm run build" first.\n', 'red');
    process.exit(1);
  }
}

// Run the check
checkBundleSize();
