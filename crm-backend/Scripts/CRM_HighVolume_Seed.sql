/*
CRM High-Volume Seed Script (Lakhs Scale)
-----------------------------------------
Run with sqlcmd (recommended) so variable substitution works.

Example:
docker exec crm-sql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'Darshak@5804' -C \
  -d CRM_444e21822d444e8899373db8009a7f88 \
  -i /work/CRM_HighVolume_Seed.sql

Notes:
- Script appends data; it does not delete existing records.
- Default counts create multi-lakh data across modules.
- Update sqlcmd vars below for your tenant.
*/

:setvar SchemaName "ORG_41a9fef2434e4db8a432955e2f3b24b3"
:setvar GroupGuid "444e2182-2d44-4e88-9937-3db8009a7f88"
:setvar CreatedByGuid "55c15df6-4c20-4eb3-9830-39c28e920a22"

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @SchemaName SYSNAME = '$(SchemaName)';
DECLARE @GroupGUID UNIQUEIDENTIFIER = '$(GroupGuid)';
DECLARE @CreatedByGUID UNIQUEIDENTIFIER = '$(CreatedByGuid)';
DECLARE @Now DATETIME2(7) = SYSUTCDATETIME();

IF SCHEMA_ID(@SchemaName) IS NULL
BEGIN
    THROW 50001, 'Schema not found. Update :setvar SchemaName before running.', 1;
END;

PRINT '=== CRM High-Volume Seed Started ===';
PRINT CONCAT('UTC Time: ', CONVERT(VARCHAR(33), @Now, 126));
PRINT CONCAT('Schema: ', @SchemaName);
PRINT CONCAT('GroupGUID: ', CONVERT(VARCHAR(36), @GroupGUID));
PRINT CONCAT('CreatedByGUID: ', CONVERT(VARCHAR(36), @CreatedByGUID));

/* =========================
   Configure High Volume
   ========================= */
DECLARE @AccountCount INT = 100000;
DECLARE @ContactCount INT = 150000;
DECLARE @LeadCount INT = 200000;
DECLARE @OpportunityCount INT = 120000;
DECLARE @OpportunityContactCount INT = 120000;
DECLARE @ActivityCount INT = 200000;
DECLARE @LeadCommunicationCount INT = 200000;
DECLARE @LeadScoreHistoryCount INT = 180000;
DECLARE @LeadDuplicateCount INT = 40000;
DECLARE @LeadMergeHistoryCount INT = 10000;
DECLARE @AuditLogCount INT = 220000;
DECLARE @WorkflowExecutionCount INT = 100000;
DECLARE @WebFormSubmissionCount INT = 90000;
DECLARE @ImportJobCount INT = 2000;
DECLARE @ImportJobErrorCount INT = 50000;

IF @ContactCount = 0 OR @OpportunityCount = 0 SET @OpportunityContactCount = 0;
IF @LeadCount = 0 SET @LeadCommunicationCount = 0;
IF @LeadCount = 0 SET @LeadScoreHistoryCount = 0;
IF @LeadCount < 2 SET @LeadDuplicateCount = 0;
IF @LeadDuplicateCount = 0 SET @LeadMergeHistoryCount = 0;
IF @LeadCount = 0 SET @WorkflowExecutionCount = 0;
IF @LeadCount = 0 SET @WebFormSubmissionCount = 0;
IF @ImportJobCount = 0 SET @ImportJobErrorCount = 0;
IF @OpportunityContactCount > @OpportunityCount SET @OpportunityContactCount = @OpportunityCount;

DECLARE @MaxN INT = (
    SELECT MAX(V) FROM (VALUES
        (@AccountCount), (@ContactCount), (@LeadCount), (@OpportunityCount), (@OpportunityContactCount),
        (@ActivityCount), (@LeadCommunicationCount), (@LeadScoreHistoryCount), (@LeadDuplicateCount),
        (@AuditLogCount), (@WorkflowExecutionCount), (@WebFormSubmissionCount), (@ImportJobCount),
        (@ImportJobErrorCount), (10)
    ) AS X(V)
);

PRINT CONCAT('Max sequence size: ', @MaxN);

IF OBJECT_ID('tempdb..#N') IS NOT NULL DROP TABLE #N;
SELECT TOP (@MaxN)
    ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
INTO #N
FROM sys.all_objects a
CROSS JOIN sys.all_objects b;

CREATE UNIQUE CLUSTERED INDEX IX_N ON #N(n);

/* =========================
   Pipeline + Stages
   ========================= */
DECLARE @PipelineGUID UNIQUEIDENTIFIER;

SELECT TOP (1)
    @PipelineGUID = strPipelineGUID
FROM [$(SchemaName)].[MstPipelines]
WHERE strGroupGUID = @GroupGUID
  AND ISNULL(bolIsDeleted, 0) = 0
ORDER BY ISNULL(bolIsDefault, 0) DESC, dtCreatedOn DESC;

IF @PipelineGUID IS NULL
BEGIN
    SET @PipelineGUID = NEWID();

    INSERT INTO [$(SchemaName)].[MstPipelines]
    (
        strPipelineGUID, strGroupGUID, strPipelineName, strDescription, bolIsDefault,
        strCreatedByGUID, strUpdatedByGUID, dtCreatedOn, dtUpdatedOn, bolIsActive, bolIsDeleted
    )
    VALUES
    (
        @PipelineGUID, @GroupGUID, 'Enterprise Sales Pipeline', 'Auto-seeded high-volume pipeline', 1,
        @CreatedByGUID, @CreatedByGUID, @Now, @Now, 1, 0
    );
END;

IF NOT EXISTS (SELECT 1 FROM [$(SchemaName)].[MstPipelineStages] WHERE strPipelineGUID = @PipelineGUID)
BEGIN
    INSERT INTO [$(SchemaName)].[MstPipelineStages]
    (
        strStageGUID, strPipelineGUID, strStageName, intDisplayOrder, intProbabilityPercent,
        strRequiredFields, strAllowedTransitions, intDefaultDaysToRot,
        bolIsWonStage, bolIsLostStage, dtCreatedOn, dtUpdatedOn, bolIsActive
    )
    VALUES
    (NEWID(), @PipelineGUID, 'Prospecting',   1,  10, NULL, NULL, 14, 0, 0, @Now, @Now, 1),
    (NEWID(), @PipelineGUID, 'Qualification', 2,  25, NULL, NULL, 21, 0, 0, @Now, @Now, 1),
    (NEWID(), @PipelineGUID, 'Proposal',      3,  50, NULL, NULL, 30, 0, 0, @Now, @Now, 1),
    (NEWID(), @PipelineGUID, 'Negotiation',   4,  75, NULL, NULL, 14, 0, 0, @Now, @Now, 1),
    (NEWID(), @PipelineGUID, 'Closed Won',    5, 100, NULL, NULL,  0, 1, 0, @Now, @Now, 1),
    (NEWID(), @PipelineGUID, 'Closed Lost',   6,   0, NULL, NULL,  0, 0, 1, @Now, @Now, 1);
END;

IF OBJECT_ID('tempdb..#StageMap') IS NOT NULL DROP TABLE #StageMap;
SELECT
    ROW_NUMBER() OVER (ORDER BY intDisplayOrder, strStageGUID) AS rn,
    strStageGUID,
    strStageName,
    intProbabilityPercent
INTO #StageMap
FROM [$(SchemaName)].[MstPipelineStages]
WHERE strPipelineGUID = @PipelineGUID
  AND ISNULL(bolIsActive, 1) = 1;

DECLARE @StageCount INT = (SELECT COUNT(*) FROM #StageMap);
IF @StageCount = 0
BEGIN
    THROW 50002, 'No pipeline stages found after pipeline setup.', 1;
END;

/* =========================
   Seed maps
   ========================= */
IF OBJECT_ID('tempdb..#SeedAccounts') IS NOT NULL DROP TABLE #SeedAccounts;
CREATE TABLE #SeedAccounts
(
    rn INT NOT NULL PRIMARY KEY,
    strAccountGUID UNIQUEIDENTIFIER NOT NULL
);

IF OBJECT_ID('tempdb..#SeedContacts') IS NOT NULL DROP TABLE #SeedContacts;
CREATE TABLE #SeedContacts
(
    rn INT NOT NULL PRIMARY KEY,
    strContactGUID UNIQUEIDENTIFIER NOT NULL,
    account_rn INT NULL
);

IF OBJECT_ID('tempdb..#SeedLeads') IS NOT NULL DROP TABLE #SeedLeads;
CREATE TABLE #SeedLeads
(
    rn INT NOT NULL PRIMARY KEY,
    strLeadGUID UNIQUEIDENTIFIER NOT NULL
);

IF OBJECT_ID('tempdb..#SeedOpportunities') IS NOT NULL DROP TABLE #SeedOpportunities;
CREATE TABLE #SeedOpportunities
(
    rn INT NOT NULL PRIMARY KEY,
    strOpportunityGUID UNIQUEIDENTIFIER NOT NULL,
    account_rn INT NULL,
    stage_rn INT NOT NULL
);

IF OBJECT_ID('tempdb..#SeedActivities') IS NOT NULL DROP TABLE #SeedActivities;
CREATE TABLE #SeedActivities
(
    rn INT NOT NULL PRIMARY KEY,
    strActivityGUID UNIQUEIDENTIFIER NOT NULL,
    strEntityType NVARCHAR(50) NOT NULL
);

/* =========================
   Accounts
   ========================= */
IF @AccountCount > 0
BEGIN
    INSERT INTO #SeedAccounts(rn, strAccountGUID)
    SELECT n, NEWID()
    FROM #N
    WHERE n <= @AccountCount;

    INSERT INTO [$(SchemaName)].[MstAccounts]
    (
        strAccountGUID, strGroupGUID, strAccountName, strIndustry, strWebsite, strPhone, strEmail,
        intEmployeeCount, dblAnnualRevenue, strAddress, strCity, strState, strCountry, strPostalCode,
        strDescription, strAssignedToGUID, strCreatedByGUID, strUpdatedByGUID, dtCreatedOn, dtUpdatedOn,
        bolIsActive, bolIsDeleted
    )
    SELECT
        a.strAccountGUID,
        @GroupGUID,
        CONCAT('Account ', a.rn),
        CASE a.rn % 6
            WHEN 0 THEN 'Technology'
            WHEN 1 THEN 'Finance'
            WHEN 2 THEN 'Manufacturing'
            WHEN 3 THEN 'Healthcare'
            WHEN 4 THEN 'Retail'
            ELSE 'Education'
        END,
        CONCAT('https://account', a.rn, '.example.com'),
        CONCAT('+1-555-', RIGHT(CONCAT('0000000', a.rn), 7)),
        CONCAT('account', a.rn, '@example.com'),
        10 + (a.rn % 5000),
        CAST(50000 + (a.rn * 31 % 9000000) AS DECIMAL(18,2)),
        CONCAT('Address ', a.rn),
        CONCAT('City ', a.rn % 300),
        CONCAT('State ', a.rn % 50),
        'USA',
        RIGHT(CONCAT('00000', a.rn % 99999), 5),
        CONCAT('Seeded enterprise account #', a.rn),
        NULL,
        @CreatedByGUID,
        @CreatedByGUID,
        DATEADD(MINUTE, -1 * (a.rn % 700000), @Now),
        DATEADD(MINUTE, -1 * (a.rn % 400000), @Now),
        1,
        0
    FROM #SeedAccounts a;
END;

/* =========================
   Contacts
   ========================= */
IF @ContactCount > 0
BEGIN
    INSERT INTO #SeedContacts(rn, strContactGUID, account_rn)
    SELECT
        n,
        NEWID(),
        CASE WHEN @AccountCount > 0 THEN ((n - 1) % @AccountCount) + 1 ELSE NULL END
    FROM #N
    WHERE n <= @ContactCount;

    INSERT INTO [$(SchemaName)].[MstContacts]
    (
        strContactGUID, strGroupGUID, strAccountGUID, strFirstName, strLastName, strEmail, strPhone,
        strMobilePhone, strJobTitle, strDepartment, strLifecycleStage, strAddress, strCity, strState,
        strCountry, strPostalCode, strNotes, dtLastContactedOn, strAssignedToGUID, strCreatedByGUID,
        strUpdatedByGUID, dtCreatedOn, dtUpdatedOn, bolIsActive, bolIsDeleted
    )
    SELECT
        c.strContactGUID,
        @GroupGUID,
        a.strAccountGUID,
        CONCAT('First', c.rn),
        CONCAT('Last', c.rn),
        CONCAT('contact', c.rn, '@example.com'),
        CONCAT('+1-404-', RIGHT(CONCAT('0000000', c.rn), 7)),
        CONCAT('+1-909-', RIGHT(CONCAT('0000000', c.rn), 7)),
        CONCAT('Manager ', c.rn % 300),
        CASE c.rn % 5
            WHEN 0 THEN 'Sales'
            WHEN 1 THEN 'Marketing'
            WHEN 2 THEN 'Operations'
            WHEN 3 THEN 'Finance'
            ELSE 'IT'
        END,
        CASE c.rn % 6
            WHEN 0 THEN 'Subscriber'
            WHEN 1 THEN 'Lead'
            WHEN 2 THEN 'MQL'
            WHEN 3 THEN 'SQL'
            WHEN 4 THEN 'Opportunity'
            ELSE 'Customer'
        END,
        CONCAT('Contact Address ', c.rn),
        CONCAT('City ', c.rn % 300),
        CONCAT('State ', c.rn % 50),
        'USA',
        RIGHT(CONCAT('00000', c.rn % 99999), 5),
        CONCAT('Seeded contact note #', c.rn),
        DATEADD(DAY, -1 * (c.rn % 180), @Now),
        NULL,
        @CreatedByGUID,
        @CreatedByGUID,
        DATEADD(MINUTE, -1 * (c.rn % 700000), @Now),
        DATEADD(MINUTE, -1 * (c.rn % 350000), @Now),
        1,
        0
    FROM #SeedContacts c
    LEFT JOIN #SeedAccounts a ON a.rn = c.account_rn;
END;

/* =========================
   Leads
   ========================= */
IF @LeadCount > 0
BEGIN
    INSERT INTO #SeedLeads(rn, strLeadGUID)
    SELECT n, NEWID()
    FROM #N
    WHERE n <= @LeadCount;

    INSERT INTO [$(SchemaName)].[MstLeads]
    (
        strLeadGUID, strGroupGUID, strFirstName, strLastName, strEmail, strPhone, strCompanyName,
        strJobTitle, strSource, strStatus, intLeadScore, strAddress, strCity, strState, strCountry,
        strPostalCode, strNotes, strAssignedToGUID, strCreatedByGUID, strUpdatedByGUID, dtCreatedOn,
        dtUpdatedOn, bolIsActive, bolIsDeleted
    )
    SELECT
        l.strLeadGUID,
        @GroupGUID,
        CONCAT('LeadFirst', l.rn),
        CONCAT('LeadLast', l.rn),
        CONCAT('lead', l.rn, '@example.com'),
        CONCAT('+1-303-', RIGHT(CONCAT('0000000', l.rn), 7)),
        CONCAT('Lead Company ', l.rn % 50000),
        CONCAT('Title ', l.rn % 200),
        CASE l.rn % 7
            WHEN 0 THEN 'Website'
            WHEN 1 THEN 'Referral'
            WHEN 2 THEN 'LinkedIn'
            WHEN 3 THEN 'ColdCall'
            WHEN 4 THEN 'Advertisement'
            WHEN 5 THEN 'TradeShow'
            ELSE 'Other'
        END,
        CASE l.rn % 5
            WHEN 0 THEN 'New'
            WHEN 1 THEN 'Contacted'
            WHEN 2 THEN 'Qualified'
            WHEN 3 THEN 'Unqualified'
            ELSE 'Converted'
        END,
        l.rn % 101,
        CONCAT('Lead Address ', l.rn),
        CONCAT('City ', l.rn % 300),
        CONCAT('State ', l.rn % 50),
        'USA',
        RIGHT(CONCAT('00000', l.rn % 99999), 5),
        CONCAT('Seeded lead note #', l.rn),
        NULL,
        @CreatedByGUID,
        @CreatedByGUID,
        DATEADD(MINUTE, -1 * (l.rn % 700000), @Now),
        DATEADD(MINUTE, -1 * (l.rn % 300000), @Now),
        1,
        0
    FROM #SeedLeads l;
END;

/* =========================
   Opportunities
   ========================= */
IF @OpportunityCount > 0
BEGIN
    INSERT INTO #SeedOpportunities(rn, strOpportunityGUID, account_rn, stage_rn)
    SELECT
        n,
        NEWID(),
        CASE WHEN @AccountCount > 0 THEN ((n - 1) % @AccountCount) + 1 ELSE NULL END,
        ((n - 1) % @StageCount) + 1
    FROM #N
    WHERE n <= @OpportunityCount;

    INSERT INTO [$(SchemaName)].[MstOpportunities]
    (
        strOpportunityGUID, strGroupGUID, strAccountGUID, strPipelineGUID, strStageGUID, strOpportunityName,
        dblAmount, strCurrency, intProbability, strStatus, dtExpectedCloseDate, dtActualCloseDate, strLossReason,
        strDescription, dtStageEnteredOn, dtLastActivityOn, strAssignedToGUID, strCreatedByGUID, strUpdatedByGUID,
        dtCreatedOn, dtUpdatedOn, bolIsActive, bolIsDeleted
    )
    SELECT
        o.strOpportunityGUID,
        @GroupGUID,
        a.strAccountGUID,
        @PipelineGUID,
        s.strStageGUID,
        CONCAT('Opportunity ', o.rn),
        CAST(1000 + (o.rn * 97 % 1000000) AS DECIMAL(18,2)),
        'USD',
        s.intProbabilityPercent,
        CASE
            WHEN s.strStageName = 'Closed Won' THEN 'Won'
            WHEN s.strStageName = 'Closed Lost' THEN 'Lost'
            ELSE 'Open'
        END,
        DATEADD(DAY, (o.rn % 120) + 5, @Now),
        CASE
            WHEN s.strStageName IN ('Closed Won', 'Closed Lost') THEN DATEADD(DAY, -1 * (o.rn % 90), @Now)
            ELSE NULL
        END,
        CASE WHEN s.strStageName = 'Closed Lost' THEN 'Budget constraints' ELSE NULL END,
        CONCAT('Seeded opportunity #', o.rn),
        DATEADD(DAY, -1 * (o.rn % 45), @Now),
        DATEADD(DAY, -1 * (o.rn % 20), @Now),
        NULL,
        @CreatedByGUID,
        @CreatedByGUID,
        DATEADD(MINUTE, -1 * (o.rn % 700000), @Now),
        DATEADD(MINUTE, -1 * (o.rn % 280000), @Now),
        1,
        0
    FROM #SeedOpportunities o
    JOIN #StageMap s ON s.rn = o.stage_rn
    LEFT JOIN #SeedAccounts a ON a.rn = o.account_rn;
END;

/* =========================
   Opportunity Contacts
   ========================= */
IF @OpportunityContactCount > 0
BEGIN
    INSERT INTO [$(SchemaName)].[MstOpportunityContacts]
    (
        strOpportunityContactGUID, strOpportunityGUID, strContactGUID, strRole, bolIsPrimary, dtCreatedOn
    )
    SELECT
        NEWID(),
        o.strOpportunityGUID,
        c.strContactGUID,
        CASE o.rn % 4
            WHEN 0 THEN 'Decision Maker'
            WHEN 1 THEN 'Influencer'
            WHEN 2 THEN 'Stakeholder'
            ELSE 'Technical Evaluator'
        END,
        CASE WHEN o.rn % 7 = 0 THEN 1 ELSE 0 END,
        DATEADD(DAY, -1 * (o.rn % 120), @Now)
    FROM #SeedOpportunities o
    JOIN #SeedContacts c
        ON c.rn = ((o.rn - 1) % NULLIF(@ContactCount, 0)) + 1
    WHERE o.rn <= @OpportunityContactCount;
END;

/* =========================
   Activities + Activity Links
   ========================= */
IF @ActivityCount > 0
BEGIN
    INSERT INTO #SeedActivities(rn, strActivityGUID, strEntityType)
    SELECT
        n,
        NEWID(),
        CASE n % 3 WHEN 0 THEN 'Lead' WHEN 1 THEN 'Contact' ELSE 'Opportunity' END
    FROM #N
    WHERE n <= @ActivityCount;

    INSERT INTO [$(SchemaName)].[MstActivities]
    (
        strActivityGUID, strGroupGUID, strActivityType, strSubject, strDescription,
        dtScheduledStart, dtScheduledEnd, dtActualStart, dtActualEnd, strLocation, strOutcome,
        strAssignedToGUID, strCreatedByGUID, strUpdatedByGUID, dtCreatedOn, dtUpdatedOn, bolIsActive
    )
    SELECT
        a.strActivityGUID,
        @GroupGUID,
        CASE a.rn % 6
            WHEN 0 THEN 'Call'
            WHEN 1 THEN 'Email'
            WHEN 2 THEN 'Meeting'
            WHEN 3 THEN 'Note'
            WHEN 4 THEN 'Task'
            ELSE 'FollowUp'
        END,
        CONCAT('Activity Subject ', a.rn),
        CONCAT('Seeded activity detail #', a.rn),
        DATEADD(HOUR, -1 * (a.rn % 2400), @Now),
        DATEADD(HOUR, -1 * (a.rn % 2400) + 1, @Now),
        CASE WHEN a.rn % 2 = 0 THEN DATEADD(HOUR, -1 * (a.rn % 2400), @Now) ELSE NULL END,
        CASE WHEN a.rn % 2 = 0 THEN DATEADD(HOUR, -1 * (a.rn % 2400) + 1, @Now) ELSE NULL END,
        CONCAT('Location ', a.rn % 400),
        CASE WHEN a.rn % 2 = 0 THEN 'Completed' ELSE NULL END,
        NULL,
        @CreatedByGUID,
        @CreatedByGUID,
        DATEADD(MINUTE, -1 * (a.rn % 700000), @Now),
        DATEADD(MINUTE, -1 * (a.rn % 350000), @Now),
        1
    FROM #SeedActivities a;

    INSERT INTO [$(SchemaName)].[MstActivityLinks]
    (
        strActivityLinkGUID, strActivityGUID, strEntityType, strEntityGUID, dtCreatedOn
    )
    SELECT
        NEWID(),
        a.strActivityGUID,
        a.strEntityType,
        CASE a.strEntityType
            WHEN 'Lead' THEN l.strLeadGUID
            WHEN 'Contact' THEN c.strContactGUID
            ELSE o.strOpportunityGUID
        END,
        DATEADD(MINUTE, -1 * (a.rn % 700000), @Now)
    FROM #SeedActivities a
    LEFT JOIN #SeedLeads l
        ON a.strEntityType = 'Lead'
       AND l.rn = ((a.rn - 1) % NULLIF(@LeadCount, 0)) + 1
    LEFT JOIN #SeedContacts c
        ON a.strEntityType = 'Contact'
       AND c.rn = ((a.rn - 1) % NULLIF(@ContactCount, 0)) + 1
    LEFT JOIN #SeedOpportunities o
        ON a.strEntityType = 'Opportunity'
       AND o.rn = ((a.rn - 1) % NULLIF(@OpportunityCount, 0)) + 1;
END;

/* =========================
   Lead Communications
   ========================= */
IF @LeadCommunicationCount > 0
BEGIN
    INSERT INTO [$(SchemaName)].[MstLeadCommunications]
    (
        strCommunicationGUID, strGroupGUID, strLeadGUID, strChannelType, strDirection, strSubject, strBody,
        strFromAddress, strToAddress, intDurationSeconds, strCallOutcome, strRecordingUrl, bolIsOpened, dtOpenedOn,
        intClickCount, strExternalMessageId, strTrackingPixelGUID, dtCreatedOn
    )
    SELECT
        NEWID(),
        @GroupGUID,
        l.strLeadGUID,
        CASE n.n % 4
            WHEN 0 THEN 'Email'
            WHEN 1 THEN 'Call'
            WHEN 2 THEN 'WhatsApp'
            ELSE 'SMS'
        END,
        CASE WHEN n.n % 2 = 0 THEN 'Outbound' ELSE 'Inbound' END,
        CONCAT('Communication ', n.n),
        CONCAT('Seeded communication body #', n.n),
        'noreply@example.com',
        CONCAT('lead', l.rn, '@example.com'),
        CASE WHEN n.n % 4 = 1 THEN 60 + (n.n % 1800) ELSE NULL END,
        CASE WHEN n.n % 4 = 1 THEN 'Connected' ELSE NULL END,
        CASE WHEN n.n % 4 = 1 THEN CONCAT('https://recordings.example.com/', n.n) ELSE NULL END,
        CASE WHEN n.n % 3 = 0 THEN 1 ELSE 0 END,
        CASE WHEN n.n % 3 = 0 THEN DATEADD(DAY, -1 * (n.n % 30), @Now) ELSE NULL END,
        n.n % 5,
        CONCAT('MSG-', n.n),
        CASE WHEN n.n % 4 = 0 THEN NEWID() ELSE NULL END,
        DATEADD(MINUTE, -1 * (n.n % 700000), @Now)
    FROM #N n
    JOIN #SeedLeads l
      ON l.rn = ((n.n - 1) % NULLIF(@LeadCount, 0)) + 1
    WHERE n.n <= @LeadCommunicationCount;
END;

/* =========================
   Lead Scoring Rules + History
   ========================= */
IF OBJECT_ID('tempdb..#SeedScoringRules') IS NOT NULL DROP TABLE #SeedScoringRules;
CREATE TABLE #SeedScoringRules
(
    rn INT NOT NULL PRIMARY KEY,
    strScoringRuleGUID UNIQUEIDENTIFIER NOT NULL
);

INSERT INTO #SeedScoringRules(rn, strScoringRuleGUID)
VALUES
(1, NEWID()), (2, NEWID()), (3, NEWID()), (4, NEWID()),
(5, NEWID()), (6, NEWID()), (7, NEWID()), (8, NEWID());

INSERT INTO [$(SchemaName)].[MstLeadScoringRules]
(
    strScoringRuleGUID, strGroupGUID, strRuleName, strRuleCategory, strConditionField, strConditionOperator,
    strConditionValue, intScoreChange, strCreatedByGUID, strUpdatedByGUID, dtCreatedOn, dtUpdatedOn, bolIsActive, bolIsDeleted
)
SELECT
    r.strScoringRuleGUID,
    @GroupGUID,
    CONCAT('Auto Score Rule ', r.rn),
    CASE r.rn % 4
        WHEN 0 THEN 'Profile'
        WHEN 1 THEN 'Behavioral'
        WHEN 2 THEN 'Decay'
        ELSE 'Negative'
    END,
    CASE r.rn % 4
        WHEN 0 THEN 'strSource'
        WHEN 1 THEN 'strStatus'
        WHEN 2 THEN 'intLeadScore'
        ELSE 'strEmail'
    END,
    CASE r.rn % 3 WHEN 0 THEN 'Equals' WHEN 1 THEN 'Contains' ELSE 'GreaterThan' END,
    CASE r.rn % 4
        WHEN 0 THEN 'Website'
        WHEN 1 THEN 'Qualified'
        WHEN 2 THEN '60'
        ELSE '@example.com'
    END,
    CASE WHEN r.rn % 4 = 3 THEN -5 ELSE 5 + r.rn END,
    @CreatedByGUID,
    @CreatedByGUID,
    DATEADD(DAY, -1 * (r.rn * 3), @Now),
    DATEADD(DAY, -1 * (r.rn * 2), @Now),
    1,
    0
FROM #SeedScoringRules r;

IF @LeadScoreHistoryCount > 0
BEGIN
    INSERT INTO [$(SchemaName)].[MstLeadScoreHistory]
    (
        strScoreHistoryGUID, strGroupGUID, strLeadGUID, strScoringRuleGUID, intOldScore, intNewScore, intScoreChange,
        strChangeReason, dtCreatedOn
    )
    SELECT
        NEWID(),
        @GroupGUID,
        l.strLeadGUID,
        r.strScoringRuleGUID,
        (n.n % 90),
        (n.n % 90) + CASE WHEN n.n % 5 = 0 THEN -5 ELSE 8 END,
        CASE WHEN n.n % 5 = 0 THEN -5 ELSE 8 END,
        CONCAT('Auto score recalculation #', n.n),
        DATEADD(MINUTE, -1 * (n.n % 700000), @Now)
    FROM #N n
    JOIN #SeedLeads l
      ON l.rn = ((n.n - 1) % NULLIF(@LeadCount, 0)) + 1
    JOIN #SeedScoringRules r
      ON r.rn = ((n.n - 1) % 8) + 1
    WHERE n.n <= @LeadScoreHistoryCount;
END;

/* =========================
   Lead Assignment Rules + Members
   ========================= */
IF OBJECT_ID('tempdb..#SeedAssignmentRules') IS NOT NULL DROP TABLE #SeedAssignmentRules;
CREATE TABLE #SeedAssignmentRules
(
    rn INT NOT NULL PRIMARY KEY,
    strAssignmentRuleGUID UNIQUEIDENTIFIER NOT NULL
);

INSERT INTO #SeedAssignmentRules(rn, strAssignmentRuleGUID)
VALUES (1, NEWID()), (2, NEWID()), (3, NEWID()), (4, NEWID());

INSERT INTO [$(SchemaName)].[MstLeadAssignmentRules]
(
    strAssignmentRuleGUID, strGroupGUID, strRuleName, strAssignmentType, strCriteria, intPriority,
    strCreatedByGUID, strUpdatedByGUID, dtCreatedOn, dtUpdatedOn, bolIsActive, bolIsDeleted
)
SELECT
    r.strAssignmentRuleGUID,
    @GroupGUID,
    CONCAT('Assignment Rule ', r.rn),
    CASE r.rn
        WHEN 1 THEN 'RoundRobin'
        WHEN 2 THEN 'Territory'
        WHEN 3 THEN 'Capacity'
        ELSE 'SkillBased'
    END,
    CONCAT('{"region":"', CASE r.rn WHEN 1 THEN 'North' WHEN 2 THEN 'South' WHEN 3 THEN 'West' ELSE 'Global' END, '"}'),
    r.rn,
    @CreatedByGUID,
    @CreatedByGUID,
    DATEADD(DAY, -1 * (r.rn * 5), @Now),
    DATEADD(DAY, -1 * (r.rn * 2), @Now),
    1,
    0
FROM #SeedAssignmentRules r;

INSERT INTO [$(SchemaName)].[MstLeadAssignmentMembers]
(
    strAssignmentMemberGUID, strGroupGUID, strAssignmentRuleGUID, strUserGUID, intCapacityPercentage,
    intCurrentLoad, strSkillLevel, dtCreatedOn, bolIsActive
)
SELECT
    NEWID(),
    @GroupGUID,
    r.strAssignmentRuleGUID,
    @CreatedByGUID,
    100,
    0,
    CASE r.rn % 3 WHEN 0 THEN 'Senior' WHEN 1 THEN 'Mid' ELSE 'Junior' END,
    DATEADD(DAY, -1 * (r.rn * 4), @Now),
    1
FROM #SeedAssignmentRules r;

/* =========================
   Lead Duplicates + Merge History
   ========================= */
IF @LeadDuplicateCount > 0
BEGIN
    INSERT INTO [$(SchemaName)].[MstLeadDuplicates]
    (
        strDuplicateGUID, strGroupGUID, strLeadGUID1, strLeadGUID2, strMatchType, dblConfidenceScore,
        strStatus, strResolvedByGUID, dtResolvedOn, dtCreatedOn
    )
    SELECT
        NEWID(),
        @GroupGUID,
        l1.strLeadGUID,
        l2.strLeadGUID,
        CASE n.n % 3 WHEN 0 THEN 'Email' WHEN 1 THEN 'Phone' ELSE 'Name' END,
        CAST(70 + (n.n % 31) AS DECIMAL(5,2)),
        CASE n.n % 4 WHEN 0 THEN 'Pending' WHEN 1 THEN 'Confirmed' WHEN 2 THEN 'Dismissed' ELSE 'Merged' END,
        CASE WHEN n.n % 4 IN (1,2,3) THEN @CreatedByGUID ELSE NULL END,
        CASE WHEN n.n % 4 IN (1,2,3) THEN DATEADD(DAY, -1 * (n.n % 60), @Now) ELSE NULL END,
        DATEADD(DAY, -1 * (n.n % 120), @Now)
    FROM #N n
    JOIN #SeedLeads l1
      ON l1.rn = ((n.n - 1) % NULLIF(@LeadCount, 0)) + 1
    JOIN #SeedLeads l2
      ON l2.rn = CASE WHEN l1.rn = @LeadCount THEN 1 ELSE l1.rn + 1 END
    WHERE n.n <= @LeadDuplicateCount;
END;

IF @LeadMergeHistoryCount > 0
BEGIN
    INSERT INTO [$(SchemaName)].[MstLeadMergeHistory]
    (
        strMergeHistoryGUID, strGroupGUID, strSurvivorLeadGUID, strMergedLeadsJson, strMergedByGUID, dtMergedOn
    )
    SELECT TOP (@LeadMergeHistoryCount)
        NEWID(),
        @GroupGUID,
        d.strLeadGUID1,
        CONCAT('["', CONVERT(VARCHAR(36), d.strLeadGUID1), '","', CONVERT(VARCHAR(36), d.strLeadGUID2), '"]'),
        @CreatedByGUID,
        DATEADD(DAY, -1 * (ROW_NUMBER() OVER (ORDER BY d.dtCreatedOn) % 120), @Now)
    FROM [$(SchemaName)].[MstLeadDuplicates] d
    WHERE d.strGroupGUID = @GroupGUID
    ORDER BY d.dtCreatedOn;
END;

/* =========================
   Workflow Rules + Executions
   ========================= */
IF OBJECT_ID('tempdb..#SeedWorkflowRules') IS NOT NULL DROP TABLE #SeedWorkflowRules;
CREATE TABLE #SeedWorkflowRules
(
    rn INT NOT NULL PRIMARY KEY,
    strWorkflowRuleGUID UNIQUEIDENTIFIER NOT NULL
);

INSERT INTO #SeedWorkflowRules(rn, strWorkflowRuleGUID)
VALUES (1, NEWID()), (2, NEWID()), (3, NEWID()), (4, NEWID());

INSERT INTO [$(SchemaName)].[MstWorkflowRules]
(
    strWorkflowRuleGUID, strGroupGUID, strRuleName, strEntityType, strTriggerEvent, strConditions,
    strActionType, strActionConfig, intExecutionOrder, strCreatedByGUID, strUpdatedByGUID, dtCreatedOn,
    dtUpdatedOn, bolIsActive, bolIsDeleted
)
SELECT
    w.strWorkflowRuleGUID,
    @GroupGUID,
    CONCAT('Workflow Rule ', w.rn),
    'Lead',
    CASE w.rn % 4 WHEN 0 THEN 'StatusChanged' WHEN 1 THEN 'Created' WHEN 2 THEN 'ScoreChanged' ELSE 'Aging' END,
    CONCAT('{"status":"', CASE w.rn % 2 WHEN 0 THEN 'Qualified' ELSE 'Contacted' END, '"}'),
    CASE w.rn % 4 WHEN 0 THEN 'CreateTask' WHEN 1 THEN 'SendNotification' WHEN 2 THEN 'ChangeStatus' ELSE 'Archive' END,
    '{"notify":"sales-team@example.com"}',
    w.rn,
    @CreatedByGUID,
    @CreatedByGUID,
    DATEADD(DAY, -1 * (w.rn * 6), @Now),
    DATEADD(DAY, -1 * (w.rn * 2), @Now),
    1,
    0
FROM #SeedWorkflowRules w;

IF @WorkflowExecutionCount > 0
BEGIN
    INSERT INTO [$(SchemaName)].[MstWorkflowExecutions]
    (
        strExecutionGUID, strGroupGUID, strWorkflowRuleGUID, strEntityGUID, strStatus, strErrorMessage,
        dtStartedOn, dtCompletedOn, dtCreatedOn
    )
    SELECT
        NEWID(),
        @GroupGUID,
        w.strWorkflowRuleGUID,
        l.strLeadGUID,
        CASE n.n % 4 WHEN 0 THEN 'Completed' WHEN 1 THEN 'Completed' WHEN 2 THEN 'Failed' ELSE 'Processing' END,
        CASE WHEN n.n % 4 = 2 THEN 'Synthetic validation error' ELSE NULL END,
        DATEADD(MINUTE, -1 * (n.n % 700000), @Now),
        CASE WHEN n.n % 4 = 3 THEN NULL ELSE DATEADD(MINUTE, -1 * (n.n % 700000) + 2, @Now) END,
        DATEADD(MINUTE, -1 * (n.n % 700000), @Now)
    FROM #N n
    JOIN #SeedWorkflowRules w
      ON w.rn = ((n.n - 1) % 4) + 1
    JOIN #SeedLeads l
      ON l.rn = ((n.n - 1) % NULLIF(@LeadCount, 0)) + 1
    WHERE n.n <= @WorkflowExecutionCount;
END;

/* =========================
   Web Forms + Fields + Submissions
   ========================= */
IF OBJECT_ID('tempdb..#SeedWebForms') IS NOT NULL DROP TABLE #SeedWebForms;
CREATE TABLE #SeedWebForms
(
    rn INT NOT NULL PRIMARY KEY,
    strWebFormGUID UNIQUEIDENTIFIER NOT NULL
);

INSERT INTO #SeedWebForms(rn, strWebFormGUID)
VALUES (1, NEWID()), (2, NEWID()), (3, NEWID()), (4, NEWID()), (5, NEWID());

INSERT INTO [$(SchemaName)].[MstWebForms]
(
    strWebFormGUID, strGroupGUID, strFormName, strFormDescription, strRedirectUrl, strThankYouMessage,
    strDefaultSource, bolNotifyOnSubmission, strNotificationEmails, bolCaptchaEnabled,
    strCreatedByGUID, strUpdatedByGUID, dtCreatedOn, dtUpdatedOn, bolIsActive, bolIsDeleted
)
SELECT
    wf.strWebFormGUID,
    @GroupGUID,
    CONCAT('Web Form ', wf.rn),
    CONCAT('Seeded web form ', wf.rn),
    CONCAT('https://example.com/thank-you/', wf.rn),
    'Thanks for your submission',
    CASE wf.rn % 3 WHEN 0 THEN 'Website' WHEN 1 THEN 'LinkedIn' ELSE 'Referral' END,
    1,
    'sales@example.com,ops@example.com',
    1,
    @CreatedByGUID,
    @CreatedByGUID,
    DATEADD(DAY, -1 * (wf.rn * 8), @Now),
    DATEADD(DAY, -1 * (wf.rn * 2), @Now),
    1,
    0
FROM #SeedWebForms wf;

INSERT INTO [$(SchemaName)].[MstWebFormFields]
(
    strWebFormFieldGUID, strGroupGUID, strWebFormGUID, strFieldLabel, strFieldType, strMappedLeadField,
    bolIsRequired, strDefaultValue, strPlaceholder, intDisplayOrder, dtCreatedOn
)
SELECT
    NEWID(),
    @GroupGUID,
    wf.strWebFormGUID,
    fld.strFieldLabel,
    fld.strFieldType,
    fld.strMappedLeadField,
    fld.bolIsRequired,
    fld.strDefaultValue,
    fld.strPlaceholder,
    fld.intDisplayOrder,
    DATEADD(DAY, -1 * (wf.rn * 8), @Now)
FROM #SeedWebForms wf
CROSS APPLY
(
    VALUES
    ('First Name', 'Text', 'strFirstName', 1, NULL, 'Enter first name', 1),
    ('Last Name', 'Text', 'strLastName', 1, NULL, 'Enter last name', 2),
    ('Email', 'Email', 'strEmail', 1, NULL, 'Enter email', 3),
    ('Phone', 'Phone', 'strPhone', 0, NULL, 'Enter phone', 4),
    ('Source', 'Hidden', 'strSource', 0, 'Website', NULL, 5)
) fld(strFieldLabel, strFieldType, strMappedLeadField, bolIsRequired, strDefaultValue, strPlaceholder, intDisplayOrder);

IF @WebFormSubmissionCount > 0
BEGIN
    INSERT INTO [$(SchemaName)].[MstWebFormSubmissions]
    (
        strSubmissionGUID, strGroupGUID, strWebFormGUID, strLeadGUID, strSubmittedDataJson,
        strIpAddress, strUserAgent, strReferrerUrl, strUtmSource, strUtmMedium, strUtmCampaign,
        strUtmTerm, strUtmContent, strStatus, strErrorMessage, dtCreatedOn
    )
    SELECT
        NEWID(),
        @GroupGUID,
        wf.strWebFormGUID,
        l.strLeadGUID,
        CONCAT('{"firstName":"Lead', n.n, '","lastName":"User', n.n, '","email":"lead', l.rn, '@example.com"}'),
        CONCAT('10.0.', n.n % 255, '.', (n.n * 3) % 255),
        'Mozilla/5.0 SeedBot',
        'https://example.com/landing',
        CASE n.n % 4 WHEN 0 THEN 'google' WHEN 1 THEN 'linkedin' WHEN 2 THEN 'email' ELSE 'referral' END,
        CASE n.n % 3 WHEN 0 THEN 'cpc' WHEN 1 THEN 'social' ELSE 'organic' END,
        CONCAT('campaign-', n.n % 30),
        CONCAT('term-', n.n % 20),
        CONCAT('content-', n.n % 10),
        CASE n.n % 6 WHEN 0 THEN 'Failed' ELSE 'Processed' END,
        CASE WHEN n.n % 6 = 0 THEN 'Synthetic validation failure' ELSE NULL END,
        DATEADD(MINUTE, -1 * (n.n % 700000), @Now)
    FROM #N n
    JOIN #SeedWebForms wf
      ON wf.rn = ((n.n - 1) % 5) + 1
    JOIN #SeedLeads l
      ON l.rn = ((n.n - 1) % NULLIF(@LeadCount, 0)) + 1
    WHERE n.n <= @WebFormSubmissionCount;
END;

/* =========================
   Import Jobs + Errors
   ========================= */
IF OBJECT_ID('tempdb..#SeedImportJobs') IS NOT NULL DROP TABLE #SeedImportJobs;
CREATE TABLE #SeedImportJobs
(
    rn INT NOT NULL PRIMARY KEY,
    strImportJobGUID UNIQUEIDENTIFIER NOT NULL
);

IF @ImportJobCount > 0
BEGIN
    INSERT INTO #SeedImportJobs(rn, strImportJobGUID)
    SELECT n, NEWID()
    FROM #N
    WHERE n <= @ImportJobCount;

    INSERT INTO [$(SchemaName)].[MstImportJobs]
    (
        strImportJobGUID, strGroupGUID, strFileName, strStatus, intTotalRecords, intSuccessRecords, intFailedRecords,
        strDuplicateHandling, strColumnMappingJson, strCreatedByGUID, dtCreatedOn, dtStartedOn, dtCompletedOn
    )
    SELECT
        j.strImportJobGUID,
        @GroupGUID,
        CONCAT('import_file_', j.rn, '.csv'),
        CASE j.rn % 4 WHEN 0 THEN 'Pending' WHEN 1 THEN 'Processing' WHEN 2 THEN 'Completed' ELSE 'Failed' END,
        1000 + (j.rn % 5000),
        CASE WHEN j.rn % 4 = 3 THEN 800 ELSE 1000 + (j.rn % 5000) - 10 END,
        CASE WHEN j.rn % 4 = 3 THEN 200 ELSE 10 END,
        CASE j.rn % 3 WHEN 0 THEN 'Skip' WHEN 1 THEN 'Merge' ELSE 'Overwrite' END,
        '{"first_name":"strFirstName","last_name":"strLastName","email":"strEmail"}',
        @CreatedByGUID,
        DATEADD(DAY, -1 * (j.rn % 120), @Now),
        DATEADD(DAY, -1 * (j.rn % 120), @Now),
        CASE WHEN j.rn % 4 IN (2,3) THEN DATEADD(DAY, -1 * (j.rn % 120) + 1, @Now) ELSE NULL END
    FROM #SeedImportJobs j;
END;

IF @ImportJobErrorCount > 0
BEGIN
    INSERT INTO [$(SchemaName)].[MstImportJobErrors]
    (
        strImportJobErrorGUID, strGroupGUID, strImportJobGUID, intRowNumber, strErrorMessage, strErrorType,
        strRowDataJson, dtCreatedOn
    )
    SELECT
        NEWID(),
        @GroupGUID,
        j.strImportJobGUID,
        n.n % 5000,
        CASE n.n % 3
            WHEN 0 THEN 'Invalid email format'
            WHEN 1 THEN 'Missing mandatory field'
            ELSE 'Duplicate lead record'
        END,
        CASE n.n % 3
            WHEN 0 THEN 'Validation'
            WHEN 1 THEN 'Schema'
            ELSE 'Duplicate'
        END,
        CONCAT('{"row":', n.n, ',"email":"bad', n.n, '@example"}'),
        DATEADD(MINUTE, -1 * (n.n % 700000), @Now)
    FROM #N n
    JOIN #SeedImportJobs j
      ON j.rn = ((n.n - 1) % NULLIF(@ImportJobCount, 0)) + 1
    WHERE n.n <= @ImportJobErrorCount;
END;

/* =========================
   Converted leads backfill
   ========================= */
IF @LeadCount > 0 AND @AccountCount > 0 AND @ContactCount > 0 AND @OpportunityCount > 0
BEGIN
    UPDATE l
    SET
        l.strStatus = 'Converted',
        l.strConvertedAccountGUID = a.strAccountGUID,
        l.strConvertedContactGUID = c.strContactGUID,
        l.strConvertedOpportunityGUID = o.strOpportunityGUID,
        l.dtConvertedOn = DATEADD(DAY, -1 * (sl.rn % 90), @Now),
        l.dtUpdatedOn = @Now,
        l.strUpdatedByGUID = @CreatedByGUID
    FROM [$(SchemaName)].[MstLeads] l
    JOIN #SeedLeads sl ON sl.strLeadGUID = l.strLeadGUID
    JOIN #SeedAccounts a ON a.rn = ((sl.rn - 1) % @AccountCount) + 1
    JOIN #SeedContacts c ON c.rn = ((sl.rn - 1) % @ContactCount) + 1
    JOIN #SeedOpportunities o ON o.rn = ((sl.rn - 1) % @OpportunityCount) + 1
    WHERE sl.rn % 10 = 0;
END;

/* =========================
   Audit logs
   ========================= */
IF @AuditLogCount > 0
BEGIN
    INSERT INTO [$(SchemaName)].[MstAuditLogs]
    (
        strAuditLogGUID, strGroupGUID, strEntityType, strEntityGUID, strAction, strOldValues, strNewValues,
        strPerformedByGUID, dtPerformedOn
    )
    SELECT
        NEWID(),
        @GroupGUID,
        CASE n.n % 6
            WHEN 0 THEN 'Lead'
            WHEN 1 THEN 'Contact'
            WHEN 2 THEN 'Account'
            WHEN 3 THEN 'Opportunity'
            WHEN 4 THEN 'Activity'
            ELSE 'Pipeline'
        END,
        COALESCE(
            CASE n.n % 6
                WHEN 0 THEN l.strLeadGUID
                WHEN 1 THEN c.strContactGUID
                WHEN 2 THEN a.strAccountGUID
                WHEN 3 THEN o.strOpportunityGUID
                WHEN 4 THEN act.strActivityGUID
                ELSE @PipelineGUID
            END,
            @PipelineGUID
        ),
        CASE n.n % 4 WHEN 0 THEN 'Create' WHEN 1 THEN 'Update' WHEN 2 THEN 'Delete' ELSE 'View' END,
        '{"before":"old"}',
        CONCAT('{"after":"new","record":', n.n, '}'),
        @CreatedByGUID,
        DATEADD(MINUTE, -1 * (n.n % 700000), @Now)
    FROM #N n
    LEFT JOIN #SeedLeads l
      ON l.rn = ((n.n - 1) % NULLIF(@LeadCount, 0)) + 1
    LEFT JOIN #SeedContacts c
      ON c.rn = ((n.n - 1) % NULLIF(@ContactCount, 0)) + 1
    LEFT JOIN #SeedAccounts a
      ON a.rn = ((n.n - 1) % NULLIF(@AccountCount, 0)) + 1
    LEFT JOIN #SeedOpportunities o
      ON o.rn = ((n.n - 1) % NULLIF(@OpportunityCount, 0)) + 1
    LEFT JOIN #SeedActivities act
      ON act.rn = ((n.n - 1) % NULLIF(@ActivityCount, 0)) + 1
    WHERE n.n <= @AuditLogCount;
END;

/* =========================
   Final row counts
   ========================= */
PRINT '=== Final Row Counts ===';
SELECT 'MstAccounts' AS TableName, COUNT_BIG(*) AS TotalRows FROM [$(SchemaName)].[MstAccounts]
UNION ALL SELECT 'MstActivities', COUNT_BIG(*) FROM [$(SchemaName)].[MstActivities]
UNION ALL SELECT 'MstActivityLinks', COUNT_BIG(*) FROM [$(SchemaName)].[MstActivityLinks]
UNION ALL SELECT 'MstAuditLogs', COUNT_BIG(*) FROM [$(SchemaName)].[MstAuditLogs]
UNION ALL SELECT 'MstContacts', COUNT_BIG(*) FROM [$(SchemaName)].[MstContacts]
UNION ALL SELECT 'MstImportJobErrors', COUNT_BIG(*) FROM [$(SchemaName)].[MstImportJobErrors]
UNION ALL SELECT 'MstImportJobs', COUNT_BIG(*) FROM [$(SchemaName)].[MstImportJobs]
UNION ALL SELECT 'MstLeadAssignmentMembers', COUNT_BIG(*) FROM [$(SchemaName)].[MstLeadAssignmentMembers]
UNION ALL SELECT 'MstLeadAssignmentRules', COUNT_BIG(*) FROM [$(SchemaName)].[MstLeadAssignmentRules]
UNION ALL SELECT 'MstLeadCommunications', COUNT_BIG(*) FROM [$(SchemaName)].[MstLeadCommunications]
UNION ALL SELECT 'MstLeadDuplicates', COUNT_BIG(*) FROM [$(SchemaName)].[MstLeadDuplicates]
UNION ALL SELECT 'MstLeadMergeHistory', COUNT_BIG(*) FROM [$(SchemaName)].[MstLeadMergeHistory]
UNION ALL SELECT 'MstLeads', COUNT_BIG(*) FROM [$(SchemaName)].[MstLeads]
UNION ALL SELECT 'MstLeadScoreHistory', COUNT_BIG(*) FROM [$(SchemaName)].[MstLeadScoreHistory]
UNION ALL SELECT 'MstLeadScoringRules', COUNT_BIG(*) FROM [$(SchemaName)].[MstLeadScoringRules]
UNION ALL SELECT 'MstOpportunities', COUNT_BIG(*) FROM [$(SchemaName)].[MstOpportunities]
UNION ALL SELECT 'MstOpportunityContacts', COUNT_BIG(*) FROM [$(SchemaName)].[MstOpportunityContacts]
UNION ALL SELECT 'MstPipelines', COUNT_BIG(*) FROM [$(SchemaName)].[MstPipelines]
UNION ALL SELECT 'MstPipelineStages', COUNT_BIG(*) FROM [$(SchemaName)].[MstPipelineStages]
UNION ALL SELECT 'MstWebFormFields', COUNT_BIG(*) FROM [$(SchemaName)].[MstWebFormFields]
UNION ALL SELECT 'MstWebForms', COUNT_BIG(*) FROM [$(SchemaName)].[MstWebForms]
UNION ALL SELECT 'MstWebFormSubmissions', COUNT_BIG(*) FROM [$(SchemaName)].[MstWebFormSubmissions]
UNION ALL SELECT 'MstWorkflowExecutions', COUNT_BIG(*) FROM [$(SchemaName)].[MstWorkflowExecutions]
UNION ALL SELECT 'MstWorkflowRules', COUNT_BIG(*) FROM [$(SchemaName)].[MstWorkflowRules]
ORDER BY TableName;

PRINT '=== CRM High-Volume Seed Completed ===';
