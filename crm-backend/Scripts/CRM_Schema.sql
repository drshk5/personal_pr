-- =============================================
-- CRM Database Schema — Phase 1
-- Run this script on SQL Server to create all tables
-- =============================================

-- 1. MstLeads
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MstLeads')
BEGIN
    CREATE TABLE MstLeads (
        strLeadGUID             UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strFirstName            NVARCHAR(100)       NOT NULL,
        strLastName             NVARCHAR(100)       NOT NULL,
        strEmail                NVARCHAR(255)       NOT NULL,
        strPhone                NVARCHAR(20)        NULL,
        strCompanyName          NVARCHAR(200)       NULL,
        strJobTitle             NVARCHAR(150)       NULL,
        strSource               NVARCHAR(50)        NOT NULL,
        strStatus               NVARCHAR(50)        NOT NULL DEFAULT 'New',
        intLeadScore            INT                 DEFAULT 0,
        strAddress              NVARCHAR(500)       NULL,
        strCity                 NVARCHAR(100)       NULL,
        strState                NVARCHAR(100)       NULL,
        strCountry              NVARCHAR(100)       NULL,
        strPostalCode           NVARCHAR(20)        NULL,
        strNotes                NVARCHAR(MAX)       NULL,
        strConvertedAccountGUID UNIQUEIDENTIFIER    NULL,
        strConvertedContactGUID UNIQUEIDENTIFIER    NULL,
        strConvertedOpportunityGUID UNIQUEIDENTIFIER NULL,
        dtConvertedOn           DATETIME2           NULL,
        strAssignedToGUID       UNIQUEIDENTIFIER    NULL,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0,
        dtDeletedOn             DATETIME2           NULL
    );

    CREATE INDEX IX_MstLeads_GroupGUID ON MstLeads(strGroupGUID);
    CREATE INDEX IX_MstLeads_Status ON MstLeads(strStatus);
    CREATE INDEX IX_MstLeads_Email ON MstLeads(strEmail);
    CREATE INDEX IX_MstLeads_AssignedTo ON MstLeads(strAssignedToGUID);
END
GO

-- 2. MstAccounts
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MstAccounts')
BEGIN
    CREATE TABLE MstAccounts (
        strAccountGUID          UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strAccountName          NVARCHAR(200)       NOT NULL,
        strIndustry             NVARCHAR(100)       NULL,
        strWebsite              NVARCHAR(500)       NULL,
        strPhone                NVARCHAR(20)        NULL,
        strEmail                NVARCHAR(255)       NULL,
        intEmployeeCount        INT                 NULL,
        dblAnnualRevenue        DECIMAL(18,2)       NULL,
        strAddress              NVARCHAR(500)       NULL,
        strCity                 NVARCHAR(100)       NULL,
        strState                NVARCHAR(100)       NULL,
        strCountry              NVARCHAR(100)       NULL,
        strPostalCode           NVARCHAR(20)        NULL,
        strDescription          NVARCHAR(MAX)       NULL,
        strAssignedToGUID       UNIQUEIDENTIFIER    NULL,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0,
        dtDeletedOn             DATETIME2           NULL
    );

    CREATE INDEX IX_MstAccounts_GroupGUID ON MstAccounts(strGroupGUID);
    CREATE INDEX IX_MstAccounts_AccountName ON MstAccounts(strAccountName);
END
GO

-- 3. MstContacts
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MstContacts')
BEGIN
    CREATE TABLE MstContacts (
        strContactGUID          UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strAccountGUID          UNIQUEIDENTIFIER    NULL,
        strFirstName            NVARCHAR(100)       NOT NULL,
        strLastName             NVARCHAR(100)       NOT NULL,
        strEmail                NVARCHAR(255)       NOT NULL,
        strPhone                NVARCHAR(20)        NULL,
        strMobilePhone          NVARCHAR(20)        NULL,
        strJobTitle             NVARCHAR(150)       NULL,
        strDepartment           NVARCHAR(100)       NULL,
        strLifecycleStage       NVARCHAR(50)        DEFAULT 'Subscriber',
        strAddress              NVARCHAR(500)       NULL,
        strCity                 NVARCHAR(100)       NULL,
        strState                NVARCHAR(100)       NULL,
        strCountry              NVARCHAR(100)       NULL,
        strPostalCode           NVARCHAR(20)        NULL,
        strNotes                NVARCHAR(MAX)       NULL,
        dtLastContactedOn       DATETIME2           NULL,
        strAssignedToGUID       UNIQUEIDENTIFIER    NULL,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0,
        dtDeletedOn             DATETIME2           NULL,

        CONSTRAINT FK_MstContacts_Account FOREIGN KEY (strAccountGUID) REFERENCES MstAccounts(strAccountGUID)
    );

    CREATE INDEX IX_MstContacts_GroupGUID ON MstContacts(strGroupGUID);
    CREATE INDEX IX_MstContacts_AccountGUID ON MstContacts(strAccountGUID);
    CREATE INDEX IX_MstContacts_Email ON MstContacts(strEmail);
END
GO

-- 4. MstPipelines
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MstPipelines')
BEGIN
    CREATE TABLE MstPipelines (
        strPipelineGUID         UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strPipelineName         NVARCHAR(200)       NOT NULL,
        strDescription          NVARCHAR(500)       NULL,
        bolIsDefault            BIT                 DEFAULT 0,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0,
        dtDeletedOn             DATETIME2           NULL
    );
END
GO

-- 5. MstPipelineStages
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MstPipelineStages')
BEGIN
    CREATE TABLE MstPipelineStages (
        strStageGUID            UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strPipelineGUID         UNIQUEIDENTIFIER    NOT NULL,
        strStageName            NVARCHAR(100)       NOT NULL,
        intDisplayOrder         INT                 NOT NULL,
        intProbabilityPercent   INT                 DEFAULT 0,
        strRequiredFields       NVARCHAR(MAX)       NULL,
        strAllowedTransitions   NVARCHAR(MAX)       NULL,
        intDefaultDaysToRot     INT                 DEFAULT 30,
        bolIsWonStage           BIT                 DEFAULT 0,
        bolIsLostStage          BIT                 DEFAULT 0,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,

        CONSTRAINT FK_MstPipelineStages_Pipeline FOREIGN KEY (strPipelineGUID) REFERENCES MstPipelines(strPipelineGUID) ON DELETE CASCADE
    );
END
GO

-- 6. MstOpportunities
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MstOpportunities')
BEGIN
    CREATE TABLE MstOpportunities (
        strOpportunityGUID      UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strOpportunityName      NVARCHAR(200)       NOT NULL,
        strAccountGUID          UNIQUEIDENTIFIER    NULL,
        strPipelineGUID         UNIQUEIDENTIFIER    NOT NULL,
        strStageGUID            UNIQUEIDENTIFIER    NOT NULL,
        strStatus               NVARCHAR(50)        NOT NULL DEFAULT 'Open',
        dblAmount               DECIMAL(18,2)       NULL,
        strCurrency             NVARCHAR(10)        DEFAULT 'INR',
        dtExpectedCloseDate     DATETIME2           NULL,
        dtActualCloseDate       DATETIME2           NULL,
        intProbability          INT                 DEFAULT 0,
        strLossReason           NVARCHAR(500)       NULL,
        strDescription          NVARCHAR(MAX)       NULL,
        dtStageEnteredOn        DATETIME2           NOT NULL,
        dtLastActivityOn        DATETIME2           NULL,
        strAssignedToGUID       UNIQUEIDENTIFIER    NULL,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        strUpdatedByGUID        UNIQUEIDENTIFIER    NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        dtUpdatedOn             DATETIME2           NULL,
        bolIsActive             BIT                 DEFAULT 1,
        bolIsDeleted            BIT                 DEFAULT 0,
        dtDeletedOn             DATETIME2           NULL,

        CONSTRAINT FK_MstOpportunities_Account FOREIGN KEY (strAccountGUID) REFERENCES MstAccounts(strAccountGUID),
        CONSTRAINT FK_MstOpportunities_Pipeline FOREIGN KEY (strPipelineGUID) REFERENCES MstPipelines(strPipelineGUID),
        CONSTRAINT FK_MstOpportunities_Stage FOREIGN KEY (strStageGUID) REFERENCES MstPipelineStages(strStageGUID)
    );

    CREATE INDEX IX_MstOpportunities_GroupGUID ON MstOpportunities(strGroupGUID);
    CREATE INDEX IX_MstOpportunities_PipelineGUID ON MstOpportunities(strPipelineGUID);
    CREATE INDEX IX_MstOpportunities_StageGUID ON MstOpportunities(strStageGUID);
    CREATE INDEX IX_MstOpportunities_AccountGUID ON MstOpportunities(strAccountGUID);
    CREATE INDEX IX_MstOpportunities_Status ON MstOpportunities(strStatus);
END
GO

-- 7. MstOpportunityContacts (Junction)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MstOpportunityContacts')
BEGIN
    CREATE TABLE MstOpportunityContacts (
        strOpportunityContactGUID UNIQUEIDENTIFIER  NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strOpportunityGUID      UNIQUEIDENTIFIER    NOT NULL,
        strContactGUID          UNIQUEIDENTIFIER    NOT NULL,
        strRole                 NVARCHAR(50)        DEFAULT 'Stakeholder',
        bolIsPrimary            BIT                 DEFAULT 0,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT FK_OppContacts_Opportunity FOREIGN KEY (strOpportunityGUID) REFERENCES MstOpportunities(strOpportunityGUID) ON DELETE CASCADE,
        CONSTRAINT FK_OppContacts_Contact FOREIGN KEY (strContactGUID) REFERENCES MstContacts(strContactGUID) ON DELETE CASCADE,
        CONSTRAINT UQ_OppContacts_OppContact UNIQUE (strOpportunityGUID, strContactGUID)
    );
END
GO

-- 8. MstActivities
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MstActivities')
BEGIN
    CREATE TABLE MstActivities (
        strActivityGUID         UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strActivityType         NVARCHAR(50)        NOT NULL,
        strSubject              NVARCHAR(300)       NOT NULL,
        strDescription          NVARCHAR(MAX)       NULL,
        dtScheduledStart        DATETIME2           NULL,
        dtActualEnd             DATETIME2           NULL,
        intDurationMinutes      INT                 NULL,
        strOutcome              NVARCHAR(200)       NULL,
        strAssignedToGUID       UNIQUEIDENTIFIER    NULL,
        strCreatedByGUID        UNIQUEIDENTIFIER    NOT NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        bolIsActive             BIT                 DEFAULT 1
    );
END
GO

-- 9. MstActivityLinks (Polymorphic Junction)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MstActivityLinks')
BEGIN
    CREATE TABLE MstActivityLinks (
        strActivityLinkGUID     UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strActivityGUID         UNIQUEIDENTIFIER    NOT NULL,
        strEntityType           NVARCHAR(50)        NOT NULL,
        strEntityGUID           UNIQUEIDENTIFIER    NOT NULL,
        dtCreatedOn             DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT FK_ActivityLinks_Activity FOREIGN KEY (strActivityGUID) REFERENCES MstActivities(strActivityGUID) ON DELETE CASCADE,
        CONSTRAINT UQ_ActivityLinks_Unique UNIQUE (strActivityGUID, strEntityType, strEntityGUID)
    );

    CREATE INDEX IX_MstActivityLinks_Entity ON MstActivityLinks(strEntityType, strEntityGUID);
END
GO

-- 10. MstAuditLogs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MstAuditLogs')
BEGIN
    CREATE TABLE MstAuditLogs (
        strAuditLogGUID         UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID() PRIMARY KEY,
        strGroupGUID            UNIQUEIDENTIFIER    NOT NULL,
        strEntityType           NVARCHAR(50)        NOT NULL,
        strEntityGUID           UNIQUEIDENTIFIER    NOT NULL,
        strAction               NVARCHAR(50)        NOT NULL,
        strNewValues            NVARCHAR(MAX)       NULL,
        strPerformedByGUID      UNIQUEIDENTIFIER    NOT NULL,
        dtPerformedOn           DATETIME2           NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

-- Add Foreign Keys for MstLeads (after all tables created)
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_MstLeads_ConvertedAccount')
BEGIN
    ALTER TABLE MstLeads ADD CONSTRAINT FK_MstLeads_ConvertedAccount
        FOREIGN KEY (strConvertedAccountGUID) REFERENCES MstAccounts(strAccountGUID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_MstLeads_ConvertedContact')
BEGIN
    ALTER TABLE MstLeads ADD CONSTRAINT FK_MstLeads_ConvertedContact
        FOREIGN KEY (strConvertedContactGUID) REFERENCES MstContacts(strContactGUID);
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_MstLeads_ConvertedOpportunity')
BEGIN
    ALTER TABLE MstLeads ADD CONSTRAINT FK_MstLeads_ConvertedOpportunity
        FOREIGN KEY (strConvertedOpportunityGUID) REFERENCES MstOpportunities(strOpportunityGUID);
END
GO

PRINT 'CRM Schema created successfully — 10 tables';
