# 🎨 Frontend Integration Guide - CRM Activity Module

## Overview

We've created production-ready React components for the CRM Activity module with full dark/light theme support and comprehensive features. This guide shows you how to integrate and use them.

---

## 📦 Components Created

### 1. **Activity List (Enhanced)**
**File**: `src/pages/CRM/activities/ActivityListEnhanced.tsx`

Comprehensive activity list with:
- Search and filtering
- Pagination
- Bulk operations
- Dark/light theme support
- Status indicators
- Sorting and column management

**Usage**:
```tsx
import { ActivityList } from "@/pages/CRM/activities/ActivityListEnhanced";

export const ActivitiesPage = () => {
  return <ActivityList />;
};
```

---

### 2. **Account Activity Tab**
**File**: `src/pages/CRM/accounts/AccountActivityTab.tsx`

Display account activities in tabs:
- All activities
- Upcoming activities
- Completed activities
- Overdue activities
- Quick add new activity
- Activity statistics cards

**Usage**:
```tsx
import { AccountActivityTab } from "@/pages/CRM/accounts/AccountActivityTab";

export const AccountDetail = ({ accountId, accountName }: Props) => {
  return (
    <Tabs defaultValue="activities">
      <TabsList>
        <TabsTrigger value="activities">Activities</TabsTrigger>
        {/* Other tabs */}
      </TabsList>
      <TabsContent value="activities">
        <AccountActivityTab accountId={accountId} accountName={accountName} />
      </TabsContent>
    </Tabs>
  );
};
```

---

### 3. **Account Timeline**
**File**: `src/pages/CRM/accounts/AccountTimeline.tsx`

Visual timeline of all account events:
- Activities
- Opportunities
- Contacts
- System events
- Color-coded by type
- Interactive timeline

**Usage**:
```tsx
import { AccountTimeline } from "@/pages/CRM/accounts/AccountTimeline";

const timelineEvents = [
  {
    id: "1",
    type: "call",
    title: "Call with John",
    description: "Discussed requirements",
    timestamp: new Date(),
    actor: "Sarah Smith",
    status: "completed",
  },
  // ... more events
];

export const AccountDetail = () => {
  return <AccountTimeline events={timelineEvents} />;
};
```

---

### 4. **Dashboard Activity Widgets**
**File**: `src/pages/CRM/dashboard/DashboardActivityWidgets.tsx`

Dashboard metric widgets:
- Today's Tasks widget
- Overdue Activities widget
- My Activities count
- Team Overdue count

**Usage**:
```tsx
import {
  TodayTasksWidget,
  OverdueActivitiesWidget,
  MyActivitiesCountWidget,
  TeamOverdueCountWidget,
} from "@/pages/CRM/dashboard/DashboardActivityWidgets";

export const Dashboard = () => {
  const { data: todayActivities, isLoading: loadingToday } = useTodayActivities();
  const { data: overdueActivities, isLoading: loadingOverdue } = useOverdueActivities();
  const { data: myCount, isLoading: loadingCount } = useMyActivitiesCount();
  const { data: teamOverdueCount, isLoading: loadingTeam } = useTeamOverdueCount();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <TodayTasksWidget activities={todayActivities || []} isLoading={loadingToday} />
      <OverdueActivitiesWidget activities={overdueActivities || []} isLoading={loadingOverdue} />
      <MyActivitiesCountWidget count={myCount || 0} isLoading={loadingCount} />
      <TeamOverdueCountWidget count={teamOverdueCount || 0} isLoading={loadingTeam} />
    </div>
  );
};
```

---

## 🪝 Custom Hooks

### Extended Activity Hooks
**File**: `src/hooks/api/CRM/use-activities-extended.ts`

```tsx
import {
  useActivitiesExtended,
  useActivityDetail,
  useTodayActivities,
  useMyActivities,
  useOverdueActivities,
  useUpcomingActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useChangeActivityStatus,
  useBulkAssignActivities,
  useBulkDeleteActivities,
} from "@/hooks/api/CRM/use-activities-extended";

// List activities with filtering
const { data, isLoading, refetch } = useActivitiesExtended({
  strActivityType: "Call",
  pageSize: 20,
});

// Create activity
const { mutate: createActivity, isPending } = useCreateActivity();
createActivity({
  strActivityType: "Meeting",
  strSubject: "Team Standup",
  links: [{ strEntityType: "Account", strEntityGUID: "abc123" }],
});

// Delete activity
const { mutate: deleteActivity } = useDeleteActivity();
deleteActivity("activity-id");

// Bulk operations
const { mutate: bulkAssign } = useBulkAssignActivities();
bulkAssign({ ids: ["id1", "id2"], userId: "user-id" });
```

---

## 🎨 Theme Support

All components have full dark/light theme support using Tailwind CSS classes:

```tsx
// Dark mode classes are automatically applied
className="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
```

No additional configuration needed - just use the components!

---

## 📡 API Service

**File**: `src/services/CRM/activity-extended.service.ts`

Extended service with all backend endpoints:

```tsx
import { activityExtendedService } from "@/services/CRM/activity-extended.service";

// Fetch activities
const activities = await activityExtendedService.getActivities({ pageSize: 20 });

// CRUD operations
await activityExtendedService.createActivity(dto);
await activityExtendedService.updateActivity(id, dto);
await activityExtendedService.deleteActivity(id);

// Status and assignment
await activityExtendedService.changeStatus(id, "Completed");
await activityExtendedService.assignActivity(id, userId);

// Bulk operations
await activityExtendedService.bulkAssign(ids, userId);
await activityExtendedService.bulkChangeStatus(ids, status);
await activityExtendedService.bulkDelete(ids);

// User-specific views
await activityExtendedService.getTodayActivities();
await activityExtendedService.getMyActivities();
await activityExtendedService.getOverdueActivities();
```

---

## 🔌 Integration Steps

### Step 1: Update Routing

Add activity routes to your router configuration:

```tsx
// src/routes/config.ts
{
  path: "/crm/activities",
  element: <ActivityList />,
  title: "Activities",
},
{
  path: "/crm/accounts/:id",
  element: <AccountDetailPage />,
  // Include AccountActivityTab in the account detail page
}
```

### Step 2: Update Account Detail Page

Add the activity tab to your account detail page:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountActivityTab } from "@/pages/CRM/accounts/AccountActivityTab";
import { AccountTimeline } from "@/pages/CRM/accounts/AccountTimeline";

export const AccountDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const account = useAccount(id!);

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activities">Activities ({account.data?.activityCount})</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        {/* Other tabs */}
      </TabsList>

      <TabsContent value="activities">
        <AccountActivityTab accountId={id!} accountName={account.data?.name || ""} />
      </TabsContent>

      <TabsContent value="timeline">
        <AccountTimeline events={account.data?.timeline || []} />
      </TabsContent>
    </Tabs>
  );
};
```

### Step 3: Update Dashboard

Add activity widgets to your dashboard:

```tsx
import {
  TodayTasksWidget,
  OverdueActivitiesWidget,
  MyActivitiesCountWidget,
  TeamOverdueCountWidget,
} from "@/pages/CRM/dashboard/DashboardActivityWidgets";
import {
  useTodayActivities,
  useOverdueActivities,
  useMyActivitiesCount,
  useTeamOverdueCount,
} from "@/hooks/api/CRM/use-activities-extended";

export const DashboardPage = () => {
  const { data: todayActivities, isLoading: loadingToday } = useTodayActivities();
  const { data: overdueActivities, isLoading: loadingOverdue } = useOverdueActivities();
  const { data: myCount, isLoading: loadingCount } = useMyActivitiesCount();
  const { data: teamOverdueCount, isLoading: loadingTeam } = useTeamOverdueCount();

  return (
    <div className="space-y-6">
      {/* Existing dashboard content */}
      
      {/* Activity widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TodayTasksWidget activities={todayActivities || []} isLoading={loadingToday} />
        <OverdueActivitiesWidget activities={overdueActivities || []} isLoading={loadingOverdue} />
        <MyActivitiesCountWidget count={myCount || 0} isLoading={loadingCount} />
        <TeamOverdueCountWidget count={teamOverdueCount || 0} isLoading={loadingTeam} />
      </div>
    </div>
  );
};
```

---

## 🎯 Component Features

### ActivityList
- ✅ Search by subject and description
- ✅ Filter by type (Call, Email, Meeting, Note, Task)
- ✅ Sort by any column
- ✅ Pagination (20, 50, 100 items per page)
- ✅ Bulk delete
- ✅ Bulk assign
- ✅ Quick view details
- ✅ Dark/light theme
- ✅ Permission-based UI

### AccountActivityTab
- ✅ Summary statistics (Total, Completed, Upcoming, Overdue)
- ✅ Tabbed view by status
- ✅ Inline activity creation
- ✅ Quick status visualization
- ✅ Dark/light theme
- ✅ Responsive design

### AccountTimeline
- ✅ Chronological event display
- ✅ Icon-coded by event type
- ✅ Status badges
- ✅ Actor information
- ✅ Interactive design
- ✅ Dark/light theme

### Dashboard Widgets
- ✅ Today's tasks counter
- ✅ Overdue count with warning
- ✅ My activities count
- ✅ Team overdue count
- ✅ Color-coded warnings
- ✅ Quick navigation links

---

## 🚀 Usage Examples

### Fetch and Display Activities

```tsx
import { useActivitiesExtended } from "@/hooks/api/CRM/use-activities-extended";

export const MyActivities = () => {
  const { data, isLoading, error } = useActivitiesExtended({
    pageSize: 20,
    pageNumber: 1,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.data?.map((activity) => (
        <li key={activity.strActivityGUID}>
          {activity.strSubject}
        </li>
      ))}
    </ul>
  );
};
```

### Create Activity with Form

```tsx
import ActivityForm from "@/pages/CRM/activities/components/ActivityForm";

export const CreateActivityDemo = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        New Activity
      </Button>
      <ActivityForm
        open={open}
        onOpenChange={setOpen}
        defaultLinks={[
          {
            strEntityType: "Account",
            strEntityGUID: "account-id",
          },
        ]}
        onSuccess={() => {
          console.log("Activity created!");
          setOpen(false);
        }}
      />
    </>
  );
};
```

---

## 📋 Type Definitions

All TypeScript types are available from `@/types/CRM/activity`:

```tsx
import type {
  ActivityListDto,
  CreateActivityDto,
  ActivityFilterParams,
  ActivityType,
  EntityType,
  ActivityLinkDto,
  UpcomingActivityDto,
} from "@/types/CRM/activity";
```

---

## ⚙️ Configuration

### API Base URL

Make sure your API base URL is configured in `.env`:

```
VITE_CRM_API_URL=http://localhost:5000/api
```

### Permissions

Activities are permission-controlled. Update your user's permissions in the backend:

```
CRM_Activities:View
CRM_Activities:Create
CRM_Activities:Edit
CRM_Activities:Delete
```

---

## 🧪 Testing

All components are tested for:
- ✅ Dark/light theme switching
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Loading states
- ✅ Error handling
- ✅ Accessibility
- ✅ Performance

---

## 📚 Additional Resources

- **Backend API Docs**: See `IMPLEMENTATION_COMPLETE.md`
- **Database Schema**: See `activity_enhancement_migration.sql`
- **Workflow Automation**: See `seed_workflow_activity_rules.sql`
- **Testing Guide**: See `TESTING_GUIDE.md`

---

## ❓ FAQ

**Q: How do I add a custom filter?**
A: Update the filter params in the ActivityList component and the filterParams object.

**Q: Can I customize the columns shown?**
A: Yes - use the `ColumnVisibility` feature built into DataTable to show/hide columns.

**Q: How do I handle errors?**
A: All hooks have error states. Use the error callback in mutations to show toasts.

**Q: Can I bulk edit activities?**
A: Yes - select multiple activities and use the bulk assign/status/delete operations.

**Q: How is dark mode handled?**
A: All components use `dark:` Tailwind classes. Theme switching is handled app-wide.

---

## 🎉 Summary

You now have production-ready components for:
- ✅ Activity management (CRUD, bulk ops)
- ✅ Account 360° view with activities
- ✅ Activity timeline visualization
- ✅ Dashboard metrics and widgets
- ✅ Dark/light theme support
- ✅ Full TypeScript support
- ✅ Responsive design
- ✅ Permission-based UI

All components follow your existing patterns and integrate seamlessly with your backend API!

---

*For more details, see the other documentation files: IMPLEMENTATION_COMPLETE.md, TESTING_GUIDE.md, and FRONTEND_GUIDE.md*
