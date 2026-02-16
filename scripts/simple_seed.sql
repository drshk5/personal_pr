-- Simple CRM Seed Script
PRINT '========================================='
PRINT 'CRM Seed Data Installation Started'
PRINT '========================================='

DECLARE @SystemUserGUID uniqueidentifier;
DECLARE @GroupGUID uniqueidentifier;

-- Auto-fetch first user and group
SELECT TOP 1 @SystemUserGUID = strUserGUID FROM mstUser;
SELECT TOP 1 @GroupGUID = strGroupGUID FROM mstGroup;

PRINT 'User GUID: ' + ISNULL(CAST(@SystemUserGUID AS VARCHAR(36)), 'NOT FOUND')
PRINT 'Group GUID: ' + ISNULL(CAST(@GroupGUID AS VARCHAR(36)), 'NOT FOUND')

-- Fallback defaults
IF @SystemUserGUID IS NULL SET @SystemUserGUID = '00000000-0000-0000-0000-000000000001';
IF @GroupGUID IS NULL SET @GroupGUID = NEWID();

-- 1. Create CRM Module
DECLARE @CrmModuleGUID uniqueidentifier;
IF EXISTS (SELECT 1 FROM mstModule WHERE strName = 'CRM')
    SELECT @CrmModuleGUID = strModuleGUID FROM mstModule WHERE strName = 'CRM'
ELSE
BEGIN
    SET @CrmModuleGUID = NEWID();
    INSERT INTO mstModule (strModuleGUID, strName, strDesc, bolIsActive, strCreatedByGUID, dtCreatedOn)
    VALUES (@CrmModuleGUID, 'CRM', 'Customer Relationship Management', 1, @SystemUserGUID, GETUTCDATE());
END
PRINT 'CRM Module: OK'

-- 2. Create Page Templates
DECLARE @CrmListTemplateGUID uniqueidentifier;
IF NOT EXISTS (SELECT 1 FROM mstPageTemplate WHERE strPageTemplateName = 'CRM_List_Template')
BEGIN
    SET @CrmListTemplateGUID = NEWID();
    INSERT INTO mstPageTemplate (strPageTemplateGUID, strPageTemplateName, bolIsView, bolIsPrint, bolIsExport, strCreatedByGUID, dtCreated, bolIsSystemCreated)
    VALUES (@CrmListTemplateGUID, 'CRM_List_Template', 1, 1, 1, @SystemUserGUID, GETUTCDATE(), 1);
END
ELSE
    SELECT @CrmListTemplateGUID = strPageTemplateGUID FROM mstPageTemplate WHERE strPageTemplateName = 'CRM_List_Template';
PRINT 'CRM List Template: OK'

DECLARE @CrmFormTemplateGUID uniqueidentifier;
IF NOT EXISTS (SELECT 1 FROM mstPageTemplate WHERE strPageTemplateName = 'CRM_Form_Template')
BEGIN
    SET @CrmFormTemplateGUID = NEWID();
    INSERT INTO mstPageTemplate (strPageTemplateGUID, strPageTemplateName, bolIsSave, bolIsView, bolIsEdit, bolIsDelete, strCreatedByGUID, dtCreated, bolIsSystemCreated)
    VALUES (@CrmFormTemplateGUID, 'CRM_Form_Template', 1, 1, 1, 1, @SystemUserGUID, GETUTCDATE(), 1);
END
ELSE
    SELECT @CrmFormTemplateGUID = strPageTemplateGUID FROM mstPageTemplate WHERE strPageTemplateName = 'CRM_Form_Template';
PRINT 'CRM Form Template: OK'

DECLARE @CrmDashboardTemplateGUID uniqueidentifier;
IF NOT EXISTS (SELECT 1 FROM mstPageTemplate WHERE strPageTemplateName = 'CRM_Dashboard_Template')
BEGIN
    SET @CrmDashboardTemplateGUID = NEWID();
    INSERT INTO mstPageTemplate (strPageTemplateGUID, strPageTemplateName, bolIsView, bolIsPrint, bolIsExport, strCreatedByGUID, dtCreated, bolIsSystemCreated)
    VALUES (@CrmDashboardTemplateGUID, 'CRM_Dashboard_Template', 1, 1, 1, @SystemUserGUID, GETUTCDATE(), 1);
END
ELSE
    SELECT @CrmDashboardTemplateGUID = strPageTemplateGUID FROM mstPageTemplate WHERE strPageTemplateName = 'CRM_Dashboard_Template';
PRINT 'CRM Dashboard Template: OK'

-- 3. Create Picklist Types
DECLARE @LeadStatusTypeGUID uniqueidentifier;
IF NOT EXISTS (SELECT 1 FROM mstPicklistType WHERE strType = 'Lead_Status')
BEGIN
    SET @LeadStatusTypeGUID = NEWID();
    INSERT INTO mstPicklistType (strPicklistTypeGUID, strType, strDescription, bolIsActive, strCreatedByGUID, dtCreatedOn)
    VALUES (@LeadStatusTypeGUID, 'Lead_Status', 'Lead Status', 1, @SystemUserGUID, GETUTCDATE());
END
ELSE
    SELECT @LeadStatusTypeGUID = strPicklistTypeGUID FROM mstPicklistType WHERE strType = 'Lead_Status';

DECLARE @LeadSourceTypeGUID uniqueidentifier;
IF NOT EXISTS (SELECT 1 FROM mstPicklistType WHERE strType = 'Lead_Source')
BEGIN
    SET @LeadSourceTypeGUID = NEWID();
    INSERT INTO mstPicklistType (strPicklistTypeGUID, strType, strDescription, bolIsActive, strCreatedByGUID, dtCreatedOn)
    VALUES (@LeadSourceTypeGUID, 'Lead_Source', 'Lead Source', 1, @SystemUserGUID, GETUTCDATE());
END
ELSE
    SELECT @LeadSourceTypeGUID = strPicklistTypeGUID FROM mstPicklistType WHERE strType = 'Lead_Source';

DECLARE @ContactStatusTypeGUID uniqueidentifier;
IF NOT EXISTS (SELECT 1 FROM mstPicklistType WHERE strType = 'Contact_Status')
BEGIN
    SET @ContactStatusTypeGUID = NEWID();
    INSERT INTO mstPicklistType (strPicklistTypeGUID, strType, strDescription, bolIsActive, strCreatedByGUID, dtCreatedOn)
    VALUES (@ContactStatusTypeGUID, 'Contact_Status', 'Contact Status', 1, @SystemUserGUID, GETUTCDATE());
END
ELSE
    SELECT @ContactStatusTypeGUID = strPicklistTypeGUID FROM mstPicklistType WHERE strType = 'Contact_Status';

DECLARE @OpportunityStageTypeGUID uniqueidentifier;
IF NOT EXISTS (SELECT 1 FROM mstPicklistType WHERE strType = 'Opportunity_Stage')
BEGIN
    SET @OpportunityStageTypeGUID = NEWID();
    INSERT INTO mstPicklistType (strPicklistTypeGUID, strType, strDescription, bolIsActive, strCreatedByGUID, dtCreatedOn)
    VALUES (@OpportunityStageTypeGUID, 'Opportunity_Stage', 'Opportunity Stage', 1, @SystemUserGUID, GETUTCDATE());
END
ELSE
    SELECT @OpportunityStageTypeGUID = strPicklistTypeGUID FROM mstPicklistType WHERE strType = 'Opportunity_Stage';

DECLARE @ActivityTypeGUID uniqueidentifier;
IF NOT EXISTS (SELECT 1 FROM mstPicklistType WHERE strType = 'Activity_Type')
BEGIN
    SET @ActivityTypeGUID = NEWID();
    INSERT INTO mstPicklistType (strPicklistTypeGUID, strType, strDescription, bolIsActive, strCreatedByGUID, dtCreatedOn)
    VALUES (@ActivityTypeGUID, 'Activity_Type', 'Activity Type', 1, @SystemUserGUID, GETUTCDATE());
END
ELSE
    SELECT @ActivityTypeGUID = strPicklistTypeGUID FROM mstPicklistType WHERE strType = 'Activity_Type';
PRINT 'Picklist Types: OK'

-- 4. Insert Picklist Values
IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadStatusTypeGUID AND strValue = 'New')
    INSERT INTO mstPickListValue (strPickListValueGUID, strValue, strPicklistTypeGUID, bolIsActive, strGroupGUID, strCreatedByGUID, dtCreatedOn)
    VALUES (NEWID(), 'New', @LeadStatusTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadStatusTypeGUID AND strValue = 'Contacted')
    INSERT INTO mstPickListValue (strPickListValueGUID, strValue, strPicklistTypeGUID, bolIsActive, strGroupGUID, strCreatedByGUID, dtCreatedOn)
    VALUES (NEWID(), 'Contacted', @LeadStatusTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadStatusTypeGUID AND strValue = 'Qualified')
    INSERT INTO mstPickListValue (strPickListValueGUID, strValue, strPicklistTypeGUID, bolIsActive, strGroupGUID, strCreatedByGUID, dtCreatedOn)
    VALUES (NEWID(), 'Qualified', @LeadStatusTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

IF NOT EXISTS (SELECT 1 FROM mstPickListValue WHERE strPicklistTypeGUID = @LeadStatusTypeGUID AND strValue = 'Converted')
    INSERT INTO mstPickListValue (strPickListValueGUID, strValue, strPicklistTypeGUID, bolIsActive, strGroupGUID, strCreatedByGUID, dtCreatedOn)
    VALUES (NEWID(), 'Converted', @LeadStatusTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());

PRINT 'Lead Status Values: OK'

-- 5. Create Master Menus
IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_dashboard')
    INSERT INTO mstMasterMenu (strMasterMenuGUID, strModuleGUID, dblSeqNo, strName, strPath, strMenuPosition, bolHasSubMenu, strIconName, bolIsActive, strMapKey, strCategory, strPageTemplateGUID, bolIsSingleMenu)
    VALUES (NEWID(), @CrmModuleGUID, 10, 'Dashboard', '/crm/dashboard', 'sidebar', 0, 'LayoutDashboard', 1, 'crm_dashboard', 'CRM', @CrmDashboardTemplateGUID, 1);

IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_lead_list')
    INSERT INTO mstMasterMenu (strMasterMenuGUID, strModuleGUID, dblSeqNo, strName, strPath, strMenuPosition, bolHasSubMenu, strIconName, bolIsActive, strMapKey, strCategory, strPageTemplateGUID, bolIsSingleMenu)
    VALUES (NEWID(), @CrmModuleGUID, 20, 'Leads', '/crm/leads', 'sidebar', 1, 'Target', 1, 'crm_lead_list', 'CRM', @CrmListTemplateGUID, 1);

IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_contact_list')
    INSERT INTO mstMasterMenu (strMasterMenuGUID, strModuleGUID, dblSeqNo, strName, strPath, strMenuPosition, bolHasSubMenu, strIconName, bolIsActive, strMapKey, strCategory, strPageTemplateGUID, bolIsSingleMenu)
    VALUES (NEWID(), @CrmModuleGUID, 30, 'Contacts', '/crm/contacts', 'sidebar', 1, 'Contact', 1, 'crm_contact_list', 'CRM', @CrmListTemplateGUID, 1);

IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_account_list')
    INSERT INTO mstMasterMenu (strMasterMenuGUID, strModuleGUID, dblSeqNo, strName, strPath, strMenuPosition, bolHasSubMenu, strIconName, bolIsActive, strMapKey, strCategory, strPageTemplateGUID, bolIsSingleMenu)
    VALUES (NEWID(), @CrmModuleGUID, 40, 'Accounts', '/crm/accounts', 'sidebar', 1, 'Building2', 1, 'crm_account_list', 'CRM', @CrmListTemplateGUID, 1);

IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_opportunity_list')
    INSERT INTO mstMasterMenu (strMasterMenuGUID, strModuleGUID, dblSeqNo, strName, strPath, strMenuPosition, bolHasSubMenu, strIconName, bolIsActive, strMapKey, strCategory, strPageTemplateGUID, bolIsSingleMenu)
    VALUES (NEWID(), @CrmModuleGUID, 50, 'Opportunities', '/crm/opportunities', 'sidebar', 1, 'TrendingUp', 1, 'crm_opportunity_list', 'CRM', @CrmListTemplateGUID, 1);

IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_activity_list')
    INSERT INTO mstMasterMenu (strMasterMenuGUID, strModuleGUID, dblSeqNo, strName, strPath, strMenuPosition, bolHasSubMenu, strIconName, bolIsActive, strMapKey, strCategory, strPageTemplateGUID, bolIsSingleMenu)
    VALUES (NEWID(), @CrmModuleGUID, 60, 'Activities', '/crm/activities', 'sidebar', 0, 'Activity', 1, 'crm_activity_list', 'CRM', @CrmListTemplateGUID, 1);

IF NOT EXISTS (SELECT 1 FROM mstMasterMenu WHERE strMapKey = 'crm_pipeline_list')
    INSERT INTO mstMasterMenu (strMasterMenuGUID, strModuleGUID, dblSeqNo, strName, strPath, strMenuPosition, bolHasSubMenu, strIconName, bolIsActive, strMapKey, strCategory, strPageTemplateGUID, bolIsSingleMenu)
    VALUES (NEWID(), @CrmModuleGUID, 70, 'Pipelines', '/crm/pipelines', 'sidebar', 0, 'GitBranch', 1, 'crm_pipeline_list', 'CRM', @CrmListTemplateGUID, 1);

PRINT 'Master Menus: OK'

PRINT '========================================='
PRINT '✅ CRM Seeding Complete!'
PRINT '========================================='

-- Verify
SELECT COUNT(*) as [CRM Modules] FROM mstModule WHERE strName = 'CRM';
SELECT COUNT(*) as [CRM Templates] FROM mstPageTemplate WHERE strPageTemplateName LIKE 'CRM%';
SELECT COUNT(*) as [CRM Picklist Types] FROM mstPicklistType WHERE strType LIKE '%Lead%' OR strType LIKE '%Contact%' OR strType LIKE '%Opportunity%' OR strType LIKE '%Activity%';
SELECT COUNT(*) as [CRM Menus] FROM mstMasterMenu WHERE strCategory = 'CRM';
