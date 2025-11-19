# Route Conflict Fix

## Problem Identified

Next.js was throwing a routing error:
```
Error: You cannot use different slug names for the same dynamic path ('checkRunId' !== 'id').
```

## Root Cause

There were two conflicting dynamic routes under `/api/v1/checks/`:

1. **`app/api/v1/checks/[checkRunId]/progress/route.ts`** - Progress API
2. **`app/api/v1/checks/[id]/route.ts`** - Check results API

Both routes were at the same level (`/api/v1/checks/[param]`) but used different parameter names (`checkRunId` vs `id`). Next.js doesn't allow this because it can't determine which route to match.

## ✅ Solution Applied

### 1. **Consolidated Route Structure**
Moved the progress API under the existing `[id]` route:
- **Before**: `/api/v1/checks/[checkRunId]/progress/`
- **After**: `/api/v1/checks/[id]/progress/`

### 2. **Updated Parameter Names**
Changed the progress API to use consistent parameter naming:
```typescript
// Before
{ params }: { params: { checkRunId: string } }

// After  
{ params }: { params: { id: string } }
```

### 3. **File Structure Changes**
```
app/api/v1/checks/
├── [id]/
│   ├── route.ts          # Get check results
│   └── progress/
│       └── route.ts      # Get progress (moved here)
├── bulk-delete/
├── history/
└── route.ts              # Create new check
```

## Benefits

✅ **No More Route Conflicts**: Single consistent parameter naming
✅ **Cleaner API Structure**: Progress is a sub-resource of check results
✅ **Consistent URLs**: Both `/api/v1/checks/{id}` and `/api/v1/checks/{id}/progress` use the same ID
✅ **Better Organization**: Related endpoints are grouped together

## API Endpoints

The API structure is now:
- **POST** `/api/v1/checks` - Create new check
- **GET** `/api/v1/checks/{id}` - Get check results  
- **GET** `/api/v1/checks/{id}/progress` - Get check progress
- **DELETE** `/api/v1/checks/bulk-delete` - Delete multiple checks

## No Breaking Changes

The frontend code didn't need to change because:
- The URL path remains the same: `/api/v1/checks/{id}/progress`
- Only the internal parameter name changed from `checkRunId` to `id`
- The API response format is identical

This fix resolves the Next.js routing conflict while maintaining a clean, RESTful API structure.