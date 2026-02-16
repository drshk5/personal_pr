# Account Module - Comprehensive Documentation

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
12. [Industry Badge System](#12-industry-badge-system)
13. [File Structure](#13-file-structure)

---

## 1. Overview

Account Module CRM system ka ek fundamental module hai jo sabhi business accounts (companies/organizations) ko manage karta hai. Yeh module ek company/account ke under aane wale contacts, opportunities, aur activities ko ek centralized view mein dikhata hai. Account basically ek company ya organization ko represent karta hai jisse aapka business deal karta hai.

**Tech Stack:**
- **Backend:** ASP.NET Core (C#), Entity Framework Core, SQL Server
- **Frontend:** React (TypeScript), TanStack React Query, React Hook Form, Zod Validation, Tailwind CSS, Shadcn/UI
- **Pattern:** Clean Architecture (Controller → Application Service → Domain Service → Repository → Database)

---

## 2. Module Purpose & Use Cases

### Kya Kaam Aata Hai (Purpose)

| Use Case | Description |
|----------|-------------|
| **Company Management** | Sabhi business companies/organizations ko ek jagah store aur manage karna |
| **Contact Association** | Ek company ke under multiple contacts ko link karna |
| **Opportunity Tracking** | Company se related sales opportunities ko track karna |
| **Activity History** | Company ke saath hui sabhi calls, emails, meetings ka record rakhna |
| **Revenue Tracking** | Company ki annual revenue aur pipeline value track karna |
| **Industry Classification** | Companies ko industry ke basis par categorize karna (15 industries) |
| **Team Assignment** | Account ko team member ko assign karna |
| **Bulk Operations** | Multiple accounts ko ek saath archive/restore karna |
| **Search & Filter** | Name, email, phone, industry se search aur filter karna |

### Account vs Contact - Difference Samjho

```
Account = Company/Organization (e.g., TechCorp Pvt Ltd, Infosys, TCS)
Contact = Us company ka individual person (e.g., Rajat - CTO of TechCorp)

Ek Account ke under bahut saare Contacts ho sakte hain:
  TechCorp Pvt Ltd (Account)
    ├── Rajat Rajawat (Contact - CTO)
    ├── Deepak Kumar (Contact - VP Sales)
    └── Priya Sharma (Contact - Project Manager)
```

### 15 Industry Types

| Industry | Hindi Meaning |
|----------|--------------|
| **Technology** | Technology/IT company |
| **Finance** | Banking/Finance |
| **Healthcare** | Hospital/Healthcare |
| **Manufacturing** | Manufacturing/Production |
| **Retail** | Retail/Dukaandar |
| **Education** | Education/Shiksha |
| **Real Estate** | Property/Real Estate |
| **Consulting** | Consulting/Salahkaar |
| **Media** | Media/Entertainment |
| **Telecommunications** | Telecom |
| **Energy** | Energy/Urja |
| **Transportation** | Transport/Logistics |
| **Agriculture** | Krishi/Farming |
| **Government** | Sarkaar/Government |
| **Non-Profit** | NGO/Non-Profit |

---

## 3. Architecture & Approach

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  AccountList.tsx  │  AccountForm.tsx  │  Hooks/Services      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (REST API)
┌────────────────────────▼────────────────────────────────────┐
│                 CONTROLLER LAYER                             │
│              AccountsController.cs                           │
│  [RequireTenantId] [AuthorizePermission] [AuditLog]         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│            APPLICATION SERVICE LAYER                         │
│         MstAccountApplicationService.cs                      │
│  (Orchestration, DTO Mapping, Pagination, Filtering)         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              DOMAIN SERVICE LAYER                            │
│            MstAccountService.cs                              │
│     (Business Rules, Name Validation, Delete Validation)     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              REPOSITORY LAYER                                │
│          MstAccountRepository.cs                             │
│          + UnitOfWork.cs                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                DATABASE (SQL Server)                          │
│   MstAccounts │ MstContacts │ MstOpportunities │ MstLeads    │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

| Pattern | Kahan Use Hota Hai | Kyun |
|---------|-------------------|------|
| **Repository Pattern** | Data Access Layer | Database operations ko abstract karna |
| **Unit of Work** | Transaction Management | Multiple repositories ko ek transaction mein wrap karna |
| **DTO Pattern** | API Communication | Internal models ko expose nahi karna, derived fields bhejna |
| **Soft Delete** | Delete Operations | Data permanently delete nahi hota, sirf flag set hota hai |
| **Multi-Tenancy** | Data Isolation | Har organization ka data alag rehta hai (strGroupGUID se) |
| **Global Query Filter** | EF Core | Har query mein automatically tenant + soft delete filter lagta hai |
| **FluentValidation** | Input Validation | Server-side validation rules centralized hain |
| **Parallel Queries** | Detail Fetch | Contacts, Opportunities, Activities parallel mein fetch hote hain |
| **React Query** | Frontend State | Server state management with caching, auto-refetch |
| **React Hook Form** | Form Management | Performant form handling with Zod validation |

---

## 4. Database Schema

### 4.1 MstAccounts Table (Primary Table)

```sql
CREATE TABLE MstAccounts (
    strAccountGUID          UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
    strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,          -- Tenant ID
    strAccountName          NVARCHAR(200)       NOT NULL,
    strIndustry             NVARCHAR(100)       NULL,
    strWebsite              NVARCHAR(500)       NULL,
    strPhone                NVARCHAR(20)        NULL,
    strEmail                NVARCHAR(255)       NULL,
    intEmployeeCount        INT                 NULL,
    dblAnnualRevenue        DECIMAL(18,2)       NULL,
    strAddress              NVARCHAR(500)       NULL,
    strCity                 NVARCHAR(100)       NULL,
    strState                NVARCHAR(100)       NULL,
    strCountry              NVARCHAR(100)       NULL,
    strPostalCode           NVARCHAR(20)        NULL,
    strDescription          NVARCHAR(MAX)       NULL,
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

**Total Columns:** 23
**Required Fields:** strAccountGUID, strGroupGUID, strAccountName, strCreatedByGUID, dtCreatedOn

### 4.2 Indexes

| Index Name | Column(s) | Purpose |
|-----------|-----------|---------|
| `IX_MstAccounts_GroupGUID` | strGroupGUID | Multi-tenant filtering (fast tenant queries) |
| `IX_MstAccounts_AccountName` | strAccountName | Account name search & duplicate check |

### 4.3 Entity Relationships Diagram

```
                    MstLeads (N)
                    (strConvertedAccountGUID)
                         │
                         ▼
MstAccounts (1) ──────────────────────────────
    │                                         │
    │ (1:N via strAccountGUID)                │ (1:N via strAccountGUID)
    │ OnDelete: SetNull                       │ OnDelete: SetNull
    ▼                                         ▼
MstContacts (N)                     MstOpportunities (N)
    │                                    │         │
    │                                    │         │
    ▼                                    ▼         ▼
MstOpportunityContacts (N)      MstPipeline   MstPipelineStage
                                    │
                                    ▼
                              MstPipelineStage (N)

MstAccounts ──── (Polymorphic via MstActivityLinks) ──── MstActivities
                 strEntityType = 'Account'
                 strEntityGUID = strAccountGUID
```

### 4.4 Column Details

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| strAccountGUID | UNIQUEIDENTIFIER | Yes | NEWID() | Primary Key |
| strGroupGUID | UNIQUEIDENTIFIER | Yes | - | Tenant/Organization ID |
| strAccountName | NVARCHAR(200) | Yes | - | Company/Organization name |
| strIndustry | NVARCHAR(100) | No | NULL | Industry category |
| strWebsite | NVARCHAR(500) | No | NULL | Company website URL |
| strPhone | NVARCHAR(20) | No | NULL | Company phone number |
| strEmail | NVARCHAR(255) | No | NULL | Company email address |
| intEmployeeCount | INT | No | NULL | Number of employees |
| dblAnnualRevenue | DECIMAL(18,2) | No | NULL | Annual revenue amount |
| strAddress | NVARCHAR(500) | No | NULL | Street address |
| strCity | NVARCHAR(100) | No | NULL | City |
| strState | NVARCHAR(100) | No | NULL | State/Province |
| strCountry | NVARCHAR(100) | No | NULL | Country |
| strPostalCode | NVARCHAR(20) | No | NULL | Postal/ZIP code |
| strDescription | NVARCHAR(MAX) | No | NULL | Account description |
| strAssignedToGUID | UNIQUEIDENTIFIER | No | NULL | Assigned team member |
| strCreatedByGUID | UNIQUEIDENTIFIER | Yes | - | Creator user GUID |
| strUpdatedByGUID | UNIQUEIDENTIFIER | No | NULL | Last updater user GUID |
| dtCreatedOn | DATETIME2 | Yes | GETUTCDATE() | Creation timestamp |
| dtUpdatedOn | DATETIME2 | No | NULL | Last update timestamp |
| bolIsActive | BIT | No | 1 (true) | Active/Inactive flag |
| bolIsDeleted | BIT | No | 0 (false) | Soft delete flag |
| dtDeletedOn | DATETIME2 | No | NULL | Soft delete timestamp |

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

**Base URL:** `/api/crm/accounts`

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| `GET` | `/api/crm/accounts` | CRM_Accounts:View | Accounts list with pagination, filtering, search |
| `GET` | `/api/crm/accounts/{id}` | CRM_Accounts:View | Single account ki detail (contacts, opportunities, activities sahit) |
| `POST` | `/api/crm/accounts` | CRM_Accounts:Create | Naya account create karna |
| `PUT` | `/api/crm/accounts/{id}` | CRM_Accounts:Edit | Existing account update karna |
| `DELETE` | `/api/crm/accounts/{id}` | CRM_Accounts:Delete | Account soft delete karna |
| `POST` | `/api/crm/accounts/bulk-archive` | CRM_Accounts:Edit | Multiple accounts ek saath archive karna |
| `POST` | `/api/crm/accounts/bulk-restore` | CRM_Accounts:Edit | Multiple accounts ek saath restore karna |

### 5.2 Request/Response DTOs

#### CreateAccountDto (POST Request Body)

```json
{
  "strAccountName": "string (required)",       // Max 200 chars
  "strIndustry": "string | null",              // Max 100 chars (e.g., "Technology")
  "strWebsite": "string | null",               // Max 500 chars
  "strPhone": "string | null",                 // Max 20 chars
  "strEmail": "string | null",                 // Valid email, max 255 chars
  "intEmployeeCount": "int | null",            // >= 0
  "dblAnnualRevenue": "decimal | null",        // >= 0
  "strAddress": "string | null",               // Max 500 chars
  "strCity": "string | null",                  // Max 100 chars
  "strState": "string | null",                 // Max 100 chars
  "strCountry": "string | null",              // Max 100 chars
  "strPostalCode": "string | null",            // Max 20 chars
  "strDescription": "string | null",           // Max 4000 chars
  "strAssignedToGUID": "guid | null"           // Team member ko assign
}
```

#### AccountListDto (GET List Response)

```json
{
  "strAccountGUID": "guid",
  "strAccountName": "TechCorp Pvt Ltd",
  "strIndustry": "Technology",
  "strPhone": "+91-9876543210",
  "strEmail": "info@techcorp.com",
  "intContactCount": 5,                        // ** Derived: Kitne contacts hain **
  "intOpenOpportunityCount": 3,                // ** Derived: Kitni open deals hain **
  "dblTotalOpportunityValue": 1500000.00,      // ** Derived: Total pipeline value **
  "strAssignedToGUID": "guid | null",
  "strAssignedToName": "Deepak Kumar",
  "dtCreatedOn": "2025-01-15T10:30:00Z",
  "bolIsActive": true
}
```

**Important:** `intContactCount`, `intOpenOpportunityCount`, aur `dblTotalOpportunityValue` database mein store nahi hote - yeh query time par calculate hote hain (derived fields).

#### AccountDetailDto (GET Detail Response)

```json
{
  "strAccountGUID": "guid",
  "strAccountName": "TechCorp Pvt Ltd",
  "strIndustry": "Technology",
  "strPhone": "+91-9876543210",
  "strEmail": "info@techcorp.com",
  "strWebsite": "https://techcorp.com",
  "intEmployeeCount": 250,
  "dblAnnualRevenue": 50000000.00,
  "strAddress": "123, MG Road",
  "strCity": "Jaipur",
  "strState": "Rajasthan",
  "strCountry": "India",
  "strPostalCode": "302001",
  "strDescription": "Leading technology company in Rajasthan",
  "intContactCount": 5,
  "intOpenOpportunityCount": 3,
  "dblTotalOpportunityValue": 1500000.00,
  "strAssignedToGUID": "guid",
  "strAssignedToName": "Deepak Kumar",
  "dtCreatedOn": "2025-01-15T10:30:00Z",
  "bolIsActive": true,
  "contacts": [
    {
      "strContactGUID": "guid",
      "strFirstName": "Rajat",
      "strLastName": "Rajawat",
      "strEmail": "rajat@techcorp.com",
      "strPhone": "+91-9876543210",
      "strJobTitle": "CTO",
      "strLifecycleStage": "Customer"
    }
  ],
  "opportunities": [
    {
      "strOpportunityGUID": "guid",
      "strOpportunityName": "Enterprise License Deal",
      "strStageName": "Negotiation",
      "strStatus": "Open",
      "dblAmount": 500000,
      "strCurrency": "INR",
      "intProbability": 75,
      "dtExpectedCloseDate": "2025-06-30",
      "bolIsRotting": false
    }
  ],
  "recentActivities": [
    {
      "strActivityGUID": "guid",
      "strActivityType": "Call",
      "strSubject": "Follow-up Call with CTO",
      "dtScheduledOn": "2025-03-01T14:00:00Z"
    }
  ]
}
```

#### AccountFilterParams (GET List Query Params)

```
GET /api/crm/accounts?PageNumber=1&PageSize=20&Search=techcorp&SortBy=strAccountName&Ascending=true&bolIsActive=true&strIndustry=Technology&strAssignedToGUID=xxx
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `PageNumber` | int | 1 | Page number |
| `PageSize` | int | 20 | Items per page |
| `Search` | string | null | Full-text search (name, email, phone, industry, city, country) |
| `SortBy` | string | null | Column name for sorting |
| `Ascending` | bool | true | Sort direction |
| `bolIsActive` | bool? | null | Active/Inactive filter |
| `strIndustry` | string | null | Industry filter |
| `strAssignedToGUID` | guid | null | Assigned user filter |

#### Paginated Response Wrapper

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "items": [ /* AccountListDto[] */ ],
    "totalCount": 75,
    "pageNumber": 1,
    "pageSize": 20,
    "totalPages": 4,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

### 5.3 Validation Rules (FluentValidation)

| Field | Rules |
|-------|-------|
| strAccountName | Required, Max 200 chars, Unique per tenant |
| strIndustry | Optional, Max 100 chars |
| strWebsite | Optional, Max 500 chars |
| strPhone | Optional, Max 20 chars |
| strEmail | Optional, Valid email format, Max 255 chars |
| intEmployeeCount | Optional, Must be >= 0 |
| dblAnnualRevenue | Optional, Must be >= 0 |
| strAddress | Optional, Max 500 chars |
| strCity | Optional, Max 100 chars |
| strState | Optional, Max 100 chars |
| strCountry | Optional, Max 100 chars |
| strPostalCode | Optional, Max 20 chars |
| strDescription | Optional, Max 4000 chars |

### 5.4 Data Normalization

Jab bhi account create ya update hota hai, DataNormalizationHelper apply hota hai:

| Operation | Example |
|-----------|---------|
| **Email Normalization** | "  Info@TECHCORP.com  " → "info@techcorp.com" |
| **Phone Normalization** | "+91 - 9876 - 543210" → "+919876543210" |
| **String Trimming** | "  TechCorp Pvt Ltd  " → "TechCorp Pvt Ltd" |
| **TrimOrNull** | "   " → null (empty/whitespace strings null ban jaate hain) |

---

## 6. Business Logic & Rules

### 6.1 Account Create Flow

```
1. Request aata hai → TrimStrings attribute strings trim karta hai
2. FluentValidation rules check hoti hain (name, email, revenue, etc.)
3. Domain Service: Account name validation (empty/too long check)
4. Duplicate name check hoti hai (same tenant mein same name allowed nahi)
5. DataNormalizationHelper se sab fields normalize hoti hain
   - Email lowercase, phone cleaned, strings trimmed
6. New MstAccount entity create hoti hai with:
   - NEWID() se GUID generate hota hai
   - strGroupGUID tenant context se aata hai
   - strCreatedByGUID current user se aata hai
   - dtCreatedOn UTC time set hota hai
7. Database mein save hota hai (via UnitOfWork.SaveChangesAsync)
8. AuditLog attribute se audit entry banti hai (entity type: "Account", action: "Create")
9. Full AccountDetailDto return hota hai (with empty contacts/opportunities)
```

### 6.2 Account Update Flow

```
1. Account existence check (NotFoundException agar nahi mila)
2. Domain Service: Account name validation
3. Duplicate name check (apne aap ko exclude karke, sirf agar name change hua hai)
4. Old values capture for audit comparison (JSON serialize)
5. Sab fields update hoti hain with normalization:
   - strAccountName, strIndustry, strWebsite, strPhone, strEmail
   - intEmployeeCount, dblAnnualRevenue
   - Address fields (strAddress, strCity, strState, strCountry, strPostalCode)
   - strDescription, strAssignedToGUID
6. dtUpdatedOn = UTC now, strUpdatedByGUID = current user
7. AuditLog se old values + new values record hoti hain
8. Updated AccountDetailDto return hota hai (contacts, opportunities sahit)
```

### 6.3 Account Delete Flow (Soft Delete with Protection)

```
1. Account existence check
2. ** PARALLEL QUERIES fire hoti hain: **
   a. Count active contacts linked to this account
   b. Count open opportunities linked to this account
3. ** Domain Service: Deletion Validation **
   - Agar contacts > 0 → BusinessException: "Cannot delete account with X contact(s)"
   - Agar opportunities > 0 → BusinessException: "Cannot delete account with X opportunity(ies)"
4. Agar dono 0 hain, tab:
   - bolIsDeleted = true
   - bolIsActive = false
   - dtDeletedOn = UTC now
   - strUpdatedByGUID = current user
5. AuditLog entry banti hai
6. Contact/Opportunity ke strAccountGUID automatically NULL nahi hote (kyunki delete allowed hi nahi hota agar linked hain)
```

**IMPORTANT:** Contact module mein delete free hai, lekin Account delete karne se pehle sab contacts aur opportunities hataane padenge. Yeh data integrity ke liye hai.

### 6.4 Bulk Archive/Restore Flow

```
Archive:
1. List of GUIDs aati hai (AccountBulkArchiveDto)
2. Sab accounts ek query mein fetch hote hain
3. Har ek ka bolIsActive = false set hota hai
4. dtUpdatedOn aur strUpdatedByGUID update hota hai
5. Single SaveChanges call (efficient batch operation)

Restore:
1. Same process, bolIsActive = true set hota hai
2. dtUpdatedOn aur strUpdatedByGUID update hota hai
```

### 6.5 Account Name Uniqueness Rule

```
- Same tenant (strGroupGUID) mein 2 accounts ka name same nahi ho sakta
- Name comparison case-sensitive hai (as stored)
- Update ke time: sirf check hota hai agar name actually change hua hai
- Error Code: ACCOUNT_DUPLICATE_NAME
```

### 6.6 Derived Fields Calculation (List Query)

```
List API mein yeh fields runtime par calculate hoti hain:

intContactCount = COUNT(contacts WHERE strAccountGUID = account.strAccountGUID)
intOpenOpportunityCount = COUNT(opportunities WHERE strAccountGUID = account.strAccountGUID AND strStatus = 'Open')
dblTotalOpportunityValue = SUM(opportunities.dblAmount WHERE strAccountGUID = account.strAccountGUID AND strStatus = 'Open')
```

### 6.7 Detail Page Parallel Data Loading

```
GetAccountByIdAsync() mein 3 queries parallel fire hoti hain (Task.WhenAll):

1. Contacts Query:
   - All contacts WHERE strAccountGUID = id
   - Ordered by dtCreatedOn DESC

2. Opportunities Query:
   - All opportunities WHERE strAccountGUID = id
   - Includes pipeline stage info
   - Calculates "rotting" status (deal bahut purani ho gayi hai)

3. Activities Query:
   - Top 10 activities via MstActivityLinks
   - WHERE strEntityType = 'Account' AND strEntityGUID = id
   - Ordered by dtCreatedOn DESC
```

---

## 7. Frontend UI/UX

### 7.1 Account List Page (`/crm/accounts`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  PageHeader                                                          │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ 🏢 Accounts                               [+ Add Account]   │    │
│  │ Manage your business accounts                                │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Filters & Search Bar                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 🔍 Search... │  │ Industry ▼   │  │ Status ▼ │  │ Columns ▼│    │
│  └──────────────┘  └──────────────┘  └──────────┘  └──────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │ Account Name   │ Industry    │ Phone  │ Email │ Contacts │   │    │
│  │                │             │        │       │ Count    │   │    │
│  ├──────────────────────────────────────────────────────────────┤    │
│  │ TechCorp Pvt   │ [Technology]│ +91... │ info@ │    5     │   │    │
│  │                │             │        │       │          │   │    │
│  ├──────────────────────────────────────────────────────────────┤    │
│  │ FinServ Ltd    │ [Finance]   │ +91... │ hr@   │    3     │   │    │
│  │                │             │        │       │          │   │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  │ Open Opps │ Pipeline Value │ Assigned To  │ Created    │ Status │ │
│  ├───────────┼────────────────┼──────────────┼────────────┼────────┤ │
│  │     3     │    ₹15L        │ Deepak Kumar │ 15 Jan '25 │ Active │ │
│  │           │                │              │            │        │ │
│  │     1     │    ₹5L         │ Priya Sharma │ 20 Feb '25 │ Active │ │
│  │           │                │              │            │        │ │
│                                                                      │
│  Pagination: < 1 2 3 4 >    Showing 1-20 of 75                     │
└──────────────────────────────────────────────────────────────────────┘
```

**List Columns:**

| Column | Description | Sortable |
|--------|-------------|----------|
| Account Name | Company/Organization name | Yes |
| Industry | Industry badge (color-coded) | Yes |
| Phone | Company phone number | Yes |
| Email | Company email | Yes |
| Contacts | Number of contacts in this account | Yes |
| Open Opportunities | Number of open deals | Yes |
| Pipeline Value | Total value of open deals (formatted: 15L, 5M, 2K) | Yes |
| Assigned To | Team member name | Yes |
| Created On | Creation date | Yes |
| Status | Active/Inactive badge | Yes |

**List Features:**
- **Search:** Full-text search with 400ms debounce (name, email, phone, industry, city, country mein search)
- **Filters:** Industry dropdown, Active/Inactive toggle
- **Sorting:** Kisi bhi column par click karke sort (ascending/descending)
- **Pagination:** Page number, page size configurable (default 20)
- **Column Visibility:** Columns hide/show kar sakte hain, drag karke reorder kar sakte hain
- **Column Preferences:** LocalStorage mein save hoti hain (key: "crm-accounts")
- **Column Pinning:** Columns ko left/right pin kar sakte hain
- **Column Widths:** Column widths adjustable aur persistent
- **Text Wrapping:** Toggle for long text wrapping
- **Actions:** Edit (new tab mein khulta hai), Delete (confirmation dialog ke saath)
- **Currency Formatting:** Pipeline value M (million), L (lakh), K (thousand) mein dikhta hai
- **Responsive:** Mobile-friendly layout

### 7.2 Account Form Page (`/crm/accounts/new` or `/crm/accounts/:id`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PageHeader                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ 🏢 Create Account / Edit Account            [Delete] [Save]      │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────┐  ┌────────────────────────────┐   │
│  │ MAIN FORM (2/3 width)            │  │ SIDEBAR (1/3 width)        │   │
│  │                                  │  │                            │   │
│  │ ── Company Information ──        │  │ ── Account Overview ──     │   │
│  │ Account Name*  [__________]      │  │ Industry:  [Technology]    │   │
│  │ Industry       [▼ Dropdown]      │  │ Contacts:  5               │   │
│  │ Website        [__________]      │  │ Open Opps: 3               │   │
│  │ Phone          [__________]      │  │ Pipeline:  ₹15,00,000      │   │
│  │ Email          [__________]      │  │ Revenue:   ₹5,00,00,000    │   │
│  │ Employee Count [__________]      │  │ Employees: 250             │   │
│  │ Annual Revenue [__________]      │  │ Website:   techcorp.com    │   │
│  │                                  │  │ Created:   15 Jan 2025     │   │
│  │ ── Address ──                    │  │ Assigned:  Deepak Kumar    │   │
│  │ Street Address [__________]      │  │ Status:    [Active]        │   │
│  │ City           [__________]      │  │                            │   │
│  │ State          [__________]      │  │ ── Contacts ──             │   │
│  │ Country        [__________]      │  │ Rajat Rajawat - CTO        │   │
│  │ Postal Code    [__________]      │  │   rajat@techcorp.com       │   │
│  │                                  │  │   [Customer]               │   │
│  │ ── Description ──                │  │ Deepak Kumar - VP Sales    │   │
│  │ [______________________________] │  │   deepak@techcorp.com      │   │
│  │ [______________________________] │  │   [SQL]                    │   │
│  │                                  │  │                            │   │
│  │ ── Assignment ──                 │  │ ── Opportunities ──        │   │
│  │ Assigned To    [▼ Dropdown]      │  │ Enterprise License Deal    │   │
│  │                                  │  │   Stage: Negotiation       │   │
│  │                                  │  │   Status: Open | 75%       │   │
│  │                                  │  │   Amount: ₹5,00,000        │   │
│  │                                  │  │   Close: 30 Jun 2025       │   │
│  │                                  │  │                            │   │
│  │                                  │  │ ── Recent Activities ──    │   │
│  │                                  │  │ 📞 Follow-up Call          │   │
│  │                                  │  │    01 Mar 2025, 2:00 PM    │   │
│  │                                  │  │ 📧 Proposal Email          │   │
│  │                                  │  │    28 Feb 2025, 10:00 AM   │   │
│  │                                  │  │ 📅 Product Demo            │   │
│  │                                  │  │    25 Feb 2025, 11:00 AM   │   │
│  └──────────────────────────────────┘  └────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Form Sections:**

| Section | Fields | Description |
|---------|--------|-------------|
| **Company Information** | Account Name*, Industry, Website, Phone, Email, Employee Count, Annual Revenue | Core company details |
| **Address** | Street, City, State, Country, Postal Code | Location details |
| **Description** | Free-text description (max 4000 chars) | Company ke baare mein detail |
| **Assignment** | Assigned To (user dropdown) | Team member selection |

**Sidebar Sections (Read-only, sirf Edit mode mein dikhti hain):**

| Section | Content |
|---------|---------|
| **Account Overview** | Industry badge, Contact count, Open opportunities count, Pipeline value, Annual revenue, Employee count, Website link, Created date, Assigned to, Active status |
| **Contacts** | Linked contacts with name, email, job title, lifecycle stage badge |
| **Opportunities** | Linked opportunities with name, stage, status, probability, amount, expected close date, rotting indicator |
| **Recent Activities** | Last activities (Call, Email, Meeting, Note) with timestamps and icons |

**Form Behavior:**
- React Hook Form + Zod validation (real-time validation)
- Create mode: Empty form, Save button
- Edit mode: Pre-filled form with existing data + sidebar with related data
- Save ke baad list page par redirect hota hai
- Delete button sirf edit mode mein dikhta hai (confirmation dialog ke saath)
- Loading state mein AccountFormSkeleton dikhta hai
- Activity icons: Phone (Call), Mail (Email), CalendarDays (Meeting), MessageSquare (Note)

### 7.3 Industry Badge Colors (AccountIndustryBadge.tsx)

| Industry | Color | Dark Mode |
|----------|-------|-----------|
| Technology | Blue (`bg-blue-100 text-blue-700`) | `dark:bg-blue-900 dark:text-blue-300` |
| Finance | Emerald (`bg-emerald-100 text-emerald-700`) | `dark:bg-emerald-900 dark:text-emerald-300` |
| Healthcare | Red (`bg-red-100 text-red-700`) | `dark:bg-red-900 dark:text-red-300` |
| Manufacturing | Orange (`bg-orange-100 text-orange-700`) | `dark:bg-orange-900 dark:text-orange-300` |
| Retail | Pink (`bg-pink-100 text-pink-700`) | `dark:bg-pink-900 dark:text-pink-300` |
| Education | Indigo (`bg-indigo-100 text-indigo-700`) | `dark:bg-indigo-900 dark:text-indigo-300` |
| Real Estate | Amber (`bg-amber-100 text-amber-700`) | `dark:bg-amber-900 dark:text-amber-300` |
| Consulting | Purple (`bg-purple-100 text-purple-700`) | `dark:bg-purple-900 dark:text-purple-300` |
| Media | Fuchsia (`bg-fuchsia-100 text-fuchsia-700`) | `dark:bg-fuchsia-900 dark:text-fuchsia-300` |
| Telecommunications | Teal (`bg-teal-100 text-teal-700`) | `dark:bg-teal-900 dark:text-teal-300` |
| Energy | Yellow (`bg-yellow-100 text-yellow-700`) | `dark:bg-yellow-900 dark:text-yellow-300` |
| Transportation | Cyan (`bg-cyan-100 text-cyan-700`) | `dark:bg-cyan-900 dark:text-cyan-300` |
| Agriculture | Lime (`bg-lime-100 text-lime-700`) | `dark:bg-lime-900 dark:text-lime-300` |
| Government | Slate (`bg-slate-100 text-slate-700`) | `dark:bg-slate-900 dark:text-slate-300` |
| Non-Profit | Rose (`bg-rose-100 text-rose-700`) | `dark:bg-rose-900 dark:text-rose-300` |
| Default/Other | Gray (`bg-gray-100 text-gray-700`) | `dark:bg-gray-800 dark:text-gray-300` |

### 7.4 UI Components Used (Shadcn/UI)

| Component | Kahan Use Hota Hai |
|-----------|-------------------|
| `Card` | Form sections, Sidebar overview card |
| `Button` | Save, Delete, Add Account, Edit actions |
| `Input` | Text fields (name, website, phone, email, etc.) |
| `Textarea` | Description field |
| `Select` | Industry dropdown, Assigned To dropdown |
| `Badge` | Industry badge (color-coded), Active/Inactive status |
| `DataTable` | Account list table with advanced features |
| `Dialog` | Delete confirmation |
| `Form` | React Hook Form integration |
| `Skeleton` | Loading state placeholders |
| `Toast` | Success/Error notifications |
| `DraggableColumnVisibility` | Column management interface |
| `SearchInput` | Debounced search component |
| `PageHeader` | Page title with icon and action buttons |
| `CustomContainer` | Responsive container wrapper |

---

## 8. Data Flow

### 8.1 Account List Load Flow

```
User navigates to /crm/accounts
        │
        ▼
AccountList.tsx renders
        │
        ▼
useAccounts(params) hook fires ──────► accountService.getAccounts(params)
        │                                         │
        ▼                                         ▼
React Query caches response ◄──── GET /api/crm/accounts?PageNumber=1&PageSize=20
  (staleTime: 30s)                               │
        │                                         ▼
        ▼                                  AccountsController.GetList()
DataTable renders with data                       │
  - Industry badges                               ▼
  - Contact counts                    MstAccountApplicationService.GetAccountsAsync()
  - Pipeline values                               │
  - Formatted currencies                          ▼
                                      SQL Query with:
                                        - Tenant filter (WHERE strGroupGUID = @id)
                                        - Soft delete filter (AND bolIsDeleted = 0)
                                        - Industry filter, Active filter
                                        - Full-text search
                                        - Sorting, Pagination
                                        - JOIN to count contacts & opportunities
                                        - SUM for pipeline value
                                               │
                                               ▼
                                      PagedResponse<AccountListDto> return
```

### 8.2 Account Detail Load Flow

```
User clicks Edit on account
        │
        ▼
AccountForm.tsx renders (edit mode)
        │
        ▼
useAccount(id) hook fires ──────► accountService.getAccount(id)
        │                                    │
        ▼                                    ▼
React Query caches               GET /api/crm/accounts/{id}
  (staleTime: 60s)                          │
        │                                    ▼
        ▼                     MstAccountApplicationService.GetAccountByIdAsync()
Form populates with data                    │
Sidebar shows overview              ┌───────┼───────┐
                                    ▼       ▼       ▼
                              Contacts  Opportunities  Activities
                              Query     Query          Query
                              (parallel, Task.WhenAll)
                                    │       │       │
                                    └───────┼───────┘
                                            ▼
                                    AccountDetailDto return
                                    (with all related data)
```

### 8.3 Account Create Flow

```
User fills form and clicks Save
        │
        ▼
Zod validation (client-side) ──── Fail? Show field errors
        │ Pass
        ▼
useCreateAccount() mutation ──────► accountService.createAccount(dto)
        │                                         │
        ▼                                         ▼
On Success:                        POST /api/crm/accounts
  - Toast "Created"                       │
  - Invalidate list cache                 ▼
  - Navigate to list              [TrimStrings] → [FluentValidation] → [RequireTenantId]
                                         │
                                         ▼
                                 MstAccountApplicationService.CreateAccountAsync()
                                         │
                                  ┌──────┴──────┐
                                  ▼             ▼
                          Name validation   Duplicate check
                                  │
                                  ▼
                          Normalize data → Save to DB → Audit Log
                                  │
                                  ▼
                          Return AccountDetailDto
```

### 8.4 Account Delete Flow (Protected)

```
User clicks Delete → Confirmation Dialog → "Yes, Delete"
        │
        ▼
useDeleteAccount() → DELETE /api/crm/accounts/{id}
        │                          │
        ▼                          ▼
On Success:              1. Existence check
  - Toast "Deleted"      2. PARALLEL: Count contacts + Count open opportunities
  - Invalidate cache     3. Validation:
  - Navigate to list        ├── Contacts > 0? → ERROR: "Cannot delete, has X contacts"
                            ├── Opportunities > 0? → ERROR: "Cannot delete, has X opportunities"
On Error:                   └── Both 0? → Proceed with soft delete
  - Toast with error msg        - bolIsDeleted = true
  - Stay on page                - bolIsActive = false
                                - dtDeletedOn = UTC now
                                - AuditLog entry
```

---

## 9. Permissions & Access Control

### 9.1 Backend Permissions

| Permission Code | API Endpoint | Description |
|----------------|-------------|-------------|
| `CRM_Accounts:View` | GET list & detail | Accounts dekh sakta hai |
| `CRM_Accounts:Create` | POST create | Naya account bana sakta hai |
| `CRM_Accounts:Edit` | PUT update, bulk ops | Account edit/archive/restore kar sakta hai |
| `CRM_Accounts:Delete` | DELETE | Account delete kar sakta hai |

### 9.2 Frontend Permission Checks

```tsx
// List page mein Add button
<WithPermission module="CRM_ACCOUNT" action="SAVE">
  <Button>Add Account</Button>
</WithPermission>

// Table mein Edit action
<WithPermission module="CRM_ACCOUNT" action="EDIT">
  <Button>Edit</Button>
</WithPermission>

// Table mein Delete action
<WithPermission module="CRM_ACCOUNT" action="DELETE">
  <Button>Delete</Button>
</WithPermission>
```

### 9.3 Multi-Tenancy Security

```
1. JWT token se strGroupGUID extract hota hai (TenantContextMiddleware)
2. HttpContext.Items["TenantId"] mein store hota hai
3. CrmDbContext mein global query filter lagta hai
4. Har query mein automatically: WHERE strGroupGUID = @TenantId AND bolIsDeleted = 0
5. Ek tenant doosre tenant ka data kabhi nahi dekh sakta
```

### 9.4 Audit Logging

Har Create, Update, Delete operation par AuditLog entry banti hai:

```json
{
  "entityType": "Account",
  "action": "Create | Update | Delete",
  "entityGUID": "account-guid",
  "performedBy": "user-guid",
  "timestamp": "2025-01-15T10:30:00Z",
  "oldValues": "{ ... }",    // sirf Update mein
  "newValues": "{ ... }"
}
```

---

## 10. Related Modules & Integrations

### 10.1 Contact Module Integration

```
Account ←──→ Contact (One-to-Many)

- Ek account ke under multiple contacts ho sakte hain
- Contact ka strAccountGUID account se link hota hai
- Account delete hone par contact ka strAccountGUID NULL ho jaata hai (SET NULL)
  (lekin deletion protected hai - pehle contacts hataane padenge)
- Account detail page mein sabhi linked contacts dikhte hain
- Contact form mein Account dropdown se select kar sakte hain
```

### 10.2 Opportunity Module Integration

```
Account ←──→ Opportunity (One-to-Many)

- Ek account ke under multiple opportunities ho sakti hain
- Opportunity ka strAccountGUID account se link hota hai
- Account list mein:
  - intOpenOpportunityCount: Open deals ki count
  - dblTotalOpportunityValue: Open deals ki total value
- Account detail page mein sabhi linked opportunities dikhti hain
  - Stage name, Status, Probability, Amount, Expected Close Date
  - "Rotting" indicator (deal bahut purani ho gayi hai)
- Account delete tab tak nahi hota jab tak open opportunities hain
```

### 10.3 Lead Module Integration

```
Account ←──→ Lead (via Lead Conversion)

- Jab Lead convert hota hai, ek naya Account ban sakta hai
- Lead ka strConvertedAccountGUID naye account se link hota hai
- Lead conversion se simultaneously:
  - Account create hota hai
  - Contact create hota hai
  - Optionally Opportunity create hoti hai
```

### 10.4 Activity Module Integration

```
Account ←──→ Activity (Many-to-Many via MstActivityLinks, Polymorphic)

- Activities strEntityType = 'Account' aur strEntityGUID = strAccountGUID se link hoti hain
- Activity types: Call, Email, Meeting, Note
- Account detail page mein recent activities dikhti hain (top 10)
- Har activity ka subject, type, aur timestamp dikhta hai
```

### 10.5 Pipeline Module Integration

```
Account → Opportunities → Pipeline/Stages

- Opportunities pipeline stages mein move hoti hain
- Default pipeline: Prospecting → Qualification → Proposal → Negotiation → Closed Won/Lost
- Account detail mein opportunity ki current stage dikhti hai
- Pipeline value = SUM of all open opportunity amounts for that account
```

---

## 11. Error Handling

### 11.1 Backend Error Codes

| Error Code | HTTP Status | Kab Aata Hai |
|-----------|------------|-------------|
| `ACCOUNT_NOT_FOUND` | 404 | Account ID se koi record nahi mila |
| `ACCOUNT_NAME_REQUIRED` | 400 | Account name empty ya whitespace hai |
| `ACCOUNT_NAME_TOO_LONG` | 400 | Account name 200 characters se zyada hai |
| `ACCOUNT_DUPLICATE_NAME` | 400 | Same tenant mein same name ka account already hai |
| `ACCOUNT_HAS_CONTACTS` | 400 | Delete ke time account mein contacts linked hain |
| `ACCOUNT_HAS_OPPORTUNITIES` | 400 | Delete ke time account mein open opportunities hain |

### 11.2 Frontend Error Handling

```
API Error → handleMutationError() → Toast Notification (red/destructive)
  - "Cannot delete account with 5 associated contact(s)"
  - "Account name already exists"
  - etc.

Success → Toast Notification (green/success) + Cache Invalidation + Navigation
  - "Account created successfully"
  - "Account updated successfully"
  - "Account deleted successfully"
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

## 12. Industry Badge System

### Component: AccountIndustryBadge.tsx

Yeh component industry name ko color-coded badge mein render karta hai. 15 predefined industries hain, baaki ke liye gray default badge dikhta hai.

```tsx
// Usage Example:
<AccountIndustryBadge industry="Technology" />
// Renders: Blue badge with "Technology" text

<AccountIndustryBadge industry="Finance" />
// Renders: Emerald badge with "Finance" text
```

### Industry Constants (Frontend)

```typescript
export const ACCOUNT_INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Education",
  "Real Estate",
  "Consulting",
  "Media",
  "Telecommunications",
  "Energy",
  "Transportation",
  "Agriculture",
  "Government",
  "Non-Profit",
  "Other",
] as const;
```

Industry dropdown form mein yeh constant use hota hai - user ko yeh predefined options milte hain.

---

## 13. File Structure

### 13.1 Backend Files

```
crm-backend/
├── Controllers/
│   └── AccountsController.cs              # REST API endpoints (7 endpoints)
│
├── Models/Core/CustomerData/
│   ├── MstAccount.cs                      # Entity model (23 properties + 3 navigation)
│   ├── MstContact.cs                      # Related - has strAccountGUID FK
│   ├── MstOpportunity.cs                  # Related - has strAccountGUID FK
│   ├── MstLead.cs                         # Related - has strConvertedAccountGUID FK
│   ├── MstActivity.cs                     # Related - via MstActivityLinks
│   ├── MstActivityLink.cs                 # Polymorphic link (strEntityType='Account')
│   ├── MstPipeline.cs                     # Pipeline definition
│   ├── MstPipelineStage.cs               # Pipeline stages
│   ├── MstOpportunityContact.cs          # Opportunity-Contact junction
│   └── MstAuditLog.cs                    # Audit trail
│
├── DTOs/CustomerData/
│   └── AccountDtos.cs                     # CreateAccountDto, UpdateAccountDto,
│                                          # AccountListDto, AccountDetailDto,
│                                          # AccountBulkArchiveDto, AccountFilterParams
│
├── ApplicationServices/
│   ├── Interfaces/
│   │   └── IMstAccountApplicationService.cs
│   └── CustomerData/
│       └── MstAccountApplicationService.cs # Business orchestration (7 methods)
│                                           # Parallel queries, derived fields calculation
│
├── Services/
│   └── CustomerData/
│       └── MstAccountService.cs            # Domain logic (name validation, delete validation)
│
├── Interfaces/
│   └── IAccountService.cs                 # Domain service interface
│
├── DataAccess/
│   ├── Interfaces/
│   │   ├── IMstAccountRepository.cs
│   │   └── IRepository.cs                  # Base repository interface
│   └── Repositories/
│       ├── MstAccountRepository.cs         # Data access (CRUD + QueryIncludingDeleted)
│       └── UnitOfWork.cs                   # Transaction management
│
├── Validators/
│   ├── AccountCreateDtoValidator.cs        # FluentValidation rules
│   └── AccountUpdateDtoValidator.cs        # FluentValidation rules
│
├── Constants/
│   └── EntityTypeConstants.cs             # "Account" entity type constant
│
├── Helpers/
│   └── DataNormalizationHelper.cs          # Email, Phone normalization
│
├── Attributes/
│   ├── RequireTenantIdAttribute.cs         # Tenant validation
│   ├── AuthorizePermissionAttribute.cs     # Permission check
│   ├── AuditLogAttribute.cs               # Audit logging
│   └── TrimStringsAttribute.cs            # Auto string trimming
│
├── Data/
│   └── CrmDbContext.cs                    # EF Core config, query filters, indexes
│
├── Scripts/
│   ├── CRM_Schema.sql                     # Database schema definition
│   └── seed-default-pipeline.sql          # Default pipeline seed data
│
└── Program.cs                              # DI registration
```

### 13.2 Frontend Files

```
audit-frontend/src/
├── pages/CRM/accounts/
│   ├── AccountList.tsx                    # List page (search, filter, sort, paginate)
│   │                                      # Industry badges, contact counts, pipeline values
│   ├── AccountForm.tsx                    # Create/Edit form with sidebar
│   │                                      # Contacts list, Opportunities list, Activities
│   ├── AccountFormSkeleton.tsx            # Loading skeleton
│   └── components/
│       └── AccountIndustryBadge.tsx       # 15 color-coded industry badges
│
├── types/CRM/
│   └── account.ts                        # TypeScript interfaces
│                                          # AccountListDto, AccountDetailDto,
│                                          # CreateAccountDto, UpdateAccountDto,
│                                          # ContactListDtoForAccount,
│                                          # OpportunityListDtoForAccount,
│                                          # AccountFilterParams, AccountBulkArchiveDto
│
├── validations/CRM/
│   └── account.ts                        # Zod validation schema
│
├── services/CRM/
│   └── account.service.ts                # API service (7 methods)
│
├── hooks/api/CRM/
│   └── use-accounts.ts                   # React Query hooks
│                                          # useAccounts, useAccount,
│                                          # useCreateAccount, useUpdateAccount,
│                                          # useDeleteAccount, useBulkArchive/Restore
│
└── routes/
    ├── crm-routes.tsx                    # "crm_account_list" → AccountList
    │                                      # "crm_account_form" → AccountForm
    └── dynamic-routes.tsx                # Dynamic route generation
```

---

## Account vs Contact - Quick Comparison

| Feature | Account Module | Contact Module |
|---------|---------------|----------------|
| **Represents** | Company/Organization | Individual Person |
| **Primary Field** | strAccountName | strFirstName + strLastName |
| **Unique Constraint** | Account Name (per tenant) | Email (per tenant) |
| **Lifecycle** | No lifecycle stages | 7 lifecycle stages |
| **Related Data** | Contacts, Opportunities, Activities | Opportunities, Activities |
| **Delete Protection** | Yes (contacts/opportunities must be removed first) | No (direct soft delete) |
| **Industry** | Yes (15 industries with badges) | No |
| **Revenue** | Yes (intEmployeeCount, dblAnnualRevenue) | No |
| **Derived Fields** | Contact count, Open opp count, Pipeline value | No |
| **Filters** | Industry, Assigned To, Status | Lifecycle Stage, Account, Assigned To, Status |
| **Search Fields** | Name, Email, Phone, Industry, City, Country | Name, Email, Phone, Job Title, Account Name |

---

## Summary

Account Module ek full-featured CRM company/organization management system hai jo:

1. **Complete CRUD** - Create, Read, Update, Delete (soft delete with protection) operations support karta hai
2. **15 Industries** - Color-coded industry classification with beautiful badges
3. **Derived Analytics** - Contact count, Open opportunity count, Pipeline value runtime par calculate hoti hain
4. **Protected Delete** - Account tab tak delete nahi hota jab tak linked contacts aur open opportunities nahi hataaye jaayein
5. **Multi-Tenant** - Har organization ka data alag-alag isolated rehta hai
6. **Permission-Based** - Role-based access control ke saath View, Create, Edit, Delete permissions
7. **Audit Logging** - Har action ki audit trail with old/new values maintain karta hai
8. **Rich Sidebar** - Edit mode mein Contacts, Opportunities, Activities ek nazar mein dikhte hain
9. **Parallel Loading** - Detail page mein contacts, opportunities, activities parallel fetch hoti hain (fast loading)
10. **Duplicate Name Check** - Same tenant mein duplicate account name allowed nahi hai
11. **Bulk Operations** - Multiple accounts ko ek saath archive/restore kar sakta hai
12. **Data Normalization** - Email, phone, name automatic normalize hoti hain
13. **Dark Mode** - Full dark mode support with all industry badges
14. **Lead Conversion** - Lead convert hone par automatically Account create ho sakta hai
15. **Pipeline Integration** - Account ki total pipeline value aur open opportunities track hoti hain
