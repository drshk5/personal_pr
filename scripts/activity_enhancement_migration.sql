-- ==============================================================================
-- Activity Enhancement Migration Script
-- Adds missing columns to MstActivity table for multi-tenant CRM
-- ==============================================================================

USE MasterDB;
GO

PRINT '======================================================================';
PRINT 'Activity Enhancement Migration - Starting...';
PRINT '======================================================================';
PRINT '';

-- ==============================================================================
-- Step 1: Find all tenant schemas with MstActivity table
-- ==============================================================================

DECLARE @SchemaTable TABLE (
    SchemaName NVARCHAR(128),
    HasActivityTable BIT
);

INSERT INTO @SchemaTable (SchemaName, HasActivityTable)
SELECT 
    s.SCHEMA_NAME,
    CASE WHEN t.TABLE_NAME IS NOT NULL THEN 1 ELSE 0 END
FROM INFORMATION_SCHEMA.SCHEMATA s
LEFT JOIN INFORMATION_SCHEMA.TABLES t 
    ON s.SCHEMA_NAME = t.TABLE_SCHEMA 
    AND t.TABLE_NAME = 'MstActivity'
WHERE s.SCHEMA_NAME LIKE 'ORG_%';

PRINT 'Found schemas:';
SELECT * FROM @SchemaTable;
PRINT '';

-- ==============================================================================
-- Step 2: Add columns to each schema (simple approach)
-- ==============================================================================

DECLARE @CurrentSchema NVARCHAR(128);
DECLARE @SQL NVARCHAR(MAX);
DECLARE @ColumnExists INT;

DECLARE SchemaCursor CURSOR FOR
SELECT SchemaName FROM @SchemaTable WHERE HasActivityTable = 1;

OPEN SchemaCursor;
FETCH NEXT FROM SchemaCursor INTO @CurrentSchema;

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT '======================================================================';
    PRINT 'Processing schema: ' + @CurrentSchema;
    PRINT '======================================================================';

    -- Add strStatus
    SELECT @ColumnExists = COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @CurrentSchema 
        AND TABLE_NAME = 'MstActivity' 
        AND COLUMN_NAME = 'strStatus';

    IF @ColumnExists = 0
    BEGIN
        SET @SQL = 'ALTER TABLE [' + @CurrentSchema + '].[MstActivity] ADD strStatus NVARCHAR(50) NOT NULL DEFAULT ''Pending'';';
        EXEC sp_executesql @SQL;
        PRINT '✓ Added strStatus column';
    END
    ELSE
        PRINT '- strStatus column already exists';

    -- Add strPriority
    SELECT @ColumnExists = COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @CurrentSchema 
        AND TABLE_NAME = 'MstActivity' 
        AND COLUMN_NAME = 'strPriority';

    IF @ColumnExists = 0
    BEGIN
        SET @SQL = 'ALTER TABLE [' + @CurrentSchema + '].[MstActivity] ADD strPriority NVARCHAR(50) NOT NULL DEFAULT ''Medium'';';
        EXEC sp_executesql @SQL;
        PRINT '✓ Added strPriority column';
    END
    ELSE
        PRINT '- strPriority column already exists';

    -- Add dtDueDate
    SELECT @ColumnExists = COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @CurrentSchema 
        AND TABLE_NAME = 'MstActivity' 
        AND COLUMN_NAME = 'dtDueDate';

    IF @ColumnExists = 0
    BEGIN
        SET @SQL = 'ALTER TABLE [' + @CurrentSchema + '].[MstActivity] ADD dtDueDate DATETIME2(7) NULL;';
        EXEC sp_executesql @SQL;
        PRINT '✓ Added dtDueDate column';
    END
    ELSE
        PRINT '- dtDueDate column already exists';

    -- Add strCategory
    SELECT @ColumnExists = COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @CurrentSchema 
        AND TABLE_NAME = 'MstActivity' 
        AND COLUMN_NAME = 'strCategory';

    IF @ColumnExists = 0
    BEGIN
        SET @SQL = 'ALTER TABLE [' + @CurrentSchema + '].[MstActivity] ADD strCategory NVARCHAR(100) NULL;';
        EXEC sp_executesql @SQL;
        PRINT '✓ Added strCategory column';
    END
    ELSE
        PRINT '- strCategory column already exists';

    -- Add strUpdatedByGUID
    SELECT @ColumnExists = COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @CurrentSchema 
        AND TABLE_NAME = 'MstActivity' 
        AND COLUMN_NAME = 'strUpdatedByGUID';

    IF @ColumnExists = 0
    BEGIN
        SET @SQL = 'ALTER TABLE [' + @CurrentSchema + '].[MstActivity] ADD strUpdatedByGUID UNIQUEIDENTIFIER NULL;';
        EXEC sp_executesql @SQL;
        PRINT '✓ Added strUpdatedByGUID column';
    END
    ELSE
        PRINT '- strUpdatedByGUID column already exists';

    -- Add dtUpdatedOn
    SELECT @ColumnExists = COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @CurrentSchema 
        AND TABLE_NAME = 'MstActivity' 
        AND COLUMN_NAME = 'dtUpdatedOn';

    IF @ColumnExists = 0
    BEGIN
        SET @SQL = 'ALTER TABLE [' + @CurrentSchema + '].[MstActivity] ADD dtUpdatedOn DATETIME2(7) NULL;';
        EXEC sp_executesql @SQL;
        PRINT '✓ Added dtUpdatedOn column';
    END
    ELSE
        PRINT '- dtUpdatedOn column already exists';

    -- Add bolIsDeleted
    SELECT @ColumnExists = COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @CurrentSchema 
        AND TABLE_NAME = 'MstActivity' 
        AND COLUMN_NAME = 'bolIsDeleted';

    IF @ColumnExists = 0
    BEGIN
        SET @SQL = 'ALTER TABLE [' + @CurrentSchema + '].[MstActivity] ADD bolIsDeleted BIT NOT NULL DEFAULT 0;';
        EXEC sp_executesql @SQL;
        PRINT '✓ Added bolIsDeleted column';
    END
    ELSE
        PRINT '- bolIsDeleted column already exists';

    -- Add dtDeletedOn
    SELECT @ColumnExists = COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @CurrentSchema 
        AND TABLE_NAME = 'MstActivity' 
        AND COLUMN_NAME = 'dtDeletedOn';

    IF @ColumnExists = 0
    BEGIN
        SET @SQL = 'ALTER TABLE [' + @CurrentSchema + '].[MstActivity] ADD dtDeletedOn DATETIME2(7) NULL;';
        EXEC sp_executesql @SQL;
        PRINT '✓ Added dtDeletedOn column';
    END
    ELSE
        PRINT '- dtDeletedOn column already exists';

    PRINT '';
    PRINT 'Migration completed for: ' + @CurrentSchema;
    PRINT '';

    FETCH NEXT FROM SchemaCursor INTO @CurrentSchema;
END;

CLOSE SchemaCursor;
DEALLOCATE SchemaCursor;

PRINT '======================================================================';
PRINT '✓ Activity Enhancement Migration - Completed Successfully!';
PRINT '======================================================================';
GO
