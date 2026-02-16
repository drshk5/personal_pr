-- =====================================================
-- COMPLETE CRM SEED SCRIPT
-- =====================================================
-- This script creates all necessary seed data for CRM module:
--   1. Module Entry (mstModule)
--   2. Page Templates (mstPageTemplate)
--   3. Picklist Types (mstPicklistType)
--   4. Picklist Values (mstPickListValue)
--   5. Master Menus (mstMasterMenu)
-- =====================================================
-- IMPORTANT: Update @SystemUserGUID and @GroupGUID before running
-- =====================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- STEP 0: Declare System Variables
-- =====================================================
PRINT '=============================================='
PRINT 'CRM Complete Seed Data Installation'
PRINT '=============================================='
PRINT ''

-- System User GUID (Update this with your system/admin user GUID)
DECLARE @SystemUserGUID uniqueidentifier = '00000000-0000-0000-0000-000000000001';

-- Group GUID (Update this with your group GUID)
DECLARE @GroupGUID uniqueidentifier = NULL;

-- Auto-fetch first active group if available
SELECT TOP 1 @GroupGUID = strGroupGUID FROM mstGroup WHERE strName IS NOT NULL;

IF @GroupGUID IS NULL
BEGIN
    PRINT 'WARNING: No group found! Please create a group first or set @GroupGUID manually.'
    PRINT ''
END
ELSE
BEGIN
    PRINT 'Using Group GUID: ' + CAST(@GroupGUID AS VARCHAR(36))
    PRINT ''
END

PRINT 'NOTE: Using System User GUID: ' + CAST(@SystemUserGUID AS VARCHAR(36))
PRINT 'Update @SystemUserGUID variable if needed'
PRINT '=============================================='
PRINT ''

-- =====================================================
-- STEP 1: Create CRM Module Entry
-- =====================================================
PRINT '→ STEP 1: Creating CRM Module...'

DECLARE @CrmModuleGUID uniqueidentifier = NEWID();

-- Check if CRM module already exists
IF EXISTS (SELECT 1 FROM mstModule WHERE strName = 'CRM')
BEGIN
    SELECT @CrmModuleGUID = strModuleGUID FROM mstModule WHERE strName = 'CRM';
    PRINT '  ✓ CRM Module already exists with GUID: ' + CAST(@CrmModuleGUID AS VARCHAR(36))
END
ELSE
BEGIN
    INSERT INTO [mstModule]
        ([strModuleGUID], [strName], [strDesc], [strSQlfilePath], [strImagePath], [bolIsActive], [strCreatedByGUID], [dtCreatedOn])
    VALUES
        (@CrmModuleGUID, 'CRM', 'Customer Relationship Management - Manage leads, contacts, accounts, opportunities and activities', '/crm/schema.sql', '/assets/modules/crm-icon.png', 1, @SystemUserGUID, GETUTCDATE());

    PRINT '  ✓ CRM Module created successfully'
    PRINT '    GUID: ' + CAST(@CrmModuleGUID AS VARCHAR(36))
END
PRINT ''

-- =====================================================
-- STEP 2: Create Page Templates for CRM
-- =====================================================
PRINT '→ STEP 2: Creating Page Templates...'

-- Template 1: CRM List Page (View, Export, Print)
DECLARE @CrmListTemplateGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstPageTemplate WHERE strPageTemplateName = 'CRM_List_Template')
BEGIN
    INSERT INTO [mstPageTemplate]
        ([strPageTemplateGUID], [strPageTemplateName], [bolIsSave], [bolIsView], [bolIsEdit], [bolIsDelete], [bolIsPrint], [bolIsExport], [bolIsImport], [bolIsApprove], [strCreatedByGUID], [dtCreated], [bolIsSystemCreated])
    VALUES
        (@CrmListTemplateGUID, 'CRM_List_Template', 0, 1, 0, 0, 1, 1, 0, 0, @SystemUserGUID, GETUTCDATE(), 1);
    PRINT '  ✓ CRM List Template created'
END
ELSE
BEGIN
    SELECT @CrmListTemplateGUID = strPageTemplateGUID FROM mstPageTemplate WHERE strPageTemplateName = 'CRM_List_Template';
    PRINT '  ✓ CRM List Template already exists'
END

-- Template 2: CRM Form Page (Save, View, Edit, Delete)
DECLARE @CrmFormTemplateGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstPageTemplate WHERE strPageTemplateName = 'CRM_Form_Template')
BEGIN
    INSERT INTO [mstPageTemplate]
        ([strPageTemplateGUID], [strPageTemplateName], [bolIsSave], [bolIsView], [bolIsEdit], [bolIsDelete], [bolIsPrint], [bolIsExport], [bolIsImport], [bolIsApprove], [strCreatedByGUID], [dtCreated], [bolIsSystemCreated])
    VALUES
        (@CrmFormTemplateGUID, 'CRM_Form_Template', 1, 1, 1, 1, 0, 0, 0, 0, @SystemUserGUID, GETUTCDATE(), 1);
    PRINT '  ✓ CRM Form Template created'
END
ELSE
BEGIN
    SELECT @CrmFormTemplateGUID = strPageTemplateGUID FROM mstPageTemplate WHERE strPageTemplateName = 'CRM_Form_Template';
    PRINT '  ✓ CRM Form Template already exists'
END

-- Template 3: CRM Dashboard (View Only)
DECLARE @CrmDashboardTemplateGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstPageTemplate WHERE strPageTemplateName = 'CRM_Dashboard_Template')
BEGIN
    INSERT INTO [mstPageTemplate]
        ([strPageTemplateGUID], [strPageTemplateName], [bolIsSave], [bolIsView], [bolIsEdit], [bolIsDelete], [bolIsPrint], [bolIsExport], [bolIsImport], [bolIsApprove], [strCreatedByGUID], [dtCreated], [bolIsSystemCreated])
    VALUES
        (@CrmDashboardTemplateGUID, 'CRM_Dashboard_Template', 0, 1, 0, 0, 1, 1, 0, 0, @SystemUserGUID, GETUTCDATE(), 1);
    PRINT '  ✓ CRM Dashboard Template created'
END
ELSE
BEGIN
    SELECT @CrmDashboardTemplateGUID = strPageTemplateGUID FROM mstPageTemplate WHERE strPageTemplateName = 'CRM_Dashboard_Template';
    PRINT '  ✓ CRM Dashboard Template already exists'
END

PRINT ''

-- =====================================================
-- STEP 3: Create Picklist Types for CRM
-- =====================================================
PRINT '→ STEP 3: Creating Picklist Types...'

-- Picklist Type 1: Lead Status
DECLARE @LeadStatusTypeGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstPicklistType WHERE strType = 'Lead_Status')
BEGIN
    INSERT INTO [mstPicklistType]
        ([strPicklistTypeGUID], [strType], [strDescription], [bolIsActive], [strCreatedByGUID], [dtCreatedOn])
    VALUES
        (@LeadStatusTypeGUID, 'Lead_Status', 'Lead lifecycle status - New, Contacted, Qualified, Unqualified, Converted', 1, @SystemUserGUID, GETUTCDATE());
    PRINT '  ✓ Lead_Status picklist type created'
END
ELSE
BEGIN
    SELECT @LeadStatusTypeGUID = strPicklistTypeGUID FROM mstPicklistType WHERE strType = 'Lead_Status';
    PRINT '  ✓ Lead_Status picklist type already exists'
END

-- Picklist Type 2: Lead Source
DECLARE @LeadSourceTypeGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstPicklistType WHERE strType = 'Lead_Source')
BEGIN
    INSERT INTO [mstPicklistType]
        ([strPicklistTypeGUID], [strType], [strDescription], [bolIsActive], [strCreatedByGUID], [dtCreatedOn])
    VALUES
        (@LeadSourceTypeGUID, 'Lead_Source', 'Lead source channel - Website, Referral, LinkedIn, Cold Call, etc.', 1, @SystemUserGUID, GETUTCDATE());
    PRINT '  ✓ Lead_Source picklist type created'
END
ELSE
BEGIN
    SELECT @LeadSourceTypeGUID = strPicklistTypeGUID FROM mstPicklistType WHERE strType = 'Lead_Source';
    PRINT '  ✓ Lead_Source picklist type already exists'
END

-- Picklist Type 3: Contact Status
DECLARE @ContactStatusTypeGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstPicklistType WHERE strType = 'Contact_Status')
BEGIN
    INSERT INTO [mstPicklistType]
        ([strPicklistTypeGUID], [strType], [strDescription], [bolIsActive], [strCreatedByGUID], [dtCreatedOn])
    VALUES
        (@ContactStatusTypeGUID, 'Contact_Status', 'Contact status - Active, Inactive, Bounced, Unsubscribed', 1, @SystemUserGUID, GETUTCDATE());
    PRINT '  ✓ Contact_Status picklist type created'
END
ELSE
BEGIN
    SELECT @ContactStatusTypeGUID = strPicklistTypeGUID FROM mstPicklistType WHERE strType = 'Contact_Status';
    PRINT '  ✓ Contact_Status picklist type already exists'
END

-- Picklist Type 4: Contact Lifecycle Stage
DECLARE @ContactLifecycleTypeGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstPicklistType WHERE strType = 'Contact_Lifecycle_Stage')
BEGIN
    INSERT INTO [mstPicklistType]
        ([strPicklistTypeGUID], [strType], [strDescription], [bolIsActive], [strCreatedByGUID], [dtCreatedOn])
    VALUES
        (@ContactLifecycleTypeGUID, 'Contact_Lifecycle_Stage', 'Contact lifecycle - Subscriber, Lead, MQL, SQL, Opportunity, Customer, Evangelist', 1, @SystemUserGUID, GETUTCDATE());
    PRINT '  ✓ Contact_Lifecycle_Stage picklist type created'
END
ELSE
BEGIN
    SELECT @ContactLifecycleTypeGUID = strPicklistTypeGUID FROM mstPicklistType WHERE strType = 'Contact_Lifecycle_Stage';
    PRINT '  ✓ Contact_Lifecycle_Stage picklist type already exists'
END

-- Picklist Type 5: Opportunity Stage
DECLARE @OpportunityStageTypeGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstPicklistType WHERE strType = 'Opportunity_Stage')
BEGIN
    INSERT INTO [mstPicklistType]
        ([strPicklistTypeGUID], [strType], [strDescription], [bolIsActive], [strCreatedByGUID], [dtCreatedOn])
    VALUES
        (@OpportunityStageTypeGUID, 'Opportunity_Stage', 'Opportunity pipeline stage - Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost', 1, @SystemUserGUID, GETUTCDATE());
    PRINT '  ✓ Opportunity_Stage picklist type created'
END
ELSE
BEGIN
    SELECT @OpportunityStageTypeGUID = strPicklistTypeGUID FROM mstPicklistType WHERE strType = 'Opportunity_Stage';
    PRINT '  ✓ Opportunity_Stage picklist type already exists'
END

-- Picklist Type 6: Activity Type
DECLARE @ActivityTypeGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstPicklistType WHERE strType = 'Activity_Type')
BEGIN
    INSERT INTO [mstPicklistType]
        ([strPicklistTypeGUID], [strType], [strDescription], [bolIsActive], [strCreatedByGUID], [dtCreatedOn])
    VALUES
        (@ActivityTypeGUID, 'Activity_Type', 'Activity type - Call, Email, Meeting, Note, Task, Follow Up', 1, @SystemUserGUID, GETUTCDATE());
    PRINT '  ✓ Activity_Type picklist type created'
END
ELSE
BEGIN
    SELECT @ActivityTypeGUID = strPicklistTypeGUID FROM mstPicklistType WHERE strType = 'Activity_Type';
    PRINT '  ✓ Activity_Type picklist type already exists'
END

PRINT ''

-- =====================================================
-- STEP 4: Create Picklist Values for CRM
-- =====================================================
PRINT '→ STEP 4: Creating Picklist Values...'

-- Lead Status Values
PRINT '  Creating Lead Status values...'
IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadStatusTypeGUID AND strValue = 'New' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'New', @LeadStatusTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadStatusTypeGUID AND strValue = 'Contacted' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Contacted', @LeadStatusTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadStatusTypeGUID AND strValue = 'Qualified' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Qualified', @LeadStatusTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadStatusTypeGUID AND strValue = 'Unqualified' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Unqualified', @LeadStatusTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadStatusTypeGUID AND strValue = 'Converted' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Converted', @LeadStatusTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());
PRINT '    ✓ Lead Status: New, Contacted, Qualified, Unqualified, Converted'

-- Lead Source Values
PRINT '  Creating Lead Source values...'
IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadSourceTypeGUID AND strValue = 'Website' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Website', @LeadSourceTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadSourceTypeGUID AND strValue = 'Referral' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Referral', @LeadSourceTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadSourceTypeGUID AND strValue = 'LinkedIn' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'LinkedIn', @LeadSourceTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadSourceTypeGUID AND strValue = 'ColdCall' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'ColdCall', @LeadSourceTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadSourceTypeGUID AND strValue = 'Advertisement' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Advertisement', @LeadSourceTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadSourceTypeGUID AND strValue = 'TradeShow' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'TradeShow', @LeadSourceTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadSourceTypeGUID AND strValue = 'Other' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Other', @LeadSourceTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());
PRINT '    ✓ Lead Source: Website, Referral, LinkedIn, ColdCall, Advertisement, TradeShow, Other'

-- Contact Status Values
PRINT '  Creating Contact Status values...'
IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ContactStatusTypeGUID AND strValue = 'Active' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Active', @ContactStatusTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ContactStatusTypeGUID AND strValue = 'Inactive' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Inactive', @ContactStatusTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ContactStatusTypeGUID AND strValue = 'Bounced' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Bounced', @ContactStatusTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ContactStatusTypeGUID AND strValue = 'Unsubscribed' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Unsubscribed', @ContactStatusTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());
PRINT '    ✓ Contact Status: Active, Inactive, Bounced, Unsubscribed'

-- Contact Lifecycle Stage Values
PRINT '  Creating Contact Lifecycle Stage values...'
IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ContactLifecycleTypeGUID AND strValue = 'Subscriber' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Subscriber', @ContactLifecycleTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ContactLifecycleTypeGUID AND strValue = 'Lead' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Lead', @ContactLifecycleTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ContactLifecycleTypeGUID AND strValue = 'MQL' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'MQL', @ContactLifecycleTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ContactLifecycleTypeGUID AND strValue = 'SQL' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'SQL', @ContactLifecycleTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ContactLifecycleTypeGUID AND strValue = 'Opportunity' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Opportunity', @ContactLifecycleTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ContactLifecycleTypeGUID AND strValue = 'Customer' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Customer', @ContactLifecycleTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ContactLifecycleTypeGUID AND strValue = 'Evangelist' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Evangelist', @ContactLifecycleTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());
PRINT '    ✓ Contact Lifecycle: Subscriber, Lead, MQL, SQL, Opportunity, Customer, Evangelist'

-- Opportunity Stage Values
PRINT '  Creating Opportunity Stage values...'
IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @OpportunityStageTypeGUID AND strValue = 'Prospecting' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Prospecting', @OpportunityStageTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @OpportunityStageTypeGUID AND strValue = 'Qualification' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Qualification', @OpportunityStageTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @OpportunityStageTypeGUID AND strValue = 'Proposal' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Proposal', @OpportunityStageTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @OpportunityStageTypeGUID AND strValue = 'Negotiation' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Negotiation', @OpportunityStageTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @OpportunityStageTypeGUID AND strValue = 'Closed Won' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Closed Won', @OpportunityStageTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @OpportunityStageTypeGUID AND strValue = 'Closed Lost' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Closed Lost', @OpportunityStageTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());
PRINT '    ✓ Opportunity Stage: Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost'

-- Activity Type Values
PRINT '  Creating Activity Type values...'
IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ActivityTypeGUID AND strValue = 'Call' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Call', @ActivityTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ActivityTypeGUID AND strValue = 'Email' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Email', @ActivityTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ActivityTypeGUID AND strValue = 'Meeting' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Meeting', @ActivityTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ActivityTypeGUID AND strValue = 'Note' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Note', @ActivityTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ActivityTypeGUID AND strValue = 'Task' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'Task', @ActivityTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @ActivityTypeGUID AND strValue = 'FollowUp' AND strGroupGUID = @GroupGUID)
    INSERT INTO [mstPickListValue] ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
    VALUES (NEWID(), 'FollowUp', @ActivityTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());
PRINT '    ✓ Activity Type: Call, Email, Meeting, Note, Task, FollowUp'

PRINT ''

-- =====================================================
-- STEP 5: Create Master Menus for CRM
-- =====================================================
PRINT '→ STEP 5: Creating Master Menus...'

-- Delete existing CRM menus if re-running
-- Uncomment the line below if you want to recreate all menus
-- DELETE FROM mstMasterMenu WHERE strCategory = 'CRM';

-- 1. Dashboard
DECLARE @CrmDashboardGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_dashboard')
BEGIN
    INSERT INTO [mstMasterMenu]
        ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
    VALUES
        (@CrmDashboardGUID, NULL, @CrmModuleGUID, 10, 'Dashboard', '/crm/dashboard', 'sidebar', 0, 'LayoutDashboard', 1, 'crm_dashboard', 0, 'CRM', @CrmDashboardTemplateGUID, 1);
    PRINT '  ✓ Dashboard menu created'
END

-- 2. Leads
DECLARE @LeadListGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_lead_list')
BEGIN
    INSERT INTO [mstMasterMenu]
        ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
    VALUES
        (@LeadListGUID, NULL, @CrmModuleGUID, 20, 'Leads', '/crm/leads', 'sidebar', 1, 'Target', 1, 'crm_lead_list', 0, 'CRM', @CrmListTemplateGUID, 1);
    PRINT '  ✓ Leads menu created'

    -- Lead Form
    IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_lead_form')
    BEGIN
        INSERT INTO [mstMasterMenu]
            ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
        VALUES
            (NEWID(), @LeadListGUID, @CrmModuleGUID, 1, 'Lead Form', '/crm/leads/:id', 'hidden', 0, 'Target', 1, 'crm_lead_form', 0, 'CRM', @CrmFormTemplateGUID, 0);
        PRINT '    ✓ Lead Form menu created'
    END
END

-- 3. Contacts
DECLARE @ContactListGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_contact_list')
BEGIN
    INSERT INTO [mstMasterMenu]
        ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
    VALUES
        (@ContactListGUID, NULL, @CrmModuleGUID, 30, 'Contacts', '/crm/contacts', 'sidebar', 1, 'Contact', 1, 'crm_contact_list', 0, 'CRM', @CrmListTemplateGUID, 1);
    PRINT '  ✓ Contacts menu created'

    -- Contact Form
    IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_contact_form')
    BEGIN
        INSERT INTO [mstMasterMenu]
            ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
        VALUES
            (NEWID(), @ContactListGUID, @CrmModuleGUID, 1, 'Contact Form', '/crm/contacts/:id', 'hidden', 0, 'Contact', 1, 'crm_contact_form', 0, 'CRM', @CrmFormTemplateGUID, 0);
        PRINT '    ✓ Contact Form menu created'
    END
END

-- 4. Accounts
DECLARE @AccountListGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_account_list')
BEGIN
    INSERT INTO [mstMasterMenu]
        ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
    VALUES
        (@AccountListGUID, NULL, @CrmModuleGUID, 40, 'Accounts', '/crm/accounts', 'sidebar', 1, 'Building2', 1, 'crm_account_list', 0, 'CRM', @CrmListTemplateGUID, 1);
    PRINT '  ✓ Accounts menu created'

    -- Account Form
    IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_account_form')
    BEGIN
        INSERT INTO [mstMasterMenu]
            ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
        VALUES
            (NEWID(), @AccountListGUID, @CrmModuleGUID, 1, 'Account Form', '/crm/accounts/:id', 'hidden', 0, 'Building2', 1, 'crm_account_form', 0, 'CRM', @CrmFormTemplateGUID, 0);
        PRINT '    ✓ Account Form menu created'
    END
END

-- 5. Opportunities
DECLARE @OpportunityListGUID uniqueidentifier = NEWID();
IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_opportunity_list')
BEGIN
    INSERT INTO [mstMasterMenu]
        ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
    VALUES
        (@OpportunityListGUID, NULL, @CrmModuleGUID, 50, 'Opportunities', '/crm/opportunities', 'sidebar', 1, 'TrendingUp', 1, 'crm_opportunity_list', 0, 'CRM', @CrmListTemplateGUID, 1);
    PRINT '  ✓ Opportunities menu created'

    -- Opportunity Form
    IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_opportunity_form')
    BEGIN
        INSERT INTO [mstMasterMenu]
            ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
        VALUES
            (NEWID(), @OpportunityListGUID, @CrmModuleGUID, 1, 'Opportunity Form', '/crm/opportunities/:id', 'hidden', 0, 'TrendingUp', 1, 'crm_opportunity_form', 0, 'CRM', @CrmFormTemplateGUID, 0);
        PRINT '    ✓ Opportunity Form menu created'
    END

    -- Opportunity Board
    IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_opportunity_board')
    BEGIN
        INSERT INTO [mstMasterMenu]
            ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
        VALUES
            (NEWID(), @OpportunityListGUID, @CrmModuleGUID, 2, 'Opportunity Board', '/crm/opportunities/board', 'hidden', 0, 'Kanban', 1, 'crm_opportunity_board', 0, 'CRM', @CrmListTemplateGUID, 0);
        PRINT '    ✓ Opportunity Board menu created'
    END
END

-- 6. Activities
IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_activity_list')
BEGIN
    INSERT INTO [mstMasterMenu]
        ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
    VALUES
        (NEWID(), NULL, @CrmModuleGUID, 60, 'Activities', '/crm/activities', 'sidebar', 0, 'Activity', 1, 'crm_activity_list', 0, 'CRM', @CrmListTemplateGUID, 1);
    PRINT '  ✓ Activities menu created'
END

-- 7. Pipelines
IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_pipeline_list')
BEGIN
    INSERT INTO [mstMasterMenu]
        ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
    VALUES
        (NEWID(), NULL, @CrmModuleGUID, 70, 'Pipelines', '/crm/pipelines', 'sidebar', 0, 'GitBranch', 1, 'crm_pipeline_list', 0, 'CRM', @CrmListTemplateGUID, 1);
    PRINT '  ✓ Pipelines menu created'
END

PRINT ''

-- =====================================================
-- SUMMARY & VERIFICATION
-- =====================================================
PRINT '=============================================='
PRINT 'CRM Seed Data Installation Complete!'
PRINT '=============================================='
PRINT ''
PRINT 'Summary:'
PRINT '  ✅ Module: CRM'
PRINT '  ✅ Page Templates: 3'
PRINT '  ✅ Picklist Types: 6'
PRINT '  ✅ Picklist Values: 36'
PRINT '  ✅ Master Menus: 12 (7 visible + 5 hidden)'
PRINT ''
PRINT 'Verification Queries:'
PRINT '=============================================='
GO

-- Verification: Show all created data
PRINT 'CRM Module:'
SELECT strModuleGUID, strName, strDesc, bolIsActive FROM mstModule WHERE strName = 'CRM';

PRINT ''
PRINT 'Page Templates:'
SELECT strPageTemplateName, bolIsSave, bolIsView, bolIsEdit, bolIsDelete FROM mstPageTemplate WHERE strPageTemplateName LIKE 'CRM%';

PRINT ''
PRINT 'Picklist Types:'
SELECT strType, strDescription FROM mstPicklistType WHERE strType LIKE '%Lead%' OR strType LIKE '%Contact%' OR strType LIKE '%Opportunity%' OR strType LIKE '%Activity%';

PRINT ''
PRINT 'Master Menus (Sidebar):'
SELECT strName, strMapKey, strPath, dblSeqNo
FROM mstMasterMenu
WHERE strCategory = 'CRM' AND strMenuPosition = 'sidebar'
ORDER BY dblSeqNo;

PRINT ''
PRINT '=============================================='
PRINT 'Installation Complete! ✅'
PRINT '=============================================='
GO
