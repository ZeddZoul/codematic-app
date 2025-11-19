# Lottie and Live Timing Fixes

## ✅ Issues Fixed

### 1. **Lottie Animation Loading**
**Problem**: Code was trying to load brown Lottie first, then falling back to JSON
**Solution**: Use JSON as the primary animation source

**Before:**
```typescript
// First try to load the brown Lottie file
const brownResponse = await fetch('/loadingbrown.lottie');
// ... fallback to JSON
```

**After:**
```typescript
// Load the JSON animation (primary choice)
const response = await fetch('/loading-animation.json');
```

### 2. **Live Timing Restoration**
**Problem**: No live progress messages because analysis completes before user sees loading screen
**Root Cause**: The flow was:
1. Start check → navigate to loading page
2. API completes (18+ seconds) → navigate to results page
3. By then, analysis is already done, so no live progress

**Solution**: Multiple improvements:
- Use real checkRunId from URL when available
- Faster polling (1 second instead of 2)
- Brief simulation for completed analyses

### 3. **Better CheckRunId Handling**
**Before:**
```typescript
const realCheckRunId = repoInfo?.checkRunId; // Only from sessionStorage
```

**After:**
```typescript
const realCheckRunId = !isTemporaryId ? params.checkRunId as string : repoInfo?.checkRunId;
// Use URL checkRunId if not temporary, otherwise sessionStorage
```

### 4. **Quick Simulation for Completed Analyses**
Added a brief 3-second simulation when real-time sync isn't available:
```typescript
updateMessage("Themis is starting analysis...", 200);
updateMessage("Themis is checking compliance rules...", 800);
updateMessage("Themis is analyzing issues...", 1400);
updateMessage("Analysis complete!", 2000);
```

## Expected Behavior Now

### **During Analysis (Live Progress):**
1. User starts check
2. Navigates to loading page with real checkRunId
3. Progress API shows live updates every 1 second
4. Messages sync with actual backend progress
5. Completes when analysis finishes

### **After Analysis (Quick Simulation):**
1. User navigates to results page
2. Analysis is already complete
3. Shows quick 3-second message progression
4. Navigates to results

## Benefits

✅ **Cleaner Code**: Removed redundant brown Lottie loading logic
✅ **Live Progress**: Real-time sync works with actual checkRunId
✅ **Better UX**: Quick simulation for completed analyses
✅ **Faster Updates**: 1-second polling instead of 2 seconds
✅ **Reliable**: Works whether analysis is in progress or complete

The system now provides live timing when possible, and graceful fallback when the analysis is already done.