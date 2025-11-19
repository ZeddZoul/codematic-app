# Navigation Detection Fix

## Problem Identified

The loading page was stuck on the temporary loading ID and never navigated to the real results page, even though the analysis completed successfully.

## Root Cause Analysis

From the logs:
```
[Hybrid Engine] Analysis complete: 14 issues
[Checks API] CheckRun verification: FOUND - cmi1lv7ax0004p19dnizea9jn
Analysis complete and saved: 14 issues found
GET /check/results/loading-457777990 200 in 17ms  // Still on loading page
```

**The Issue**: The flow was:
1. Repository page completes API call
2. Stores results in `check_results` sessionStorage
3. **Removes** `check_loading` sessionStorage  
4. Calls `router.replace()` to navigate to real checkRunId
5. But loading page was only checking `check_loading` for the checkRunId
6. Since `check_loading` was removed, it never found the checkRunId to redirect

## ✅ Fix Applied

### 1. **Check Multiple Sources for CheckRunId**
The loading page now checks both `check_results` and `check_loading`:

```typescript
// Check for completed results first
const storedResults = sessionStorage.getItem('check_results');
if (storedResults) {
  const results = JSON.parse(storedResults);
  if (results.checkRunId) {
    console.log('Found completed results, redirecting to:', results.checkRunId);
    router.replace(`/check/results/${results.checkRunId}`);
    return;
  }
}

// If no results yet, check for loading info with checkRunId
const loadingInfo = sessionStorage.getItem('check_loading');
if (loadingInfo) {
  const info = JSON.parse(loadingInfo);
  if (info.checkRunId) {
    console.log('Found checkRunId in loading info, redirecting to:', info.checkRunId);
    router.replace(`/check/results/${info.checkRunId}`);
    return;
  }
}
```

### 2. **Periodic Check for Completion**
Added a backup mechanism that checks every second for completed results:

```typescript
// For temporary loading IDs, also check periodically for completion
if (typeof params.checkRunId === 'string' && params.checkRunId.startsWith('loading-')) {
  const checkInterval = setInterval(() => {
    const storedResults = sessionStorage.getItem('check_results');
    if (storedResults) {
      const results = JSON.parse(storedResults);
      if (results.checkRunId) {
        console.log('Periodic check found results, redirecting to:', results.checkRunId);
        clearInterval(checkInterval);
        router.replace(`/check/results/${results.checkRunId}`);
      }
    }
  }, 1000); // Check every second
}
```

### 3. **Enhanced Logging**
Added console logs to track the navigation process:
- When results are found
- When checkRunId is detected
- When redirects happen

## Expected Flow Now

1. **User starts check** → Navigate to `/check/results/loading-{repoId}`
2. **API call runs** → Analysis happens in background (6-18 seconds)
3. **API completes** → Stores results in `check_results`, calls `router.replace()`
4. **Loading page detects** → Checks `check_results` for checkRunId
5. **Immediate redirect** → Navigate to `/check/results/{real-checkRunId}`
6. **Results display** → Show the 14 issues found

## Backup Mechanisms

- **Primary**: Check sessionStorage on page load
- **Secondary**: Periodic check every 1 second
- **Timeout**: Stop checking after 30 seconds
- **Cleanup**: Clear intervals properly

## Benefits

✅ **Reliable Navigation**: Multiple ways to detect completion
✅ **Fast Response**: Immediate redirect when results are ready
✅ **No Stuck Pages**: Periodic check ensures navigation happens
✅ **Better Debugging**: Console logs show what's happening
✅ **Graceful Cleanup**: Intervals are properly cleared

The loading page should now immediately navigate to the results page as soon as the analysis completes.