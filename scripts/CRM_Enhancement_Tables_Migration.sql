-- ==============================================================================
-- CRM Enhancement Tables - Migration Script
-- ==============================================================================
-- This script adds 5 new tables to support CRM enhancements:
-- 1. MstNotifications - Real-time notification system
-- 2. MstNotes - Internal notes with @mentions
-- 3. MstSavedViews - Filter persistence and saved views
-- 4. MstMeetings - Meeting scheduler with calendar integration
-- 5. MstDocuments - Document management with version control
-- ==============================================================================
-- USAGE:
-- This script should be executed in the context of MasterDB where tenant schemas exist
-- Replace @OrgGUID with your organization GUID
-- ==============================================================================

USE MasterDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ==============================================================================
-- Get Organization and Schema Information
-- ==============================================================================

DECLARE @OrgGUID UNIQUEIDENTIFIER;
DECLARE @SchemaName NVARCHAR(128);

-- Get first active organization (or replace with specific GUID)
SELECT TOP 1 @OrgGUID = strOrganizationGUID 
FROM mstOrganization 
WHERE bolIsActive = 1;

IF @OrgGUID IS NULL
BEGIN
    PRINT 'ERROR: No active organization found. Please set @OrgGUID manually.';
    RETURN;
END

-- Create schema name  
SET @SchemaName = 'ORG_' + REPLACE(CAST(@OrgGUID AS NVARCHAR(50)), '-', '');

PRINT '==============================================================================';
PRINT 'CRM Enhancement Tables Migration';
PRINT '==============================================================================';
PRINT 'Organization GUID: ' + CAST(@OrgGUID AS NVARCHAR(50));
PRINT 'Schema Name: ' + @SchemaName;
PRINT '';

-- ==============================================================================
-- TABLE 1: MstNotifications
-- Purpose: Real-time notification system for user alerts
-- ==============================================================================

DECLARE @CreateNotificationsSql NVARCHAR(MAX) = '
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ''' + @SchemaName + ''' AND TABLE_NAME = ''MstNotifications'')
BEGIN
    CREATE TABLE [' + @SchemaName + '].[MstNotifications] (
        strNotificationGUID     UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strRecipientUserGUID    UNIQUEIDENTIFIER    NOT NULL,
        strType                 NVARCHAR(50)        NOT NULL, -- Info, Success, Warning, Error
        strCategory             NVARCHAR(50)        NOT NULL, -- LeadAssignment, StatusChange, Mention, etc.
        strTitle                NVARCHAR(200)       NOT NULL,
        strMessage              NVARCHAR(MAX)       NOT NULL,
        strEntityType           NVARCHAR(50)        NULL, -- Lead, Contact, Account, Opportunity
        strEntityGUID           UNIQUEIDENTIFIER    NULL,
        strActionUrl            NVARCHAR(500)       NULL,
        strActorUserGUID        UNIQUEIDENTIFIER    NULL, -- User who triggered the notification
        bolIsRead               BIT                 DEFAULT 0,
        dtReadOn                DATETIME2           NULL,
        bolIsArchived           BIT                 DEFAULT 0,
        dtArchivedOn            DATETIME2           NULL,
        dtExpiresOn             DATETIME2           NULL,
        strMetadataJson         NVARCHAR(MAX)       NULL, -- Additional data as JSON
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0
    );

    CREATE INDEX IX_MstNotifications_GroupGUID ON [' + @SchemaName + '].[MstNotifications](strGroupGUID);
    CREATE INDEX IX_MstNotifications_Recipient ON [' + @SchemaName + '].[MstNotifications](strRecipientUserGUID, bolIsRead, bolIsArchived) WHERE bolIsDeleted = 0;
    CREATE INDEX IX_MstNotifications_Entity ON [' + @SchemaName + '].[MstNotifications](strEntityType, strEntityGUID) WHERE strEntityGUID IS NOT NULL;
    CREATE INDEX IX_MstNotifications_CreatedOn ON [' + @SchemaName + '].[MstNotifications](dtCreatedOn DESC);

    PRINT ''✓ Table created: MstNotifications'';
END
ELSE
BEGIN
    PRINT ''- Table already exists: MstNotifications'';
END';
EXEC sp_executesql @CreateNotificationsSql;
GO

-- ==============================================================================
-- TABLE 2: MstNotes
-- Purpose: Internal notes with @mention support for entities
-- ==============================================================================

DECLARE @OrgGUID UNIQUEIDENTIFIER;
DECLARE @SchemaName NVARCHAR(128);
SELECT TOP 1 @OrgGUID = strOrganizationGUID FROM mstOrganization WHERE bolIsActive = 1;
SET @SchemaName = 'ORG_' + REPLACE(CAST(@OrgGUID AS NVARCHAR(50)), '-', '');

DECLARE @CreateNotesSql NVARCHAR(MAX) = '
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ''' + @SchemaName + ''' AND TABLE_NAME = ''MstNotes'')
BEGIN
    CREATE TABLE [' + @SchemaName + '].[MstNotes] (
        strNoteGUID             UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strEntityType           NVARCHAR(50)        NOT NULL, -- Lead, Contact, Account, Opportunity, etc.
        strEntityGUID           UNIQUEIDENTIFIER    NOT NULL,
        strContent              NVARCHAR(MAX)       NOT NULL,
        strMentionedUsersJson   NVARCHAR(MAX)       NULL, -- Array of user GUIDs mentioned with @
        bolIsPrivate            BIT                 DEFAULT 0,
        bolIsPinned             BIT                 DEFAULT 0,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0,
        dtDeletedOn             DATETIME2           NULL
    );

    CREATE INDEX IX_MstNotes_GroupGUID ON [' + @SchemaName + '].[MstNotes](strGroupGUID);
    CREATE INDEX IX_MstNotes_Entity ON [' + @SchemaName + '].[MstNotes](strEntityType, strEntityGUID) WHERE bolIsDeleted = 0;
    CREATE INDEX IX_MstNotes_CreatedOn ON [' + @SchemaName + '].[MstNotes](dtCreatedOn DESC);
    CREATE INDEX IX_MstNotes_Pinned ON [' + @SchemaName + '].[MstNotes](bolIsPinned) WHERE bolIsPinned = 1 AND bolIsDeleted = 0;

    PRINT ''✓ Table created: MstNotes'';
END
ELSE
BEGIN
    PRINT ''- Table already exists: MstNotes'';
END';
EXEC sp_executesql @CreateNotesSql;
GO

-- ==============================================================================
-- TABLE 3: MstSavedViews
-- Purpose: Save and share filtered views across entities
-- ==============================================================================

DECLARE @OrgGUID UNIQUEIDENTIFIER;
DECLARE @SchemaName NVARCHAR(128);
SELECT TOP 1 @OrgGUID = strOrganizationGUID FROM mstOrganization WHERE bolIsActive = 1;
SET @SchemaName = 'ORG_' + REPLACE(CAST(@OrgGUID AS NVARCHAR(50)), '-', '');

DECLARE @CreateSavedViewsSql NVARCHAR(MAX) = '
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ''' + @SchemaName + ''' AND TABLE_NAME = ''MstSavedViews'')
BEGIN
    CREATE TABLE [' + @SchemaName + '].[MstSavedViews] (
        strSavedViewGUID        UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strEntityType           NVARCHAR(50)        NOT NULL, -- Lead, Contact, Account, Opportunity
        strName                 NVARCHAR(200)       NOT NULL,
        strDescription          NVARCHAR(500)       NULL,
        strFilterJson           NVARCHAR(MAX)       NOT NULL, -- Filter criteria as JSON
        strIcon                 NVARCHAR(50)        NULL, -- Icon name for UI
        strColor                NVARCHAR(20)        NULL, -- Color code for UI
        bolIsDefault            BIT                 DEFAULT 0,
        bolIsShared             BIT                 DEFAULT 0, -- Share with team
        intUsageCount           INT                 DEFAULT 0,
        dtLastUsedOn            DATETIME2           NULL,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0
    );

    CREATE INDEX IX_MstSavedViews_GroupGUID ON [' + @SchemaName + '].[MstSavedViews](strGroupGUID);
    CREATE INDEX IX_MstSavedViews_EntityType ON [' + @SchemaName + '].[MstSavedViews](strEntityType) WHERE bolIsDeleted = 0;
    CREATE INDEX IX_MstSavedViews_Creator ON [' + @SchemaName + '].[MstSavedViews](strCreatedByGUID) WHERE bolIsDeleted = 0;
    CREATE INDEX IX_MstSavedViews_Shared ON [' + @SchemaName + '].[MstSavedViews](bolIsShared) WHERE bolIsShared = 1 AND bolIsDeleted = 0;
    CREATE INDEX IX_MstSavedViews_Default ON [' + @SchemaName + '].[MstSavedViews](strEntityType, strCreatedByGUID, bolIsDefault) WHERE bolIsDefault = 1;

    PRINT ''✓ Table created: MstSavedViews'';
END
ELSE
BEGIN
    PRINT ''- Table already exists: MstSavedViews'';
END';
EXEC sp_executesql @CreateSavedViewsSql;
GO

-- ==============================================================================
-- TABLE 4: MstMeetings
-- Purpose: Meeting scheduler with calendar integration
-- ==============================================================================

DECLARE @OrgGUID UNIQUEIDENTIFIER;
DECLARE @SchemaName NVARCHAR(128);
SELECT TOP 1 @OrgGUID = strOrganizationGUID FROM mstOrganization WHERE bolIsActive = 1;
SET @SchemaName = 'ORG_' + REPLACE(CAST(@OrgGUID AS NVARCHAR(50)), '-', '');

DECLARE @CreateMeetingsSql NVARCHAR(MAX) = '
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ''' + @SchemaName + ''' AND TABLE_NAME = ''MstMeetings'')
BEGIN
    CREATE TABLE [' + @SchemaName + '].[MstMeetings] (
        strMeetingGUID          UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strEntityType           NVARCHAR(50)        NULL, -- Lead, Contact, Account, Opportunity (optional)
        strEntityGUID           UNIQUEIDENTIFIER    NULL,
        strTitle                NVARCHAR(300)       NOT NULL,
        strDescription          NVARCHAR(MAX)       NULL,
        dtStartTime             DATETIME2           NOT NULL,
        dtEndTime               DATETIME2           NOT NULL,
        strLocation             NVARCHAR(300)       NULL,
        strMeetingUrl           NVARCHAR(500)       NULL, -- Zoom, Teams, Meet URL
        bolIsVirtualMeeting     BIT                 DEFAULT 0,
        strAttendeesJson        NVARCHAR(MAX)       NULL, -- All attendees as JSON array
        strRequiredAttendeesJson NVARCHAR(MAX)      NULL,
        strOptionalAttendeesJson NVARCHAR(MAX)      NULL,
        strRecurrenceRule       NVARCHAR(500)       NULL, -- iCal RRULE format
        strParentRecurrenceGUID UNIQUEIDENTIFIER    NULL, -- For recurring meeting instances
        strStatus               NVARCHAR(50)        NOT NULL DEFAULT ''Scheduled'', -- Scheduled, Completed, Cancelled
        strOutcome              NVARCHAR(MAX)       NULL, -- Meeting outcome/notes
        strReminderConfigJson   NVARCHAR(MAX)       NULL, -- Reminder settings
        strCalendarEventId      NVARCHAR(200)       NULL, -- External calendar system ID
        strCalendarType         NVARCHAR(50)        NULL, -- Google, Outlook, etc.
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0,
        dtDeletedOn             DATETIME2           NULL
    );

    CREATE INDEX IX_MstMeetings_GroupGUID ON [' + @SchemaName + '].[MstMeetings](strGroupGUID);
    CREATE INDEX IX_MstMeetings_Entity ON [' + @SchemaName + '].[MstMeetings](strEntityType, strEntityGUID) WHERE strEntityGUID IS NOT NULL;
    CREATE INDEX IX_MstMeetings_StartTime ON [' + @SchemaName + '].[MstMeetings](dtStartTime) WHERE bolIsDeleted = 0;
    CREATE INDEX IX_MstMeetings_Status ON [' + @SchemaName + '].[MstMeetings](strStatus) WHERE bolIsDeleted = 0;
    CREATE INDEX IX_MstMeetings_Creator ON [' + @SchemaName + '].[MstMeetings](strCreatedByGUID) WHERE bolIsDeleted = 0;

    PRINT ''✓ Table created: MstMeetings'';
END
ELSE
BEGIN
    PRINT ''- Table already exists: MstMeetings'';
END';
EXEC sp_executesql @CreateMeetingsSql;
GO

-- ==============================================================================
-- TABLE 5: MstDocuments
-- Purpose: Document management with version control
-- ==============================================================================

DECLARE @OrgGUID UNIQUEIDENTIFIER;
DECLARE @SchemaName NVARCHAR(128);
SELECT TOP 1 @OrgGUID = strOrganizationGUID FROM mstOrganization WHERE bolIsActive = 1;
SET @SchemaName = 'ORG_' + REPLACE(CAST(@OrgGUID AS NVARCHAR(50)), '-', '');

DECLARE @CreateDocumentsSql NVARCHAR(MAX) = '
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ''' + @SchemaName + ''' AND TABLE_NAME = ''MstDocuments'')
BEGIN
    CREATE TABLE [' + @SchemaName + '].[MstDocuments] (
        strDocumentGUID         UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strEntityType           NVARCHAR(50)        NOT NULL, -- Lead, Contact, Account, Opportunity
        strEntityGUID           UNIQUEIDENTIFIER    NOT NULL,
        strFileName             NVARCHAR(255)       NOT NULL, -- Stored file name
        strOriginalFileName     NVARCHAR(255)       NOT NULL, -- Original uploaded file name
        strFileExtension        NVARCHAR(20)        NOT NULL,
        strMimeType             NVARCHAR(100)       NOT NULL,
        bigFileSizeBytes        BIGINT              NOT NULL,
        strStoragePath          NVARCHAR(500)       NOT NULL, -- Relative path in storage
        strCategory             NVARCHAR(50)        NULL, -- Contract, Proposal, Invoice, Other
        strDescription          NVARCHAR(500)       NULL,
        strTagsJson             NVARCHAR(MAX)       NULL, -- Tags as JSON array
        intVersionNumber        INT                 DEFAULT 1,
        strParentVersionGUID    UNIQUEIDENTIFIER    NULL, -- Previous version GUID
        strAccessLevel          NVARCHAR(50)        DEFAULT ''Private'', -- Private, Team, Public
        bolRequiresSignature    BIT                 DEFAULT 0,
        bolIsSignedElectronically BIT               DEFAULT 0,
        strSignatureGUID        UNIQUEIDENTIFIER    NULL,
        dtSignedOn              DATETIME2           NULL,
        strShareLinkToken       NVARCHAR(100)       NULL, -- Secure sharing token
        dtShareLinkExpiresOn    DATETIME2           NULL,
        intDownloadCount        INT                 DEFAULT 0,
        dtLastDownloadedOn      DATETIME2           NULL,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0,
        dtDeletedOn             DATETIME2           NULL
    );

    CREATE INDEX IX_MstDocuments_GroupGUID ON [' + @SchemaName + '].[MstDocuments](strGroupGUID);
    CREATE INDEX IX_MstDocuments_Entity ON [' + @SchemaName + '].[MstDocuments](strEntityType, strEntityGUID) WHERE bolIsDeleted = 0;
    CREATE INDEX IX_MstDocuments_Category ON [' + @SchemaName + '].[MstDocuments](strCategory) WHERE bolIsDeleted = 0;
    CREATE INDEX IX_MstDocuments_ParentVersion ON [' + @SchemaName + '].[MstDocuments](strParentVersionGUID) WHERE strParentVersionGUID IS NOT NULL;
    CREATE INDEX IX_MstDocuments_ShareLink ON [' + @SchemaName + '].[MstDocuments](strShareLinkToken) WHERE strShareLinkToken IS NOT NULL;
    CREATE INDEX IX_MstDocuments_CreatedOn ON [' + @SchemaName + '].[MstDocuments](dtCreatedOn DESC);

    PRINT ''✓ Table created: MstDocuments'';
END
ELSE
BEGIN
    PRINT ''- Table already exists: MstDocuments'';
END';
EXEC sp_executesql @CreateDocumentsSql;
GO

-- ==============================================================================
-- Migration Complete
-- ==============================================================================

PRINT '';
PRINT '==============================================================================';
PRINT 'CRM Enhancement Tables Migration Completed Successfully!';
PRINT '5 new tables created/verified:';
PRINT '  1. MstNotifications - Real-time notification system';
PRINT '  2. MstNotes - Internal notes with @mentions';
PRINT '  3. MstSavedViews - Saved filter views';
PRINT '  4. MstMeetings - Meeting scheduler';
PRINT '  5. MstDocuments - Document management';
PRINT '==============================================================================';
PRINT '';

-- ==============================================================================
-- Next Steps:
-- 1. Update TenantDbContext to include new DbSets
-- 2. Add permissions to mstMenus for CRM_Notifications, CRM_Notes, etc.
-- 3. Implement application services for CRUD operations
-- 4. Configure SignalR hub for real-time notifications
-- 5. Test all endpoints with Postman/Swagger
-- ==============================================================================
