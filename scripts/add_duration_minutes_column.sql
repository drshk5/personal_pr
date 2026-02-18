-- ==============================================================================
-- Migration: Add intDurationMinutes column to MstActivity
-- This column was in the EF Core model but missing from the database
-- ==============================================================================

USE MasterDB;
GO

PRINT '======================================================================';
PRINT 'Adding intDurationMinutes column to MstActivity - Starting...';
PRINT '======================================================================';
PRINT '';

-- ==============================================================================
-- Find all tenant schemas with MstActivity table
-- ==============================================================================

DECLARE @SchemaTable TABLE (
    SchemaName NVARCHAR(128)
);

INSERT INTO @SchemaTable (SchemaName)
SELECT s.SCHEMA_NAME
FROM INFORMATION_SCHEMA.SCHEMATA s
INNER JOIN INFORMATION_SCHEMA.TABLES t 
    ON s.SCHEMA_NAME = t.TABLE_SCHEMA 
    AND t.TABLE_NAME = 'MstActivities'
WHERE s.SCHEMA_NAME LIKE 'ORG_%';

PRINT 'Found schemas with MstActivity:';
SELECT * FROM @SchemaTable;
PRINT '';

-- ==============================================================================
-- Add intDurationMinutes column to each schema
-- ==============================================================================

DECLARE @CurrentSchema NVARCHAR(128);
DECLARE @SQL NVARCHAR(MAX);
DECLARE @ColumnExists INT;

DECLARE SchemaCursor CURSOR FOR
SELECT SchemaName FROM @SchemaTable;

OPEN SchemaCursor;
FETCH NEXT FROM SchemaCursor INTO @CurrentSchema;

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT 'Processing schema: ' + @CurrentSchema;

    -- Check if column already exists
    SELECT @ColumnExists = COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @CurrentSchema 
        AND TABLE_NAME = 'MstActivities' 
        AND COLUMN_NAME = 'intDurationMinutes';

    IF @ColumnExists = 0
    BEGIN
        SET @SQL = 'ALTER TABLE [' + @CurrentSchema + '].[MstActivities] ADD intDurationMinutes INT NULL;';
        EXEC sp_executesql @SQL;
        PRINT '  ✓ Added intDurationMinutes column';
    END
    ELSE
        PRINT '  - intDurationMinutes column already exists';

    FETCH NEXT FROM SchemaCursor INTO @CurrentSchema;
END;

CLOSE SchemaCursor;
DEALLOCATE SchemaCursor;

PRINT '';
PRINT '======================================================================';
PRINT '✓ Migration completed successfully!';
PRINT '======================================================================';
GO
