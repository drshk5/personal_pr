-- HRM Module Database Schema Initialization Script
-- This script creates the default tables, views, and stored procedures for the HRM module

-- We need to sanitize the organization GUID to remove hyphens for use in schema and constraint names
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(@organizationGUID, '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);
-- Use provided group GUID directly, no str version available
DECLARE @useGroupGUID NVARCHAR(50) = @groupGUID;
DECLARE @useYearGUID NVARCHAR(50) = @yearGUID;

-- Debug information - Print parameter values to verify what's being passed
PRINT 'Debug Information:';
PRINT 'Organization GUID: ' + @organizationGUID;
PRINT 'Group GUID: ' + ISNULL(@groupGUID, 'NULL');
PRINT 'Year GUID: ' + ISNULL(@yearGUID, 'NULL');
PRINT 'Using Group GUID: ' + @useGroupGUID;
PRINT 'Using Year GUID: ' + @useYearGUID;

-- Create schema if not exists
SET @sql = 'IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = ''' + @schemaName + ''') 
BEGIN 
    EXEC(''CREATE SCHEMA ' + @schemaName + ''') 
END';
EXEC sp_executesql @sql;

-- Employees Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''Employees'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.Employees (
        EmployeeID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        EmployeeCode NVARCHAR(50) NOT NULL,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(150) NULL,
        Phone NVARCHAR(20) NULL,
        HireDate DATE NOT NULL,
        DesignationID UNIQUEIDENTIFIER NULL,
        DepartmentID UNIQUEIDENTIFIER NULL,
        ReportsTo UNIQUEIDENTIFIER NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT ''Active'', -- Active, Inactive, Terminated, On Leave
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedBy UNIQUEIDENTIFIER NOT NULL,
        CreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        UpdatedBy UNIQUEIDENTIFIER NULL,
        UpdatedOn DATETIME NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_Employee_Code UNIQUE (EmployeeCode),
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_Employee_Email UNIQUE (Email)
    )
END';
EXEC sp_executesql @sql;

-- Departments Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''Departments'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.Departments (
        DepartmentID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        DepartmentCode NVARCHAR(50) NOT NULL,
        DepartmentName NVARCHAR(100) NOT NULL,
        ManagerID UNIQUEIDENTIFIER NULL,
        ParentDepartmentID UNIQUEIDENTIFIER NULL,
        Description NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedBy UNIQUEIDENTIFIER NOT NULL,
        CreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        UpdatedBy UNIQUEIDENTIFIER NULL,
        UpdatedOn DATETIME NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_Department_Code UNIQUE (DepartmentCode),
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_Department_Name UNIQUE (DepartmentName)
    )
END';
EXEC sp_executesql @sql;

-- Designations Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''Designations'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.Designations (
        DesignationID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        DesignationCode NVARCHAR(50) NOT NULL,
        DesignationName NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedBy UNIQUEIDENTIFIER NOT NULL,
        CreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        UpdatedBy UNIQUEIDENTIFIER NULL,
        UpdatedOn DATETIME NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_Designation_Code UNIQUE (DesignationCode),
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_Designation_Name UNIQUE (DesignationName)
    )
END';
EXEC sp_executesql @sql;

-- Add foreign keys
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''Employees'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
AND EXISTS (SELECT * FROM sys.tables WHERE name = ''Departments'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
AND EXISTS (SELECT * FROM sys.tables WHERE name = ''Designations'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = ''FK_' + @sanitizedOrgGUID + '_Employees_ReportsTo'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.Employees
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_Employees_ReportsTo
        FOREIGN KEY (ReportsTo) REFERENCES ' + QUOTENAME(@schemaName) + '.Employees(EmployeeID)
    END
    
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = ''FK_' + @sanitizedOrgGUID + '_Employees_Department'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.Employees
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_Employees_Department
        FOREIGN KEY (DepartmentID) REFERENCES ' + QUOTENAME(@schemaName) + '.Departments(DepartmentID)
    END
    
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = ''FK_' + @sanitizedOrgGUID + '_Employees_Designation'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.Employees
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_Employees_Designation
        FOREIGN KEY (DesignationID) REFERENCES ' + QUOTENAME(@schemaName) + '.Designations(DesignationID)
    END
    
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = ''FK_' + @sanitizedOrgGUID + '_Departments_ParentDepartment'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.Departments
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_Departments_ParentDepartment
        FOREIGN KEY (ParentDepartmentID) REFERENCES ' + QUOTENAME(@schemaName) + '.Departments(DepartmentID)
    END
    
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = ''FK_' + @sanitizedOrgGUID + '_Departments_Manager'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.Departments
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_Departments_Manager
        FOREIGN KEY (ManagerID) REFERENCES ' + QUOTENAME(@schemaName) + '.Employees(EmployeeID)
    END
END';
EXEC sp_executesql @sql;

-- Initial data for Departments and Designations
SET @sql = '
DECLARE @AdminUserID UNIQUEIDENTIFIER = ''b670c0a3-e07d-4fb5-b8da-e476535d5310'';

IF EXISTS (SELECT * FROM sys.tables WHERE name = ''Departments'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
AND NOT EXISTS (SELECT * FROM ' + QUOTENAME(@schemaName) + '.Departments WHERE DepartmentName = ''Administration'')
BEGIN
    -- Create default departments
    INSERT INTO ' + QUOTENAME(@schemaName) + '.Departments (DepartmentCode, DepartmentName, Description, CreatedBy)
    VALUES 
    (''ADMIN'', ''Administration'', ''Administrative department'', @AdminUserID),
    (''HR'', ''Human Resources'', ''Human Resources department'', @AdminUserID),
    (''FIN'', ''Finance'', ''Finance department'', @AdminUserID),
    (''IT'', ''Information Technology'', ''IT department'', @AdminUserID)
END';
EXEC sp_executesql @sql;

SET @sql = '
DECLARE @AdminUserID UNIQUEIDENTIFIER = ''b670c0a3-e07d-4fb5-b8da-e476535d5310'';

IF EXISTS (SELECT * FROM sys.tables WHERE name = ''Designations'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
AND NOT EXISTS (SELECT * FROM ' + QUOTENAME(@schemaName) + '.Designations WHERE DesignationName = ''Manager'')
BEGIN
    -- Create default designations
    INSERT INTO ' + QUOTENAME(@schemaName) + '.Designations (DesignationCode, DesignationName, Description, CreatedBy)
    VALUES 
    (''MGR'', ''Manager'', ''Department manager'', @AdminUserID),
    (''DIR'', ''Director'', ''Department director'', @AdminUserID),
    (''VP'', ''Vice President'', ''Vice President'', @AdminUserID),
    (''CEO'', ''Chief Executive Officer'', ''Company CEO'', @AdminUserID),
    (''CFO'', ''Chief Financial Officer'', ''Company CFO'', @AdminUserID),
    (''CTO'', ''Chief Technology Officer'', ''Company CTO'', @AdminUserID),
    (''COO'', ''Chief Operations Officer'', ''Company COO'', @AdminUserID)
END';
EXEC sp_executesql @sql;

PRINT 'HRM module organization-specific schema and initial data have been created successfully for organization: ' + @organizationGUID;
