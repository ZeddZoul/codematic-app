/**
 * Color Contrast Verification Script
 * Verifies WCAG AA compliance for all color combinations in the design system
 */

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Calculate relative luminance
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG AA requires 4.5:1 for normal text, 3:1 for large text
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;

// Design system colors
const colors = {
  primary: {
    accent: '#8D240C',
    accentHover: '#A12A0E',
    accentActive: '#741F0A',
  },
  background: {
    main: '#FFFFFF',
    subtle: '#F8F9FA',
  },
  text: {
    primary: '#122438',
    secondary: '#4A6C7A',
  },
  status: {
    success: '#0B7A54',
    warning: '#A36802',
    error: '#C62828',
    info: '#1565C0',
  },
};

// Test combinations
const tests = [
  // Text on backgrounds
  { fg: colors.text.primary, bg: colors.background.main, desc: 'Primary text on white', type: 'normal' },
  { fg: colors.text.primary, bg: colors.background.subtle, desc: 'Primary text on subtle bg', type: 'normal' },
  { fg: colors.text.secondary, bg: colors.background.main, desc: 'Secondary text on white', type: 'normal' },
  { fg: colors.text.secondary, bg: colors.background.subtle, desc: 'Secondary text on subtle bg', type: 'normal' },

  // Primary accent on backgrounds
  { fg: colors.primary.accent, bg: colors.background.main, desc: 'Primary accent on white', type: 'normal' },
  { fg: '#FFFFFF', bg: colors.primary.accent, desc: 'White text on primary accent', type: 'normal' },
  { fg: '#FFFFFF', bg: colors.primary.accentHover, desc: 'White text on accent hover', type: 'normal' },
  { fg: '#FFFFFF', bg: colors.primary.accentActive, desc: 'White text on accent active', type: 'normal' },

  // Status colors with white text (badges)
  { fg: '#FFFFFF', bg: colors.status.success, desc: 'White text on success badge', type: 'normal' },
  { fg: '#FFFFFF', bg: colors.status.warning, desc: 'White text on warning badge', type: 'normal' },
  { fg: '#FFFFFF', bg: colors.status.error, desc: 'White text on error badge', type: 'normal' },
  { fg: '#FFFFFF', bg: colors.status.info, desc: 'White text on info badge', type: 'normal' },
];

console.log('\n=== WCAG AA Color Contrast Verification ===\n');
console.log('Required ratios:');
console.log('  Normal text: 4.5:1');
console.log('  Large text: 3.0:1\n');

let allPassed = true;

tests.forEach(test => {
  const ratio = getContrastRatio(test.fg, test.bg);
  const required = test.type === 'large' ? WCAG_AA_LARGE : WCAG_AA_NORMAL;
  const passed = ratio >= required;

  if (!passed) allPassed = false;

  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(`${color}${status}${reset} ${test.desc}`);
  console.log(`     Ratio: ${ratio.toFixed(2)}:1 (required: ${required}:1)`);
  console.log(`     FG: ${test.fg} / BG: ${test.bg}\n`);
});

if (allPassed) {
  console.log('\x1b[32m✓ All color combinations pass WCAG AA!\x1b[0m\n');
  process.exit(0);
} else {
  console.log('\x1b[31m✗ Some color combinations fail WCAG AA\x1b[0m\n');
  process.exit(1);
}
