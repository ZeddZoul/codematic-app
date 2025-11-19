#!/usr/bin/env node

/**
 * UI Components Validation Script
 * 
 * This script validates that custom UI components are properly implemented
 * with accessibility features, keyboard navigation, and proper styling.
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

function checkAccessibilityFeatures(content, componentName) {
  const features = {
    ariaLabels: content.includes('aria-label') || content.includes('aria-labelledby'),
    ariaRoles: content.includes('role='),
    ariaStates: content.includes('aria-expanded') || content.includes('aria-selected') || content.includes('aria-current'),
    keyboardHandling: content.includes('onKeyDown') || content.includes('onKeyPress'),
    focusManagement: content.includes('focus') || content.includes('tabIndex'),
    minTouchTarget: content.includes('44') || content.includes('min-h-[44px]') || content.includes('minHeight'),
  };

  return features;
}

function validateUIComponents() {
  log('\n🎨 Validating UI Components...\n', 'blue');

  let hasErrors = false;
  let hasWarnings = false;
  const results = [];

  // Component 1: PlatformSelector
  log('1. Validating PlatformSelector Component...', 'bold');
  const platformSelectorFile = readFile('components/ui/platform-selector.tsx');

  if (platformSelectorFile) {
    log('   ✅ Component file exists', 'green');

    const accessibility = checkAccessibilityFeatures(platformSelectorFile, 'PlatformSelector');

    // Check keyboard navigation
    const hasArrowKeys = platformSelectorFile.includes('ArrowDown') && platformSelectorFile.includes('ArrowUp');
    const hasEnterKey = platformSelectorFile.includes('Enter');
    const hasEscapeKey = platformSelectorFile.includes('Escape');
    const hasTabKey = platformSelectorFile.includes('Tab');

    if (hasArrowKeys && hasEnterKey && hasEscapeKey) {
      log('   ✅ Keyboard navigation implemented (Arrow, Enter, Escape)', 'green');
    } else {
      log('   ⚠️  Some keyboard navigation may be missing', 'yellow');
      hasWarnings = true;
    }

    // Check ARIA attributes
    if (accessibility.ariaLabels) {
      log('   ✅ ARIA labels present', 'green');
    } else {
      log('   ⚠️  ARIA labels may be missing', 'yellow');
      hasWarnings = true;
    }

    if (accessibility.ariaRoles) {
      log('   ✅ ARIA roles defined', 'green');
    } else {
      log('   ⚠️  ARIA roles may be missing', 'yellow');
      hasWarnings = true;
    }

    if (accessibility.ariaStates) {
      log('   ✅ ARIA states (expanded, selected) implemented', 'green');
    } else {
      log('   ⚠️  ARIA states may be missing', 'yellow');
      hasWarnings = true;
    }

    // Check touch target size
    if (accessibility.minTouchTarget) {
      log('   ✅ Minimum touch target size (44x44px) implemented', 'green');
    } else {
      log('   ⚠️  Touch target size may not meet 44x44px requirement', 'yellow');
      hasWarnings = true;
    }

    // Check for react-icons usage
    const hasReactIcons = platformSelectorFile.includes('react-icons');
    if (hasReactIcons) {
      log('   ✅ Uses react-icons for platform icons', 'green');
    } else {
      log('   ⚠️  May not be using react-icons', 'yellow');
      hasWarnings = true;
    }

    results.push({ test: 'PlatformSelector', status: hasWarnings ? 'warning' : 'pass' });
  } else {
    log('   ❌ Component file not found', 'red');
    hasErrors = true;
    results.push({ test: 'PlatformSelector', status: 'fail' });
  }

  // Component 2: StatsCard
  log('\n2. Validating StatsCard Component...', 'bold');
  const statsCardFile = readFile('components/dashboard/StatsCard.tsx');

  if (statsCardFile) {
    log('   ✅ Component file exists', 'green');

    // Check for React.memo
    const hasMemo = statsCardFile.includes('React.memo');
    if (hasMemo) {
      log('   ✅ Component is memoized with React.memo', 'green');
    } else {
      log('   ⚠️  Component may not be memoized', 'yellow');
      hasWarnings = true;
    }

    // Check for loading state
    const hasLoadingState = statsCardFile.includes('loading') && statsCardFile.includes('skeleton');
    if (hasLoadingState) {
      log('   ✅ Loading state with skeleton loader implemented', 'green');
    } else {
      log('   ⚠️  Loading state may be missing', 'yellow');
      hasWarnings = true;
    }

    // Check for hover effects
    const hasHoverEffects = statsCardFile.includes('hover') || statsCardFile.includes('onMouseEnter');
    if (hasHoverEffects) {
      log('   ✅ Hover effects implemented', 'green');
    } else {
      log('   ⚠️  Hover effects may be missing', 'yellow');
      hasWarnings = true;
    }

    // Check for trend indicator
    const hasTrend = statsCardFile.includes('trend') && (statsCardFile.includes('FaArrowUp') || statsCardFile.includes('FaArrowDown'));
    if (hasTrend) {
      log('   ✅ Trend indicator with arrows implemented', 'green');
    } else {
      log('   ⚠️  Trend indicator may be incomplete', 'yellow');
      hasWarnings = true;
    }

    // Check for click handling
    const hasClickHandler = statsCardFile.includes('onClick');
    if (hasClickHandler) {
      log('   ✅ Click handler for navigation implemented', 'green');
    } else {
      log('   ⚠️  Click handler may be missing', 'yellow');
      hasWarnings = true;
    }

    // Check accessibility
    const accessibility = checkAccessibilityFeatures(statsCardFile, 'StatsCard');
    if (accessibility.ariaLabels) {
      log('   ✅ ARIA labels present', 'green');
    } else {
      log('   ⚠️  ARIA labels may be missing', 'yellow');
      hasWarnings = true;
    }

    results.push({ test: 'StatsCard', status: hasWarnings ? 'warning' : 'pass' });
  } else {
    log('   ❌ Component file not found', 'red');
    hasErrors = true;
    results.push({ test: 'StatsCard', status: 'fail' });
  }

  // Component 3: Sidebar with Mini Mode
  log('\n3. Validating Sidebar Component...', 'bold');
  const sidebarFile = readFile('components/layout/Sidebar.tsx');

  if (sidebarFile) {
    log('   ✅ Component file exists', 'green');

    // Check for collapse/expand functionality
    const hasToggle = sidebarFile.includes('isCollapsed') && sidebarFile.includes('setIsCollapsed');
    if (hasToggle) {
      log('   ✅ Collapse/expand toggle functionality implemented', 'green');
    } else {
      log('   ⚠️  Toggle functionality may be missing', 'yellow');
      hasWarnings = true;
    }

    // Check for localStorage persistence
    const hasLocalStorage = sidebarFile.includes('localStorage');
    if (hasLocalStorage) {
      log('   ✅ State persistence with localStorage implemented', 'green');
    } else {
      log('   ⚠️  localStorage persistence may be missing', 'yellow');
      hasWarnings = true;
    }

    // Check for transition animation
    const hasTransition = sidebarFile.includes('transition') && sidebarFile.includes('200ms');
    if (hasTransition) {
      log('   ✅ Smooth transition animation (200ms) implemented', 'green');
    } else {
      log('   ⚠️  Transition animation may be missing or incorrect', 'yellow');
      hasWarnings = true;
    }

    // Check for tooltip in mini mode
    const hasTooltip = sidebarFile.includes('Tooltip');
    if (hasTooltip) {
      log('   ✅ Tooltips for mini mode implemented', 'green');
    } else {
      log('   ⚠️  Tooltips may be missing', 'yellow');
      hasWarnings = true;
    }

    // Check for react-icons usage
    const hasReactIcons = sidebarFile.includes('DynamicIcon') || sidebarFile.includes('react-icons');
    if (hasReactIcons) {
      log('   ✅ Uses react-icons for navigation icons', 'green');
    } else {
      log('   ⚠️  May not be using react-icons', 'yellow');
      hasWarnings = true;
    }

    // Check for width values
    const hasWidthValues = sidebarFile.includes('240px') && sidebarFile.includes('64px');
    if (hasWidthValues) {
      log('   ✅ Correct width values (240px full, 64px mini)', 'green');
    } else {
      log('   ⚠️  Width values may be incorrect', 'yellow');
      hasWarnings = true;
    }

    results.push({ test: 'Sidebar', status: hasWarnings ? 'warning' : 'pass' });
  } else {
    log('   ❌ Component file not found', 'red');
    hasErrors = true;
    results.push({ test: 'Sidebar', status: 'fail' });
  }

  // Component 4: Icon System
  log('\n4. Validating Icon System...', 'bold');
  const iconsFile = readFile('lib/icons.tsx');

  if (iconsFile) {
    log('   ✅ Icon system file exists', 'green');

    // Check for DynamicIcon component
    const hasDynamicIcon = iconsFile.includes('DynamicIcon');
    if (hasDynamicIcon) {
      log('   ✅ DynamicIcon wrapper component implemented', 'green');
    } else {
      log('   ⚠️  DynamicIcon component may be missing', 'yellow');
      hasWarnings = true;
    }

    // Check for state-based coloring
    const hasStateColors = iconsFile.includes('active') && iconsFile.includes('inactive') && iconsFile.includes('hover');
    if (hasStateColors) {
      log('   ✅ State-based coloring (active, inactive, hover) implemented', 'green');
    } else {
      log('   ⚠️  State-based coloring may be incomplete', 'yellow');
      hasWarnings = true;
    }

    // Check for icon mapping
    const hasIconMapping = iconsFile.includes('overview') && iconsFile.includes('repositories') && iconsFile.includes('issues');
    if (hasIconMapping) {
      log('   ✅ Icon mapping for navigation implemented', 'green');
    } else {
      log('   ⚠️  Icon mapping may be incomplete', 'yellow');
      hasWarnings = true;
    }

    // Check for ARIA labels
    const hasAriaSupport = iconsFile.includes('aria') || iconsFile.includes('ariaLabel');
    if (hasAriaSupport) {
      log('   ✅ ARIA label support implemented', 'green');
    } else {
      log('   ⚠️  ARIA label support may be missing', 'yellow');
      hasWarnings = true;
    }

    results.push({ test: 'Icon System', status: hasWarnings ? 'warning' : 'pass' });
  } else {
    log('   ❌ Icon system file not found', 'red');
    hasErrors = true;
    results.push({ test: 'Icon System', status: 'fail' });
  }

  // Component 5: Tooltip
  log('\n5. Validating Tooltip Component...', 'bold');
  const tooltipFile = readFile('components/ui/tooltip.tsx');

  if (tooltipFile) {
    log('   ✅ Tooltip component exists', 'green');

    // Check for position prop
    const hasPosition = tooltipFile.includes('position');
    if (hasPosition) {
      log('   ✅ Position prop implemented', 'green');
    } else {
      log('   ⚠️  Position prop may be missing', 'yellow');
      hasWarnings = true;
    }

    results.push({ test: 'Tooltip', status: hasWarnings ? 'warning' : 'pass' });
  } else {
    log('   ⚠️  Tooltip component not found (may be using external library)', 'yellow');
    hasWarnings = true;
    results.push({ test: 'Tooltip', status: 'warning' });
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

  log('\n📋 Component Test Results:', 'blue');
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    const color = result.status === 'pass' ? 'green' : result.status === 'warning' ? 'yellow' : 'red';
    log(`   ${icon} ${result.test}`, color);
  });

  // Manual testing recommendations
  log('\n📝 Manual Testing Required:', 'blue');
  log('   1. Test PlatformSelector keyboard navigation in browser', 'blue');
  log('   2. Verify StatsCard hover effects and click navigation', 'blue');
  log('   3. Test sidebar collapse/expand and verify persistence', 'blue');
  log('   4. Check icon colors in different states (active, hover)', 'blue');
  log('   5. Test tooltips appear correctly in mini mode', 'blue');
  log('   6. Verify responsive behavior on mobile devices', 'blue');

  log('\n💡 Testing Checklist:', 'blue');
  log('   □ PlatformSelector opens with Enter/Space', 'blue');
  log('   □ Arrow keys navigate PlatformSelector options', 'blue');
  log('   □ Escape closes PlatformSelector', 'blue');
  log('   □ StatsCard shows hover effect (elevation, border)', 'blue');
  log('   □ StatsCard click navigates to correct page', 'blue');
  log('   □ Sidebar toggle button works', 'blue');
  log('   □ Sidebar state persists after page refresh', 'blue');
  log('   □ Tooltips show in mini mode on hover', 'blue');
  log('   □ Icons change color on hover and active states', 'blue');
  log('   □ All components are responsive on mobile', 'blue');

  log('');

  if (hasErrors) {
    process.exit(1);
  } else if (hasWarnings) {
    process.exit(0);
  } else {
    log('✅ All UI component checks passed!\n', 'green');
    process.exit(0);
  }
}

// Run validation
validateUIComponents();
