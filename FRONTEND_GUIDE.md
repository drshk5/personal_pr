# CRM Frontend Implementation Guide
## Activity Module & Account 360° View

**Status**: Backend 100% Complete - Ready for Frontend Integration  
**Date**: February 17, 2026

---

## 📱 FRONTEND COMPONENTS TO BUILD

### 1. Activity Management Module

#### 1.1 Activity List Page (`/pages/CRM/activities/ActivityTimeline.tsx` - REFACTOR)

**Features Required:**
- ✅ Paginated data table with columns:
  - Subject
  - Type (with icon)
  - Status (badge: Pending/InProgress/Completed/Cancelled)
  - Priority (badge: Low/Medium/High/Urgent - color coded)
  - Assigned To (user name)
  - Due Date (with overdue indicator)
  - Last Updated
  - Actions (Edit, Delete, Complete)

**Filtering & Sorting:**
- Filter by Status, Priority, Type, Category
- Filter by Assigned User
- Filter by Date Range (Created/Due)
- Search by Subject/Description
- Sort by any column

**Bulk Actions Toolbar:**
- Checkbox selection for multiple rows
- Bulk actions (Assign, Change Status, Delete)
- Confirmation dialogs

**Tab Navigation:**
- Active Tasks (Pending, In Progress)
- My Activities (filtered to current user)
- Today's Tasks (due today or overdue)
- Overdue Activities
- All Activities

**Example Data Structure:**
```typescript
interface ActivityListItem {
  strActivityGUID: string;
  strActivityType: string;
  strSubject: string;
  strStatus: "Pending" | "InProgress" | "Completed" | "Cancelled";
  strPriority: "Low" | "Medium" | "High" | "Urgent";
  dtDueDate: Date | null;
  dtScheduledOn: Date | null;
  bolIsOverdue: boolean;
  strAssignedToGUID: string | null;
  strAssignedToName: string | null;
  strCategory: string | null;
  dtCreatedOn: Date;
  dtUpdatedOn: Date | null;
}
```

#### 1.2 Activity Create/Edit Form (`/pages/CRM/activities/ActivityForm.tsx` - NEW)

**Form Fields:**
- Activity Type (dropdown: Call, Email, Meeting, Task, Note, FollowUp)
- Subject (text input, required)
- Description (textarea)
- Status (dropdown: Pending, InProgress, Completed, Cancelled)
- Priority (dropdown: Low, Medium, High, Urgent)
- Category (dropdown or text)
- Assigned To (user picker dropdown, searchable)
- Scheduled Date/Time (datetime picker)
- Due Date (date picker)
- Duration (in minutes, number input)
- Outcome (textarea - for completed activities)
- Entity Links (multi-select: Lead, Account, Contact, Opportunity)

**Validation:**
- Subject required
- Activity Type required
- Priority/Status validated against constants
- Date validations (due > scheduled)

**Submit Actions:**
- Create Activity
- Update Activity
- Mark as Completed (shortcut button)

**Example Implementation:**
```typescript
interface CreateActivityInput {
  strActivityType: string;  // Call, Email, Meeting, etc.
  strSubject: string;
  strDescription?: string;
  strStatus?: string;
  strPriority?: string;
  dtDueDate?: Date;
  dtScheduledOn?: Date;
  strCategory?: string;
  strAssignedToGUID?: string;
  intDurationMinutes?: number;
  strOutcome?: string;
  links: ActivityLink[];
}

interface ActivityLink {
  strEntityType: string;  // Lead, Account, Contact, Opportunity
  strEntityGUID: string;
}
```

#### 1.3 Activity Detail Modal/Page

**READ-ONLY Display:**
- All fields from list + description, outcome
- Linked entities (clickable)
- Activity history/timeline
- Audit log entries

**Action Buttons:**
- Edit
- Complete (if status != Completed)
- Reassign
- Delete
- Create Follow-up

---

### 2. Account 360° View (Enhanced)

#### 2.1 Account Detail Page - Tabs Enhancement (`/pages/CRM/accounts/AccountForm.tsx`)

**Current Structure:**
- Overview tab (account info)
- Contacts tab (list of contacts)
- Opportunities tab (list of opportunities)

**ADD NEW TABS:**

**Tab: Activities**
- List all activities linked to this account
- Show status, priority, due date
- Inline "Complete" button
- "Create Activity" button
- Filters: Status, Priority, Date Range
- Sort by: Due Date, Created Date

```typescript
interface AccountActivityView {
  strActivityGUID: string;
  strActivityType: string;
  strSubject: string;
  strStatus: string;
  strPriority: string;
  dtDueDate: Date | null;
  bolIsOverdue: boolean;
  strAssignedToGUID: string | null;
  strAssignedToName: string | null;
}
```

**Tab: Timeline**
- Chronological view of ALL events:
  - Activities created/completed
  - Opportunities moved between stages
  - Contacts added
  - Status changes
- Event types color-coded
- User name/avatar for each event
- Reverse chronological (newest first)

```typescript
interface TimelineEntry {
  strEventType: "Activity" | "ActivityCompleted" | "Opportunity" | "ContactAdded";
  strDescription: string;
  dtOccurredOn: Date;
  strPerformedByName?: string;
  strPerformedByGUID?: string;
}
```

**Tab: Summary**
- Key metrics:
  - Total Activities (count)
  - Overdue Activities (count with warning)
  - Last Activity Date
  - Open Opportunities (count)
  - Total Opportunity Value
  - Contact Count
  - Assigned To (with change button)

#### 2.2 Account Header Enhancement

Add badge/widget showing:
- 🔴 {count} Overdue activities
- ✅ {count} Latest activities this week
- 👤 Assigned to {user name}

---

### 3. Lead/Opportunity Detail - Activity Links

**In Lead/Opportunity detail page:**
- Add "Linked Activities" section
- Show activities linked to this entity
- "Create Activity" button
- Status indicators

---

## 🔌 API INTEGRATION

### Activity Service (Frontend)

```typescript
// Activity API Service
class ActivityService {
  // List Activities
  getActivities(filter: ActivityFilterParams): Promise<PagedResponse<ActivityListDto>>;
  
  // Create/Update
  createActivity(dto: CreateActivityDto): Promise<ActivityListDto>;
  updateActivity(id: string, dto: UpdateActivityDto): Promise<ActivityListDto>;
  
  // Actions
  deleteActivity(id: string): Promise<boolean>;
  changeStatus(id: string, status: ActivityStatusChangeDto): Promise<ActivityListDto>;
  assignActivity(id: string, userId: string): Promise<ActivityListDto>;
  
  // Bulk Operations
  bulkAssign(guids: string[], userId: string): Promise<boolean>;
  bulkChangeStatus(guids: string[], status: string): Promise<boolean>;
  bulkDelete(guids: string[]): Promise<boolean>;
  
  // User-Centric Views
  getTodayActivities(): Promise<ActivityListDto[]>;
  getMyActivities(filter: ActivityFilterParams): Promise<PagedResponse<ActivityListDto>>;
  getOverdueActivities(): Promise<ActivityListDto[]>;
  getUpcomingActivities(): Promise<UpcomingActivityDto[]>;
  
  // Entity Activities
  getEntityActivities(type: string, id: string): Promise<PagedResponse<ActivityListDto>>;
}
```

### Account Service (Enhanced)

```typescript
// Account API Service (UPDATE)
class AccountService {
  // ... existing methods ...
  
  // NEW METHODS
  getAccountTimeline(accountId: string): Promise<AccountTimelineEntryDto[]>;
  bulkAssignAccounts(guids: string[], userId: string): Promise<boolean>;
}
```

### API Filter Parameters

```typescript
interface ActivityFilterParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  ascending?: boolean;
  
  // Filters
  strActivityType?: string;
  strStatus?: string;
  strPriority?: string;
  strCategory?: string;
  strAssignedToGUID?: string;
  dtFromDate?: Date;
  dtToDate?: Date;
  dtDueBefore?: Date;
  dtDueAfter?: Date;
  bolIsOverdue?: boolean;
  bolIsCompleted?: boolean;
  
  // Entity filters
  strEntityType?: string;
  strEntityGUID?: string;
}
```

---

## 🎨 UI/UX GUIDELINES

### Color Schema for Status/Priority

**Status Colors:**
```
Pending     → Gray (#6B7280)
InProgress  → Blue (#3B82F6)
Completed   → Green (#10B981)
Cancelled   → Red (#EF4444)
```

**Priority Colors:**
```
Low         → Gray (#9CA3AF)
Medium      → Blue (#3B82F6)
High        → Orange (#F59E0B)
Urgent      → Red (#EF4444)
```

**Icons (Material/Feather):**
```
Call        → 📞 Phone
Email       → 📧 Mail
Meeting     → 📅 Calendar
Task        → ✓ CheckCircle
Note        → 📝 FileText
FollowUp    → 🔄 ArrowRight
```

### Data Table Best Practices

- Implement virtual scrolling for large lists (100+ rows)
- Show loading spinner while fetching
- Handle empty states gracefully
- Show record count footer
- Implement infinite scroll OR pagination
- Sticky header row
- Responsive design (stack columns on mobile)

### Form Best Practices

- Auto-save drafts to localStorage
- Show unsaved changes indicator
- Validate on blur + submit
- Show error messages inline
- Loading state during submit
- Success toast notification
- Disabled submit during loading

---

## 📊 DASHBOARD INTEGRATION

**Update Dashboard to show:**
```typescript
interface EnhancedCrmDashboardDto {
  // ... existing fields ...
  
  // NEW: Activity-related fields
  intMyActivitiesCount: number;
  intTeamOverdueCount: number;
  todayTasks: ActivityListDto[];  // Top 5
  overdueActivities: ActivityListDto[];  // Top 5
  upcomingActivities: UpcomingActivityDto[];  // Existing field, use it
}
```

**Dashboard Widgets:**

1. **Today's Tasks Widget**
   - List of 5 tasks due today
   - Mark complete button
   - Click to open detail

2. **Overdue Widget**
   - ⚠️ Icon with count badge
   - Click to view all overdue
   - Color: Red/Orange

3. **My Activities Summary**
   - Total count
   - Breakdown by status
   - Quick filter links

---

## 🧪 TESTING CHECKLIST

### Unit Tests
- [ ] Activity form validation
- [ ] Date picker (due > scheduled)
- [ ] Filter parameter building
- [ ] Status change logic

### Integration Tests  
- [ ] Create activity with links to lead
- [ ] Bulk assign 10+ activities
- [ ] Filter by multiple criteria
- [ ] Load account timeline with 50+ events
- [ ] Activity cascades to lead status

### E2E Tests (Playwright)
- [ ] Create activity from lead detail
- [ ] Mark activity complete, verify lead status updates
- [ ] View today's tasks
- [ ] Bulk complete multiple activities
- [ ] Account timeline shows all event types

---

## 📦 COMPONENT STRUCTURE

```
/pages/CRM/activities/
├── ActivityList.tsx              (Main page with tabs)
├── ActivityForm.tsx              (Create/Edit modal)
├── ActivityDetail.tsx            (Modal view)
├── ActivityFilterBar.tsx         (Filters & search)
├── ActivityBulkActions.tsx       (Toolbar)
├── ActivityTable.tsx             (Data table)
└── ActivityTimeline.tsx          (Timeline view)

/pages/CRM/accounts/
├── AccountForm.tsx               (Existing - ADD tabs)
├── AccountDetailsTab.tsx         (NEW - Overview)
├── AccountActivitiesTab.tsx      (NEW - All activities)
├── AccountTimelineTab.tsx        (NEW - Timeline)
└── AccountSummaryWidget.tsx      (NEW - Metrics)

/services/
├── ActivityService.ts            (API service)
├── AccountService.ts             (ENHANCE existing)

/types/
├── Activity.ts                   (DTOs & interfaces)
├── ActivityFilter.ts             (Filter & params)
└── ActivityWorkflow.ts           (Constants & enums)

/stores/
├── activityStore.ts              (State management - optional)
└── accountStore.ts               (Enhance existing)
```

---

## 🚀 IMPLEMENTATION PRIORITY

**Phase 1 (Week 1):**
1. ActivityList page with basic CRUD
2. ActivityForm modal
3. API integration
4. Status badge styling

**Phase 2 (Week 2):**
1. Bulk operations UI & implementation
2. Filters & search
3. Tab navigation (My Activities, Today, etc.)
4. Performance optimizations (pagination, virtualization)

**Phase 3 (Week 3):**
1. Account timeline tab
2. Account activities tab
3. Dashboard activity widgets
4. Integration with lead/opportunity pages

**Phase 4 (Week 4):**
1. Advanced filtering (date range picker)
2. Activity templates
3. Recurring activities
4. Testing & bug fixes

---

## ⚡ PERFORMANCE OPTIMIZATION

### Frontend

- **Pagination**: Show 20-50 rows per page initially
- **Virtual Scrolling**: For lists with 100+ items
- **Memoization**: Use React.memo for data tables
- **Lazy Loading**: Load activity details on demand
- **Debouncing**: Search input (300ms)

### API Calls

- **Caching**: Cache activity list for 5 minutes
- **Pagination**: Never load >1000 records at once
- **Partial Updates**: Use PUT for full update, PATCH for status only
- **Batch Operations**: Always use bulk endpoints for multiple changes

### Bundle Size

- Keep Activity module lazy-loaded
- Tree-shake unused date libraries
- Use lightweight toast/modal libraries

---

## 🔐 SECURITY CONSIDERATIONS

- Validate user has permission before showing activities
- Don't show activities from other users unless manager
- Validate change status request server-side
- Audit all activity changes
- XSS prevention: Sanitize user input in descriptions
- CSRF tokens for mutations

---

## 📝 NOTES FOR DEVELOPERS

1. **State Management**: Consider Redux/Zustand for complex activity list filtering
2. **Real-time Updates**: Consider WebSocket for live activity updates
3. **Accessibility**: Ensure keyboard navigation works on all forms
4. **Mobile**: Activity list should be responsive (stack columns)
5. **Offline**: Cache recent activities for offline viewing
6. **Notifications**: Show toast when bulk operations complete
7. **Confirmations**: Confirm before completing/deleting activities

---

**Backend Status**: ✅ COMPLETE & TESTED
**Frontend Status**: ⏳ READY FOR IMPLEMENTATION
**Estimated Frontend Effort**: 2-3 weeks (experienced team)

Ready to start building! All backend endpoints are live and tested.
