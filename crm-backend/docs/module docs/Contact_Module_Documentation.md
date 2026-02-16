# Contact Module - Comprehensive Documentation

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
12. [File Structure](#12-file-structure)

---

## 1. Overview

Contact Module CRM system ka ek core module hai jo sabhi customer/prospect contacts ko manage karta hai. Yeh module contacts ki complete lifecycle track karta hai - jab se koi subscriber banta hai tab se lekar jab tak woh customer ya evangelist ban jaata hai.

**Tech Stack:**
- **Backend:** ASP.NET Core (C#), Entity Framework Core, SQL Server
- **Frontend:** React (TypeScript), TanStack React Query, React Hook Form, Zod Validation, Tailwind CSS, Shadcn/UI
- **Pattern:** Clean Architecture (Controller → Application Service → Domain Service → Repository → Database)

---

## 2. Module Purpose & Use Cases

### Kya Kaam Aata Hai (Purpose)

| Use Case | Description |
|----------|-------------|
| **Contact Management** | Sabhi business contacts ko ek jagah store aur manage karna |
| **Lifecycle Tracking** | Contact ki journey track karna - Subscriber se Customer tak |
| **Account Linking** | Contacts ko unki company/account se link karna |
| **Opportunity Mapping** | Contact ko sales opportunities se jodna |
| **Activity Tracking** | Calls, emails, meetings, notes - sab kuch track karna |
| **Team Assignment** | Contact ko team member ko assign karna |
| **Bulk Operations** | Multiple contacts ko ek saath archive/restore karna |
| **Search & Filter** | Name, email, phone, lifecycle stage, account se search aur filter karna |

### Contact Lifecycle Stages (7 Stages)

```
Subscriber → Lead → MQL → SQL → Opportunity → Customer → Evangelist
```

| Stage | Hindi Meaning | Description |
|-------|--------------|-------------|
| **Subscriber** | Subscriber | Abhi sirf subscribe kiya hai, newsletter ya website par |
| **Lead** | Potential Customer | Interest dikhaya hai, contact details di hain |
| **MQL** | Marketing Qualified Lead | Marketing team ne qualify kiya hai |
| **SQL** | Sales Qualified Lead | Sales team ne qualify kiya hai, ready for sales |
| **Opportunity** | Business Opportunity | Active deal/opportunity ban gayi hai |
| **Customer** | Customer | Purchase kar liya hai, customer ban gaya |
| **Evangelist** | Brand Ambassador | Khush customer jo doosron ko bhi refer karta hai |

### Contact Status Types

| Status | Description |
|--------|-------------|
| **Active** | Contact active hai, interact ho raha hai |
| **Inactive** | Contact inactive hai, archive kiya gaya hai |
| **Bounced** | Email bounce ho raha hai |
| **Unsubscribed** | Contact ne unsubscribe kar diya hai |

---

## 3. Architecture & Approach

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ContactList.tsx  │  ContactForm.tsx  │  Hooks/Services  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (REST API)
┌────────────────────────▼────────────────────────────────┐
│                 CONTROLLER LAYER                         │
│              ContactsController.cs                       │
│  [RequireTenantId] [AuthorizePermission] [AuditLog]     │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│            APPLICATION SERVICE LAYER                     │
│         MstContactApplicationService.cs                  │
│  (Orchestration, DTO Mapping, Pagination, Filtering)     │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              DOMAIN SERVICE LAYER                        │
│            MstContactService.cs                          │
│     (Business Rules, Lifecycle Validation)                │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              REPOSITORY LAYER                            │
│          MstContactRepository.cs                         │
│          + UnitOfWork.cs                                 │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                DATABASE (SQL Server)                      │
│  MstContacts  │  MstOpportunityContacts  │  MstAccounts  │
└─────────────────────────────────────────────────────────┘
```

### Key Design Patterns

| Pattern | Kahan Use Hota Hai | Kyun |
|---------|-------------------|------|
| **Repository Pattern** | Data Access Layer | Database operations ko abstract karna |
| **Unit of Work** | Transaction Management | Multiple repositories ko ek transaction mein wrap karna |
| **DTO Pattern** | API Communication | Internal models ko expose nahi karna, sirf zaruri data bhejn |
| **Soft Delete** | Delete Operations | Data permanently delete nahi hota, sirf flag set hota hai |
| **Multi-Tenancy** | Data Isolation | Har organization ka data alag-alag rehta hai (strGroupGUID se) |
| **Global Query Filter** | EF Core | Har query mein automatically tenant aur soft delete filter lagta hai |
| **FluentValidation** | Input Validation | Server-side validation rules centralized hain |
| **React Query** | Frontend State | Server state management with caching, auto-refetch |
| **React Hook Form** | Form Management | Performant form handling with Zod validation |

---

## 4. Database Schema

### 4.1 MstContacts Table (Primary Table)

```sql
CREATE TABLE MstContacts (
    strContactGUID          UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
    strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,          -- Tenant ID
    strAccountGUID          UNIQUEIDENTIFIER    NULL,              -- FK → MstAccounts
    strFirstName            NVARCHAR(100)       NOT NULL,
    strLastName             NVARCHAR(100)       NOT NULL,
    strEmail                NVARCHAR(255)       NOT NULL,
    strPhone                NVARCHAR(20)        NULL,
    strMobilePhone          NVARCHAR(20)        NULL,
    strJobTitle             NVARCHAR(150)       NULL,
    strDepartment           NVARCHAR(100)       NULL,
    strLifecycleStage       NVARCHAR(50)        DEFAULT 'Subscriber',
    strAddress              NVARCHAR(500)       NULL,
    strCity                 NVARCHAR(100)       NULL,
    strState                NVARCHAR(100)       NULL,
    strCountry              NVARCHAR(100)       NULL,
    strPostalCode           NVARCHAR(20)        NULL,
    strNotes                NVARCHAR(MAX)       NULL,
    dtLastContactedOn       DATETIME2           NULL,
    strAssignedToGUID       UNIQUEIDENTIFIER    NULL,
    strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
    strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
    dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
    dtUpdatedOn             DATETIME2           NULL,
    bolIsActive             BIT                 DEFAULT 1,
    bolIsDeleted            BIT                 DEFAULT 0,
    dtDeletedOn             DATETIME2           NULL
);
```

**Total Columns:** 25
**Required Fields:** strContactGUID, strGroupGUID, strFirstName, strLastName, strEmail, strCreatedByGUID, dtCreatedOn

### 4.2 Indexes

| Index Name | Column(s) | Purpose |
|-----------|-----------|---------|
| `IX_MstContacts_GroupGUID` | strGroupGUID | Multi-tenant filtering (fast tenant queries) |
| `IX_MstContacts_AccountGUID` | strAccountGUID | Account relationship lookup |
| `IX_MstContacts_Email` | strEmail | Email uniqueness check aur search |

### 4.3 MstOpportunityContacts (Junction Table - Many-to-Many)

```sql
CREATE TABLE MstOpportunityContacts (
    strOpportunityContactGUID   UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
    strOpportunityGUID          UNIQUEIDENTIFIER    NOT NULL,    -- FK → MstOpportunities
    strContactGUID              UNIQUEIDENTIFIER    NOT NULL,    -- FK → MstContacts
    strRole                     NVARCHAR(50)        DEFAULT 'Stakeholder',
    bolIsPrimary                BIT                 DEFAULT 0,
    dtCreatedOn                 DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

    UNIQUE (strOpportunityGUID, strContactGUID)      -- Ek opportunity mein ek contact ek baar
);
```

**Contact-Opportunity Roles:**

| Role | Description |
|------|-------------|
| **DecisionMaker** | Jo final decision leta hai |
| **Influencer** | Jo decision influence karta hai |
| **Champion** | Jo deal ko internally push karta hai |
| **Stakeholder** | Jo deal se affected hai (Default) |
| **EndUser** | Jo product actual mein use karega |

### 4.4 Entity Relationships Diagram

```
MstAccounts (1) ──────────< MstContacts (N)
     │                           │
     │                           │
     └──────< MstOpportunities (N)──────< MstOpportunityContacts >──────── MstContacts
                    │
                    │
                    └──< MstActivityLinks >──── MstActivities
                              ▲
                              │
              MstContacts ────┘ (via strEntityType = 'Contact')
```

### 4.5 Multi-Tenancy & Soft Delete

```
Har query par automatically yeh filter lagta hai:
  WHERE strGroupGUID = @TenantId AND bolIsDeleted = 0

- strGroupGUID: Organization/Company ka unique ID (JWT token se aata hai)
- bolIsDeleted: Soft delete flag (delete karne par true set hota hai)
- QueryIncludingDeleted() method se soft-deleted records bhi dekh sakte hain
```

---

## 5. Backend API

### 5.1 API Endpoints

**Base URL:** `/api/crm/contacts`

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| `GET` | `/api/crm/contacts` | CRM_Contacts:View | Contacts list with pagination, filtering, search |
| `GET` | `/api/crm/contacts/{id}` | CRM_Contacts:View | Single contact ki detail (opportunities, activities sahit) |
| `POST` | `/api/crm/contacts` | CRM_Contacts:Create | Naya contact create karna |
| `PUT` | `/api/crm/contacts/{id}` | CRM_Contacts:Edit | Existing contact update karna |
| `DELETE` | `/api/crm/contacts/{id}` | CRM_Contacts:Delete | Contact soft delete karna |
| `POST` | `/api/crm/contacts/bulk-archive` | CRM_Contacts:Edit | Multiple contacts ek saath archive karna |
| `POST` | `/api/crm/contacts/bulk-restore` | CRM_Contacts:Edit | Multiple contacts ek saath restore karna |

### 5.2 Request/Response DTOs

#### CreateContactDto (POST Request Body)

```json
{
  "strAccountGUID": "guid | null",        // Optional - Account se link
  "strFirstName": "string (required)",     // Max 100 chars
  "strLastName": "string (required)",      // Max 100 chars
  "strEmail": "string (required)",         // Valid email, max 255 chars
  "strPhone": "string | null",             // Max 20 chars
  "strMobilePhone": "string | null",       // Max 20 chars
  "strJobTitle": "string | null",          // Max 150 chars
  "strDepartment": "string | null",        // Max 100 chars
  "strLifecycleStage": "string | null",    // Must be valid stage
  "strAddress": "string | null",           // Max 500 chars
  "strCity": "string | null",              // Max 100 chars
  "strState": "string | null",             // Max 100 chars
  "strCountry": "string | null",           // Max 100 chars
  "strPostalCode": "string | null",        // Max 20 chars
  "strNotes": "string | null",             // Unlimited
  "strAssignedToGUID": "guid | null"       // Team member ko assign
}
```

#### ContactListDto (GET List Response)

```json
{
  "strContactGUID": "guid",
  "strFirstName": "Rajat",
  "strLastName": "Rajawat",
  "strEmail": "rajat@example.com",
  "strPhone": "+91-9876543210",
  "strJobTitle": "CTO",
  "strAccountName": "TechCorp Pvt Ltd",
  "strLifecycleStage": "Customer",
  "strAssignedToGUID": "guid | null",
  "strAssignedToName": "Deepak Kumar",
  "dtCreatedOn": "2025-01-15T10:30:00Z",
  "bolIsActive": true
}
```

#### ContactDetailDto (GET Detail Response)

```json
{
  "strContactGUID": "guid",
  "strFirstName": "Rajat",
  "strLastName": "Rajawat",
  "strEmail": "rajat@example.com",
  "strPhone": "+91-9876543210",
  "strMobilePhone": "+91-9876543210",
  "strJobTitle": "CTO",
  "strDepartment": "Technology",
  "strAccountGUID": "guid",
  "strAccountName": "TechCorp Pvt Ltd",
  "strLifecycleStage": "Customer",
  "strAddress": "123, MG Road",
  "strCity": "Jaipur",
  "strState": "Rajasthan",
  "strCountry": "India",
  "strPostalCode": "302001",
  "strNotes": "Important client, prefers morning calls",
  "dtLastContactedOn": "2025-03-01T14:00:00Z",
  "strAssignedToGUID": "guid",
  "strAssignedToName": "Deepak Kumar",
  "dtCreatedOn": "2025-01-15T10:30:00Z",
  "bolIsActive": true,
  "opportunities": [
    {
      "strOpportunityGUID": "guid",
      "strOpportunityName": "Enterprise License Deal",
      "strStageName": "Negotiation",
      "strStatus": "Open",
      "dblAmount": 500000,
      "strCurrency": "INR"
    }
  ],
  "recentActivities": [
    {
      "strActivityGUID": "guid",
      "strActivityType": "Call",
      "strSubject": "Follow-up Call",
      "dtScheduledOn": "2025-03-01T14:00:00Z"
    }
  ]
}
```

#### ContactFilterParams (GET List Query Params)

```
GET /api/crm/contacts?PageNumber=1&PageSize=20&Search=rajat&SortBy=strFirstName&Ascending=true&bolIsActive=true&strLifecycleStage=Customer&strAccountGUID=xxx&strAssignedToGUID=xxx
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `PageNumber` | int | 1 | Page number |
| `PageSize` | int | 20 | Items per page |
| `Search` | string | null | Full-text search (name, email, phone, job title, account name) |
| `SortBy` | string | null | Column name for sorting |
| `Ascending` | bool | true | Sort direction |
| `bolIsActive` | bool? | null | Active/Inactive filter |
| `strLifecycleStage` | string | null | Lifecycle stage filter |
| `strAccountGUID` | guid | null | Account filter |
| `strAssignedToGUID` | guid | null | Assigned user filter |

#### Paginated Response Wrapper

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "items": [ /* ContactListDto[] */ ],
    "totalCount": 150,
    "pageNumber": 1,
    "pageSize": 20,
    "totalPages": 8,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

### 5.3 Validation Rules (FluentValidation)

| Field | Rules |
|-------|-------|
| strFirstName | Required, Max 100 chars |
| strLastName | Required, Max 100 chars |
| strEmail | Required, Valid email format, Max 255 chars, Unique per tenant |
| strPhone | Optional, Max 20 chars |
| strMobilePhone | Optional, Max 20 chars |
| strJobTitle | Optional, Max 150 chars |
| strDepartment | Optional, Max 100 chars |
| strLifecycleStage | Must be valid stage (Subscriber/Lead/MQL/SQL/Opportunity/Customer/Evangelist) |
| strAddress | Optional, Max 500 chars |
| strCity | Optional, Max 100 chars |
| strState | Optional, Max 100 chars |
| strCountry | Optional, Max 100 chars |
| strPostalCode | Optional, Max 20 chars |

### 5.4 Data Normalization

Jab bhi contact create ya update hota hai, DataNormalizationHelper apply hota hai:

| Operation | Example |
|-----------|---------|
| **Email Normalization** | "  Rajat@EXAMPLE.com  " → "rajat@example.com" |
| **Name Normalization** | "  rAJAT  " → "Rajat" (first letter capital) |
| **Phone Normalization** | "+91 - 9876 - 543210" → "+919876543210" (spaces/hyphens removed) |
| **String Trimming** | "  value  " → "value" (auto TrimStrings attribute) |

---

## 6. Business Logic & Rules

### 6.1 Contact Create Flow

```
1. Request aata hai → TrimStrings attribute strings trim karta hai
2. FluentValidation rules check hoti hain
3. Email normalize hota hai (lowercase, trim)
4. Email uniqueness check hoti hai (same tenant mein duplicate nahi ho sakta)
5. Agar strAccountGUID diya hai → Account existence verify hoti hai
6. Agar strLifecycleStage diya hai → Valid stage check hoti hai
7. DataNormalizationHelper se sab fields normalize hoti hain
8. Contact database mein save hota hai
9. AuditLog attribute se audit entry banti hai
10. ContactDetailDto return hota hai
```

### 6.2 Contact Update Flow

```
1. Contact existence check (NotFoundException agar nahi mila)
2. Email uniqueness check (apne aap ko exclude karke)
3. Account validation (agar change kiya hai)
4. Lifecycle stage transition validation
5. Old values capture for audit comparison
6. Sab fields update hoti hain with normalization
7. AuditLog se changes record hoti hain
8. Updated ContactDetailDto return hota hai
```

### 6.3 Contact Delete Flow (Soft Delete)

```
1. Contact existence check
2. bolIsDeleted = true set hota hai
3. bolIsActive = false set hota hai
4. dtDeletedOn = current UTC time set hota hai
5. strUpdatedByGUID = current user set hota hai
6. AuditLog entry banti hai
7. Contact list se gayab ho jaata hai (query filter ke kaaran)
8. Data physically database mein rehta hai
```

### 6.4 Bulk Archive/Restore Flow

```
Archive:
1. List of GUIDs aati hai
2. Sab contacts ek query mein fetch hote hain
3. Har ek ka bolIsActive = false set hota hai
4. dtUpdatedOn aur strUpdatedByGUID update hota hai
5. Single SaveChanges call

Restore:
1. Same process, bolIsActive = true set hota hai
```

### 6.5 Email Uniqueness Rule

```
- Same tenant (strGroupGUID) mein 2 contacts ka email same nahi ho sakta
- Email comparison case-insensitive hai (normalize karke check hota hai)
- Update ke time current contact ko exclude karke check hota hai
- Error Code: CONTACT_DUPLICATE_EMAIL
```

---

## 7. Frontend UI/UX

### 7.1 Contact List Page (`/crm/contacts`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  PageHeader                                                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 📋 Contacts                              [+ Add Contact]     │   │
│  │ Manage your business contacts                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Filters & Search Bar                                               │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 🔍 Search... │  │ Lifecycle ▼   │  │ Status ▼ │  │ Columns ▼│  │
│  └──────────────┘  └───────────────┘  └──────────┘  └──────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Name          │ Email         │ Phone  │ Job Title │ Account │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Rajat Rajawat │ rajat@ex.com  │ +91... │ CTO       │ TechCo  │   │
│  │  [Customer]   │               │        │           │         │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ Deepak Kumar  │ deep@ex.com   │ +91... │ Manager   │ InfoSys │   │
│  │  [Lead]       │               │        │           │         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Pagination: < 1 2 3 ... 8 >    Showing 1-20 of 150                │
└─────────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Search:** Full-text search with 400ms debounce (naam, email, phone, job title, account name mein search)
- **Filters:** Lifecycle Stage dropdown, Active/Inactive toggle
- **Sorting:** Kisi bhi column par click karke sort ho jaata hai (ascending/descending)
- **Pagination:** Page number, page size configurable
- **Column Visibility:** Columns hide/show kar sakte hain, drag karke reorder kar sakte hain
- **Column Preferences:** LocalStorage mein save hoti hain (browser band karne par bhi yaad rehti hain)
- **Actions:** Edit (new tab mein khulta hai), Delete (confirmation dialog ke saath)
- **Lifecycle Badge:** Color-coded badge har contact ke saath
- **Responsive:** Mobile-friendly layout

### 7.2 Contact Form Page (`/crm/contacts/new` or `/crm/contacts/:id`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PageHeader                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ 📋 Create Contact / Edit Contact            [Delete] [Save]      │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────┐  ┌────────────────────────────┐   │
│  │ MAIN FORM (2/3 width)            │  │ SIDEBAR (1/3 width)        │   │
│  │                                  │  │                            │   │
│  │ ── Personal Information ──       │  │ ── Contact Info Card ──    │   │
│  │ First Name*    [__________]      │  │ Lifecycle: [Customer]      │   │
│  │ Last Name*     [__________]      │  │ Account:   TechCorp        │   │
│  │ Email*         [__________]      │  │ Created:   15 Jan 2025     │   │
│  │ Phone          [__________]      │  │ Last Contact: 01 Mar 2025  │   │
│  │ Mobile Phone   [__________]      │  │ Assigned To: Deepak Kumar  │   │
│  │                                  │  │                            │   │
│  │ ── Professional Information ──   │  │ ── Related Opportunities ──│   │
│  │ Job Title      [__________]      │  │ Enterprise License Deal    │   │
│  │ Department     [__________]      │  │   Stage: Negotiation       │   │
│  │ Lifecycle Stage [▼ Dropdown]     │  │   Status: Open             │   │
│  │                                  │  │   Amount: ₹5,00,000        │   │
│  │ ── Address ──                    │  │                            │   │
│  │ Street Address [__________]      │  │ ── Recent Activities ──    │   │
│  │ City           [__________]      │  │ 📞 Follow-up Call          │   │
│  │ State          [__________]      │  │    01 Mar 2025, 2:00 PM    │   │
│  │ Country        [__________]      │  │ 📧 Proposal Email          │   │
│  │ Postal Code    [__________]      │  │    28 Feb 2025, 10:00 AM   │   │
│  │                                  │  │ 📅 Product Demo Meeting    │   │
│  │ ── Notes ──                      │  │    25 Feb 2025, 11:00 AM   │   │
│  │ [______________________________] │  │                            │   │
│  │ [______________________________] │  │                            │   │
│  └──────────────────────────────────┘  └────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Form Sections:**

| Section | Fields | Description |
|---------|--------|-------------|
| **Personal Information** | First Name*, Last Name*, Email*, Phone, Mobile Phone | Basic contact details |
| **Professional Information** | Job Title, Department, Lifecycle Stage | Work-related info |
| **Address** | Street, City, State, Country, Postal Code | Location details |
| **Notes** | Free-text notes | Additional remarks |

**Sidebar Sections (Read-only, sirf Edit mode mein dikhti hain):**

| Section | Content |
|---------|---------|
| **Contact Info Card** | Lifecycle badge, Account name, Created date, Last contacted, Assigned to |
| **Related Opportunities** | Linked opportunities with stage, status, amount |
| **Recent Activities** | Last 5 activities (Call, Email, Meeting, Note) with timestamps |

**Form Behavior:**
- React Hook Form + Zod validation (real-time validation)
- Create mode: Empty form, Save button
- Edit mode: Pre-filled form with existing data + sidebar info
- Save ke baad list page par redirect hota hai
- Delete button sirf edit mode mein dikhta hai (confirmation dialog ke saath)
- Loading state mein ContactFormSkeleton dikhta hai

### 7.3 Lifecycle Badge Colors

| Stage | Color | Dark Mode Color |
|-------|-------|----------------|
| Subscriber | Gray (`bg-gray-100 text-gray-700`) | `dark:bg-gray-800 dark:text-gray-300` |
| Lead | Blue (`bg-blue-100 text-blue-700`) | `dark:bg-blue-900 dark:text-blue-300` |
| MQL | Indigo (`bg-indigo-100 text-indigo-700`) | `dark:bg-indigo-900 dark:text-indigo-300` |
| SQL | Purple (`bg-purple-100 text-purple-700`) | `dark:bg-purple-900 dark:text-purple-300` |
| Opportunity | Amber (`bg-amber-100 text-amber-700`) | `dark:bg-amber-900 dark:text-amber-300` |
| Customer | Emerald (`bg-emerald-100 text-emerald-700`) | `dark:bg-emerald-900 dark:text-emerald-300` |
| Evangelist | Pink (`bg-pink-100 text-pink-700`) | `dark:bg-pink-900 dark:text-pink-300` |

### 7.4 UI Components Used (Shadcn/UI)

| Component | Kahan Use Hota Hai |
|-----------|-------------------|
| `Card` | Form sections, Sidebar cards |
| `Button` | Save, Delete, Add Contact, Edit actions |
| `Input` | Text fields (name, email, phone, etc.) |
| `Textarea` | Notes field |
| `Select` | Lifecycle stage, Account dropdown |
| `Badge` | Lifecycle stage badge, Active/Inactive status |
| `DataTable` | Contact list table |
| `Dialog` | Delete confirmation |
| `Form` | React Hook Form integration |
| `Skeleton` | Loading state placeholders |
| `Toast` | Success/Error notifications |

### 7.5 Activity Icons

| Activity Type | Icon |
|--------------|------|
| Call | Phone icon |
| Email | Mail icon |
| Meeting | CalendarDays icon |
| Note | MessageSquare icon |

---

## 8. Data Flow

### 8.1 Contact List Load Flow

```
User navigates to /crm/contacts
        │
        ▼
ContactList.tsx renders
        │
        ▼
useContacts(params) hook fires ──────► contactService.getContacts(params)
        │                                         │
        ▼                                         ▼
React Query caches response ◄──── GET /api/crm/contacts?PageNumber=1&PageSize=20
        │                                         │
        ▼                                         ▼
DataTable renders with data      ContactsController.GetList()
                                         │
                                         ▼
                                 MstContactApplicationService.GetContactsAsync()
                                         │
                                         ▼
                                 SQL Query with filters, joins, pagination
                                         │
                                         ▼
                                 PagedResponse<ContactListDto> return
```

### 8.2 Contact Create Flow

```
User fills form and clicks Save
        │
        ▼
Zod validation (client-side) ──── Fail? Show field errors
        │ Pass
        ▼
useCreateContact() mutation ──────► contactService.createContact(dto)
        │                                         │
        ▼                                         ▼
On Success:                        POST /api/crm/contacts
  - Toast "Created"                       │
  - Invalidate list cache                 ▼
  - Navigate to list              [TrimStrings] → [FluentValidation] → [RequireTenantId]
                                         │
                                         ▼
                                 MstContactApplicationService.CreateContactAsync()
                                         │
                                  ┌──────┴──────┐
                                  ▼             ▼
                           Email unique?   Account exists?
                                  │             │
                                  ▼             ▼
                           Normalize data → Save to DB → Audit Log
                                  │
                                  ▼
                           Return ContactDetailDto
```

### 8.3 Contact Update Flow

```
User edits form and clicks Save
        │
        ▼
Zod validation → useUpdateContact() → PUT /api/crm/contacts/{id}
        │                                      │
        ▼                                      ▼
On Success:                           Existence check → Email unique check
  - Toast "Updated"                           │
  - Invalidate list + detail cache            ▼
  - Navigate to list                  Lifecycle validation → Normalize → Update → Audit
```

### 8.4 Contact Delete Flow

```
User clicks Delete → Confirmation Dialog → "Yes, Delete"
        │
        ▼
useDeleteContact() → DELETE /api/crm/contacts/{id}
        │                          │
        ▼                          ▼
On Success:                 bolIsDeleted = true
  - Toast "Deleted"         bolIsActive = false
  - Invalidate list cache   dtDeletedOn = UTC now
  - Navigate to list
```

---

## 9. Permissions & Access Control

### 9.1 Backend Permissions

| Permission Code | API Endpoint | Description |
|----------------|-------------|-------------|
| `CRM_Contacts:View` | GET list & detail | Contacts dekh sakta hai |
| `CRM_Contacts:Create` | POST create | Naya contact bana sakta hai |
| `CRM_Contacts:Edit` | PUT update, bulk ops | Contact edit/archive/restore kar sakta hai |
| `CRM_Contacts:Delete` | DELETE | Contact delete kar sakta hai |

### 9.2 Frontend Permission Checks

```tsx
// List page mein Add button
<WithPermission module="CRM_CONTACT" action="SAVE">
  <Button>Add Contact</Button>
</WithPermission>

// Table mein Edit action
<WithPermission module="CRM_CONTACT" action="EDIT">
  <Button>Edit</Button>
</WithPermission>

// Table mein Delete action
<WithPermission module="CRM_CONTACT" action="DELETE">
  <Button>Delete</Button>
</WithPermission>
```

### 9.3 Multi-Tenancy Security

```
1. JWT token se strGroupGUID extract hota hai (TenantContextMiddleware)
2. HttpContext.Items["TenantId"] mein store hota hai
3. CrmDbContext mein global query filter lagta hai
4. Har query mein automatically: WHERE strGroupGUID = @TenantId
5. Ek tenant doosre tenant ka data kabhi nahi dekh sakta
```

### 9.4 Audit Logging

Har Create, Update, Delete operation par AuditLog entry banti hai:

```json
{
  "entityType": "Contact",
  "action": "Create | Update | Delete",
  "entityGUID": "contact-guid",
  "performedBy": "user-guid",
  "timestamp": "2025-01-15T10:30:00Z",
  "oldValues": "{ ... }",    // sirf Update mein
  "newValues": "{ ... }"
}
```

---

## 10. Related Modules & Integrations

### 10.1 Account Module Integration

```
Contact ←──→ Account (Many-to-One)

- Ek contact ek account se linked ho sakta hai
- Account delete hone par contact ka strAccountGUID NULL ho jaata hai (SET NULL)
- Contact form mein Account dropdown se select kar sakte hain
- Contact list mein Account name dikhta hai
```

### 10.2 Opportunity Module Integration

```
Contact ←──→ Opportunity (Many-to-Many via MstOpportunityContacts)

- Ek contact multiple opportunities mein ho sakta hai
- Ek opportunity mein multiple contacts ho sakte hain
- Har contact ka ek role hota hai (DecisionMaker, Influencer, etc.)
- Ek contact primary bhi ho sakta hai (bolIsPrimary)
- Contact detail page mein related opportunities dikhti hain
```

### 10.3 Activity Module Integration

```
Contact ←──→ Activity (Many-to-Many via MstActivityLinks, Polymorphic)

- Activities strEntityType = 'Contact' aur strEntityGUID = strContactGUID se link hoti hain
- Activity types: Call, Email, Meeting, Note
- Contact detail page mein last 5 activities dikhti hain
- dtLastContactedOn field track karta hai ki aakhri baar kab contact hua
```

### 10.4 Party Contact Module (Separate)

```
Party Contact ek alag module hai jo Account/Customer module mein use hota hai:
- PartyContactList: Party form mein embedded list
- PartyContactModal: Create/Edit modal
- Alag API endpoints: /api/account/PartyContact
- Alag fields: Salutation, Designation, Social media handles (Twitter, Facebook, Instagram, Skype)
- CRM Contact se alag hai - yeh accounting/customer management ke liye hai
```

---

## 11. Error Handling

### 11.1 Backend Error Codes

| Error Code | HTTP Status | Kab Aata Hai |
|-----------|------------|-------------|
| `CONTACT_NOT_FOUND` | 404 | Contact ID se koi record nahi mila |
| `CONTACT_DUPLICATE_EMAIL` | 400 | Same tenant mein email already exists |
| `CONTACT_INVALID_LIFECYCLE_STAGE` | 400 | Invalid lifecycle stage value |
| `CONTACT_ACCOUNT_NOT_FOUND` | 400 | Given account GUID ka account nahi mila |
| `CONTACT_HAS_ACTIVE_OPPORTUNITIES` | 400 | Delete ke time active opportunities hain |

### 11.2 Frontend Error Handling

```
API Error → handleMutationError() → Toast Notification (red/destructive)
Success   → Toast Notification (green/success) + Cache Invalidation + Navigation
```

### 11.3 Global Exception Middleware

| Exception Type | HTTP Status | Response |
|---------------|------------|----------|
| `BusinessException` | 400 Bad Request | `{ statusCode: 400, message: "...", errorCode: "..." }` |
| `NotFoundException` | 404 Not Found | `{ statusCode: 404, message: "...", errorCode: "..." }` |
| `ValidationException` | 422 Unprocessable | `{ statusCode: 422, message: "...", errors: [...] }` |
| `UnauthorizedAccessException` | 401 Unauthorized | `{ statusCode: 401, message: "..." }` |
| Any other exception | 500 Internal Server | `{ statusCode: 500, message: "Internal server error" }` |

---

## 12. File Structure

### 12.1 Backend Files

```
crm-backend/
├── Controllers/
│   └── ContactsController.cs              # REST API endpoints (7 endpoints)
│
├── Models/Core/CustomerData/
│   ├── MstContact.cs                      # Entity model (25 properties)
│   ├── MstOpportunityContact.cs           # Junction table model
│   ├── MstAccount.cs                      # Related account model
│   ├── MstActivity.cs                     # Related activity model
│   └── MstActivityLink.cs                 # Polymorphic activity link
│
├── DTOs/CustomerData/
│   └── ContactDtos.cs                     # CreateContactDto, UpdateContactDto,
│                                          # ContactListDto, ContactDetailDto,
│                                          # ContactBulkArchiveDto, ContactFilterParams
│
├── ApplicationServices/
│   ├── Interfaces/
│   │   └── IMstContactApplicationService.cs
│   └── CustomerData/
│       └── MstContactApplicationService.cs # Business orchestration (7 methods)
│
├── Services/
│   └── CustomerData/
│       └── MstContactService.cs            # Domain logic (lifecycle validation)
│
├── DataAccess/
│   ├── Interfaces/
│   │   ├── IMstContactRepository.cs
│   │   └── IMstOpportunityContactRepository.cs
│   └── Repositories/
│       ├── MstContactRepository.cs         # Data access (CRUD + email lookup)
│       ├── MstOpportunityContactRepository.cs
│       └── UnitOfWork.cs                   # Transaction management
│
├── Validators/
│   ├── ContactCreateDtoValidator.cs        # FluentValidation rules
│   └── ContactUpdateDtoValidator.cs        # FluentValidation rules
│
├── Constants/
│   ├── ContactLifecycleStageConstants.cs   # 7 lifecycle stages
│   ├── ContactStatusConstants.cs           # Active, Inactive, Bounced, Unsubscribed
│   ├── ContactErrorCodes.cs               # 5 error codes
│   └── OpportunityContactMapping.cs        # 5 contact roles
│
├── Helpers/
│   └── DataNormalizationHelper.cs          # Email, Name, Phone normalization
│
├── Attributes/
│   ├── RequireTenantIdAttribute.cs         # Tenant validation
│   ├── AuthorizePermissionAttribute.cs     # Permission check
│   ├── AuditLogAttribute.cs               # Audit logging
│   └── TrimStringsAttribute.cs            # Auto string trimming
│
├── Data/
│   └── CrmDbContext.cs                    # EF Core config, query filters
│
├── Scripts/
│   └── CRM_Schema.sql                     # Database schema definition
│
└── Program.cs                              # DI registration
```

### 12.2 Frontend Files

```
audit-frontend/src/
├── pages/CRM/contacts/
│   ├── ContactList.tsx                    # List page (search, filter, sort, paginate)
│   ├── ContactForm.tsx                    # Create/Edit form with sidebar
│   ├── ContactFormSkeleton.tsx            # Loading skeleton
│   └── components/
│       └── ContactLifecycleBadge.tsx      # Color-coded lifecycle badge
│
├── types/CRM/
│   └── contact.ts                        # TypeScript interfaces (DTOs, filter params, etc.)
│
├── validations/CRM/
│   └── contact.ts                        # Zod validation schema
│
├── services/CRM/
│   └── contact.service.ts                # API service (7 methods)
│
├── hooks/api/CRM/
│   └── use-contacts.ts                   # React Query hooks (queries + mutations)
│
├── routes/
│   ├── crm-routes.tsx                    # Route component mapping
│   └── dynamic-routes.tsx                # Dynamic route generation
│
└── pages/Account/party/party-contact/    # Party Contact (separate module)
    ├── PartyContactList.tsx              # Embedded list in party form
    └── PartyContactModal.tsx             # Create/Edit modal
```

---

## Summary

Contact Module ek full-featured CRM contact management system hai jo:

1. **Complete CRUD** - Create, Read, Update, Delete (soft delete) operations support karta hai
2. **7-Stage Lifecycle** - Subscriber se Evangelist tak contact ki journey track karta hai
3. **Multi-Tenant** - Har organization ka data alag-alag isolated rehta hai
4. **Permission-Based** - Role-based access control ke saath View, Create, Edit, Delete permissions
5. **Audit Logging** - Har action ki audit trail maintain karta hai
6. **Rich UI** - Modern React UI with real-time validation, search, filters, pagination
7. **Relationships** - Accounts, Opportunities, aur Activities se deeply integrated hai
8. **Bulk Operations** - Multiple contacts ko ek saath archive/restore kar sakta hai
9. **Data Quality** - Email, name, phone normalization automatic hoti hai
10. **Dark Mode** - Full dark mode support with semantic color coding
