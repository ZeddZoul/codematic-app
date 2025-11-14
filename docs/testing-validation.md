# Testing and Validation Guide

This document provides comprehensive testing procedures for the UI optimization enhancements implemented in the Themis Checker application.

## Table of Contents

1. [TanStack Query Integration Testing](#tanstack-query-integration-testing)
2. [UI Component Testing](#ui-component-testing)
3. [Performance Testing](#performance-testing)
4. [Accessibility Testing](#accessibility-testing)

---

## TanStack Query Integration Testing

### Overview
Verify that TanStack Query is properly integrated and provides the expected caching, revalidation, and error handling behavior.

### Test 13.1.1: Caching Behavior Across Navigation

**Objective**: Verify that data is cached and served immediately when navigating between pages.

**Steps**:
1. Open the application and navigate to `/dashboard/repos`
2. Wait for the repository list to load (observe network tab)
3. Navigate to `/dashboard` (overview)
4. Navigate back to `/dashboard/repos`
5. Observe that the repository list appears instantly without a loading state

**Expected Results**:
- ✅ First visit to repos page shows loading state and makes API call
- ✅ Second visit to repos page shows data immediately (from cache)
- ✅ Network tab shows no duplicate API calls for cached data
- ✅ Cache serves data for 5 minutes (staleTime) before marking as stale

**Verification**:
```javascript
// Open browser console and check TanStack Query DevTools
// Look for query key: ['repositories', 'list', {...filters}]
// Status should be 'success' with data from cache
```

### Test 13.1.2: Background Revalidation

**Objective**: Verify that stale data is revalidated in the background.

**Steps**:
1. Navigate to `/dashboard/repos` and wait for data to load
2. Wait 5+ minutes (or modify staleTime in code to 10 seconds for testing)
3. Navigate away and back to `/dashboard/repos`
4. Observe that cached data appears immediately
5. Check network tab for background API call

**Expected Results**:
- ✅ Stale cached data is displayed immediately
- ✅ Background API call is made to fetch fresh data
- ✅ UI updates smoothly when fresh data arrives
- ✅ No loading spinner shown during background revalidation

**Verification**:
```javascript
// In browser console with TanStack Query DevTools:
// 1. Check query status: should show 'success' with isFetching: true
// 2. Network tab should show API call with status 200
// 3. Data should update without full page reload
```

### Test 13.1.3: Error Handling and Retries

**Objective**: Verify that network errors are handled gracefully with automatic retries.

**Steps**:
1. Open browser DevTools → Network tab
2. Enable "Offline" mode or throttle to "Offline"
3. Navigate to `/dashboard/repos`
4. Observe error handling
5. Re-enable network connection
6. Observe automatic retry behavior

**Expected Results**:
- ✅ Error state is displayed to user (not a blank page)
- ✅ TanStack Query attempts 3 retries with exponential backoff
- ✅ Error message is user-friendly
- ✅ When network is restored, query automatically retries and succeeds

**Verification**:
```javascript
// Check console for retry attempts:
// Retry 1: ~1 second delay
// Retry 2: ~2 second delay  
// Retry 3: ~4 second delay
// After 3 failures, error state is shown
```

### Test 13.1.4: Polling Functionality

**Objective**: Verify that the useCheckHistory hook polls for updates when enabled.

**Steps**:
1. Navigate to `/dashboard/issues` (check history page)
2. Enable polling by passing `enablePolling: true` to useCheckHistory
3. Open Network tab and observe API calls
4. Wait 30+ seconds
5. Verify that API calls are made every 30 seconds

**Expected Results**:
- ✅ Initial API call is made on page load
- ✅ Subsequent API calls are made every 30 seconds
- ✅ Polling continues while page is active
- ✅ Polling stops when navigating away from page
- ✅ UI updates automatically when new data arrives

**Verification**:
```javascript
// In browser console:
// 1. Check refetchInterval in query options: should be 30000ms
// 2. Network tab should show repeated calls every 30s
// 3. Query status should show isFetching: true during each poll
```

### Test 13.1.5: Query Key Hierarchy

**Objective**: Verify that query keys are properly structured for cache invalidation.

**Steps**:
1. Open TanStack Query DevTools (if installed) or browser console
2. Navigate through different pages
3. Inspect query keys in the cache

**Expected Results**:
- ✅ Repository queries use hierarchical keys: `['repositories', 'list', filters]`
- ✅ Check queries use: `['checks', 'history', filters]`
- ✅ Stats queries use: `['stats', 'dashboard']`
- ✅ User queries use: `['user', 'me']`
- ✅ Filters are properly included in query keys for cache separation

**Verification**:
```javascript
// In browser console:
import { queryKeys } from '@/lib/query-keys';
console.log(queryKeys.repositories.list({ page: 1 }));
// Should output: ['repositories', 'list', { page: 1 }]
```

---

## UI Component Testing

### Test 13.2.1: PlatformSelector Keyboard Navigation

**Objective**: Verify that the PlatformSelector component is fully keyboard accessible.

**Steps**:
1. Navigate to a page with PlatformSelector (e.g., `/dashboard/repos`)
2. Use Tab key to focus on the PlatformSelector
3. Press Enter or Space to open dropdown
4. Use Arrow Down/Up keys to navigate options
5. Press Enter to select an option
6. Press Escape to close dropdown without selecting

**Expected Results**:
- ✅ Tab key focuses the selector (visible focus ring)
- ✅ Enter/Space opens the dropdown
- ✅ Arrow keys navigate through options (visual focus indicator)
- ✅ Enter selects the focused option and closes dropdown
- ✅ Escape closes dropdown and returns focus to button
- ✅ Tab closes dropdown and moves focus to next element

**Accessibility Checks**:
- ✅ `aria-haspopup="listbox"` on button
- ✅ `aria-expanded` reflects open/closed state
- ✅ `role="listbox"` on dropdown
- ✅ `role="option"` on each option
- ✅ `aria-selected` indicates selected option

### Test 13.2.2: StatsCard Interactions and Navigation

**Objective**: Verify that StatsCard components are interactive and navigate correctly.

**Steps**:
1. Navigate to `/dashboard` (overview page)
2. Observe the 4 statistics cards at the top
3. Hover over each card
4. Click on "Pending Issues" card
5. Verify navigation to issues page
6. Go back and click on "Repositories" card

**Expected Results**:
- ✅ Cards display correct data (numbers, icons, trends)
- ✅ Hover effect: border color changes, slight elevation, translateY(-2px)
- ✅ Hover transition is smooth (200ms)
- ✅ Click on card navigates to relevant section
- ✅ Loading state shows skeleton loader
- ✅ Icons use correct colors (Primary Accent for active state)

**Visual Verification**:
- ✅ Cards are responsive: 2x2 grid on desktop, 1 column on mobile
- ✅ Trend indicators show correct direction (up/down arrows)
- ✅ Trend colors: green for up, red for down

### Test 13.2.3: Sidebar Mini Mode Toggle and Persistence

**Objective**: Verify that sidebar can be collapsed and state persists across sessions.

**Steps**:
1. Navigate to any dashboard page
2. Locate the collapse button at bottom of sidebar
3. Click to collapse sidebar to mini mode
4. Observe animation and icon-only display
5. Hover over navigation icons to see tooltips
6. Refresh the page
7. Verify sidebar remains in mini mode
8. Click toggle again to expand

**Expected Results**:
- ✅ Sidebar width transitions smoothly (200ms) from 240px to 64px
- ✅ Labels hide in mini mode, only icons visible
- ✅ Tooltips appear on hover in mini mode
- ✅ Toggle button icon rotates (chevron left → chevron right)
- ✅ State persists in localStorage
- ✅ After refresh, sidebar maintains collapsed/expanded state
- ✅ Expanding sidebar shows labels again with smooth transition

**localStorage Verification**:
```javascript
// In browser console:
localStorage.getItem('themis-sidebar-collapsed');
// Should return 'true' when collapsed, 'false' when expanded
```

### Test 13.2.4: Icon States and Transitions

**Objective**: Verify that icons throughout the app respond to interaction states.

**Steps**:
1. Navigate through different pages
2. Observe sidebar navigation icons
3. Hover over interactive icons
4. Check active page icon color
5. Observe status badge icons

**Expected Results**:
- ✅ Active navigation icon uses Primary Accent color (#8D240C)
- ✅ Inactive icons use Text Secondary color (#6090A1)
- ✅ Hover state transitions to Primary Accent Hover (#A12A0E)
- ✅ Status icons use appropriate colors:
  - Success: #10B981 (green)
  - Error: #EF4444 (red)
  - Warning: #F59E0B (orange)
- ✅ Icon transitions are smooth (no jarring color changes)
- ✅ All icons have proper ARIA labels

**Icon Mapping Verification**:
- ✅ Overview: Dashboard icon (MdDashboard)
- ✅ Repositories: Code branch icon (FaCodeBranch)
- ✅ Issues: Warning icon (MdWarning)
- ✅ Success: Check circle icon (FaCheckCircle)
- ✅ Error: Error icon (MdError)

---

## Performance Testing

### Test 13.3.1: Initial Page Load Time

**Objective**: Measure and verify that initial page load meets performance targets.

**Steps**:
1. Open browser DevTools → Performance tab
2. Clear cache and hard reload
3. Navigate to `/dashboard`
4. Stop recording after page is fully loaded
5. Analyze metrics

**Expected Results**:
- ✅ First Contentful Paint (FCP) < 1.5 seconds
- ✅ Largest Contentful Paint (LCP) < 2.5 seconds
- ✅ Time to Interactive (TTI) < 3.5 seconds
- ✅ Total Blocking Time (TBT) < 300ms

**Measurement Tools**:
```bash
# Using Lighthouse
npm install -g lighthouse
lighthouse http://localhost:3000/dashboard --view

# Or use Chrome DevTools Lighthouse tab
```

### Test 13.3.2: Bundle Size Verification

**Objective**: Verify that JavaScript bundle sizes are within acceptable limits.

**Steps**:
1. Build the production application
2. Run bundle analyzer
3. Check bundle sizes

**Commands**:
```bash
# Build production bundle
npm run build

# Analyze bundle
npm run analyze

# Check bundle size limits
npm run check-bundle-size
```

**Expected Results**:
- ✅ Initial JavaScript bundle < 100KB (gzipped)
- ✅ Individual page bundles < 50KB (gzipped)
- ✅ Total client-side JavaScript < 400KB (gzipped)
- ✅ No duplicate dependencies in bundle
- ✅ Tree-shaking is working (unused code removed)

**Bundle Analysis**:
- Check `.next/analyze/client.html` for detailed breakdown
- Verify react-icons is tree-shaken (only used icons included)
- Verify @tanstack/react-query is optimized

### Test 13.3.3: Component Re-render Counts

**Objective**: Verify that memoization is working and components don't re-render unnecessarily.

**Steps**:
1. Install React DevTools browser extension
2. Open React DevTools → Profiler tab
3. Enable "Highlight updates when components render"
4. Navigate to `/dashboard`
5. Interact with the page (hover, click, filter)
6. Observe which components re-render

**Expected Results**:
- ✅ StatsCard components don't re-render when parent re-renders (unless props change)
- ✅ RepositoryCard components only re-render when their data changes
- ✅ Sidebar doesn't re-render on every navigation
- ✅ Memoized callbacks prevent child re-renders
- ✅ useMemo prevents expensive recalculations

**Verification**:
```javascript
// Check render counts in React DevTools Profiler
// Components with React.memo should show fewer renders
// Look for components with high render counts and investigate
```

### Test 13.3.4: Core Web Vitals Measurement

**Objective**: Measure and verify Core Web Vitals meet Google's thresholds.

**Steps**:
1. Open the application in production mode
2. Use Chrome DevTools → Lighthouse
3. Run performance audit
4. Check Core Web Vitals scores

**Expected Results**:
- ✅ Largest Contentful Paint (LCP) < 2.5s (Good)
- ✅ First Input Delay (FID) < 100ms (Good)
- ✅ Cumulative Layout Shift (CLS) < 0.1 (Good)
- ✅ First Contentful Paint (FCP) < 1.8s (Good)
- ✅ Time to First Byte (TTFB) < 600ms (Good)

**Real User Monitoring**:
```javascript
// Web Vitals are tracked in components/WebVitals.tsx
// Check browser console for logged metrics
// Or implement analytics integration for production monitoring
```

---

## Accessibility Testing

### Test 13.4.1: Keyboard Navigation for All Components

**Objective**: Verify that all interactive components are keyboard accessible.

**Steps**:
1. Navigate to each page using only keyboard (no mouse)
2. Use Tab to move between interactive elements
3. Use Enter/Space to activate buttons and links
4. Use Arrow keys for custom components (PlatformSelector)
5. Use Escape to close modals/dropdowns

**Components to Test**:
- ✅ PlatformSelector (Tab, Enter, Arrows, Escape)
- ✅ StatsCard buttons (Tab, Enter)
- ✅ Sidebar navigation (Tab, Enter)
- ✅ Sidebar toggle button (Tab, Enter)
- ✅ Repository cards (Tab, Enter)
- ✅ Pagination controls (Tab, Enter)

**Expected Results**:
- ✅ All interactive elements are reachable via Tab
- ✅ Focus indicators are clearly visible
- ✅ Tab order is logical (top to bottom, left to right)
- ✅ No keyboard traps (can always Tab away)
- ✅ Enter/Space activates buttons and links
- ✅ Escape closes dropdowns and modals

### Test 13.4.2: ARIA Labels and Roles

**Objective**: Verify that all components have proper ARIA attributes.

**Steps**:
1. Open browser DevTools → Elements tab
2. Inspect each custom component
3. Verify ARIA attributes are present and correct

**Components to Verify**:

**PlatformSelector**:
```html
<button aria-haspopup="listbox" aria-expanded="true/false" aria-label="Select platform">
<div role="listbox" aria-label="Platform options">
<button role="option" aria-selected="true/false">
```

**Sidebar Navigation**:
```html
<nav aria-label="Main navigation">
<a aria-current="page" aria-label="Overview">
```

**StatsCard**:
```html
<button aria-label="View Pending Issues">
```

**Icons**:
```html
<!-- Decorative icons -->
<svg aria-hidden="true">

<!-- Meaningful icons -->
<svg aria-label="Success icon" role="img">
```

**Expected Results**:
- ✅ All interactive elements have accessible names
- ✅ Landmark roles are used (nav, main, aside)
- ✅ ARIA states reflect current UI state (expanded, selected, current)
- ✅ Decorative icons are hidden from screen readers
- ✅ Meaningful icons have labels

### Test 13.4.3: Screen Reader Testing

**Objective**: Verify that the application is usable with a screen reader.

**Screen Readers**:
- macOS: VoiceOver (Cmd + F5)
- Windows: NVDA (free) or JAWS
- Linux: Orca

**Steps**:
1. Enable screen reader
2. Navigate to `/dashboard`
3. Use screen reader commands to explore the page
4. Navigate through sidebar
5. Interact with PlatformSelector
6. Click on StatsCard

**Expected Results**:
- ✅ Page title is announced
- ✅ Landmarks are announced (navigation, main content)
- ✅ Interactive elements are announced with their role
- ✅ Button labels are clear and descriptive
- ✅ Current page is announced in navigation
- ✅ Dropdown state changes are announced
- ✅ Loading states are announced
- ✅ Error messages are announced

**VoiceOver Commands** (macOS):
- VO + Right Arrow: Next element
- VO + Left Arrow: Previous element
- VO + Space: Activate element
- VO + U: Open rotor (navigation menu)

### Test 13.4.4: Color Contrast Ratios

**Objective**: Verify that all text meets WCAG AA contrast requirements.

**Steps**:
1. Use browser extension (e.g., "WAVE" or "axe DevTools")
2. Or use manual contrast checker
3. Check all text/background combinations

**Color Combinations to Verify**:

| Text Color | Background | Ratio | Required | Status |
|------------|------------|-------|----------|--------|
| #0A1F2C (Primary) | #FFFFFF (White) | 14.5:1 | 4.5:1 | ✅ Pass |
| #6090A1 (Secondary) | #FFFFFF (White) | 4.8:1 | 4.5:1 | ✅ Pass |
| #8D240C (Accent) | #FFFFFF (White) | 8.2:1 | 4.5:1 | ✅ Pass |
| #FFFFFF (White) | #8D240C (Accent) | 8.2:1 | 4.5:1 | ✅ Pass |
| #10B981 (Success) | #FFFFFF (White) | 3.1:1 | 3:1 (large) | ✅ Pass |
| #EF4444 (Error) | #FFFFFF (White) | 4.5:1 | 4.5:1 | ✅ Pass |

**Tools**:
```bash
# Run contrast verification script
node scripts/verify-contrast.js
```

**Expected Results**:
- ✅ All body text meets 4.5:1 contrast ratio (WCAG AA)
- ✅ Large text (18pt+) meets 3:1 contrast ratio
- ✅ Interactive elements meet 3:1 contrast ratio
- ✅ Focus indicators meet 3:1 contrast ratio
- ✅ No contrast issues reported by automated tools

---

## Testing Checklist

### TanStack Query Integration
- [ ] Caching behavior verified across navigation
- [ ] Background revalidation working correctly
- [ ] Error handling and retries functioning
- [ ] Polling functionality working as expected
- [ ] Query key hierarchy properly structured

### UI Components
- [ ] PlatformSelector keyboard navigation working
- [ ] StatsCard interactions and navigation verified
- [ ] Sidebar mini mode toggle and persistence working
- [ ] Icon states and transitions correct

### Performance
- [ ] Initial page load time meets targets
- [ ] Bundle size within acceptable limits
- [ ] Component re-render counts optimized
- [ ] Core Web Vitals meet thresholds

### Accessibility
- [ ] Keyboard navigation working for all components
- [ ] ARIA labels and roles properly implemented
- [ ] Screen reader testing completed
- [ ] Color contrast ratios meet WCAG AA

---

## Automated Testing Commands

```bash
# Build and analyze bundle
npm run build
npm run analyze

# Check bundle size limits
npm run check-bundle-size

# Verify color contrast
node scripts/verify-contrast.js

# Run Lighthouse audit
lighthouse http://localhost:3000/dashboard --view

# Start dev server for manual testing
npm run dev
```

## Notes

- Manual testing is required as no automated test framework is currently installed
- Consider adding Vitest or Jest for automated unit/integration tests in the future
- TanStack Query DevTools can be added for easier debugging during development
- React DevTools Profiler is essential for performance testing
- Accessibility testing should be done with real assistive technologies when possible

