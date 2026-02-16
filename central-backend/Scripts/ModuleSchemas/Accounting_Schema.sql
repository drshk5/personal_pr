-- Accounting Module Database Schema Initialization Script
-- This script creates the default tables, views, and stored procedures for the Accounting module

-- Parameters @organizationGUID, @groupGUID, and @yearGUID are passed from C# code as SqlParameters

-- We need to sanitize the organization GUID to remove hyphens for use in schema and constraint names
DECLARE @sanitizedOrgGUID NVARCHAR(50) = REPLACE(CAST(@organizationGUID AS NVARCHAR(50)), '-', '');
DECLARE @schemaName NVARCHAR(100) = 'ORG_' + @sanitizedOrgGUID;
DECLARE @sql NVARCHAR(MAX);
-- Use provided group GUID directly, no str version available
DECLARE @useGroupGUID NVARCHAR(50) = CAST(@groupGUID AS NVARCHAR(50));
DECLARE @useYearGUID NVARCHAR(50) = CAST(@yearGUID AS NVARCHAR(50));
-- Country GUID: must be passed as a SQL parameter from the C# service, holding the organization's country
-- If not passed or NULL, no default country-specific accounts will be created
-- IMPORTANT: Do NOT re-declare @countryGUID here.
-- The value is provided as a SQL parameter from the C# caller.
-- Re-declaring would shadow the parameter and reset it to NULL in each batch.

-- Debug information - Print parameter values to verify what's being passed
PRINT 'Debug Information:';
PRINT 'Organization GUID: ' + CAST(@organizationGUID AS NVARCHAR(50));
PRINT 'Country GUID (from parameter): ' + ISNULL(CAST(@countryGUID AS NVARCHAR(50)), 'NULL - No country-specific accounts will be created');
PRINT 'Year GUID: ' + ISNULL(CAST(@yearGUID AS NVARCHAR(50)), 'NULL');
PRINT 'Using Group GUID: ' + @useGroupGUID;
PRINT 'Using Year GUID: ' + @useYearGUID;

-- Create schema if not exists
SET @sql = 'IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = ''' + @schemaName + ''') 
BEGIN 
    EXEC(''CREATE SCHEMA ' + @schemaName + ''') 
END';
EXEC sp_executesql @sql;

-- Stored Procedure: sp_GetTrialBalance (creates per-tenant under @schemaName)
-- Enhanced version with comprehensive validation and error handling
SET @sql = N'
CREATE OR ALTER PROCEDURE ' + QUOTENAME(@schemaName) + N'.[sp_GetTrialBalance]
    @strGroupGUID UNIQUEIDENTIFIER,
    @strOrganizationGUID UNIQUEIDENTIFIER,
    @strYearGUID UNIQUEIDENTIFIER,
    @dtFromDate DATE,
    @dtToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Input validation
        IF @strGroupGUID IS NULL
        BEGIN
            RAISERROR(''Group GUID is required'', 16, 1);
            RETURN -1; -- Invalid Group GUID
        END

        IF @strOrganizationGUID IS NULL
        BEGIN
            RAISERROR(''Organization GUID is required'', 16, 1);
            RETURN -2; -- Invalid Organization GUID
        END

        IF @strYearGUID IS NULL
        BEGIN
            RAISERROR(''Year GUID is required'', 16, 1);
            RETURN -3; -- Invalid Year GUID
        END

        IF @dtFromDate IS NULL
        BEGIN
            RAISERROR(''From Date is required'', 16, 1);
            RETURN -4; -- Invalid From Date
        END

        IF @dtToDate IS NULL
        BEGIN
            RAISERROR(''To Date is required'', 16, 1);
            RETURN -5; -- Invalid To Date
        END

        IF @dtFromDate > @dtToDate
        BEGIN
            RAISERROR(''From Date cannot be greater than To Date'', 16, 1);
            RETURN -6; -- Invalid date range
        END

        -- STEP 1: Get opening balances for each account (transactions before @dtFromDate)
        SELECT 
            strAccountGUID,
            ABS(SUM(ISNULL(dblDebit_BaseCurrency, 0))) AS dblOpeningDebit_Base,
            ABS(SUM(ISNULL(dblCredit_BaseCurrency, 0))) AS dblOpeningCredit_Base,
            SUM(ISNULL(dblCredit_BaseCurrency, 0)) - SUM(ISNULL(dblDebit_BaseCurrency, 0)) AS dblOpeningBalance_Base
        INTO #OpeningBalances
        FROM ' + QUOTENAME(@schemaName) + N'.tranLedger
        WHERE strGroupGUID = @strGroupGUID
          AND strOrganizationGUID = @strOrganizationGUID
          AND strYearGUID = @strYearGUID
          AND dVoucherDate < @dtFromDate
        GROUP BY strAccountGUID;

        -- STEP 2: Get account balances from tranLedger within date range (period transactions)
        SELECT 
            strAccountGUID,
            ABS(SUM(ISNULL(dblDebit_BaseCurrency, 0))) AS dblPeriodDebit_Base,
            ABS(SUM(ISNULL(dblCredit_BaseCurrency, 0))) AS dblPeriodCredit_Base,
            SUM(ISNULL(dblCredit_BaseCurrency, 0)) - SUM(ISNULL(dblDebit_BaseCurrency, 0)) AS dblPeriodBalance_Base
        INTO #PeriodBalances
        FROM ' + QUOTENAME(@schemaName) + N'.tranLedger
        WHERE strGroupGUID = @strGroupGUID
          AND strOrganizationGUID = @strOrganizationGUID
          AND strYearGUID = @strYearGUID
          AND dVoucherDate >= @dtFromDate
          AND dVoucherDate <= @dtToDate
        GROUP BY strAccountGUID;

        -- STEP 3: Combine opening and period balances
        SELECT 
            COALESCE(ob.strAccountGUID, pb.strAccountGUID) AS strAccountGUID,
            ISNULL(ob.dblOpeningDebit_Base, 0) AS dblOpeningDebit_Base,
            ISNULL(ob.dblOpeningCredit_Base, 0) AS dblOpeningCredit_Base,
            ISNULL(ob.dblOpeningBalance_Base, 0) AS dblOpeningBalance_Base,
            ISNULL(pb.dblPeriodDebit_Base, 0) AS dblPeriodDebit_Base,
            ISNULL(pb.dblPeriodCredit_Base, 0) AS dblPeriodCredit_Base,
            ISNULL(pb.dblPeriodBalance_Base, 0) AS dblPeriodBalance_Base,
            -- Total balances (opening + period)
            ISNULL(ob.dblOpeningDebit_Base, 0) + ISNULL(pb.dblPeriodDebit_Base, 0) AS dblTotalDebit_Base,
            ISNULL(ob.dblOpeningCredit_Base, 0) + ISNULL(pb.dblPeriodCredit_Base, 0) AS dblTotalCredit_Base,
            ISNULL(ob.dblOpeningBalance_Base, 0) + ISNULL(pb.dblPeriodBalance_Base, 0) AS dblClosingBalance_Base
        INTO #AccountBalances
        FROM #OpeningBalances ob
        FULL OUTER JOIN #PeriodBalances pb ON ob.strAccountGUID = pb.strAccountGUID;

        -- Get renamed schedule names (lookup table) - Only those with active rename
        SELECT 
            strScheduleGUID,
            strRenameScheduleName
        INTO #RenamedSchedules
        FROM masterDB.dbo.mstRenameSchedule
        WHERE strGroupGUID = @strGroupGUID;

        -- Final result with simplified fields: opening balance, debit, credit, closing balance
        SELECT 
            s.strScheduleGUID,
            s.strScheduleCode,
            COALESCE(rs.strRenameScheduleName, s.strScheduleName) AS strScheduleName,
            a.strAccountGUID,
            a.strUDFCode AS strAccountCode,
            a.strAccountName,
            
            -- Simplified fields matching C# code expectations
            ISNULL(ab.dblOpeningBalance_Base, 0) AS dblOpeningBalance_Base,
            ISNULL(ab.dblPeriodDebit_Base, 0) AS dblDebit_Base,
            ISNULL(ab.dblPeriodCredit_Base, 0) AS dblCredit_Base,
            ISNULL(ab.dblClosingBalance_Base, 0) AS dblBalance_Base,
            
            @dtFromDate AS dtFromDate,
            @dtToDate AS dtToDate
        FROM ' + QUOTENAME(@schemaName) + N'.mstAccount a
        INNER JOIN #AccountBalances ab ON a.strAccountGUID = ab.strAccountGUID
        LEFT JOIN masterDB.dbo.mstSchedule s ON a.strScheduleGUID = s.strScheduleGUID
        LEFT JOIN #RenamedSchedules rs ON s.strScheduleGUID = rs.strScheduleGUID
        WHERE a.strOrganizationGUID = @strOrganizationGUID
          AND a.bolIsActive = 1
          -- Only show accounts with some activity (opening or period transactions)
          AND (ab.dblTotalDebit_Base > 0 OR ab.dblTotalCredit_Base > 0)
        ORDER BY 
            s.strScheduleCode,
            a.strUDFCode,
            a.strAccountName;

        -- Cleanup temp tables
        DROP TABLE IF EXISTS #OpeningBalances;
        DROP TABLE IF EXISTS #PeriodBalances;
        DROP TABLE IF EXISTS #AccountBalances;
        DROP TABLE IF EXISTS #RenamedSchedules;
        
        -- Success - return 0
        RETURN 0;

    END TRY
    BEGIN CATCH
        -- Cleanup temp tables in case of error
        DROP TABLE IF EXISTS #OpeningBalances;
        DROP TABLE IF EXISTS #PeriodBalances;
        DROP TABLE IF EXISTS #AccountBalances;
        DROP TABLE IF EXISTS #RenamedSchedules;

        -- Return error
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        -- Return generic error code
        RETURN -99; -- General error
        
        -- Re-raise the error for logging purposes
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;

END
';

EXEC sp_executesql @sql;

-- Stored Procedure: sp_GetLedgerReport (creates per-tenant under @schemaName)
SET @sql = N'
CREATE OR ALTER PROCEDURE ' + QUOTENAME(@schemaName) + N'.[sp_GetLedgerReport]
    @strGroupGUID UNIQUEIDENTIFIER,
    @strOrganizationGUID UNIQUEIDENTIFIER,
    @strYearGUID UNIQUEIDENTIFIER,
    @dtFromDate DATE,
    @dtToDate DATE,
    @strAccountGUID UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- CTE to get ledger entries with opening balance calculation
    ;WITH LedgerData AS (
        SELECT 
            l.strLedgerGUID,
            l.strAccountGUID,
            l.dVoucherDate AS dtTradeDate,
            l.strNarration,
            COALESCE(l.strVoucherNo, l.strRefNo, '''') AS strBillNo,
            l.strVoucherType,
            l.strVoucherGUID,
            ISNULL(l.dblDebit, 0) AS dblDebit,
            ISNULL(l.dblCredit, 0) AS dblCredit,
            ISNULL(l.dblDebit_BaseCurrency, 0) AS dblDebit_Base,
            ISNULL(l.dblCredit_BaseCurrency, 0) AS dblCredit_Base,
            l.strCurrencyTypeGUID,
            l.dblExchangeRate,
            l.strPartyGUID,
            l.intSeqNo,
            l.dtCreatedOn,
            ROW_NUMBER() OVER (ORDER BY l.dVoucherDate, l.strVoucherNo ASC) AS intSeqNo_OrderBy
        FROM ' + QUOTENAME(@schemaName) + N'.tranLedger l
        WHERE l.strGroupGUID = @strGroupGUID
          AND l.strOrganizationGUID = @strOrganizationGUID
          AND l.strYearGUID = @strYearGUID
          AND l.dVoucherDate BETWEEN @dtFromDate AND @dtToDate
          AND (@strAccountGUID IS NULL OR l.strAccountGUID = @strAccountGUID)
    ),
    
    -- Calculate Opening Balance (transactions before the from date)
    OpeningBalance AS (
        SELECT 
            strAccountGUID,
            SUM(ISNULL(dblCredit, 0)) - SUM(ISNULL(dblDebit, 0)) AS dblOpeningBalance,
            SUM(ISNULL(dblCredit_BaseCurrency, 0)) - SUM(ISNULL(dblDebit_BaseCurrency, 0)) AS dblOpeningBalance_Base
        FROM ' + QUOTENAME(@schemaName) + N'.tranLedger
        WHERE strGroupGUID = @strGroupGUID
          AND strOrganizationGUID = @strOrganizationGUID
          AND strYearGUID = @strYearGUID
          AND dVoucherDate < @dtFromDate
          AND (@strAccountGUID IS NULL OR strAccountGUID = @strAccountGUID)
        GROUP BY strAccountGUID
    ),
    
    -- Aggregate opening balance across all accounts (used when no account filter)
    TotalOpening AS (
        SELECT 
            SUM(dblOpeningBalance) AS dblOpeningBalance,
            SUM(dblOpeningBalance_Base) AS dblOpeningBalance_Base
        FROM OpeningBalance
    ),
    
    -- Number the rows for running balance calculation
    -- If specific account is filtered: partition by account
    -- If no account filter: single partition for all accounts combined
    NumberedLedger AS (
        SELECT 
            ld.*,
            ISNULL(ob.dblOpeningBalance, 0) AS dblOpeningBalance,
            ISNULL(ob.dblOpeningBalance_Base, 0) AS dblOpeningBalance_Base,
            CASE 
                WHEN @strAccountGUID IS NOT NULL THEN
                    ROW_NUMBER() OVER (
                        PARTITION BY ld.strAccountGUID 
                        ORDER BY ld.intSeqNo_OrderBy ASC
                    )
                ELSE
                    ROW_NUMBER() OVER (
                        ORDER BY ld.intSeqNo_OrderBy ASC
                    )
            END AS RowNum
        FROM LedgerData ld
        LEFT JOIN OpeningBalance ob ON ld.strAccountGUID = ob.strAccountGUID
    ),
    
    -- Calculate running balance using recursive CTE
    RunningBalance AS (
        -- Base case: first row for each account
        SELECT 
            strLedgerGUID,
            strAccountGUID,
            dtTradeDate,
            strNarration,
            strBillNo,
            strVoucherType,
            strVoucherGUID,
            dblDebit,
            dblCredit,
            dblDebit_Base,
            dblCredit_Base,
            strCurrencyTypeGUID,
            dblExchangeRate,
            strPartyGUID,
            intSeqNo,
            dtCreatedOn,
            intSeqNo_OrderBy,
            RowNum,
            dblOpeningBalance,
            dblOpeningBalance_Base,
            -- Running Balance = Opening Balance + Credit - Debit for first row
            (dblOpeningBalance + dblCredit - dblDebit) AS dblBalance,
            (dblOpeningBalance_Base + dblCredit_Base - dblDebit_Base) AS dblBalance_Base
        FROM NumberedLedger
        WHERE RowNum = 1
        
        UNION ALL
        
        -- Recursive case: subsequent rows carry forward previous balance
        SELECT 
            nl.strLedgerGUID,
            nl.strAccountGUID,
            nl.dtTradeDate,
            nl.strNarration,
            nl.strBillNo,
            nl.strVoucherType,
            nl.strVoucherGUID,
            nl.dblDebit,
            nl.dblCredit,
            nl.dblDebit_Base,
            nl.dblCredit_Base,
            nl.strCurrencyTypeGUID,
            nl.dblExchangeRate,
            nl.strPartyGUID,
            nl.intSeqNo,
            nl.dtCreatedOn,
            nl.intSeqNo_OrderBy,
            nl.RowNum,
            nl.dblOpeningBalance,
            nl.dblOpeningBalance_Base,
            -- Running Balance = Previous Row Balance + Current Credit - Current Debit
            (rb.dblBalance + nl.dblCredit - nl.dblDebit) AS dblBalance,
            (rb.dblBalance_Base + nl.dblCredit_Base - nl.dblDebit_Base) AS dblBalance_Base
        FROM NumberedLedger nl
        INNER JOIN RunningBalance rb 
            ON CASE 
                WHEN @strAccountGUID IS NOT NULL THEN
                    CASE WHEN nl.strAccountGUID = rb.strAccountGUID AND nl.RowNum = rb.RowNum + 1 THEN 1 ELSE 0 END
                ELSE
                    CASE WHEN nl.RowNum = rb.RowNum + 1 THEN 1 ELSE 0 END
            END = 1
    ),
    -- Opening balance row logic:
    -- - If a specific account is requested, emit one opening row for that account
    -- - If no account is requested, emit a single combined opening row (no account GUID)
    OpeningRows AS (
        -- Specific account
        SELECT 
            NEWID() AS strLedgerGUID,
            @strAccountGUID AS strAccountGUID,
            @dtFromDate AS dtTradeDate,
            ''Opening Balance'' AS strNarration,
            NULL AS strBillNo,
            NULL AS strVoucherType,
            NULL AS strVoucherGUID,
            CAST(0 AS DECIMAL(18, 2)) AS dblDebit,
            CAST(0 AS DECIMAL(18, 2)) AS dblCredit,
            CAST(0 AS DECIMAL(18, 2)) AS dblDebit_Base,
            CAST(0 AS DECIMAL(18, 2)) AS dblCredit_Base,
            NULL AS strCurrencyTypeGUID,
            CAST(NULL AS DECIMAL(18, 6)) AS dblExchangeRate,
            NULL AS strPartyGUID,
            0 AS intSeqNo,
            DATEADD(SECOND, -1, CAST(@dtFromDate AS DATETIME)) AS dtCreatedOn,
            0 AS intSeqNo_OrderBy,
            0 AS RowNum,
            ISNULL(ob.dblOpeningBalance, 0) AS dblOpeningBalance,
            ISNULL(ob.dblOpeningBalance_Base, 0) AS dblOpeningBalance_Base,
            ISNULL(ob.dblOpeningBalance, 0) AS dblBalance,
            ISNULL(ob.dblOpeningBalance_Base, 0) AS dblBalance_Base
        FROM (SELECT 1 AS x) AS d
        LEFT JOIN OpeningBalance ob ON ob.strAccountGUID = @strAccountGUID
        WHERE @strAccountGUID IS NOT NULL

        UNION ALL

        -- Combined opening balance across all accounts
        SELECT 
            NEWID() AS strLedgerGUID,
            CAST(''00000000-0000-0000-0000-000000000000'' AS UNIQUEIDENTIFIER) AS strAccountGUID,
            @dtFromDate AS dtTradeDate,
            ''Opening Balance'' AS strNarration,
            NULL AS strBillNo,
            NULL AS strVoucherType,
            NULL AS strVoucherGUID,
            CAST(0 AS DECIMAL(18, 2)) AS dblDebit,
            CAST(0 AS DECIMAL(18, 2)) AS dblCredit,
            CAST(0 AS DECIMAL(18, 2)) AS dblDebit_Base,
            CAST(0 AS DECIMAL(18, 2)) AS dblCredit_Base,
            NULL AS strCurrencyTypeGUID,
            CAST(NULL AS DECIMAL(18, 6)) AS dblExchangeRate,
            NULL AS strPartyGUID,
            0 AS intSeqNo,
            DATEADD(SECOND, -1, CAST(@dtFromDate AS DATETIME)) AS dtCreatedOn,
            0 AS intSeqNo_OrderBy,
            0 AS RowNum,
            ISNULL(tob.dblOpeningBalance, 0) AS dblOpeningBalance,
            ISNULL(tob.dblOpeningBalance_Base, 0) AS dblOpeningBalance_Base,
            ISNULL(tob.dblOpeningBalance, 0) AS dblBalance,
            ISNULL(tob.dblOpeningBalance_Base, 0) AS dblBalance_Base
        FROM (SELECT 1 AS x) AS d
        LEFT JOIN TotalOpening tob ON 1 = 1
        WHERE @strAccountGUID IS NULL
    ),
    FinalRows AS (
        SELECT 
            strLedgerGUID,
            strAccountGUID,
            dtTradeDate,
            strNarration,
            strBillNo,
            strVoucherType,
            strVoucherGUID,
            dblDebit,
            dblCredit,
            dblDebit_Base,
            dblCredit_Base,
            strCurrencyTypeGUID,
            dblExchangeRate,
            strPartyGUID,
            intSeqNo,
            dtCreatedOn,
            intSeqNo_OrderBy,
            RowNum,
            dblOpeningBalance,
            dblOpeningBalance_Base,
            dblBalance,
            dblBalance_Base
        FROM OpeningRows
        UNION ALL
        SELECT 
            strLedgerGUID,
            strAccountGUID,
            dtTradeDate,
            strNarration,
            strBillNo,
            strVoucherType,
            strVoucherGUID,
            dblDebit,
            dblCredit,
            dblDebit_Base,
            dblCredit_Base,
            strCurrencyTypeGUID,
            dblExchangeRate,
            strPartyGUID,
            intSeqNo,
            dtCreatedOn,
            intSeqNo_OrderBy,
            RowNum,
            dblOpeningBalance,
            dblOpeningBalance_Base,
            dblBalance,
            dblBalance_Base
        FROM RunningBalance
    ),
    TotalRow AS (
        SELECT 
            NEWID() AS strLedgerGUID,
            CAST(''00000000-0000-0000-0000-000000000000'' AS UNIQUEIDENTIFIER) AS strAccountGUID,
            @dtToDate AS dtTradeDate,
            ''Total'' AS strNarration,
            NULL AS strBillNo,
            NULL AS strVoucherType,
            NULL AS strVoucherGUID,
            (SELECT SUM(fr.dblDebit) FROM FinalRows fr) AS dblDebit,
            (SELECT SUM(fr.dblCredit) FROM FinalRows fr) AS dblCredit,
            (SELECT SUM(fr.dblDebit_Base) FROM FinalRows fr) AS dblDebit_Base,
            (SELECT SUM(fr.dblCredit_Base) FROM FinalRows fr) AS dblCredit_Base,
            NULL AS strCurrencyTypeGUID,
            NULL AS dblExchangeRate,
            NULL AS strPartyGUID,
            0 AS intSeqNo,
            DATEADD(SECOND, 1, CAST(@dtToDate AS DATETIME)) AS dtCreatedOn,
            9999999 AS intSeqNo_OrderBy,
            0 AS RowNum,
            0 AS dblOpeningBalance,
            0 AS dblOpeningBalance_Base,
            closingVals.dblBalance AS dblBalance,
            closingVals.dblBalance_Base AS dblBalance_Base
        FROM (SELECT 1 AS x) AS d
        CROSS APPLY (
            SELECT TOP 1 fr2.dblBalance, fr2.dblBalance_Base
            FROM FinalRows fr2
            ORDER BY fr2.intSeqNo_OrderBy DESC
        ) AS closingVals
    )
    
    -- Final output (include totals row)
    SELECT 
        fr.strLedgerGUID,
        fr.strAccountGUID,
        a.strAccountName,
        a.strUDFCode AS strAccountCode,
        fr.dtTradeDate,
        fr.strNarration,
        fr.strBillNo,
        fr.strVoucherType,
        fr.strVoucherGUID,
        fr.dblDebit,
        fr.dblCredit,
        ABS(fr.dblBalance) AS dblBalance,
        CASE WHEN fr.dblBalance >= 0 THEN ''Cr'' ELSE ''Dr'' END AS strBalanceType,
        fr.dblDebit_Base,
        fr.dblCredit_Base,
        ABS(fr.dblBalance_Base) AS dblBalance_Base,
        CASE WHEN fr.dblBalance_Base >= 0 THEN ''Cr'' ELSE ''Dr'' END AS strBalanceType_Base,
        fr.strCurrencyTypeGUID,
        fr.dblExchangeRate,
        fr.strPartyGUID,
        NULL AS strPartyName,  -- Party table not available, set to NULL
        ABS(fr.dblOpeningBalance) AS dblOpeningBalance,
        CASE WHEN fr.dblOpeningBalance >= 0 THEN ''Cr'' ELSE ''Dr'' END AS strOpeningBalanceType,
        ABS(fr.dblOpeningBalance_Base) AS dblOpeningBalance_Base,
        CASE WHEN fr.dblOpeningBalance_Base >= 0 THEN ''Cr'' ELSE ''Dr'' END AS strOpeningBalanceType_Base
    FROM (
        SELECT * FROM FinalRows
        UNION ALL
        SELECT * FROM TotalRow
    ) fr
    LEFT JOIN ' + QUOTENAME(@schemaName) + N'.mstAccount a ON fr.strAccountGUID = a.strAccountGUID
    ORDER BY fr.intSeqNo_OrderBy ASC
    
    OPTION (MAXRECURSION 0);  -- Allow unlimited recursion for large datasets
END
';

EXEC sp_executesql @sql;

-- ========================================
-- Enhanced Stored Procedures with Comprehensive Validation
-- ========================================

-- Create enhanced stored procedure for getting trial balance with validation
SET @sql = '
CREATE OR ALTER PROCEDURE [' + @schemaName + '].[sp_GetTrialBalance]
    @strGroupGUID UNIQUEIDENTIFIER,
    @strOrganizationGUID UNIQUEIDENTIFIER,
    @strYearGUID UNIQUEIDENTIFIER,
    @dtFromDate DATE,
    @dtToDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Input validation
        IF @strGroupGUID IS NULL
        BEGIN
            RAISERROR(''Group GUID is required'', 16, 1);
            RETURN -1;
        END
        
        IF @strOrganizationGUID IS NULL
        BEGIN
            RAISERROR(''Organization GUID is required'', 16, 1);
            RETURN -2;
        END
        
        IF @strYearGUID IS NULL
        BEGIN
            RAISERROR(''Year GUID is required'', 16, 1);
            RETURN -3;
        END
        
        IF @dtFromDate IS NULL
        BEGIN
            RAISERROR(''From Date is required'', 16, 1);
            RETURN -4;
        END
        
        IF @dtToDate IS NULL
        BEGIN
            RAISERROR(''To Date is required'', 16, 1);
            RETURN -5;
        END
        
        IF @dtFromDate > @dtToDate
        BEGIN
            RAISERROR(''From Date cannot be greater than To Date'', 16, 1);
            RETURN -6;
        END

        -- STEP 1: Get opening balances for each account (transactions before @dtFromDate)
        SELECT 
            strAccountGUID,
            ABS(SUM(ISNULL(dblDebit_BaseCurrency, 0))) AS dblOpeningDebit_Base,
            ABS(SUM(ISNULL(dblCredit_BaseCurrency, 0))) AS dblOpeningCredit_Base,
            SUM(ISNULL(dblCredit_BaseCurrency, 0)) - SUM(ISNULL(dblDebit_BaseCurrency, 0)) AS dblOpeningBalance_Base
        INTO #OpeningBalances
        FROM [' + @schemaName + '].tranLedger
        WHERE strGroupGUID = @strGroupGUID
          AND strOrganizationGUID = @strOrganizationGUID
          AND strYearGUID = @strYearGUID
          AND dVoucherDate < @dtFromDate
        GROUP BY strAccountGUID;

        -- STEP 2: Get account balances from tranLedger within date range (period transactions)
        SELECT 
            strAccountGUID,
            ABS(SUM(ISNULL(dblDebit_BaseCurrency, 0))) AS dblPeriodDebit_Base,
            ABS(SUM(ISNULL(dblCredit_BaseCurrency, 0))) AS dblPeriodCredit_Base,
            SUM(ISNULL(dblCredit_BaseCurrency, 0)) - SUM(ISNULL(dblDebit_BaseCurrency, 0)) AS dblPeriodBalance_Base
        INTO #PeriodBalances
        FROM [' + @schemaName + '].tranLedger
        WHERE strGroupGUID = @strGroupGUID
          AND strOrganizationGUID = @strOrganizationGUID
          AND strYearGUID = @strYearGUID
          AND dVoucherDate >= @dtFromDate
          AND dVoucherDate <= @dtToDate
        GROUP BY strAccountGUID;

        -- STEP 3: Combine opening and period balances
        SELECT 
            COALESCE(ob.strAccountGUID, pb.strAccountGUID) AS strAccountGUID,
            ISNULL(ob.dblOpeningDebit_Base, 0) AS dblOpeningDebit_Base,
            ISNULL(ob.dblOpeningCredit_Base, 0) AS dblOpeningCredit_Base,
            ISNULL(ob.dblOpeningBalance_Base, 0) AS dblOpeningBalance_Base,
            ISNULL(pb.dblPeriodDebit_Base, 0) AS dblPeriodDebit_Base,
            ISNULL(pb.dblPeriodCredit_Base, 0) AS dblPeriodCredit_Base,
            ISNULL(pb.dblPeriodBalance_Base, 0) AS dblPeriodBalance_Base,
            -- Total balances (opening + period)
            ISNULL(ob.dblOpeningDebit_Base, 0) + ISNULL(pb.dblPeriodDebit_Base, 0) AS dblTotalDebit_Base,
            ISNULL(ob.dblOpeningCredit_Base, 0) + ISNULL(pb.dblPeriodCredit_Base, 0) AS dblTotalCredit_Base,
            ISNULL(ob.dblOpeningBalance_Base, 0) + ISNULL(pb.dblPeriodBalance_Base, 0) AS dblClosingBalance_Base
        INTO #AccountBalances
        FROM #OpeningBalances ob
        FULL OUTER JOIN #PeriodBalances pb ON ob.strAccountGUID = pb.strAccountGUID;

        -- Get renamed schedule names (lookup table) - Only those with active rename
        SELECT 
            strScheduleGUID,
            strRenameScheduleName
        INTO #RenamedSchedules
        FROM masterDB.dbo.mstRenameSchedule
        WHERE strGroupGUID = @strGroupGUID;

        -- Final result with simplified fields: opening balance, debit, credit, closing balance
        SELECT 
            s.strScheduleGUID,
            s.strScheduleCode,
            COALESCE(rs.strRenameScheduleName, s.strScheduleName) AS strScheduleName,
            a.strAccountGUID,
            a.strUDFCode AS strAccountCode,
            a.strAccountName,
            
            -- Simplified fields matching C# code expectations
            ISNULL(ab.dblOpeningBalance_Base, 0) AS dblOpeningBalance_Base,
            ISNULL(ab.dblPeriodDebit_Base, 0) AS dblDebit_Base,
            ISNULL(ab.dblPeriodCredit_Base, 0) AS dblCredit_Base,
            ISNULL(ab.dblClosingBalance_Base, 0) AS dblBalance_Base,
            
            @dtFromDate AS dtFromDate,
            @dtToDate AS dtToDate
        FROM [' + @schemaName + '].mstAccount a
        INNER JOIN #AccountBalances ab ON a.strAccountGUID = ab.strAccountGUID
        LEFT JOIN masterDB.dbo.mstSchedule s ON a.strScheduleGUID = s.strScheduleGUID
        LEFT JOIN #RenamedSchedules rs ON s.strScheduleGUID = rs.strScheduleGUID
        WHERE a.strOrganizationGUID = @strOrganizationGUID
          AND a.bolIsActive = 1
          -- Only show accounts with some activity (opening or period transactions)
          AND (ab.dblTotalDebit_Base > 0 OR ab.dblTotalCredit_Base > 0)
        ORDER BY 
            s.strScheduleCode,
            a.strUDFCode,
            a.strAccountName;

        -- Cleanup temp tables
        DROP TABLE IF EXISTS #OpeningBalances;
        DROP TABLE IF EXISTS #PeriodBalances;
        DROP TABLE IF EXISTS #AccountBalances;
        DROP TABLE IF EXISTS #RenamedSchedules;
        
        -- Return success code
        RETURN 0;
        
    END TRY
    BEGIN CATCH
        -- Cleanup temp tables in case of error
        DROP TABLE IF EXISTS #OpeningBalances;
        DROP TABLE IF EXISTS #PeriodBalances;
        DROP TABLE IF EXISTS #AccountBalances;
        DROP TABLE IF EXISTS #RenamedSchedules;
        
        -- Return error
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        -- Return generic error code
        RETURN -99;
        
        -- Re-raise the error for logging purposes
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END
';
EXEC sp_executesql @sql;

-- Create enhanced stored procedure for getting profit & loss report with validation
SET @sql = '
CREATE OR ALTER PROCEDURE [' + @schemaName + '].[sp_GetProfitAndLoss]
    @strGroupGUID UNIQUEIDENTIFIER,
    @strOrganizationGUID UNIQUEIDENTIFIER,
    @strYearGUID UNIQUEIDENTIFIER,
    @dtFromDate DATE,
    @dtToDate DATE,
    @intMaxLevel INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Input validation
        IF @strGroupGUID IS NULL
        BEGIN
            RAISERROR(''Group GUID is required'', 16, 1);
            RETURN -1;
        END
        
        IF @strOrganizationGUID IS NULL
        BEGIN
            RAISERROR(''Organization GUID is required'', 16, 1);
            RETURN -2;
        END
        
        IF @strYearGUID IS NULL
        BEGIN
            RAISERROR(''Year GUID is required'', 16, 1);
            RETURN -3;
        END
        
        IF @dtFromDate IS NULL
        BEGIN
            RAISERROR(''From Date is required'', 16, 1);
            RETURN -4;
        END
        
        IF @dtToDate IS NULL
        BEGIN
            RAISERROR(''To Date is required'', 16, 1);
            RETURN -5;
        END
        
        IF @dtFromDate > @dtToDate
        BEGIN
            RAISERROR(''From Date cannot be greater than To Date'', 16, 1);
            RETURN -6;
        END

        -- Basic P&L report with validation
        SELECT 
            s.strScheduleGUID,
            s.strScheduleCode,
            s.strScheduleName,
            0 AS intLevel,
            NULL AS strParentScheduleGUID,
            COUNT(a.strAccountGUID) AS intAccountCount,
            0 AS dblScheduleOpeningDebit_Base,
            0 AS dblScheduleOpeningCredit_Base,
            0 AS dblScheduleOpeningBalance_Base,
            ABS(SUM(ISNULL(l.dblDebit_BaseCurrency, 0))) AS dblSchedulePeriodDebit_Base,
            ABS(SUM(ISNULL(l.dblCredit_BaseCurrency, 0))) AS dblSchedulePeriodCredit_Base,
            SUM(ISNULL(l.dblCredit_BaseCurrency, 0)) - SUM(ISNULL(l.dblDebit_BaseCurrency, 0)) AS dblSchedulePeriodBalance_Base,
            SUM(ISNULL(l.dblCredit_BaseCurrency, 0)) - SUM(ISNULL(l.dblDebit_BaseCurrency, 0)) AS dblScheduleBalance_Base,
            a.strAccountGUID,
            a.strUDFCode AS strAccountCode,
            a.strAccountName,
            0 AS dblAccountOpeningDebit_Base,
            0 AS dblAccountOpeningCredit_Base,
            0 AS dblAccountOpeningBalance_Base,
            ABS(SUM(ISNULL(l.dblDebit_BaseCurrency, 0))) AS dblAccountPeriodDebit_Base,
            ABS(SUM(ISNULL(l.dblCredit_BaseCurrency, 0))) AS dblAccountPeriodCredit_Base,
            SUM(ISNULL(l.dblCredit_BaseCurrency, 0)) - SUM(ISNULL(l.dblDebit_BaseCurrency, 0)) AS dblAccountPeriodBalance_Base,
            SUM(ISNULL(l.dblCredit_BaseCurrency, 0)) - SUM(ISNULL(l.dblDebit_BaseCurrency, 0)) AS dblAccountBalance_Base,
            @dtFromDate AS dtFromDate,
            @dtToDate AS dtToDate,
            ROW_NUMBER() OVER (ORDER BY s.strScheduleCode, a.strUDFCode) AS intRowID
        FROM [' + @schemaName + '].mstAccount a
        LEFT JOIN [' + @schemaName + '].tranLedger l ON a.strAccountGUID = l.strAccountGUID
            AND l.strGroupGUID = @strGroupGUID
            AND l.strOrganizationGUID = @strOrganizationGUID
            AND l.strYearGUID = @strYearGUID
            AND l.dVoucherDate >= @dtFromDate
            AND l.dVoucherDate <= @dtToDate
        LEFT JOIN masterDB.dbo.mstSchedule s ON a.strScheduleGUID = s.strScheduleGUID
        WHERE a.strOrganizationGUID = @strOrganizationGUID
          AND a.bolIsActive = 1
          AND (s.strScheduleCode LIKE ''4%'' OR s.strScheduleCode LIKE ''5%'')  -- Revenue and Expense schedules
        GROUP BY 
            s.strScheduleGUID, s.strScheduleCode, s.strScheduleName,
            a.strAccountGUID, a.strUDFCode, a.strAccountName
        HAVING SUM(ISNULL(l.dblDebit_BaseCurrency, 0)) + SUM(ISNULL(l.dblCredit_BaseCurrency, 0)) > 0
        ORDER BY s.strScheduleCode, a.strUDFCode;
        
        -- Success - return 0
        RETURN 0;

    END TRY
    BEGIN CATCH
        -- Return error
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        -- Return generic error code
        RETURN -99;
        
        -- Re-raise the error for logging purposes
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END
';
EXEC sp_executesql @sql;

-- Create enhanced stored procedure for getting balance sheet report with validation
SET @sql = '
CREATE OR ALTER PROCEDURE [' + @schemaName + '].[sp_GetBalanceSheet]
    @strGroupGUID UNIQUEIDENTIFIER,
    @strOrganizationGUID UNIQUEIDENTIFIER,
    @strYearGUID UNIQUEIDENTIFIER,
    @dtFromDate DATE,
    @dtToDate DATE,
    @intMaxLevel INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Input validation
        IF @strGroupGUID IS NULL
        BEGIN
            RAISERROR(''Group GUID is required'', 16, 1);
            RETURN -1;
        END
        
        IF @strOrganizationGUID IS NULL
        BEGIN
            RAISERROR(''Organization GUID is required'', 16, 1);
            RETURN -2;
        END
        
        IF @strYearGUID IS NULL
        BEGIN
            RAISERROR(''Year GUID is required'', 16, 1);
            RETURN -3;
        END
        
        IF @dtFromDate IS NULL
        BEGIN
            RAISERROR(''From Date is required'', 16, 1);
            RETURN -4;
        END
        
        IF @dtToDate IS NULL
        BEGIN
            RAISERROR(''To Date is required'', 16, 1);
            RETURN -5;
        END
        
        IF @dtFromDate > @dtToDate
        BEGIN
            RAISERROR(''From Date cannot be greater than To Date'', 16, 1);
            RETURN -6;
        END

        -- Basic Balance Sheet report with validation
        SELECT 
            s.strScheduleGUID,
            s.strScheduleCode,
            s.strScheduleName,
            0 AS intLevel,
            NULL AS strParentScheduleGUID,
            COUNT(a.strAccountGUID) AS intAccountCount,
            0 AS dblScheduleOpeningDebit_Base,
            0 AS dblScheduleOpeningCredit_Base,
            0 AS dblScheduleOpeningBalance_Base,
            ABS(SUM(ISNULL(l.dblDebit_BaseCurrency, 0))) AS dblSchedulePeriodDebit_Base,
            ABS(SUM(ISNULL(l.dblCredit_BaseCurrency, 0))) AS dblSchedulePeriodCredit_Base,
            SUM(ISNULL(l.dblCredit_BaseCurrency, 0)) - SUM(ISNULL(l.dblDebit_BaseCurrency, 0)) AS dblSchedulePeriodBalance_Base,
            SUM(ISNULL(l.dblCredit_BaseCurrency, 0)) - SUM(ISNULL(l.dblDebit_BaseCurrency, 0)) AS dblScheduleBalance_Base,
            a.strAccountGUID,
            a.strUDFCode AS strAccountCode,
            a.strAccountName,
            0 AS dblAccountOpeningDebit_Base,
            0 AS dblAccountOpeningCredit_Base,
            0 AS dblAccountOpeningBalance_Base,
            ABS(SUM(ISNULL(l.dblDebit_BaseCurrency, 0))) AS dblAccountPeriodDebit_Base,
            ABS(SUM(ISNULL(l.dblCredit_BaseCurrency, 0))) AS dblAccountPeriodCredit_Base,
            SUM(ISNULL(l.dblCredit_BaseCurrency, 0)) - SUM(ISNULL(l.dblDebit_BaseCurrency, 0)) AS dblAccountPeriodBalance_Base,
            SUM(ISNULL(l.dblCredit_BaseCurrency, 0)) - SUM(ISNULL(l.dblDebit_BaseCurrency, 0)) AS dblAccountBalance_Base,
            @dtFromDate AS dtFromDate,
            @dtToDate AS dtToDate,
            ROW_NUMBER() OVER (ORDER BY s.strScheduleCode, a.strUDFCode) AS intRowID
        FROM [' + @schemaName + '].mstAccount a
        LEFT JOIN [' + @schemaName + '].tranLedger l ON a.strAccountGUID = l.strAccountGUID
            AND l.strGroupGUID = @strGroupGUID
            AND l.strOrganizationGUID = @strOrganizationGUID
            AND l.strYearGUID = @strYearGUID
            AND l.dVoucherDate <= @dtToDate
        LEFT JOIN masterDB.dbo.mstSchedule s ON a.strScheduleGUID = s.strScheduleGUID
        WHERE a.strOrganizationGUID = @strOrganizationGUID
          AND a.bolIsActive = 1
          AND (s.strScheduleCode LIKE ''1%'' OR s.strScheduleCode LIKE ''2%'' OR s.strScheduleCode LIKE ''3%'')  -- Assets, Liabilities, Capital
        GROUP BY 
            s.strScheduleGUID, s.strScheduleCode, s.strScheduleName,
            a.strAccountGUID, a.strUDFCode, a.strAccountName
        HAVING SUM(ISNULL(l.dblDebit_BaseCurrency, 0)) + SUM(ISNULL(l.dblCredit_BaseCurrency, 0)) > 0
        ORDER BY s.strScheduleCode, a.strUDFCode;
        
        -- Success - return 0
        RETURN 0;

    END TRY
    BEGIN CATCH
        -- Return error
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        -- Return generic error code
        RETURN -99;
        
        -- Re-raise the error for logging purposes
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END
';
EXEC sp_executesql @sql;

-- Create enhanced stored procedure for getting ledger report with validation  
SET @sql = '
CREATE OR ALTER PROCEDURE [' + @schemaName + '].[sp_GetLedgerReport]
    @strGroupGUID UNIQUEIDENTIFIER,
    @strOrganizationGUID UNIQUEIDENTIFIER,
    @strYearGUID UNIQUEIDENTIFIER,
    @dtFromDate DATE,
    @dtToDate DATE,
    @strAccountGUID UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Input validation
        IF @strGroupGUID IS NULL
        BEGIN
            RAISERROR(''Group GUID is required'', 16, 1);
            RETURN -1;
        END

        IF @strOrganizationGUID IS NULL
        BEGIN
            RAISERROR(''Organization GUID is required'', 16, 1);
            RETURN -2;
        END

        IF @strYearGUID IS NULL
        BEGIN
            RAISERROR(''Year GUID is required'', 16, 1);
            RETURN -3;
        END

        IF @dtFromDate IS NULL
        BEGIN
            RAISERROR(''From Date is required'', 16, 1);
            RETURN -4;
        END

        IF @dtToDate IS NULL
        BEGIN
            RAISERROR(''To Date is required'', 16, 1);
            RETURN -5;
        END

        IF @dtFromDate > @dtToDate
        BEGIN
            RAISERROR(''From Date cannot be greater than To Date'', 16, 1);
            RETURN -6;
        END

        -- CTE to get ledger entries with opening balance calculation
        ;WITH LedgerData AS (
            SELECT 
                l.strLedgerGUID,
                l.strAccountGUID,
                a.strUDFCode AS strAccountCode,
                a.strAccountName,
                l.dVoucherDate AS dtTradeDate,
                l.strNarration,
                COALESCE(l.strVoucherNo, l.strRefNo, '''') AS strBillNo,
                l.strVoucherType,
                l.strVoucherGUID,
                ISNULL(l.dblDebit, 0) AS dblDebit,
                ISNULL(l.dblCredit, 0) AS dblCredit,
                ISNULL(l.dblDebit_BaseCurrency, 0) AS dblDebit_Base,
                ISNULL(l.dblCredit_BaseCurrency, 0) AS dblCredit_Base,
                l.strCurrencyTypeGUID,
                l.dblExchangeRate,
                l.strPartyGUID,
                l.intSeqNo,
                l.dtCreatedOn,
                ROW_NUMBER() OVER (ORDER BY l.dVoucherDate, l.strVoucherNo ASC) AS intSeqNo_OrderBy
            FROM [' + @schemaName + '].tranLedger l
            LEFT JOIN [' + @schemaName + '].mstAccount a ON l.strAccountGUID = a.strAccountGUID
            WHERE l.strGroupGUID = @strGroupGUID
            AND l.strOrganizationGUID = @strOrganizationGUID
            AND l.strYearGUID = @strYearGUID
            AND l.dVoucherDate BETWEEN @dtFromDate AND @dtToDate
            AND (@strAccountGUID IS NULL OR l.strAccountGUID = @strAccountGUID)
        ),
        
        -- Calculate Opening Balance (transactions before the from date)
        OpeningBalance AS (
            SELECT 
                strAccountGUID,
                SUM(ISNULL(dblCredit, 0)) - SUM(ISNULL(dblDebit, 0)) AS dblOpeningBalance,
                SUM(ISNULL(dblCredit_BaseCurrency, 0)) - SUM(ISNULL(dblDebit_BaseCurrency, 0)) AS dblOpeningBalance_Base
            FROM [' + @schemaName + '].tranLedger
            WHERE strGroupGUID = @strGroupGUID
            AND strOrganizationGUID = @strOrganizationGUID
            AND strYearGUID = @strYearGUID
            AND dVoucherDate < @dtFromDate
            AND (@strAccountGUID IS NULL OR strAccountGUID = @strAccountGUID)
            GROUP BY strAccountGUID
        ),
        
        -- Aggregate opening balance across all accounts (used when no account filter)
        TotalOpening AS (
            SELECT 
                SUM(dblOpeningBalance) AS dblOpeningBalance,
                SUM(dblOpeningBalance_Base) AS dblOpeningBalance_Base
            FROM OpeningBalance
        ),
        
        -- Number the rows for running balance calculation
        NumberedLedger AS (
            SELECT 
                ld.*,
                ISNULL(ob.dblOpeningBalance, 0) AS dblOpeningBalance,
                ISNULL(ob.dblOpeningBalance_Base, 0) AS dblOpeningBalance_Base,
                CASE 
                    WHEN @strAccountGUID IS NOT NULL THEN
                        ROW_NUMBER() OVER (
                            PARTITION BY ld.strAccountGUID 
                            ORDER BY ld.intSeqNo_OrderBy ASC
                        )
                    ELSE 
                        ROW_NUMBER() OVER (ORDER BY ld.intSeqNo_OrderBy ASC)
                END AS RowNumForBalance
            FROM LedgerData ld
            LEFT JOIN OpeningBalance ob ON ld.strAccountGUID = ob.strAccountGUID
        ),

        -- Calculate running balance
        BalanceCalculation AS (
            SELECT *,
                CASE 
                    WHEN @strAccountGUID IS NOT NULL THEN
                        dblOpeningBalance_Base + SUM(dblCredit_Base - dblDebit_Base) OVER (
                            PARTITION BY strAccountGUID 
                            ORDER BY RowNumForBalance ASC
                            ROWS UNBOUNDED PRECEDING
                        )
                    ELSE 
                        (SELECT dblOpeningBalance_Base FROM TotalOpening) + SUM(dblCredit_Base - dblDebit_Base) OVER (
                            ORDER BY RowNumForBalance ASC
                            ROWS UNBOUNDED PRECEDING
                        )
                END AS dblRunningBalance_Base
            FROM NumberedLedger
        ),

        -- Add opening balance rows
        OpeningBalanceRows AS (
            SELECT 
                NEWID() AS strLedgerGUID,
                CASE WHEN @strAccountGUID IS NOT NULL THEN @strAccountGUID ELSE NEWID() END AS strAccountGUID,
                CASE WHEN @strAccountGUID IS NOT NULL THEN ac.strUDFCode ELSE '''' END AS strAccountCode,
                CASE WHEN @strAccountGUID IS NOT NULL THEN ac.strAccountName ELSE ''''Opening Balance'''' END AS strAccountName,
                @dtFromDate AS dtTradeDate,
                ''''Opening Balance'''' AS strNarration,
                '''' AS strBillNo,
                ''''Opening'''' AS strVoucherType,
                NULL AS strVoucherGUID,
                0 AS dblDebit,
                0 AS dblCredit,
                0 AS dblDebit_Base,
                0 AS dblCredit_Base,
                NULL AS strCurrencyTypeGUID,
                1 AS dblExchangeRate,
                NULL AS strPartyGUID,
                0 AS intSeqNo,
                @dtFromDate AS dtCreatedOn,
                0 AS intSeqNo_OrderBy,
                CASE 
                    WHEN @strAccountGUID IS NOT NULL THEN ob.dblOpeningBalance_Base 
                    ELSE (SELECT dblOpeningBalance_Base FROM TotalOpening) 
                END AS dblOpeningBalance_Base,
                1 AS RowNumForBalance,
                CASE 
                    WHEN @strAccountGUID IS NOT NULL THEN ob.dblOpeningBalance_Base 
                    ELSE (SELECT dblOpeningBalance_Base FROM TotalOpening) 
                END AS dblRunningBalance_Base
            FROM (SELECT 1 as dummy) d
            LEFT JOIN OpeningBalance ob ON (@strAccountGUID IS NOT NULL AND ob.strAccountGUID = @strAccountGUID)
            LEFT JOIN [' + @schemaName + '].mstAccount ac ON (@strAccountGUID IS NOT NULL AND ac.strAccountGUID = @strAccountGUID)
            WHERE (@strAccountGUID IS NOT NULL) OR (@strAccountGUID IS NULL AND EXISTS(SELECT 1 FROM TotalOpening WHERE dblOpeningBalance_Base <> 0))
        ),

        -- Combine all rows
        FinalRows AS (
            SELECT * FROM OpeningBalanceRows
            UNION ALL
            SELECT 
                strLedgerGUID, strAccountGUID, strAccountCode, strAccountName, dtTradeDate,
                strNarration, strBillNo, strVoucherType, strVoucherGUID, dblDebit,
                dblCredit, dblDebit_Base, dblCredit_Base, strCurrencyTypeGUID, dblExchangeRate,
                strPartyGUID, intSeqNo, dtCreatedOn, intSeqNo_OrderBy, dblOpeningBalance_Base,
                RowNumForBalance, dblRunningBalance_Base
            FROM BalanceCalculation
        ),

        -- Add total row at the end
        TotalRow AS (
            SELECT 
                NEWID() AS strLedgerGUID,
                CASE WHEN @strAccountGUID IS NOT NULL THEN @strAccountGUID ELSE NEWID() END AS strAccountGUID,
                CASE WHEN @strAccountGUID IS NOT NULL THEN MAX(strAccountCode) ELSE '''' END AS strAccountCode,
                CASE WHEN @strAccountGUID IS NOT NULL THEN MAX(strAccountName) ELSE ''''Total'''' END AS strAccountName,
                @dtToDate AS dtTradeDate,
                ''''Total'''' AS strNarration,
                '''' AS strBillNo,
                ''''Total'''' AS strVoucherType,
                NULL AS strVoucherGUID,
                SUM(dblDebit) AS dblDebit,
                SUM(dblCredit) AS dblCredit,
                SUM(dblDebit_Base) AS dblDebit_Base,
                SUM(dblCredit_Base) AS dblCredit_Base,
                NULL AS strCurrencyTypeGUID,
                1 AS dblExchangeRate,
                NULL AS strPartyGUID,
                999999 AS intSeqNo,
                @dtToDate AS dtCreatedOn,
                999999 AS intSeqNo_OrderBy,
                MAX(dblOpeningBalance_Base) AS dblOpeningBalance_Base,
                999999 AS RowNumForBalance,
                MAX(dblOpeningBalance_Base) + (SUM(dblCredit_Base) - SUM(dblDebit_Base)) AS dblRunningBalance_Base
            FROM BalanceCalculation
        )

        -- Final output
        SELECT 
            fr.strLedgerGUID, fr.strAccountGUID, fr.strAccountCode, fr.strAccountName,
            fr.dtTradeDate, fr.strNarration, fr.strBillNo, fr.strVoucherType, fr.strVoucherGUID,
            fr.dblDebit, fr.dblCredit,
            ABS(fr.dblRunningBalance_Base) AS dblBalance,
            CASE WHEN fr.dblRunningBalance_Base >= 0 THEN ''''Cr'''' ELSE ''''Dr'''' END AS strBalanceType,
            fr.dblDebit_Base, fr.dblCredit_Base,
            ABS(fr.dblRunningBalance_Base) AS dblBalance_Base,
            CASE WHEN fr.dblRunningBalance_Base >= 0 THEN ''''Cr'''' ELSE ''''Dr'''' END AS strBalanceType_Base,
            fr.strCurrencyTypeGUID, fr.dblExchangeRate, fr.strPartyGUID,
            NULL AS strPartyName,
            ABS(fr.dblOpeningBalance_Base) AS dblOpeningBalance,
            CASE WHEN fr.dblOpeningBalance_Base >= 0 THEN ''''Cr'''' ELSE ''''Dr'''' END AS strOpeningBalanceType,
            ABS(fr.dblOpeningBalance_Base) AS dblOpeningBalance_Base,
            CASE WHEN fr.dblOpeningBalance_Base >= 0 THEN ''''Cr'''' ELSE ''''Dr'''' END AS strOpeningBalanceType_Base
        FROM (
            SELECT * FROM FinalRows
            UNION ALL
            SELECT * FROM TotalRow
        ) fr
        ORDER BY fr.intSeqNo_OrderBy ASC
        
        OPTION (MAXRECURSION 0);
        
        -- Success - return 0
        RETURN 0;

    END TRY
    BEGIN CATCH
        -- Return error
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        -- Return generic error code
        RETURN -99;
        
        -- Re-raise the error for logging purposes
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END
';

EXEC sp_executesql @sql;
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPaymentReceipt'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranPaymentReceipt (
        strPaymentReceiptGUID UNIQUEIDENTIFIER PRIMARY KEY,
        strTransactionType NVARCHAR(20) NOT NULL,
        strTransactionNo NVARCHAR(50) NOT NULL,
        dtTransactionDate DATETIME NOT NULL,
        strPaymentMode NVARCHAR(20) NOT NULL,
        strToAccountGUID UNIQUEIDENTIFIER NOT NULL,
        dblTotalAmount DECIMAL(18, 2) NOT NULL,
        strCurrencyTypeGUID UNIQUEIDENTIFIER NULL,
        dtExchangeRateDate DATETIME NULL,
        dblExchangeRate DECIMAL(18, 6) NOT NULL DEFAULT 1.0,
        dblBaseTotalAmount DECIMAL(18, 2) NOT NULL,
        strBankCashGUID UNIQUEIDENTIFIER NULL,
        strChequeNo NVARCHAR(100) NULL,
        dtChequeDate DATETIME NULL,
        strCardType NVARCHAR(20) NULL,
        strCardLastFourDigits NVARCHAR(4) NULL,
        strCardIssuerBank NVARCHAR(200) NULL,
        strCardTransactionId NVARCHAR(100) NULL,
        dblCardProcessingFee DECIMAL(18, 2) NULL,
        dtReconciliationDate DATETIME NULL,
        strReconciledByGUID UNIQUEIDENTIFIER NULL,
        strBankStatementRefNo NVARCHAR(100) NULL,
        dtBankClearingDate DATETIME NULL,
        strStatus NVARCHAR(20) NOT NULL DEFAULT ''DRAFT'',
        strApprovedByGUID UNIQUEIDENTIFIER NULL,
        dtApprovedDate DATETIME NULL,
        strRejectionReason NVARCHAR(500) NULL,
        strReferenceNo NVARCHAR(100) NULL,
        strNarration NVARCHAR(1000) NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL
    )
END';
EXEC sp_executesql @sql;

-- Defaults for tranPaymentReceipt columns (guarded)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPaymentReceipt'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    -- Default for strStatus
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceipt'')
          AND c.name = ''strStatus'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranPaymentReceipt 
        ADD DEFAULT (''DRAFT'') FOR strStatus;
    END

    -- Default for dtCreatedOn
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceipt'')
          AND c.name = ''dtCreatedOn'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranPaymentReceipt 
        ADD DEFAULT (GETUTCDATE()) FOR dtCreatedOn;
    END

    -- Default for dblExchangeRate
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceipt'')
          AND c.name = ''dblExchangeRate'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranPaymentReceipt 
        ADD DEFAULT (1.0) FOR dblExchangeRate;
    END
END';
EXEC sp_executesql @sql;

-- Create indexes for tranPaymentReceipt (guarded)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPaymentReceipt'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_TransactionNo'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceipt''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_TransactionNo ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceipt(strTransactionNo);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceipt''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceipt(strOrganizationGUID, strGroupGUID, strYearGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_TransactionDate'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceipt''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_TransactionDate ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceipt(dtTransactionDate DESC);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_Status'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceipt''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_Status ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceipt(strStatus);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_ToAccountGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceipt''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_ToAccountGUID ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceipt(strToAccountGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_BankCashGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceipt''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_BankCashGUID ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceipt(strBankCashGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_TypeMode'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceipt''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceipt_TypeMode ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceipt(strTransactionType, strPaymentMode);
    END
END';
EXEC sp_executesql @sql;

-- tranPaymentMade Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPaymentMade'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranPaymentMade (
        strPaymentMadeGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        strPaymentMadeNo NVARCHAR(50) NOT NULL,
        intPaymentMadeSeqNo INT NOT NULL DEFAULT (0),
        dtPaymentMadeDate DATETIME NOT NULL,
        strVendorGUID UNIQUEIDENTIFIER NOT NULL,
        strAccountGUID UNIQUEIDENTIFIER NOT NULL,
        strRefNo NVARCHAR(100) NULL,
        strPaymentMode NVARCHAR(20) NOT NULL,
        strSubject NVARCHAR(500) NULL,
        strStatus NVARCHAR(20) NOT NULL,
        dblTotalAmountMade DECIMAL(18,2) NOT NULL,
        dblTotalAmountMadeBase DECIMAL(18,2) NOT NULL,
        strNotes NVARCHAR(1000) NULL,
        dtExchangeRateDate DATETIME NULL,
        dblExchangeRate DECIMAL(18,6) NOT NULL DEFAULT (1),
        strCurrencyTypeGUID UNIQUEIDENTIFIER NULL,
        strApprovedByGUID UNIQUEIDENTIFIER NULL,
        dtApprovedOn DATETIME NULL,
        strRejectedByGUID UNIQUEIDENTIFIER NULL,
        dtRejectedOn DATETIME NULL,
        strRejectedReason NVARCHAR(500) NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT (GETUTCDATE()),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_tranPaymentMade_No UNIQUE (strPaymentMadeNo, strYearGUID, strOrganizationGUID)
    )
END';
EXEC sp_executesql @sql;

-- tranPaymentMade_Item Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPaymentMade_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranPaymentMade_Item (
        strPaymentMade_ItemGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        strPaymentMadeGUID UNIQUEIDENTIFIER NOT NULL,
        strPurchaseInvoiceGUID UNIQUEIDENTIFIER NOT NULL,
        dtPaymentMadeOn DATETIME NOT NULL,
        dblPaymentAmount DECIMAL(18,2) NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT (GETUTCDATE()),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_PaymentMade_Item_PaymentMade FOREIGN KEY (strPaymentMadeGUID) 
            REFERENCES ' + QUOTENAME(@schemaName) + '.tranPaymentMade(strPaymentMadeGUID) ON DELETE CASCADE
    )
END';
EXEC sp_executesql @sql;

-- Indexes for tranPaymentMade
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPaymentMade'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentMade_PaymentNo'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentMade''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentMade_PaymentNo ON ' + QUOTENAME(@schemaName) + '.tranPaymentMade(strPaymentMadeNo);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentMade_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentMade''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentMade_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranPaymentMade(strOrganizationGUID, strGroupGUID, strYearGUID);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentMade_Date'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentMade''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentMade_Date ON ' + QUOTENAME(@schemaName) + '.tranPaymentMade(dtPaymentMadeDate DESC);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentMade_Status'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentMade''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentMade_Status ON ' + QUOTENAME(@schemaName) + '.tranPaymentMade(strStatus);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentMade_Vendor'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentMade''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentMade_Vendor ON ' + QUOTENAME(@schemaName) + '.tranPaymentMade(strVendorGUID);
    END
END';
EXEC sp_executesql @sql;

-- Indexes for tranPaymentMade_Item
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPaymentMade_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentMade_Item_PMGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentMade_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentMade_Item_PMGUID ON ' + QUOTENAME(@schemaName) + '.tranPaymentMade_Item(strPaymentMadeGUID);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentMade_Item_OrgGroup'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentMade_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentMade_Item_OrgGroup ON ' + QUOTENAME(@schemaName) + '.tranPaymentMade_Item(strOrganizationGUID, strGroupGUID);
    END
END';
EXEC sp_executesql @sql;

-- tranInvoice_Item Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranInvoice_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice_Item (
        strInvoice_ItemGUID UNIQUEIDENTIFIER NOT NULL,
        strInvoiceGUID UNIQUEIDENTIFIER NOT NULL,
        intSeqNo INT NOT NULL,
        strCategoryGUID UNIQUEIDENTIFIER NULL,
        strItemGUID UNIQUEIDENTIFIER NULL,
        strUoMGUID UNIQUEIDENTIFIER NULL,
        strAccountGUID UNIQUEIDENTIFIER NULL,
        strDesc NVARCHAR(500) NULL,
        dblQty DECIMAL(20, 3) NULL,
        dblRate DECIMAL(20, 3) NULL,
        dblTaxPercentage DECIMAL(20, 3) NULL,
        dblTaxAmt DECIMAL(20, 3) NULL,
        dblNetAmt DECIMAL(20, 3) NULL,
        dblTotalAmt DECIMAL(20, 3) NULL,
        dblDiscountPercentage DECIMAL(20, 3) NULL,
        dblDiscountAmt DECIMAL(20, 3) NULL,
        dblRateBase DECIMAL(20, 3) NULL,
        dblTaxAmtBase DECIMAL(20, 3) NULL,
        dblNetAmtBase DECIMAL(20, 3) NULL,
        dblTotalAmtBase DECIMAL(20, 3) NULL,
        dblDiscountAmtBase DECIMAL(20, 3) NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME2(0) NOT NULL,
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(0) NULL,
        CONSTRAINT PK_tranInvoice_Item PRIMARY KEY CLUSTERED (strInvoice_ItemGUID ASC)
    )
END';
EXEC sp_executesql @sql;

-- Default for dtCreatedOn in tranInvoice_Item (guarded)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranInvoice_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_Item'')
          AND c.name = ''dtCreatedOn'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice_Item 
        ADD DEFAULT (SYSUTCDATETIME()) FOR dtCreatedOn;
    END
END';
EXEC sp_executesql @sql;

-- Create indexes for tranInvoice_Item (guarded)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranInvoice_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_Item_InvoiceGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_Item_InvoiceGUID ON ' + QUOTENAME(@schemaName) + '.tranInvoice_Item(strInvoiceGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_Item_ItemGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_Item_ItemGUID ON ' + QUOTENAME(@schemaName) + '.tranInvoice_Item(strItemGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_Item_AccountGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_Item_AccountGUID ON ' + QUOTENAME(@schemaName) + '.tranInvoice_Item(strAccountGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_Item_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_Item_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranInvoice_Item(strOrganizationGUID, strGroupGUID, strYearGUID);
    END
END';
EXEC sp_executesql @sql;

-- tranInvoice Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranInvoice'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice (
        strInvoiceGUID UNIQUEIDENTIFIER NOT NULL,
        dInvoiceDate DATETIME2(0) NOT NULL,
        strInvoiceNo NVARCHAR(50) NOT NULL,
        intInvoiceSeqNo INT NOT NULL,
        strOrderNo NVARCHAR(100) NULL,
        strPartyGUID UNIQUEIDENTIFIER NOT NULL,
        strCurrencyTypeGUID UNIQUEIDENTIFIER NULL,
        intPaymentTermsDays INT NULL,
        strBillingAddress NVARCHAR(1000) NULL,
        strShippingAddress NVARCHAR(1000) NULL,
        dtDueDate DATETIME2(0) NULL,
        strStatus NVARCHAR(20) NOT NULL,
        strSubject NVARCHAR(200) NULL,
        bolIsPaid BIT NOT NULL,
        dblGrossTotalAmt DECIMAL(20, 3) NULL,
        dblTotalDiscountAmt DECIMAL(20, 3) NULL,
        dblTaxAmt DECIMAL(20, 3) NULL,
        strAdjustmentName NVARCHAR(200) NULL,
        strAdjustment_AccountGUID UNIQUEIDENTIFIER NULL,
        dblAdjustmentAmt DECIMAL(20, 3) NULL,
        dblNetAmt DECIMAL(20, 3) NULL,
        dblGrossTotalAmtBase DECIMAL(20, 3) NULL,
        dblTotalDiscountAmtBase DECIMAL(20, 3) NULL,
        dblTaxAmtBase DECIMAL(20, 3) NULL,
        dblAdjustmentAmtBase DECIMAL(20, 3) NULL,
        dblNetAmtBase DECIMAL(20, 3) NULL,
        strTC NVARCHAR(2000) NULL,
        strCustomerNotes NVARCHAR(2000) NULL,
        dblExchangeRate DECIMAL(20, 3) NULL,
        dtExchangeRateDate DATETIME2(0) NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME2(0) NOT NULL,
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2(0) NULL,
        strApprovedByGUID UNIQUEIDENTIFIER NULL,
        dtApprovedOn DATETIME NULL,
        strRejectedByGUID UNIQUEIDENTIFIER NULL,
        dtRejectedOn DATETIME NULL,
        strRejectedReason NVARCHAR(500) NULL,
        strInvoice_RecurringProfileGUID UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_tranInvoice PRIMARY KEY CLUSTERED (strInvoiceGUID ASC),
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_tranInvoice_No UNIQUE (strInvoiceNo, strYearGUID, strOrganizationGUID)
    )
END';
EXEC sp_executesql @sql;

-- Add FK from tranInvoice_Item(strInvoiceGUID) to tranInvoice(strInvoiceGUID) after both exist (guarded)
SET @sql = '
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''tranInvoice_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
   AND EXISTS (SELECT 1 FROM sys.tables WHERE name = ''tranInvoice'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys 
        WHERE name = ''FK_' + @sanitizedOrgGUID + '_InvoiceItem_Invoice''
          AND parent_object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_Item''))
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice_Item WITH CHECK
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_InvoiceItem_Invoice
            FOREIGN KEY (strInvoiceGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + '.tranInvoice(strInvoiceGUID);
    END
END';
EXEC sp_executesql @sql;

-- Defaults for tranInvoice columns (guarded)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranInvoice'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    -- Default for strStatus
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        WHERE dc.parent_object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice'')
          AND dc.name = ''DF_tranInvoice_strStatus'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice 
        ADD CONSTRAINT DF_tranInvoice_strStatus DEFAULT (''Draft'') FOR strStatus;
    END

    -- Default for bolIsPaid
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice'')
          AND c.name = ''bolIsPaid'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice 
        ADD DEFAULT ((0)) FOR bolIsPaid;
    END

    -- Default for dtCreatedOn
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice'')
          AND c.name = ''dtCreatedOn'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice 
        ADD DEFAULT (SYSUTCDATETIME()) FOR dtCreatedOn;
    END
END';
EXEC sp_executesql @sql;

-- Create indexes for tranInvoice (guarded)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranInvoice'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_InvoiceNo'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_InvoiceNo ON ' + QUOTENAME(@schemaName) + '.tranInvoice(strInvoiceNo);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranInvoice(strOrganizationGUID, strGroupGUID, strYearGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_InvoiceDate'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_InvoiceDate ON ' + QUOTENAME(@schemaName) + '.tranInvoice(dInvoiceDate DESC);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_Status'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_Status ON ' + QUOTENAME(@schemaName) + '.tranInvoice(strStatus);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_PartyGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_PartyGUID ON ' + QUOTENAME(@schemaName) + '.tranInvoice(strPartyGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_IsPaid'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_IsPaid ON ' + QUOTENAME(@schemaName) + '.tranInvoice(bolIsPaid, strOrganizationGUID, strGroupGUID);
    END
END';
EXEC sp_executesql @sql;

-- tranInvoice_RecurringProfile Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranInvoice_RecurringProfile'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice_RecurringProfile (
        strInvoice_RecurringProfileGUID UNIQUEIDENTIFIER NOT NULL,
        strProfileName NVARCHAR(150) NOT NULL,
        strInvoiceGUID UNIQUEIDENTIFIER NOT NULL,
        strRepeatType NVARCHAR(20) NOT NULL,
        intRepeatEveryValue INT NOT NULL,
        strRepeatEveryUnit NVARCHAR(20) NULL,
        intRepeatOnDay INT NULL,
        strRepeatOnWeekday NVARCHAR(20) NULL,
        strCustomFrequencyJson NVARCHAR(MAX) NULL,
        dStartDate DATETIME NOT NULL,
        dEndDate DATETIME NULL,
        bolNeverExpires BIT NOT NULL,
        dtNextRunDate DATETIME NULL,
        strStatus NVARCHAR(20) NOT NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL,
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT PK_tranInvoice_RecurringProfile PRIMARY KEY CLUSTERED (strInvoice_RecurringProfileGUID ASC)
    )
END';
EXEC sp_executesql @sql;

-- Defaults for tranInvoice_RecurringProfile (guarded)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranInvoice_RecurringProfile'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    -- Default for strRepeatType
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_RecurringProfile'')
          AND c.name = ''strRepeatType'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice_RecurringProfile 
        ADD DEFAULT (''Daily'') FOR strRepeatType;
    END

    -- Default for intRepeatEveryValue
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_RecurringProfile'')
          AND c.name = ''intRepeatEveryValue'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice_RecurringProfile 
        ADD DEFAULT ((1)) FOR intRepeatEveryValue;
    END

    -- Default for bolNeverExpires
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_RecurringProfile'')
          AND c.name = ''bolNeverExpires'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice_RecurringProfile 
        ADD DEFAULT ((0)) FOR bolNeverExpires;
    END

    -- Default for strStatus
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_RecurringProfile'')
          AND c.name = ''strStatus'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice_RecurringProfile 
        ADD DEFAULT (''Active'') FOR strStatus;
    END

    -- Default for dtCreatedOn
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_RecurringProfile'')
          AND c.name = ''dtCreatedOn'')
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice_RecurringProfile 
        ADD DEFAULT (GETUTCDATE()) FOR dtCreatedOn;
    END
END';
EXEC sp_executesql @sql;

-- Create indexes for tranInvoice_RecurringProfile (guarded)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranInvoice_RecurringProfile'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_RecurringProfile_InvoiceGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_RecurringProfile''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_RecurringProfile_InvoiceGUID ON ' + QUOTENAME(@schemaName) + '.tranInvoice_RecurringProfile(strInvoiceGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_RecurringProfile_Status'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_RecurringProfile''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_RecurringProfile_Status ON ' + QUOTENAME(@schemaName) + '.tranInvoice_RecurringProfile(strStatus);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_RecurringProfile_NextRunDate'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_RecurringProfile''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_RecurringProfile_NextRunDate ON ' + QUOTENAME(@schemaName) + '.tranInvoice_RecurringProfile(dtNextRunDate);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranInvoice_RecurringProfile_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_RecurringProfile''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranInvoice_RecurringProfile_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranInvoice_RecurringProfile(strOrganizationGUID, strGroupGUID, strYearGUID);
    END
END';
EXEC sp_executesql @sql;

-- tranPurchaseInvoice Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPurchaseInvoice'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice (
        strPurchaseInvoiceGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        dPurchaseInvoiceDate DATETIME NOT NULL,
        strPurchaseInvoiceNo NVARCHAR(50) NOT NULL,
        intPurchaseInvoiceSeqNo INT NOT NULL,
        strOrderNo NVARCHAR(100) NULL,
        strPartyGUID UNIQUEIDENTIFIER NOT NULL,
        strCurrencyTypeGUID UNIQUEIDENTIFIER NULL,
        strBillingAddress NVARCHAR(MAX) NULL,
        strShippingAddress NVARCHAR(MAX) NULL,
        strStatus NVARCHAR(20) NULL,
        strSubject NVARCHAR(200) NULL,
        dblGrossTotalAmt DECIMAL(20, 3) NULL,
        dblTotalDiscountAmt DECIMAL(20, 3) NULL,
        dblTaxAmt DECIMAL(20, 3) NULL,
        dblAdjustmentAmt DECIMAL(20, 3) NULL,
        dblNetAmt DECIMAL(20, 3) NULL,
        dblGrossTotalAmtBase DECIMAL(20, 3) NULL,
        dblTotalDiscountAmtBase DECIMAL(20, 3) NULL,
        dblTaxAmtBase DECIMAL(20, 3) NULL,
        dblAdjustmentAmtBase DECIMAL(20, 3) NULL,
        dblNetAmtBase DECIMAL(20, 3) NULL,
        strAdjustmentName NVARCHAR(200) NULL,
        strAdjustment_AccountGUID UNIQUEIDENTIFIER NULL,
        dblExchangeRate DECIMAL(20, 3) NULL,
        dtExchangeRateDate DATETIME NULL,
        strTC NVARCHAR(2000) NULL,
        strCustomerNotes NVARCHAR(2000) NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        strApprovedByGUID UNIQUEIDENTIFIER NULL,
        dtApprovedOn DATETIME NULL,
        strRejectedByGUID UNIQUEIDENTIFIER NULL,
        dtRejectedOn DATETIME NULL,
        strRejectedReason NVARCHAR(500) NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_No UNIQUE (strPurchaseInvoiceNo, strYearGUID, strOrganizationGUID)
    )
END';
EXEC sp_executesql @sql;

-- tranPurchaseInvoice_Item Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPurchaseInvoice_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice_Item (
        strPurchaseInvoice_ItemGUID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        strPurchaseInvoiceGUID UNIQUEIDENTIFIER NOT NULL,
        intSeqNo INT NOT NULL,
        strCategoryGUID UNIQUEIDENTIFIER NULL,
        strItemGUID UNIQUEIDENTIFIER NULL,
        strUoMGUID UNIQUEIDENTIFIER NULL,
        strAccountGUID UNIQUEIDENTIFIER NULL,
        strDesc NVARCHAR(500) NULL,
        dblQty DECIMAL(20, 3) NULL,
        dblRate DECIMAL(20, 3) NULL,
        dblTaxPercentage DECIMAL(20, 3) NULL,
        dblTaxAmt DECIMAL(20, 3) NULL,
        dblNetAmt DECIMAL(20, 3) NULL,
        dblTotalAmt DECIMAL(20, 3) NULL,
        dblDiscountPercentage DECIMAL(20, 3) NULL,
        dblDiscountAmt DECIMAL(20, 3) NULL,
        dblRateBase DECIMAL(20, 3) NULL,
        dblTaxAmtBase DECIMAL(20, 3) NULL,
        dblNetAmtBase DECIMAL(20, 3) NULL,
        dblTotalAmtBase DECIMAL(20, 3) NULL,
        dblDiscountAmtBase DECIMAL(20, 3) NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL
    )
END';
EXEC sp_executesql @sql;

-- Add FK from tranPurchaseInvoice_Item(strPurchaseInvoiceGUID) to tranPurchaseInvoice(strPurchaseInvoiceGUID) after both exist (guarded)
SET @sql = '
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''tranPurchaseInvoice_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
   AND EXISTS (SELECT 1 FROM sys.tables WHERE name = ''tranPurchaseInvoice'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys 
        WHERE name = ''FK_' + @sanitizedOrgGUID + '_PurchaseInvoiceItem_PurchaseInvoice''
          AND parent_object_id = OBJECT_ID(''' + @schemaName + '.tranPurchaseInvoice_Item''))
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice_Item WITH CHECK
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_PurchaseInvoiceItem_PurchaseInvoice
            FOREIGN KEY (strPurchaseInvoiceGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice(strPurchaseInvoiceGUID);
    END
END';
EXEC sp_executesql @sql;

-- Create indexes for tranPurchaseInvoice (guarded)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPurchaseInvoice'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_PurchaseInvoiceNo'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPurchaseInvoice''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_PurchaseInvoiceNo ON ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice(strPurchaseInvoiceNo);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPurchaseInvoice''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice(strOrganizationGUID, strGroupGUID, strYearGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_PurchaseInvoiceDate'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPurchaseInvoice''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_PurchaseInvoiceDate ON ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice(dPurchaseInvoiceDate DESC);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_Status'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPurchaseInvoice''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_Status ON ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice(strStatus);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_PartyGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPurchaseInvoice''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_PartyGUID ON ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice(strPartyGUID);
    END
END';
EXEC sp_executesql @sql;

-- Create indexes for tranPurchaseInvoice_Item (guarded)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPurchaseInvoice_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_Item_PIGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPurchaseInvoice_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_Item_PIGUID ON ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice_Item(strPurchaseInvoiceGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_Item_AccountGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPurchaseInvoice_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_Item_AccountGUID ON ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice_Item(strAccountGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_Item_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPurchaseInvoice_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPurchaseInvoice_Item_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice_Item(strOrganizationGUID, strGroupGUID, strYearGUID);
    END
END';
EXEC sp_executesql @sql;

-- mstBank Table

-- Drop existing mstBank table if it exists (for clean recreation)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBank'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    DROP TABLE ' + QUOTENAME(@schemaName) + '.mstBank;
    PRINT ''Dropped existing mstBank table for recreation'';
END';
EXEC sp_executesql @sql;

-- mstBank Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBank'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstBank (
        strBankGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strAccountTypeGUID UNIQUEIDENTIFIER NOT NULL,
        strAccountName NVARCHAR(100) NOT NULL,
        strUDFCode NVARCHAR(6) NOT NULL,
        strCurrencyTypeGUID UNIQUEIDENTIFIER NOT NULL,
        strAccountNumber NVARCHAR(100) NULL,
        strBankName NVARCHAR(150) NOT NULL,
        strIFSCCode NVARCHAR(50) NULL,
        strDesc NVARCHAR(500) NULL,
        strBranchName NVARCHAR(150) NULL,
        bolIsPrimary BIT NOT NULL DEFAULT 0,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_mstBank_UDFCode UNIQUE (strUDFCode, strOrganizationGUID, strGroupGUID),
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_mstBank_AccountName UNIQUE (strAccountName, strOrganizationGUID)
    )
END';
EXEC sp_executesql @sql;

-- Create indexes for mstBank GUID columns
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstBank'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    -- Index for strGroupGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBank_GroupGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBank''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBank_GroupGUID ON ' + QUOTENAME(@schemaName) + '.mstBank(strGroupGUID);
    END

    -- Index for strAccountTypeGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBank_AccountTypeGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBank''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBank_AccountTypeGUID ON ' + QUOTENAME(@schemaName) + '.mstBank(strAccountTypeGUID);
    END

    -- Index for strCurrencyTypeGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBank_CurrencyTypeGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBank''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBank_CurrencyTypeGUID ON ' + QUOTENAME(@schemaName) + '.mstBank(strCurrencyTypeGUID);
    END

    -- Index for strOrganizationGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBank_OrganizationGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBank''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBank_OrganizationGUID ON ' + QUOTENAME(@schemaName) + '.mstBank(strOrganizationGUID);
    END

    -- Index for primary flag by organization
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstBank_PrimaryOrg'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstBank''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstBank_PrimaryOrg ON ' + QUOTENAME(@schemaName) + '.mstBank(bolIsPrimary, strOrganizationGUID);
    END
END';
EXEC sp_executesql @sql;

-- Drop existing mstAccount table if it exists (for clean recreation)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstAccount'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    DROP TABLE ' + QUOTENAME(@schemaName) + '.mstAccount;
    PRINT ''Dropped existing mstAccount table for recreation'';
END';
EXEC sp_executesql @sql;

-- mstAccount Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstAccount'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstAccount (
        strAccountGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strAccountName NVARCHAR(100) NOT NULL,
        strUDFCode NVARCHAR(6) NULL,
        strAccountTypeGUID UNIQUEIDENTIFIER NOT NULL,
        strScheduleGUID UNIQUEIDENTIFIER NULL,
        strDesc NVARCHAR(500) NULL,
        bolIsActive BIT NOT NULL DEFAULT 1,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_mstAccount_Name_UDFCode UNIQUE (strAccountName, strUDFCode, strOrganizationGUID)
    )
END';
EXEC sp_executesql @sql;

-- Create indexes for mstAccount GUID columns
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstAccount'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    -- Index for strGroupGUID (likely foreign key)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstAccount_GroupGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstAccount''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstAccount_GroupGUID ON ' + QUOTENAME(@schemaName) + '.mstAccount(strGroupGUID);
    END

    -- Index for strAccountTypeGUID (likely foreign key)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstAccount_AccountTypeGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstAccount''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstAccount_AccountTypeGUID ON ' + QUOTENAME(@schemaName) + '.mstAccount(strAccountTypeGUID);
    END

    -- Index for strScheduleGUID (likely foreign key)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstAccount_ScheduleGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstAccount''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstAccount_ScheduleGUID ON ' + QUOTENAME(@schemaName) + '.mstAccount(strScheduleGUID);
    END

    -- Index for strOrganizationGUID (frequently used in filtering)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstAccount_OrganizationGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstAccount''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstAccount_OrganizationGUID ON ' + QUOTENAME(@schemaName) + '.mstAccount(strOrganizationGUID);
    END

    -- Combined index for active accounts by organization
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstAccount_OrgActive'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstAccount''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstAccount_OrgActive ON ' + QUOTENAME(@schemaName) + '.mstAccount(strOrganizationGUID, bolIsActive);
    END
END';
EXEC sp_executesql @sql;

-- Drop existing mstGeneralAccount table if it exists (for clean recreation)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstGeneralAccount'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    DROP TABLE ' + QUOTENAME(@schemaName) + '.mstGeneralAccount;
    PRINT ''Dropped existing mstGeneralAccount table for recreation'';
END';
EXEC sp_executesql @sql;

-- mstGeneralAccount Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstGeneralAccount'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstGeneralAccount (
        strGeneralAccountGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strGeneralAccountName NVARCHAR(100) NOT NULL,
        strUDFCode NVARCHAR(6) NOT NULL,
        strAccountTypeGUID UNIQUEIDENTIFIER NOT NULL,
        strScheduleGUID UNIQUEIDENTIFIER NOT NULL,
        strDesc NVARCHAR(500) NULL,
        bolIsActive BIT NOT NULL DEFAULT 1,
        bolIsLock BIT NOT NULL DEFAULT 0,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_mstGeneralAccount_Name UNIQUE (strGeneralAccountName, strOrganizationGUID),
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_mstGeneralAccount_UDFCode UNIQUE (strUDFCode, strOrganizationGUID, strGroupGUID)
    )
END';
EXEC sp_executesql @sql;

-- Ensure bolIsLock exists on existing mstGeneralAccount (for upgrades)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstGeneralAccount'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns 
        WHERE Name = N''bolIsLock'' AND Object_ID = Object_ID(QUOTENAME(''' + @schemaName + ''') + ''.mstGeneralAccount''))
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.mstGeneralAccount ADD bolIsLock BIT NOT NULL CONSTRAINT DF_' + @sanitizedOrgGUID + '_mstGeneralAccount_bolIsLock DEFAULT(0);
    END
END';
EXEC sp_executesql @sql;

-- Create indexes for mstGeneralAccount GUID columns
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstGeneralAccount'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    -- Index for strGroupGUID (likely foreign key)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstGeneralAccount_GroupGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstGeneralAccount''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstGeneralAccount_GroupGUID ON ' + QUOTENAME(@schemaName) + '.mstGeneralAccount(strGroupGUID);
    END

    -- Index for strAccountTypeGUID (likely foreign key)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstGeneralAccount_AccountTypeGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstGeneralAccount''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstGeneralAccount_AccountTypeGUID ON ' + QUOTENAME(@schemaName) + '.mstGeneralAccount(strAccountTypeGUID);
    END

    -- Index for strScheduleGUID (likely foreign key)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstGeneralAccount_ScheduleGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstGeneralAccount''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstGeneralAccount_ScheduleGUID ON ' + QUOTENAME(@schemaName) + '.mstGeneralAccount(strScheduleGUID);
    END

    -- Index for strOrganizationGUID (frequently used in filtering)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstGeneralAccount_OrganizationGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstGeneralAccount''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstGeneralAccount_OrganizationGUID ON ' + QUOTENAME(@schemaName) + '.mstGeneralAccount(strOrganizationGUID);
    END

    -- Combined index for active accounts by organization
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstGeneralAccount_OrgActive'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstGeneralAccount''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstGeneralAccount_OrgActive ON ' + QUOTENAME(@schemaName) + '.mstGeneralAccount(strOrganizationGUID, bolIsActive);
    END

    -- Index for strAccountName (for search functionality)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstGeneralAccount_AccountName'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstGeneralAccount''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstGeneralAccount_AccountName ON ' + QUOTENAME(@schemaName) + '.mstGeneralAccount(strGeneralAccountName);
    END
END';
EXEC sp_executesql @sql;

-- mstUnit Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstUnit'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstUnit (
        strUnitGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strUnitName NVARCHAR(100) NOT NULL,
        bolIsActive BIT NOT NULL DEFAULT 1,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_mstUnit_Name UNIQUE (strUnitName, strOrganizationGUID)
    )
END';
EXEC sp_executesql @sql;

-- Indexes for mstUnit
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstUnit'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstUnit_Org'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstUnit''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstUnit_Org ON ' + QUOTENAME(@schemaName) + '.mstUnit(strOrganizationGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstUnit_Active'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstUnit''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstUnit_Active ON ' + QUOTENAME(@schemaName) + '.mstUnit(bolIsActive, strOrganizationGUID);
    END
END';
EXEC sp_executesql @sql;

-- mstItem Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstItem'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstItem (
        strItemGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strType NVARCHAR(50) NOT NULL,
        strName NVARCHAR(200) NOT NULL,
        strUnitGUID UNIQUEIDENTIFIER NOT NULL,
        bolIsSellable BIT NOT NULL DEFAULT 0,
        dblSellingPrice DECIMAL(18, 2) NULL,
        strSalesAccountGUID UNIQUEIDENTIFIER NULL,
        strSalesDescription NVARCHAR(500) NULL,
        bolIsPurchasable BIT NOT NULL DEFAULT 0,
        dblCostPrice DECIMAL(18, 2) NULL,
        strPurchaseAccountGUID UNIQUEIDENTIFIER NULL,
        strPurchaseDescription NVARCHAR(500) NULL,
        strPreferredVendorGUID UNIQUEIDENTIFIER NULL,
        strTaxCategoryGUID UNIQUEIDENTIFIER NULL,
        strHSNCode NVARCHAR(50) NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_mstItem_Name UNIQUE (strName, strOrganizationGUID, strGroupGUID)
    )
END';
EXEC sp_executesql @sql;

-- FK from mstItem to mstUnit
SET @sql = '
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''mstItem'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
   AND EXISTS (SELECT 1 FROM sys.tables WHERE name = ''mstUnit'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys 
        WHERE name = ''FK_' + @sanitizedOrgGUID + '_mstItem_Unit''
          AND parent_object_id = OBJECT_ID(''' + @schemaName + '.mstItem''))
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.mstItem WITH CHECK
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_mstItem_Unit
            FOREIGN KEY (strUnitGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + '.mstUnit(strUnitGUID);
    END
END';
EXEC sp_executesql @sql;

-- Indexes for mstItem
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstItem'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstItem_OrgGroup'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstItem''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstItem_OrgGroup ON ' + QUOTENAME(@schemaName) + '.mstItem(strOrganizationGUID, strGroupGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstItem_UnitGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstItem''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstItem_UnitGUID ON ' + QUOTENAME(@schemaName) + '.mstItem(strUnitGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstItem_Type'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstItem''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstItem_Type ON ' + QUOTENAME(@schemaName) + '.mstItem(strType);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstItem_TaxCategory'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstItem''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstItem_TaxCategory ON ' + QUOTENAME(@schemaName) + '.mstItem(strTaxCategoryGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstItem_SellablePurchasable'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstItem''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstItem_SellablePurchasable ON ' + QUOTENAME(@schemaName) + '.mstItem(bolIsSellable, bolIsPurchasable, strOrganizationGUID, strGroupGUID);
    END
END';
EXEC sp_executesql @sql;

-- ============================================
-- CREATE TABLE: mstParty
-- Description: Master table for Party (Customer/Vendor) with billing and shipping addresses
-- ============================================
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstParty'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstParty (
        -- Primary Key
        strPartyGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        
        -- Party Type and Basic Information
        strPartyType NVARCHAR(50) NOT NULL,
        strSalutation NVARCHAR(10) NULL,
        strFirstName NVARCHAR(100) NOT NULL,
        strLastName NVARCHAR(100) NULL,
        strCompanyName NVARCHAR(200) NULL,
        strPartyName_Display NVARCHAR(100) NULL,
        strUDFCode NVARCHAR(6) NOT NULL,
        
        -- Contact Information
        strEmail NVARCHAR(100) NULL,
        strPhoneNoWork NVARCHAR(20) NULL,
        strPhoneNoPersonal NVARCHAR(20) NULL,
        strPAN NVARCHAR(20) NULL,
        strPartyLanguage NVARCHAR(20) NULL,
        strTaxRegNo NVARCHAR(50) NULL,
        
        -- Financial Information
        strCurrencyTypeGUID UNIQUEIDENTIFIER NULL,
        intPaymentTerms_inDays INT NULL,
        
        -- Web and Social Media
        strWebsiteURL NVARCHAR(200) NULL,
        strDepartment NVARCHAR(100) NULL,
        strDesignation NVARCHAR(100) NULL,
        strTwitter NVARCHAR(100) NULL,
        strSkype NVARCHAR(100) NULL,
        strFacebook NVARCHAR(100) NULL,
        strInstagram NVARCHAR(100) NULL,
        dblIntrest_per DECIMAL(18, 2) NULL,
        strRemarks NVARCHAR(500) NULL,
        
        -- =========================
        -- BILLING ADDRESS
        -- =========================
        strAttention_billing NVARCHAR(150) NULL,
        strCountryGUID_billing UNIQUEIDENTIFIER NULL,
        strAddress_billing NVARCHAR(500) NULL,
        strStateGUID_billing UNIQUEIDENTIFIER NULL,
        strCityGUID_billing UNIQUEIDENTIFIER NULL,
        strPinCode_billing NVARCHAR(20) NULL,
        strPhone_billing NVARCHAR(30) NULL,
        strFaxNumber_billing NVARCHAR(30) NULL,
        
        -- =========================
        -- SHIPPING ADDRESS
        -- =========================
        strAttention_shipping NVARCHAR(150) NULL,
        strCountryGUID_shipping UNIQUEIDENTIFIER NULL,
        strAddress_shipping NVARCHAR(500) NULL,
        strStateGUID_shipping UNIQUEIDENTIFIER NULL,
        strCityGUID_shipping UNIQUEIDENTIFIER NULL,
        strPinCode_shipping NVARCHAR(20) NULL,
        strPhone_shipping NVARCHAR(30) NULL,
        strFaxNumber_shipping NVARCHAR(30) NULL,
        
        -- Audit Fields
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        
        -- Tenant Fields
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        
        -- Constraints
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_mstParty_DisplayName_Type UNIQUE (strPartyName_Display, strPartyType, strOrganizationGUID, strGroupGUID),
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_mstParty_UDFCode UNIQUE (strUDFCode, strOrganizationGUID, strGroupGUID)
    )
END';
EXEC sp_executesql @sql;

-- MParty_Contact Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstParty_Contact'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstParty_Contact (
        strParty_ContactGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strPartyGUID UNIQUEIDENTIFIER NOT NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strSalutation NVARCHAR(10) NULL,
        strFirstName NVARCHAR(100) NOT NULL,
        strLastName NVARCHAR(100) NULL,
        strEmail NVARCHAR(100) NULL,
        strPhoneNo_Work NVARCHAR(20) NULL,
        strPhoneNo NVARCHAR(20) NULL,
        strSkype NVARCHAR(100) NULL,
        strDesignation NVARCHAR(100) NULL,
        strDepartment NVARCHAR(100) NULL,
        strTwitter NVARCHAR(100) NULL,
        strFacebook NVARCHAR(100) NULL,
        strInstagram NVARCHAR(100) NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_PartyContact_Party FOREIGN KEY (strPartyGUID) REFERENCES ' + QUOTENAME(@schemaName) + '.mstParty(strPartyGUID)
    )
END';
EXEC sp_executesql @sql;

-- Drop existing mstDocNo table if it exists (for clean recreation)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstDocNo'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    DROP TABLE ' + QUOTENAME(@schemaName) + '.mstDocNo;
    PRINT ''Dropped existing mstDocNo table for recreation'';
END';
EXEC sp_executesql @sql;

-- mstDocNo Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstDocNo'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstDocNo (
        strDocumentNoGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strDocumentTypeGUID UNIQUEIDENTIFIER NOT NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        intDigit INT NOT NULL DEFAULT 4,
        strPrefix NVARCHAR(50) NULL,
        strSufix NVARCHAR(50) NULL,
        intStartNo INT NOT NULL DEFAULT 1,
        intLastCreatedNo INT NOT NULL DEFAULT 0,
        bolIsDefault BIT NOT NULL DEFAULT 1,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_mstDocNo_DocTypeYear UNIQUE (strDocumentTypeGUID, strYearGUID, strOrganizationGUID)
    )
END';
EXEC sp_executesql @sql;
-- tranJournal_Voucher Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranJournal_Voucher'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher (
        strJournal_VoucherGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        dJournal_VoucherDate DATETIME NOT NULL,
        strJournal_VoucherNo NVARCHAR(50) NOT NULL,
        intJournal_VoucherSeqNo INT NOT NULL,
        strRefNo NVARCHAR(100) NULL,
        strNotes NVARCHAR(500) NOT NULL,
        strCurrencyTypeGUID UNIQUEIDENTIFIER NULL,
        strStatus NVARCHAR(20) NOT NULL DEFAULT ''DRAFT'',
        bolIsJouranl_Adjustement BIT NOT NULL DEFAULT 0,
        dblExchangeRate DECIMAL(20,3) NOT NULL DEFAULT 0,
        strJournal_Voucher_RecurringProfileGUID UNIQUEIDENTIFIER NULL,
        strApprovedByGUID NVARCHAR(50) NULL,
        dtApprovedOn DATETIME NULL,
        strRejectedByGUID NVARCHAR(50) NULL,
        dtRejectedOn DATETIME NULL,
        strRejectedReason NVARCHAR(500) NULL,
        strReportingMethod NVARCHAR(20) NOT NULL DEFAULT ''Accrual and Cash'',
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        dtExchangeRateDate DATE NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_tranJournal_Voucher_No UNIQUE (strJournal_VoucherNo, strYearGUID, strOrganizationGUID)
    )
END';
EXEC sp_executesql @sql;

-- Drop existing tranJournal_Voucher_Item table if it exists (for clean recreation)
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranJournal_Voucher_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    DROP TABLE ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher_Item;
    PRINT ''Dropped existing tranJournal_Voucher_Item table for recreation'';
END';
EXEC sp_executesql @sql;

-- tranJournal_Voucher_Item Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranJournal_Voucher_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher_Item (
        strJournal_Voucher_ItemGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strJournal_VoucherGUID UNIQUEIDENTIFIER NOT NULL,
        intSeqNo INT NOT NULL,
        strAccountGUID UNIQUEIDENTIFIER NOT NULL,
        strDesc NVARCHAR(500) NULL,
        strRefNo NVARCHAR(100) NULL,
        strNotes NVARCHAR(1000) NULL,
        strCurrencyTypeGUID UNIQUEIDENTIFIER NULL,
        dblDebit DECIMAL(18,2) NULL,
        dblCredit DECIMAL(18,2) NULL,
        dblDebit_BaseCurrency DECIMAL(18,2) NULL,
        dblCredit_BaseCurrency DECIMAL(18,2) NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strCreatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_JV_Item_JV FOREIGN KEY (strJournal_VoucherGUID) 
            REFERENCES ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher(strJournal_VoucherGUID)
    )
END';
EXEC sp_executesql @sql;


-- tranJournal_Voucher_Template Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranJournal_Voucher_Template'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher_Template (
        strJournal_Voucher_TemplateGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strTemplateName NVARCHAR(100) NOT NULL,
        strRefNo NVARCHAR(100) NULL,
        strNotes NVARCHAR(500) NULL,
        strCurrencyTypeGUID UNIQUEIDENTIFIER NOT NULL,
        bolIsJouranl_Adjustement BIT NOT NULL DEFAULT 0,
        dblExchangeRate DECIMAL(20,3) NOT NULL DEFAULT 0,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_tranJournal_Voucher_Template_Name UNIQUE (strTemplateName, strYearGUID, strOrganizationGUID)
    )
END';
EXEC sp_executesql @sql;

-- tranJournal_Voucher_Template_Items Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranJournal_Voucher_Template_Items'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher_Template_Items (
        strJournal_Voucher_Template_ItemGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strJournal_Voucher_TemplateGUID UNIQUEIDENTIFIER NOT NULL,
        intSeqNo INT NOT NULL,
        strAccountGUID UNIQUEIDENTIFIER NOT NULL,
        strDesc NVARCHAR(500) NULL,
        strRefNo NVARCHAR(100) NULL,
        dblDebit DECIMAL(20,3) NULL,
        dblCredit DECIMAL(20,3) NULL,
        dblDebit_BaseCurrency DECIMAL(20,3) NULL,
        dblCredit_BaseCurrency DECIMAL(20,3) NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_JV_Template_Item_Template FOREIGN KEY (strJournal_Voucher_TemplateGUID) 
            REFERENCES ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher_Template(strJournal_Voucher_TemplateGUID) ON DELETE CASCADE
    )
END';
EXEC sp_executesql @sql;

-- tranJournal_Voucher_RecurringProfile Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranJournal_Voucher_RecurringProfile'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher_RecurringProfile (
        strJournal_Voucher_RecurringProfileGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strProfileName NVARCHAR(150) NOT NULL,
        strJournal_VoucherGUID UNIQUEIDENTIFIER NOT NULL,
        strRepeatType NVARCHAR(20) NOT NULL DEFAULT ''Daily'',
        intRepeatEveryValue INT NOT NULL DEFAULT 1,
        strRepeatEveryUnit NVARCHAR(20) NULL,
        intRepeatOnDay INT NULL,
        strRepeatOnWeekday NVARCHAR(20) NULL,
        strCustomFrequencyJson NVARCHAR(MAX) NULL,
        dStartDate DATETIME NOT NULL,
        dEndDate DATETIME NULL,
        bolNeverExpires BIT NOT NULL DEFAULT 0,
        dtNextRunDate DATETIME NULL,
        strStatus NVARCHAR(20) NOT NULL DEFAULT ''Active'',
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_JV_RecurringProfile_JV FOREIGN KEY (strJournal_VoucherGUID) 
            REFERENCES ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher(strJournal_VoucherGUID) ON DELETE NO ACTION,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_JV_RecurringProfile_Name UNIQUE (strProfileName, strYearGUID, strOrganizationGUID)
    )
END';
EXEC sp_executesql @sql;

-- Indexes for tranJournal_Voucher_RecurringProfile
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranJournal_Voucher_RecurringProfile'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    -- Index for next run date (for job processing - filtered on Active status)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_JV_RecurringProfile_NextRunDate'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranJournal_Voucher_RecurringProfile''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_JV_RecurringProfile_NextRunDate 
        ON ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher_RecurringProfile(dtNextRunDate) 
        WHERE dtNextRunDate IS NOT NULL AND strStatus = ''Active'';
    END
    
    -- Index for status and organization filtering
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_JV_RecurringProfile_Status'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranJournal_Voucher_RecurringProfile''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_JV_RecurringProfile_Status 
        ON ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher_RecurringProfile(strStatus, strOrganizationGUID, strYearGUID);
    END
    
    -- Index for journal voucher lookup (for efficient querying by voucher GUID)
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_JV_RecurringProfile_JV_GUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranJournal_Voucher_RecurringProfile''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_JV_RecurringProfile_JV_GUID 
        ON ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher_RecurringProfile(strJournal_VoucherGUID, strOrganizationGUID, strGroupGUID);
    END
    
    -- Index for organization/year/group filtering
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_JV_RecurringProfile_OrgYearGroup'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranJournal_Voucher_RecurringProfile''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_JV_RecurringProfile_OrgYearGroup 
        ON ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher_RecurringProfile(strGroupGUID, strOrganizationGUID, strYearGUID);
    END
END';
EXEC sp_executesql @sql;

-- Create indexes for tranJournal_Voucher_Item
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranJournal_Voucher_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    -- Index for strJournal_VoucherGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_Item_JVGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranJournal_Voucher_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_Item_JVGUID ON ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher_Item(strJournal_VoucherGUID);
    END
    
    -- Index for strAccountGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_Item_AccountGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranJournal_Voucher_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_Item_AccountGUID ON ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher_Item(strAccountGUID);
    END
    
    -- Index for GroupGUID, OrganizationGUID, YearGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_Item_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranJournal_Voucher_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_Item_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher_Item(strGroupGUID, strOrganizationGUID, strYearGUID);
    END
END';
EXEC sp_executesql @sql;

-- Create indexes for tranJournal_Voucher
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranJournal_Voucher'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    -- Index for strGroupGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_GroupGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranJournal_Voucher''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_GroupGUID ON ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher(strGroupGUID);
    END
    
    -- Index for strOrganizationGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_OrganizationGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranJournal_Voucher''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_OrganizationGUID ON ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher(strOrganizationGUID);
    END
    
    -- Index for strYearGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_YearGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranJournal_Voucher''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_YearGUID ON ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher(strYearGUID);
    END
    
    -- Index for dJournal_VoucherDate
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_Date'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranJournal_Voucher''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_Date ON ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher(dJournal_VoucherDate);
    END
    
    -- Index for strStatus
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_Status'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranJournal_Voucher''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranJournal_Voucher_Status ON ' + QUOTENAME(@schemaName) + '.tranJournal_Voucher(strStatus);
    END
END';
EXEC sp_executesql @sql;

-- Create indexes for mstDocNo
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''mstDocNo'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    -- Index for strDocumentTypeGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstDocNo_DocTypeGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstDocNo''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstDocNo_DocTypeGUID ON ' + QUOTENAME(@schemaName) + '.mstDocNo(strDocumentTypeGUID);
    END

    -- Index for strGroupGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstDocNo_GroupGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstDocNo''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstDocNo_GroupGUID ON ' + QUOTENAME(@schemaName) + '.mstDocNo(strGroupGUID);
    END

    -- Index for strOrganizationGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstDocNo_OrganizationGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstDocNo''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstDocNo_OrganizationGUID ON ' + QUOTENAME(@schemaName) + '.mstDocNo(strOrganizationGUID);
    END

    -- Index for strYearGUID
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstDocNo_YearGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstDocNo''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstDocNo_YearGUID ON ' + QUOTENAME(@schemaName) + '.mstDocNo(strYearGUID);
    END

    -- Combined index for document type and year by organization
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstDocNo_TypeYearOrg'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstDocNo''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstDocNo_TypeYearOrg ON ' + QUOTENAME(@schemaName) + '.mstDocNo(strDocumentTypeGUID, strYearGUID, strOrganizationGUID);
    END
END';
EXEC sp_executesql @sql;

-- Create indexes for better query performance
SET @sql = '
-- Indexes for mstParty
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstParty_PartyType'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstParty''))
BEGIN
    CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstParty_PartyType ON ' + QUOTENAME(@schemaName) + '.mstParty(strPartyType);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstParty_OrgGroup'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstParty''))
BEGIN
    CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstParty_OrgGroup ON ' + QUOTENAME(@schemaName) + '.mstParty(strOrganizationGUID, strGroupGUID);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstParty_DisplayName'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstParty''))
BEGIN
    CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstParty_DisplayName ON ' + QUOTENAME(@schemaName) + '.mstParty(strPartyName_Display);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstParty_CurrencyType'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstParty''))
BEGIN
    CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstParty_CurrencyType ON ' + QUOTENAME(@schemaName) + '.mstParty(strCurrencyTypeGUID);
END

-- Indexes for mstParty_Contact
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstParty_Contact_PartyGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstParty_Contact''))
BEGIN
    CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstParty_Contact_PartyGUID ON ' + QUOTENAME(@schemaName) + '.mstParty_Contact(strPartyGUID);
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_mstParty_Contact_GroupOrg'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstParty_Contact''))
BEGIN
    CREATE INDEX IX_' + @sanitizedOrgGUID + '_mstParty_Contact_GroupOrg ON ' + QUOTENAME(@schemaName) + '.mstParty_Contact(strGroupGUID, strOrganizationGUID);
END
';
EXEC sp_executesql @sql;

-- tranAccountActivityLog Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranAccountActivityLog'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranAccountActivityLog (
        strAccountActivityLogGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strUserGUID           UNIQUEIDENTIFIER NOT NULL,
        strGroupGUID          UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID   UNIQUEIDENTIFIER NOT NULL,
        strYearGUID           UNIQUEIDENTIFIER NOT NULL,
        strModuleGUID         UNIQUEIDENTIFIER NOT NULL,
        strEntityGUID         UNIQUEIDENTIFIER NOT NULL,
        strEntityType         NVARCHAR(100)    NOT NULL,
        strActivityType       NVARCHAR(50)     NOT NULL,
        strDetails            NVARCHAR(MAX)    NULL,
        strIPAddress          NVARCHAR(50)     NULL,
        strUserAgent          NVARCHAR(500)    NULL,
        strUserSessionGUID    UNIQUEIDENTIFIER NULL,
        strOldValue           NVARCHAR(MAX)    NULL,
        strNewValue           NVARCHAR(MAX)    NULL,
        dtActivityTime        DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME(),
        dtCreatedOn           DATETIME2(7)     NOT NULL DEFAULT SYSUTCDATETIME()
    )
END';
EXEC sp_executesql @sql;

-- Indexes for tranAccountActivityLog
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranAccountActivityLog'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    -- Fast lookup by entity + time
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_AccountActivityLog_Entity'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranAccountActivityLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_AccountActivityLog_Entity
        ON ' + QUOTENAME(@schemaName) + '.tranAccountActivityLog(strEntityGUID, dtActivityTime DESC);
    END

    -- User activity history
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_AccountActivityLog_User'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranAccountActivityLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_AccountActivityLog_User
        ON ' + QUOTENAME(@schemaName) + '.tranAccountActivityLog(strUserGUID, dtActivityTime DESC);
    END

    -- Filter by organization/year/module
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_AccountActivityLog_OrgYearModule'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranAccountActivityLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_AccountActivityLog_OrgYearModule
        ON ' + QUOTENAME(@schemaName) + '.tranAccountActivityLog(strOrganizationGUID, strYearGUID, strModuleGUID, dtActivityTime DESC);
    END
END';
EXEC sp_executesql @sql;
-- tranOpeningBalance Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranOpeningBalance'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranOpeningBalance (
        strOpeningBalanceGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        dtOpeningBalanceDate DATETIME NOT NULL,
        strAccountGUID UNIQUEIDENTIFIER NOT NULL,
        strOpeningBalanceNo NVARCHAR(50) NOT NULL,
        intOpengBalanceSeqNo INT NOT NULL,
        strCurrencyTypeGUID UNIQUEIDENTIFIER NULL,
        dblDebit DECIMAL(20,3) NULL,
        dblCredit DECIMAL(20,3) NULL,
        dblExchangeRate DECIMAL(20,3) NULL,
        dtExchangeDate DATETIME NULL,
        dblDebit_BaseCurrency DECIMAL(20,3) NULL,
        dblCredit_BaseCurrency DECIMAL(20,3) NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_tranOpeningBalance_No UNIQUE (strOpeningBalanceNo, strYearGUID, strOrganizationGUID)
    )
END';
EXEC sp_executesql @sql;

-- Indexes for tranOpeningBalance
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranOpeningBalance'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranOpeningBalance_Account'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranOpeningBalance''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranOpeningBalance_Account ON ' + QUOTENAME(@schemaName) + '.tranOpeningBalance(strAccountGUID);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranOpeningBalance_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranOpeningBalance''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranOpeningBalance_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranOpeningBalance(strOrganizationGUID, strGroupGUID, strYearGUID);
    END
END';
EXEC sp_executesql @sql;

-- tranLedger Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranLedger'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranLedger (
        strLedgerGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strVoucherType NVARCHAR(50) NOT NULL,
        strVoucherGUID UNIQUEIDENTIFIER NOT NULL,
        strVoucher_ItemGUID UNIQUEIDENTIFIER NULL,
        strVoucherNo NVARCHAR(50) NULL,
        dVoucherDate DATETIME NOT NULL,
        intSeqNo INT NOT NULL,
        strAccountGUID UNIQUEIDENTIFIER NOT NULL,
        strPartyGUID UNIQUEIDENTIFIER NULL,
        dblDebit DECIMAL(20, 3) NULL,
        dblCredit DECIMAL(20, 3) NULL,
        strCurrencyTypeGUID UNIQUEIDENTIFIER NULL,
        dblExchangeRate DECIMAL(18, 6) NULL,
        dblDebit_BaseCurrency DECIMAL(20, 3) NULL,
        dblCredit_BaseCurrency DECIMAL(20, 3) NULL,
        strNarration NVARCHAR(1000) NULL,
        strRefNo NVARCHAR(100) NULL,
        bolIsReconciled BIT NOT NULL DEFAULT 0,
        dReconciledDate DATETIME NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL
    )
END';
EXEC sp_executesql @sql;

-- Indexes for tranLedger
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranLedger'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranLedger_AccountDate'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranLedger''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranLedger_AccountDate ON ' + QUOTENAME(@schemaName) + '.tranLedger(strAccountGUID, dVoucherDate DESC);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranLedger_VoucherGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranLedger''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranLedger_VoucherGUID ON ' + QUOTENAME(@schemaName) + '.tranLedger(strVoucherGUID);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranLedger_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranLedger''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranLedger_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranLedger(strOrganizationGUID, strGroupGUID, strYearGUID);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranLedger_PartyGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranLedger''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranLedger_PartyGUID ON ' + QUOTENAME(@schemaName) + '.tranLedger(strPartyGUID);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranLedger_VoucherType'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranLedger''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranLedger_VoucherType ON ' + QUOTENAME(@schemaName) + '.tranLedger(strVoucherType);
    END
END';
EXEC sp_executesql @sql;

-- tranInvoice_Item_TaxDetail Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranInvoice_Item_TaxDetail'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice_Item_TaxDetail (
        strInvoice_Item_TaxDetailGUID UNIQUEIDENTIFIER PRIMARY KEY,
        strInvoice_ItemGUID UNIQUEIDENTIFIER NOT NULL,
        strTaxCategoryGUID UNIQUEIDENTIFIER NULL,
        strTaxRateGUID UNIQUEIDENTIFIER NULL,
        dblTaxableAmount DECIMAL(20, 3) NOT NULL,
        dblTaxableAmountBase DECIMAL(20, 3) NOT NULL,
        dblTaxPercentage DECIMAL(20, 3) NOT NULL,
        dblTaxAmount DECIMAL(20, 3) NOT NULL,
        dblTaxAmountBase DECIMAL(20, 3) NOT NULL,
        strTaxRateName NVARCHAR(200) NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL
    )
END';
EXEC sp_executesql @sql;

-- FK and indexes for tranInvoice_Item_TaxDetail
SET @sql = '
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''tranInvoice_Item_TaxDetail'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
   AND EXISTS (SELECT 1 FROM sys.tables WHERE name = ''tranInvoice_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = ''FK_' + @sanitizedOrgGUID + '_InvoiceItemTaxDetail_InvoiceItem''
          AND parent_object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_Item_TaxDetail''))
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranInvoice_Item_TaxDetail WITH CHECK
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_InvoiceItemTaxDetail_InvoiceItem
            FOREIGN KEY (strInvoice_ItemGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + '.tranInvoice_Item(strInvoice_ItemGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_InvoiceItemTaxDetail_Item'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_Item_TaxDetail''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_InvoiceItemTaxDetail_Item ON ' + QUOTENAME(@schemaName) + '.tranInvoice_Item_TaxDetail(strInvoice_ItemGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_InvoiceItemTaxDetail_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranInvoice_Item_TaxDetail''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_InvoiceItemTaxDetail_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranInvoice_Item_TaxDetail(strOrganizationGUID, strGroupGUID, strYearGUID);
    END
END';
EXEC sp_executesql @sql;

-- tranPurchaseInvoice_Item_TaxDetail Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPurchaseInvoice_Item_TaxDetail'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice_Item_TaxDetail (
        strPurchaseInvoice_Item_TaxDetailGUID UNIQUEIDENTIFIER PRIMARY KEY,
        strPurchaseInvoice_ItemGUID UNIQUEIDENTIFIER NOT NULL,
        strTaxCategoryGUID UNIQUEIDENTIFIER NULL,
        strTaxRateGUID UNIQUEIDENTIFIER NULL,
        dblTaxableAmount DECIMAL(20, 3) NOT NULL,
        dblTaxableAmountBase DECIMAL(20, 3) NOT NULL,
        dblTaxPercentage DECIMAL(20, 3) NOT NULL,
        dblTaxAmount DECIMAL(20, 3) NOT NULL,
        dblTaxAmountBase DECIMAL(20, 3) NOT NULL,
        strTaxRateName NVARCHAR(200) NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL
    )
END';
EXEC sp_executesql @sql;

-- FK and indexes for tranPurchaseInvoice_Item_TaxDetail
SET @sql = '
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''tranPurchaseInvoice_Item_TaxDetail'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
   AND EXISTS (SELECT 1 FROM sys.tables WHERE name = ''tranPurchaseInvoice_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = ''FK_' + @sanitizedOrgGUID + '_PurchaseInvoiceItemTaxDetail_Item''
          AND parent_object_id = OBJECT_ID(''' + @schemaName + '.tranPurchaseInvoice_Item_TaxDetail''))
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice_Item_TaxDetail WITH CHECK
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_PurchaseInvoiceItemTaxDetail_Item
            FOREIGN KEY (strPurchaseInvoice_ItemGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice_Item(strPurchaseInvoice_ItemGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_PurchaseInvoiceItemTaxDetail_Item'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPurchaseInvoice_Item_TaxDetail''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_PurchaseInvoiceItemTaxDetail_Item ON ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice_Item_TaxDetail(strPurchaseInvoice_ItemGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_PurchaseInvoiceItemTaxDetail_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPurchaseInvoice_Item_TaxDetail''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_PurchaseInvoiceItemTaxDetail_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranPurchaseInvoice_Item_TaxDetail(strOrganizationGUID, strGroupGUID, strYearGUID);
    END
END';
EXEC sp_executesql @sql;

-- tranBankStatement Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranBankStatement'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranBankStatement (
        strBankStatementGUID UNIQUEIDENTIFIER PRIMARY KEY,
        strBankGUID UNIQUEIDENTIFIER NOT NULL,
        strBankName NVARCHAR(200) NULL,
        strAccountNo NVARCHAR(50) NOT NULL,
        strStatementRefNo NVARCHAR(100) NULL,
        dtTransactionDate DATETIME NOT NULL,
        dtValueDate DATETIME NULL,
        strTransactionType NVARCHAR(50) NULL,
        dblDebitAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
        dblCreditAmount DECIMAL(18, 2) NOT NULL DEFAULT 0,
        dblBalance DECIMAL(18, 2) NULL,
        strDescription NVARCHAR(500) NULL,
        strChequeNo NVARCHAR(100) NULL,
        strReconciliationStatus NVARCHAR(20) NOT NULL DEFAULT ''UNMATCHED'',
        strMatchedPaymentReceiptGUID UNIQUEIDENTIFIER NULL,
        dtReconciliationDate DATETIME NULL,
        strReconciledBy UNIQUEIDENTIFIER NULL,
        strMatchingRule NVARCHAR(100) NULL,
        strImportBatchGUID UNIQUEIDENTIFIER NULL,
        dtImportDate DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strImportedBy UNIQUEIDENTIFIER NOT NULL,
        strImportFileName NVARCHAR(500) NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL
    )
END';
EXEC sp_executesql @sql;

SET @sql = '
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''tranBankStatement'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BankStatement_BankGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranBankStatement''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BankStatement_BankGUID ON ' + QUOTENAME(@schemaName) + '.tranBankStatement(strBankGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_BankStatement_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranBankStatement''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_BankStatement_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranBankStatement(strOrganizationGUID, strGroupGUID, strYearGUID);
    END
END';
EXEC sp_executesql @sql;

-- tranReconciliationLog Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranReconciliationLog'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranReconciliationLog (
        strReconciliationLogGUID UNIQUEIDENTIFIER PRIMARY KEY,
        strPaymentReceiptGUID UNIQUEIDENTIFIER NULL,
        strBankStatementGUID UNIQUEIDENTIFIER NULL,
        strReconciliationType NVARCHAR(20) NOT NULL,
        strAction NVARCHAR(50) NOT NULL,
        strMatchingRule NVARCHAR(100) NULL,
        dblAmountDifference DECIMAL(18, 2) NULL,
        intDateDifference INT NULL,
        strNotes NVARCHAR(1000) NULL,
        strReasonCode NVARCHAR(50) NULL,
        strReconciledBy UNIQUEIDENTIFIER NOT NULL,
        dtReconciliationDate DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL
    )
END';
EXEC sp_executesql @sql;

SET @sql = '
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''tranReconciliationLog'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_ReconciliationLog_OrgYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranReconciliationLog''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_ReconciliationLog_OrgYear ON ' + QUOTENAME(@schemaName) + '.tranReconciliationLog(strOrganizationGUID, strYearGUID);
    END
END';
EXEC sp_executesql @sql;

-- mstScheduleEmail Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstScheduleEmail'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstScheduleEmail (
        strScheduleEmailGUID UNIQUEIDENTIFIER PRIMARY KEY,
        strSubject NVARCHAR(500) NULL,
        strTemplateGUID UNIQUEIDENTIFIER NULL,
        strFromAddress NVARCHAR(255) NULL,
        dtScheduleTime DATETIME NOT NULL,
        dtSentendOn DATETIME NULL,
        strStatus NVARCHAR(50) NOT NULL DEFAULT ''Pending'',
        strEntityGUID UNIQUEIDENTIFIER NULL,
        strEntityType NVARCHAR(100) NULL,
        strEntityValue NVARCHAR(MAX) NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strModuleGUID UNIQUEIDENTIFIER NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL
    )
END';
EXEC sp_executesql @sql;

SET @sql = '
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''mstScheduleEmail'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_ScheduleEmail_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstScheduleEmail''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_ScheduleEmail_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.mstScheduleEmail(strOrganizationGUID, strGroupGUID, strYearGUID);
    END
END';
EXEC sp_executesql @sql;

-- mstScheduleEmailRecipient Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstScheduleEmailRecipient'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstScheduleEmailRecipient (
        strScheduleEmailRecipientGUID UNIQUEIDENTIFIER PRIMARY KEY,
        strScheduleEmailGUID UNIQUEIDENTIFIER NOT NULL,
        strRecipientType NVARCHAR(50) NULL,
        strEmailAddress NVARCHAR(255) NOT NULL,
        strDeliveryStatus NVARCHAR(50) NULL DEFAULT ''Pending'',
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL
    )
END';
EXEC sp_executesql @sql;

SET @sql = '
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''mstScheduleEmailRecipient'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = ''FK_' + @sanitizedOrgGUID + '_ScheduleEmailRecipient_Email'' AND parent_object_id = OBJECT_ID(''' + @schemaName + '.mstScheduleEmailRecipient''))
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.mstScheduleEmailRecipient WITH CHECK
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_ScheduleEmailRecipient_Email
            FOREIGN KEY (strScheduleEmailGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + '.mstScheduleEmail(strScheduleEmailGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_ScheduleEmailRecipient_Email'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstScheduleEmailRecipient''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_ScheduleEmailRecipient_Email ON ' + QUOTENAME(@schemaName) + '.mstScheduleEmailRecipient(strScheduleEmailGUID);
    END
END';
EXEC sp_executesql @sql;

-- mstScheduledEmailAttachment Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''mstScheduledEmailAttachment'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.mstScheduledEmailAttachment (
        strScheduledEmailAttachmentGUID UNIQUEIDENTIFIER PRIMARY KEY,
        strScheduleEmailGUID UNIQUEIDENTIFIER NOT NULL,
        strDocumentGUID UNIQUEIDENTIFIER NOT NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL
    )
END';
EXEC sp_executesql @sql;

SET @sql = '
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''mstScheduledEmailAttachment'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = ''FK_' + @sanitizedOrgGUID + '_ScheduledEmailAttachment_Email'' AND parent_object_id = OBJECT_ID(''' + @schemaName + '.mstScheduledEmailAttachment''))
    BEGIN
        ALTER TABLE ' + QUOTENAME(@schemaName) + '.mstScheduledEmailAttachment WITH CHECK
        ADD CONSTRAINT FK_' + @sanitizedOrgGUID + '_ScheduledEmailAttachment_Email
            FOREIGN KEY (strScheduleEmailGUID)
            REFERENCES ' + QUOTENAME(@schemaName) + '.mstScheduleEmail(strScheduleEmailGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_ScheduledEmailAttachment_Email'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstScheduledEmailAttachment''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_ScheduledEmailAttachment_Email ON ' + QUOTENAME(@schemaName) + '.mstScheduledEmailAttachment(strScheduleEmailGUID);
    END

    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_ScheduledEmailAttachment_OrgGroup'' AND object_id = OBJECT_ID(''' + @schemaName + '.mstScheduledEmailAttachment''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_ScheduledEmailAttachment_OrgGroup ON ' + QUOTENAME(@schemaName) + '.mstScheduledEmailAttachment(strOrganizationGUID, strGroupGUID);
    END
END';
EXEC sp_executesql @sql;

-- tranPaymentReceived Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPaymentReceived'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranPaymentReceived (
        strPaymentReceivedGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strPaymentReceivedNo NVARCHAR(50) NOT NULL,
        intPaymentReceivedSeqNo INT NOT NULL,
        dPaymentReceivedDate DATETIME NOT NULL,
        strCustomerGUID UNIQUEIDENTIFIER NOT NULL,
        strAccountGUID UNIQUEIDENTIFIER NOT NULL,
        strRefNo NVARCHAR(100) NULL,
        strPaymentMode NVARCHAR(20) NOT NULL,
        strSubject NVARCHAR(500) NULL,
        strStatus NVARCHAR(20) NOT NULL DEFAULT ''DRAFT'',
        dblBankCharges DECIMAL(18,2) NOT NULL DEFAULT 0,
        dblTotalAmountReceived DECIMAL(18,2) NOT NULL,
        dblTotalAmountReceivedBase DECIMAL(18,2) NOT NULL,
        strNotes NVARCHAR(1000) NULL,
        dtExchangeRateDate DATETIME NULL,
        dblExchangeRate DECIMAL(18,6) NOT NULL DEFAULT 1,
        strCurrencyTypeGUID UNIQUEIDENTIFIER NULL,
        strApprovedByGUID UNIQUEIDENTIFIER NULL,
        dtApprovedOn DATETIME NULL,
        strRejectedByGUID UNIQUEIDENTIFIER NULL,
        dtRejectedOn DATETIME NULL,
        strRejectedReason NVARCHAR(500) NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT UQ_' + @sanitizedOrgGUID + '_tranPaymentReceived_No UNIQUE (strPaymentReceivedNo, strYearGUID, strOrganizationGUID)
    )
END';
EXEC sp_executesql @sql;

-- tranPaymentReceived_Item Table
SET @sql = '
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPaymentReceived_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    CREATE TABLE ' + QUOTENAME(@schemaName) + '.tranPaymentReceived_Item (
        strPaymentReceived_ItemGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        strPaymentReceivedGUID UNIQUEIDENTIFIER NOT NULL,
        strInvoiceGUID UNIQUEIDENTIFIER NOT NULL,
        dtPaymentReceivedOn DATETIME NOT NULL,
        dblPaymentAmount DECIMAL(18,2) NOT NULL,
        strYearGUID UNIQUEIDENTIFIER NOT NULL,
        strOrganizationGUID UNIQUEIDENTIFIER NOT NULL,
        strGroupGUID UNIQUEIDENTIFIER NOT NULL,
        strCreatedByGUID UNIQUEIDENTIFIER NOT NULL,
        dtCreatedOn DATETIME NOT NULL DEFAULT GETUTCDATE(),
        strUpdatedByGUID UNIQUEIDENTIFIER NULL,
        dtUpdatedOn DATETIME NULL,
        CONSTRAINT FK_' + @sanitizedOrgGUID + '_PaymentReceived_Item_PaymentReceived FOREIGN KEY (strPaymentReceivedGUID) 
            REFERENCES ' + QUOTENAME(@schemaName) + '.tranPaymentReceived(strPaymentReceivedGUID) ON DELETE CASCADE
    )
END';
EXEC sp_executesql @sql;

-- Indexes for tranPaymentReceived
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPaymentReceived'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_PaymentNo'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceived''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_PaymentNo ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceived(strPaymentReceivedNo);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceived''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceived(strOrganizationGUID, strGroupGUID, strYearGUID);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_Date'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceived''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_Date ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceived(dPaymentReceivedDate DESC);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_Status'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceived''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_Status ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceived(strStatus);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_Customer'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceived''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_Customer ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceived(strCustomerGUID);
    END
END';
EXEC sp_executesql @sql;

-- Indexes for tranPaymentReceived_Item
SET @sql = '
IF EXISTS (SELECT * FROM sys.tables WHERE name = ''tranPaymentReceived_Item'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_Item_PRGUID'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceived_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_Item_PRGUID ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceived_Item(strPaymentReceivedGUID);
    END
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = ''IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_Item_OrgGroupYear'' AND object_id = OBJECT_ID(''' + @schemaName + '.tranPaymentReceived_Item''))
    BEGIN
        CREATE INDEX IX_' + @sanitizedOrgGUID + '_tranPaymentReceived_Item_OrgGroupYear ON ' + QUOTENAME(@schemaName) + '.tranPaymentReceived_Item(strOrganizationGUID, strGroupGUID, strYearGUID);
    END
END';
EXEC sp_executesql @sql;

SET @sql = N'
INSERT INTO ' + QUOTENAME(@schemaName) + '.mstDocNo
(
    strDocumentNoGUID, strDocumentTypeGUID, strGroupGUID, strOrganizationGUID,
    strYearGUID, intDigit, strPrefix, strSufix, intStartNo,
    intLastCreatedNo, bolIsDefault, strCreatedByGUID, dtCreatedOn
)
SELECT NEWID(), DocType, ''' + @useGroupGUID + ''', ''' + @organizationGUID + ''',
       ''' + @useYearGUID + ''', 6, Prefix, '''', 1,
       0, 1, ''' + @useGroupGUID + ''', GETUTCDATE()
FROM
(
    VALUES
       (''8CACEE47-D73F-45D8-B8C5-06F3A2646275'', ''SINV''),
       (''30446AE1-3387-4EC8-A5D4-23B07E22D6FE'', ''BP''),
       (''49E0AE0C-3E27-4678-9363-4CAC107225EA'', ''JV''),
       (''59F0EC4A-4F7F-4922-89CE-80D20A259637'', ''CP''),
       (''EC72D10D-C884-4A8F-A325-9AF01A723E85'', ''BR''),
       (''2D57DEDD-FADD-4609-92A4-AD78C708854C'', ''CR''),
       (''E77BA72A-B373-45C4-A85C-B33EE0D754D6'', ''PINV''),
       (''2FE8FC86-382E-4B83-B99D-E53CBFBA398A'', ''OPBL'')
) AS X(DocType, Prefix);

PRINT ''Document number records inserted successfully.'';
';
EXEC sp_executesql @sql;

-- Country-specific default general accounts (assumed requirement)
-- Run after all tables are created so mstGeneralAccount is guaranteed to exist
PRINT 'Checking country GUID for GST accounts: Expected AFE3C17D-F88A-43A8-89F5-77440B08AC5C, Got: ' + ISNULL(CAST(@countryGUID AS NVARCHAR(50)), 'NULL');
IF @countryGUID = 'AFE3C17D-F88A-43A8-89F5-77440B08AC5C'
BEGIN
    PRINT 'Creating GST accounts for India...';
    SET @sql = '
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''mstGeneralAccount'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
    BEGIN
         DECLARE @accounts TABLE(Name NVARCHAR(100), UDF NVARCHAR(6), Schedule UNIQUEIDENTIFIER, Id UNIQUEIDENTIFIER);
         INSERT INTO @accounts(Name, UDF, Schedule, Id)
         VALUES (''CGST Payable'', ''CGST01'', ''756023EE-579D-4CCD-8119-21A7B2500737'', NEWID()),
             (''SGST Payable'', ''SGST01'', ''756023EE-579D-4CCD-8119-21A7B2500737'', NEWID()),
             (''IGST Payable'', ''IGST01'', ''756023EE-579D-4CCD-8119-21A7B2500737'', NEWID()),
             (''CGST Receivable'', ''CGSTR1'', ''2C5B4908-5FB8-4780-822B-00AEB1FCDAB3'', NEWID()),
             (''SGST Receivable'', ''SGSTR1'', ''2C5B4908-5FB8-4780-822B-00AEB1FCDAB3'', NEWID()),
             (''IGST Receivable'', ''IGSTR1'', ''2C5B4908-5FB8-4780-822B-00AEB1FCDAB3'', NEWID());

         -- Insert GST general accounts (idempotent)
         INSERT INTO ' + QUOTENAME(@schemaName) + '.mstGeneralAccount (
             strGeneralAccountGUID,
             strGroupGUID,
             strGeneralAccountName,
             strUDFCode,
             strAccountTypeGUID,
             strScheduleGUID,
             strDesc,
             bolIsActive,
             bolIsLock,
             strOrganizationGUID,
             strCreatedByGUID,
             dtCreatedOn,
             strUpdatedByGUID,
             dtUpdatedOn
         )
         SELECT a.Id,
                ''' + @useGroupGUID + ''',
                a.Name,
                a.UDF,
                ''14b8e205-398e-4557-b914-40b6a277434b'',
                a.Schedule,
                ''Auto-created GST tax account'',
                1,
                1,
                ''' + CAST(@organizationGUID AS NVARCHAR(50)) + ''',
                ''' + @useGroupGUID + ''',
                GETUTCDATE(),
                NULL,
                GETUTCDATE()
         FROM @accounts a
         WHERE NOT EXISTS (
             SELECT 1 FROM ' + QUOTENAME(@schemaName) + '.mstGeneralAccount g
             WHERE g.strGeneralAccountName = a.Name
               AND g.strOrganizationGUID = ''' + CAST(@organizationGUID AS NVARCHAR(50)) + '''
         );

         -- Insert base mstAccount with same PKs (idempotent)
         INSERT INTO ' + QUOTENAME(@schemaName) + '.mstAccount (
             strAccountGUID,
             strGroupGUID,
             strAccountName,
             strUDFCode,
             strAccountTypeGUID,
             strScheduleGUID,
             strDesc,
             bolIsActive,
             strOrganizationGUID,
             strCreatedByGUID,
             dtCreatedOn,
             strUpdatedByGUID,
             dtUpdatedOn
         )
         SELECT a.Id,
                ''' + @useGroupGUID + ''',
                a.Name,
                a.UDF,
                ''14b8e205-398e-4557-b914-40b6a277434b'',
                a.Schedule,
                ''Auto-created base account for '' + a.Name,
                1,
                ''' + CAST(@organizationGUID AS NVARCHAR(50)) + ''',
                ''' + @useGroupGUID + ''',
                GETUTCDATE(),
                NULL,
                GETUTCDATE()
         FROM @accounts a
         WHERE NOT EXISTS (
             SELECT 1 FROM ' + QUOTENAME(@schemaName) + '.mstAccount acc WHERE acc.strAccountGUID = a.Id
         );

         PRINT ''Inserted/verified GST accounts.'';
    END
    ELSE
    BEGIN
        PRINT ''mstGeneralAccount not present; skipping country-specific GST account inserts.'';
    END';


    EXEC sp_executesql @sql;
END

-- UK VAT-specific account creation (country-specific)
-- Run after all tables are created so mstGeneralAccount is guaranteed to exist
PRINT 'Checking country GUID for UK VAT accounts: Expected 862D48C0-0AAF-4CFC-9F71-10616E222F57, Got: ' + ISNULL(CAST(@countryGUID AS NVARCHAR(50)), 'NULL');
IF @countryGUID = '862D48C0-0AAF-4CFC-9F71-10616E222F57'
BEGIN
    PRINT 'Creating VAT accounts for UK...';
    SET @sql = '
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''mstGeneralAccount'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
    BEGIN
         DECLARE @ukAccounts TABLE(Name NVARCHAR(100), UDF NVARCHAR(6), Schedule UNIQUEIDENTIFIER, Id UNIQUEIDENTIFIER);
         INSERT INTO @ukAccounts(Name, UDF, Schedule, Id)
         VALUES (''VAT Payable'', ''VATS01'', ''756023EE-579D-4CCD-8119-21A7B2500737'', NEWID()),
             (''VAT Receivable'', ''VATR01'', ''2C5B4908-5FB8-4780-822B-00AEB1FCDAB3'', NEWID());

         -- Insert UK VAT general accounts (idempotent)
         INSERT INTO ' + QUOTENAME(@schemaName) + '.mstGeneralAccount (
             strGeneralAccountGUID,
             strGroupGUID,
             strGeneralAccountName,
             strUDFCode,
             strAccountTypeGUID,
             strScheduleGUID,
             strDesc,
             bolIsActive,
             bolIsLock,
             strOrganizationGUID,
             strCreatedByGUID,
             dtCreatedOn,
             strUpdatedByGUID,
             dtUpdatedOn
         )
         SELECT a.Id,
                ''' + @useGroupGUID + ''',
                a.Name,
                a.UDF,
                ''14b8e205-398e-4557-b914-40b6a277434b'',
                a.Schedule,
                ''Auto-created UK VAT tax account'',
                1,
                1,
                ''' + CAST(@organizationGUID AS NVARCHAR(50)) + ''',
                ''' + @useGroupGUID + ''',
                GETUTCDATE(),
                NULL,
                GETUTCDATE()
         FROM @ukAccounts a
         WHERE NOT EXISTS (
             SELECT 1 FROM ' + QUOTENAME(@schemaName) + '.mstGeneralAccount g
             WHERE g.strGeneralAccountName = a.Name
               AND g.strOrganizationGUID = ''' + CAST(@organizationGUID AS NVARCHAR(50)) + '''
         );

         -- Insert base mstAccount with same PKs (idempotent)
         INSERT INTO ' + QUOTENAME(@schemaName) + '.mstAccount (
             strAccountGUID,
             strGroupGUID,
             strAccountName,
             strUDFCode,
             strAccountTypeGUID,
             strScheduleGUID,
             strDesc,
             bolIsActive,
             strOrganizationGUID,
             strCreatedByGUID,
             dtCreatedOn,
             strUpdatedByGUID,
             dtUpdatedOn
         )
         SELECT a.Id,
                ''' + @useGroupGUID + ''',
                a.Name,
                a.UDF,
                ''14b8e205-398e-4557-b914-40b6a277434b'',
                a.Schedule,
                ''Auto-created base account for '' + a.Name,
                1,
                ''' + CAST(@organizationGUID AS NVARCHAR(50)) + ''',
                ''' + @useGroupGUID + ''',
                GETUTCDATE(),
                NULL,
                GETUTCDATE()
         FROM @ukAccounts a
         WHERE NOT EXISTS (
             SELECT 1 FROM ' + QUOTENAME(@schemaName) + '.mstAccount acc WHERE acc.strAccountGUID = a.Id
         );

         PRINT ''Inserted/verified UK VAT accounts.'';
    END
    ELSE
    BEGIN
        PRINT ''mstGeneralAccount not present; skipping country-specific UK VAT account inserts.'';
    END';

    EXEC sp_executesql @sql;
END

-- USA Sales Tax-specific account creation (country-specific)
-- Run after all tables are created so mstGeneralAccount is guaranteed to exist
PRINT 'Checking country GUID for USA Sales Tax accounts: Expected 6DCB06EE-ABBC-4B29-8903-D38393CB521A, Got: ' + ISNULL(CAST(@countryGUID AS NVARCHAR(50)), 'NULL');
IF @countryGUID = '6DCB06EE-ABBC-4B29-8903-D38393CB521A'
BEGIN
    PRINT 'Creating Sales Tax accounts for USA...';
    SET @sql = '
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''mstGeneralAccount'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
    BEGIN
         DECLARE @usaAccounts TABLE(Name NVARCHAR(100), UDF NVARCHAR(6), Schedule UNIQUEIDENTIFIER, Id UNIQUEIDENTIFIER);
         INSERT INTO @usaAccounts(Name, UDF, Schedule, Id)
         VALUES (''Sales Tax Payable'', ''STAX01'', ''756023EE-579D-4CCD-8119-21A7B2500737'', NEWID()),
             (''Sales Tax Receivable'', ''STAX02'', ''2C5B4908-5FB8-4780-822B-00AEB1FCDAB3'', NEWID());

         -- Insert USA Sales Tax general accounts (idempotent)
         INSERT INTO ' + QUOTENAME(@schemaName) + '.mstGeneralAccount (
             strGeneralAccountGUID,
             strGroupGUID,
             strGeneralAccountName,
             strUDFCode,
             strAccountTypeGUID,
             strScheduleGUID,
             strDesc,
             bolIsActive,
             bolIsLock,
             strOrganizationGUID,
             strCreatedByGUID,
             dtCreatedOn,
             strUpdatedByGUID,
             dtUpdatedOn
         )
         SELECT a.Id,
                ''' + @useGroupGUID + ''',
                a.Name,
                a.UDF,
                ''14b8e205-398e-4557-b914-40b6a277434b'',
                a.Schedule,
                ''Auto-created USA Sales Tax account'',
                1,
                1,
                ''' + CAST(@organizationGUID AS NVARCHAR(50)) + ''',
                ''' + @useGroupGUID + ''',
                GETUTCDATE(),
                NULL,
                GETUTCDATE()
         FROM @usaAccounts a
         WHERE NOT EXISTS (
             SELECT 1 FROM ' + QUOTENAME(@schemaName) + '.mstGeneralAccount g
             WHERE g.strGeneralAccountName = a.Name
               AND g.strOrganizationGUID = ''' + CAST(@organizationGUID AS NVARCHAR(50)) + '''
         );

         -- Insert base mstAccount with same PKs (idempotent)
         INSERT INTO ' + QUOTENAME(@schemaName) + '.mstAccount (
             strAccountGUID,
             strGroupGUID,
             strAccountName,
             strUDFCode,
             strAccountTypeGUID,
             strScheduleGUID,
             strDesc,
             bolIsActive,
             strOrganizationGUID,
             strCreatedByGUID,
             dtCreatedOn,
             strUpdatedByGUID,
             dtUpdatedOn
         )
         SELECT a.Id,
                ''' + @useGroupGUID + ''',
                a.Name,
                a.UDF,
                ''14b8e205-398e-4557-b914-40b6a277434b'',
                a.Schedule,
                ''Auto-created base account for '' + a.Name,
                1,
                ''' + CAST(@organizationGUID AS NVARCHAR(50)) + ''',
                ''' + @useGroupGUID + ''',
                GETUTCDATE(),
                NULL,
                GETUTCDATE()
         FROM @usaAccounts a
         WHERE NOT EXISTS (
             SELECT 1 FROM ' + QUOTENAME(@schemaName) + '.mstAccount acc WHERE acc.strAccountGUID = a.Id
         );

         PRINT ''Inserted/verified USA Sales Tax accounts.'';
    END
    ELSE
    BEGIN
        PRINT ''mstGeneralAccount not present; skipping country-specific USA Sales Tax account inserts.'';
    END';

    EXEC sp_executesql @sql;
END

-- Non-country specific Trade Discount account creation (idempotent)
SET @sql = N'
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''mstGeneralAccount'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM ' + QUOTENAME(@schemaName) + '.mstGeneralAccount
        WHERE strGeneralAccountName = ''Trade Discount''
          AND strOrganizationGUID = ''' + CAST(@organizationGUID AS NVARCHAR(50)) + '''
    )
    BEGIN
        DECLARE @tradeId UNIQUEIDENTIFIER;
        SET @tradeId = NEWID();
        INSERT INTO ' + QUOTENAME(@schemaName) + '.mstGeneralAccount (
            strGeneralAccountGUID,
            strGroupGUID,
            strGeneralAccountName,
            strUDFCode,
            strAccountTypeGUID,
            strScheduleGUID,
            strDesc,
            bolIsActive,
            bolIsLock,
            strOrganizationGUID,
            strCreatedByGUID,
            dtCreatedOn,
            strUpdatedByGUID,
            dtUpdatedOn
        )
        VALUES (
            @tradeId,
            ''' + @useGroupGUID + ''',
            ''Trade Discount'',
            ''TRDISC'',
            ''14b8e205-398e-4557-b914-40b6a277434b'',
            ''6a7eb824-71f9-4904-b09e-c2f8e9fae92c'',
            ''Auto-created Trade Discount account'',
            1,
            1,
            ''' + CAST(@organizationGUID AS NVARCHAR(50)) + ''',
            ''' + @useGroupGUID + ''',
            GETUTCDATE(),
            NULL,
            GETUTCDATE()
        );
        -- Matching base mstAccount with the same PK
        IF NOT EXISTS (
            SELECT 1 FROM ' + QUOTENAME(@schemaName) + '.mstAccount WHERE strAccountGUID = @tradeId
        )
        BEGIN
            INSERT INTO ' + QUOTENAME(@schemaName) + '.mstAccount (
                strAccountGUID,
                strGroupGUID,
                strAccountName,
                strUDFCode,
                strAccountTypeGUID,
                strScheduleGUID,
                strDesc,
                bolIsActive,
                strOrganizationGUID,
                strCreatedByGUID,
                dtCreatedOn,
                strUpdatedByGUID,
                dtUpdatedOn
            )
            VALUES (
                @tradeId,
                ''' + @useGroupGUID + ''',
                ''Trade Discount'',
                ''TRDISC'',
                ''14b8e205-398e-4557-b914-40b6a277434b'',
                ''6a7eb824-71f9-4904-b09e-c2f8e9fae92c'',
                ''Auto-created base account for Trade Discount'',
                1,
                ''' + CAST(@organizationGUID AS NVARCHAR(50)) + ''',
                ''' + @useGroupGUID + ''',
                GETUTCDATE(),
                NULL,
                GETUTCDATE()
            );
            PRINT ''Inserted base mstAccount: Trade Discount'';
        END
        PRINT ''Inserted non-country Trade Discount account.'';
    END
    ELSE
    BEGIN
        PRINT ''Trade Discount account already exists; skipping.'';
    END
END
ELSE
BEGIN
    PRINT ''mstGeneralAccount not present; skipping Trade Discount account insert.'';
END
';
EXEC sp_executesql @sql;

-- UAE VAT-specific account creation (country-specific)
-- Run after all tables are created so mstGeneralAccount is guaranteed to exist
PRINT 'Checking country GUID for UAE VAT accounts: Expected 88A66D3E-E705-403F-9AF0-BBCE015F1BB4, Got: ' + ISNULL(CAST(@countryGUID AS NVARCHAR(50)), 'NULL');
IF @countryGUID = '88A66D3E-E705-403F-9AF0-BBCE015F1BB4'
BEGIN
    PRINT 'Creating VAT accounts for UAE...';
    SET @sql = '
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = ''mstGeneralAccount'' AND schema_id = SCHEMA_ID(''' + @schemaName + '''))
    BEGIN
         DECLARE @uaeAccounts TABLE(Name NVARCHAR(100), UDF NVARCHAR(6), Schedule UNIQUEIDENTIFIER, Id UNIQUEIDENTIFIER);
         INSERT INTO @uaeAccounts(Name, UDF, Schedule, Id)
         VALUES (''VAT Payable'', ''VATS01'', ''756023EE-579D-4CCD-8119-21A7B2500737'', NEWID()),
             (''VAT Receivable'', ''VATR01'', ''2C5B4908-5FB8-4780-822B-00AEB1FCDAB3'', NEWID());

         -- Insert UAE VAT general accounts (idempotent)
         INSERT INTO ' + QUOTENAME(@schemaName) + '.mstGeneralAccount (
             strGeneralAccountGUID,
             strGroupGUID,
             strGeneralAccountName,
             strUDFCode,
             strAccountTypeGUID,
             strScheduleGUID,
             strDesc,
             bolIsActive,
             bolIsLock,
             strOrganizationGUID,
             strCreatedByGUID,
             dtCreatedOn,
             strUpdatedByGUID,
             dtUpdatedOn
         )
         SELECT a.Id,
                ''' + @useGroupGUID + ''',
                a.Name,
                a.UDF,
                ''14b8e205-398e-4557-b914-40b6a277434b'',
                a.Schedule,
                ''Auto-created UAE VAT tax account'',
                1,
                1,
                ''' + CAST(@organizationGUID AS NVARCHAR(50)) + ''',
                ''' + @useGroupGUID + ''',
                GETUTCDATE(),
                NULL,
                GETUTCDATE()
         FROM @uaeAccounts a
         WHERE NOT EXISTS (
             SELECT 1 FROM ' + QUOTENAME(@schemaName) + '.mstGeneralAccount g
             WHERE g.strGeneralAccountName = a.Name
               AND g.strOrganizationGUID = ''' + CAST(@organizationGUID AS NVARCHAR(50)) + '''
         );

         -- Insert base mstAccount with same PKs (idempotent)
         INSERT INTO ' + QUOTENAME(@schemaName) + '.mstAccount (
             strAccountGUID,
             strGroupGUID,
             strAccountName,
             strUDFCode,
             strAccountTypeGUID,
             strScheduleGUID,
             strDesc,
             bolIsActive,
             strOrganizationGUID,
             strCreatedByGUID,
             dtCreatedOn,
             strUpdatedByGUID,
             dtUpdatedOn
         )
         SELECT a.Id,
                ''' + @useGroupGUID + ''',
                a.Name,
                a.UDF,
                ''14b8e205-398e-4557-b914-40b6a277434b'',
                a.Schedule,
                ''Auto-created base account for '' + a.Name,
                1,
                ''' + CAST(@organizationGUID AS NVARCHAR(50)) + ''',
                ''' + @useGroupGUID + ''',
                GETUTCDATE(),
                NULL,
                GETUTCDATE()
         FROM @uaeAccounts a
         WHERE NOT EXISTS (
             SELECT 1 FROM ' + QUOTENAME(@schemaName) + '.mstAccount acc WHERE acc.strAccountGUID = a.Id
         );

         PRINT ''Inserted/verified UAE VAT accounts.'';
    END
    ELSE
    BEGIN
        PRINT ''mstGeneralAccount not present; skipping country-specific UAE VAT account inserts.'';
    END';

    EXEC sp_executesql @sql;
END


-- Self-healing step: Update any existing mstAccount records that have NULL UDFCode but exist in mstGeneralAccount
-- This fixes the issue for users who already ran the script when the logic inserted NULLs.
SET @sql = N'
    UPDATE acc
    SET strUDFCode = gen.strUDFCode
    FROM ' + QUOTENAME(@schemaName) + '.mstAccount acc
    INNER JOIN ' + QUOTENAME(@schemaName) + '.mstGeneralAccount gen ON acc.strAccountGUID = gen.strGeneralAccountGUID
    WHERE acc.strUDFCode IS NULL AND gen.strUDFCode IS NOT NULL;
    
    PRINT ''Self-healing: Updated NULL UDFCodes in mstAccount from mstGeneralAccount.'';
';
EXEC sp_executesql @sql;
