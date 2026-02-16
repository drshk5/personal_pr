# Task Tracker Database Schema Documentation (Updated with Consistent Naming)

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

   - All tables use `[TableName]GUID` as the primary key (e.g., strUserGUID, strTaskGUID)

4. **Foreign Keys**:

   - Reference the primary key of the related table with the suffix `GUID`

5. **Common Audit Fields**:
   - `strCreatedByGUID`: User who created the record
   - `dtCreatedOn`: Creation timestamp
   - `strUpdatedByGUID`: User who last updated the record
   - `dtUpdatedOn`: Last update timestamp

## Database Tables

### Authentication & Authorization Tables

#### MstUsers (Updated Primary Key)

**Purpose**: Stores user accounts and authentication information.

| Column                  | Type          | Description                  |
| ----------------------- | ------------- | ---------------------------- |
| **strUserGUID**         | nvarchar(450) | Primary key                  |
| strName                 | nvarchar(max) | User's full name             |
| dtBirthDate             | datetime2(7)  | User's birth date            |
| strMobileNo             | nvarchar(450) | Mobile phone number (unique) |
| strPassword             | nvarchar(max) | Password (hashed)            |
| strEmailId              | nvarchar(450) | Email address (unique)       |
| bolIsActive             | bit           | Active status flag           |
| dtWorkingStartTime      | time(7)       | Working hours start          |
| dtWorkingEndTime        | time(7)       | Working hours end            |
| bolIsSuperAdmin         | bit           | Super admin flag             |
| strGroupGUID            | nvarchar(max) | Associated company           |
| dtCreatedOn             | datetime2(7)  | Creation timestamp           |
| dtUpdatedOn             | datetime2(7)  | Last update timestamp        |
| strLastOrganizationGUID | nvarchar(max) | Last accessed organization   |
| strLastYearGUID         | nvarchar(50)  | Last accessed year           |
| dtOTPExpiry             | datetime2(7)  | OTP expiration time          |
| strOTP                  | nvarchar(6)   | One-time password            |
| strCreatedByGUID        | nvarchar(50)  | User who created record      |
| strUpdatedByGUID        | nvarchar(50)  | User who last updated record |

#### mstUserRoles (Updated Primary Key)

**Purpose**: Defines system roles.

| Column              | Type          | Description                  |
| ------------------- | ------------- | ---------------------------- |
| **strUserRoleGUID** | nvarchar(36)  | Primary key                  |
| strName             | nvarchar(100) | Role name                    |
| strDesc             | nvarchar(500) | Role description             |
| bolIsActive         | bit           | Active status flag           |
| dtCreatedOn         | datetime2(7)  | Creation timestamp           |
| strCreatedByGUID    | nvarchar(36)  | User who created record      |
| dtUpdatedOn         | datetime2(7)  | Last update timestamp        |
| strUpdatedByGUID    | nvarchar(36)  | User who last updated record |
| strGroupGUID        | nvarchar(36)  | Associated company           |

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

#### MstUserDetails

**Purpose**: Maps users to organizations with specific roles and years.

| Column              | Type          | Description                    |
| ------------------- | ------------- | ------------------------------ |
| strUserDetailGUID   | nvarchar(450) | Primary key                    |
| strUserGUID         | nvarchar(450) | Foreign key to MstUsers        |
| strOrganizationGUID | nvarchar(450) | Foreign key to mstOrganization |
| strUserRoleGUID     | nvarchar(max) | Foreign key to mstUserRoles    |
| strGroupGUID        | nvarchar(max) | Foreign key to mstGroup        |
| strYearGUID         | nvarchar(50)  | Foreign key to mstYear         |
| bolIsActive         | bit           | Active status flag             |
| strCreatedByGUID    | nvarchar(50)  | User who created record        |
| dtCreatedOn         | datetime2(7)  | Creation timestamp             |
| strUpdatedByGUID    | nvarchar(50)  | User who last updated record   |
| dtUpdatedOn         | datetime2(7)  | Last update timestamp          |

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

#### mstGroup (Updated Primary Key)

**Purpose**: Stores company information.

| Column             | Type             | Description                  |
| ------------------ | ---------------- | ---------------------------- |
| **strGroupGUID**   | uniqueidentifier | Primary key                  |
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

### Year Management Table

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

#### MstPicklistTypes (Updated Primary Key)

**Purpose**: Defines types of picklists for dropdown and selection lists.

| Column                  | Type             | Description                  |
| ----------------------- | ---------------- | ---------------------------- |
| **strPicklistTypeGUID** | uniqueidentifier | Primary key                  |
| strType                 | nvarchar(450)    | Picklist type name           |
| strDescription          | nvarchar(max)    | Type description             |
| strGroupGUID            | uniqueidentifier | Foreign key to mstGroup      |
| bolIsActive             | bit              | Active status flag           |
| strCreatedBy            | uniqueidentifier | User who created record      |
| dtCreatedOn             | datetime2(7)     | Creation timestamp           |
| strUpdatedBy            | uniqueidentifier | User who last updated record |
| dtUpdatedOn             | datetime2(7)     | Last update timestamp        |

#### MstPickListValues (Updated Primary Key)

**Purpose**: Stores values for picklists.

| Column                   | Type             | Description                          |
| ------------------------ | ---------------- | ------------------------------------ |
| **strPickListValueGUID** | uniqueidentifier | Primary key                          |
| strValue                 | nvarchar(450)    | Picklist value                       |
| strPicklistTypeGUID      | uniqueidentifier | Foreign key to MstPicklistTypes      |
| bolIsActive              | bit              | Active status flag                   |
| strColor                 | nvarchar(20)     | Color code for visual representation |
| intDisplayOrder          | int              | Display ordering                     |
| strGroupGUID             | uniqueidentifier | Foreign key to mstGroup              |
| strCreatedByGUID         | uniqueidentifier | User who created record              |
| dtCreatedOn              | datetime2(7)     | Creation timestamp                   |
| strUpdatedByGUID         | uniqueidentifier | User who last updated record         |
| dtUpdatedOn              | datetime2(7)     | Last update timestamp                |

## Task Tables

### trnTask

**Purpose**: Stores task information with year association.

| Column               | Type             | Description                                 |
| -------------------- | ---------------- | ------------------------------------------- |
| strTaskGUID          | uniqueidentifier | Primary key                                 |
| strTitle             | nvarchar(200)    | Task title                                  |
| strDescription       | nvarchar(max)    | Task description                            |
| strTaskNumber        | nvarchar(50)     | Auto-generated task reference number        |
| strStatus_PL         | uniqueidentifier | Foreign key to MstPickListValues (status)   |
| strPriority_PL       | uniqueidentifier | Foreign key to MstPickListValues (priority) |
| strAssignedToGUID    | nvarchar(450)    | Foreign key to MstUsers (assignee)          |
| strAssignedByGUID    | nvarchar(450)    | Foreign key to MstUsers (assigner)          |
| strOrganizationGUID  | nvarchar(450)    | Foreign key to mstOrganization              |
| strYearGUID          | uniqueidentifier | Foreign key to mstYear                      |
| strParentTaskGUID    | uniqueidentifier | Parent task reference (self-reference)      |
| intLevel             | int              | Hierarchy level (0=root, 1=subtask, etc.)   |
| dtStartDate          | datetime2(7)     | Task start date                             |
| dtDueDate            | datetime2(7)     | Task due date                               |
| dtCompletedDate      | datetime2(7)     | Task completion date                        |
| dblEstimatedHours    | float            | Estimated hours                             |
| dblActualHours       | float            | Actual hours spent                          |
| bolIsRecurring       | bit              | Recurring task flag                         |
| strRecurrencePattern | nvarchar(100)    | Recurrence pattern (if recurring)           |
| strCategoryCode_PL   | nvarchar(50)     | Category code (picklist)                    |
| strTags              | nvarchar(max)    | JSON array of tags                          |
| intAttachmentCount   | int              | Number of attachments                       |
| intCommentCount      | int              | Number of comments                          |
| strGroupGUID         | uniqueidentifier | Foreign key to mstGroup                     |
| strCreatedByGUID     | nvarchar(450)    | User who created record                     |
| dtCreatedOn          | datetime2(7)     | Creation timestamp                          |
| strUpdatedByGUID     | nvarchar(450)    | User who last updated record                |
| dtUpdatedOn          | datetime2(7)     | Last update timestamp                       |

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

### trnNotification

**Purpose**: Stores user notifications with year context.

| Column               | Type             | Description                         |
| -------------------- | ---------------- | ----------------------------------- |
| strNotificationGUID  | uniqueidentifier | Primary key                         |
| strUserGUID          | nvarchar(450)    | Foreign key to MstUsers (recipient) |
| strType_PL           | nvarchar(50)     | Notification type                   |
| strTitle             | nvarchar(200)    | Notification title                  |
| strMessage           | nvarchar(500)    | Notification message                |
| strRelatedEntityGUID | uniqueidentifier | Related entity ID                   |
| strRelatedEntityType | nvarchar(50)     | Related entity type                 |
| strYearGUID          | uniqueidentifier | Foreign key to mstYear              |
| bolIsRead            | bit              | Read status                         |
| dtReadOn             | datetime2(7)     | When notification was read          |
| strGroupGUID         | uniqueidentifier | Foreign key to mstGroup             |
| strCreatedByGUID     | nvarchar(450)    | User who created record             |
| dtCreatedOn          | datetime2(7)     | Creation timestamp                  |

## Key Database Constraints

### Primary Keys

- All tables use `[TableName]GUID` pattern for primary keys (e.g., strUserGUID, strTaskGUID, strGroupGUID)

### Foreign Keys

- `MstMenu.strParentMenuGUID` → `MstMenu.strMenuGUID` (self-reference)
- `MstPickListValues.strGroupGUID` → `mstGroup.strGroupGUID`
- `MstPickListValues.strPicklistTypeGUID` → `MstPicklistTypes.strPicklistTypeGUID`
- `MstUserRights.strMenuGUID` → `MstMenu.strMenuGUID`
- `MstUserRights.strUserRoleGUID` → `mstUserRoles.strUserRoleGUID`
- `RefreshTokens.UserGUID` → `MstUsers.strUserGUID`
- `mstYear.strOrganizationGUID` → `mstOrganization.strOrganizationGUID`
- `mstYear.strGroupGUID` → `mstGroup.strGroupGUID`
- `mstYear.strPreviousYearGUID` → `mstYear.strYearGUID` (self-reference)
- `mstYear.strNextYearGUID` → `mstYear.strYearGUID` (self-reference)
- `MstUserDetails.strYearGUID` → `mstYear.strYearGUID`
- `trnTask.strYearGUID` → `mstYear.strYearGUID`
- `trnTask.strParentTaskGUID` → `trnTask.strTaskGUID` (self-reference)
- `trnTask.strStatus_PL` → `MstPickListValues.strPickListValueGUID`
- `trnTask.strPriority_PL` → `MstPickListValues.strPickListValueGUID`
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

## Suggestions and Improvements for Task Tracker Application

### 1. **Enhanced Task Management Features**

#### a. Task Templates

- Add `mstTaskTemplate` table to store reusable task templates
- Include pre-defined subtasks, estimated hours, and default assignments
- Support template categories (e.g., "Project Kickoff", "Quality Review")

#### b. Task Dependencies

- Add `trnTaskDependency` table to manage task relationships
- Support various dependency types: Finish-to-Start, Start-to-Start, Finish-to-Finish
- Implement critical path calculation for project management

#### c. Task Labels and Custom Fields

- Add `mstTaskCustomField` and `trnTaskCustomFieldValue` tables
- Support different field types: text, number, date, dropdown, checkbox
- Enable organization-specific custom fields

### 2. **Advanced Collaboration Features**

#### a. Team Management

- Add `mstTeam` and `trnTeamMember` tables for team-based task assignment
- Support team hierarchies and cross-functional teams
- Enable team-level permissions and visibility

#### b. Real-time Collaboration

- Add `trnTaskWatcher` table to track users following tasks
- Implement `trnTaskMention` for @mentions in comments
- Add `trnTaskActivity` for real-time activity feeds

#### c. Task Board Views

- Add `mstBoard` and `mstBoardColumn` tables for Kanban/Scrum boards
- Support custom workflows per board
- Enable swimlanes for better organization

### 3. **Time Management and Tracking**

#### a. Time Tracking

- Add `trnTimeLog` table for detailed time tracking
- Support timer functionality with start/stop times
- Enable time approval workflows

#### b. Resource Planning

- Add `mstUserCapacity` table for user availability
- Implement workload visualization
- Support vacation/leave management

#### c. Recurring Tasks

- Add `mstRecurrenceRule` table for complex recurrence patterns
- Support exceptions and modifications to recurring series
- Enable automatic task creation based on schedules

### 4. **Reporting and Analytics**

#### a. Dashboard Configuration

- Add `mstDashboard`, `mstWidget`, and `trnUserDashboard` tables
- Support customizable dashboards per user/role
- Include various widget types: charts, lists, metrics

#### b. Report Templates

- Add `mstReportTemplate` table for saved report configurations
- Support scheduled report generation
- Enable export in multiple formats (PDF, Excel, CSV)

#### c. Performance Metrics

- Add `trnTaskMetrics` table for KPI tracking
- Support SLA management
- Enable productivity analytics

### 5. **Integration and Automation**

#### a. Webhook Management

- Add `mstWebhook` and `trnWebhookLog` tables
- Support event-based triggers
- Enable third-party integrations

#### b. Email Integration

- Add `trnEmailTask` table for email-to-task conversion
- Support task updates via email replies
- Enable email notifications with templates

#### c. Workflow Automation

- Add `mstWorkflowRule` and `trnWorkflowAction` tables
- Support conditional logic and automated actions
- Enable custom triggers and actions

### 6. **Security and Compliance**

#### a. Audit Trail Enhancement

- Add `trnAuditLog` table for comprehensive system audit
- Include IP addresses, user agents, and session information
- Support compliance reporting (SOC 2, ISO 27001)

#### b. Data Privacy

- Add `mstDataRetentionPolicy` table
- Implement field-level encryption for sensitive data
- Support GDPR compliance features (data export, deletion)

#### c. Access Control

- Add `mstPermissionSet` for granular permissions
- Support field-level security
- Enable temporary access grants

### 7. **User Experience Improvements**

#### a. User Preferences

- Add `trnUserPreference` table for personalized settings
- Support theme customization
- Enable notification preferences per channel

#### b. Mobile Optimization

- Add `trnMobileSession` table for mobile app analytics
- Support offline mode with sync capabilities
- Enable push notifications

#### c. Search and Discovery

- Add `mstSavedSearch` table for saved filters
- Implement full-text search indexes
- Support smart suggestions and auto-complete

### 8. **Performance and Scalability**

#### a. Caching Strategy

- Add `trnCacheEntry` table for query result caching
- Implement Redis integration points
- Support cache invalidation rules

#### b. Archive Management

- Add `trnTaskArchive` and related archive tables
- Implement automated archival policies
- Support archived data retrieval

#### c. Multi-tenancy Enhancement

- Add `mstTenant` table for true multi-tenant architecture
- Support tenant-specific customizations
- Enable cross-tenant reporting for super admins

### 9. **AI and Machine Learning Features**

#### a. Smart Suggestions

- Add `mstMLModel` and `trnPrediction` tables
- Support task duration predictions
- Enable smart assignment recommendations

#### b. Natural Language Processing

- Add `trnNLPQuery` table for natural language task creation
- Support voice-to-task conversion
- Enable intelligent task categorization

### 10. **Business Intelligence**

#### a. Data Warehouse

- Design separate analytical database schema
- Implement ETL processes for data synchronization
- Support OLAP cube generation

#### b. Predictive Analytics

- Add tables for trend analysis
- Support forecasting models
- Enable what-if scenarios

### Implementation Priority

1. **Phase 1 (Core Enhancements)**:

   - Task dependencies
   - Time tracking
   - Team management
   - Basic reporting

2. **Phase 2 (Collaboration)**:

   - Real-time updates
   - Email integration
   - Mobile optimization
   - Advanced permissions

3. **Phase 3 (Intelligence)**:
   - Workflow automation
   - AI features
   - Advanced analytics
   - Performance optimization

### Technical Recommendations

1. **Database Optimization**:

   - Implement proper indexing strategy
   - Use database partitioning for large tables
   - Consider read replicas for reporting

2. **API Design**:

   - Implement GraphQL for flexible data fetching
   - Use WebSockets for real-time updates
   - Support bulk operations

3. **Security**:

   - Implement row-level security
   - Use encryption at rest and in transit
   - Regular security audits

4. **Monitoring**:
   - Add application performance monitoring
   - Implement database query monitoring
   - Set up alerting for critical issues

These enhancements would transform the task tracker into a comprehensive project management and collaboration platform suitable for enterprises of all sizes.

---

This documentation reflects the database schema with consistent naming conventions and comprehensive improvement suggestions.
