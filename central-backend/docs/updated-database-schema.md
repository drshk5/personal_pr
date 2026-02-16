# Task Tracker Database Schema Documentation (Updated with Year Management)

This document provides a comprehensive overview of the database schema used in the Task Tracker application, including the new year management functionality.

## Naming Conventions

The following naming conventions are used throughout the database:

1. **Table Prefixes**:

   - `mst`: Master/reference tables
   - `trn`: Transaction tables

2. **Column Naming**:

   - `str`: String fields (varchar, nvarchar)
   - `dt`: Date and time fields
   - `int`: Integer fields
   - `dbl`: Double/float fields
   - `bol`: Boolean fields
   - `GUID`: Globally Unique Identifiers

3. **Primary Keys**:

   - Most tables use `strGUID` or `[TableName]GUID` as the primary key

4. **Foreign Keys**:

   - Reference the primary key of the related table with the suffix `GUID`

5. **Common Audit Fields**:
   - `strCreatedByGUID`: User who created the record
   - `dtCreatedOn`: Creation timestamp
   - `strUpdatedByGUID`: User who last updated the record
   - `dtUpdatedOn`: Last update timestamp

## Database Tables

### Authentication & Authorization Tables

#### MstUsers (Updated)

**Purpose**: Stores user accounts and authentication information.

| Column                  | Type             | Description                  |
| ----------------------- | ---------------- | ---------------------------- |
| strGUID                 | nvarchar(450)    | Primary key                  |
| strName                 | nvarchar(max)    | User's full name             |
| dtBirthDate             | datetime2(7)     | User's birth date            |
| strMobileNo             | nvarchar(450)    | Mobile phone number (unique) |
| strPassword             | nvarchar(max)    | Password (hashed)            |
| strEmailId              | nvarchar(450)    | Email address (unique)       |
| bolIsActive             | bit              | Active status flag           |
| dtWorkingStartTime      | time(7)          | Working hours start          |
| dtWorkingEndTime        | time(7)          | Working hours end            |
| bolIsSuperAdmin         | bit              | Super admin flag             |
| strGroupGUID            | nvarchar(max)    | Associated company           |
| dtCreatedOn             | datetime2(7)     | Creation timestamp           |
| dtUpdatedOn             | datetime2(7)     | Last update timestamp        |
| strLastOrganizationGUID | nvarchar(max)    | Last accessed organization   |
| **strLastYearGUID**     | **nvarchar(50)** | **Last accessed year (NEW)** |
| dtOTPExpiry             | datetime2(7)     | OTP expiration time          |
| strOTP                  | nvarchar(6)      | One-time password            |
| strCreatedByGUID        | nvarchar(50)     | User who created record      |
| strUpdatedByGUID        | nvarchar(50)     | User who last updated record |

#### mstUserRoles

**Purpose**: Defines system roles.

| Column           | Type          | Description                  |
| ---------------- | ------------- | ---------------------------- |
| strGUID          | nvarchar(36)  | Primary key                  |
| strName          | nvarchar(100) | Role name                    |
| strDesc          | nvarchar(500) | Role description             |
| bolIsActive      | bit           | Active status flag           |
| dtCreatedOn      | datetime2(7)  | Creation timestamp           |
| strCreatedByGUID | nvarchar(36)  | User who created record      |
| dtUpdatedOn      | datetime2(7)  | Last update timestamp        |
| strUpdatedByGUID | nvarchar(36)  | User who last updated record |
| strGroupGUID     | nvarchar(36)  | Associated company           |

#### MstUserRights

**Purpose**: Defines permissions for user roles on specific menus.

| Column           | Type             | Description                 |
| ---------------- | ---------------- | --------------------------- |
| strUserRightGUID | nvarchar(450)    | Primary key                 |
| strUserRoleGUID  | nvarchar(36)     | Foreign key to mstUserRoles |
| strMenuGUID      | uniqueidentifier | Foreign key to MstMenu      |
| bolCanView       | bit              | View permission             |
| bolCanEdit       | bit              | Edit permission             |
| bolCanSave       | bit              | Save permission             |
| bolCanDelete     | bit              | Delete permission           |
| bolCanPrint      | bit              | Print permission            |
| bolCanExport     | bit              | Export permission           |

#### MstUserDetails (Updated)

**Purpose**: Maps users to organizations with specific roles and years.

| Column              | Type             | Description                      |
| ------------------- | ---------------- | -------------------------------- |
| strUserDetailGUID   | nvarchar(450)    | Primary key                      |
| strUserGUID         | nvarchar(450)    | Foreign key to MstUsers          |
| strOrganizationGUID | nvarchar(450)    | Foreign key to mstOrganization   |
| strUserRoleGUID     | nvarchar(max)    | Foreign key to mstUserRoles      |
| strGroupGUID        | nvarchar(max)    | Foreign key to mstGroup          |
| **strYearGUID**     | **nvarchar(50)** | **Foreign key to mstYear (NEW)** |
| bolIsActive         | bit              | Active status flag               |
| strCreatedByGUID    | nvarchar(50)     | User who created record          |
| dtCreatedOn         | datetime2(7)     | Creation timestamp               |
| strUpdatedByGUID    | nvarchar(50)     | User who last updated record     |
| dtUpdatedOn         | datetime2(7)     | Last update timestamp            |

#### RefreshTokens

**Purpose**: Manages JWT refresh tokens for authentication.

| Column     | Type          | Description                    |
| ---------- | ------------- | ------------------------------ |
| Token      | nvarchar(450) | Primary key (refresh token)    |
| JwtId      | nvarchar(max) | Associated JWT token ID        |
| AddedDate  | datetime2(7)  | Token creation timestamp       |
| ExpiryDate | datetime2(7)  | Token expiration timestamp     |
| IsUsed     | bit           | Whether token has been used    |
| IsRevoked  | bit           | Whether token has been revoked |
| UserGUID   | nvarchar(450) | Foreign key to MstUsers        |

### Navigation & Menu Tables

#### MstMenu

**Purpose**: Defines application menu structure and navigation.

| Column              | Type             | Description                            |
| ------------------- | ---------------- | -------------------------------------- |
| strMenuGUID         | uniqueidentifier | Primary key                            |
| strParentMenuGUID   | uniqueidentifier | Parent menu reference (self-reference) |
| strMapKey           | nvarchar(100)    | Mapping key                            |
| dblSeqNo            | float            | Sequence/order number                  |
| strName             | nvarchar(100)    | Menu name                              |
| strPath             | nvarchar(255)    | Menu path/route                        |
| strMenuPosition     | nvarchar(50)     | Position in UI (e.g., top, side)       |
| bolHasSubMenu       | bit              | Has children flag                      |
| strIconName         | nvarchar(50)     | Icon reference                         |
| bolIsActive         | bit              | Active status flag                     |
| bolSuperAdminAccess | bit              | Super admin access flag                |

### Organization Tables

#### mstGroup

**Purpose**: Stores company information.

| Column             | Type             | Description                  |
| ------------------ | ---------------- | ---------------------------- |
| strGUID            | uniqueidentifier | Primary key                  |
| strName            | nvarchar(100)    | Company name                 |
| strLicenseNo       | nvarchar(50)     | License number               |
| strPAN             | nvarchar(20)     | PAN number (unique)          |
| strTAN             | nvarchar(20)     | TAN number                   |
| strCIN             | nvarchar(50)     | CIN number                   |
| dtLicenseIssueDate | datetime2(7)     | License issue date           |
| dtLicenseExpired   | datetime2(7)     | License expiration date      |
| strLogo            | nvarchar(255)    | Company logo URL             |
| strCreatedByGUID   | nvarchar(50)     | User who created record      |
| dtCreatedOn        | datetime2(7)     | Creation timestamp           |
| strUpdatedByGUID   | nvarchar(50)     | User who last updated record |
| dtUpdatedOn        | datetime2(7)     | Last update timestamp        |

#### mstOrganization

**Purpose**: Stores organization information, enabling multi-level organization structure.

| Column                    | Type          | Description                        |
| ------------------------- | ------------- | ---------------------------------- |
| strOrganizationGUID       | nvarchar(450) | Primary key                        |
| strOrganizationName       | nvarchar(100) | Organization name                  |
| strDescription            | nvarchar(500) | Organization description           |
| strPAN                    | nvarchar(10)  | PAN number (unique)                |
| strTAN                    | nvarchar(10)  | TAN number                         |
| strCIN                    | nvarchar(21)  | CIN number                         |
| strParentOrganizationGUID | nvarchar(max) | Parent organization reference      |
| bolIsActive               | bit           | Active status flag                 |
| strIndustryCode_PL        | nvarchar(50)  | Industry code (picklist)           |
| strUDFCode_PL             | nvarchar(50)  | User-defined field code (picklist) |
| strLegalStatusCode_PL     | nvarchar(50)  | Legal status code (picklist)       |
| dtClientAcquiredDate      | datetime2(7)  | Client acquisition date            |
| strGroupGUID              | nvarchar(450) | Foreign key to mstGroup            |
| strCreatedByGUID          | nvarchar(max) | User who created record            |
| dtCreatedOn               | datetime2(7)  | Creation timestamp                 |
| strUpdatedByGUID          | nvarchar(max) | User who last updated record       |
| dtUpdatedOn               | datetime2(7)  | Last update timestamp              |

### Year Management Table (NEW)

#### mstYear

**Purpose**: Manages financial/operational years for organizations.

| Column              | Type             | Description                              |
| ------------------- | ---------------- | ---------------------------------------- |
| strYearGUID         | uniqueidentifier | Primary key                              |
| strOrganizationGUID | uniqueidentifier | Foreign key to mstOrganization           |
| strName             | nvarchar(100)    | Year name (e.g., "FY 2023-24")           |
| dtStartDate         | datetime2(7)     | Year start date                          |
| dtEndDate           | datetime2(7)     | Year end date                            |
| bolIsActive         | bit              | Whether year is active for use           |
| strPreviousYearGUID | uniqueidentifier | Previous year reference (self-reference) |
| strNextYearGUID     | uniqueidentifier | Next year reference (self-reference)     |
| strCurrency_PL      | nvarchar(50)     | Default currency for the year (picklist) |
| strGroupGUID        | uniqueidentifier | Foreign key to mstGroup                  |
| strCreatedByGUID    | uniqueidentifier | User who created record                  |
| dtCreatedOn         | datetime2(7)     | Creation timestamp                       |
| strUpdatedByGUID    | uniqueidentifier | User who last updated record             |
| dtUpdatedOn         | datetime2(7)     | Last update timestamp                    |

### Picklist Tables (Reference Data)

#### MstPicklistTypes

**Purpose**: Defines types of picklists for dropdown and selection lists.

| Column         | Type             | Description                  |
| -------------- | ---------------- | ---------------------------- |
| strGUID        | uniqueidentifier | Primary key                  |
| strType        | nvarchar(450)    | Picklist type name           |
| strDescription | nvarchar(max)    | Type description             |
| strGroupGUID   | uniqueidentifier | Foreign key to mstGroup      |
| bolIsActive    | bit              | Active status flag           |
| strCreatedBy   | uniqueidentifier | User who created record      |
| dtCreatedOn    | datetime2(7)     | Creation timestamp           |
| strUpdatedBy   | uniqueidentifier | User who last updated record |
| dtUpdatedOn    | datetime2(7)     | Last update timestamp        |

#### MstPickListValues

**Purpose**: Stores values for picklists.

| Column              | Type             | Description                          |
| ------------------- | ---------------- | ------------------------------------ |
| strGUID             | uniqueidentifier | Primary key                          |
| strValue            | nvarchar(450)    | Picklist value                       |
| strPicklistTypeGUID | uniqueidentifier | Foreign key to MstPicklistTypes      |
| bolIsActive         | bit              | Active status flag                   |
| strColor            | nvarchar(20)     | Color code for visual representation |
| intDisplayOrder     | int              | Display ordering                     |
| strGroupGUID        | uniqueidentifier | Foreign key to mstGroup              |
| strCreatedByGUID    | uniqueidentifier | User who created record              |
| dtCreatedOn         | datetime2(7)     | Creation timestamp                   |
| strUpdatedByGUID    | uniqueidentifier | User who last updated record         |
| dtUpdatedOn         | datetime2(7)     | Last update timestamp                |

## Task Tables (Updated with Year Management)

### trnTask (Updated)

**Purpose**: Stores task information with year association.

| Column               | Type                 | Description                                 |
| -------------------- | -------------------- | ------------------------------------------- |
| strTaskGUID          | uniqueidentifier     | Primary key                                 |
| strTitle             | nvarchar(200)        | Task title                                  |
| strDescription       | nvarchar(max)        | Task description                            |
| strTaskNumber        | nvarchar(50)         | Auto-generated task reference number        |
| strStatus_PL         | uniqueidentifier     | Foreign key to MstPickListValues (status)   |
| strPriority_PL       | uniqueidentifier     | Foreign key to MstPickListValues (priority) |
| strAssignedToGUID    | nvarchar(450)        | Foreign key to MstUsers (assignee)          |
| strAssignedByGUID    | nvarchar(450)        | Foreign key to MstUsers (assigner)          |
| strOrganizationGUID  | nvarchar(450)        | Foreign key to mstOrganization              |
| **strYearGUID**      | **uniqueidentifier** | **Foreign key to mstYear (NEW)**            |
| strParentTaskGUID    | uniqueidentifier     | Parent task reference (self-reference)      |
| intLevel             | int                  | Hierarchy level (0=root, 1=subtask, etc.)   |
| dtStartDate          | datetime2(7)         | Task start date                             |
| dtDueDate            | datetime2(7)         | Task due date                               |
| dtCompletedDate      | datetime2(7)         | Task completion date                        |
| dblEstimatedHours    | float                | Estimated hours                             |
| dblActualHours       | float                | Actual hours spent                          |
| bolIsRecurring       | bit                  | Recurring task flag                         |
| strRecurrencePattern | nvarchar(100)        | Recurrence pattern (if recurring)           |
| strCategoryCode_PL   | nvarchar(50)         | Category code (picklist)                    |
| strTags              | nvarchar(max)        | JSON array of tags                          |
| intAttachmentCount   | int                  | Number of attachments                       |
| intCommentCount      | int                  | Number of comments                          |
| strGroupGUID         | uniqueidentifier     | Foreign key to mstGroup                     |
| strCreatedByGUID     | nvarchar(450)        | User who created record                     |
| dtCreatedOn          | datetime2(7)         | Creation timestamp                          |
| strUpdatedByGUID     | nvarchar(450)        | User who last updated record                |
| dtUpdatedOn          | datetime2(7)         | Last update timestamp                       |

### trnTaskComment

**Purpose**: Stores comments on tasks.

| Column               | Type             | Description                               |
| -------------------- | ---------------- | ----------------------------------------- |
| strCommentGUID       | uniqueidentifier | Primary key                               |
| strTaskGUID          | uniqueidentifier | Foreign key to trnTask                    |
| strUserGUID          | nvarchar(450)    | Foreign key to MstUsers (commenter)       |
| strContent           | nvarchar(max)    | Comment content                           |
| strMentions          | nvarchar(max)    | JSON array of mentioned user GUIDs        |
| strParentCommentGUID | uniqueidentifier | Parent comment reference (self-reference) |
| strGroupGUID         | uniqueidentifier | Foreign key to mstGroup                   |
| strCreatedByGUID     | nvarchar(450)    | User who created record                   |
| dtCreatedOn          | datetime2(7)     | Creation timestamp                        |
| strUpdatedByGUID     | nvarchar(450)    | User who last updated record              |
| dtUpdatedOn          | datetime2(7)     | Last update timestamp                     |

### trnTaskAttachment

**Purpose**: Stores file attachments for tasks.

| Column            | Type             | Description                  |
| ----------------- | ---------------- | ---------------------------- |
| strAttachmentGUID | uniqueidentifier | Primary key                  |
| strTaskGUID       | uniqueidentifier | Foreign key to trnTask       |
| strFileName       | nvarchar(255)    | Original file name           |
| intFileSize       | int              | File size in bytes           |
| strFileType       | nvarchar(100)    | MIME type                    |
| strFilePath       | nvarchar(500)    | Storage path                 |
| strThumbnailPath  | nvarchar(500)    | Thumbnail path (if image)    |
| strGroupGUID      | uniqueidentifier | Foreign key to mstGroup      |
| strCreatedByGUID  | nvarchar(450)    | User who created record      |
| dtCreatedOn       | datetime2(7)     | Creation timestamp           |
| strUpdatedByGUID  | nvarchar(450)    | User who last updated record |
| dtUpdatedOn       | datetime2(7)     | Last update timestamp        |

### trnTaskHistory

**Purpose**: Records task activity history.

| Column             | Type             | Description                                           |
| ------------------ | ---------------- | ----------------------------------------------------- |
| strHistoryGUID     | uniqueidentifier | Primary key                                           |
| strTaskGUID        | uniqueidentifier | Foreign key to trnTask                                |
| strActivityType_PL | nvarchar(50)     | Activity type (Created, Updated, StatusChanged, etc.) |
| strFieldName       | nvarchar(100)    | Field name that changed (if applicable)               |
| strOldValue        | nvarchar(max)    | Previous value (for changes)                          |
| strNewValue        | nvarchar(max)    | New value (for changes)                               |
| strUserGUID        | nvarchar(450)    | Foreign key to MstUsers (who made the change)         |
| strGroupGUID       | uniqueidentifier | Foreign key to mstGroup                               |
| dtCreatedOn        | datetime2(7)     | Creation timestamp                                    |

### trnNotification (Updated)

**Purpose**: Stores user notifications with year context.

| Column               | Type                 | Description                         |
| -------------------- | -------------------- | ----------------------------------- |
| strNotificationGUID  | uniqueidentifier     | Primary key                         |
| strUserGUID          | nvarchar(450)        | Foreign key to MstUsers (recipient) |
| strType_PL           | nvarchar(50)         | Notification type                   |
| strTitle             | nvarchar(200)        | Notification title                  |
| strMessage           | nvarchar(500)        | Notification message                |
| strRelatedEntityGUID | uniqueidentifier     | Related entity ID                   |
| strRelatedEntityType | nvarchar(50)         | Related entity type                 |
| **strYearGUID**      | **uniqueidentifier** | **Foreign key to mstYear (NEW)**    |
| bolIsRead            | bit                  | Read status                         |
| dtReadOn             | datetime2(7)         | When notification was read          |
| strGroupGUID         | uniqueidentifier     | Foreign key to mstGroup             |
| strCreatedByGUID     | nvarchar(450)        | User who created record             |
| dtCreatedOn          | datetime2(7)         | Creation timestamp                  |

## Key Database Constraints

### Primary Keys

- Most tables use a uniqueidentifier or nvarchar column with `GUID` suffix as their primary key

### Foreign Keys

- `MstMenu.strParentMenuGUID` → `MstMenu.strMenuGUID` (self-reference)
- `MstPickListValues.strGroupGUID` → `mstGroup.strGUID`
- `MstPickListValues.strPicklistTypeGUID` → `MstPicklistTypes.strGUID`
- `MstUserRights.strMenuGUID` → `MstMenu.strMenuGUID`
- `MstUserRights.strUserRoleGUID` → `mstUserRoles.strGUID`
- `RefreshTokens.UserGUID` → `MstUsers.strGUID`
- `mstYear.strOrganizationGUID` → `mstOrganization.strOrganizationGUID`
- `mstYear.strGroupGUID` → `mstGroup.strGUID`
- `mstYear.strPreviousYearGUID` → `mstYear.strYearGUID` (self-reference)
- `mstYear.strNextYearGUID` → `mstYear.strYearGUID` (self-reference)
- `MstUserDetails.strYearGUID` → `mstYear.strYearGUID`
- `trnTask.strYearGUID` → `mstYear.strYearGUID`
- `trnTask.strParentTaskGUID` → `trnTask.strTaskGUID` (self-reference)
- `trnTask.strStatus_PL` → `MstPickListValues.strGUID`
- `trnTask.strPriority_PL` → `MstPickListValues.strGUID`
- `trnNotification.strYearGUID` → `mstYear.strYearGUID`

### Unique Constraints

- `mstGroup.strPAN`
- `MstMenu.strPath`
- `MstMenu.strParentMenuGUID, MstMenu.strName`
- `mstOrganization.strOrganizationName, mstOrganization.strGroupGUID`
- `mstOrganization.strPAN`
- `MstPicklistTypes.strType, MstPicklistTypes.strGroupGUID`
- `MstPickListValues.strPicklistTypeGUID, MstPickListValues.strValue, MstPickListValues.strGroupGUID`
- `MstUserDetails.strUserGUID, MstUserDetails.strOrganizationGUID, MstUserDetails.strYearGUID`
- `MstUserRights.strUserRoleGUID, MstUserRights.strMenuGUID`
- `mstUserRoles.strName, mstUserRoles.strGroupGUID`
- `MstUsers.strEmailId`
- `MstUsers.strMobileNo`
- `mstYear.strOrganizationGUID, mstYear.strName`

## Data Flow

Data in this database follows these general patterns:

1. **Company & Organization**: mstGroup → mstOrganization → mstYear
2. **User Management**: MstUsers → MstUserDetails → mstUserRoles → MstUserRights
3. **Navigation**: MstMenu hierarchical structure with parent-child relationships
4. **Task Management**: trnTask → (trnTaskComment, trnTaskAttachment, trnTaskHistory)
5. **Reference Data**: MstPicklistTypes → MstPickListValues (for various dropdowns)
6. **Year Context**: All transaction data is now scoped by year through strYearGUID

## Year Management Implementation Details

### Year Scoping

The addition of year management allows for:

1. **Financial Year Segregation**: Tasks and data can be organized by financial/operational years
2. **Year-based Access Control**: Users can be granted access to specific years through MstUserDetails
3. **Historical Data Preservation**: Previous years can be marked as inactive (bolIsActive = false) to prevent modifications
4. **Year Transition**: strPreviousYearGUID and strNextYearGUID support seamless year transitions
5. **Currency Management**: Each year can have its default currency setting

### Implementation Considerations

1. **User Context**:

   - Users maintain their last accessed year in strLastYearGUID
   - User details specify which years they have access to per organization

2. **Task Management**:

   - Tasks are now associated with specific years
   - Task numbers can include year references (e.g., "TASK-2024-001")
   - Year transitions may require task migration workflows

3. **Data Integrity**:

   - Ensure tasks cannot be created for locked years
   - Validate date ranges against year start/end dates
   - Handle year-end closing procedures

4. **Reporting**:
   - All reports should be year-aware
   - Cross-year comparisons require special handling
   - Year-to-date calculations use year boundaries

## Database Schema Diagram (Updated)

```
┌────────────┐     ┌───────────┐     ┌────────────┐     ┌────────────┐
│ mstGroup │1───∞│ mstOrgan- │1───∞│  mstYear   │     │MstUserDet- │
│            │     │  ization  │     │            │∞───1│    ails    │
└────────────┘     └───────────┘     └────────────┘     └────────────┘
      │1                                    │1                  │∞
      │                                     │                   │
      │∞                                    │∞                  │1
┌────────────┐     ┌───────────┐     ┌────────────┐     ┌────────────┐
│MstPicklist-│1───∞│MstPickList│     │  trnTask   │     │  MstUsers  │
│   Types    │     │  Values   │     │            │     └────────────┘
└────────────┘     └───────────┘     └────────────┘           │1
                                           │1                   │
                                           │                    │∞
┌────────────┐     ┌───────────┐          │              ┌────────────┐
│mstUserRoles│1───∞│MstUserRig-│          │              │RefreshToke-│
│            │     │   hts     │          │              │     ns     │
└────────────┘     └───────────┘          │              └────────────┘
      │∞                 │∞                │
      │                  │                 │
      │                  │1                │∞
      │               ┌────────────┐  ┌────────────┐
      │               │  MstMenu   │  │trnNotifica-│
      │               └────────────┘  │    tion    │
      │                     │1        └────────────┘
      │                     │
      │                     │∞
      │               ┌────────────┐
      │               │  MstMenu   │(Self-reference)
      │               └────────────┘
      │
      │              Task Management Tables
      │
      │∞         ┌───────────┐     ┌────────────┐     ┌────────────┐
      └────────► │  trnTask  │1───∞│trnTaskCom- │     │trnTaskAtta-│
                 │           │     │   ment     │     │  chment    │
                 └───────────┘     └────────────┘     └────────────┘
                      │1
                      │
                      │∞
                 ┌────────────┐
                 │trnTaskHis- │
                 │   tory     │
                 └────────────┘
```

## Database Design Considerations (Updated)

1. **Year Management**:

   - All transactional data is now year-scoped
   - Year transitions require careful planning
   - Historical data integrity through year locking

2. **Multi-tenancy Enhancement**:

   - Company → Organization → Year hierarchy
   - Year-based data segregation
   - User access controlled at year level

3. **Performance Considerations**:

   - Index on strYearGUID for all transaction tables
   - Partitioning strategy may be based on years
   - Archive older years for performance

4. **Business Logic**:
   - Validate all dates against year boundaries
   - Implement year-end closing procedures
   - Handle cross-year task dependencies

---

This documentation reflects the database schema with year management functionality as of the latest update.
