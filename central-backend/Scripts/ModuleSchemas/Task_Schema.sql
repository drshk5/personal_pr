    -- Task Module Database Schema Initialization Script
-- Creates organization-scoped schema and Task module tables

-- Parameters expected:
-- @organizationGUID UNIQUEIDENTIFIER
-- @groupGUID UNIQUEIDENTIFIER
 -- (No year parameter required for Task module core schema)

DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(@organizationGUID, '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

-- Optional helpers (mirroring accounting schema style)
DECLARE @useGroupGUID NVARCHAR(50) = @groupGUID;

PRINT 'Task Schema Init for Org: ' + CONVERT(NVARCHAR(36), @organizationGUID);

-- Create schema if not exists
SET @sql = 'IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = ''' + @schemaName + ''') 
BEGIN 
    EXEC(''CREATE SCHEMA ' + @schemaName + ''') 
END';
EXEC sp_executesql @sql;

-- mstBoard (Moved to top as it is a parent dependency for many tables)
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBoard'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstBoard (
        strBoardGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strName NVARCHAR(100) NOT NULL,
        strDescription NVARCHAR(MAX) NULL,
        bolIsActive BIT NOT NULL DEFAULT 1,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(7) NULL
    )
END';
EXEC sp_executesql @sql;

-- Indexes for mstBoard
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBoard'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoard_Group'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoard''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoard_Group ON ' + QUOTENAME(@schemaName) + '.mstBoard(strGroupGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoard_Org'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoard''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoard_Org ON ' + QUOTENAME(@schemaName) + '.mstBoard(strOrganizationGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoard_Year'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoard''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoard_Year ON ' + QUOTENAME(@schemaName) + '.mstBoard(strYearGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoard_Org_Year_Active'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoard''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoard_Org_Year_Active ON ' + QUOTENAME(@schemaName) + '.mstBoard(strOrganizationGUID, strYearGUID, bolIsActive);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoard_Org_Year_INC'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoard''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoard_Org_Year_INC ON ' + QUOTENAME(@schemaName) + '.mstBoard(strOrganizationGUID, strYearGUID) INCLUDE (strName, strDescription, bolIsActive);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoard_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoard''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoard_CreatedBy ON ' + QUOTENAME(@schemaName) + '.mstBoard(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoard_UpdatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoard''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoard_UpdatedBy ON ' + QUOTENAME(@schemaName) + '.mstBoard(strUpdatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoard_CreatedBy_Date'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoard''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoard_CreatedBy_Date ON ' + QUOTENAME(@schemaName) + '.mstBoard(strCreatedByGUID, dtCreatedOn DESC);
    END
END';
EXEC sp_executesql @sql;

-- mstBoardTeamGroup (Team groups for board organization)
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBoardTeamGroup'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstBoardTeamGroup (
        strTeamGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        strBoardGUID UNIQUEIDENTIFIER NOT NULL,
        strParentTeamGUID UNIQUEIDENTIFIER NULL,   -- NULL = main team
        strTeamName NVARCHAR(200) NOT NULL,
        strDescription NVARCHAR(500) NULL,
        bolIsActive BIT NOT NULL DEFAULT 1,
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(7) NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_BoardTeamGroup_Board FOREIGN KEY (strBoardGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.mstBoard(strBoardGUID),
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_BoardTeamGroup_ParentTeam FOREIGN KEY (strParentTeamGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.mstBoardTeamGroup(strTeamGUID)
    )
END';
EXEC sp_executesql @sql;

-- Indexes for mstBoardTeamGroup
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBoardTeamGroup'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoardTeamGroup_Board'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardTeamGroup''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoardTeamGroup_Board ON ' + QUOTENAME(@schemaName) + '.mstBoardTeamGroup(strBoardGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoardTeamGroup_ParentTeam'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardTeamGroup''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoardTeamGroup_ParentTeam ON ' + QUOTENAME(@schemaName) + '.mstBoardTeamGroup(strParentTeamGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoardTeamGroup_Active'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardTeamGroup''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoardTeamGroup_Active ON ' + QUOTENAME(@schemaName) + '.mstBoardTeamGroup(bolIsActive);
    END
END';
EXEC sp_executesql @sql;

-- mstBoardTeamMember (Team membership for users)
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBoardTeamMember'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstBoardTeamMember (
        strTeamMemberGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        strTeamGUID UNIQUEIDENTIFIER NOT NULL,
        strUserGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(7) NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_BoardTeamMember_Team FOREIGN KEY (strTeamGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.mstBoardTeamGroup(strTeamGUID),
        -- Note: strUserGUID references master.dbo.mstUser (cross-database relationship)
        CONSTRAINT UX_' + @sanitizedOrgGUID + '_BoardTeamMember_Team_User UNIQUE (strTeamGUID, strUserGUID)
    )
END';
EXEC sp_executesql @sql;

-- Indexes for mstBoardTeamMember
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBoardTeamMember'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoardTeamMember_Team'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardTeamMember''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoardTeamMember_Team ON ' + QUOTENAME(@schemaName) + '.mstBoardTeamMember(strTeamGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoardTeamMember_User'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardTeamMember''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoardTeamMember_User ON ' + QUOTENAME(@schemaName) + '.mstBoardTeamMember(strUserGUID);
    END
END';
EXEC sp_executesql @sql;

-- trnTask (moved before trnReviewTask to fix foreign key dependency)
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTask'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.trnTask (
        strTaskGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strBoardGUID UNIQUEIDENTIFIER NULL,
        strTitle NVARCHAR(200) NOT NULL,
        strDescription NVARCHAR(MAX) NULL,
        strStatus NVARCHAR(50) NOT NULL DEFAULT ''Not Started'',
        strPriority NVARCHAR(50) NOT NULL DEFAULT ''None'',
        intPercentage INT NOT NULL DEFAULT 0,
        strAssignedToGUID UNIQUEIDENTIFIER NULL,
        strAssignedByGUID UNIQUEIDENTIFIER NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        dtStartDate DATETIME2(7) NULL,
        dtDueDate DATETIME2(7) NULL,
        dtCompletedDate DATETIME2(7) NULL,
        dtReminderDate DATETIME2(7) NULL,
        strReminderTo NVARCHAR(50) NULL,
        bolIsNotificationSend BIT NOT NULL DEFAULT 0,
        intEstimatedMinutes INT NULL,
        intActualMinutes INT NULL,
        strTags NVARCHAR(MAX) NULL,
        bolIsPrivate BIT NOT NULL DEFAULT 0,
        bolIsReviewReq BIT NOT NULL DEFAULT 0,
        bolIsBillable BIT NOT NULL DEFAULT 0,
        strReviewedByGUID UNIQUEIDENTIFIER NULL,
        bolIsTimeTrackingReq BIT NOT NULL DEFAULT 0,
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(7) NULL,
        strTaskNo INT NOT NULL DEFAULT 1,
        strTicketKey NVARCHAR(50) NULL,
        strTicketUrl NVARCHAR(500) NULL,
        strTicketSource NVARCHAR(50) NULL,
        strParentTaskRecurrenceGUID UNIQUEIDENTIFIER NULL,
        strBoardSubModuleGUID UNIQUEIDENTIFIER NULL,
        strCompletionRule VARCHAR(20) NOT NULL DEFAULT ''ANY_ONE'' CHECK (strCompletionRule IN (''ANY_ONE'', ''ALL_USERS'')),
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_Task_Board FOREIGN KEY (strBoardGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.mstBoard(strBoardGUID)
    )
END';
EXEC sp_executesql @sql;

-- Indexes for trnTask
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTask'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_Board'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_Board ON ' + QUOTENAME(@schemaName) + '.trnTask(strBoardGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_AssignedTo'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_AssignedTo ON ' + QUOTENAME(@schemaName) + '.trnTask(strAssignedToGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_AssignedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_AssignedBy ON ' + QUOTENAME(@schemaName) + '.trnTask(strAssignedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_Organization'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_Organization ON ' + QUOTENAME(@schemaName) + '.trnTask(strOrganizationGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_Year'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_Year ON ' + QUOTENAME(@schemaName) + '.trnTask(strYearGUID);
    END
    -- Unique index for TaskNo to ensure uniqueness within organization and year scope
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_TaskNo_Unique'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE UNIQUE INDEX IX_' + @sanitizedOrgGUID + '_Task_TaskNo_Unique ON ' + QUOTENAME(@schemaName) + '.trnTask(strTaskNo, strOrganizationGUID, strYearGUID);
    END
    -- Performance index for TaskReminderJob
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_ReminderQuery'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_' + @sanitizedOrgGUID + '_Task_ReminderQuery 
        ON ' + QUOTENAME(@schemaName) + '.trnTask(strStatus, bolIsNotificationSend, dtReminderDate)
        INCLUDE (strTaskGUID, strTitle, strReminderTo, strAssignedByGUID, strAssignedToGUID, strBoardGUID, dtDueDate, strOrganizationGUID, strYearGUID)
        WHERE dtReminderDate IS NOT NULL AND strReminderTo IS NOT NULL;
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_ParentRecurrence'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_ParentRecurrence ON ' + QUOTENAME(@schemaName) + '.trnTask(strParentTaskRecurrenceGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_ReviewedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_ReviewedBy ON ' + QUOTENAME(@schemaName) + '.trnTask(strReviewedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_CreatedBy ON ' + QUOTENAME(@schemaName) + '.trnTask(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_UpdatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_UpdatedBy ON ' + QUOTENAME(@schemaName) + '.trnTask(strUpdatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_Status'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_Status ON ' + QUOTENAME(@schemaName) + '.trnTask(strStatus);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_Priority'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_Priority ON ' + QUOTENAME(@schemaName) + '.trnTask(strPriority);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_Board_Status'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_Board_Status ON ' + QUOTENAME(@schemaName) + '.trnTask(strBoardGUID, strStatus);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_AssignedTo_Status'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_AssignedTo_Status ON ' + QUOTENAME(@schemaName) + '.trnTask(strAssignedToGUID, strStatus);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_DueDate'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_DueDate ON ' + QUOTENAME(@schemaName) + '.trnTask(dtDueDate);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Task_Flags'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Task_Flags ON ' + QUOTENAME(@schemaName) + '.trnTask(bolIsPrivate, bolIsReviewReq, bolIsBillable, bolIsTimeTrackingReq);
    END
END';
EXEC sp_executesql @sql;

-- trnReviewTask (moved after trnTask to fix foreign key dependency)
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''trnReviewTask'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.trnReviewTask (
        strReviewTaskGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strTaskGUID UNIQUEIDENTIFIER NOT NULL,
        strReview NVARCHAR(MAX) NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(7) NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_ReviewTask_Task FOREIGN KEY (strTaskGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.trnTask(strTaskGUID) ON DELETE CASCADE
    )
END';
EXEC sp_executesql @sql;

-- Indexes for trnReviewTask
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnReviewTask'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_ReviewTask_Task'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnReviewTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_ReviewTask_Task ON ' + QUOTENAME(@schemaName) + '.trnReviewTask(strTaskGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_ReviewTask_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnReviewTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_ReviewTask_CreatedBy ON ' + QUOTENAME(@schemaName) + '.trnReviewTask(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_ReviewTask_UpdatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnReviewTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_ReviewTask_UpdatedBy ON ' + QUOTENAME(@schemaName) + '.trnReviewTask(strUpdatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_ReviewTask_Covering'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnReviewTask''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_ReviewTask_Covering ON ' + QUOTENAME(@schemaName) + '.trnReviewTask(strTaskGUID) INCLUDE (strReview, strCreatedByGUID, dtCreatedOn, strUpdatedByGUID, dtUpdatedOn);
    END
END';
EXEC sp_executesql @sql;

-- mstBoardTeam
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBoardTeam'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstBoardTeam (
        strBoardTeamGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strBoardGUID UNIQUEIDENTIFIER NOT NULL,
        strUserGUID UNIQUEIDENTIFIER NOT NULL,
        strReportingToGUID UNIQUEIDENTIFIER NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(7) NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_BoardTeam_Board FOREIGN KEY (strBoardGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.mstBoard(strBoardGUID) ON DELETE NO ACTION
    )
END';
EXEC sp_executesql @sql;

-- Indexes for mstBoardTeam
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBoardTeam'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BoardTeam_Board'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardTeam''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BoardTeam_Board ON ' + QUOTENAME(@schemaName) + '.mstBoardTeam(strBoardGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BoardTeam_User'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardTeam''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BoardTeam_User ON ' + QUOTENAME(@schemaName) + '.mstBoardTeam(strUserGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''UQ_' + @sanitizedOrgGUID + '_BoardTeam_BoardUser'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardTeam''))
    BEGIN
        CREATE UNIQUE INDEX UQ_' + @sanitizedOrgGUID + '_BoardTeam_BoardUser ON ' + QUOTENAME(@schemaName) + '.mstBoardTeam(strBoardGUID, strUserGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BoardTeam_Board_User'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardTeam''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BoardTeam_Board_User ON ' + QUOTENAME(@schemaName) + '.mstBoardTeam(strBoardGUID, strUserGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BoardTeam_ReportingTo'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardTeam''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BoardTeam_ReportingTo ON ' + QUOTENAME(@schemaName) + '.mstBoardTeam(strReportingToGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BoardTeam_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardTeam''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BoardTeam_CreatedBy ON ' + QUOTENAME(@schemaName) + '.mstBoardTeam(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BoardTeam_UpdatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardTeam''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BoardTeam_UpdatedBy ON ' + QUOTENAME(@schemaName) + '.mstBoardTeam(strUpdatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BoardTeam_Covering'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardTeam''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BoardTeam_Covering ON ' + QUOTENAME(@schemaName) + '.mstBoardTeam(strBoardGUID, strUserGUID) INCLUDE (strReportingToGUID, strCreatedByGUID, dtCreatedOn, strUpdatedByGUID, dtUpdatedOn);
    END
END';
EXEC sp_executesql @sql;

-- trnTaskTimer
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskTimer'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.trnTaskTimer (
        strTaskTimerGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strTaskGUID UNIQUEIDENTIFIER NOT NULL,
        strUserGUID UNIQUEIDENTIFIER NOT NULL,
        dtStartTime DATETIME2(7) NOT NULL,
        dtEndTime DATETIME2(7) NULL,
        intTotalMinutes INT NULL,
        strStatus NVARCHAR(50) DEFAULT NULL,
        strDescription NVARCHAR(MAX) NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtUpdatedOn DATETIME2(7) NULL,
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_TaskTimer_Task FOREIGN KEY (strTaskGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.trnTask(strTaskGUID)
    )
END';
EXEC sp_executesql @sql;

-- Indexes for trnTaskTimer
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskTimer'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskTimer_Task'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskTimer''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskTimer_Task ON ' + QUOTENAME(@schemaName) + '.trnTaskTimer(strTaskGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskTimer_User'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskTimer''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskTimer_User ON ' + QUOTENAME(@schemaName) + '.trnTaskTimer(strUserGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskTimer_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskTimer''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskTimer_CreatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskTimer(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskTimer_UpdatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskTimer''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskTimer_UpdatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskTimer(strUpdatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskTimer_Status'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskTimer''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskTimer_Status ON ' + QUOTENAME(@schemaName) + '.trnTaskTimer(strStatus);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskTimer_User_StartTime'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskTimer''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskTimer_User_StartTime ON ' + QUOTENAME(@schemaName) + '.trnTaskTimer(strUserGUID, dtStartTime DESC);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskTimer_Active_Timer'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskTimer''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskTimer_Active_Timer ON ' + QUOTENAME(@schemaName) + '.trnTaskTimer(dtEndTime, strTaskGUID) WHERE dtEndTime IS NULL;
    END
END';
EXEC sp_executesql @sql;

-- mstBoardSection
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBoardSection'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstBoardSection (
        strBoardSectionGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strBoardGUID UNIQUEIDENTIFIER NOT NULL,
        strName NVARCHAR(100) NOT NULL,
        strColor NVARCHAR(7) NULL,
        intPosition INT NOT NULL DEFAULT 0,
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(7) NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_BoardSection_Board FOREIGN KEY (strBoardGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.mstBoard(strBoardGUID)
    )
END';
EXEC sp_executesql @sql;

-- Indexes for mstBoardSection
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBoardSection'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BoardSection_Board'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardSection''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BoardSection_Board ON ' + QUOTENAME(@schemaName) + '.mstBoardSection(strBoardGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BoardSection_Board_Position'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardSection''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BoardSection_Board_Position ON ' + QUOTENAME(@schemaName) + '.mstBoardSection(strBoardGUID, intPosition);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BoardSection_Board_Covering'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardSection''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BoardSection_Board_Covering ON ' + QUOTENAME(@schemaName) + '.mstBoardSection(strBoardGUID) INCLUDE (strName, strColor, intPosition, strCreatedByGUID, dtCreatedOn, strUpdatedByGUID, dtUpdatedOn);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BoardSection_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardSection''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BoardSection_CreatedBy ON ' + QUOTENAME(@schemaName) + '.mstBoardSection(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BoardSection_UpdatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardSection''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BoardSection_UpdatedBy ON ' + QUOTENAME(@schemaName) + '.mstBoardSection(strUpdatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BoardSection_CreatedBy_Date'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardSection''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BoardSection_CreatedBy_Date ON ' + QUOTENAME(@schemaName) + '.mstBoardSection(strCreatedByGUID, dtCreatedOn DESC);
    END
END';
EXEC sp_executesql @sql;

-- mstBoardSubModule
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBoardSubModule'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstBoardSubModule (
        strBoardSubModuleGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strBoardGUID UNIQUEIDENTIFIER NOT NULL,
        strBoardSectionGUID UNIQUEIDENTIFIER NOT NULL,
        strName NVARCHAR(100) NOT NULL,
        bolIsActive BIT NOT NULL DEFAULT 1,
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(7) NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_BoardSubModule_Board FOREIGN KEY (strBoardGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.mstBoard(strBoardGUID),
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_BoardSubModule_Section FOREIGN KEY (strBoardSectionGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.mstBoardSection(strBoardSectionGUID)
    )
END';
EXEC sp_executesql @sql;

-- Indexes for mstBoardSubModule
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBoardSubModule'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoardSubModule_Board'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardSubModule''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoardSubModule_Board ON ' + QUOTENAME(@schemaName) + '.mstBoardSubModule(strBoardGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoardSubModule_Section'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardSubModule''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoardSubModule_Section ON ' + QUOTENAME(@schemaName) + '.mstBoardSubModule(strBoardSectionGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoardSubModule_Active'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardSubModule''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoardSubModule_Active ON ' + QUOTENAME(@schemaName) + '.mstBoardSubModule(bolIsActive);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBoardSubModule_Name'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBoardSubModule''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBoardSubModule_Name ON ' + QUOTENAME(@schemaName) + '.mstBoardSubModule(strName);
    END
END';
EXEC sp_executesql @sql;

-- mstTag
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstTag'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstTag (
        strTagGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strBoardGUID UNIQUEIDENTIFIER NOT NULL,
        strTagName NVARCHAR(50) NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(7) NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_Tag_Board FOREIGN KEY (strBoardGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.mstBoard(strBoardGUID) ON DELETE CASCADE
    )
END';
EXEC sp_executesql @sql;

-- Indexes for mstTag
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstTag'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Tag_Board'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstTag''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Tag_Board ON ' + QUOTENAME(@schemaName) + '.mstTag(strBoardGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Tag_Board_Name'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstTag''))
    BEGIN
        CREATE UNIQUE INDEX IX_' + @sanitizedOrgGUID + '_Tag_Board_Name ON ' + QUOTENAME(@schemaName) + '.mstTag(strBoardGUID, strTagName);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Tag_Covering'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstTag''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Tag_Covering ON ' + QUOTENAME(@schemaName) + '.mstTag(strBoardGUID) INCLUDE (strTagName, strCreatedByGUID, dtCreatedOn, strUpdatedByGUID, dtUpdatedOn);
    END
END';
EXEC sp_executesql @sql;

-- trnTaskViewPosition
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskViewPosition'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.trnTaskViewPosition (
        strTaskViewPositionGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strTaskGUID UNIQUEIDENTIFIER NOT NULL,
        strBoardSectionGUID UNIQUEIDENTIFIER NULL,
        intPosition INT NOT NULL DEFAULT 0,
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(7) NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_TVP_Task FOREIGN KEY (strTaskGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.trnTask(strTaskGUID),
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_TVP_Section FOREIGN KEY (strBoardSectionGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.mstBoardSection(strBoardSectionGUID)
    )
END';
EXEC sp_executesql @sql;

-- Indexes for trnTaskViewPosition
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskViewPosition'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TVP_Task'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskViewPosition''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TVP_Task ON ' + QUOTENAME(@schemaName) + '.trnTaskViewPosition(strTaskGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TVP_Section'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskViewPosition''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TVP_Section ON ' + QUOTENAME(@schemaName) + '.trnTaskViewPosition(strBoardSectionGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TVP_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskViewPosition''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TVP_CreatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskViewPosition(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TVP_UpdatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskViewPosition''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TVP_UpdatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskViewPosition(strUpdatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TVP_Section_Position'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskViewPosition''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TVP_Section_Position ON ' + QUOTENAME(@schemaName) + '.trnTaskViewPosition(strBoardSectionGUID, intPosition);
    END
END';
EXEC sp_executesql @sql;

-- trnTaskChecklist
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskChecklist'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.trnTaskChecklist (
        strTaskChecklistGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strTaskGUID UNIQUEIDENTIFIER NOT NULL,
        strTitle NVARCHAR(MAX) NOT NULL,
        dtDueDate DATETIME2(7) NULL,
        strAssignedToGUID UNIQUEIDENTIFIER NULL,
        bolIsCompleted BIT NOT NULL DEFAULT 0,
        intPosition INT NOT NULL DEFAULT 0,
        dtCompletedOn DATETIME2(7) NULL,
        strCompletedByGUID UNIQUEIDENTIFIER NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(7) NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_Checklist_Task FOREIGN KEY (strTaskGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.trnTask(strTaskGUID)
    )
END';
EXEC sp_executesql @sql;

-- Indexes for trnTaskChecklist
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskChecklist'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Checklist_Task'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskChecklist''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Checklist_Task ON ' + QUOTENAME(@schemaName) + '.trnTaskChecklist(strTaskGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Checklist_AssignedTo'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskChecklist''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Checklist_AssignedTo ON ' + QUOTENAME(@schemaName) + '.trnTaskChecklist(strAssignedToGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Checklist_CompletedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskChecklist''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Checklist_CompletedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskChecklist(strCompletedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Checklist_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskChecklist''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Checklist_CreatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskChecklist(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Checklist_UpdatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskChecklist''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Checklist_UpdatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskChecklist(strUpdatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Checklist_Task_Position'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskChecklist''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Checklist_Task_Position ON ' + QUOTENAME(@schemaName) + '.trnTaskChecklist(strTaskGUID, intPosition);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Checklist_Completed'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskChecklist''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Checklist_Completed ON ' + QUOTENAME(@schemaName) + '.trnTaskChecklist(bolIsCompleted);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Checklist_DueDate'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskChecklist''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Checklist_DueDate ON ' + QUOTENAME(@schemaName) + '.trnTaskChecklist(dtDueDate);
    END
END';
EXEC sp_executesql @sql;

-- trnTaskComments (plural) - tenant-side comments table (keeps compatibility with Task backend expectations)
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskComments'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.trnTaskComments (
        strCommentGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strTaskGUID UNIQUEIDENTIFIER NOT NULL,
        strParentCommentGUID UNIQUEIDENTIFIER NULL,
        strContent NVARCHAR(MAX) NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        intLikeCount INT DEFAULT 0,
        intThreadCount INT DEFAULT 0,
        bolIsPrivate BIT DEFAULT 0,
        dtUpdatedOn DATETIME2(7) NULL,
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_TaskComments_Task FOREIGN KEY (strTaskGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.trnTask(strTaskGUID),
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_TaskComments_Parent FOREIGN KEY (strParentCommentGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.trnTaskComments(strCommentGUID)
    )
END';
EXEC sp_executesql @sql;

-- Indexes for trnTaskComments
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskComments'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskComments_Task'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskComments''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskComments_Task ON ' + QUOTENAME(@schemaName) + '.trnTaskComments(strTaskGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskComments_Parent'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskComments''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskComments_Parent ON ' + QUOTENAME(@schemaName) + '.trnTaskComments(strParentCommentGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskComments_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskComments''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskComments_CreatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskComments(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskComments_UpdatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskComments''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskComments_UpdatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskComments(strUpdatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskComments_Task_CreatedOn'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskComments''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskComments_Task_CreatedOn ON ' + QUOTENAME(@schemaName) + '.trnTaskComments(strTaskGUID, dtCreatedOn DESC);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskComments_IsPrivate'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskComments''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskComments_IsPrivate ON ' + QUOTENAME(@schemaName) + '.trnTaskComments(bolIsPrivate);
    END
END';
EXEC sp_executesql @sql;

-- trnTaskActivityLog
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskActivityLog'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.trnTaskActivityLog (
        strTaskActivityLogGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strUserGUID UNIQUEIDENTIFIER NOT NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strModuleGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NULL,
        strEntityGUID UNIQUEIDENTIFIER NOT NULL,
        strEntityType NVARCHAR(100) NOT NULL,
        strActivityType NVARCHAR(50) NOT NULL,
        strDetails NVARCHAR(MAX) NULL,
        strIPAddress NVARCHAR(50) NULL,
        strUserAgent NVARCHAR(500) NULL,
        strUserSessionGUID UNIQUEIDENTIFIER NULL,
        strOldValue NVARCHAR(MAX) NULL,
        strNewValue NVARCHAR(MAX) NULL,
        dtActivityTime DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL
    )
END';
EXEC sp_executesql @sql;

-- Indexes for trnTaskActivityLog
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskActivityLog'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskActivityLog_Entity'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskActivityLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskActivityLog_Entity ON ' + QUOTENAME(@schemaName) + '.trnTaskActivityLog(strEntityGUID, dtActivityTime DESC);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskActivityLog_User'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskActivityLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskActivityLog_User ON ' + QUOTENAME(@schemaName) + '.trnTaskActivityLog(strUserGUID, dtActivityTime DESC);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskActivityLog_Group'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskActivityLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskActivityLog_Group ON ' + QUOTENAME(@schemaName) + '.trnTaskActivityLog(strGroupGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskActivityLog_Organization'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskActivityLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskActivityLog_Organization ON ' + QUOTENAME(@schemaName) + '.trnTaskActivityLog(strOrganizationGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskActivityLog_Module'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskActivityLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskActivityLog_Module ON ' + QUOTENAME(@schemaName) + '.trnTaskActivityLog(strModuleGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskActivityLog_Year'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskActivityLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskActivityLog_Year ON ' + QUOTENAME(@schemaName) + '.trnTaskActivityLog(strYearGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskActivityLog_UserSession'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskActivityLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskActivityLog_UserSession ON ' + QUOTENAME(@schemaName) + '.trnTaskActivityLog(strUserSessionGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskActivityLog_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskActivityLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskActivityLog_CreatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskActivityLog(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskActivityLog_ActivityType'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskActivityLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskActivityLog_ActivityType ON ' + QUOTENAME(@schemaName) + '.trnTaskActivityLog(strActivityType);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskActivityLog_EntityType'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskActivityLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskActivityLog_EntityType ON ' + QUOTENAME(@schemaName) + '.trnTaskActivityLog(strEntityType);
    END
END';
EXEC sp_executesql @sql;

-- trnTaskRecurrence
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskRecurrence'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.trnTaskRecurrence (
        strTaskRecurrenceGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strParentTaskGUID UNIQUEIDENTIFIER NOT NULL,
        strRecurrenceType NVARCHAR(20) NOT NULL,
        intRecurrenceInterval INT NOT NULL DEFAULT 1,
        strDaysOfWeek NVARCHAR(50) NULL,
        intDayOfMonth INT NULL,
        strWeekPattern NVARCHAR(10) NULL,
        strWeekDay NVARCHAR(10) NULL,
        intMonthOfYear INT NULL,
        dtStartDate DATETIME2(7) NOT NULL,
        dtEndDate DATETIME2(7) NULL,
        bolNoEndDate BIT NOT NULL DEFAULT 0,
        dtNextOccurrence DATETIME2(7) NULL,
        bolActive BIT NOT NULL DEFAULT 1,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        dtUpdatedOn DATETIME2(7) NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        strUpdatedByGUID UNIQUEIDENTIFIER NULL
    )
END';
EXEC sp_executesql @sql;

-- Indexes for trnTaskRecurrence
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskRecurrence'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskRecurrence_ParentTask'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskRecurrence''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskRecurrence_ParentTask ON ' + QUOTENAME(@schemaName) + '.trnTaskRecurrence(strParentTaskGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskRecurrence_NextOccurrence'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskRecurrence''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskRecurrence_NextOccurrence ON ' + QUOTENAME(@schemaName) + '.trnTaskRecurrence(dtNextOccurrence);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskRecurrence_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskRecurrence''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskRecurrence_CreatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskRecurrence(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskRecurrence_UpdatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskRecurrence''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskRecurrence_UpdatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskRecurrence(strUpdatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskRecurrence_Active'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskRecurrence''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskRecurrence_Active ON ' + QUOTENAME(@schemaName) + '.trnTaskRecurrence(bolActive);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskRecurrence_Type'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskRecurrence''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskRecurrence_Type ON ' + QUOTENAME(@schemaName) + '.trnTaskRecurrence(strRecurrenceType);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskRecurrence_Active_NextOcc'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskRecurrence''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskRecurrence_Active_NextOcc ON ' + QUOTENAME(@schemaName) + '.trnTaskRecurrence(bolActive, dtNextOccurrence);
    END
END';
EXEC sp_executesql @sql;

-- trnUserHourlyRate
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''trnUserHourlyRate'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.trnUserHourlyRate (
        strUserHourlyRateGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strUserGUID UNIQUEIDENTIFIER NOT NULL,
        strBoardGUID UNIQUEIDENTIFIER NOT NULL,
        decHourlyRate DECIMAL(18,2) NOT NULL,
        dEffectiveFrom DATE NOT NULL,
        dEffectiveTo DATE NULL,
        strCurrencyGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtUpdatedOn DATETIME2(7) NULL,
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_UserHourlyRate_Board FOREIGN KEY (strBoardGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.mstBoard(strBoardGUID) ON DELETE NO ACTION
    )
END';
EXEC sp_executesql @sql;

-- Indexes for trnUserHourlyRate
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnUserHourlyRate'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''UQ_' + @sanitizedOrgGUID + '_UserHourlyRate_UserBoardDate'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnUserHourlyRate''))
    BEGIN
        CREATE UNIQUE INDEX UQ_' + @sanitizedOrgGUID + '_UserHourlyRate_UserBoardDate ON ' + QUOTENAME(@schemaName) + '.trnUserHourlyRate(strUserGUID, strBoardGUID, dEffectiveFrom);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_UserHourlyRate_User'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnUserHourlyRate''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_UserHourlyRate_User ON ' + QUOTENAME(@schemaName) + '.trnUserHourlyRate(strUserGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_UserHourlyRate_Board'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnUserHourlyRate''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_UserHourlyRate_Board ON ' + QUOTENAME(@schemaName) + '.trnUserHourlyRate(strBoardGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_UserHourlyRate_EffectiveDates'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnUserHourlyRate''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_UserHourlyRate_EffectiveDates ON ' + QUOTENAME(@schemaName) + '.trnUserHourlyRate(dEffectiveFrom, dEffectiveTo);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_UserHourlyRate_Org'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnUserHourlyRate''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_UserHourlyRate_Org ON ' + QUOTENAME(@schemaName) + '.trnUserHourlyRate(strOrganizationGUID, strYearGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_UserHourlyRate_Currency'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnUserHourlyRate''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_UserHourlyRate_Currency ON ' + QUOTENAME(@schemaName) + '.trnUserHourlyRate(strCurrencyGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_UserHourlyRate_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnUserHourlyRate''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_UserHourlyRate_CreatedBy ON ' + QUOTENAME(@schemaName) + '.trnUserHourlyRate(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_UserHourlyRate_UpdatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnUserHourlyRate''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_UserHourlyRate_UpdatedBy ON ' + QUOTENAME(@schemaName) + '.trnUserHourlyRate(strUpdatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_UserHourlyRate_Covering'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnUserHourlyRate''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_UserHourlyRate_Covering ON ' + QUOTENAME(@schemaName) + '.trnUserHourlyRate(strUserGUID, strBoardGUID) INCLUDE (decHourlyRate, dEffectiveFrom, dEffectiveTo, strCurrencyGUID, strOrganizationGUID, strYearGUID, dtCreatedOn, strCreatedByGUID, dtUpdatedOn, strUpdatedByGUID);
    END
END';
EXEC sp_executesql @sql;

-- trnNotification
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''trnNotification'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.trnNotification (
        strNotificationGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strUserGUID UNIQUEIDENTIFIER NOT NULL,
        strFromUserGUID UNIQUEIDENTIFIER NULL,
        strTaskGUID UNIQUEIDENTIFIER NULL,
        strBoardGUID UNIQUEIDENTIFIER NULL,
        strNotificationType NVARCHAR(50) NOT NULL,
        strTitle NVARCHAR(200) NOT NULL,
        strMessage NVARCHAR(MAX) NOT NULL,
        bIsRead BIT NOT NULL DEFAULT 0,
        dReadOn DATETIME2(7) NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_Notification_Task FOREIGN KEY (strTaskGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.trnTask(strTaskGUID) ON DELETE NO ACTION,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_Notification_Board FOREIGN KEY (strBoardGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.mstBoard(strBoardGUID) ON DELETE NO ACTION
    )
END';
EXEC sp_executesql @sql;

-- Indexes for trnNotification
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnNotification'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Notification_User'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnNotification''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Notification_User ON ' + QUOTENAME(@schemaName) + '.trnNotification(strUserGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Notification_UserReadStatus'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnNotification''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Notification_UserReadStatus ON ' + QUOTENAME(@schemaName) + '.trnNotification(strUserGUID, bIsRead, dtCreatedOn);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Notification_Task'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnNotification''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Notification_Task ON ' + QUOTENAME(@schemaName) + '.trnNotification(strTaskGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Notification_Board'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnNotification''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Notification_Board ON ' + QUOTENAME(@schemaName) + '.trnNotification(strBoardGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Notification_Type'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnNotification''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Notification_Type ON ' + QUOTENAME(@schemaName) + '.trnNotification(strNotificationType);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Notification_CreatedOn'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnNotification''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Notification_CreatedOn ON ' + QUOTENAME(@schemaName) + '.trnNotification(dtCreatedOn DESC);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Notification_Org'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnNotification''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Notification_Org ON ' + QUOTENAME(@schemaName) + '.trnNotification(strOrganizationGUID, strYearGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Notification_FromUser'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnNotification''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Notification_FromUser ON ' + QUOTENAME(@schemaName) + '.trnNotification(strFromUserGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Notification_Organization'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnNotification''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Notification_Organization ON ' + QUOTENAME(@schemaName) + '.trnNotification(strOrganizationGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Notification_Year'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnNotification''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Notification_Year ON ' + QUOTENAME(@schemaName) + '.trnNotification(strYearGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_Notification_Covering'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnNotification''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_Notification_Covering ON ' + QUOTENAME(@schemaName) + '.trnNotification(strUserGUID) INCLUDE (strFromUserGUID, strTaskGUID, strBoardGUID, strNotificationType, strTitle, strMessage, bIsRead, dReadOn, dtCreatedOn, strOrganizationGUID, strYearGUID);
    END
END';
EXEC sp_executesql @sql;

-- Create Circular Foreign Keys after both tables exist
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTask'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
   AND EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskRecurrence'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = ''FK_' + @sanitizedOrgGUID + '_Task_ParentRecurrence'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.trnTask 
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_Task_ParentRecurrence 
        FOREIGN KEY (strParentTaskRecurrenceGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.trnTaskRecurrence(strTaskRecurrenceGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = ''FK_' + @sanitizedOrgGUID + '_TaskRecurrence_Task'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.trnTaskRecurrence 
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_TaskRecurrence_Task 
        FOREIGN KEY (strParentTaskGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.trnTask(strTaskGUID);
    END
END';
EXEC sp_executesql @sql;

-- trnTaskImport
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskImport'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.trnTaskImport (
        strTaskImportGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        strFileName NVARCHAR(255) NOT NULL,
        strFilePath NVARCHAR(500) NULL,
        strUploadedByGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        intTotalRows INT NOT NULL DEFAULT 0,
        intSuccessRows INT NOT NULL DEFAULT 0,
        intFailedRows INT NOT NULL DEFAULT 0,
        strImportStatus NVARCHAR(20) NOT NULL,
        strRemarks NVARCHAR(500) NULL,
        dtStartedOn DATETIME NULL,
        dtCompletedOn DATETIME NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL
    )
END';
EXEC sp_executesql @sql;

-- Indexes for trnTaskImport
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskImport'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskImport_Organization'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskImport''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskImport_Organization ON ' + QUOTENAME(@schemaName) + '.trnTaskImport(strOrganizationGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskImport_Status'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskImport''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskImport_Status ON ' + QUOTENAME(@schemaName) + '.trnTaskImport(strImportStatus);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskImport_CreatedOn'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskImport''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskImport_CreatedOn ON ' + QUOTENAME(@schemaName) + '.trnTaskImport(dtCreatedOn DESC);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskImport_UploadedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskImport''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskImport_UploadedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskImport(strUploadedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskImport_Year'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskImport''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskImport_Year ON ' + QUOTENAME(@schemaName) + '.trnTaskImport(strYearGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskImport_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskImport''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskImport_CreatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskImport(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskImport_UpdatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskImport''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskImport_UpdatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskImport(strUpdatedByGUID);
    END
END';
EXEC sp_executesql @sql;

-- trnTaskImportError
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskImportError'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.trnTaskImportError (
        strTaskImportErrorGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        strTaskImportGUID UNIQUEIDENTIFIER NOT NULL,
        intRowNumber INT NOT NULL,
        strColumnName NVARCHAR(100) NOT NULL,
        strColumnValue NVARCHAR(500) NULL,
        strErrorCode NVARCHAR(50) NOT NULL,
        strErrorMessage NVARCHAR(500) NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_TaskImportError_TaskImport FOREIGN KEY (strTaskImportGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.trnTaskImport(strTaskImportGUID) ON DELETE CASCADE
    )
END';
EXEC sp_executesql @sql;

-- Indexes for trnTaskImportError
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskImportError'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskImportError_TaskImport'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskImportError''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskImportError_TaskImport ON ' + QUOTENAME(@schemaName) + '.trnTaskImportError(strTaskImportGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskImportError_ErrorCode'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskImportError''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskImportError_ErrorCode ON ' + QUOTENAME(@schemaName) + '.trnTaskImportError(strErrorCode);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskImportError_CreatedBy'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskImportError''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskImportError_CreatedBy ON ' + QUOTENAME(@schemaName) + '.trnTaskImportError(strCreatedByGUID);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskImportError_ColumnName'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskImportError''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskImportError_ColumnName ON ' + QUOTENAME(@schemaName) + '.trnTaskImportError(strColumnName);
    END
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TaskImportError_Covering'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskImportError''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TaskImportError_Covering ON ' + QUOTENAME(@schemaName) + '.trnTaskImportError(strTaskImportGUID) INCLUDE (intRowNumber, strColumnName, strColumnValue, strErrorCode, strErrorMessage, strCreatedByGUID, dtCreatedOn);
    END
END';
EXEC sp_executesql @sql;

-- Stored Procedures for Task Reports
SET @sql = '
CREATE OR ALTER PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetBoardwiseDetailsReport
    @strBoardGUID NVARCHAR(50),
    @dtFromDate DATETIME2,
    @dtToDate DATETIME2,
    @strUserGUIDs NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserGuids TABLE (strUserGUID NVARCHAR(50));

    IF @strUserGUIDs IS NOT NULL AND @strUserGUIDs <> ''''
    BEGIN
        WITH CTE_UserGuids AS (
            SELECT VALUE AS strUserGUID
            FROM STRING_SPLIT(@strUserGUIDs, '','')
            WHERE TRIM(VALUE) <> ''''
        )
        INSERT INTO @UserGuids
        SELECT TRIM(strUserGUID) FROM CTE_UserGuids;
    END;

    WITH TaskTimerSummary AS (
        SELECT
            t.strTaskGUID,
            t.strTaskNo,
            t.strTitle AS TaskName,
            tt.strUserGUID,
            t.bolIsBillable,
            CAST(DATEDIFF(SECOND, tt.dtStartTime, tt.dtEndTime) AS DECIMAL(10, 2)) / 3600.0 AS Hours
        FROM
            ' + QUOTENAME(@schemaName) + '.trnTask t
        INNER JOIN
            ' + QUOTENAME(@schemaName) + '.trnTaskTimer tt ON t.strTaskGUID = tt.strTaskGUID
        WHERE
            t.strBoardGUID = @strBoardGUID
            AND tt.dtStartTime >= @dtFromDate
            AND tt.dtStartTime < DATEADD(DAY, 1, @dtToDate)
            AND tt.dtEndTime IS NOT NULL
            AND (
                (SELECT COUNT(*) FROM @UserGuids) = 0
                OR tt.strUserGUID IN (SELECT strUserGUID FROM @UserGuids)
            )
    ),
    TaskSummary AS (
        SELECT
            strTaskGUID,
            strTaskNo,
            TaskName,
            strUserGUID,
            SUM(CASE WHEN bolIsBillable = 1 THEN Hours ELSE 0 END) AS BillableHours,
            SUM(CASE WHEN bolIsBillable = 0 THEN Hours ELSE 0 END) AS NonBillableHours
        FROM TaskTimerSummary
        GROUP BY strTaskGUID, strTaskNo, TaskName, strUserGUID
    )
    SELECT
        strUserGUID,
        strTaskGUID,
        strTaskNo,
        TaskName,
        BillableHours,
        NonBillableHours
    FROM TaskSummary
    ORDER BY strUserGUID, strTaskNo;
END';
EXEC sp_executesql @sql;

SET @sql = '
CREATE OR ALTER PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetBoardwiseSummaryReport
    @strBoardGUID UNIQUEIDENTIFIER,
    @dtFromDate DATE,
    @dtToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    IF @strBoardGUID IS NULL
    BEGIN
        RAISERROR(''Board GUID cannot be null'', 16, 1);
        RETURN -1;
    END

    IF @dtFromDate IS NULL OR @dtToDate IS NULL
    BEGIN
        RAISERROR(''Date parameters cannot be null: @dtFromDate, @dtToDate'', 16, 1);
        RETURN -2;
    END

    IF @dtFromDate > @dtToDate
    BEGIN
        RAISERROR(''From date cannot be greater than To date'', 16, 1);
        RETURN -3;
    END

    BEGIN TRY
        ;WITH TaskTimerSummary AS
        (
            SELECT 
                t.strTaskGUID,
                t.strTaskNo AS intTaskNo,
                t.strTitle AS strTaskName,
                t.bolIsBillable,
                CASE 
                    WHEN tt.dtEndTime IS NOT NULL THEN
                        DATEDIFF(SECOND, tt.dtStartTime, tt.dtEndTime) / 3600.0
                    ELSE 
                        0
                END AS dblHours
            FROM ' + QUOTENAME(@schemaName) + '.trnTask t
            INNER JOIN ' + QUOTENAME(@schemaName) + '.trnTaskTimer tt ON t.strTaskGUID = tt.strTaskGUID
            WHERE t.strBoardGUID = @strBoardGUID
                AND tt.dtStartTime >= @dtFromDate
                AND tt.dtStartTime < DATEADD(DAY, 1, @dtToDate)
                AND tt.dtEndTime IS NOT NULL
        ),
        TaskSummary AS
        (
            SELECT 
                intTaskNo,
                strTaskName,
                SUM(CASE WHEN bolIsBillable = 1 THEN dblHours ELSE 0 END) AS dblBillableHours,
                SUM(CASE WHEN bolIsBillable = 0 THEN dblHours ELSE 0 END) AS dblNonBillableHours
            FROM TaskTimerSummary
            GROUP BY intTaskNo, strTaskName
        )
        SELECT 
            intTaskNo AS [Task No],
            strTaskName AS [Task Name],
            CAST(dblBillableHours AS DECIMAL(10,2)) AS [Billable Hours],
            CAST(dblNonBillableHours AS DECIMAL(10,2)) AS [Non-Billable Hours],
            0 AS SortOrder
        FROM TaskSummary

        UNION ALL

        SELECT 
            NULL AS [Task No],
            ''TOTAL'' AS [Task Name],
            CAST(SUM(dblBillableHours) AS DECIMAL(10,2)) AS [Billable Hours],
            CAST(SUM(dblNonBillableHours) AS DECIMAL(10,2)) AS [Non-Billable Hours],
            1 AS SortOrder
        FROM TaskSummary

        ORDER BY 
            SortOrder,
            [Task No];
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
        RETURN -99;
    END CATCH
END';
EXEC sp_executesql @sql;

SET @sql = '
CREATE OR ALTER PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetTicketWiseReport
    @strBoardGUID UNIQUEIDENTIFIER,
    @dtFromDate DATE,
    @dtToDate DATE,
    @strUserGUIDs NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @strBoardGUID IS NULL
    BEGIN
        RAISERROR(''Board GUID cannot be null'', 16, 1);
        RETURN -1;
    END

    IF @dtFromDate IS NULL OR @dtToDate IS NULL
    BEGIN
        RAISERROR(''Date parameters cannot be null: @dtFromDate, @dtToDate'', 16, 1);
        RETURN -2;
    END

    IF @dtFromDate > @dtToDate
    BEGIN
        RAISERROR(''From date cannot be greater than To date'', 16, 1);
        RETURN -3;
    END

    DECLARE @UserGuids TABLE (UserGuid UNIQUEIDENTIFIER);

    IF @strUserGUIDs IS NOT NULL AND LTRIM(RTRIM(@strUserGUIDs)) <> ''''
    BEGIN
        INSERT INTO @UserGuids (UserGuid)
        SELECT TRY_CAST(value AS UNIQUEIDENTIFIER)
        FROM STRING_SPLIT(@strUserGUIDs, '','')
        WHERE TRY_CAST(value AS UNIQUEIDENTIFIER) IS NOT NULL;
    END

    SELECT
        t.strTaskGUID AS [TaskGUID],
        t.strTaskNo AS [TicketNo],
        t.strTitle AS [TicketName],
        tt.strUserGUID AS [AssignToUserGUID],
        t.strStatus AS [Status],
        t.bolIsBillable AS [IsBillable],
        SUM(DATEDIFF(SECOND, tt.dtStartTime, tt.dtEndTime)) AS [TotalSeconds],
        CAST(SUM(DATEDIFF(SECOND, tt.dtStartTime, tt.dtEndTime)) / 3600.0 AS DECIMAL(18, 2)) AS [TotalHours]
    FROM ' + QUOTENAME(@schemaName) + '.trnTaskTimer tt
    INNER JOIN ' + QUOTENAME(@schemaName) + '.trnTask t ON t.strTaskGUID = tt.strTaskGUID
    WHERE t.strBoardGUID = @strBoardGUID
      AND tt.dtStartTime >= @dtFromDate
      AND tt.dtStartTime < DATEADD(DAY, 1, @dtToDate)
      AND tt.dtEndTime IS NOT NULL
      AND (
            @strUserGUIDs IS NULL
            OR EXISTS (SELECT 1 FROM @UserGuids u WHERE u.UserGuid = tt.strUserGUID)
          )
    GROUP BY t.strTaskGUID, t.strTaskNo, t.strTitle, tt.strUserGUID, t.strStatus, t.bolIsBillable
    ORDER BY t.strTaskNo, tt.strUserGUID;
END';
EXEC sp_executesql @sql;

-- =====================================
-- TASK ASSIGNMENT FEATURE MIGRATION
-- Multi-assignment support with completion rules
-- =====================================

-- Create TrnTaskAssignment table for multi-assignment support
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskAssignment'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.trnTaskAssignment (
        strTaskAssignmentGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        strTaskGUID UNIQUEIDENTIFIER NOT NULL,
        strAssignToGUID UNIQUEIDENTIFIER NOT NULL,
        strAssignToType VARCHAR(10) NOT NULL DEFAULT ''USER'',
        strAssignedByGUID UNIQUEIDENTIFIER NULL,
        dtAssignedOn DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        
        -- Constraints
        CONSTRAINT CK_' + @sanitizedOrgGUID + '_TrnTaskAssignment_strAssignToType 
        CHECK (strAssignToType IN (''USER'', ''TEAM'')),
        
        -- Foreign key relationships
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_TrnTaskAssignment_TrnTask 
        FOREIGN KEY (strTaskGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.trnTask(strTaskGUID) ON DELETE CASCADE
    )
END';
EXEC sp_executesql @sql;

-- Indexes for TrnTaskAssignment performance
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''trnTaskAssignment'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TrnTaskAssignment_TaskGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskAssignment''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TrnTaskAssignment_TaskGUID 
        ON ' + QUOTENAME(@schemaName) + '.trnTaskAssignment (strTaskGUID);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TrnTaskAssignment_AssignToGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskAssignment''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TrnTaskAssignment_AssignToGUID 
        ON ' + QUOTENAME(@schemaName) + '.trnTaskAssignment (strAssignToGUID);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_TrnTaskAssignment_AssignedByGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskAssignment''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_TrnTaskAssignment_AssignedByGUID 
        ON ' + QUOTENAME(@schemaName) + '.trnTaskAssignment (strAssignedByGUID);
    END
    
    -- Unique constraint to prevent duplicate assignments
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''UX_' + @sanitizedOrgGUID + '_TrnTaskAssignment_TaskGUID_AssignToGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.trnTaskAssignment''))
    BEGIN
        CREATE UNIQUE INDEX UX_' + @sanitizedOrgGUID + '_TrnTaskAssignment_TaskGUID_AssignToGUID 
        ON ' + QUOTENAME(@schemaName) + '.trnTaskAssignment (strTaskGUID, strAssignToGUID);
    END
END';
EXEC sp_executesql @sql;

-- Note: Keep legacy assignment columns for backward compatibility during transition
-- These can be dropped in future migration after full migration to new assignment system:
-- ALTER TABLE TrnTask DROP COLUMN strAssignedToGUID;
-- ALTER TABLE TrnTask DROP COLUMN strAssignedByGUID;

-- ================================================
-- TASK MODULE STORED PROCEDURES
-- ================================================

-- =============================================
-- Stored Procedure: sp_GetBillableDetailReport
-- Description: Billable detail report with task-level breakdown, billable working hours, amount and entry counts
-- =============================================

SET @sql = '
IF EXISTS (SELECT * FROM sys.objects WHERE type = ''P'' AND name = ''sp_GetBillableDetailReport'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    DROP PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetBillableDetailReport
END';
EXEC sp_executesql @sql;

SET @sql = '
CREATE PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetBillableDetailReport
    @strBoardGUID UNIQUEIDENTIFIER,
    @strUserGUIDs NVARCHAR(MAX) = NULL,
    @dtFromDate DATE,
    @dtToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Parameter validation
    IF @strBoardGUID IS NULL
    BEGIN
        RAISERROR(''Board GUID cannot be null'', 16, 1);
        RETURN -1;
    END

    IF @dtFromDate IS NULL OR @dtToDate IS NULL
    BEGIN
        RAISERROR(''Date parameters cannot be null: @dtFromDate, @dtToDate'', 16, 1);
        RETURN -2;
    END

    IF @dtFromDate > @dtToDate
    BEGIN
        RAISERROR(''From date cannot be greater than To date'', 16, 1);
        RETURN -3;
    END

    -- Parse user GUIDs from comma-separated string
    DECLARE @UserGuids TABLE (UserGuid UNIQUEIDENTIFIER);

    IF @strUserGUIDs IS NOT NULL AND LTRIM(RTRIM(@strUserGUIDs)) <> ''''
    BEGIN
        INSERT INTO @UserGuids (UserGuid)
        SELECT TRY_CAST(value AS UNIQUEIDENTIFIER)
        FROM STRING_SPLIT(@strUserGUIDs, '','')
        WHERE TRY_CAST(value AS UNIQUEIDENTIFIER) IS NOT NULL;
    END

    ;WITH TimerRows AS
    (
        SELECT
            tt.strUserGUID,
            t.strBoardGUID,
            CAST(tt.dtStartTime AS DATE) AS WorkDate,
            t.strTaskGUID,
            t.strTitle AS TaskTitle,
            uhr.decHourlyRate,
            uhr.strCurrencyGUID,
            DATEDIFF(SECOND, tt.dtStartTime, ISNULL(tt.dtEndTime, SYSUTCDATETIME())) AS TotalSeconds
        FROM ' + QUOTENAME(@schemaName) + '.trnTaskTimer tt
        INNER JOIN ' + QUOTENAME(@schemaName) + '.trnTask t ON t.strTaskGUID = tt.strTaskGUID
        LEFT JOIN ' + QUOTENAME(@schemaName) + '.trnUserHourlyRate uhr 
            ON uhr.strUserGUID = tt.strUserGUID 
            AND uhr.strBoardGUID = t.strBoardGUID
            AND tt.dtStartTime >= uhr.dEffectiveFrom
            AND (uhr.dEffectiveTo IS NULL OR tt.dtStartTime <= uhr.dEffectiveTo)
        WHERE t.strBoardGUID = @strBoardGUID
          AND t.bolIsBillable = 1  -- Only billable tasks
          AND tt.dtStartTime >= @dtFromDate
          AND tt.dtStartTime < DATEADD(DAY, 1, @dtToDate)
          AND (
                @strUserGUIDs IS NULL
                OR EXISTS (SELECT 1 FROM @UserGuids u WHERE u.UserGuid = tt.strUserGUID)
              )
    )
    SELECT DISTINCT
        strUserGUID AS [UserGUID],
        strBoardGUID AS [BoardGUID],
        WorkDate AS [WorkDate],
        strTaskGUID AS [TaskGUID],
        TaskTitle AS [TaskTitle],
        COUNT(*) OVER (PARTITION BY strUserGUID, strBoardGUID, WorkDate, strTaskGUID) AS [EntryCount],
        CAST(SUM(TotalSeconds) OVER (PARTITION BY strUserGUID, strBoardGUID, WorkDate, strTaskGUID) AS BIGINT) AS [TotalSeconds],
        -- Get hourly rate (take first non-null rate for this task''s date and user)
        MAX(decHourlyRate) OVER (PARTITION BY strUserGUID, strBoardGUID, WorkDate, strTaskGUID) AS [HourlyRate],
        -- Calculate billable amount
        CAST(
            CASE 
                WHEN MAX(decHourlyRate) OVER (PARTITION BY strUserGUID, strBoardGUID, WorkDate, strTaskGUID) IS NOT NULL
                THEN (SUM(TotalSeconds) OVER (PARTITION BY strUserGUID, strBoardGUID, WorkDate, strTaskGUID) / 3600.0 
                    * MAX(decHourlyRate) OVER (PARTITION BY strUserGUID, strBoardGUID, WorkDate, strTaskGUID))
                ELSE 0
            END 
        AS DECIMAL(18, 2)) AS [BillableAmount],
        -- Get the currency for this task (should be same for a user/board/task)
        MAX(strCurrencyGUID) OVER (PARTITION BY strUserGUID, strBoardGUID, WorkDate, strTaskGUID) AS [CurrencyGUID]
    FROM TimerRows
    ORDER BY WorkDate DESC, strUserGUID, strBoardGUID, strTaskGUID;
END';
EXEC sp_executesql @sql;

-- =============================================
-- Stored Procedure: sp_GetBillableSummaryReport
-- Description: Billable summary report with billable working hours, amount and task counts by user/board/date
-- =============================================

SET @sql = '
IF EXISTS (SELECT * FROM sys.objects WHERE type = ''P'' AND name = ''sp_GetBillableSummaryReport'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    DROP PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetBillableSummaryReport
END';
EXEC sp_executesql @sql;

SET @sql = '
CREATE PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetBillableSummaryReport
    @strBoardGUID UNIQUEIDENTIFIER,
    @strUserGUIDs NVARCHAR(MAX) = NULL,
    @dtFromDate DATE,
    @dtToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Parameter validation
    IF @strBoardGUID IS NULL
    BEGIN
        RAISERROR(''Board GUID cannot be null'', 16, 1);
        RETURN -1;
    END

    IF @dtFromDate IS NULL OR @dtToDate IS NULL
    BEGIN
        RAISERROR(''Date parameters cannot be null: @dtFromDate, @dtToDate'', 16, 1);
        RETURN -2;
    END

    IF @dtFromDate > @dtToDate
    BEGIN
        RAISERROR(''From date cannot be greater than To date'', 16, 1);
        RETURN -3;
    END

    -- Parse user GUIDs from comma-separated string
    DECLARE @UserGuids TABLE (UserGuid UNIQUEIDENTIFIER);

    IF @strUserGUIDs IS NOT NULL AND LTRIM(RTRIM(@strUserGUIDs)) <> ''''
    BEGIN
        INSERT INTO @UserGuids (UserGuid)
        SELECT TRY_CAST(value AS UNIQUEIDENTIFIER)
        FROM STRING_SPLIT(@strUserGUIDs, '','')
        WHERE TRY_CAST(value AS UNIQUEIDENTIFIER) IS NOT NULL;
    END

    ;WITH TimerRows AS
    (
        SELECT
            tt.strUserGUID,
            t.strBoardGUID,
            CAST(tt.dtStartTime AS DATE) AS WorkDate,
            t.strTaskGUID,
            t.bolIsBillable,
            uhr.decHourlyRate,
            uhr.strCurrencyGUID,
            DATEDIFF(SECOND, tt.dtStartTime, ISNULL(tt.dtEndTime, SYSUTCDATETIME())) AS TotalSeconds
        FROM ' + QUOTENAME(@schemaName) + '.trnTaskTimer tt
        INNER JOIN ' + QUOTENAME(@schemaName) + '.trnTask t ON t.strTaskGUID = tt.strTaskGUID
        LEFT JOIN ' + QUOTENAME(@schemaName) + '.trnUserHourlyRate uhr 
            ON uhr.strUserGUID = tt.strUserGUID 
            AND uhr.strBoardGUID = t.strBoardGUID
            AND tt.dtStartTime >= uhr.dEffectiveFrom
            AND (uhr.dEffectiveTo IS NULL OR tt.dtStartTime <= uhr.dEffectiveTo)
        WHERE t.strBoardGUID = @strBoardGUID
          AND t.bolIsBillable = 1  -- Only billable tasks
          AND tt.dtStartTime >= @dtFromDate
          AND tt.dtStartTime < DATEADD(DAY, 1, @dtToDate)
          AND (
                @strUserGUIDs IS NULL
                OR EXISTS (SELECT 1 FROM @UserGuids u WHERE u.UserGuid = tt.strUserGUID)
              )
    )
    SELECT
        strUserGUID AS [UserGUID],
        strBoardGUID AS [BoardGUID],
        WorkDate AS [WorkDate],
        COUNT(DISTINCT strTaskGUID) AS [BillableTaskCount],
        COUNT(DISTINCT CASE WHEN decHourlyRate IS NULL THEN strTaskGUID END) AS [TasksWithoutRateCount],
        CAST(SUM(TotalSeconds) AS BIGINT) AS [TotalBillableSeconds],
        -- Calculate billable amount (Total hours * hourly rate)
        -- For tasks with rate, calculate amount; for tasks without rate, amount is 0
        CAST(
            CASE 
                WHEN COUNT(CASE WHEN decHourlyRate IS NOT NULL THEN strTaskGUID END) > 0
                THEN SUM(CASE 
                    WHEN decHourlyRate IS NOT NULL 
                    THEN TotalSeconds / 3600.0 * decHourlyRate
                    ELSE 0
                END)
                ELSE 0
            END 
        AS DECIMAL(18, 2)) AS [BillableAmount],
        -- Get the currency from one of the rated tasks (should be same for a user/board)
        MAX(strCurrencyGUID) AS [CurrencyGUID]
    FROM TimerRows
    GROUP BY strUserGUID, strBoardGUID, WorkDate
    ORDER BY WorkDate DESC, strUserGUID, strBoardGUID;
END';
EXEC sp_executesql @sql;

-- =============================================
-- Stored Procedure: sp_GetBoardwiseDetailsReport
-- Description: Get user-wise and task-wise billable and non-billable hours for a specified board and date range
-- =============================================

SET @sql = '
IF EXISTS (SELECT * FROM sys.objects WHERE type = ''P'' AND name = ''sp_GetBoardwiseDetailsReport'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    DROP PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetBoardwiseDetailsReport
END';
EXEC sp_executesql @sql;

SET @sql = '
CREATE PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetBoardwiseDetailsReport
    @strBoardGUID NVARCHAR(50),
    @dtFromDate DATETIME2,
    @dtToDate DATETIME2,
    @strUserGUIDs NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Create table variable to hold parsed user GUIDs if provided
    DECLARE @UserGuids TABLE (strUserGUID NVARCHAR(50));
    
    -- Parse user GUIDs if provided
    IF @strUserGUIDs IS NOT NULL AND @strUserGUIDs <> ''''
    BEGIN
        -- Split comma-separated GUIDs and insert into table variable
        WITH CTE_UserGuids AS (
            SELECT VALUE AS strUserGUID
            FROM STRING_SPLIT(@strUserGUIDs, '','')
            WHERE TRIM(VALUE) <> ''''
        )
        INSERT INTO @UserGuids
        SELECT TRIM(strUserGUID) FROM CTE_UserGuids;
    END;

    -- Main query with CTEs
    WITH TaskTimerSummary AS (
        SELECT
            t.strTaskGUID,
            t.strTaskNo,
            t.strTitle AS TaskName,
            tt.strUserGUID,
            t.bolIsBillable,
            -- Calculate hours from seconds
            CAST(DATEDIFF(SECOND, tt.dtStartTime, tt.dtEndTime) AS DECIMAL(10, 2)) / 3600.0 AS Hours
        FROM
            ' + QUOTENAME(@schemaName) + '.trnTask t
        INNER JOIN
            ' + QUOTENAME(@schemaName) + '.trnTaskTimer tt ON t.strTaskGUID = tt.strTaskGUID
        WHERE
            t.strBoardGUID = @strBoardGUID
            AND tt.dtStartTime >= @dtFromDate
            AND tt.dtStartTime < DATEADD(DAY, 1, @dtToDate) -- Include full end date
            AND tt.dtEndTime IS NOT NULL -- Only completed timers
            -- Filter by user GUIDs if provided
            AND (
                (SELECT COUNT(*) FROM @UserGuids) = 0
                OR tt.strUserGUID IN (SELECT strUserGUID FROM @UserGuids)
            )
    ),
    TaskSummary AS (
        SELECT
            strTaskGUID,
            strTaskNo,
            TaskName,
            strUserGUID,
            SUM(CASE WHEN bolIsBillable = 1 THEN Hours ELSE 0 END) AS BillableHours,
            SUM(CASE WHEN bolIsBillable = 0 THEN Hours ELSE 0 END) AS NonBillableHours
        FROM
            TaskTimerSummary
        GROUP BY
            strTaskGUID, strTaskNo, TaskName, strUserGUID
    )
    SELECT
        strUserGUID,
        strTaskGUID,
        strTaskNo,
        TaskName,
        BillableHours,
        NonBillableHours
    FROM
        TaskSummary
    ORDER BY
        strUserGUID,
        strTaskNo;
END';
EXEC sp_executesql @sql;

-- =============================================
-- Stored Procedure: sp_GetBoardwiseSummaryReport
-- Description: Generates a boardwise summary report showing billable and non-billable hours per task
-- =============================================

SET @sql = '
IF EXISTS (SELECT * FROM sys.objects WHERE type = ''P'' AND name = ''sp_GetBoardwiseSummaryReport'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    DROP PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetBoardwiseSummaryReport
END';
EXEC sp_executesql @sql;

SET @sql = '
CREATE PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetBoardwiseSummaryReport
    @strBoardGUID UNIQUEIDENTIFIER,
    @strBoardSectionGUID UNIQUEIDENTIFIER = NULL,
    @strBoardSubModuleGUID UNIQUEIDENTIFIER = NULL,
    @dtFromDate DATE,
    @dtToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Input validation
    IF @strBoardGUID IS NULL
    BEGIN
        RAISERROR(''Board GUID cannot be null'', 16, 1);
        RETURN -1;
    END
    
    IF @dtFromDate IS NULL OR @dtToDate IS NULL
    BEGIN
        RAISERROR(''Date parameters cannot be null: @dtFromDate, @dtToDate'', 16, 1);
        RETURN -2;
    END
    
    IF @dtFromDate > @dtToDate
    BEGIN
        RAISERROR(''From date cannot be greater than To date'', 16, 1);
        RETURN -3;
    END
    
    BEGIN TRY
        -- Main query to get task-wise billable and non-billable hours
        ;WITH TaskTimerSummary AS
        (
            SELECT 
                t.strTaskGUID,
                t.strTaskNo AS intTaskNo,
                t.strTitle AS strTaskName,
                tvp.strBoardSectionGUID,
                sec.strName AS strBoardSectionName,
                t.strBoardSubModuleGUID,
                subModule.strName AS strBoardSubModuleName,
                t.strTicketKey,
                t.strTicketUrl,
                t.strTicketSource,
                t.bolIsBillable,
                -- Calculate hours from dtStartTime and dtEndTime
                CASE 
                    WHEN tt.dtEndTime IS NOT NULL THEN
                        DATEDIFF(SECOND, tt.dtStartTime, tt.dtEndTime) / 3600.0
                    ELSE 
                        0
                END AS dblHours
            FROM ' + QUOTENAME(@schemaName) + '.trnTask t
            INNER JOIN ' + QUOTENAME(@schemaName) + '.trnTaskTimer tt ON t.strTaskGUID = tt.strTaskGUID
            OUTER APPLY (
                SELECT TOP 1 tvpInner.strBoardSectionGUID
                FROM ' + QUOTENAME(@schemaName) + '.trnTaskViewPosition tvpInner
                WHERE tvpInner.strTaskGUID = t.strTaskGUID
                ORDER BY ISNULL(tvpInner.dtUpdatedOn, tvpInner.dtCreatedOn) DESC
            ) tvp
            LEFT JOIN ' + QUOTENAME(@schemaName) + '.mstBoardSection sec ON tvp.strBoardSectionGUID = sec.strBoardSectionGUID
            LEFT JOIN ' + QUOTENAME(@schemaName) + '.mstBoardSubModule subModule ON t.strBoardSubModuleGUID = subModule.strBoardSubModuleGUID
            WHERE t.strBoardGUID = @strBoardGUID
                AND (@strBoardSectionGUID IS NULL OR tvp.strBoardSectionGUID = @strBoardSectionGUID)
                AND (@strBoardSubModuleGUID IS NULL OR t.strBoardSubModuleGUID = @strBoardSubModuleGUID)
                AND tt.dtStartTime >= @dtFromDate
                AND tt.dtStartTime < DATEADD(DAY, 1, @dtToDate)  -- Include full end date
                AND tt.dtEndTime IS NOT NULL  -- Only completed timers
        ),
        TaskSummary AS
        (
            SELECT 
                strTaskGUID,
                intTaskNo,
                strTaskName,
                strBoardSectionGUID,
                strBoardSectionName,
                strBoardSubModuleGUID,
                strBoardSubModuleName,
                strTicketKey,
                strTicketUrl,
                strTicketSource,
                SUM(CASE WHEN bolIsBillable = 1 THEN dblHours ELSE 0 END) AS dblBillableHours,
                SUM(CASE WHEN bolIsBillable = 0 THEN dblHours ELSE 0 END) AS dblNonBillableHours
            FROM TaskTimerSummary
            GROUP BY strTaskGUID, intTaskNo, strTaskName, strBoardSectionGUID, strBoardSectionName, strBoardSubModuleGUID, strBoardSubModuleName, strTicketKey, strTicketUrl, strTicketSource
        )
        SELECT 
            strTaskGUID AS [Task GUID],
            intTaskNo AS [Task No],
            strTaskName AS [Task Name],
            strBoardSectionGUID AS [Module GUID],
            strBoardSectionName AS [Module],
            strBoardSubModuleGUID AS [Sub Module GUID],
            strBoardSubModuleName AS [Sub Module],
            strTicketKey AS [Ticket Key],
            strTicketUrl AS [Ticket URL],
            strTicketSource AS [Ticket Source],
            CAST(dblBillableHours AS DECIMAL(10,2)) AS [Billable Hours],
            CAST(dblNonBillableHours AS DECIMAL(10,2)) AS [Non-Billable Hours],
            0 AS SortOrder
        FROM TaskSummary
        
        UNION ALL
        
        -- Total row
        SELECT 
            NULL AS [Task GUID],
            NULL AS [Task No],
            ''TOTAL'' AS [Task Name],
            NULL AS [Module GUID],
            NULL AS [Module],
            NULL AS [Sub Module GUID],
            NULL AS [Sub Module],
            NULL AS [Ticket Key],
            NULL AS [Ticket URL],
            NULL AS [Ticket Source],
            CAST(SUM(dblBillableHours) AS DECIMAL(10,2)) AS [Billable Hours],
            CAST(SUM(dblNonBillableHours) AS DECIMAL(10,2)) AS [Non-Billable Hours],
            1 AS SortOrder
        FROM TaskSummary
        
        ORDER BY 
            SortOrder,
            [Task No];
        
    END TRY
    BEGIN CATCH
        -- Error handling
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
        RETURN -99;
    END CATCH
END';
EXEC sp_executesql @sql;

-- =============================================
-- Stored Procedure: sp_GetDailyWorkSummaryReport
-- Description: Daily work summary report with total working minutes by user/board/date
-- =============================================

SET @sql = '
IF EXISTS (SELECT * FROM sys.objects WHERE type = ''P'' AND name = ''sp_GetDailyWorkSummaryReport'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    DROP PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetDailyWorkSummaryReport
END';
EXEC sp_executesql @sql;

SET @sql = '
CREATE PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetDailyWorkSummaryReport
    @strBoardGUID UNIQUEIDENTIFIER,
    @strUserGUIDs NVARCHAR(MAX) = NULL,
    @dtFromDate DATE,
    @dtToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    IF @strBoardGUID IS NULL
    BEGIN
        RAISERROR(''Board GUID cannot be null'', 16, 1);
        RETURN -1;
    END

    IF @dtFromDate IS NULL OR @dtToDate IS NULL
    BEGIN
        RAISERROR(''Date parameters cannot be null: @dtFromDate, @dtToDate'', 16, 1);
        RETURN -2;
    END

    IF @dtFromDate > @dtToDate
    BEGIN
        RAISERROR(''From date cannot be greater than To date'', 16, 1);
        RETURN -3;
    END

    DECLARE @UserGuids TABLE (UserGuid UNIQUEIDENTIFIER);

    IF @strUserGUIDs IS NOT NULL AND LTRIM(RTRIM(@strUserGUIDs)) <> ''''
    BEGIN
        INSERT INTO @UserGuids (UserGuid)
        SELECT TRY_CAST(value AS UNIQUEIDENTIFIER)
        FROM STRING_SPLIT(@strUserGUIDs, '','')
        WHERE TRY_CAST(value AS UNIQUEIDENTIFIER) IS NOT NULL;
    END

    ;WITH TimerRows AS
    (
        SELECT
            tt.strUserGUID,
            t.strBoardGUID,
            CAST(tt.dtStartTime AS DATE) AS WorkDate,
            t.strTaskGUID,
            t.bolIsBillable,
            DATEDIFF(SECOND, tt.dtStartTime, ISNULL(tt.dtEndTime, SYSUTCDATETIME())) AS TotalSeconds
        FROM ' + QUOTENAME(@schemaName) + '.trnTaskTimer tt
        INNER JOIN ' + QUOTENAME(@schemaName) + '.trnTask t ON t.strTaskGUID = tt.strTaskGUID
        WHERE t.strBoardGUID = @strBoardGUID
          AND tt.dtStartTime >= @dtFromDate
          AND tt.dtStartTime < DATEADD(DAY, 1, @dtToDate)
          AND (
                @strUserGUIDs IS NULL
                OR EXISTS (SELECT 1 FROM @UserGuids u WHERE u.UserGuid = tt.strUserGUID)
              )
    )
    SELECT
        strUserGUID AS [UserGUID],
        strBoardGUID AS [BoardGUID],
        WorkDate AS [WorkDate],
        COUNT(DISTINCT strTaskGUID) AS [TotalTasks],
        COUNT(DISTINCT CASE WHEN bolIsBillable = 1 THEN strTaskGUID END) AS [BillableTasks],
        COUNT(DISTINCT CASE WHEN bolIsBillable = 0 THEN strTaskGUID END) AS [NonBillableTasks],
        CAST(SUM(TotalSeconds) / 60.0 AS DECIMAL(18, 2)) AS [TotalMinutes],
        CAST(SUM(TotalSeconds) AS BIGINT) AS [TotalSeconds]
    FROM TimerRows
    GROUP BY strUserGUID, strBoardGUID, WorkDate
    ORDER BY WorkDate, strUserGUID, strBoardGUID;
END';
EXEC sp_executesql @sql;

-- =============================================
-- Stored Procedure: sp_GetTicketWiseReport
-- Description: Generates ticket-wise report showing task info, assignee, billable flag, and total hours
-- =============================================

SET @sql = '
IF EXISTS (SELECT * FROM sys.objects WHERE type = ''P'' AND name = ''sp_GetTicketWiseReport'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    DROP PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetTicketWiseReport
END';
EXEC sp_executesql @sql;

SET @sql = '
CREATE PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetTicketWiseReport
    @strBoardGUID UNIQUEIDENTIFIER,
    @dtFromDate DATE,
    @dtToDate DATE,
    @strUserGUIDs NVARCHAR(MAX) = NULL,
    @strStatusFilter NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @strBoardGUID IS NULL
    BEGIN
        RAISERROR(''Board GUID cannot be null'', 16, 1);
        RETURN -1;
    END

    IF @dtFromDate IS NULL OR @dtToDate IS NULL
    BEGIN
        RAISERROR(''Date parameters cannot be null: @dtFromDate, @dtToDate'', 16, 1);
        RETURN -2;
    END

    IF @dtFromDate > @dtToDate
    BEGIN
        RAISERROR(''From date cannot be greater than To date'', 16, 1);
        RETURN -3;
    END

    DECLARE @UserGuids TABLE (UserGuid UNIQUEIDENTIFIER);
    DECLARE @StatusFilters TABLE (StatusValue NVARCHAR(50));

    IF @strUserGUIDs IS NOT NULL AND LTRIM(RTRIM(@strUserGUIDs)) <> ''''
    BEGIN
        INSERT INTO @UserGuids (UserGuid)
        SELECT TRY_CAST(value AS UNIQUEIDENTIFIER)
        FROM STRING_SPLIT(@strUserGUIDs, '','')
        WHERE TRY_CAST(value AS UNIQUEIDENTIFIER) IS NOT NULL;
    END

    IF @strStatusFilter IS NOT NULL AND LTRIM(RTRIM(@strStatusFilter)) <> ''''
    BEGIN
        INSERT INTO @StatusFilters (StatusValue)
        SELECT LTRIM(RTRIM(value))
        FROM STRING_SPLIT(@strStatusFilter, '','')
        WHERE LTRIM(RTRIM(value)) <> '''';
    END

    SELECT
        t.strTaskGUID AS [TaskGUID],
        t.strTaskNo AS [TicketNo],
        t.strTitle AS [TicketName],
        tt.strUserGUID AS [AssignToUserGUID],
        t.strStatus AS [Status],
        t.bolIsBillable AS [IsBillable],
        SUM(DATEDIFF(SECOND, tt.dtStartTime, tt.dtEndTime)) AS [TotalSeconds],
        CAST(SUM(DATEDIFF(SECOND, tt.dtStartTime, tt.dtEndTime)) / 3600.0 AS DECIMAL(18, 2)) AS [TotalHours]
    FROM ' + QUOTENAME(@schemaName) + '.trnTaskTimer tt
    INNER JOIN ' + QUOTENAME(@schemaName) + '.trnTask t ON t.strTaskGUID = tt.strTaskGUID
    WHERE t.strBoardGUID = @strBoardGUID
      AND tt.dtStartTime >= @dtFromDate
      AND tt.dtStartTime < DATEADD(DAY, 1, @dtToDate)
      AND tt.dtEndTime IS NOT NULL
      AND (
            @strUserGUIDs IS NULL
            OR EXISTS (SELECT 1 FROM @UserGuids u WHERE u.UserGuid = tt.strUserGUID)
          )
      AND (
            @strStatusFilter IS NULL
            OR EXISTS (SELECT 1 FROM @StatusFilters s WHERE s.StatusValue = t.strStatus)
          )
    GROUP BY t.strTaskGUID, t.strTaskNo, t.strTitle, tt.strUserGUID, t.strStatus, t.bolIsBillable
    ORDER BY t.strTaskNo, tt.strUserGUID;
END';
EXEC sp_executesql @sql;

-- =============================================
-- Stored Procedure: sp_GetUserPerformanceReport
-- Description: User performance report with task details, user info, and calculated working hours
-- =============================================

SET @sql = '
IF EXISTS (SELECT * FROM sys.objects WHERE type = ''P'' AND name = ''sp_GetUserPerformanceReport'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    DROP PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetUserPerformanceReport
END';
EXEC sp_executesql @sql;

SET @sql = '
CREATE PROCEDURE ' + QUOTENAME(@schemaName) + '.sp_GetUserPerformanceReport
    @strBoardGUID UNIQUEIDENTIFIER = NULL,
    @strBoardSectionGUID UNIQUEIDENTIFIER = NULL,
    @strBoardSubModuleGUID UNIQUEIDENTIFIER = NULL,
    @strUserGUIDs NVARCHAR(MAX) = NULL,
    @dtFromDate DATE,
    @dtToDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Parameter validation
    IF @dtFromDate IS NULL OR @dtToDate IS NULL
    BEGIN
        RAISERROR(''Date parameters cannot be null: @dtFromDate, @dtToDate'', 16, 1);
        RETURN -1;
    END

    IF @dtFromDate > @dtToDate
    BEGIN
        RAISERROR(''From date cannot be greater than To date'', 16, 1);
        RETURN -2;
    END

    -- Parse user GUIDs from comma-separated string
    DECLARE @UserGuids TABLE (UserGuid UNIQUEIDENTIFIER);

    IF @strUserGUIDs IS NOT NULL AND LTRIM(RTRIM(@strUserGUIDs)) <> ''''
    BEGIN
        INSERT INTO @UserGuids (UserGuid)
        SELECT TRY_CAST(value AS UNIQUEIDENTIFIER)
        FROM STRING_SPLIT(@strUserGUIDs, '','')
        WHERE TRY_CAST(value AS UNIQUEIDENTIFIER) IS NOT NULL;
    END

    ;WITH TaskTimerData AS
    (
        SELECT
            tt.strUserGUID,
            t.strTaskGUID,
            t.strTaskNo,
            t.strTitle AS strTaskTitle,
            t.strTicketKey,
            t.strTicketUrl,
            t.strTicketSource,
            t.strBoardGUID,
            t.strBoardSubModuleGUID,
            t.bolIsBillable,
            tvp.strBoardSectionGUID,
            DATEDIFF(SECOND, tt.dtStartTime, tt.dtEndTime) AS TotalSeconds
        FROM ' + QUOTENAME(@schemaName) + '.trnTaskTimer tt
        INNER JOIN ' + QUOTENAME(@schemaName) + '.trnTask t ON t.strTaskGUID = tt.strTaskGUID
        LEFT JOIN ' + QUOTENAME(@schemaName) + '.trnTaskViewPosition tvp ON tvp.strTaskGUID = t.strTaskGUID
        WHERE tt.dtStartTime >= @dtFromDate
          AND tt.dtStartTime < DATEADD(DAY, 1, @dtToDate)
          AND tt.dtEndTime IS NOT NULL -- Only completed timers
          AND (
                @strBoardGUID IS NULL 
                OR t.strBoardGUID = @strBoardGUID
              )
          AND (
                @strBoardSectionGUID IS NULL 
                OR tvp.strBoardSectionGUID = @strBoardSectionGUID
              )
          AND (
                @strBoardSubModuleGUID IS NULL 
                OR t.strBoardSubModuleGUID = @strBoardSubModuleGUID
              )
          AND (
                @strUserGUIDs IS NULL
                OR EXISTS (SELECT 1 FROM @UserGuids u WHERE u.UserGuid = tt.strUserGUID)
              )
    ),
    AggregatedData AS
    (
        SELECT
            ttd.strUserGUID,
            ttd.strTaskGUID,
            ttd.strTaskNo,
            ttd.strTaskTitle,
            ttd.strTicketKey,
            ttd.strTicketUrl,
            ttd.strTicketSource,
            ttd.strBoardGUID,
            ttd.strBoardSectionGUID,
            ttd.strBoardSubModuleGUID,
            ttd.bolIsBillable,
            COUNT(*) AS intTotalTimerCount,
            SUM(ttd.TotalSeconds) AS intTotalSeconds
        FROM TaskTimerData ttd
        GROUP BY 
            ttd.strUserGUID, ttd.strTaskGUID, ttd.strTaskNo, ttd.strTaskTitle,
            ttd.strTicketKey, ttd.strTicketUrl, ttd.strTicketSource,
            ttd.strBoardGUID, ttd.strBoardSectionGUID, ttd.strBoardSubModuleGUID, ttd.bolIsBillable
    )
    SELECT 
        ad.strUserGUID AS [UserGUID],
        NULL AS [UserName], -- Will be populated by service layer from master context
        ad.strTaskNo AS [TaskNo],
        ad.strTaskGUID AS [TaskGUID],
        ad.strTaskTitle AS [TaskTitle],
        ad.strTicketKey AS [TicketKey],
        ad.strTicketUrl AS [TicketUrl],
        ad.strTicketSource AS [TicketSource],
        ad.strBoardGUID AS [BoardGUID],
        b.strName AS [BoardName],
        ad.strBoardSectionGUID AS [BoardSectionGUID],
        bs.strName AS [BoardSectionName],
        ad.strBoardSubModuleGUID AS [BoardSubModuleGUID],
        bsm.strName AS [BoardSubModuleName],
        ad.bolIsBillable AS [IsBillable],
        ad.intTotalTimerCount AS [TotalTimerCount],
        CAST(CAST(ad.intTotalSeconds AS DECIMAL(18,2)) / 60.0 AS DECIMAL(18, 2)) AS [TotalMinutes],
        CONVERT(VARCHAR(8), 
            DATEADD(SECOND, ad.intTotalSeconds, 0), 
            108) AS [TotalHours]
    FROM AggregatedData ad
    LEFT JOIN ' + QUOTENAME(@schemaName) + '.mstBoard b ON b.strBoardGUID = ad.strBoardGUID
    LEFT JOIN ' + QUOTENAME(@schemaName) + '.mstBoardSection bs ON bs.strBoardSectionGUID = ad.strBoardSectionGUID
    LEFT JOIN ' + QUOTENAME(@schemaName) + '.mstBoardSubModule bsm ON bsm.strBoardSubModuleGUID = ad.strBoardSubModuleGUID
    ORDER BY ad.strUserGUID, ad.strTaskNo, ad.strTaskTitle;
END';
EXEC sp_executesql @sql;

PRINT 'Task module schema created/verified for org: ' + CONVERT(NVARCHAR(36), @organizationGUID);


