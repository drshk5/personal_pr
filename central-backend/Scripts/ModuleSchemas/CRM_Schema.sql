-- ========================================================================================================
-- CRM Module Database Schema Initialization Script (Complete Version)
-- ========================================================================================================
-- This script creates ALL 24 tables for the CRM module
-- Parameters @organizationGUID, @groupGUID, @yearGUID, and @countryGUID are passed from C# code
-- ========================================================================================================

-- Sanitize the organization GUID to remove hyphens for use in schema names
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);
DECLARE @useGroupGUID NVARCHAR(50) = CAST(@groupGUID AS NVARCHAR(50));
DECLARE @useYearGUID NVARCHAR(50) = ISNULL(CAST(@yearGUID AS NVARCHAR(50)), 'NULL');
DECLARE @useCountryGUID NVARCHAR(50) = ISNULL(CAST(@countryGUID AS NVARCHAR(50)), 'NULL');

-- Debug information
PRINT '========================================================================================================';
PRINT 'CRM Schema Initialization Started';
PRINT '========================================================================================================';
PRINT 'Organization GUID: ' + CAST(@organizationGUID AS NVARCHAR(50));
PRINT 'Group GUID: ' + @useGroupGUID;
PRINT 'Year GUID: ' + @useYearGUID;
PRINT 'Country GUID: ' + @useCountryGUID;
PRINT 'Schema Name: ' + @schemaName;
PRINT '========================================================================================================';

-- Create schema if not exists
SET @sql = 'IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = ''' + @schemaName + ''')
BEGIN
    EXEC(''CREATE SCHEMA [' + @schemaName + ']'')
    PRINT ''✓ Schema created: ' + @schemaName + '''
END
ELSE
BEGIN
    PRINT ''✓ Schema already exists: ' + @schemaName + '''
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 1: MstLeads
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstLeads'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstLeads] (
        strLeadGUID             UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strFirstName            NVARCHAR(100)       NOT NULL,
        strLastName             NVARCHAR(100)       NOT NULL,
        strEmail                NVARCHAR(255)       NOT NULL,
        strPhone                NVARCHAR(20)        NULL,
        strCompanyName          NVARCHAR(200)       NULL,
        strJobTitle             NVARCHAR(150)       NULL,
        strSource               NVARCHAR(50)        NOT NULL,
        strStatus               NVARCHAR(50)        NOT NULL DEFAULT ''New'',
        intLeadScore            INT                 DEFAULT 0,
        strAddress              NVARCHAR(500)       NULL,
        strCity                 NVARCHAR(100)       NULL,
        strState                NVARCHAR(100)       NULL,
        strCountry              NVARCHAR(100)       NULL,
        strPostalCode           NVARCHAR(20)        NULL,
        strNotes                NVARCHAR(MAX)       NULL,
        strConvertedAccountGUID UNIQUEIDENTIFIER    NULL,
        strConvertedContactGUID UNIQUEIDENTIFIER    NULL,
        strConvertedOpportunityGUID UNIQUEIDENTIFIER NULL,
        dtConvertedOn           DATETIME2           NULL,
        strAssignedToGUID       UNIQUEIDENTIFIER    NULL,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0,
        dtDeletedOn             DATETIME2           NULL
    );

    CREATE INDEX IX_MstLeads_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstLeads](strGroupGUID);
    CREATE INDEX IX_MstLeads_Status ON ' + QUOTENAME(@schemaName) + N'.[MstLeads](strStatus);
    CREATE INDEX IX_MstLeads_Email ON ' + QUOTENAME(@schemaName) + N'.[MstLeads](strEmail);
    CREATE INDEX IX_MstLeads_AssignedTo ON ' + QUOTENAME(@schemaName) + N'.[MstLeads](strAssignedToGUID);

    PRINT ''✓ Table created: MstLeads'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstLeads'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 2: MstAccounts
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstAccounts'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstAccounts] (
        strAccountGUID          UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
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

    CREATE INDEX IX_MstAccounts_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstAccounts](strGroupGUID);
    CREATE INDEX IX_MstAccounts_AccountName ON ' + QUOTENAME(@schemaName) + N'.[MstAccounts](strAccountName);

    PRINT ''✓ Table created: MstAccounts'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstAccounts'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 3: MstContacts
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstContacts'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstContacts] (
        strContactGUID          UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strAccountGUID          UNIQUEIDENTIFIER    NULL,
        strFirstName            NVARCHAR(100)       NOT NULL,
        strLastName             NVARCHAR(100)       NOT NULL,
        strEmail                NVARCHAR(255)       NOT NULL,
        strPhone                NVARCHAR(20)        NULL,
        strMobilePhone          NVARCHAR(20)        NULL,
        strJobTitle             NVARCHAR(150)       NULL,
        strDepartment           NVARCHAR(100)       NULL,
        strLifecycleStage       NVARCHAR(50)        DEFAULT ''Subscriber'',
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
        dtDeletedOn             DATETIME2           NULL,

        CONSTRAINT ' + QUOTENAME('FK_MstContacts_Account_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strAccountGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstAccounts](strAccountGUID) ON DELETE SET NULL
    );

    CREATE INDEX IX_MstContacts_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstContacts](strGroupGUID);
    CREATE INDEX IX_MstContacts_AccountGUID ON ' + QUOTENAME(@schemaName) + N'.[MstContacts](strAccountGUID);
    CREATE INDEX IX_MstContacts_Email ON ' + QUOTENAME(@schemaName) + N'.[MstContacts](strEmail);

    PRINT ''✓ Table created: MstContacts'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstContacts'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 4: MstPipelines
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstPipelines'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstPipelines] (
        strPipelineGUID         UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strPipelineName         NVARCHAR(200)       NOT NULL,
        strDescription          NVARCHAR(MAX)       NULL,
        bolIsDefault            BIT                 DEFAULT 0,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0,
        dtDeletedOn             DATETIME2           NULL
    );

    CREATE INDEX IX_MstPipelines_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstPipelines](strGroupGUID);
    CREATE INDEX IX_MstPipelines_IsDefault ON ' + QUOTENAME(@schemaName) + N'.[MstPipelines](bolIsDefault);

    PRINT ''✓ Table created: MstPipelines'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstPipelines'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 5: MstPipelineStages
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstPipelineStages'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstPipelineStages] (
        strStageGUID            UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strPipelineGUID         UNIQUEIDENTIFIER    NOT NULL,
        strStageName            NVARCHAR(100)       NOT NULL,
        intDisplayOrder         INT                 NOT NULL,
        intProbabilityPercent   INT                 NOT NULL DEFAULT 0,
        strRequiredFields       NVARCHAR(MAX)       NULL,
        strAllowedTransitions   NVARCHAR(MAX)       NULL,
        intDefaultDaysToRot     INT                 DEFAULT 30,
        bolIsWonStage           BIT                 DEFAULT 0,
        bolIsLostStage          BIT                 DEFAULT 0,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,

        CONSTRAINT ' + QUOTENAME('FK_MstPipelineStages_Pipeline_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strPipelineGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstPipelines](strPipelineGUID) ON DELETE CASCADE
    );

    CREATE INDEX IX_MstPipelineStages_PipelineGUID ON ' + QUOTENAME(@schemaName) + N'.[MstPipelineStages](strPipelineGUID);
    CREATE INDEX IX_MstPipelineStages_DisplayOrder ON ' + QUOTENAME(@schemaName) + N'.[MstPipelineStages](intDisplayOrder);

    PRINT ''✓ Table created: MstPipelineStages'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstPipelineStages'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 6: MstOpportunities
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstOpportunities'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstOpportunities] (
        strOpportunityGUID      UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strAccountGUID          UNIQUEIDENTIFIER    NULL,
        strPipelineGUID         UNIQUEIDENTIFIER    NOT NULL,
        strStageGUID            UNIQUEIDENTIFIER    NOT NULL,
        strOpportunityName      NVARCHAR(200)       NOT NULL,
        dblAmount               DECIMAL(18,2)       NULL,
        strCurrency             NVARCHAR(10)        DEFAULT ''INR'',
        intProbability          INT                 DEFAULT 0,
        strStatus               NVARCHAR(50)        DEFAULT ''Open'',
        dtExpectedCloseDate     DATE                NULL,
        dtActualCloseDate       DATE                NULL,
        strLossReason           NVARCHAR(500)       NULL,
        strDescription          NVARCHAR(MAX)       NULL,
        dtStageEnteredOn        DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtLastActivityOn        DATETIME2           NULL,
        strAssignedToGUID       UNIQUEIDENTIFIER    NULL,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0,
        dtDeletedOn             DATETIME2           NULL,

        CONSTRAINT ' + QUOTENAME('FK_MstOpportunities_Account_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strAccountGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstAccounts](strAccountGUID) ON DELETE SET NULL,
        CONSTRAINT ' + QUOTENAME('FK_MstOpportunities_Pipeline_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strPipelineGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstPipelines](strPipelineGUID),
        CONSTRAINT ' + QUOTENAME('FK_MstOpportunities_Stage_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strStageGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstPipelineStages](strStageGUID)
    );

    CREATE INDEX IX_MstOpportunities_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstOpportunities](strGroupGUID);
    CREATE INDEX IX_MstOpportunities_AccountGUID ON ' + QUOTENAME(@schemaName) + N'.[MstOpportunities](strAccountGUID);
    CREATE INDEX IX_MstOpportunities_PipelineGUID ON ' + QUOTENAME(@schemaName) + N'.[MstOpportunities](strPipelineGUID);
    CREATE INDEX IX_MstOpportunities_StageGUID ON ' + QUOTENAME(@schemaName) + N'.[MstOpportunities](strStageGUID);
    CREATE INDEX IX_MstOpportunities_Status ON ' + QUOTENAME(@schemaName) + N'.[MstOpportunities](strStatus);

    PRINT ''✓ Table created: MstOpportunities'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstOpportunities'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 7: MstOpportunityContacts
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstOpportunityContacts'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstOpportunityContacts] (
        strOpportunityContactGUID UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strOpportunityGUID      UNIQUEIDENTIFIER    NOT NULL,
        strContactGUID          UNIQUEIDENTIFIER    NOT NULL,
        strRole                 NVARCHAR(50)        DEFAULT ''Stakeholder'',
        bolIsPrimary            BIT                 DEFAULT 0,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT ' + QUOTENAME('FK_MstOpportunityContacts_Opportunity_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strOpportunityGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstOpportunities](strOpportunityGUID) ON DELETE CASCADE,
        CONSTRAINT ' + QUOTENAME('FK_MstOpportunityContacts_Contact_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strContactGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstContacts](strContactGUID) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IX_MstOpportunityContacts_Unique ON ' + QUOTENAME(@schemaName) + N'.[MstOpportunityContacts](strOpportunityGUID, strContactGUID);

    PRINT ''✓ Table created: MstOpportunityContacts'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstOpportunityContacts'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 8: MstActivities
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstActivities'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstActivities] (
        strActivityGUID         UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strActivityType         NVARCHAR(50)        NOT NULL,
        strSubject              NVARCHAR(300)       NOT NULL,
        strDescription          NVARCHAR(MAX)       NULL,
        dtScheduledStart        DATETIME2           NULL,
        dtScheduledEnd          DATETIME2           NULL,
        dtActualStart           DATETIME2           NULL,
        dtActualEnd             DATETIME2           NULL,
        strLocation             NVARCHAR(500)       NULL,
        strOutcome              NVARCHAR(200)       NULL,
        strAssignedToGUID       UNIQUEIDENTIFIER    NULL,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1
    );

    CREATE INDEX IX_MstActivities_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstActivities](strGroupGUID);
    CREATE INDEX IX_MstActivities_ActivityType ON ' + QUOTENAME(@schemaName) + N'.[MstActivities](strActivityType);
    CREATE INDEX IX_MstActivities_AssignedTo ON ' + QUOTENAME(@schemaName) + N'.[MstActivities](strAssignedToGUID);

    PRINT ''✓ Table created: MstActivities'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstActivities'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 9: MstActivityLinks
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstActivityLinks'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstActivityLinks] (
        strActivityLinkGUID     UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strActivityGUID         UNIQUEIDENTIFIER    NOT NULL,
        strEntityType           NVARCHAR(50)        NOT NULL,
        strEntityGUID           UNIQUEIDENTIFIER    NOT NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT ' + QUOTENAME('FK_MstActivityLinks_Activity_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strActivityGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstActivities](strActivityGUID) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IX_MstActivityLinks_Unique ON ' + QUOTENAME(@schemaName) + N'.[MstActivityLinks](strActivityGUID, strEntityType, strEntityGUID);
    CREATE INDEX IX_MstActivityLinks_Entity ON ' + QUOTENAME(@schemaName) + N'.[MstActivityLinks](strEntityType, strEntityGUID);

    PRINT ''✓ Table created: MstActivityLinks'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstActivityLinks'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 10: MstAuditLogs
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstAuditLogs'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstAuditLogs] (
        strAuditLogGUID         UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strEntityType           NVARCHAR(50)        NOT NULL,
        strEntityGUID           UNIQUEIDENTIFIER    NOT NULL,
        strAction               NVARCHAR(50)        NOT NULL,
        strOldValues            NVARCHAR(MAX)       NULL,
        strNewValues            NVARCHAR(MAX)       NULL,
        strPerformedByGUID      UNIQUEIDENTIFIER    NOT NULL,
        dtPerformedOn           DATETIME2           NOT NULL DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_MstAuditLogs_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstAuditLogs](strGroupGUID);
    CREATE INDEX IX_MstAuditLogs_Entity ON ' + QUOTENAME(@schemaName) + N'.[MstAuditLogs](strEntityType, strEntityGUID);
    CREATE INDEX IX_MstAuditLogs_PerformedOn ON ' + QUOTENAME(@schemaName) + N'.[MstAuditLogs](dtPerformedOn);

    PRINT ''✓ Table created: MstAuditLogs'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstAuditLogs'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 11: MstLeadScoringRules
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstLeadScoringRules'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstLeadScoringRules] (
        strScoringRuleGUID      UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strRuleName             NVARCHAR(200)       NOT NULL,
        strRuleCategory         NVARCHAR(50)        NOT NULL,
        strConditionField       NVARCHAR(100)       NOT NULL,
        strConditionOperator    NVARCHAR(20)        DEFAULT ''Equals'',
        strConditionValue       NVARCHAR(500)       NULL,
        intScoreChange          INT                 NOT NULL,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0
    );

    CREATE INDEX IX_MstLeadScoringRules_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstLeadScoringRules](strGroupGUID);

    PRINT ''✓ Table created: MstLeadScoringRules'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstLeadScoringRules'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 12: MstLeadScoreHistory
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstLeadScoreHistory'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstLeadScoreHistory] (
        strScoreHistoryGUID     UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strLeadGUID             UNIQUEIDENTIFIER    NOT NULL,
        strScoringRuleGUID      UNIQUEIDENTIFIER    NULL,
        intOldScore             INT                 NOT NULL,
        intNewScore             INT                 NOT NULL,
        intScoreChange          INT                 NOT NULL,
        strChangeReason         NVARCHAR(500)       NOT NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT ' + QUOTENAME('FK_MstLeadScoreHistory_Lead_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strLeadGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstLeads](strLeadGUID) ON DELETE CASCADE,
        CONSTRAINT ' + QUOTENAME('FK_MstLeadScoreHistory_ScoringRule_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strScoringRuleGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstLeadScoringRules](strScoringRuleGUID) ON DELETE SET NULL
    );

    CREATE INDEX IX_MstLeadScoreHistory_LeadGUID ON ' + QUOTENAME(@schemaName) + N'.[MstLeadScoreHistory](strLeadGUID);
    CREATE INDEX IX_MstLeadScoreHistory_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstLeadScoreHistory](strGroupGUID);

    PRINT ''✓ Table created: MstLeadScoreHistory'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstLeadScoreHistory'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 13: MstLeadAssignmentRules
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstLeadAssignmentRules'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstLeadAssignmentRules] (
        strAssignmentRuleGUID   UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strRuleName             NVARCHAR(200)       NOT NULL,
        strAssignmentType       NVARCHAR(50)        NOT NULL,
        strCriteria             NVARCHAR(MAX)       NULL,
        intPriority             INT                 DEFAULT 0,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0
    );

    CREATE INDEX IX_MstLeadAssignmentRules_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstLeadAssignmentRules](strGroupGUID);

    PRINT ''✓ Table created: MstLeadAssignmentRules'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstLeadAssignmentRules'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 14: MstLeadAssignmentMembers
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstLeadAssignmentMembers'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstLeadAssignmentMembers] (
        strAssignmentMemberGUID UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strAssignmentRuleGUID   UNIQUEIDENTIFIER    NOT NULL,
        strUserGUID             UNIQUEIDENTIFIER    NOT NULL,
        intCapacityPercentage   INT                 DEFAULT 100,
        intCurrentLoad          INT                 DEFAULT 0,
        strSkillLevel           NVARCHAR(50)        NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        bolIsActive             BIT                 DEFAULT 1,

        CONSTRAINT ' + QUOTENAME('FK_MstLeadAssignmentMembers_Rule_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strAssignmentRuleGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstLeadAssignmentRules](strAssignmentRuleGUID) ON DELETE CASCADE
    );

    CREATE INDEX IX_MstLeadAssignmentMembers_RuleGUID ON ' + QUOTENAME(@schemaName) + N'.[MstLeadAssignmentMembers](strAssignmentRuleGUID);

    PRINT ''✓ Table created: MstLeadAssignmentMembers'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstLeadAssignmentMembers'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 15: MstLeadDuplicates
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstLeadDuplicates'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstLeadDuplicates] (
        strDuplicateGUID        UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strLeadGUID1            UNIQUEIDENTIFIER    NOT NULL,
        strLeadGUID2            UNIQUEIDENTIFIER    NOT NULL,
        strMatchType            NVARCHAR(50)        NOT NULL,
        dblConfidenceScore      DECIMAL(5,2)        NULL,
        strStatus               NVARCHAR(30)        DEFAULT ''Pending'',
        strResolvedByGUID       UNIQUEIDENTIFIER    NULL,
        dtResolvedOn            DATETIME2           NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT ' + QUOTENAME('FK_MstLeadDuplicates_Lead1_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strLeadGUID1)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstLeads](strLeadGUID) ON DELETE NO ACTION,
        CONSTRAINT ' + QUOTENAME('FK_MstLeadDuplicates_Lead2_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strLeadGUID2)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstLeads](strLeadGUID) ON DELETE NO ACTION
    );

    CREATE INDEX IX_MstLeadDuplicates_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstLeadDuplicates](strGroupGUID);
    CREATE INDEX IX_MstLeadDuplicates_LeadGUID1 ON ' + QUOTENAME(@schemaName) + N'.[MstLeadDuplicates](strLeadGUID1);
    CREATE INDEX IX_MstLeadDuplicates_LeadGUID2 ON ' + QUOTENAME(@schemaName) + N'.[MstLeadDuplicates](strLeadGUID2);

    PRINT ''✓ Table created: MstLeadDuplicates'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstLeadDuplicates'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 16: MstLeadMergeHistory
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstLeadMergeHistory'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstLeadMergeHistory] (
        strMergeHistoryGUID     UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strSurvivorLeadGUID     UNIQUEIDENTIFIER    NOT NULL,
        strMergedLeadsJson      NVARCHAR(MAX)       NOT NULL,
        strMergedByGUID         UNIQUEIDENTIFIER    NOT NULL,
        dtMergedOn              DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT ' + QUOTENAME('FK_MstLeadMergeHistory_SurvivorLead_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strSurvivorLeadGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstLeads](strLeadGUID) ON DELETE NO ACTION
    );

    CREATE INDEX IX_MstLeadMergeHistory_SurvivorLead ON ' + QUOTENAME(@schemaName) + N'.[MstLeadMergeHistory](strSurvivorLeadGUID);

    PRINT ''✓ Table created: MstLeadMergeHistory'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstLeadMergeHistory'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 17: MstWorkflowRules
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstWorkflowRules'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstWorkflowRules] (
        strWorkflowRuleGUID     UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strRuleName             NVARCHAR(200)       NOT NULL,
        strEntityType           NVARCHAR(50)        NOT NULL,
        strTriggerEvent         NVARCHAR(100)       NOT NULL,
        strConditions           NVARCHAR(MAX)       NULL,
        strActionType           NVARCHAR(100)       NOT NULL,
        strActionConfig         NVARCHAR(MAX)       NULL,
        intExecutionOrder       INT                 DEFAULT 0,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0
    );

    CREATE INDEX IX_MstWorkflowRules_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstWorkflowRules](strGroupGUID);
    CREATE INDEX IX_MstWorkflowRules_EntityType ON ' + QUOTENAME(@schemaName) + N'.[MstWorkflowRules](strEntityType);

    PRINT ''✓ Table created: MstWorkflowRules'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstWorkflowRules'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 18: MstWorkflowExecutions
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstWorkflowExecutions'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstWorkflowExecutions] (
        strExecutionGUID        UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strWorkflowRuleGUID     UNIQUEIDENTIFIER    NOT NULL,
        strEntityGUID           UNIQUEIDENTIFIER    NOT NULL,
        strStatus               NVARCHAR(30)        NOT NULL,
        strErrorMessage         NVARCHAR(MAX)       NULL,
        dtStartedOn             DATETIME2           NULL,
        dtCompletedOn           DATETIME2           NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT ' + QUOTENAME('FK_MstWorkflowExecutions_WorkflowRule_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strWorkflowRuleGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstWorkflowRules](strWorkflowRuleGUID) ON DELETE CASCADE
    );

    CREATE INDEX IX_MstWorkflowExecutions_WorkflowRule ON ' + QUOTENAME(@schemaName) + N'.[MstWorkflowExecutions](strWorkflowRuleGUID);
    CREATE INDEX IX_MstWorkflowExecutions_Entity ON ' + QUOTENAME(@schemaName) + N'.[MstWorkflowExecutions](strEntityGUID);

    PRINT ''✓ Table created: MstWorkflowExecutions'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstWorkflowExecutions'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 19: MstWebForms
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstWebForms'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstWebForms] (
        strWebFormGUID          UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strFormName             NVARCHAR(200)       NOT NULL,
        strFormDescription      NVARCHAR(500)       NULL,
        strRedirectUrl          NVARCHAR(500)       NULL,
        strThankYouMessage      NVARCHAR(500)       NULL,
        strDefaultSource        NVARCHAR(50)        DEFAULT ''Website'',
        bolNotifyOnSubmission   BIT                 DEFAULT 0,
        strNotificationEmails   NVARCHAR(MAX)       NULL,
        bolCaptchaEnabled       BIT                 DEFAULT 1,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0
    );

    CREATE INDEX IX_MstWebForms_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstWebForms](strGroupGUID);

    PRINT ''✓ Table created: MstWebForms'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstWebForms'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 20: MstWebFormFields
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstWebFormFields'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstWebFormFields] (
        strWebFormFieldGUID     UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strWebFormGUID          UNIQUEIDENTIFIER    NOT NULL,
        strFieldLabel           NVARCHAR(100)       NOT NULL,
        strFieldType            NVARCHAR(50)        NOT NULL,
        strMappedLeadField      NVARCHAR(100)       NOT NULL,
        bolIsRequired           BIT                 DEFAULT 0,
        strDefaultValue         NVARCHAR(500)       NULL,
        strPlaceholder          NVARCHAR(200)       NULL,
        intDisplayOrder         INT                 DEFAULT 0,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT ' + QUOTENAME('FK_MstWebFormFields_WebForm_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strWebFormGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstWebForms](strWebFormGUID) ON DELETE CASCADE
    );

    CREATE INDEX IX_MstWebFormFields_WebFormGUID ON ' + QUOTENAME(@schemaName) + N'.[MstWebFormFields](strWebFormGUID);

    PRINT ''✓ Table created: MstWebFormFields'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstWebFormFields'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 21: MstWebFormSubmissions
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstWebFormSubmissions'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstWebFormSubmissions] (
        strSubmissionGUID       UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strWebFormGUID          UNIQUEIDENTIFIER    NOT NULL,
        strLeadGUID             UNIQUEIDENTIFIER    NULL,
        strSubmittedDataJson    NVARCHAR(MAX)       NOT NULL,
        strIpAddress            NVARCHAR(50)        NULL,
        strUserAgent            NVARCHAR(500)       NULL,
        strReferrerUrl          NVARCHAR(500)       NULL,
        strUtmSource            NVARCHAR(200)       NULL,
        strUtmMedium            NVARCHAR(200)       NULL,
        strUtmCampaign          NVARCHAR(200)       NULL,
        strUtmTerm              NVARCHAR(200)       NULL,
        strUtmContent           NVARCHAR(200)       NULL,
        strStatus               NVARCHAR(30)        DEFAULT ''Processed'',
        strErrorMessage         NVARCHAR(500)       NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT ' + QUOTENAME('FK_MstWebFormSubmissions_WebForm_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strWebFormGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstWebForms](strWebFormGUID) ON DELETE CASCADE,
        CONSTRAINT ' + QUOTENAME('FK_MstWebFormSubmissions_Lead_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strLeadGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstLeads](strLeadGUID) ON DELETE SET NULL
    );

    CREATE INDEX IX_MstWebFormSubmissions_WebFormGUID ON ' + QUOTENAME(@schemaName) + N'.[MstWebFormSubmissions](strWebFormGUID);
    CREATE INDEX IX_MstWebFormSubmissions_LeadGUID ON ' + QUOTENAME(@schemaName) + N'.[MstWebFormSubmissions](strLeadGUID);

    PRINT ''✓ Table created: MstWebFormSubmissions'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstWebFormSubmissions'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 22: MstImportJobs
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstImportJobs'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstImportJobs] (
        strImportJobGUID        UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strFileName             NVARCHAR(300)       NOT NULL,
        strStatus               NVARCHAR(30)        DEFAULT ''Pending'',
        intTotalRecords         INT                 DEFAULT 0,
        intSuccessRecords       INT                 DEFAULT 0,
        intFailedRecords        INT                 DEFAULT 0,
        strDuplicateHandling    NVARCHAR(30)        DEFAULT ''Skip'',
        strColumnMappingJson    NVARCHAR(MAX)       NOT NULL,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtStartedOn             DATETIME2           NULL,
        dtCompletedOn           DATETIME2           NULL
    );

    CREATE INDEX IX_MstImportJobs_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstImportJobs](strGroupGUID);
    CREATE INDEX IX_MstImportJobs_Status ON ' + QUOTENAME(@schemaName) + N'.[MstImportJobs](strStatus);

    PRINT ''✓ Table created: MstImportJobs'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstImportJobs'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 23: MstImportJobErrors
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstImportJobErrors'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstImportJobErrors] (
        strImportJobErrorGUID   UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strImportJobGUID        UNIQUEIDENTIFIER    NOT NULL,
        intRowNumber            INT                 NOT NULL,
        strErrorMessage         NVARCHAR(500)       NOT NULL,
        strErrorType            NVARCHAR(50)        NOT NULL,
        strRowDataJson          NVARCHAR(MAX)       NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT ' + QUOTENAME('FK_MstImportJobErrors_ImportJob_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strImportJobGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstImportJobs](strImportJobGUID) ON DELETE CASCADE
    );

    CREATE INDEX IX_MstImportJobErrors_ImportJobGUID ON ' + QUOTENAME(@schemaName) + N'.[MstImportJobErrors](strImportJobGUID);

    PRINT ''✓ Table created: MstImportJobErrors'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstImportJobErrors'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- TABLE 24: MstLeadCommunications
-- ========================================================================================================
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);

SET @sql = N'
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id
               WHERE s.name = ''' + @schemaName + ''' AND t.name = ''MstLeadCommunications'')
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + N'.[MstLeadCommunications] (
        strCommunicationGUID    UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strLeadGUID             UNIQUEIDENTIFIER    NOT NULL,
        strChannelType          NVARCHAR(30)        NOT NULL,
        strDirection            NVARCHAR(20)        NOT NULL,
        strSubject              NVARCHAR(300)       NULL,
        strBody                 NVARCHAR(MAX)       NULL,
        strFromAddress          NVARCHAR(255)       NULL,
        strToAddress            NVARCHAR(255)       NULL,
        intDurationSeconds      INT                 NULL,
        strCallOutcome          NVARCHAR(100)       NULL,
        strRecordingUrl         NVARCHAR(500)       NULL,
        bolIsOpened             BIT                 DEFAULT 0,
        dtOpenedOn              DATETIME2           NULL,
        intClickCount           INT                 DEFAULT 0,
        strExternalMessageId    NVARCHAR(200)       NULL,
        strTrackingPixelGUID    UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT ' + QUOTENAME('FK_MstLeadCommunications_Lead_' + @sanitizedOrgGUID) + N' FOREIGN KEY (strLeadGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + N'.[MstLeads](strLeadGUID) ON DELETE CASCADE
    );

    CREATE INDEX IX_MstLeadCommunications_LeadGUID ON ' + QUOTENAME(@schemaName) + N'.[MstLeadCommunications](strLeadGUID);
    CREATE INDEX IX_MstLeadCommunications_GroupGUID ON ' + QUOTENAME(@schemaName) + N'.[MstLeadCommunications](strGroupGUID);
    CREATE INDEX IX_MstLeadCommunications_TrackingPixel ON ' + QUOTENAME(@schemaName) + N'.[MstLeadCommunications](strTrackingPixelGUID);

    PRINT ''✓ Table created: MstLeadCommunications'';
END
ELSE
BEGIN
    PRINT ''✓ Table already exists: MstLeadCommunications'';
END';
EXEC sp_executesql @sql;
GO

-- ========================================================================================================
-- SCHEMA INITIALIZATION COMPLETE
-- ========================================================================================================
PRINT '========================================================================================================';
PRINT 'CRM Schema Initialization Completed Successfully!';
PRINT 'Total Tables Created/Verified: 24';
PRINT 'Schema: ' + 'ORG_' + REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
PRINT '========================================================================================================';
