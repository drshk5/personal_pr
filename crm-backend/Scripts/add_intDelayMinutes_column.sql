-- Migration: Add intDelayMinutes column to MstWorkflowRules table
-- Run this against the CRM database for each org schema that has MstWorkflowRules

-- Replace @schemaName with your actual org schema name
DECLARE @schemaName NVARCHAR(100) = 'ORG_88c1ea7e98234dca8371bdac676c0683';
DECLARE @sql NVARCHAR(MAX);

-- Add intDelayMinutes column if it doesn't exist
SET @sql = N'
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ''' + @schemaName + ''' 
    AND TABLE_NAME = ''MstWorkflowRules'' 
    AND COLUMN_NAME = ''intDelayMinutes''
)
BEGIN
    ALTER TABLE ' + QUOTENAME(@schemaName) + '.[MstWorkflowRules] 
    ADD intDelayMinutes INT NOT NULL DEFAULT 0;
    PRINT ''✓ Column intDelayMinutes added to MstWorkflowRules'';
END
ELSE
BEGIN
    PRINT ''→ Column intDelayMinutes already exists in MstWorkflowRules'';
END';

EXEC sp_executesql @sql;
