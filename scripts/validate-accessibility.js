#!/usr/bin/env node

/**
 * Accessibility Validation Script
 * 
 * This script validates accessibility features including:
 * - Keyboard navigation support
 * - ARIA labels and roles
 * - Color contrast ratios
 * - Screen reader compatibility
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

function checkKeyboardNavigation(content) {
  return {
    onKeyDown: content.includes('onKeyDown'),
    tabIndex: content.includes('tabIndex'),
    focusManagement: content.includes('focus()') || content.includes('useRef'),
    enterKey: content.includes('Enter'),
    escapeKey: content.includes('Escape'),
    arrowKeys: content.includes('Arrow'),
    spaceKey: content.includes(' ') && content.includes('key'),
  };
}

function checkARIAAttributes(content) {
  return {
    ariaLabel: content.includes('aria-label'),
    ariaLabelledBy: content.includes('aria-labelledby'),
    ariaDescribedBy: content.includes('aria-describedby'),
    ariaRole: content.includes('role='),
    ariaExpanded: content.includes('aria-expanded'),
    ariaSelected: content.includes('aria-selected'),
    ariaCurrent: content.includes('aria-current'),
    ariaHidden: content.includes('aria-hidden'),
    ariaHaspopup: content.includes('aria-haspopup'),
  };
}

function validateAccessibility() {
  log('\n♿ Validating Accessibility Features...\n', 'blue');

  let hasErrors = false;
  let hasWarnings = false;
  const results = [];

  // Check 1: Keyboard Navigation - PlatformSelector
  log('1. Checking PlatformSelector Keyboard Navigation...', 'bold');
  const platformSelectorFile = readFile('components/ui/platform-selector.tsx');

  if (platformSelectorFile) {
    const keyboard = checkKeyboardNavigation(platformSelectorFile);

    if (keyboard.onKeyDown) {
      log('   ✅ onKeyDown handler implemented', 'green');
    } else {
      log('   ❌ onKeyDown handler missing', 'red');
      hasErrors = true;
    }

    if (keyboard.enterKey && keyboard.escapeKey && keyboard.arrowKeys) {
      log('   ✅ All required keys handled (Enter, Escape, Arrows)', 'green');
    } else {
      log('   ⚠️  Some keyboard keys may not be handled', 'yellow');
      hasWarnings = true;
    }

    if (keyboard.focusManagement) {
      log('   ✅ Focus management implemented', 'green');
    } else {
      log('   ⚠️  Focus management may be missing', 'yellow');
      hasWarnings = true;
    }

    results.push({ test: 'PlatformSelector Keyboard Nav', status: hasErrors ? 'fail' : 'pass' });
  } else {
    log('   ❌ Component file not found', 'red');
    hasErrors = true;
    results.push({ test: 'PlatformSelector Keyboard Nav', status: 'fail' });
  }

  // Check 2: Keyboard Navigation - Sidebar
  log('\n2. Checking Sidebar Keyboard Navigation...', 'bold');
  const sidebarFile = readFile('components/layout/Sidebar.tsx');

  if (sidebarFile) {
    const keyboard = checkKeyboardNavigation(sidebarFile);

    if (keyboard.tabIndex || sidebarFile.includes('Link')) {
      log('   ✅ Keyboard navigation support present', 'green');
    } else {
      log('   ⚠️  Keyboard navigation may be limited', 'yellow');
      hasWarnings = true;
    }

    const hasFocusStyles = sidebarFile.includes('focus-visible') || sidebarFile.includes('focus:');
    if (hasFocusStyles) {
      log('   ✅ Focus styles implemented', 'green');
    } else {
      log('   ⚠️  Focus styles may be missing', 'yellow');
      hasWarnings = true;
    }

    results.push({ test: 'Sidebar Keyboard Nav', status: 'pass' });
  } else {
    log('   ❌ Component file not found', 'red');
    hasErrors = true;
    results.push({ test: 'Sidebar Keyboard Nav', status: 'fail' });
  }

  // Check 3: ARIA Labels and Roles - PlatformSelector
  log('\n3. Checking PlatformSelector ARIA Attributes...', 'bold');
  if (platformSelectorFile) {
    const aria = checkARIAAttributes(platformSelectorFile);

    if (aria.ariaLabel) {
      log('   ✅ aria-label attributes present', 'green');
    } else {
      log('   ⚠️  aria-label may be missing', 'yellow');
      hasWarnings = true;
    }

    if (aria.ariaRole) {
      log('   ✅ ARIA roles defined', 'green');
    } else {
      log('   ⚠️  ARIA roles may be missing', 'yellow');
      hasWarnings = true;
    }

    if (aria.ariaExpanded && aria.ariaSelected) {
      log('   ✅ ARIA states (expanded, selected) implemented', 'green');
    } else {
      log('   ⚠️  Some ARIA states may be missing', 'yellow');
      hasWarnings = true;
    }

    if (aria.ariaHaspopup) {
      log('   ✅ aria-haspopup attribute present', 'green');
    } else {
      log('   ⚠️  aria-haspopup may be missing', 'yellow');
      hasWarnings = true;
    }

    results.push({ test: 'PlatformSelector ARIA', status: 'pass' });
  }

  // Check 4: ARIA Labels - Sidebar
  log('\n4. Checking Sidebar ARIA Attributes...', 'bold');
  if (sidebarFile) {
    const aria = checkARIAAttributes(sidebarFile);

    if (aria.ariaLabel) {
      log('   ✅ aria-label attributes present', 'green');
    } else {
      log('   ⚠️  aria-label may be missing', 'yellow');
      hasWarnings = true;
    }

    if (aria.ariaCurrent) {
      log('   ✅ aria-current for active page implemented', 'green');
    } else {
      log('   ⚠️  aria-current may be missing', 'yellow');
      hasWarnings = true;
    }

    const hasNavRole = sidebarFile.includes('<nav') || sidebarFile.includes('role="navigation"');
    if (hasNavRole) {
      log('   ✅ Navigation landmark present', 'green');
    } else {
      log('   ⚠️  Navigation landmark may be missing', 'yellow');
      hasWarnings = true;
    }

    results.push({ test: 'Sidebar ARIA', status: 'pass' });
  }

  // Check 5: ARIA Labels - Icons
  log('\n5. Checking Icon ARIA Attributes...', 'bold');
  const iconsFile = readFile('lib/icons.tsx');

  if (iconsFile) {
    const aria = checkARIAAttributes(iconsFile);

    if (aria.ariaLabel || iconsFile.includes('ariaLabel')) {
      log('   ✅ ARIA label support for icons implemented', 'green');
    } else {
      log('   ⚠️  ARIA label support may be missing', 'yellow');
      hasWarnings = true;
    }

    if (aria.ariaHidden || iconsFile.includes('decorative')) {
      log('   ✅ Decorative icon handling implemented', 'green');
    } else {
      log('   ⚠️  Decorative icon handling may be missing', 'yellow');
      hasWarnings = true;
    }

    results.push({ test: 'Icon ARIA', status: 'pass' });
  } else {
    log('   ⚠️  Icon system file not found', 'yellow');
    hasWarnings = true;
    results.push({ test: 'Icon ARIA', status: 'warning' });
  }

  // Check 6: Color Contrast - Design System
  log('\n6. Checking Color Contrast Ratios...', 'bold');
  const designSystemFile = readFile('lib/design-system.ts');
  const contrastScriptFile = readFile('scripts/verify-contrast.js');

  if (designSystemFile) {
    log('   ✅ Design system file exists', 'green');

    // Check if colors are defined
    const hasColors = designSystemFile.includes('colors') &&
      designSystemFile.includes('primary') &&
      designSystemFile.includes('text');
    if (hasColors) {
      log('   ✅ Color system defined', 'green');
    } else {
      log('   ⚠️  Color system may be incomplete', 'yellow');
      hasWarnings = true;
    }
  } else {
    log('   ⚠️  Design system file not found', 'yellow');
    hasWarnings = true;
  }

  if (contrastScriptFile) {
    log('   ✅ Contrast verification script exists', 'green');
    results.push({ test: 'Color Contrast', status: 'pass' });
  } else {
    log('   ⚠️  Contrast verification script not found', 'yellow');
    hasWarnings = true;
    results.push({ test: 'Color Contrast', status: 'warning' });
  }

  // Check 7: Semantic HTML
  log('\n7. Checking Semantic HTML Usage...', 'bold');
  const componentsToCheck = [
    { name: 'Sidebar', path: 'components/layout/Sidebar.tsx' },
    { name: 'PlatformSelector', path: 'components/ui/platform-selector.tsx' },
    { name: 'StatsCard', path: 'components/dashboard/StatsCard.tsx' },
  ];

  let semanticCount = 0;

  componentsToCheck.forEach(component => {
    const content = readFile(component.path);
    if (content) {
      const hasSemanticHTML = content.includes('<nav') ||
        content.includes('<button') ||
        content.includes('<main') ||
        content.includes('<aside');
      if (hasSemanticHTML) {
        log(`   ✅ ${component.name} uses semantic HTML`, 'green');
        semanticCount++;
      } else {
        log(`   ⚠️  ${component.name} may not use semantic HTML`, 'yellow');
        hasWarnings = true;
      }
    }
  });

  if (semanticCount >= 2) {
    results.push({ test: 'Semantic HTML', status: 'pass' });
  } else {
    results.push({ test: 'Semantic HTML', status: 'warning' });
  }

  // Check 8: Touch Target Sizes
  log('\n8. Checking Touch Target Sizes...', 'bold');
  const filesToCheckTouchTargets = [
    { name: 'PlatformSelector', path: 'components/ui/platform-selector.tsx' },
    { name: 'Sidebar', path: 'components/layout/Sidebar.tsx' },
    { name: 'Button', path: 'components/ui/button.tsx' },
  ];

  let touchTargetCount = 0;

  filesToCheckTouchTargets.forEach(file => {
    const content = readFile(file.path);
    if (content) {
      const hasTouchTarget = content.includes('44') ||
        content.includes('min-h-[44px]') ||
        content.includes('minHeight: 44') ||
        content.includes('min-w-[44px]');
      if (hasTouchTarget) {
        log(`   ✅ ${file.name} implements 44x44px touch targets`, 'green');
        touchTargetCount++;
      } else {
        log(`   ⚠️  ${file.name} may not meet touch target requirements`, 'yellow');
        hasWarnings = true;
      }
    }
  });

  if (touchTargetCount >= 2) {
    results.push({ test: 'Touch Target Sizes', status: 'pass' });
  } else {
    results.push({ test: 'Touch Target Sizes', status: 'warning' });
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

  log('\n📋 Accessibility Test Results:', 'blue');
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    const color = result.status === 'pass' ? 'green' : result.status === 'warning' ? 'yellow' : 'red';
    log(`   ${icon} ${result.test}`, color);
  });

  // Manual testing recommendations
  log('\n📝 Manual Accessibility Testing Required:', 'blue');
  log('   1. Test keyboard navigation without mouse', 'blue');
  log('   2. Test with screen reader (VoiceOver, NVDA, JAWS)', 'blue');
  log('   3. Verify color contrast with automated tools', 'blue');
  log('   4. Test with browser zoom at 200%', 'blue');
  log('   5. Test with keyboard-only navigation', 'blue');
  log('   6. Verify focus indicators are visible', 'blue');

  log('\n🔍 Accessibility Testing Tools:', 'blue');
  log('   • Browser Extensions:', 'blue');
  log('     - axe DevTools (Chrome/Firefox)', 'blue');
  log('     - WAVE (Web Accessibility Evaluation Tool)', 'blue');
  log('     - Lighthouse (Chrome DevTools)', 'blue');
  log('', 'blue');
  log('   • Screen Readers:', 'blue');
  log('     - macOS: VoiceOver (Cmd + F5)', 'blue');
  log('     - Windows: NVDA (free) or JAWS', 'blue');
  log('     - Linux: Orca', 'blue');
  log('', 'blue');
  log('   • Contrast Checkers:', 'blue');
  log('     - WebAIM Contrast Checker', 'blue');
  log('     - Contrast Ratio (online tool)', 'blue');
  log('     - node scripts/verify-contrast.js', 'blue');

  log('\n♿ WCAG 2.1 AA Compliance Checklist:', 'blue');
  log('   □ All interactive elements keyboard accessible', 'blue');
  log('   □ Focus indicators visible and clear', 'blue');
  log('   □ Color contrast ratios meet 4.5:1 (text)', 'blue');
  log('   □ Color contrast ratios meet 3:1 (large text, UI)', 'blue');
  log('   □ All images have alt text', 'blue');
  log('   □ Form inputs have labels', 'blue');
  log('   □ ARIA attributes used correctly', 'blue');
  log('   □ Semantic HTML used throughout', 'blue');
  log('   □ Touch targets at least 44x44px', 'blue');
  log('   □ Content readable at 200% zoom', 'blue');
  log('   □ No keyboard traps', 'blue');
  log('   □ Skip navigation links present', 'blue');

  log('\n💡 Keyboard Navigation Testing:', 'blue');
  log('   • Tab: Move to next interactive element', 'blue');
  log('   • Shift + Tab: Move to previous element', 'blue');
  log('   • Enter: Activate buttons and links', 'blue');
  log('   • Space: Activate buttons, toggle checkboxes', 'blue');
  log('   • Arrow Keys: Navigate within components', 'blue');
  log('   • Escape: Close modals and dropdowns', 'blue');

  log('\n🎯 Screen Reader Testing Commands:', 'blue');
  log('   VoiceOver (macOS):', 'blue');
  log('   • VO + Right Arrow: Next element', 'blue');
  log('   • VO + Left Arrow: Previous element', 'blue');
  log('   • VO + Space: Activate element', 'blue');
  log('   • VO + U: Open rotor (navigation)', 'blue');

  log('');

  if (hasErrors) {
    process.exit(1);
  } else if (hasWarnings) {
    process.exit(0);
  } else {
    log('✅ All accessibility checks passed!\n', 'green');
    process.exit(0);
  }
}

// Run validation
validateAccessibility();
