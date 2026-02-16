# CRM System Design Document — Phase 1 (Final)

> **Single-Project Flat Architecture** | .NET 8 | EF Core 9 | SQL Server
> Connected to central-backend gateway | Frontend module in audit-frontend monorepo

---

## 1. Project Structure — CRM Backend

```
crm-backend/
├── ApplicationServices/
│   ├── CustomerData/
│   │   ├── MstAccountApplicationService.cs
│   │   ├── MstActivityApplicationService.cs
│   │   ├── MstContactApplicationService.cs
│   │   ├── MstDashboardApplicationService.cs
│   │   ├── MstLeadApplicationService.cs
│   │   ├── MstLeadConversionApplicationService.cs
│   │   ├── MstOpportunityApplicationService.cs
│   │   └── MstPipelineApplicationService.cs
│   ├── Interfaces/
│   │   ├── IApplicationService.cs
│   │   ├── IMstAccountApplicationService.cs
│   │   ├── IMstActivityApplicationService.cs
│   │   ├── IMstContactApplicationService.cs
│   │   ├── IMstDashboardApplicationService.cs
│   │   ├── IMstLeadApplicationService.cs
│   │   ├── IMstLeadConversionApplicationService.cs
│   │   ├── IMstOpportunityApplicationService.cs
│   │   └── IMstPipelineApplicationService.cs
│   └── ApplicationServiceBase.cs
├── Attributes/
│   ├── AuditLogAttribute.cs
│   ├── AuthorizePermissionAttribute.cs
│   ├── RequireTenantIdAttribute.cs
│   └── TrimStringsAttribute.cs
├── Config/
│   ├── CorsOptions.cs
│   ├── JwtOptions.cs
│   └── RateLimitingOptions.cs
├── Constants/
│   ├── ActivityTypeConstants.cs
│   ├── ContactLifecycleStageConstants.cs
│   ├── ContactStatusConstants.cs
│   ├── EntityTypeConstants.cs
│   ├── LeadErrorCodes.cs
│   ├── LeadSourceConstants.cs
│   ├── LeadStatusConstants.cs
│   ├── OpportunityContactMapping.cs
│   ├── OpportunityErrorCodes.cs
│   ├── OpportunityStageConstants.cs
│   └── PipelineConstants.cs
├── Controllers/
│   ├── AccountsController.cs
│   ├── ActivitiesController.cs
│   ├── BaseController.cs
│   ├── ContactsController.cs
│   ├── DashboardController.cs
│   ├── LeadConversionController.cs
│   ├── LeadsController.cs
│   ├── OpportunitiesController.cs
│   ├── PipelinesController.cs
│   └── ServiceStatusController.cs
├── DTOs/
│   ├── Common/
│   │   ├── BulkOperationDto.cs
│   │   ├── PagedRequestDto.cs
│   │   └── TokenClaimsDto.cs
│   └── CustomerData/
│       ├── AccountBulkArchiveDto.cs
│       ├── AccountDtos.cs
│       ├── ActivityDtos.cs
│       ├── ContactBulkArchiveDto.cs
│       ├── ContactDtos.cs
│       ├── CrmDashboardDtos.cs
│       ├── LeadBulkArchiveDto.cs
│       ├── LeadConversionDtos.cs
│       ├── LeadDtos.cs
│       ├── OpportunityDtos.cs
│       └── PipelineDtos.cs
├── Data/
│   ├── Migrations/
│   │   └── Tenant/
│   ├── CrmDbContext.cs
│   ├── TenantContextProvider.cs
│   └── TenantDbContextFactory.cs
├── DataAccess/
│   ├── Interfaces/
│   │   ├── IMstAccountRepository.cs
│   │   ├── IMstActivityLinkRepository.cs
│   │   ├── IMstActivityRepository.cs
│   │   ├── IMstAuditLogRepository.cs
│   │   ├── IMstContactRepository.cs
│   │   ├── IMstLeadRepository.cs
│   │   ├── IMstOpportunityContactRepository.cs
│   │   ├── IMstOpportunityRepository.cs
│   │   ├── IMstPipelineRepository.cs
│   │   ├── IMstPipelineStageRepository.cs
│   │   └── IRepository.cs
│   └── Repositories/
│       ├── MstAccountRepository.cs
│       ├── MstActivityLinkRepository.cs
│       ├── MstActivityRepository.cs
│       ├── MstAuditLogRepository.cs
│       ├── MstContactRepository.cs
│       ├── MstLeadRepository.cs
│       ├── MstOpportunityContactRepository.cs
│       ├── MstOpportunityRepository.cs
│       ├── MstPipelineRepository.cs
│       ├── MstPipelineStageRepository.cs
│       └── UnitOfWork.cs
├── Exceptions/
│   ├── BusinessException.cs
│   ├── NotFoundException.cs
│   └── ValidationException.cs
├── Extensions/
│   ├── AuthenticationExtensions.cs
│   ├── ClaimsPrincipalExtensions.cs
│   ├── ExceptionHandlingExtensions.cs
│   ├── QueryableExtensions.cs
│   ├── RateLimitingExtensions.cs
│   ├── StringExtensions.cs
│   └── TenantIdExtensions.cs
├── Filters/
│   ├── AuditLogFilter.cs
│   ├── FileUploadOperationFilter.cs
│   └── ValidateModelFilter.cs
├── Helpers/
│   ├── DataNormalizationHelper.cs
│   ├── DateTimeProvider.cs
│   ├── GuidHelper.cs
│   └── LeadScoringHelper.cs
├── Hubs/
│   └── CrmNotificationHub.cs
├── Interfaces/
│   ├── IAccountService.cs
│   ├── IActivityService.cs
│   ├── IAuditLogService.cs
│   ├── IContactService.cs
│   ├── IDashboardService.cs
│   ├── ILeadConversionService.cs
│   ├── ILeadService.cs
│   ├── IOpportunityService.cs
│   └── IPipelineService.cs
├── Middleware/
│   ├── ExceptionHandlingMiddleware.cs
│   ├── PerformanceMiddleware.cs
│   ├── RequestLoggingMiddleware.cs
│   ├── TenantContextMiddleware.cs
│   └── TokenValidationMiddleware.cs
├── Models/
│   ├── Core/
│   │   ├── CustomerData/
│   │   │   ├── MstAccount.cs
│   │   │   ├── MstActivity.cs
│   │   │   ├── MstActivityLink.cs
│   │   │   ├── MstAuditLog.cs
│   │   │   ├── MstContact.cs
│   │   │   ├── MstLead.cs
│   │   │   ├── MstOpportunity.cs
│   │   │   ├── MstOpportunityContact.cs
│   │   │   ├── MstPipeline.cs
│   │   │   └── MstPipelineStage.cs
│   │   └── ITenantEntity.cs
│   ├── External/
│   │   ├── MstGroup.cs
│   │   ├── MstModule.cs
│   │   ├── MstOrganization.cs
│   │   └── MstUser.cs
│   └── Wrappers/
│       ├── ApiResponse.cs
│       ├── BaseResponse.cs
│       └── PagedResponse.cs
├── Services/
│   ├── CustomerData/
│   │   ├── MstAccountService.cs
│   │   ├── MstActivityService.cs
│   │   ├── MstAuditLogService.cs
│   │   ├── MstContactService.cs
│   │   ├── MstDashboardService.cs
│   │   ├── MstLeadConversionService.cs
│   │   ├── MstLeadService.cs
│   │   ├── MstOpportunityService.cs
│   │   └── MstPipelineService.cs
│   └── ServiceBase.cs
├── Scripts/
│   ├── CRM_Schema.sql
│   └── seed-default-pipeline.sql
├── Validators/
│   ├── AccountCreateDtoValidator.cs
│   ├── AccountUpdateDtoValidator.cs
│   ├── ActivityCreateDtoValidator.cs
│   ├── ContactCreateDtoValidator.cs
│   ├── ContactUpdateDtoValidator.cs
│   ├── LeadCreateDtoValidator.cs
│   ├── LeadUpdateDtoValidator.cs
│   ├── OpportunityCreateDtoValidator.cs
│   ├── OpportunityUpdateDtoValidator.cs
│   └── PipelineCreateDtoValidator.cs
├── Logs/
├── Program.cs
├── appsettings.json
├── crm-backend.csproj
├── crm-backend.sln
└── README.md
```

---

## 2. Database Schema — 10 Tables

### 2.1 MstLeads

| Column | Type | Constraints |
|--------|------|------------|
| strLeadGUID | uniqueidentifier | PK, DEFAULT NEWID() |
| strGroupGUID | uniqueidentifier | NOT NULL (tenant) |
| strFirstName | nvarchar(100) | NOT NULL |
| strLastName | nvarchar(100) | NOT NULL |
| strEmail | nvarchar(255) | NOT NULL |
| strPhone | nvarchar(20) | NULL |
| strCompanyName | nvarchar(200) | NULL |
| strJobTitle | nvarchar(150) | NULL |
| strSource | nvarchar(50) | NOT NULL (Website/Referral/LinkedIn/ColdCall/Advertisement/TradeShow/Other) |
| strStatus | nvarchar(50) | NOT NULL DEFAULT 'New' (New/Contacted/Qualified/Unqualified/Converted) |
| intLeadScore | int | DEFAULT 0 |
| strAddress | nvarchar(500) | NULL |
| strCity | nvarchar(100) | NULL |
| strState | nvarchar(100) | NULL |
| strCountry | nvarchar(100) | NULL |
| strPostalCode | nvarchar(20) | NULL |
| strNotes | nvarchar(MAX) | NULL |
| strConvertedAccountGUID | uniqueidentifier | NULL, FK→MstAccounts |
| strConvertedContactGUID | uniqueidentifier | NULL, FK→MstContacts |
| strConvertedOpportunityGUID | uniqueidentifier | NULL, FK→MstOpportunities |
| dtConvertedOn | datetime2 | NULL |
| strAssignedToGUID | uniqueidentifier | NULL |
| strCreatedByGUID | uniqueidentifier | NOT NULL |
| strUpdatedByGUID | uniqueidentifier | NULL |
| dtCreatedOn | datetime2 | NOT NULL DEFAULT GETUTCDATE() |
| dtUpdatedOn | datetime2 | NULL |
| bolIsActive | bit | DEFAULT 1 |
| bolIsDeleted | bit | DEFAULT 0 |
| dtDeletedOn | datetime2 | NULL |

**Indexes:** IX_MstLeads_GroupGUID, IX_MstLeads_Status, IX_MstLeads_Email, IX_MstLeads_AssignedTo

---

### 2.2 MstAccounts

| Column | Type | Constraints |
|--------|------|------------|
| strAccountGUID | uniqueidentifier | PK, DEFAULT NEWID() |
| strGroupGUID | uniqueidentifier | NOT NULL (tenant) |
| strAccountName | nvarchar(200) | NOT NULL |
| strIndustry | nvarchar(100) | NULL |
| strWebsite | nvarchar(500) | NULL |
| strPhone | nvarchar(20) | NULL |
| strEmail | nvarchar(255) | NULL |
| intEmployeeCount | int | NULL |
| dblAnnualRevenue | decimal(18,2) | NULL |
| strAddress | nvarchar(500) | NULL |
| strCity | nvarchar(100) | NULL |
| strState | nvarchar(100) | NULL |
| strCountry | nvarchar(100) | NULL |
| strPostalCode | nvarchar(20) | NULL |
| strDescription | nvarchar(MAX) | NULL |
| strAssignedToGUID | uniqueidentifier | NULL |
| strCreatedByGUID | uniqueidentifier | NOT NULL |
| strUpdatedByGUID | uniqueidentifier | NULL |
| dtCreatedOn | datetime2 | NOT NULL DEFAULT GETUTCDATE() |
| dtUpdatedOn | datetime2 | NULL |
| bolIsActive | bit | DEFAULT 1 |
| bolIsDeleted | bit | DEFAULT 0 |
| dtDeletedOn | datetime2 | NULL |

**Indexes:** IX_MstAccounts_GroupGUID, IX_MstAccounts_AccountName

---

### 2.3 MstContacts

| Column | Type | Constraints |
|--------|------|------------|
| strContactGUID | uniqueidentifier | PK, DEFAULT NEWID() |
| strGroupGUID | uniqueidentifier | NOT NULL (tenant) |
| strAccountGUID | uniqueidentifier | NULL, FK→MstAccounts |
| strFirstName | nvarchar(100) | NOT NULL |
| strLastName | nvarchar(100) | NOT NULL |
| strEmail | nvarchar(255) | NOT NULL |
| strPhone | nvarchar(20) | NULL |
| strMobilePhone | nvarchar(20) | NULL |
| strJobTitle | nvarchar(150) | NULL |
| strDepartment | nvarchar(100) | NULL |
| strLifecycleStage | nvarchar(50) | DEFAULT 'Subscriber' (Subscriber/Lead/MQL/SQL/Opportunity/Customer/Evangelist) |
| strAddress | nvarchar(500) | NULL |
| strCity | nvarchar(100) | NULL |
| strState | nvarchar(100) | NULL |
| strCountry | nvarchar(100) | NULL |
| strPostalCode | nvarchar(20) | NULL |
| strNotes | nvarchar(MAX) | NULL |
| dtLastContactedOn | datetime2 | NULL |
| strAssignedToGUID | uniqueidentifier | NULL |
| strCreatedByGUID | uniqueidentifier | NOT NULL |
| strUpdatedByGUID | uniqueidentifier | NULL |
| dtCreatedOn | datetime2 | NOT NULL DEFAULT GETUTCDATE() |
| dtUpdatedOn | datetime2 | NULL |
| bolIsActive | bit | DEFAULT 1 |
| bolIsDeleted | bit | DEFAULT 0 |
| dtDeletedOn | datetime2 | NULL |

**Indexes:** IX_MstContacts_GroupGUID, IX_MstContacts_AccountGUID, IX_MstContacts_Email

---

### 2.4 MstPipelines

| Column | Type | Constraints |
|--------|------|------------|
| strPipelineGUID | uniqueidentifier | PK, DEFAULT NEWID() |
| strGroupGUID | uniqueidentifier | NOT NULL (tenant) |
| strPipelineName | nvarchar(200) | NOT NULL |
| strDescription | nvarchar(500) | NULL |
| bolIsDefault | bit | DEFAULT 0 |
| strCreatedByGUID | uniqueidentifier | NOT NULL |
| strUpdatedByGUID | uniqueidentifier | NULL |
| dtCreatedOn | datetime2 | NOT NULL DEFAULT GETUTCDATE() |
| dtUpdatedOn | datetime2 | NULL |
| bolIsActive | bit | DEFAULT 1 |
| bolIsDeleted | bit | DEFAULT 0 |
| dtDeletedOn | datetime2 | NULL |

---

### 2.5 MstPipelineStages

| Column | Type | Constraints |
|--------|------|------------|
| strStageGUID | uniqueidentifier | PK, DEFAULT NEWID() |
| strPipelineGUID | uniqueidentifier | NOT NULL, FK→MstPipelines |
| strStageName | nvarchar(100) | NOT NULL |
| intDisplayOrder | int | NOT NULL |
| intProbabilityPercent | int | DEFAULT 0 (0-100) |
| strRequiredFields | nvarchar(MAX) | NULL (JSON array) |
| strAllowedTransitions | nvarchar(MAX) | NULL (JSON array of stageGUIDs) |
| intDefaultDaysToRot | int | DEFAULT 30 |
| bolIsWonStage | bit | DEFAULT 0 |
| bolIsLostStage | bit | DEFAULT 0 |
| dtCreatedOn | datetime2 | NOT NULL DEFAULT GETUTCDATE() |
| dtUpdatedOn | datetime2 | NULL |
| bolIsActive | bit | DEFAULT 1 |

**Key Design:** Stages are DATA, not enums. Per-tenant configurable. JSON fields for required fields and allowed transitions. Rot threshold per stage.

---

### 2.6 MstOpportunities (Deals)

| Column | Type | Constraints |
|--------|------|------------|
| strOpportunityGUID | uniqueidentifier | PK, DEFAULT NEWID() |
| strGroupGUID | uniqueidentifier | NOT NULL (tenant) |
| strOpportunityName | nvarchar(200) | NOT NULL |
| strAccountGUID | uniqueidentifier | NULL, FK→MstAccounts |
| strPipelineGUID | uniqueidentifier | NOT NULL, FK→MstPipelines |
| strStageGUID | uniqueidentifier | NOT NULL, FK→MstPipelineStages |
| strStatus | nvarchar(50) | NOT NULL DEFAULT 'Open' (Open/Won/Lost) |
| dblAmount | decimal(18,2) | NULL |
| strCurrency | nvarchar(10) | DEFAULT 'INR' |
| dtExpectedCloseDate | datetime2 | NULL |
| dtActualCloseDate | datetime2 | NULL |
| intProbability | int | DEFAULT 0 |
| strLossReason | nvarchar(500) | NULL |
| strDescription | nvarchar(MAX) | NULL |
| dtStageEnteredOn | datetime2 | NOT NULL (for deal rotting) |
| dtLastActivityOn | datetime2 | NULL (for deal rotting) |
| strAssignedToGUID | uniqueidentifier | NULL |
| strCreatedByGUID | uniqueidentifier | NOT NULL |
| strUpdatedByGUID | uniqueidentifier | NULL |
| dtCreatedOn | datetime2 | NOT NULL DEFAULT GETUTCDATE() |
| dtUpdatedOn | datetime2 | NULL |
| bolIsActive | bit | DEFAULT 1 |
| bolIsDeleted | bit | DEFAULT 0 |
| dtDeletedOn | datetime2 | NULL |

**Indexes:** IX_MstOpportunities_GroupGUID, IX_MstOpportunities_PipelineGUID, IX_MstOpportunities_StageGUID, IX_MstOpportunities_AccountGUID, IX_MstOpportunities_Status

**Deal Rotting Logic:** `DATEDIFF(day, dtStageEnteredOn, GETUTCDATE()) > Stage.intDefaultDaysToRot` OR `DATEDIFF(day, dtLastActivityOn, GETUTCDATE()) > Stage.intDefaultDaysToRot`

---

### 2.7 MstOpportunityContacts (Junction)

| Column | Type | Constraints |
|--------|------|------------|
| strOpportunityContactGUID | uniqueidentifier | PK, DEFAULT NEWID() |
| strOpportunityGUID | uniqueidentifier | NOT NULL, FK→MstOpportunities |
| strContactGUID | uniqueidentifier | NOT NULL, FK→MstContacts |
| strRole | nvarchar(50) | DEFAULT 'Stakeholder' (DecisionMaker/Influencer/Champion/Stakeholder/EndUser) |
| bolIsPrimary | bit | DEFAULT 0 |
| dtCreatedOn | datetime2 | NOT NULL DEFAULT GETUTCDATE() |

**Unique Constraint:** (strOpportunityGUID, strContactGUID)

---

### 2.8 MstActivities

| Column | Type | Constraints |
|--------|------|------------|
| strActivityGUID | uniqueidentifier | PK, DEFAULT NEWID() |
| strGroupGUID | uniqueidentifier | NOT NULL (tenant) |
| strActivityType | nvarchar(50) | NOT NULL (Call/Email/Meeting/Note/Task/FollowUp) |
| strSubject | nvarchar(300) | NOT NULL |
| strDescription | nvarchar(MAX) | NULL |
| dtScheduledOn | datetime2 | NULL |
| dtCompletedOn | datetime2 | NULL |
| intDurationMinutes | int | NULL |
| strOutcome | nvarchar(200) | NULL |
| strAssignedToGUID | uniqueidentifier | NULL |
| strCreatedByGUID | uniqueidentifier | NOT NULL |
| dtCreatedOn | datetime2 | NOT NULL DEFAULT GETUTCDATE() |
| bolIsActive | bit | DEFAULT 1 |

**IMPORTANT:** Activities are IMMUTABLE — NO update, NO delete. Append-only audit trail.

---

### 2.9 MstActivityLinks (Polymorphic Junction — Salesforce Model)

| Column | Type | Constraints |
|--------|------|------------|
| strActivityLinkGUID | uniqueidentifier | PK, DEFAULT NEWID() |
| strActivityGUID | uniqueidentifier | NOT NULL, FK→MstActivities |
| strEntityType | nvarchar(50) | NOT NULL (Lead/Contact/Account/Opportunity) |
| strEntityGUID | uniqueidentifier | NOT NULL |
| dtCreatedOn | datetime2 | NOT NULL DEFAULT GETUTCDATE() |

**Unique Constraint:** (strActivityGUID, strEntityType, strEntityGUID)
**Index:** IX_MstActivityLinks_Entity (strEntityType, strEntityGUID) — for "get all activities for this lead/contact/etc."

**Why this design:** One activity can link to multiple entities simultaneously (e.g., a meeting with a Contact about an Opportunity on an Account). No nullable FK columns needed.

---

### 2.10 MstAuditLogs

| Column | Type | Constraints |
|--------|------|------------|
| strAuditLogGUID | uniqueidentifier | PK, DEFAULT NEWID() |
| strGroupGUID | uniqueidentifier | NOT NULL (tenant) |
| strEntityType | nvarchar(50) | NOT NULL |
| strEntityGUID | uniqueidentifier | NOT NULL |
| strAction | nvarchar(50) | NOT NULL (Create/Update/Delete/Convert/StageChange) |
| strChanges | nvarchar(MAX) | NULL (JSON diff) |
| strPerformedByGUID | uniqueidentifier | NOT NULL |
| dtPerformedOn | datetime2 | NOT NULL DEFAULT GETUTCDATE() |

**Immutable.** Write-only, no update/delete.

---

## 3. Entity Relationship Summary

```
MstLeads ──(converts to)──► MstAccounts + MstContacts + MstOpportunities
MstAccounts ◄──(belongs to)── MstContacts
MstAccounts ◄──(belongs to)── MstOpportunities
MstOpportunities ──(has stages)──► MstPipelineStages ──(belongs to)──► MstPipelines
MstOpportunities ◄──(junction)──► MstContacts  (via MstOpportunityContacts)
MstActivities ──(links to)──► MstActivityLinks ──(polymorphic)──► Lead|Contact|Account|Opportunity
MstAuditLogs ──(tracks)──► All entities (polymorphic strEntityType + strEntityGUID)
```

---

## 4. Architecture Layers & Data Flow

```
HTTP Request
  │
  ▼
Middleware Pipeline (ExceptionHandling → TokenValidation → TenantContext → RequestLogging → Performance)
  │
  ▼
Controller (thin — validates route params, calls ApplicationService, returns response)
  │
  ▼
ApplicationService (orchestration — coordinates services, DTO↔Entity mapping, transaction scope)
  │
  ▼
Service (business/domain logic — rules, calculations, validations)
  │
  ▼
Repository (data access — EF Core queries, CRUD)
  │
  ▼
CrmDbContext → SQL Server
```

### Layer Responsibilities

| Layer | Folder | Responsibility |
|-------|--------|---------------|
| **Presentation** | Controllers/ | Route params, call ApplicationService, wrap in ApiResponse |
| **Orchestration** | ApplicationServices/ | DTO mapping, coordinate multiple Services, UnitOfWork transactions |
| **Business Logic** | Services/ | Domain rules, validations, calculations, scoring |
| **Data Access** | DataAccess/ | EF Core CRUD, query building, UnitOfWork |
| **Cross-Cutting** | Middleware/, Filters/, Attributes/, Extensions/, Helpers/ | AOP concerns (auth, logging, tenant, validation, exceptions) |

### Key Rule: Controller NEVER calls Service directly. Always through ApplicationService.

```
Controller → ApplicationService → Service(s) → Repository → DB
                                      ↓
                                  UnitOfWork.SaveChangesAsync()
```

---

## 5. Constants (Business Rules as Code)

### LeadStatusConstants.cs
```csharp
public static class LeadStatusConstants
{
    public const string New = "New";
    public const string Contacted = "Contacted";
    public const string Qualified = "Qualified";
    public const string Unqualified = "Unqualified";
    public const string Converted = "Converted";

    public static readonly string[] AllStatuses = { New, Contacted, Qualified, Unqualified, Converted };
    public static readonly string[] ActiveStatuses = { New, Contacted, Qualified };
    public static readonly string[] ConvertibleStatuses = { Qualified };
}
```

### LeadSourceConstants.cs
```csharp
public static class LeadSourceConstants
{
    public const string Website = "Website";
    public const string Referral = "Referral";
    public const string LinkedIn = "LinkedIn";
    public const string ColdCall = "ColdCall";
    public const string Advertisement = "Advertisement";
    public const string TradeShow = "TradeShow";
    public const string Other = "Other";

    public static readonly string[] AllSources = { Website, Referral, LinkedIn, ColdCall, Advertisement, TradeShow, Other };
}
```

### ContactLifecycleStageConstants.cs
```csharp
public static class ContactLifecycleStageConstants
{
    public const string Subscriber = "Subscriber";
    public const string Lead = "Lead";
    public const string MQL = "MQL";       // Marketing Qualified Lead
    public const string SQL = "SQL";       // Sales Qualified Lead
    public const string Opportunity = "Opportunity";
    public const string Customer = "Customer";
    public const string Evangelist = "Evangelist";

    public static readonly string[] AllStages = { Subscriber, Lead, MQL, SQL, Opportunity, Customer, Evangelist };
}
```

### ContactStatusConstants.cs
```csharp
public static class ContactStatusConstants
{
    public const string Active = "Active";
    public const string Inactive = "Inactive";
    public const string Bounced = "Bounced";
    public const string Unsubscribed = "Unsubscribed";
}
```

### OpportunityStageConstants.cs
```csharp
public static class OpportunityStageConstants
{
    // Default pipeline stages (seeded per tenant)
    public const string Prospecting = "Prospecting";
    public const string Qualification = "Qualification";
    public const string Proposal = "Proposal";
    public const string Negotiation = "Negotiation";
    public const string ClosedWon = "Closed Won";
    public const string ClosedLost = "Closed Lost";

    public static readonly Dictionary<string, int> DefaultProbabilities = new()
    {
        { Prospecting, 10 }, { Qualification, 25 }, { Proposal, 50 },
        { Negotiation, 75 }, { ClosedWon, 100 }, { ClosedLost, 0 }
    };

    public static readonly Dictionary<string, int> DefaultDaysToRot = new()
    {
        { Prospecting, 14 }, { Qualification, 21 }, { Proposal, 30 },
        { Negotiation, 14 }, { ClosedWon, 0 }, { ClosedLost, 0 }
    };
}
```

### ActivityTypeConstants.cs
```csharp
public static class ActivityTypeConstants
{
    public const string Call = "Call";
    public const string Email = "Email";
    public const string Meeting = "Meeting";
    public const string Note = "Note";
    public const string Task = "Task";
    public const string FollowUp = "FollowUp";

    public static readonly string[] AllTypes = { Call, Email, Meeting, Note, Task, FollowUp };
}
```

### EntityTypeConstants.cs
```csharp
public static class EntityTypeConstants
{
    public const string Lead = "Lead";
    public const string Contact = "Contact";
    public const string Account = "Account";
    public const string Opportunity = "Opportunity";

    public static readonly string[] AllTypes = { Lead, Contact, Account, Opportunity };
}
```

### LeadErrorCodes.cs
```csharp
public static class LeadErrorCodes
{
    public const string LeadNotFound = "LEAD_NOT_FOUND";
    public const string LeadAlreadyConverted = "LEAD_ALREADY_CONVERTED";
    public const string LeadNotQualified = "LEAD_NOT_QUALIFIED";
    public const string DuplicateEmail = "LEAD_DUPLICATE_EMAIL";
    public const string InvalidStatusTransition = "LEAD_INVALID_STATUS";
}
```

### OpportunityErrorCodes.cs
```csharp
public static class OpportunityErrorCodes
{
    public const string OpportunityNotFound = "OPP_NOT_FOUND";
    public const string InvalidStageTransition = "OPP_INVALID_STAGE";
    public const string RequiredFieldsMissing = "OPP_REQUIRED_FIELDS";
    public const string AlreadyClosed = "OPP_ALREADY_CLOSED";
    public const string LossReasonRequired = "OPP_LOSS_REASON_REQUIRED";
}
```

### OpportunityContactMapping.cs
```csharp
public static class OpportunityContactMapping
{
    public const string DecisionMaker = "DecisionMaker";
    public const string Influencer = "Influencer";
    public const string Champion = "Champion";
    public const string Stakeholder = "Stakeholder";
    public const string EndUser = "EndUser";

    public static readonly string[] AllRoles = { DecisionMaker, Influencer, Champion, Stakeholder, EndUser };
}
```

### PipelineConstants.cs
```csharp
public static class PipelineConstants
{
    public const string DefaultPipelineName = "Sales Pipeline";
    public const int MaxStagesPerPipeline = 20;
    public const int MinStagesPerPipeline = 2; // at least one open + one closed stage
}
```

---

## 6. Models (Entity Classes)

### ITenantEntity.cs
```csharp
public interface ITenantEntity
{
    Guid strGroupGUID { get; set; }
}
```

### MstLead.cs (Representative Example)
```csharp
public class MstLead : ITenantEntity
{
    public Guid strLeadGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strFirstName { get; set; } = string.Empty;
    public string strLastName { get; set; } = string.Empty;
    public string strEmail { get; set; } = string.Empty;
    public string? strPhone { get; set; }
    public string? strCompanyName { get; set; }
    public string? strJobTitle { get; set; }
    public string strSource { get; set; } = LeadSourceConstants.Other;
    public string strStatus { get; set; } = LeadStatusConstants.New;
    public int intLeadScore { get; set; }
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strNotes { get; set; }
    public Guid? strConvertedAccountGUID { get; set; }
    public Guid? strConvertedContactGUID { get; set; }
    public Guid? strConvertedOpportunityGUID { get; set; }
    public DateTime? dtConvertedOn { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsActive { get; set; } = true;
    public bool bolIsDeleted { get; set; }
    public DateTime? dtDeletedOn { get; set; }

    // Navigation
    public MstAccount? ConvertedAccount { get; set; }
    public MstContact? ConvertedContact { get; set; }
    public MstOpportunity? ConvertedOpportunity { get; set; }
    public ICollection<MstActivityLink> ActivityLinks { get; set; } = new List<MstActivityLink>();
}
```

### MstOpportunity.cs (Key entity with deal rotting)
```csharp
public class MstOpportunity : ITenantEntity
{
    public Guid strOpportunityGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strOpportunityName { get; set; } = string.Empty;
    public Guid? strAccountGUID { get; set; }
    public Guid strPipelineGUID { get; set; }
    public Guid strStageGUID { get; set; }
    public string strStatus { get; set; } = "Open";
    public decimal? dblAmount { get; set; }
    public string strCurrency { get; set; } = "INR";
    public DateTime? dtExpectedCloseDate { get; set; }
    public DateTime? dtActualCloseDate { get; set; }
    public int intProbability { get; set; }
    public string? strLossReason { get; set; }
    public string? strDescription { get; set; }
    public DateTime dtStageEnteredOn { get; set; }  // for deal rotting
    public DateTime? dtLastActivityOn { get; set; }  // for deal rotting
    public Guid? strAssignedToGUID { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsActive { get; set; } = true;
    public bool bolIsDeleted { get; set; }
    public DateTime? dtDeletedOn { get; set; }

    // Navigation
    public MstAccount? Account { get; set; }
    public MstPipeline Pipeline { get; set; } = null!;
    public MstPipelineStage Stage { get; set; } = null!;
    public ICollection<MstOpportunityContact> OpportunityContacts { get; set; } = new List<MstOpportunityContact>();
    public ICollection<MstActivityLink> ActivityLinks { get; set; } = new List<MstActivityLink>();
}
```

### MstActivity.cs (Immutable — no update/delete)
```csharp
public class MstActivity : ITenantEntity
{
    public Guid strActivityGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strActivityType { get; set; } = string.Empty;
    public string strSubject { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public DateTime? dtScheduledOn { get; set; }
    public DateTime? dtCompletedOn { get; set; }
    public int? intDurationMinutes { get; set; }
    public string? strOutcome { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public bool bolIsActive { get; set; } = true;

    // Navigation
    public ICollection<MstActivityLink> ActivityLinks { get; set; } = new List<MstActivityLink>();
}
```

### MstActivityLink.cs (Polymorphic junction)
```csharp
public class MstActivityLink
{
    public Guid strActivityLinkGUID { get; set; }
    public Guid strActivityGUID { get; set; }
    public string strEntityType { get; set; } = string.Empty;  // Lead|Contact|Account|Opportunity
    public Guid strEntityGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }

    // Navigation
    public MstActivity Activity { get; set; } = null!;
}
```

### MstPipelineStage.cs (Data-driven, configurable)
```csharp
public class MstPipelineStage
{
    public Guid strStageGUID { get; set; }
    public Guid strPipelineGUID { get; set; }
    public string strStageName { get; set; } = string.Empty;
    public int intDisplayOrder { get; set; }
    public int intProbabilityPercent { get; set; }
    public string? strRequiredFields { get; set; }       // JSON: ["dblAmount","dtExpectedCloseDate"]
    public string? strAllowedTransitions { get; set; }   // JSON: ["stageGUID1","stageGUID2"]
    public int intDefaultDaysToRot { get; set; } = 30;
    public bool bolIsWonStage { get; set; }
    public bool bolIsLostStage { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsActive { get; set; } = true;

    // Navigation
    public MstPipeline Pipeline { get; set; } = null!;
}
```

---

## 7. DTOs

### Common DTOs

```csharp
// TokenClaimsDto.cs
public class TokenClaimsDto
{
    public Guid strUserGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strName { get; set; } = string.Empty;
    public string strEmailId { get; set; } = string.Empty;
    public string strTimeZone { get; set; } = "Asia/Kolkata";
}

// PagedRequestDto.cs
public class PagedRequestDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public bool Ascending { get; set; } = true;
    public bool? bolIsActive { get; set; }
}

// BulkOperationDto.cs
public class BulkOperationDto
{
    public List<Guid> Guids { get; set; } = new();
}
```

### Lead DTOs (LeadDtos.cs — all DTOs in one file per entity)

```csharp
// --- CREATE ---
public class CreateLeadDto
{
    public string strFirstName { get; set; } = string.Empty;
    public string strLastName { get; set; } = string.Empty;
    public string strEmail { get; set; } = string.Empty;
    public string? strPhone { get; set; }
    public string? strCompanyName { get; set; }
    public string? strJobTitle { get; set; }
    public string strSource { get; set; } = "Other";
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strNotes { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}

// --- UPDATE ---
public class UpdateLeadDto
{
    public string strFirstName { get; set; } = string.Empty;
    public string strLastName { get; set; } = string.Empty;
    public string strEmail { get; set; } = string.Empty;
    public string? strPhone { get; set; }
    public string? strCompanyName { get; set; }
    public string? strJobTitle { get; set; }
    public string strSource { get; set; } = "Other";
    public string strStatus { get; set; } = "New";
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strNotes { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}

// --- LIST ---
public class LeadListDto
{
    public Guid strLeadGUID { get; set; }
    public string strFirstName { get; set; } = string.Empty;
    public string strLastName { get; set; } = string.Empty;
    public string strEmail { get; set; } = string.Empty;
    public string? strPhone { get; set; }
    public string? strCompanyName { get; set; }
    public string strSource { get; set; } = string.Empty;
    public string strStatus { get; set; } = string.Empty;
    public int intLeadScore { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public string? strAssignedToName { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public bool bolIsActive { get; set; }
}

// --- DETAIL ---
public class LeadDetailDto : LeadListDto
{
    public string? strJobTitle { get; set; }
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strNotes { get; set; }
    public Guid? strConvertedAccountGUID { get; set; }
    public Guid? strConvertedContactGUID { get; set; }
    public Guid? strConvertedOpportunityGUID { get; set; }
    public DateTime? dtConvertedOn { get; set; }
    public string strCreatedByName { get; set; } = string.Empty;
    public DateTime? dtUpdatedOn { get; set; }
    public List<ActivityListDto> RecentActivities { get; set; } = new();
}

// --- FILTER PARAMS ---
public class LeadFilterParams : PagedRequestDto
{
    public string? strStatus { get; set; }
    public string? strSource { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public DateTime? dtFromDate { get; set; }
    public DateTime? dtToDate { get; set; }
    public int? intMinScore { get; set; }
    public int? intMaxScore { get; set; }
}
```

### Opportunity DTOs (OpportunityDtos.cs)

```csharp
public class CreateOpportunityDto
{
    public string strOpportunityName { get; set; } = string.Empty;
    public Guid? strAccountGUID { get; set; }
    public Guid strPipelineGUID { get; set; }
    public Guid strStageGUID { get; set; }
    public decimal? dblAmount { get; set; }
    public string strCurrency { get; set; } = "INR";
    public DateTime? dtExpectedCloseDate { get; set; }
    public string? strDescription { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public List<OpportunityContactDto>? Contacts { get; set; }
}

public class UpdateOpportunityDto
{
    public string strOpportunityName { get; set; } = string.Empty;
    public Guid? strAccountGUID { get; set; }
    public Guid strStageGUID { get; set; }
    public decimal? dblAmount { get; set; }
    public string strCurrency { get; set; } = "INR";
    public DateTime? dtExpectedCloseDate { get; set; }
    public string? strDescription { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}

public class OpportunityListDto
{
    public Guid strOpportunityGUID { get; set; }
    public string strOpportunityName { get; set; } = string.Empty;
    public string? strAccountName { get; set; }
    public string strStageName { get; set; } = string.Empty;
    public string strStatus { get; set; } = string.Empty;
    public decimal? dblAmount { get; set; }
    public string strCurrency { get; set; } = string.Empty;
    public int intProbability { get; set; }
    public DateTime? dtExpectedCloseDate { get; set; }
    public bool bolIsRotting { get; set; }  // computed
    public Guid? strAssignedToGUID { get; set; }
    public string? strAssignedToName { get; set; }
    public DateTime dtCreatedOn { get; set; }
}

public class OpportunityDetailDto : OpportunityListDto
{
    public Guid? strAccountGUID { get; set; }
    public Guid strPipelineGUID { get; set; }
    public string strPipelineName { get; set; } = string.Empty;
    public Guid strStageGUID { get; set; }
    public DateTime? dtActualCloseDate { get; set; }
    public string? strLossReason { get; set; }
    public string? strDescription { get; set; }
    public DateTime dtStageEnteredOn { get; set; }
    public DateTime? dtLastActivityOn { get; set; }
    public int intDaysInStage { get; set; }  // computed
    public List<OpportunityContactDto> Contacts { get; set; } = new();
    public List<ActivityListDto> RecentActivities { get; set; } = new();
}

public class OpportunityContactDto
{
    public Guid strContactGUID { get; set; }
    public string? strContactName { get; set; }
    public string strRole { get; set; } = "Stakeholder";
    public bool bolIsPrimary { get; set; }
}

public class CloseOpportunityDto
{
    public string strStatus { get; set; } = string.Empty;  // Won or Lost
    public string? strLossReason { get; set; }              // required if Lost
    public DateTime? dtActualCloseDate { get; set; }
}

public class OpportunityFilterParams : PagedRequestDto
{
    public string? strStatus { get; set; }
    public Guid? strPipelineGUID { get; set; }
    public Guid? strStageGUID { get; set; }
    public Guid? strAccountGUID { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public decimal? dblMinAmount { get; set; }
    public decimal? dblMaxAmount { get; set; }
    public DateTime? dtFromDate { get; set; }
    public DateTime? dtToDate { get; set; }
    public bool? bolIsRotting { get; set; }
}
```

### Lead Conversion DTOs (LeadConversionDtos.cs)

```csharp
public class ConvertLeadDto
{
    public Guid strLeadGUID { get; set; }
    public bool bolCreateAccount { get; set; } = true;
    public bool bolCreateOpportunity { get; set; } = true;
    public Guid? strExistingAccountGUID { get; set; }   // skip account creation
    public string? strOpportunityName { get; set; }
    public Guid? strPipelineGUID { get; set; }
    public decimal? dblAmount { get; set; }
}

public class LeadConversionResultDto
{
    public Guid strLeadGUID { get; set; }
    public Guid strContactGUID { get; set; }
    public Guid? strAccountGUID { get; set; }
    public Guid? strOpportunityGUID { get; set; }
    public string strMessage { get; set; } = string.Empty;
}
```

### Activity DTOs (ActivityDtos.cs)

```csharp
public class CreateActivityDto
{
    public string strActivityType { get; set; } = string.Empty;
    public string strSubject { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public DateTime? dtScheduledOn { get; set; }
    public DateTime? dtCompletedOn { get; set; }
    public int? intDurationMinutes { get; set; }
    public string? strOutcome { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public List<ActivityLinkDto> Links { get; set; } = new();  // which entities to link
}

public class ActivityLinkDto
{
    public string strEntityType { get; set; } = string.Empty;  // Lead|Contact|Account|Opportunity
    public Guid strEntityGUID { get; set; }
}

public class ActivityListDto
{
    public Guid strActivityGUID { get; set; }
    public string strActivityType { get; set; } = string.Empty;
    public string strSubject { get; set; } = string.Empty;
    public DateTime? dtScheduledOn { get; set; }
    public DateTime? dtCompletedOn { get; set; }
    public int? intDurationMinutes { get; set; }
    public string? strOutcome { get; set; }
    public string strCreatedByName { get; set; } = string.Empty;
    public DateTime dtCreatedOn { get; set; }
    public List<ActivityLinkDto> Links { get; set; } = new();
}

public class ActivityFilterParams : PagedRequestDto
{
    public string? strActivityType { get; set; }
    public string? strEntityType { get; set; }
    public Guid? strEntityGUID { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public DateTime? dtFromDate { get; set; }
    public DateTime? dtToDate { get; set; }
    public bool? bolIsCompleted { get; set; }
}
```

### Dashboard DTOs (CrmDashboardDtos.cs)

```csharp
public class CrmDashboardDto
{
    // KPI Cards
    public int intTotalLeads { get; set; }
    public int intQualifiedLeads { get; set; }
    public int intTotalOpenOpportunities { get; set; }
    public decimal dblTotalPipelineValue { get; set; }
    public decimal dblWeightedPipelineValue { get; set; }
    public decimal dblWonRevenue { get; set; }
    public decimal dblLostRevenue { get; set; }
    public double dblWinRate { get; set; }
    public double dblAvgSalesCycleDays { get; set; }
    public decimal dblSalesVelocity { get; set; }  // (OpenDeals × AvgSize × WinRate) / AvgCycleDays
    public int intRottingOpportunities { get; set; }
    public int intActivitiesThisWeek { get; set; }

    // Charts
    public List<PipelineStageSummaryDto> PipelineStages { get; set; } = new();
    public List<LeadsBySourceDto> LeadsBySource { get; set; } = new();
    public List<LeadsByStatusDto> LeadsByStatus { get; set; } = new();
    public List<RevenueByMonthDto> RevenueByMonth { get; set; } = new();
    public List<TopOpportunityDto> TopOpportunities { get; set; } = new();
    public List<UpcomingActivityDto> UpcomingActivities { get; set; } = new();
}

public class PipelineStageSummaryDto
{
    public string strStageName { get; set; } = string.Empty;
    public int intCount { get; set; }
    public decimal dblTotalValue { get; set; }
    public int intRottingCount { get; set; }
}

public class LeadsBySourceDto
{
    public string strSource { get; set; } = string.Empty;
    public int intCount { get; set; }
}

public class LeadsByStatusDto
{
    public string strStatus { get; set; } = string.Empty;
    public int intCount { get; set; }
}

public class RevenueByMonthDto
{
    public string strMonth { get; set; } = string.Empty;
    public decimal dblWonAmount { get; set; }
    public decimal dblLostAmount { get; set; }
}

public class TopOpportunityDto
{
    public Guid strOpportunityGUID { get; set; }
    public string strOpportunityName { get; set; } = string.Empty;
    public decimal? dblAmount { get; set; }
    public string strStageName { get; set; } = string.Empty;
    public string? strAccountName { get; set; }
}

public class UpcomingActivityDto
{
    public Guid strActivityGUID { get; set; }
    public string strActivityType { get; set; } = string.Empty;
    public string strSubject { get; set; } = string.Empty;
    public DateTime? dtScheduledOn { get; set; }
    public string? strEntityName { get; set; }
}
```

### Pipeline DTOs (PipelineDtos.cs)

```csharp
public class CreatePipelineDto
{
    public string strPipelineName { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public bool bolIsDefault { get; set; }
    public List<CreatePipelineStageDto> Stages { get; set; } = new();
}

public class CreatePipelineStageDto
{
    public string strStageName { get; set; } = string.Empty;
    public int intDisplayOrder { get; set; }
    public int intProbabilityPercent { get; set; }
    public int intDefaultDaysToRot { get; set; } = 30;
    public bool bolIsWonStage { get; set; }
    public bool bolIsLostStage { get; set; }
}

public class PipelineListDto
{
    public Guid strPipelineGUID { get; set; }
    public string strPipelineName { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public bool bolIsDefault { get; set; }
    public int intStageCount { get; set; }
    public int intOpportunityCount { get; set; }
    public bool bolIsActive { get; set; }
}

public class PipelineDetailDto : PipelineListDto
{
    public List<PipelineStageDto> Stages { get; set; } = new();
}

public class PipelineStageDto
{
    public Guid strStageGUID { get; set; }
    public string strStageName { get; set; } = string.Empty;
    public int intDisplayOrder { get; set; }
    public int intProbabilityPercent { get; set; }
    public int intDefaultDaysToRot { get; set; }
    public bool bolIsWonStage { get; set; }
    public bool bolIsLostStage { get; set; }
    public int intOpportunityCount { get; set; }
}
```

### Account DTOs (AccountDtos.cs)

```csharp
public class CreateAccountDto
{
    public string strAccountName { get; set; } = string.Empty;
    public string? strIndustry { get; set; }
    public string? strWebsite { get; set; }
    public string? strPhone { get; set; }
    public string? strEmail { get; set; }
    public int? intEmployeeCount { get; set; }
    public decimal? dblAnnualRevenue { get; set; }
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strDescription { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}

public class UpdateAccountDto : CreateAccountDto { }

public class AccountListDto
{
    public Guid strAccountGUID { get; set; }
    public string strAccountName { get; set; } = string.Empty;
    public string? strIndustry { get; set; }
    public string? strPhone { get; set; }
    public string? strEmail { get; set; }
    public int intContactCount { get; set; }
    public int intOpenOpportunityCount { get; set; }
    public decimal dblTotalOpportunityValue { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public string? strAssignedToName { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public bool bolIsActive { get; set; }
}

public class AccountDetailDto : AccountListDto
{
    public string? strWebsite { get; set; }
    public int? intEmployeeCount { get; set; }
    public decimal? dblAnnualRevenue { get; set; }
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strDescription { get; set; }
    public List<ContactListDto> Contacts { get; set; } = new();
    public List<OpportunityListDto> Opportunities { get; set; } = new();
    public List<ActivityListDto> RecentActivities { get; set; } = new();
}

public class AccountFilterParams : PagedRequestDto
{
    public string? strIndustry { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}
```

### Contact DTOs (ContactDtos.cs)

```csharp
public class CreateContactDto
{
    public Guid? strAccountGUID { get; set; }
    public string strFirstName { get; set; } = string.Empty;
    public string strLastName { get; set; } = string.Empty;
    public string strEmail { get; set; } = string.Empty;
    public string? strPhone { get; set; }
    public string? strMobilePhone { get; set; }
    public string? strJobTitle { get; set; }
    public string? strDepartment { get; set; }
    public string? strLifecycleStage { get; set; }
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strNotes { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}

public class UpdateContactDto : CreateContactDto { }

public class ContactListDto
{
    public Guid strContactGUID { get; set; }
    public string strFirstName { get; set; } = string.Empty;
    public string strLastName { get; set; } = string.Empty;
    public string strEmail { get; set; } = string.Empty;
    public string? strPhone { get; set; }
    public string? strJobTitle { get; set; }
    public string? strAccountName { get; set; }
    public string strLifecycleStage { get; set; } = string.Empty;
    public Guid? strAssignedToGUID { get; set; }
    public string? strAssignedToName { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public bool bolIsActive { get; set; }
}

public class ContactDetailDto : ContactListDto
{
    public Guid? strAccountGUID { get; set; }
    public string? strMobilePhone { get; set; }
    public string? strDepartment { get; set; }
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strNotes { get; set; }
    public DateTime? dtLastContactedOn { get; set; }
    public List<OpportunityListDto> Opportunities { get; set; } = new();
    public List<ActivityListDto> RecentActivities { get; set; } = new();
}

public class ContactFilterParams : PagedRequestDto
{
    public Guid? strAccountGUID { get; set; }
    public string? strLifecycleStage { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}
```

---

## 8. API Endpoints (All Controllers)

### 8.1 LeadsController — `/api/crm/leads`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/crm/leads` | List leads (paged, filtered) |
| GET | `/api/crm/leads/{id}` | Get lead detail |
| POST | `/api/crm/leads` | Create lead |
| PUT | `/api/crm/leads/{id}` | Update lead |
| DELETE | `/api/crm/leads/{id}` | Soft delete lead |
| PATCH | `/api/crm/leads/{id}/status` | Change lead status |
| POST | `/api/crm/leads/bulk-archive` | Bulk archive leads |
| POST | `/api/crm/leads/bulk-restore` | Bulk restore leads |

### 8.2 ContactsController — `/api/crm/contacts`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/crm/contacts` | List contacts (paged, filtered) |
| GET | `/api/crm/contacts/{id}` | Get contact detail |
| POST | `/api/crm/contacts` | Create contact |
| PUT | `/api/crm/contacts/{id}` | Update contact |
| DELETE | `/api/crm/contacts/{id}` | Soft delete contact |
| POST | `/api/crm/contacts/bulk-archive` | Bulk archive |
| POST | `/api/crm/contacts/bulk-restore` | Bulk restore |

### 8.3 AccountsController — `/api/crm/accounts`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/crm/accounts` | List accounts (paged, filtered) |
| GET | `/api/crm/accounts/{id}` | Get account detail (with contacts + opportunities) |
| POST | `/api/crm/accounts` | Create account |
| PUT | `/api/crm/accounts/{id}` | Update account |
| DELETE | `/api/crm/accounts/{id}` | Soft delete account |
| POST | `/api/crm/accounts/bulk-archive` | Bulk archive |
| POST | `/api/crm/accounts/bulk-restore` | Bulk restore |

### 8.4 OpportunitiesController — `/api/crm/opportunities`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/crm/opportunities` | List opportunities (paged, filtered) |
| GET | `/api/crm/opportunities/{id}` | Get opportunity detail |
| POST | `/api/crm/opportunities` | Create opportunity |
| PUT | `/api/crm/opportunities/{id}` | Update opportunity |
| DELETE | `/api/crm/opportunities/{id}` | Soft delete opportunity |
| PATCH | `/api/crm/opportunities/{id}/stage` | Move to new stage |
| POST | `/api/crm/opportunities/{id}/close` | Close as Won/Lost |
| POST | `/api/crm/opportunities/{id}/contacts` | Add contact to opportunity |
| DELETE | `/api/crm/opportunities/{id}/contacts/{contactId}` | Remove contact |
| GET | `/api/crm/opportunities/board/{pipelineId}` | Kanban board view (grouped by stage) |

### 8.5 PipelinesController — `/api/crm/pipelines`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/crm/pipelines` | List pipelines |
| GET | `/api/crm/pipelines/{id}` | Get pipeline with stages |
| POST | `/api/crm/pipelines` | Create pipeline with stages |
| PUT | `/api/crm/pipelines/{id}` | Update pipeline |
| DELETE | `/api/crm/pipelines/{id}` | Soft delete pipeline |
| PUT | `/api/crm/pipelines/{id}/stages` | Reorder/update stages |
| POST | `/api/crm/pipelines/{id}/stages` | Add stage |
| DELETE | `/api/crm/pipelines/{id}/stages/{stageId}` | Remove stage |

### 8.6 ActivitiesController — `/api/crm/activities`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/crm/activities` | List activities (paged, filtered by entity) |
| GET | `/api/crm/activities/{id}` | Get activity detail |
| POST | `/api/crm/activities` | Create activity (with links) |
| GET | `/api/crm/activities/entity/{entityType}/{entityId}` | All activities for an entity |
| GET | `/api/crm/activities/upcoming` | Upcoming scheduled activities |

**Note:** No PUT/DELETE — activities are IMMUTABLE (append-only).

### 8.7 LeadConversionController — `/api/crm/lead-conversion`

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/crm/lead-conversion/convert` | Convert lead → Account + Contact + Opportunity |
| GET | `/api/crm/lead-conversion/{leadId}/preview` | Preview conversion (what will be created) |

### 8.8 DashboardController — `/api/crm/dashboard`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/crm/dashboard` | Full dashboard data |
| GET | `/api/crm/dashboard/pipeline-summary/{pipelineId}` | Pipeline funnel data |
| GET | `/api/crm/dashboard/sales-velocity` | Sales velocity KPI |

### 8.9 ServiceStatusController — `/api/crm/status`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/crm/status` | Health check |

**Total: 45+ API endpoints across 9 controllers**

---

## 9. Middleware Pipeline (Program.cs order)

```csharp
// Program.cs — Middleware registration order
app.UseMiddleware<ExceptionHandlingMiddleware>();     // 1. Global error handling
app.UseCors();                                        // 2. CORS
app.UseRateLimiter();                                // 3. Rate limiting
app.UseHttpsRedirection();                           // 4. HTTPS
app.UseMiddleware<TokenValidationMiddleware>();       // 5. JWT validation
app.UseAuthentication();                             // 6. Auth
app.UseMiddleware<TenantContextMiddleware>();         // 7. Extract strGroupGUID from JWT
app.UseMiddleware<RequestLoggingMiddleware>();        // 8. Log all requests
app.UseMiddleware<PerformanceMiddleware>();           // 9. Track slow requests
app.UseAuthorization();                              // 10. Authorization
app.MapControllers();                                // 11. Route to controllers
app.MapHub<CrmNotificationHub>("/hubs/crm");         // 12. SignalR
```

### Middleware Details

**ExceptionHandlingMiddleware** — Maps exceptions to HTTP status codes:
```
BusinessException → 400 Bad Request (with errorCode)
ValidationException → 422 Unprocessable Entity
NotFoundException → 404 Not Found
UnauthorizedAccessException → 401 Unauthorized
Everything else → 500 Internal Server Error (log full details)
```

**TenantContextMiddleware** — Extracts strGroupGUID from JWT claims, sets in HttpContext.Items. All downstream code uses this for multi-tenant data isolation.

**PerformanceMiddleware** — Logs warning if request takes > 500ms.

---

## 10. AOP — Attributes & Filters

### AuthorizePermissionAttribute.cs
```csharp
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class AuthorizePermissionAttribute : Attribute, IAuthorizationFilter
{
    private readonly string _module;
    private readonly string _action;

    public AuthorizePermissionAttribute(string module, string action)
    {
        _module = module;
        _action = action;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // Check user permissions from JWT claims against module:action
        // Return 403 if not authorized
    }
}

// Usage in controller:
[AuthorizePermission("CRM_Leads", "View")]
public async Task<IActionResult> GetLeads([FromQuery] LeadFilterParams filter) { }
```

### AuditLogAttribute.cs + AuditLogFilter.cs
```csharp
[AttributeUsage(AttributeTargets.Method)]
public class AuditLogAttribute : Attribute
{
    public string EntityType { get; }
    public string Action { get; }
    public AuditLogAttribute(string entityType, string action)
    {
        EntityType = entityType;
        Action = action;
    }
}

// AuditLogFilter reads the attribute, captures before/after state, writes to MstAuditLogs
```

### ValidateModelFilter.cs
```csharp
// Automatically validates incoming DTOs using FluentValidation
// Returns 422 with validation errors if invalid
// Applied globally in Program.cs: services.AddControllers(options => options.Filters.Add<ValidateModelFilter>());
```

### RequireTenantIdAttribute.cs
```csharp
// Ensures strGroupGUID is present in the request context
// Returns 400 if missing
```

### TrimStringsAttribute.cs
```csharp
// Auto-trims all string properties on incoming DTOs
// Prevents " John " being saved with whitespace
```

---

## 11. DataAccess Patterns

### IRepository.cs (Generic Base)
```csharp
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    IQueryable<T> Query();
    Task AddAsync(T entity);
    void Update(T entity);
    void Delete(T entity);
}
```

### UnitOfWork.cs
```csharp
public interface IUnitOfWork : IDisposable
{
    IMstLeadRepository Leads { get; }
    IMstContactRepository Contacts { get; }
    IMstAccountRepository Accounts { get; }
    IMstOpportunityRepository Opportunities { get; }
    IMstOpportunityContactRepository OpportunityContacts { get; }
    IMstPipelineRepository Pipelines { get; }
    IMstPipelineStageRepository PipelineStages { get; }
    IMstActivityRepository Activities { get; }
    IMstActivityLinkRepository ActivityLinks { get; }
    IMstAuditLogRepository AuditLogs { get; }
    Task<int> SaveChangesAsync();
}
```

### CrmDbContext — Multi-tenant global query filter
```csharp
protected override void OnModelCreating(ModelBuilder builder)
{
    // Global query filter for multi-tenancy
    builder.Entity<MstLead>().HasQueryFilter(e => e.strGroupGUID == _tenantId && !e.bolIsDeleted);
    builder.Entity<MstContact>().HasQueryFilter(e => e.strGroupGUID == _tenantId && !e.bolIsDeleted);
    builder.Entity<MstAccount>().HasQueryFilter(e => e.strGroupGUID == _tenantId && !e.bolIsDeleted);
    builder.Entity<MstOpportunity>().HasQueryFilter(e => e.strGroupGUID == _tenantId && !e.bolIsDeleted);
    builder.Entity<MstActivity>().HasQueryFilter(e => e.strGroupGUID == _tenantId);  // no soft delete
    // ... etc
}
```

---

## 12. Key Business Logic Flows

### 12.1 Lead Conversion (Atomic Transaction)

```
1. Validate: Lead exists, status in ConvertibleStatuses, not already converted
2. Begin transaction (UnitOfWork)
3. Create MstAccount (from lead's company info) — OR use existing account
4. Create MstContact (from lead's personal info, linked to account)
5. Create MstOpportunity (optional, linked to account, default pipeline first stage)
6. Re-link all MstActivityLinks from Lead to new Contact + Account + Opportunity
7. Update Lead: strStatus = "Converted", set conversion GUIDs, dtConvertedOn
8. Write MstAuditLog entry (action = "Convert")
9. Commit transaction
10. Return LeadConversionResultDto
```

### 12.2 Opportunity Stage Change

```
1. Validate: Stage exists in same pipeline, transition is allowed (strAllowedTransitions)
2. Check required fields for target stage (strRequiredFields JSON)
3. Update: strStageGUID, intProbability (from stage), dtStageEnteredOn = NOW
4. If Won stage: strStatus = "Won", dtActualCloseDate = NOW
5. If Lost stage: strStatus = "Lost", require strLossReason, dtActualCloseDate = NOW
6. Write audit log with stage change details
```

### 12.3 Deal Rotting Check (computed on read, not stored)

```csharp
public bool IsRotting(MstOpportunity opp, MstPipelineStage stage)
{
    if (stage.bolIsWonStage || stage.bolIsLostStage) return false;
    if (stage.intDefaultDaysToRot <= 0) return false;

    var daysSinceStageEntry = (DateTime.UtcNow - opp.dtStageEnteredOn).Days;
    var daysSinceLastActivity = opp.dtLastActivityOn.HasValue
        ? (DateTime.UtcNow - opp.dtLastActivityOn.Value).Days
        : daysSinceStageEntry;

    return daysSinceStageEntry > stage.intDefaultDaysToRot
        || daysSinceLastActivity > stage.intDefaultDaysToRot;
}
```

### 12.4 Sales Velocity KPI

```
Sales Velocity = (OpenDeals × AvgDealSize × WinRate) / AvgSalesCycleDays

Where:
- OpenDeals = COUNT(MstOpportunities WHERE strStatus = 'Open')
- AvgDealSize = AVG(dblAmount) of Won opportunities
- WinRate = Won / (Won + Lost) as decimal
- AvgSalesCycleDays = AVG(dtActualCloseDate - dtCreatedOn) for Won opportunities
```

### 12.5 Lead Scoring (LeadScoringHelper.cs)

```
Base score calculation:
+10 = Has email
+10 = Has phone
+15 = Has company name
+10 = Has job title
+5  = Source is Referral
+3  = Source is Website
+20 = Status is Qualified
+10 = Status is Contacted
+5  = Has recent activity (last 7 days)
Score capped at 100
```

---

## 13. DI Registration (Program.cs)

```csharp
// Services
builder.Services.AddScoped<ILeadService, MstLeadService>();
builder.Services.AddScoped<IContactService, MstContactService>();
builder.Services.AddScoped<IAccountService, MstAccountService>();
builder.Services.AddScoped<IOpportunityService, MstOpportunityService>();
builder.Services.AddScoped<IPipelineService, MstPipelineService>();
builder.Services.AddScoped<IActivityService, MstActivityService>();
builder.Services.AddScoped<IDashboardService, MstDashboardService>();
builder.Services.AddScoped<ILeadConversionService, MstLeadConversionService>();
builder.Services.AddScoped<IAuditLogService, MstAuditLogService>();

// Application Services
builder.Services.AddScoped<IMstLeadApplicationService, MstLeadApplicationService>();
builder.Services.AddScoped<IMstContactApplicationService, MstContactApplicationService>();
builder.Services.AddScoped<IMstAccountApplicationService, MstAccountApplicationService>();
builder.Services.AddScoped<IMstOpportunityApplicationService, MstOpportunityApplicationService>();
builder.Services.AddScoped<IMstPipelineApplicationService, MstPipelineApplicationService>();
builder.Services.AddScoped<IMstActivityApplicationService, MstActivityApplicationService>();
builder.Services.AddScoped<IMstDashboardApplicationService, MstDashboardApplicationService>();
builder.Services.AddScoped<IMstLeadConversionApplicationService, MstLeadConversionApplicationService>();

// Repositories + UnitOfWork
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IMstLeadRepository, MstLeadRepository>();
builder.Services.AddScoped<IMstContactRepository, MstContactRepository>();
builder.Services.AddScoped<IMstAccountRepository, MstAccountRepository>();
builder.Services.AddScoped<IMstOpportunityRepository, MstOpportunityRepository>();
builder.Services.AddScoped<IMstOpportunityContactRepository, MstOpportunityContactRepository>();
builder.Services.AddScoped<IMstPipelineRepository, MstPipelineRepository>();
builder.Services.AddScoped<IMstPipelineStageRepository, MstPipelineStageRepository>();
builder.Services.AddScoped<IMstActivityRepository, MstActivityRepository>();
builder.Services.AddScoped<IMstActivityLinkRepository, MstActivityLinkRepository>();
builder.Services.AddScoped<IMstAuditLogRepository, MstAuditLogRepository>();

// Validators
builder.Services.AddValidatorsFromAssemblyContaining<LeadCreateDtoValidator>();

// AutoMapper
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// DbContext
builder.Services.AddDbContext<CrmDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Filters
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidateModelFilter>();
    options.Filters.Add<AuditLogFilter>();
});
```

---

## 14. Central-Backend Gateway Changes (3 files)

### 14.1 Config/ApiGatewayConfig.cs — ADD property
```csharp
public string CrmServiceBaseUrl { get; set; } = string.Empty;
```

### 14.2 Middleware/ApiGatewayMiddleware.cs — ADD routing block
```csharp
else if (path.StartsWith("/api/crm", StringComparison.OrdinalIgnoreCase)
         && !string.IsNullOrEmpty(_config.CrmServiceBaseUrl))
{
    await ForwardRequest(context, _config.CrmServiceBaseUrl, path);
    return;
}
```

### 14.3 appsettings.json — ADD CRM URL
```json
"ApiGateway": {
    "TaskServiceBaseUrl": "https://localhost:5006",
    "AccountingServiceBaseUrl": "https://localhost:7089",
    "CrmServiceBaseUrl": "https://localhost:5010"
}
```

---

## 15. Request Flow Example — Create Lead (Full Stack)

```
Frontend:
  1. User fills lead form → React Hook Form + Zod validation
  2. useCreateLead() mutation calls crmService.createLead(dto)
  3. Axios POST → /api/crm/leads (goes to central-backend :5000)

Central-Backend Gateway:
  4. ApiGatewayMiddleware matches /api/crm → forwards to :5010

CRM Backend:
  5. ExceptionHandlingMiddleware (catch all)
  6. TokenValidationMiddleware (validate JWT)
  7. TenantContextMiddleware (extract strGroupGUID)
  8. RequestLoggingMiddleware (log request)
  9. [AuthorizePermission("CRM_Leads", "Create")] → check permission
  10. [ValidateModelFilter] → FluentValidation on CreateLeadDto
  11. [TrimStrings] → trim whitespace
  12. LeadsController.Create(dto)
  13.   → IMstLeadApplicationService.CreateAsync(dto)
  14.     → Map DTO → Entity
  15.     → ILeadService.CalculateScore(entity) → LeadScoringHelper
  16.     → ILeadRepository.AddAsync(entity)
  17.     → IUnitOfWork.SaveChangesAsync()
  18.     → Map Entity → LeadDetailDto
  19. [AuditLogFilter] → write MstAuditLog
  20. Return ApiResponse<LeadDetailDto> with 201 Created

Frontend:
  21. onSuccess → toast.success("Lead created successfully")
  22. Invalidate lead query cache → auto-refetch list
```

---

## 16. Frontend — CRM Module in audit-frontend

### 16.1 New Files to Create

```
audit-frontend/src/
├── constants/
│   └── api-prefix.ts                    ← ADD: export const CRM_API_PREFIX = "/crm";
├── routes/
│   ├── route-config.tsx                 ← MODIFY: add getCrmRouteElement()
│   └── crm-routes.tsx                   ← NEW
├── types/
│   └── CRM/
│       ├── lead.ts
│       ├── contact.ts
│       ├── account.ts
│       ├── opportunity.ts
│       ├── pipeline.ts
│       ├── activity.ts
│       └── dashboard.ts
├── services/
│   └── CRM/
│       ├── lead.service.ts
│       ├── contact.service.ts
│       ├── account.service.ts
│       ├── opportunity.service.ts
│       ├── pipeline.service.ts
│       ├── activity.service.ts
│       └── dashboard.service.ts
├── hooks/
│   └── api/
│       └── CRM/
│           ├── use-leads.ts
│           ├── use-contacts.ts
│           ├── use-accounts.ts
│           ├── use-opportunities.ts
│           ├── use-pipelines.ts
│           ├── use-activities.ts
│           └── use-dashboard.ts
└── pages/
    └── CRM/
        ├── leads/
        │   ├── LeadList.tsx
        │   ├── LeadForm.tsx
        │   └── components/
        │       ├── LeadStatusBadge.tsx
        │       ├── LeadScoreBadge.tsx
        │       └── LeadConvertDialog.tsx
        ├── contacts/
        │   ├── ContactList.tsx
        │   ├── ContactForm.tsx
        │   └── components/
        │       └── ContactLifecycleBadge.tsx
        ├── accounts/
        │   ├── AccountList.tsx
        │   ├── AccountForm.tsx
        │   └── components/
        │       └── AccountSummaryCards.tsx
        ├── opportunities/
        │   ├── OpportunityList.tsx
        │   ├── OpportunityForm.tsx
        │   ├── OpportunityBoard.tsx          ← Kanban board view
        │   └── components/
        │       ├── OpportunityStageBadge.tsx
        │       ├── OpportunityRottingIndicator.tsx
        │       ├── OpportunityCloseDialog.tsx
        │       └── OpportunityContactManager.tsx
        ├── pipelines/
        │   ├── PipelineList.tsx
        │   ├── PipelineForm.tsx
        │   └── components/
        │       └── PipelineStageEditor.tsx
        ├── activities/
        │   ├── ActivityTimeline.tsx
        │   └── components/
        │       ├── ActivityForm.tsx
        │       └── ActivityTypeIcon.tsx
        ├── dashboard/
        │   ├── CrmDashboard.tsx
        │   └── components/
        │       ├── KpiCards.tsx
        │       ├── PipelineFunnel.tsx
        │       ├── LeadsBySourceChart.tsx
        │       ├── RevenueByMonthChart.tsx
        │       ├── TopOpportunities.tsx
        │       └── UpcomingActivities.tsx
        └── components/                       ← shared CRM components
            ├── EntityActivityPanel.tsx
            └── CrmBulkActionBar.tsx
```

### 16.2 Route Registration — crm-routes.tsx

```typescript
import React, { Suspense, lazy } from "react";
import PageLoader from "@/components/layout/page-loader";

const LeadList = lazy(() => import("@/pages/CRM/leads/LeadList"));
const LeadForm = lazy(() => import("@/pages/CRM/leads/LeadForm"));
const ContactList = lazy(() => import("@/pages/CRM/contacts/ContactList"));
const ContactForm = lazy(() => import("@/pages/CRM/contacts/ContactForm"));
const AccountList = lazy(() => import("@/pages/CRM/accounts/AccountList"));
const AccountForm = lazy(() => import("@/pages/CRM/accounts/AccountForm"));
const OpportunityList = lazy(() => import("@/pages/CRM/opportunities/OpportunityList"));
const OpportunityForm = lazy(() => import("@/pages/CRM/opportunities/OpportunityForm"));
const OpportunityBoard = lazy(() => import("@/pages/CRM/opportunities/OpportunityBoard"));
const PipelineList = lazy(() => import("@/pages/CRM/pipelines/PipelineList"));
const PipelineForm = lazy(() => import("@/pages/CRM/pipelines/PipelineForm"));
const ActivityTimeline = lazy(() => import("@/pages/CRM/activities/ActivityTimeline"));
const CrmDashboard = lazy(() => import("@/pages/CRM/dashboard/CrmDashboard"));

const wrapWithSuspense = (Component: React.ComponentType): React.ReactElement => (
  <Suspense fallback={<PageLoader />}><Component /></Suspense>
);

export const getCrmRouteElement = (mapKey: string): React.ReactElement | null => {
  const normalizedKey = mapKey.toLowerCase();
  switch (normalizedKey) {
    case "crm_lead_list":           return wrapWithSuspense(LeadList);
    case "crm_lead_form":           return wrapWithSuspense(LeadForm);
    case "crm_contact_list":        return wrapWithSuspense(ContactList);
    case "crm_contact_form":        return wrapWithSuspense(ContactForm);
    case "crm_account_list":        return wrapWithSuspense(AccountList);
    case "crm_account_form":        return wrapWithSuspense(AccountForm);
    case "crm_opportunity_list":    return wrapWithSuspense(OpportunityList);
    case "crm_opportunity_form":    return wrapWithSuspense(OpportunityForm);
    case "crm_opportunity_board":   return wrapWithSuspense(OpportunityBoard);
    case "crm_pipeline_list":       return wrapWithSuspense(PipelineList);
    case "crm_pipeline_form":       return wrapWithSuspense(PipelineForm);
    case "crm_activity_list":       return wrapWithSuspense(ActivityTimeline);
    case "crm_dashboard":           return wrapWithSuspense(CrmDashboard);
    default:                        return null;
  }
};
```

### 16.3 route-config.tsx — MODIFY (add CRM)

```typescript
import { getCrmRouteElement } from "./crm-routes";

export const getRouteElement = (mapKey: string, menuItem?: MenuItem): React.ReactElement => {
  const centralRoute = getCentralRouteElement(mapKey);
  if (centralRoute) return centralRoute;
  const taskRoute = getTaskRouteElement(mapKey);
  if (taskRoute) return taskRoute;
  const accountRoute = getAccountRouteElement(mapKey);
  if (accountRoute) return accountRoute;
  const crmRoute = getCrmRouteElement(mapKey);       // ← ADD
  if (crmRoute) return crmRoute;                     // ← ADD
  return menuItem ? <NotImplementedWrapper menuItem={menuItem} /> : wrapWithSuspense(NotFound);
};
```

### 16.4 api-prefix.ts — ADD

```typescript
export const TASK_API_PREFIX = "/task";
export const ACCOUNT_API_PREFIX = "/accounting";
export const CRM_API_PREFIX = "/crm";              // ← ADD
```

### 16.5 Sample Service — lead.service.ts

```typescript
import { ApiService } from "@/lib/api/api-service";
import { CRM_API_PREFIX } from "@/constants/api-prefix";
import type { BackendPagedResponse } from "@/types/common";
import type {
  CreateLeadDto, UpdateLeadDto, LeadListDto, LeadDetailDto,
  LeadFilterParams, LeadBulkArchiveDto
} from "@/types/CRM/lead";

export const leadService = {
  getLeads: async (params?: LeadFilterParams): Promise<BackendPagedResponse<LeadListDto[]>> =>
    ApiService.getWithMeta<BackendPagedResponse<LeadListDto[]>>(`${CRM_API_PREFIX}/leads`, params as Record<string, unknown>),

  getLead: async (id: string): Promise<LeadDetailDto> =>
    ApiService.get<LeadDetailDto>(`${CRM_API_PREFIX}/leads/${id}`),

  createLead: async (dto: CreateLeadDto): Promise<LeadDetailDto> =>
    ApiService.post<LeadDetailDto>(`${CRM_API_PREFIX}/leads`, dto),

  updateLead: async (id: string, dto: UpdateLeadDto): Promise<LeadDetailDto> =>
    ApiService.put<LeadDetailDto>(`${CRM_API_PREFIX}/leads/${id}`, dto),

  deleteLead: async (id: string): Promise<boolean> =>
    ApiService.delete<boolean>(`${CRM_API_PREFIX}/leads/${id}`),

  changeStatus: async (id: string, status: string): Promise<LeadDetailDto> =>
    ApiService.patch<LeadDetailDto>(`${CRM_API_PREFIX}/leads/${id}/status`, { strStatus: status }),

  bulkArchive: async (dto: LeadBulkArchiveDto): Promise<boolean> =>
    ApiService.post<boolean>(`${CRM_API_PREFIX}/leads/bulk-archive`, dto),

  bulkRestore: async (dto: LeadBulkArchiveDto): Promise<boolean> =>
    ApiService.post<boolean>(`${CRM_API_PREFIX}/leads/bulk-restore`, dto),
};
```

### 16.6 Sample Hook — use-leads.ts

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createQueryKeys, handleMutationError } from "@/hooks/api/common";
import { leadService } from "@/services/CRM/lead.service";
import type { CreateLeadDto, UpdateLeadDto, LeadFilterParams } from "@/types/CRM/lead";

export const leadQueryKeys = createQueryKeys("crm-leads");

export const useLeads = (params?: LeadFilterParams) =>
  useQuery({
    queryKey: leadQueryKeys.list(params || {}),
    queryFn: () => leadService.getLeads(params),
  });

export const useLead = (id?: string) =>
  useQuery({
    queryKey: leadQueryKeys.detail(id || ""),
    queryFn: () => leadService.getLead(id!),
    enabled: !!id,
  });

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLeadDto) => leadService.createLead(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success("Lead created successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to create lead"),
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLeadDto }) =>
      leadService.updateLead(id, dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success("Lead updated successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to update lead"),
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadService.deleteLead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: leadQueryKeys.all });
      toast.success("Lead deleted successfully");
    },
    onError: (error) => handleMutationError(error, "Failed to delete lead"),
  });
};
```

### 16.7 Sample Type — types/CRM/lead.ts

```typescript
export interface LeadListDto {
  strLeadGUID: string;
  strFirstName: string;
  strLastName: string;
  strEmail: string;
  strPhone?: string | null;
  strCompanyName?: string | null;
  strSource: string;
  strStatus: string;
  intLeadScore: number;
  strAssignedToGUID?: string | null;
  strAssignedToName?: string | null;
  dtCreatedOn: string;
  bolIsActive: boolean;
}

export interface LeadDetailDto extends LeadListDto {
  strJobTitle?: string | null;
  strAddress?: string | null;
  strCity?: string | null;
  strState?: string | null;
  strCountry?: string | null;
  strPostalCode?: string | null;
  strNotes?: string | null;
  strConvertedAccountGUID?: string | null;
  strConvertedContactGUID?: string | null;
  strConvertedOpportunityGUID?: string | null;
  dtConvertedOn?: string | null;
  strCreatedByName: string;
  dtUpdatedOn?: string | null;
  recentActivities: ActivityListDto[];
}

export interface CreateLeadDto {
  strFirstName: string;
  strLastName: string;
  strEmail: string;
  strPhone?: string | null;
  strCompanyName?: string | null;
  strJobTitle?: string | null;
  strSource: string;
  strAddress?: string | null;
  strCity?: string | null;
  strState?: string | null;
  strCountry?: string | null;
  strPostalCode?: string | null;
  strNotes?: string | null;
  strAssignedToGUID?: string | null;
}

export interface UpdateLeadDto extends CreateLeadDto {
  strStatus: string;
}

export interface LeadFilterParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  ascending?: boolean;
  bolIsActive?: boolean;
  strStatus?: string;
  strSource?: string;
  strAssignedToGUID?: string;
  dtFromDate?: string;
  dtToDate?: string;
  intMinScore?: number;
  intMaxScore?: number;
}

export interface LeadBulkArchiveDto {
  guids: string[];
}

export interface ConvertLeadDto {
  strLeadGUID: string;
  bolCreateAccount: boolean;
  bolCreateOpportunity: boolean;
  strExistingAccountGUID?: string | null;
  strOpportunityName?: string | null;
  strPipelineGUID?: string | null;
  dblAmount?: number | null;
}

export interface LeadConversionResultDto {
  strLeadGUID: string;
  strContactGUID: string;
  strAccountGUID?: string | null;
  strOpportunityGUID?: string | null;
  strMessage: string;
}
```

---

## 17. Tech Stack Summary

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| .NET | 8 | Runtime |
| EF Core | 9 | ORM (SQL Server) |
| FluentValidation | latest | DTO validation |
| AutoMapper | latest | Entity ↔ DTO mapping |
| Serilog | latest | Structured logging |
| SignalR | built-in | Real-time notifications |
| Swashbuckle | latest | Swagger/OpenAPI |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| Vite | 6.x | Build tool |
| TanStack Query | 5 | Server state management |
| React Router | 7 | Routing |
| React Hook Form + Zod | latest | Form validation |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui (Radix) | latest | UI components |
| Jotai | latest | Client state |
| Axios | latest | HTTP client |
| Recharts | latest | Dashboard charts |
| Sonner | latest | Toast notifications |
| Lucide | latest | Icons |

---

## 18. appsettings.json — CRM Backend

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=CrmDb;Trusted_Connection=true;TrustServerCertificate=true;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Issuer": "EasyAudit",
    "Audience": "EasyAuditUsers",
    "SecretKey": "<<SAME_KEY_AS_CENTRAL_BACKEND>>",
    "AccessTokenExpirationMinutes": 15
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173"]
  },
  "RateLimiting": {
    "PermitLimit": 100,
    "WindowInSeconds": 60
  },
  "Serilog": {
    "MinimumLevel": "Information",
    "WriteTo": [
      { "Name": "Console" },
      { "Name": "File", "Args": { "path": "Logs/crm-.log", "rollingInterval": "Day" } }
    ]
  },
  "Kestrel": {
    "Endpoints": {
      "Https": { "Url": "https://localhost:5010" }
    }
  }
}
```

---

## 19. Default Pipeline Seed Data

```sql
-- seed-default-pipeline.sql
-- Run once per tenant on first setup

DECLARE @PipelineGUID UNIQUEIDENTIFIER = NEWID();
DECLARE @GroupGUID UNIQUEIDENTIFIER = '<<TENANT_GROUP_GUID>>';

INSERT INTO MstPipelines (strPipelineGUID, strGroupGUID, strPipelineName, strDescription, bolIsDefault, strCreatedByGUID, dtCreatedOn, bolIsActive, bolIsDeleted)
VALUES (@PipelineGUID, @GroupGUID, 'Sales Pipeline', 'Default sales pipeline', 1, @GroupGUID, GETUTCDATE(), 1, 0);

INSERT INTO MstPipelineStages (strStageGUID, strPipelineGUID, strStageName, intDisplayOrder, intProbabilityPercent, intDefaultDaysToRot, bolIsWonStage, bolIsLostStage, dtCreatedOn, bolIsActive)
VALUES
  (NEWID(), @PipelineGUID, 'Prospecting',    1, 10, 14, 0, 0, GETUTCDATE(), 1),
  (NEWID(), @PipelineGUID, 'Qualification',  2, 25, 21, 0, 0, GETUTCDATE(), 1),
  (NEWID(), @PipelineGUID, 'Proposal',       3, 50, 30, 0, 0, GETUTCDATE(), 1),
  (NEWID(), @PipelineGUID, 'Negotiation',    4, 75, 14, 0, 0, GETUTCDATE(), 1),
  (NEWID(), @PipelineGUID, 'Closed Won',     5, 100, 0, 1, 0, GETUTCDATE(), 1),
  (NEWID(), @PipelineGUID, 'Closed Lost',    6, 0,   0, 0, 1, GETUTCDATE(), 1);
```

---

## 20. File Count Summary

| Area | Files |
|------|-------|
| Backend — Controllers | 10 |
| Backend — ApplicationServices | 9 + 9 interfaces + 1 base = 19 |
| Backend — Services | 10 (9 + ServiceBase) |
| Backend — DataAccess | 11 repos + 11 interfaces + UnitOfWork = 23 |
| Backend — Models | 10 entities + 1 interface + 4 external + 3 wrappers = 18 |
| Backend — DTOs | 13 |
| Backend — Constants | 11 |
| Backend — Middleware | 5 |
| Backend — Filters | 3 |
| Backend — Attributes | 4 |
| Backend — Validators | 10 |
| Backend — Extensions | 7 |
| Backend — Helpers | 4 |
| Backend — Config | 3 |
| Backend — Exceptions | 3 |
| Backend — Hubs | 1 |
| Backend — Other (Program, appsettings, csproj, etc.) | 5 |
| **Backend Total** | **~148 files** |
| Frontend — Types | 7 |
| Frontend — Services | 7 |
| Frontend — Hooks | 7 |
| Frontend — Pages + Components | ~35 |
| Frontend — Routes | 2 (1 new + 1 modify) |
| **Frontend Total** | **~58 files** |
| Central-Backend Changes | 3 files modified |
| **Grand Total** | **~209 files** |

---

**END OF DOCUMENT**
