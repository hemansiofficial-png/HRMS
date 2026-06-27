# Resignations & Exits - Employee Lifecycle Sync

## Issue Fixed
Resignation and Exit data was showing in the **Resignations & Exits** page but **NOT** appearing in the **Employee Lifecycle Management** page's Resignations and Exits tabs.

## Root Cause
The `LifecycleEvent` table was empty for the existing resignation records. When resignations were created via the seed script or directly in the database, the corresponding lifecycle events were not created.

## Solution Applied

### 1. Created Missing Lifecycle Events
Ran sync script to create lifecycle events for all existing resignations:
- Hemant Saini: RESIGNATION event created (status: CANCELLED)
- Anuj Singh: EXIT event created (status: CANCELLED)

### 2. Updated API Response
Added `eventType` field to `/api/exits` response for proper tab filtering:
```typescript
eventType: r.type === 'TERMINATION' ? 'EXIT' : 'RESIGNATION'
```

### 3. Auto-Sync on Creation
The `/api/exits` POST endpoint now automatically creates a lifecycle event when a resignation is created:
```typescript
await prisma.lifecycleEvent.create({
  data: {
    employeeId,
    eventType: type === 'TERMINATION' ? 'EXIT' : 'RESIGNATION',
    eventDate: lwd,
    description: finalReason,
    status: 'PENDING'
  }
});
```

## Current Data State

### Resignations & Exits Page (`/resignations`)
| Employee | Type | Status | Display Status |
|----------|------|--------|---------------|
| Hemant Saini | RESIGNATION | REJECTED | CANCELLED |
| Anuj Singh | TERMINATION | REJECTED | CANCELLED |

### Employee Lifecycle Page (`/admin/employee-lifecycle`)
**Resignations Tab:**
| Employee | Event Type | Status |
|----------|-----------|--------|
| Hemant Saini | RESIGNATION | CANCELLED |

**Exits Tab:**
| Employee | Event Type | Status |
|----------|-----------|--------|
| Anuj Singh | EXIT | CANCELLED |

## Data Flow

### Creating via Resignations Page
```
User creates resignation → POST /api/exits
    ↓
1. Creates Resignation record (Resignation table)
2. Creates LifecycleEvent record (LifecycleEvent table)
    ↓
Data appears in BOTH pages immediately
```

### Creating via Lifecycle Page
```
User creates lifecycle event → POST /api/lifecycle-events
    ↓
1. Creates LifecycleEvent record
2. If RESIGNATION/EXIT → Creates Resignation record
    ↓
Data appears in BOTH pages immediately
```

### Fetching Data
```
Resignations Page → GET /api/exits
    ↓
Returns: Resignation records only

Lifecycle Page → GET /api/lifecycle-events
    ↓
Returns: LifecycleEvent + Resignation records (deduplicated)
```

## Status Mapping

| Resignation Status | Lifecycle Status | Display |
|-------------------|-----------------|---------|
| DRAFT | PENDING | PENDING |
| PENDING | PENDING | PENDING |
| SUBMITTED | PENDING | PENDING |
| UNDER_REVIEW | PENDING | PENDING |
| APPROVED | COMPLETED | COMPLETED |
| ACCEPTED | COMPLETED | COMPLETED |
| COMPLETED | COMPLETED | COMPLETED |
| REJECTED | CANCELLED | CANCELLED |
| WITHDRAWN | CANCELLED | CANCELLED |

## Verification Steps

1. ✅ Navigate to `/resignations` - Shows 2 records (Hemant Saini, Anuj Singh)
2. ✅ Navigate to `/admin/employee-lifecycle`
   - ✅ **All Events** tab - Shows both records
   - ✅ **Resignations** tab - Shows Hemant Saini (RESIGNATION)
   - ✅ **Exits** tab - Shows Anuj Singh (EXIT)
3. ✅ Status matches on both pages: CANCELLED

## Files Modified

1. `app/api/exits/route.ts` - Added `eventType` field to response
2. `app/api/lifecycle-events/route.ts` - Already syncing with Resignation model
3. Database - LifecycleEvent records created for existing resignations

## Best Practices

1. ✅ Always create both Resignation and LifecycleEvent records together
2. ✅ Use `eventType` field for proper tab filtering (RESIGNATION vs EXIT)
3. ✅ Map status consistently between models
4. ✅ Auto-sync on creation prevents data inconsistency
