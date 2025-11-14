#!/usr/bin/env node

/**
 * Master Validation Script
 * 
 * Runs all validation scripts for the UI optimization enhancements:
 * - TanStack Query integration
 * - UI components
 * - Performance optimizations
 * - Accessibility features
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runScript(scriptName, description) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`Running: ${description}`, 'bold');
  log('='.repeat(60), 'cyan');

  try {
    execSync(`node ${scriptName}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    return { name: description, status: 'pass' };
  } catch (error) {
    return { name: description, status: 'fail', error };
  }
}

function main() {
  log('\n🚀 Running All Validation Scripts...', 'bold');
  log('This will validate all UI optimization enhancements\n', 'blue');

  const scripts = [
    {
      name: 'scripts/validate-tanstack-query.js',
      description: 'TanStack Query Integration'
    },
    {
      name: 'scripts/validate-ui-components.js',
      description: 'UI Components'
    },
    {
      name: 'scripts/validate-performance.js',
      description: 'Performance Optimizations'
    },
    {
      name: 'scripts/validate-accessibility.js',
      description: 'Accessibility Features'
    }
  ];

  const results = [];

  for (const script of scripts) {
    const result = runScript(script.name, script.description);
    results.push(result);
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('VALIDATION SUMMARY', 'bold');
  log('='.repeat(60), 'cyan');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;

  log('');
  results.forEach(result => {
    if (result.status === 'pass') {
      log(`✅ ${result.name}`, 'green');
    } else {
      log(`❌ ${result.name}`, 'red');
    }
  });

  log('');
  log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`, 'bold');

  if (failed > 0) {
    log('\n❌ Some validations failed. Please review the output above.', 'red');
    process.exit(1);
  } else {
    log('\n✅ All validations passed successfully!', 'green');
    log('\n📝 Next Steps:', 'blue');
    log('   1. Review the testing documentation in docs/testing-validation.md', 'blue');
    log('   2. Perform manual testing as outlined in each validation', 'blue');
    log('   3. Run production build and bundle analysis:', 'blue');
    log('      npm run build && npm run analyze', 'blue');
    log('   4. Test with real users and gather feedback', 'blue');
    log('');
    process.exit(0);
  }
}

main();
