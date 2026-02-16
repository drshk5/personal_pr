# Activity Module - Comprehensive Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Module Purpose & Use Cases](#2-module-purpose--use-cases)
3. [Architecture & Approach](#3-architecture--approach)
4. [Database Schema](#4-database-schema)
5. [Backend API](#5-backend-api)
6. [Business Logic & Rules](#6-business-logic--rules)
7. [Frontend UI/UX](#7-frontend-uiux)
8. [Data Flow](#8-data-flow)
9. [Permissions & Access Control](#9-permissions--access-control)
10. [Related Modules & Integrations](#10-related-modules--integrations)
11. [Error Handling](#11-error-handling)
12. [Performance Optimizations](#12-performance-optimizations)
13. [File Structure](#13-file-structure)

---

## 1. Overview

Activity Module CRM system ka **audit trail + interaction tracking** module hai. Yeh module saari customer interactions ko record karta hai — calls, emails, meetings, notes, tasks, follow-ups — aur unhe polymorphic links ke through kisi bhi CRM entity (Lead, Contact, Account, Opportunity) se jod deta hai.

**IMPORTANT Design Rule:** Activities are **IMMUTABLE** — ek baar create hone ke baad na update hoti hain, na delete. Append-only audit trail hai yeh.

**Tech Stack:**
- **Backend:** ASP.NET Core (C#), Entity Framework Core, SQL Server
- **Frontend:** React (TypeScript), TanStack React Query, React Hook Form, Zod Validation, Tailwind CSS, Shadcn/UI
- **Pattern:** Clean Architecture (Controller -> Application Service -> Domain Service -> Repository -> Database)

---

## 2. Module Purpose & Use Cases

### Kya Kaam Aata Hai (Purpose)

| Use Case | Description |
|----------|-------------|
| **Interaction Logging** | Calls, emails, meetings, notes sab ek jagah record karna |
| **Activity Timeline** | Har entity ki complete interaction history dekhna |
| **Task Management** | Upcoming tasks aur follow-ups track karna |
| **Scheduling** | Meetings aur calls schedule karna with date/time |
| **Outcome Tracking** | Har activity ka result record karna (Interested, No answer, etc.) |
| **Multi-Entity Linking** | Ek activity ko multiple entities se link karna (Salesforce model) |
| **Team Visibility** | Kaun kya kar raha hai — assigned activities dekhna |
| **Upcoming Dashboard** | Aane wali scheduled activities ek jagah dekhna |

### Activity Types (6 Types)

```
Call  |  Email  |  Meeting  |  Note  |  Task  |  FollowUp
```

| Type | Icon | Color | Hindi Meaning | Use Case |
|------|------|-------|--------------|----------|
| **Call** | Phone | Blue | Phone Call | Customer se phone par baat ki |
| **Email** | Mail | Purple | Email bheja/aaya | Email send ya receive hua |
| **Meeting** | Users | Amber | Meeting hui | In-person ya video meeting |
| **Note** | StickyNote | Gray | Note likhna | Internal note ya observation |
| **Task** | CheckSquare | Emerald | Task assign | Koi kaam assign karna |
| **FollowUp** | RotateCcw | Rose | Follow Up | Kisi cheez ka follow up karna |

### Entity Types (jo link ho sakte hain)

| Entity | Description |
|--------|-------------|
| **Lead** | Sales lead se linked activity |
| **Contact** | Customer contact se linked activity |
| **Account** | Company/account se linked activity |
| **Opportunity** | Sales deal/opportunity se linked activity |

---

## 3. Architecture & Approach

### Layered Architecture

```
+-------------------------------------------------------------+
|                     FRONTEND (React)                         |
|  ActivityTimeline.tsx | ActivityForm.tsx | EntityActivityPanel|
+-----------------------------+-------------------------------+
                              | HTTP (REST API)
+-----------------------------v-------------------------------+
|                  CONTROLLER LAYER                            |
|               ActivitiesController.cs                        |
|   [RequireTenantId] [AuthorizePermission] [AuditLog]        |
+-----------------------------+-------------------------------+
                              |
+-----------------------------v-------------------------------+
|             APPLICATION SERVICE LAYER                        |
|          MstActivityApplicationService.cs                    |
|   (Orchestration, DTO Projection, Pagination, Filtering)     |
+-----------------------------+-------------------------------+
                              |
+-----------------------------v-------------------------------+
|               DOMAIN SERVICE LAYER                           |
|             MstActivityService.cs                            |
|      (Type Validation, Link Validation)                      |
+-----------------------------+-------------------------------+
                              |
+-----------------------------v-------------------------------+
|               REPOSITORY LAYER                               |
|   MstActivityRepository.cs + MstActivityLinkRepository.cs    |
|                  + UnitOfWork.cs                             |
+-----------------------------+-------------------------------+
                              |
+-----------------------------v-------------------------------+
|                 DATABASE (SQL Server)                         |
|     MstActivities  |  MstActivityLinks (Polymorphic)         |
+-------------------------------------------------------------+
```

### Key Design Patterns

| Pattern | Kahan Use Hota Hai | Kyun |
|---------|-------------------|------|
| **Immutable Records** | Activity entity | Ek baar create hua — no update, no delete. Audit trail intact rehta hai |
| **Polymorphic Junction** | MstActivityLinks | Ek activity multiple entity types se link ho sakti hai (Lead, Contact, Account, Opportunity) bina nullable FK ke |
| **Repository Pattern** | Data Access Layer | Database operations ko abstract karna |
| **Unit of Work** | Transaction Management | Activity + Links ek atomic transaction mein save hote hain |
| **DTO Projection** | Application Service | `.Select()` se SQL level par hi sirf zaruri columns fetch hote hain |
| **AsNoTracking** | Read Operations | Read queries mein EF Core change tracker off — 30-40% faster |
| **Multi-Tenancy** | Global Query Filter | Har organization ka data alag-alag rehta hai (strGroupGUID se) |
| **Memo + Debounce** | Frontend | React components memo'd, search 400ms debounced — smooth UI |

### Why Immutable? (Kyun Update/Delete Nahi?)

```
1. AUDIT INTEGRITY — Koi bhi puraani activity modify nahi kar sakta
2. COMPLIANCE — Regulatory requirements ke liye tamper-proof record
3. PERFORMANCE — No locking contention on writes (append-only is fastest)
4. SIMPLICITY — No concurrent update conflicts, no optimistic concurrency needed
5. TRUST — Sales manager dekhega ki kya actually hua, manipulate nahi kar sakta koi
```

### Why Polymorphic Links? (MstActivityLinks Kyun?)

```
Traditional approach (BAD):                Polymorphic approach (GOOD):
+------------------+                       +------------------+
| MstActivities    |                       | MstActivities    |
| strLeadGUID?     |  <-- nullable FKs     | strActivityGUID  |
| strContactGUID?  |      for each type    +------------------+
| strAccountGUID?  |                              |
| strOpptyGUID?    |                       +------v-----------+
+------------------+                       | MstActivityLinks |
                                           | strEntityType    |  <-- "Lead"|"Contact"|"Account"|"Opportunity"
Problems:                                  | strEntityGUID    |  <-- actual entity GUID
- Naye entity type ke liye schema change   +------------------+
- Most columns NULL rehte hain
- Ek activity sirf ek entity se link       Benefits:
                                           - Ek activity multiple entities se link ho sakti hai
                                           - Naya entity type? Bas constant add karo
                                           - Clean normalized schema
```

---

## 4. Database Schema

### 4.1 MstActivities Table (Primary Table — Immutable)

```sql
CREATE TABLE MstActivities (
    strActivityGUID         UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
    strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,          -- Tenant ID
    strActivityType         NVARCHAR(50)        NOT NULL,          -- Call|Email|Meeting|Note|Task|FollowUp
    strSubject              NVARCHAR(300)       NOT NULL,
    strDescription          NVARCHAR(MAX)       NULL,
    dtScheduledOn           DATETIME2           NULL,              -- Kab scheduled hai
    dtCompletedOn           DATETIME2           NULL,              -- Kab complete hua
    intDurationMinutes      INT                 NULL,              -- Kitni der chali (minutes mein)
    strOutcome              NVARCHAR(200)       NULL,              -- Result kya hua
    strAssignedToGUID       UNIQUEIDENTIFIER    NULL,              -- Kisko assign hai
    strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,          -- Kisne create kiya
    dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
    bolIsActive             BIT                 DEFAULT 1

    -- NOTE: NO bolIsDeleted, NO dtUpdatedOn, NO strUpdatedByGUID
    -- Activities are IMMUTABLE — append-only
);
```

**Total Columns:** 12
**Required Fields:** strActivityGUID, strGroupGUID, strActivityType, strSubject, strCreatedByGUID, dtCreatedOn

### 4.2 MstActivityLinks Table (Polymorphic Junction)

```sql
CREATE TABLE MstActivityLinks (
    strActivityLinkGUID     UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
    strActivityGUID         UNIQUEIDENTIFIER    NOT NULL,    -- FK -> MstActivities
    strEntityType           NVARCHAR(50)        NOT NULL,    -- Lead|Contact|Account|Opportunity
    strEntityGUID           UNIQUEIDENTIFIER    NOT NULL,    -- Actual entity ka GUID
    dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

    UNIQUE (strActivityGUID, strEntityType, strEntityGUID)   -- Same link duplicate nahi ho sakta
);
```

**Total Columns:** 5

### 4.3 Indexes

| Index Name | Table | Column(s) | Purpose |
|-----------|-------|-----------|---------|
| `IX_MstActivities_GroupGUID` | MstActivities | strGroupGUID | Multi-tenant filtering |
| `IX_MstActivities_CreatedOn` | MstActivities | dtCreatedOn DESC | Timeline sorting (latest first) |
| `IX_MstActivities_ScheduledOn` | MstActivities | dtScheduledOn | Upcoming activities query |
| `IX_MstActivities_Type` | MstActivities | strActivityType | Type-based filtering |
| `IX_MstActivityLinks_Entity` | MstActivityLinks | (strEntityType, strEntityGUID) | **Critical** — "Is entity ki saari activities dikhao" |
| `IX_MstActivityLinks_Activity` | MstActivityLinks | strActivityGUID | Activity ke saare links fetch karna |

### 4.4 Entity Relationships Diagram

```
                         MstActivities (Immutable)
                               |
                               | 1
                               |
                               | N
                     MstActivityLinks (Polymorphic Junction)
                    /          |          |              \
                   /           |          |               \
           strEntityType:   strEntityType:  strEntityType:   strEntityType:
             "Lead"        "Contact"       "Account"       "Opportunity"
                |              |              |                  |
                v              v              v                  v
          MstLeads      MstContacts     MstAccounts      MstOpportunities
```

### 4.5 Example Data

```
Activity: "Demo Call with Rajat about Enterprise Deal"

MstActivities:
+------------------+--------+-----------+---------------------------+
| strActivityGUID  | Type   | Subject   | dtScheduledOn             |
+------------------+--------+-----------+---------------------------+
| A1-GUID          | Call   | Demo Call | 2025-03-15T14:00:00Z      |
+------------------+--------+-----------+---------------------------+

MstActivityLinks (same activity, 3 entities se linked):
+------------------+------------------+-------------+------------------+
| strActivityLinkGUID | strActivityGUID | strEntityType | strEntityGUID |
+------------------+------------------+-------------+------------------+
| L1-GUID          | A1-GUID          | Contact     | RAJAT-GUID       |
| L2-GUID          | A1-GUID          | Account     | TECHCORP-GUID    |
| L3-GUID          | A1-GUID          | Opportunity | ENTERPRISE-GUID  |
+------------------+------------------+-------------+------------------+
```

### 4.6 Multi-Tenancy (No Soft Delete)

```
Har query par automatically yeh filter lagta hai:
  WHERE strGroupGUID = @TenantId

- strGroupGUID: Organization/Company ka unique ID (JWT token se aata hai)
- Activities mein bolIsDeleted NAHI hai — kyunki activities delete nahi hoti
- Sirf bolIsActive flag hai (future use ke liye, default true)
```

---

## 5. Backend API

### 5.1 API Endpoints

**Base URL:** `/api/crm/activities`

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| `GET` | `/api/crm/activities` | CRM_Activities:View | Activities list with pagination, filtering, search |
| `GET` | `/api/crm/activities/{id}` | CRM_Activities:View | Single activity ki detail (links sahit) |
| `POST` | `/api/crm/activities` | CRM_Activities:Create | Nayi activity log karna (with entity links) |
| `GET` | `/api/crm/activities/entity/{entityType}/{entityId}` | CRM_Activities:View | Kisi specific entity ki saari activities |
| `GET` | `/api/crm/activities/upcoming` | CRM_Activities:View | Aane wali scheduled activities (max 20) |

**NOTE:** No PUT, No PATCH, No DELETE — Activities are **IMMUTABLE**

### 5.2 Request/Response DTOs

#### CreateActivityDto (POST Request Body)

```json
{
  "strActivityType": "Call",                   // Required: Call|Email|Meeting|Note|Task|FollowUp
  "strSubject": "Follow-up call with Rajat",   // Required: Max 300 chars
  "strDescription": "Discussed pricing...",     // Optional: Max 4000 chars
  "dtScheduledOn": "2025-03-15T14:00:00Z",     // Optional: Kab scheduled hai
  "dtCompletedOn": "2025-03-15T14:30:00Z",     // Optional: Kab complete hua
  "intDurationMinutes": 30,                     // Optional: 0-1440 (max 24 hours)
  "strOutcome": "Interested, will send proposal", // Optional: Max 200 chars
  "strAssignedToGUID": "user-guid | null",      // Optional: Kisko assign hai
  "links": [                                    // Optional: Kin entities se link karna hai
    {
      "strEntityType": "Contact",              // Lead|Contact|Account|Opportunity
      "strEntityGUID": "contact-guid"
    },
    {
      "strEntityType": "Opportunity",
      "strEntityGUID": "opportunity-guid"
    }
  ]
}
```

#### ActivityListDto (GET Response — List + Detail dono)

```json
{
  "strActivityGUID": "guid",
  "strActivityType": "Call",
  "strSubject": "Follow-up call with Rajat",
  "dtScheduledOn": "2025-03-15T14:00:00Z",
  "dtCompletedOn": "2025-03-15T14:30:00Z",
  "intDurationMinutes": 30,
  "strOutcome": "Interested, will send proposal",
  "strCreatedByName": "Deepak Kumar",
  "dtCreatedOn": "2025-03-15T13:00:00Z",
  "links": [
    { "strEntityType": "Contact", "strEntityGUID": "contact-guid" },
    { "strEntityType": "Opportunity", "strEntityGUID": "opp-guid" }
  ]
}
```

#### UpcomingActivityDto (GET /upcoming Response)

```json
{
  "strActivityGUID": "guid",
  "strActivityType": "Meeting",
  "strSubject": "Product Demo with TechCorp",
  "dtScheduledOn": "2025-03-20T10:00:00Z",
  "strEntityName": null
}
```

#### ActivityFilterParams (GET List Query Params)

```
GET /api/crm/activities?PageNumber=1&PageSize=20&Search=call&strActivityType=Call&bolIsCompleted=false&dtFromDate=2025-01-01&dtToDate=2025-12-31&strAssignedToGUID=xxx
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `PageNumber` | int | 1 | Page number |
| `PageSize` | int | 20 | Items per page |
| `Search` | string | null | Subject, description, outcome mein search |
| `SortBy` | string | dtCreatedOn | Column name for sorting |
| `Ascending` | bool | false | Sort direction (default: newest first) |
| `bolIsActive` | bool? | null | Active filter |
| `strActivityType` | string | null | Call, Email, Meeting, etc. |
| `strEntityType` | string | null | Lead, Contact, Account, Opportunity |
| `strEntityGUID` | guid | null | Specific entity ki activities |
| `strAssignedToGUID` | guid | null | Assigned user filter |
| `dtFromDate` | datetime | null | Start date range |
| `dtToDate` | datetime | null | End date range |
| `bolIsCompleted` | bool? | null | true = completed, false = pending |

#### Paginated Response Wrapper

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "items": [ /* ActivityListDto[] */ ],
    "totalCount": 250,
    "pageNumber": 1,
    "pageSize": 20,
    "totalPages": 13,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

### 5.3 Validation Rules (FluentValidation)

| Field | Rules |
|-------|-------|
| strActivityType | Required, Must be: Call, Email, Meeting, Note, Task, FollowUp |
| strSubject | Required, Max 300 chars |
| strDescription | Optional, Max 4000 chars |
| intDurationMinutes | Optional, 0-1440 (max 24 hours) |
| strOutcome | Optional, Max 200 chars |
| Links[].strEntityType | Required per link, Must be: Lead, Contact, Account, Opportunity |
| Links[].strEntityGUID | Required per link, Cannot be empty GUID |

### 5.4 Data Normalization

| Operation | Example |
|-----------|---------|
| **Subject Trim** | "  Follow-up call  " -> "Follow-up call" |
| **Description TrimOrNull** | "  " -> null, "  text  " -> "text" |
| **Outcome TrimOrNull** | "  Interested  " -> "Interested" |
| **TrimStrings Attribute** | Sab string fields auto-trim hote hain |

---

## 6. Business Logic & Rules

### 6.1 Activity Create Flow

```
1. Request aata hai -> TrimStrings attribute strings trim karta hai
2. FluentValidation rules check hoti hain (type, subject, links)
3. Domain Service validates:
   a. Activity type valid hai? (ActivityTypeConstants mein hai?)
   b. Links valid hain? (Entity types valid? GUIDs non-empty?)
4. DataNormalizationHelper se fields normalize hoti hain
5. MstActivity entity create hota hai (new GUID, tenant ID, user ID)
6. MstActivityLink entities create hoti hain (1 per link)
7. Single SaveChangesAsync() — activity + saare links atomic save
8. AuditLog entry banti hai
9. ActivityListDto return hota hai (links sahit)
```

### 6.2 Entity-Scoped Activities Flow

```
GET /api/crm/activities/entity/Contact/{contactGUID}

1. Query MstActivityLinks WHERE strEntityType = 'Contact' AND strEntityGUID = @id
   (Uses IX_MstActivityLinks_Entity covering index — FAST)
2. Join to MstActivities
3. Apply additional filters (type, completed, search)
4. Count for pagination
5. Sort (default: newest first)
6. Project to ActivityListDto at DB level
7. Include all links per activity (not just the one matched)
8. Return PagedResponse
```

### 6.3 Upcoming Activities Flow

```
GET /api/crm/activities/upcoming

1. Query MstActivities WHERE:
   - dtScheduledOn IS NOT NULL (scheduled hai)
   - dtScheduledOn > UTC NOW (future mein hai)
   - dtCompletedOn IS NULL (abhi complete nahi hua)
   - bolIsActive = true
2. ORDER BY dtScheduledOn ASC (sab se pehle wali pehle)
3. TAKE 20 (maximum 20 items)
4. Project to UpcomingActivityDto (lightweight — no links fetched)
5. Return List
```

### 6.4 Immutability Rules

```
Rule 1: NO UPDATE endpoint exists — controller mein PUT/PATCH nahi hai
Rule 2: NO DELETE endpoint exists — controller mein DELETE nahi hai
Rule 3: Application service mein update/delete methods nahi hain
Rule 4: MstActivity model mein dtUpdatedOn, strUpdatedByGUID nahi hai
Rule 5: MstActivity model mein bolIsDeleted nahi hai
Rule 6: CrmDbContext mein Activity ka query filter sirf tenant-based hai (no soft delete)

Agar galat activity log ho gayi? -> Naya "correction" activity log karo.
```

---

## 7. Frontend UI/UX

### 7.1 Activity Timeline Page (`/crm/activities`)

```
+---------------------------------------------------------------------+
|  PageHeader                                                          |
|  +---------------------------------------------------------------+  |
|  | (clock) Activities                          [+ Log Activity]   |  |
|  | Timeline of all activities across your CRM                    |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  Search & Filters Bar                                                |
|  +----------------+  +----------+  +----------+                      |
|  | (search) Search...|  | Filters  |  | Columns  |                  |
|  +----------------+  +----------+  +----------+                      |
|                                                                      |
|  Advanced Filters (toggle)                                           |
|  +----------+  +----------+  +-----------+  +-----------+           |
|  | Type   v |  | Status v |  | From Date |  | To Date   |           |
|  +----------+  +----------+  +-----------+  +-----------+           |
|                                                                      |
|  +---------------------------------------------------------------+  |
|  |   | Type     | Subject           | Scheduled      | Completed |  |
|  +---------------------------------------------------------------+  |
|  | . | (phone)  | Follow-up call    | Mar 15, 2:00PM | Mar 15    |  |
|  |   | Call     | with Rajat        |                | 2:30 PM   |  |
|  +---------------------------------------------------------------+  |
|  | . | (mail)   | Proposal sent to  | -              | Mar 14    |  |
|  |   | Email    | TechCorp          |                | 10:00 AM  |  |
|  +---------------------------------------------------------------+  |
|  | . | (users)  | Product Demo      | Mar 20, 10AM   | -         |  |
|  |   | Meeting  | with InfoSys      |                | (pending) |  |
|  +---------------------------------------------------------------+  |
|  | . | (note)   | Internal note     | -              | -         |  |
|  |   | Note     | about pricing     |                |           |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
|  Pagination: < 1 2 3 ... 13 >    Showing 1-20 of 250               |
+---------------------------------------------------------------------+
```

**Features:**
- **Search:** Subject, description, outcome mein 400ms debounced search
- **Filters:** Activity Type dropdown, Completed/Pending toggle, Date range
- **Sorting:** Kisi bhi column par click karke sort (default: newest first)
- **Pagination:** Page number, page size configurable (default: 20)
- **Column Visibility:** Drag-and-drop column reordering, hide/show
- **Color-coded Icons:** Har activity type ka apna icon aur color
- **Detail Dialog:** Activity click karne par inline detail view
- **Linked Entities:** Entity type badges (Lead, Contact, etc.) dikhte hain
- **Responsive:** Mobile-friendly layout

### 7.2 Activity Form Dialog (Modal — opens from any page)

```
+---------------------------------------------+
|  Log Activity                            [X] |
|  Record a new activity. Activities are       |
|  immutable once created.                     |
+---------------------------------------------+
|                                              |
|  Type                                        |
|  [v Call ...........]                         |
|                                              |
|  Subject *                                   |
|  [Follow-up call with Rajat.............]    |
|                                              |
|  Description                                 |
|  [......................................]     |
|  [......................................]     |
|                                              |
|  +-------------------+  +------------------+ |
|  | Scheduled         |  | Completed        | |
|  | [datetime-local]  |  | [datetime-local] | |
|  +-------------------+  +------------------+ |
|                                              |
|  +-------------------+  +------------------+ |
|  | Duration (min)    |  | Outcome          | |
|  | [30............]  |  | [Interested....]  | |
|  +-------------------+  +------------------+ |
|                                              |
|  Linked Entities                  [+ Add Link]|
|  +----------+ +----------------------------+ |
|  | Contact v | | contact-guid              | [X]|
|  +----------+ +----------------------------+ |
|  +----------+ +----------------------------+ |
|  | Opp.   v | | opportunity-guid          | [X]|
|  +----------+ +----------------------------+ |
|                                              |
|              [Cancel]  [Log Activity]        |
+---------------------------------------------+
```

**Form Behavior:**
- Opens as Dialog/Modal from anywhere — Timeline page, Entity detail pages
- Type dropdown with all 6 activity types
- Schedule fields shown conditionally (Call, Meeting, Task, FollowUp)
- Entity links can be added/removed dynamically
- Pre-fills links when opened from entity detail page
- Zod validation (client-side) + FluentValidation (server-side)
- On success: toast, close dialog, invalidate all activity caches

### 7.3 Entity Activity Panel (Embedded in Lead/Contact/Account/Opportunity detail pages)

```
+------------------------------------------+
| (clock) Activities (5)     [+ Log]       |
+------------------------------------------+
|                                          |
|  (phone) Follow-up call with Rajat       |
|  |   Call . Interested         2 hrs ago |
|  |   Deepak Kumar . 30 min              |
|  |                                       |
|  (mail) Proposal sent to TechCorp        |
|  |   Email . Sent successfully   1d ago  |
|  |   Rajat Rajawat                       |
|  |                                       |
|  (users) Product Demo with InfoSys       |
|     Meeting . Scheduled Mar 20   3d ago  |
|     Deepak Kumar . 60 min               |
|                                          |
|         [v Show All (12)]                |
+------------------------------------------+
```

**Panel Features:**
- **Vertical Timeline:** Lines connecting activity icons
- **Inline Data:** Supports `recentActivities` prop from entity detail API (no extra API call!)
- **Fallback Fetch:** Agar inline data nahi hai, `useEntityActivities()` hook se fetch karta hai
- **Expandable:** Default 3 items, "Show All" button se expand hota hai
- **Log Button:** Directly open ActivityForm with pre-filled entity link
- **Skeleton Loading:** Animated loading state
- **Memo'd:** `React.memo()` se unnecessary re-renders prevent hote hain

### 7.4 Activity Type Colors & Icons

| Type | Icon | Light Mode | Dark Mode |
|------|------|-----------|-----------|
| Call | Phone | `bg-blue-100 text-blue-600` | `bg-blue-900/30 text-blue-400` |
| Email | Mail | `bg-purple-100 text-purple-600` | `bg-purple-900/30 text-purple-400` |
| Meeting | Users | `bg-amber-100 text-amber-600` | `bg-amber-900/30 text-amber-400` |
| Note | StickyNote | `bg-gray-100 text-gray-600` | `bg-gray-800/50 text-gray-400` |
| Task | CheckSquare | `bg-emerald-100 text-emerald-600` | `bg-emerald-900/30 text-emerald-400` |
| FollowUp | RotateCcw | `bg-rose-100 text-rose-600` | `bg-rose-900/30 text-rose-400` |

### 7.5 Activity Detail Dialog

```
+---------------------------------------------+
|  (phone) Call                            [X] |
+---------------------------------------------+
|                                              |
|  Subject                                     |
|  Follow-up call with Rajat                   |
|                                              |
|  Description                                 |
|  Discussed pricing for enterprise license.   |
|  Client is interested in annual plan.        |
|                                              |
|  +-------------------+  +------------------+ |
|  | Scheduled         |  | Completed        | |
|  | Mar 15, 2:00 PM   |  | Mar 15, 2:30 PM  | |
|  +-------------------+  +------------------+ |
|                                              |
|  +-------------------+  +------------------+ |
|  | Duration          |  | Outcome          | |
|  | 30 min            |  | Interested       | |
|  +-------------------+  +------------------+ |
|                                              |
|  +-------------------+  +------------------+ |
|  | Created By        |  | Created On       | |
|  | Deepak Kumar      |  | Mar 15, 1:00 PM  | |
|  +-------------------+  +------------------+ |
|                                              |
|  Linked Entities                             |
|  [Contact] [Opportunity]                     |
|                                              |
+---------------------------------------------+
```

### 7.6 UI Components Used (Shadcn/UI)

| Component | Kahan Use Hota Hai |
|-----------|-------------------|
| `Dialog` | Activity Form, Activity Detail view |
| `Button` | Log Activity, Cancel, Add Link, Show All |
| `Input` | Subject, Outcome, Duration, Entity GUID, Date inputs |
| `Textarea` | Description field |
| `Select` | Activity Type, Entity Type dropdowns |
| `Badge` | Linked entity type badges |
| `Card` | Entity Activity Panel, Filter card |
| `DataTable` | Activity Timeline list |
| `DropdownMenu` | Row actions (View Details) |
| `Form` | React Hook Form integration |
| `Toast` | Success/Error notifications |

---

## 8. Data Flow

### 8.1 Activity List Load Flow

```
User navigates to /crm/activities
        |
        v
ActivityTimeline.tsx renders
        |
        v
useActivities(params) hook fires ---------> activityService.getActivities(params)
        |                                              |
        v                                              v
React Query caches response <------- GET /api/crm/activities?PageNumber=1&PageSize=20
        |                                              |
        v                                              v
DataTable renders with data           ActivitiesController.GetActivities()
                                              |
                                              v
                                      MstActivityApplicationService.GetActivitiesAsync()
                                              |
                                              v
                                      SQL Query:
                                        SELECT a.*, links.*
                                        FROM MstActivities a
                                        LEFT JOIN MstActivityLinks links ON a.strActivityGUID = links.strActivityGUID
                                        WHERE a.strGroupGUID = @TenantId
                                        AND (filters...)
                                        ORDER BY a.dtCreatedOn DESC
                                        OFFSET @Skip ROWS FETCH NEXT @Take ROWS ONLY
                                              |
                                              v
                                      PagedResponse<ActivityListDto> return
```

### 8.2 Activity Create Flow

```
User clicks "Log Activity" -> Dialog opens
        |
        v
User fills form (type, subject, description, links)
        |
        v
Zod validation (client-side) -------- Fail? Show field errors
        | Pass
        v
useCreateActivity() mutation ---------> activityService.createActivity(dto)
        |                                              |
        v                                              v
On Success:                               POST /api/crm/activities
  - Toast "Activity logged"                      |
  - Close dialog                                 v
  - Invalidate ALL caches:              [TrimStrings] -> [FluentValidation] -> [RequireTenantId]
    * activity list cache                        |
    * entity activity cache                      v
    * upcoming activities cache         MstActivityApplicationService.CreateActivityAsync()
                                                |
                                         +------+------+
                                         v             v
                                  Validate type   Validate links
                                         |             |
                                         v             v
                                  Normalize data -> Create MstActivity
                                         |
                                         v
                                  Create MstActivityLinks (batch)
                                         |
                                         v
                                  Single SaveChangesAsync() (atomic)
                                         |
                                         v
                                  AuditLog entry -> Return ActivityListDto
```

### 8.3 Entity Activity Panel Flow

```
User opens Lead/Contact/Account detail page
        |
        v
EntityActivityPanel renders with props:
  - entityType: "Contact"
  - entityId: "contact-guid"
  - recentActivities: [...] (from detail API, optional)
        |
        +--- Has inline recentActivities? ---> YES --> Render directly (no API call!)
        |                                               |
        +--- NO inline data                             v
        |                                        Activities displayed
        v
useEntityActivities("Contact", "contact-guid") hook fires
        |
        v
GET /api/crm/activities/entity/Contact/{id}
        |
        v
Query starts from MstActivityLinks (uses covering index)
        |
        v
Join to MstActivities -> Filter -> Sort -> Paginate -> Return
```

### 8.4 Upcoming Activities Flow

```
Dashboard loads
        |
        v
useUpcomingActivities() hook fires --> GET /api/crm/activities/upcoming
        |                                       |
        v                                       v
React Query caches              SQL: SELECT TOP 20 FROM MstActivities
        |                         WHERE dtScheduledOn > GETUTCDATE()
        v                         AND dtCompletedOn IS NULL
UpcomingActivities widget         ORDER BY dtScheduledOn ASC
renders sorted list
```

---

## 9. Permissions & Access Control

### 9.1 Backend Permissions

| Permission Code | API Endpoint | Description |
|----------------|-------------|-------------|
| `CRM_Activities:View` | GET list, detail, entity, upcoming | Activities dekh sakta hai |
| `CRM_Activities:Create` | POST create | Nayi activity log kar sakta hai |

**Note:** Edit aur Delete permissions nahi hain — kyunki activities immutable hain!

### 9.2 Frontend Permission Checks

```tsx
// Timeline page mein Log Activity button
<WithPermission module={FormModules.CRM_ACTIVITY} action={Actions.SAVE}>
  <Button>Log Activity</Button>
</WithPermission>
```

### 9.3 Frontend Permission Registration

```typescript
// lib/permissions.ts
ModuleBase.CRM_ACTIVITY = "crm_activity"
ListModules.CRM_ACTIVITY = "crm_activity_list"
FormModules.CRM_ACTIVITY = "crm_activity_form"
```

### 9.4 Multi-Tenancy Security

```
1. JWT token se strGroupGUID extract hota hai (TenantContextMiddleware)
2. CrmDbContext mein global query filter: WHERE strGroupGUID = @TenantId
3. Activity create hote waqt strGroupGUID automatically set hota hai
4. Ek tenant doosre tenant ki activities kabhi nahi dekh sakta
```

### 9.5 Audit Logging

Sirf Create operation par audit log banta hai (immutable = no update/delete):

```json
{
  "entityType": "Activity",
  "action": "Create",
  "entityGUID": "activity-guid",
  "performedBy": "user-guid",
  "timestamp": "2025-03-15T13:00:00Z",
  "changes": "{ \"strActivityType\": \"Call\", \"strSubject\": \"Follow-up call\", \"LinkCount\": 2 }"
}
```

---

## 10. Related Modules & Integrations

### 10.1 Lead Module Integration

```
Lead <---> Activity (Many-to-Many via MstActivityLinks)

- Lead detail page mein recentActivities[] aata hai
- EntityActivityPanel lead form mein embed hota hai
- Activity log karte waqt link: { strEntityType: "Lead", strEntityGUID: leadGUID }
- Lead conversion ke time activities Contact + Account + Opportunity se re-link hoti hain
```

### 10.2 Contact Module Integration

```
Contact <---> Activity (Many-to-Many via MstActivityLinks)

- Contact detail page mein recentActivities[] aata hai
- EntityActivityPanel contact form mein embed hota hai
- dtLastContactedOn field activity se update hota hai
```

### 10.3 Account Module Integration

```
Account <---> Activity (Many-to-Many via MstActivityLinks)

- Account detail page mein RecentActivities[] aata hai
- EntityActivityPanel account form mein embed hota hai
- Account level activities: company-wide calls, meetings, etc.
```

### 10.4 Opportunity Module Integration

```
Opportunity <---> Activity (Many-to-Many via MstActivityLinks)

- Opportunity detail page mein activities dikhti hain
- Deal ke stages mein activity logging important hai
- Sales cycle tracking ke liye activities critical hain
```

### 10.5 Dashboard Module Integration

```
Dashboard --> UpcomingActivities widget
  - GET /api/crm/activities/upcoming
  - Next 20 scheduled activities dikhata hai
  - CrmDashboardDto.UpcomingActivities[] list use karta hai
  - intActivitiesThisWeek KPI card bhi activities se calculate hota hai
```

### 10.6 Integration Diagram

```
                    +-------------------+
                    |    Dashboard      |
                    | (KPI + Upcoming)  |
                    +--------+----------+
                             |
                             v
+----------+    +-----------+-----------+    +-----------+
|          |    |                       |    |           |
|  Leads   +--->+    ACTIVITY MODULE    +<---+ Contacts  |
|          |    |                       |    |           |
+----------+    |  - ActivityTimeline   |    +-----------+
                |  - ActivityForm       |
+----------+    |  - EntityActivityPanel|    +-----------+
|          |    |  - ActivityTypeIcon   |    |           |
| Accounts +--->+                       +<---+ Opport.   |
|          |    +-----------------------+    |           |
+----------+                                 +-----------+
```

---

## 11. Error Handling

### 11.1 Backend Errors

| Error | HTTP Status | Kab Aata Hai |
|-------|------------|-------------|
| Invalid activity type | 422 Unprocessable | Type Call/Email/Meeting/Note/Task/FollowUp mein se nahi hai |
| Subject is required | 422 Unprocessable | Subject empty ya missing hai |
| Subject exceeds 300 chars | 422 Unprocessable | Subject bahut lamba hai |
| Invalid entity type in link | 422 Unprocessable | Link ka entity type valid nahi hai |
| Empty entity GUID in link | 422 Unprocessable | Link ka GUID empty hai |
| Activity not found | 404 Not Found | GET detail mein ID se koi record nahi mila |
| Duration out of range | 422 Unprocessable | Duration 0 se kam ya 1440 se zyada hai |

### 11.2 Frontend Error Handling

```
API Error --> handleMutationError() --> Toast Notification (red/destructive)
Success   --> Toast "Activity logged successfully" + Cache Invalidation + Close Dialog
```

### 11.3 Global Exception Middleware

| Exception Type | HTTP Status | Response |
|---------------|------------|----------|
| `ValidationException` | 422 Unprocessable | `{ statusCode: 422, message: "...", errors: [...] }` |
| `NotFoundException` | 404 Not Found | `{ statusCode: 404, message: "Activity not found" }` |
| `BusinessException` | 400 Bad Request | `{ statusCode: 400, message: "..." }` |
| Any other exception | 500 Internal Server | `{ statusCode: 500, message: "Internal server error" }` |

---

## 12. Performance Optimizations

### 12.1 Backend Performance

| Optimization | Kahan | Impact |
|-------------|-------|--------|
| **AsNoTracking()** | Saari read queries | EF Core change tracker off — 30-40% faster reads |
| **SQL-level .Select() projection** | GetActivities, GetById, GetEntity | Sirf zaruri columns fetch — no full entity loading |
| **Filters BEFORE count** | GetActivitiesAsync | SQL Server pehle filter karta hai, kam rows count |
| **No .ToLower() in search** | Search queries | SQL Server ka default collation case-insensitive hai |
| **Single SaveChangesAsync()** | CreateActivityAsync | Activity + all links ek DB round-trip mein save |
| **Covering index (IX_MstActivityLinks_Entity)** | GetEntityActivities | Entity-scoped query index seek karta hai, scan nahi |
| **Take(20) cap** | GetUpcoming | Maximum 20 rows — bounded response time |
| **Append-only writes** | Immutable design | No row locks, no concurrent update conflicts |
| **Dynamic sorting** | System.Linq.Dynamic.Core | Clean SQL generation, no switch statements |

### 12.2 Frontend Performance

| Optimization | Kahan | Impact |
|-------------|-------|--------|
| **React.lazy()** | ActivityTimeline route | Code split — page load tab hoga jab navigate karenge |
| **React.memo()** | ActivityTypeIcon, EntityActivityPanel, TimelineItem | Unnecessary re-renders prevent |
| **useDebounce(400ms)** | Search input | API calls reduce — no spam on keystrokes |
| **useMemo()** | filterParams, columns, pagedData | Stable references — no child re-renders |
| **useCallback()** | Handlers (handleSort, clearFilters) | Reference stability for child components |
| **Inline recentActivities prop** | EntityActivityPanel | Detail API already returns activities — no extra API call! |
| **Promise.all() cache invalidation** | useCreateActivity onSuccess | 3 query invalidations parallel mein |
| **Conditional schedule fields** | ActivityForm | Schedule fields sirf Call/Meeting/Task/FollowUp mein render |

### 12.3 Database Performance

```
Query Plan Example — GetEntityActivities:

1. Index Seek on IX_MstActivityLinks_Entity (strEntityType, strEntityGUID)
   --> Directly finds rows for this entity (O(log n))

2. Nested Loop Join to MstActivities (using PK)
   --> Fetches only matched activities

3. SELECT only projected columns
   --> Minimal data transfer

4. OFFSET/FETCH for pagination
   --> No full result set materialized

Result: Sub-millisecond for typical entity with 50-100 activities
```

---

## 13. File Structure

### 13.1 Backend Files

```
crm-backend/
+-- Controllers/
|   +-- ActivitiesController.cs              # REST API endpoints (5 endpoints, no PUT/DELETE)
|
+-- Models/Core/CustomerData/
|   +-- MstActivity.cs                       # Entity model (12 properties, immutable)
|   +-- MstActivityLink.cs                   # Polymorphic junction model (5 properties)
|
+-- DTOs/CustomerData/
|   +-- ActivityDtos.cs                      # CreateActivityDto, ActivityLinkDto,
|                                            # ActivityListDto, ActivityFilterParams
|   +-- CrmDashboardDtos.cs                  # UpcomingActivityDto (shared with dashboard)
|
+-- ApplicationServices/
|   +-- Interfaces/
|   |   +-- IMstActivityApplicationService.cs # 5 method signatures
|   +-- CustomerData/
|       +-- MstActivityApplicationService.cs  # Core business logic (5 methods)
|
+-- Services/
|   +-- CustomerData/
|       +-- MstActivityService.cs             # Domain validation (type + links)
|
+-- Interfaces/
|   +-- IActivityService.cs                  # Domain service interface
|
+-- DataAccess/
|   +-- Interfaces/
|   |   +-- IMstActivityRepository.cs        # Extends IRepository<MstActivity>
|   |   +-- IMstActivityLinkRepository.cs    # + GetByEntityAsync method
|   +-- Repositories/
|       +-- MstActivityRepository.cs         # Standard CRUD
|       +-- MstActivityLinkRepository.cs     # CRUD + entity-scoped query
|       +-- UnitOfWork.cs                    # Activities + ActivityLinks properties
|
+-- Validators/
|   +-- ActivityCreateDtoValidator.cs        # FluentValidation (type, subject, links)
|
+-- Constants/
|   +-- ActivityTypeConstants.cs             # Call, Email, Meeting, Note, Task, FollowUp
|   +-- EntityTypeConstants.cs               # Lead, Contact, Account, Opportunity, etc.
|
+-- Data/
|   +-- CrmDbContext.cs                      # MstActivities + MstActivityLinks config
|
+-- Program.cs                               # DI: IActivityService + IMstActivityApplicationService
```

### 13.2 Frontend Files

```
audit-frontend/src/
+-- pages/CRM/activities/
|   +-- ActivityTimeline.tsx                 # Main list page (DataTable + filters + search)
|   +-- components/
|       +-- ActivityTypeIcon.tsx             # Color-coded type icons (memo'd)
|       +-- ActivityForm.tsx                 # Create dialog (Zod validated)
|
+-- pages/CRM/components/
|   +-- EntityActivityPanel.tsx              # Shared timeline panel (for entity detail pages)
|
+-- types/CRM/
|   +-- activity.ts                         # TypeScript interfaces + constants
|
+-- validations/CRM/
|   +-- activity.ts                         # Zod validation schema
|
+-- services/CRM/
|   +-- activity.service.ts                 # API service (5 methods)
|
+-- hooks/api/CRM/
|   +-- use-activities.ts                   # React Query hooks (5 hooks)
|
+-- routes/
|   +-- crm-routes.tsx                      # crm_activity_list -> ActivityTimeline
|
+-- lib/
|   +-- permissions.ts                      # CRM_ACTIVITY module registered
|
+-- types/CRM/
    +-- index.ts                            # Re-exports activity types
```

---

## Summary

Activity Module CRM system ka **interaction tracking + audit trail** system hai jo:

1. **Immutable Records** — Ek baar create hone ke baad na update hota hai, na delete — tamper-proof audit trail
2. **6 Activity Types** — Call, Email, Meeting, Note, Task, FollowUp — sabhi interactions cover
3. **Polymorphic Links** — Ek activity multiple entities (Lead, Contact, Account, Opportunity) se link ho sakti hai — Salesforce-style flexibility
4. **Blazing Fast** — AsNoTracking, SQL-level projections, covering indexes, append-only writes
5. **Multi-Tenant** — Har organization ka data alag-alag isolated rehta hai
6. **Rich Timeline UI** — Color-coded icons, debounced search, advanced filters, drag-reorder columns
7. **Reusable Panel** — EntityActivityPanel kisi bhi entity detail page mein embed ho sakta hai
8. **Smart Caching** — React Query se intelligent cache invalidation, inline data support
9. **Full Validation** — FluentValidation (backend) + Zod (frontend) — double protection
10. **Audit Logged** — Har nayi activity ka audit trail MstAuditLogs mein banta hai
