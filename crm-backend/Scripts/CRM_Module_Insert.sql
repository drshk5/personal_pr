-- =====================================================
-- CRM Module Insert Script
-- Table: mstModule
-- This script inserts the CRM module with required fields
-- =====================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Declare variables for CRM Module
DECLARE @CrmModuleGUID UNIQUEIDENTIFIER = NEWID();
DECLARE @CreatedByGUID UNIQUEIDENTIFIER = '861D31E7-7923-4BBE-B9EF-9D4129FC2616'; -- Super Admin GUID
DECLARE @CreatedOn DATETIME2 = GETUTCDATE();

-- Insert CRM Module into mstModule table
IF NOT EXISTS (SELECT 1 FROM [mstModule] WHERE [strName] = 'CRM')
BEGIN
    INSERT INTO [mstModule] 
    (
        [strModuleGUID],
        [strName],
        [strDesc],
        [strSQlfilePath],
        [strImagePath],
        [bolIsActive],
        [strCreatedByGUID],
        [dtCreatedOn]
    )
    VALUES 
    (
        @CrmModuleGUID,
        'CRM',
        'Customer Relationship Management Module - Manage leads, accounts, contacts, and opportunities',
        'CRM_Schema.sql',
        '/ModuleImages/crm-icon.png',
        1,
        @CreatedByGUID,
        @CreatedOn
    );

    PRINT 'CRM Module inserted successfully with GUID: ' + CAST(@CrmModuleGUID AS NVARCHAR(MAX));
END
ELSE
BEGIN
    PRINT 'CRM Module already exists in mstModule table.';
END

GO
