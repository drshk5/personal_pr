-- Create CRM tables in ALL organization schemas
-- This ensures every org has the tables they need

USE MasterDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT '======================================================================';
PRINT 'Creating CRM Tables in ALL Organization Schemas';
PRINT '======================================================================';
PRINT '';

DECLARE @OrgGUID UNIQUEIDENTIFIER;
DECLARE @SchemaName NVARCHAR(128);
DECLARE @CreateTableSql NVARCHAR(MAX);

-- Cursor for all active organizations  
DECLARE OrgCursor CURSOR FOR
SELECT strOrganizationGUID
FROM mstOrganization
WHERE bolIsActive = 1;

OPEN OrgCursor;
FETCH NEXT FROM OrgCursor INTO @OrgGUID;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @SchemaName = 'ORG_' + REPLACE(CAST(@OrgGUID AS NVARCHAR(50)), '-', '');
    
    PRINT '======================================================================';
    PRINT 'Processing Organization: ' + CAST(@OrgGUID AS NVARCHAR(50));
    PRINT 'Schema: ' + @SchemaName;
    PRINT '======================================================================';
    
    -- Create schema if needed
    IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = @SchemaName)
    BEGIN
        EXEC('CREATE SCHEMA [' + @SchemaName + ']');
        PRINT '✓ Created schema';
    END
    ELSE
        PRINT '- Schema exists';

    -- Create MstActivity table
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = @SchemaName AND TABLE_NAME = 'MstActivity')
    BEGIN
        SET @CreateTableSql = '
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
        ';
        
        EXEC sp_executesql @CreateTableSql;
        PRINT '✓ Created MstActivity table';
    END
    ELSE
        PRINT '- MstActivity table exists';

    -- Create MstActivityLink table
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = @SchemaName AND TABLE_NAME = 'MstActivityLink')
    BEGIN
        SET @CreateTableSql = '
        CREATE TABLE [' + @SchemaName + '].[MstActivityLink] (
            strActivityLinkGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
            strActivityGUID UNIQUEIDENTIFIER NOT NULL,
            strEntityType NVARCHAR(50) NOT NULL,
            strEntityGUID UNIQUEIDENTIFIER NOT NULL,
            dtCreatedOn DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
            CONSTRAINT FK_' + @SchemaName + '_ActivityLink_Activity FOREIGN KEY (strActivityGUID) 
                REFERENCES [' + @SchemaName + '].[MstActivity](strActivityGUID) ON DELETE CASCADE
        );
        
        CREATE INDEX IX_MstActivityLink_Activity ON [' + @SchemaName + '].[MstActivityLink](strActivityGUID);
        CREATE INDEX IX_MstActivityLink_Entity ON [' + @SchemaName + '].[MstActivityLink](strEntityType, strEntityGUID);
        ';
        
        EXEC sp_executesql @CreateTableSql;
        PRINT '✓ Created MstActivityLink table';
    END
    ELSE
        PRINT '- MstActivityLink table exists';

    -- Create MstLead if needed
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = @SchemaName AND TABLE_NAME = 'MstLead')
    BEGIN
        SET @CreateTableSql = '
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
        ';
        
        EXEC sp_executesql @CreateTableSql;
        PRINT '✓ Created MstLead table';
    END

    -- Create MstAccount if needed
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = @SchemaName AND TABLE_NAME = 'MstAccount')
    BEGIN
        SET @CreateTableSql = '
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
        ';
        
        EXEC sp_executesql @CreateTableSql;
        PRINT '✓ Created MstAccount table';
    END

    -- Create MstContact if needed
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = @SchemaName AND TABLE_NAME = 'MstContact')
    BEGIN
        SET @CreateTableSql = '
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
        ';
        
        EXEC sp_executesql @CreateTableSql;
        PRINT '✓ Created MstContact table';
    END

    -- Create MstOpportunity if needed
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = @SchemaName AND TABLE_NAME = 'MstOpportunity')
    BEGIN
        SET @CreateTableSql = '
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
        ';
        
        EXEC sp_executesql @CreateTableSql;
        PRINT '✓ Created MstOpportunity table';
    END

    PRINT '';
    
    FETCH NEXT FROM OrgCursor INTO @OrgGUID;
END;

CLOSE OrgCursor;
DEALLOCATE OrgCursor;

PRINT '======================================================================';
PRINT '✓ All Organization Schemas Processed!';
PRINT '======================================================================';
GO
