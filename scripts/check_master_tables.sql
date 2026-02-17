-- Check if master tables exist
USE MasterDB;
GO

SELECT 'Checking master tables...' AS Status;

SELECT 
    TABLE_NAME,
    CASE 
        WHEN EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = T.TABLE_NAME AND TABLE_SCHEMA = 'dbo') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END AS TableStatus
FROM (
    VALUES 
        ('mstGroup'),
        ('mstOrganization'),
        ('mstModule'),
        ('mstUser'),
        ('mstRole'),
        ('mstMenu'),
        ('mstPermission')
) AS T(TABLE_NAME);

PRINT '';
SELECT 'All existing tables in dbo schema:' AS Info;
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;
