-- ==============================================================================
-- Create CRM Tables for Testing
-- Creates MstActivity and related tables in a tenant schema
-- ==============================================================================

USE MasterDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ==============================================================================
-- Step 1: Get or create tenant schema
-- ==============================================================================

DECLARE @OrgGUID UNIQUEIDENTIFIER;
DECLARE @ModuleGUID UNIQUEIDENTIFIER;
DECLARE @SchemaName NVARCHAR(128);

-- Get first organization
SELECT TOP 1 @OrgGUID = strOrganizationGUID 
FROM mstOrganization 
WHERE bolIsActive = 1;

IF @OrgGUID IS NULL
BEGIN
    PRINT 'ERROR: No active organization found. Please create an organization first.';
    RETURN;
END

-- Get CRM module
SELECT @ModuleGUID = strModuleGUID
FROM mstModule
WHERE strName = 'CRM' AND bolIsActive = 1;

IF @ModuleGUID IS NULL
BEGIN
    PRINT 'ERROR: CRM module not found. Please ensure CRM module exists in mstModule.';
    RETURN;
END

-- Create schema name  
SET @SchemaName = 'ORG_' + REPLACE(CAST(@OrgGUID AS NVARCHAR(50)), '-', '');

PRINT 'Organization GUID: ' + CAST(@OrgGUID AS NVARCHAR(50));
PRINT 'Module GUID: ' + CAST(@ModuleGUID AS NVARCHAR(50));
PRINT 'Schema Name: ' + @SchemaName;
PRINT '';

-- Create schema if it doesn't exist
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = @SchemaName)
BEGIN
    DECLARE @CreateSchemaSql NVARCHAR(MAX) = 'CREATE SCHEMA [' + @SchemaName + ']';
    EXEC sp_executesql @CreateSchemaSql;
    PRINT '✓ Created schema: ' + @SchemaName;
END
ELSE
BEGIN
    PRINT '- Schema already exists: ' + @SchemaName;
END

PRINT '';

-- ==============================================================================
-- Step 2: Create MstActivity table
-- ==============================================================================

DECLARE @CreateTableSql NVARCHAR(MAX) = '
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ''' + @SchemaName + ''' AND TABLE_NAME = ''MstActivity'')
BEGIN
    CREATE TABLE [' + @SchemaName + '].[MstActivity] (
        strActivityGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strActivityType NVARCHAR(50) NOT NULL,
        strSubject NVARCHAR(500) NOT NULL,
        strDescription NVARCHAR(MAX) NULL,
        dtScheduledOn DATETIME2(7) NULL,
        dtCompletedOn DATETIME2(7) NULL,
        intDurationMinutes INT NULL,
        strOutcome NVARCHAR(500) NULL,
        strStatus NVARCHAR(50) NOT NULL DEFAULT ''Pending'',
        strPriority NVARCHAR(50) NOT NULL DEFAULT ''Medium'',
        dtDueDate DATETIME2(7) NULL,
        strCategory NVARCHAR(100) NULL,
        strAssignedToGUID UNIQUEIDENTIFIER NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn DATETIME2(7) NULL,
        bolIsActive BIT NOT NULL DEFAULT 1,
        bolIsDeleted BIT NOT NULL DEFAULT 0,
        dtDeletedOn DATETIME2(7) NULL
    );

    CREATE INDEX IX_MstActivity_GroupGUID ON [' + @SchemaName + '].[MstActivity](strGroupGUID);
    CREATE INDEX IX_MstActivity_Status ON [' + @SchemaName + '].[MstActivity](strStatus) WHERE bolIsDeleted = 0;
    CREATE INDEX IX_MstActivity_AssignedTo ON [' + @SchemaName + '].[MstActivity](strAssignedToGUID) WHERE strAssignedToGUID IS NOT NULL AND bolIsDeleted = 0;
    CREATE INDEX IX_MstActivity_DueDate ON [' + @SchemaName + '].[MstActivity](dtDueDate) WHERE dtDueDate IS NOT NULL AND bolIsDeleted = 0;
    CREATE INDEX IX_MstActivity_CreatedOn ON [' + @SchemaName + '].[MstActivity](dtCreatedOn DESC);

    PRINT ''✓ Created MstActivity table'';
END
ELSE
    PRINT ''- MstActivity table already exists'';
';

EXEC sp_executesql @CreateTableSql;

-- ==============================================================================
-- Step 3: Create MstActivityLink table
-- ==============================================================================

DECLARE @CreateLinkTableSql NVARCHAR(MAX) = '
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ''' + @SchemaName + ''' AND TABLE_NAME = ''MstActivityLink'')
BEGIN
    CREATE TABLE [' + @SchemaName + '].[MstActivityLink] (
        strActivityLinkGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        strActivityGUID UNIQUEIDENTIFIER NOT NULL,
        strEntityType NVARCHAR(50) NOT NULL,
        strEntityGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_ActivityLink_Activity FOREIGN KEY (strActivityGUID) REFERENCES [' + @SchemaName + '].[MstActivity](strActivityGUID) ON DELETE CASCADE
    );

    CREATE INDEX IX_MstActivityLink_Activity ON [' + @SchemaName + '].[MstActivityLink](strActivityGUID);
    CREATE INDEX IX_MstActivityLink_Entity ON [' + @SchemaName + '].[MstActivityLink](strEntityType, strEntityGUID);

    PRINT ''✓ Created MstActivityLink table'';
END
ELSE
    PRINT ''- MstActivityLink table already exists'';
';

EXEC sp_executesql @CreateLinkTableSql;

-- ==============================================================================
-- Step 4: Create other essential CRM tables (MstLead, MstAccount, MstContact, MstOpportunity)
-- ==============================================================================

-- MstLead
DECLARE @CreateLeadTableSql NVARCHAR(MAX) = '
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ''' + @SchemaName + ''' AND TABLE_NAME = ''MstLead'')
BEGIN
    CREATE TABLE [' + @SchemaName + '].[MstLead] (
        strLeadGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strFirstName NVARCHAR(100) NOT NULL,
        strLastName NVARCHAR(100) NULL,
        strFullName AS (strFirstName + '' '' + ISNULL(strLastName, '''')),
        strEmail NVARCHAR(255) NULL,
        strPhone NVARCHAR(50) NULL,
        strCompany NVARCHAR(255) NULL,
        strJobTitle NVARCHAR(100) NULL,
        strStatus NVARCHAR(50) NOT NULL DEFAULT ''New'',
        strSource NVARCHAR(100) NULL,
        strIndustry NVARCHAR(100) NULL,
        strAssignedToGUID UNIQUEIDENTIFIER NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn DATETIME2(7) NULL,
        bolIsActive BIT NOT NULL DEFAULT 1,
        bolIsDeleted BIT NOT NULL DEFAULT 0,
        dtDeletedOn DATETIME2(7) NULL
    );

    CREATE INDEX IX_MstLead_Status ON [' + @SchemaName + '].[MstLead](strStatus);
    CREATE INDEX IX_MstLead_AssignedTo ON [' + @SchemaName + '].[MstLead](strAssignedToGUID);

    PRINT ''✓ Created MstLead table'';
END';
EXEC sp_executesql @CreateLeadTableSql;

-- MstAccount
DECLARE @CreateAccountTableSql NVARCHAR(MAX) = '
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ''' + @SchemaName + ''' AND TABLE_NAME = ''MstAccount'')
BEGIN
    CREATE TABLE [' + @SchemaName + '].[MstAccount] (
        strAccountGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strAccountName NVARCHAR(255) NOT NULL,
        strIndustry NVARCHAR(100) NULL,
        strPhone NVARCHAR(50) NULL,
        strEmail NVARCHAR(255) NULL,
        strWebsite NVARCHAR(255) NULL,
        strOwnerGUID UNIQUEIDENTIFIER NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn DATETIME2(7) NULL,
        bolIsActive BIT NOT NULL DEFAULT 1,
        bolIsDeleted BIT NOT NULL DEFAULT 0,
        dtDeletedOn DATETIME2(7) NULL
    );

    PRINT ''✓ Created MstAccount table'';
END';
EXEC sp_executesql @CreateAccountTableSql;

-- MstContact
DECLARE @CreateContactTableSql NVARCHAR(MAX) = '
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ''' + @SchemaName + ''' AND TABLE_NAME = ''MstContact'')
BEGIN
    CREATE TABLE [' + @SchemaName + '].[MstContact] (
        strContactGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strFirstName NVARCHAR(100) NOT NULL,
        strLastName NVARCHAR(100) NULL,
        strFullName AS (strFirstName + '' '' + ISNULL(strLastName, '''')),
        strEmail NVARCHAR(255) NULL,
        strPhone NVARCHAR(50) NULL,
        strAccountGUID UNIQUEIDENTIFIER NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn DATETIME2(7) NULL,
        bolIsActive BIT NOT NULL DEFAULT 1,
        bolIsDeleted BIT NOT NULL DEFAULT 0,
        dtDeletedOn DATETIME2(7) NULL
    );

    PRINT ''✓ Created MstContact table'';
END';
EXEC sp_executesql @CreateContactTableSql;

-- MstOpportunity
DECLARE @CreateOpportunityTableSql NVARCHAR(MAX) = '
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ''' + @SchemaName + ''' AND TABLE_NAME = ''MstOpportunity'')
BEGIN
    CREATE TABLE [' + @SchemaName + '].[MstOpportunity] (
        strOpportunityGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOpportunityName NVARCHAR(255) NOT NULL,
        strAccountGUID UNIQUEIDENTIFIER NULL,
        decAmount DECIMAL(18,2) NULL,
        strStage NVARCHAR(100) NULL,
        strOwnerGUID UNIQUEIDENTIFIER NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtCreatedOn DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn DATETIME2(7) NULL,
        bolIsActive BIT NOT NULL DEFAULT 1,
        bolIsDeleted BIT NOT NULL DEFAULT 0,
        dtDeletedOn DATETIME2(7) NULL
    );

    PRINT ''✓ Created MstOpportunity table'';
END';
EXEC sp_executesql @CreateOpportunityTableSql;

PRINT '';
PRINT '======================================================================';
PRINT '✓ CRM Tables Created Successfully!';
PRINT '======================================================================';
PRINT '';
PRINT 'Schema: ' + @SchemaName;
PRINT 'Organization GUID: ' + CAST(@OrgGUID AS NVARCHAR(50));
PRINT '';
PRINT 'Next steps:';
PRINT '1. Make sure your crm-backend appsettings.json has the correct connection string';
PRINT '2. Start the CRM backend: cd crm-backend && dotnet run';
PRINT '3. The system will use this schema for tenant: ' + @SchemaName;
GO
