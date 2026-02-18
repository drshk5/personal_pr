-- Activity Enhancement Migration
-- Adds status, priority, due dates, categories, and performance optimizations
-- Date: 2026-02-17

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

BEGIN TRANSACTION;

-- ========================================
-- 1. ENSURE MSTACTIVITY TABLE HAS ALL REQUIRED COLUMNS
-- ========================================

-- Add columns if they don't exist (idempotent check)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MstActivity' AND COLUMN_NAME = 'strStatus')
    ALTER TABLE MstActivity ADD strStatus NVARCHAR(50) DEFAULT 'Pending' NOT NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MstActivity' AND COLUMN_NAME = 'strPriority')
    ALTER TABLE MstActivity ADD strPriority NVARCHAR(50) DEFAULT 'Medium' NOT NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MstActivity' AND COLUMN_NAME = 'dtDueDate')
    ALTER TABLE MstActivity ADD dtDueDate DATETIME2(7) NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MstActivity' AND COLUMN_NAME = 'strCategory')
    ALTER TABLE MstActivity ADD strCategory NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MstActivity' AND COLUMN_NAME = 'strUpdatedByGUID')
    ALTER TABLE MstActivity ADD strUpdatedByGUID UNIQUEIDENTIFIER NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MstActivity' AND COLUMN_NAME = 'dtUpdatedOn')
    ALTER TABLE MstActivity ADD dtUpdatedOn DATETIME2(7) NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MstActivity' AND COLUMN_NAME = 'bolIsDeleted')
    ALTER TABLE MstActivity ADD bolIsDeleted BIT DEFAULT 0 NOT NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'MstActivity' AND COLUMN_NAME = 'dtDeletedOn')
    ALTER TABLE MstActivity ADD dtDeletedOn DATETIME2(7) NULL;

-- ========================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- Index on status, priority, and due date for fast filtering
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MstActivity_Status_Priority_DueDate' AND object_id = OBJECT_ID('[dbo].[MstActivity]'))
    CREATE NONCLUSTERED INDEX IX_MstActivity_Status_Priority_DueDate 
    ON MstActivity (strStatus, strPriority, dtDueDate)
    INCLUDE (strActivityGUID, strSubject, strAssignedToGUID, bolIsDeleted)
    WHERE bolIsDeleted = 0;

-- Index on assigned user for user-centric views
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MstActivity_AssignedTo_Status' AND object_id = OBJECT_ID('[dbo].[MstActivity]'))
    CREATE NONCLUSTERED INDEX IX_MstActivity_AssignedTo_Status 
    ON MstActivity (strAssignedToGUID, strStatus)
    INCLUDE (dtDueDate, dtScheduledStart, strActivityGUID, bolIsDeleted)
    WHERE bolIsDeleted = 0 AND strAssignedToGUID IS NOT NULL;

-- Index on tenant and active status for dashboard queries
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MstActivity_Tenant_Active' AND object_id = OBJECT_ID('[dbo].[MstActivity]'))
    CREATE NONCLUSTERED INDEX IX_MstActivity_Tenant_Active 
    ON MstActivity (strGroupGUID, bolIsActive)
    INCLUDE (strActivityGUID, strStatus, dtScheduledStart, bolIsDeleted)
    WHERE bolIsDeleted = 0;

-- Index on created date for sorting
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MstActivity_CreatedOn' AND object_id = OBJECT_ID('[dbo].[MstActivity]'))
    CREATE NONCLUSTERED INDEX IX_MstActivity_CreatedOn 
    ON MstActivity (dtCreatedOn DESC)
    INCLUDE (strActivityGUID, strStatus, strAssignedToGUID, bolIsDeleted);

-- Index on activity links for entity retrieval
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MstActivityLink_Entity_Activity' AND object_id = OBJECT_ID('[dbo].[MstActivityLink]'))
    CREATE NONCLUSTERED INDEX IX_MstActivityLink_Entity_Activity 
    ON MstActivityLink (strEntityType, strEntityGUID, strActivityGUID)
    WHERE strActivityGUID IS NOT NULL;

-- ========================================
-- 3. CREATE WORKFLOW TRIGGER PROCEDURES
-- ========================================

-- Note: The workflow system is already implemented in C# application code.
-- These are here for reference if you need to add SQL-side workflow automation later.

-- ========================================
-- 4. SEED DATA FOR ACTIVITY STATUS AND PRIORITY
-- ========================================

-- Note: Constants are defined in code, but you can add documentation here if needed.

-- ========================================
-- 5. VERIFICATION QUERIES
-- ========================================

-- Verify MstActivity schema
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'MstActivity'
ORDER BY ORDINAL_POSITION;

-- List all indexes on MstActivity
SELECT name, type_desc
FROM sys.indexes
WHERE object_id = OBJECT_ID('[dbo].[MstActivity]')
ORDER BY name;

COMMIT TRANSACTION;

PRINT 'Activity Enhancement Migration completed successfully!';
