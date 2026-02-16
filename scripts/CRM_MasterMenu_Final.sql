-- =====================================================
-- CRM MODULE - MASTER MENU INSERT SCRIPT
-- =====================================================
-- Creates master menus for CRM Module with FLAT structure
-- (No parent "CRM" menu - all menus are individual sidebar items)
-- =====================================================
-- Features:
--   ✓ CRM Dashboard
--   ✓ Leads (with form page)
--   ✓ Contacts (with form page)
--   ✓ Accounts (with form page)
--   ✓ Opportunities (with form + board pages)
--   ✓ Activities
--   ✓ Pipelines
-- =====================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- STEP 1: Declare CRM Module GUID
-- =====================================================
DECLARE @CrmModuleGUID uniqueidentifier = NULL;

-- Auto-fetch CRM Module GUID from mstModule table
SELECT @CrmModuleGUID = strModuleGUID FROM mstModule WHERE strName = 'CRM';

-- If CRM module doesn't exist, you can set it manually:
-- SET @CrmModuleGUID = 'YOUR-CRM-MODULE-GUID-HERE';

PRINT '=============================================='
PRINT 'CRM Master Menu Installation'
PRINT '=============================================='
IF @CrmModuleGUID IS NULL
BEGIN
    PRINT 'WARNING: CRM Module GUID not found!'
    PRINT 'Please create CRM module first or set @CrmModuleGUID manually.'
    PRINT '=============================================='
END
ELSE
BEGIN
    PRINT 'CRM Module GUID: ' + CAST(@CrmModuleGUID AS VARCHAR(36))
    PRINT '=============================================='
END
PRINT ''

-- =====================================================
-- STEP 2: Create CRM Menus (Flat Structure)
-- =====================================================
PRINT 'Creating CRM Module Menus...'
PRINT ''

-- 1. Dashboard (Single menu - visible in sidebar)
PRINT '→ Creating Dashboard...'
DECLARE @CrmDashboardGUID uniqueidentifier = NEWID();
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (@CrmDashboardGUID, NULL, @CrmModuleGUID, 10, 'Dashboard', '/crm/dashboard', 'sidebar', 0, 'LayoutDashboard', 1, 'crm_dashboard', 0, 'CRM', NULL, 1);
PRINT '  ✓ Dashboard created (crm_dashboard)'

-- 2. Leads (List page - visible in sidebar)
PRINT '→ Creating Leads menu...'
DECLARE @LeadListGUID uniqueidentifier = NEWID();
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (@LeadListGUID, NULL, @CrmModuleGUID, 20, 'Leads', '/crm/leads', 'sidebar', 1, 'Target', 1, 'crm_lead_list', 0, 'CRM', NULL, 1);
PRINT '  ✓ Leads list created (crm_lead_list)'

    -- 2.1 Lead Form (Hidden - child of Leads list)
    INSERT INTO [mstMasterMenu]
        ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
    VALUES
        (NEWID(), @LeadListGUID, @CrmModuleGUID, 1, 'Lead Form', '/crm/leads/:id', 'hidden', 0, 'Target', 1, 'crm_lead_form', 0, 'CRM', NULL, 0);
    PRINT '    ✓ Lead Form created (crm_lead_form) - hidden'

-- 3. Contacts (List page - visible in sidebar)
PRINT '→ Creating Contacts menu...'
DECLARE @ContactListGUID uniqueidentifier = NEWID();
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (@ContactListGUID, NULL, @CrmModuleGUID, 30, 'Contacts', '/crm/contacts', 'sidebar', 1, 'Contact', 1, 'crm_contact_list', 0, 'CRM', NULL, 1);
PRINT '  ✓ Contacts list created (crm_contact_list)'

    -- 3.1 Contact Form (Hidden - child of Contacts list)
    INSERT INTO [mstMasterMenu]
        ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
    VALUES
        (NEWID(), @ContactListGUID, @CrmModuleGUID, 1, 'Contact Form', '/crm/contacts/:id', 'hidden', 0, 'Contact', 1, 'crm_contact_form', 0, 'CRM', NULL, 0);
    PRINT '    ✓ Contact Form created (crm_contact_form) - hidden'

-- 4. Accounts (List page - visible in sidebar)
PRINT '→ Creating Accounts menu...'
DECLARE @AccountListGUID uniqueidentifier = NEWID();
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (@AccountListGUID, NULL, @CrmModuleGUID, 40, 'Accounts', '/crm/accounts', 'sidebar', 1, 'Building2', 1, 'crm_account_list', 0, 'CRM', NULL, 1);
PRINT '  ✓ Accounts list created (crm_account_list)'

    -- 4.1 Account Form (Hidden - child of Accounts list)
    INSERT INTO [mstMasterMenu]
        ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
    VALUES
        (NEWID(), @AccountListGUID, @CrmModuleGUID, 1, 'Account Form', '/crm/accounts/:id', 'hidden', 0, 'Building2', 1, 'crm_account_form', 0, 'CRM', NULL, 0);
    PRINT '    ✓ Account Form created (crm_account_form) - hidden'

-- 5. Opportunities (List page - visible in sidebar)
PRINT '→ Creating Opportunities menu...'
DECLARE @OpportunityListGUID uniqueidentifier = NEWID();
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (@OpportunityListGUID, NULL, @CrmModuleGUID, 50, 'Opportunities', '/crm/opportunities', 'sidebar', 1, 'TrendingUp', 1, 'crm_opportunity_list', 0, 'CRM', NULL, 1);
PRINT '  ✓ Opportunities list created (crm_opportunity_list)'

    -- 5.1 Opportunity Form (Hidden - child of Opportunities list)
    INSERT INTO [mstMasterMenu]
        ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
    VALUES
        (NEWID(), @OpportunityListGUID, @CrmModuleGUID, 1, 'Opportunity Form', '/crm/opportunities/:id', 'hidden', 0, 'TrendingUp', 1, 'crm_opportunity_form', 0, 'CRM', NULL, 0);
    PRINT '    ✓ Opportunity Form created (crm_opportunity_form) - hidden'

    -- 5.2 Opportunity Board (Hidden - child of Opportunities list)
    INSERT INTO [mstMasterMenu]
        ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
    VALUES
        (NEWID(), @OpportunityListGUID, @CrmModuleGUID, 2, 'Opportunity Board', '/crm/opportunities/board', 'hidden', 0, 'Kanban', 1, 'crm_opportunity_board', 0, 'CRM', NULL, 0);
    PRINT '    ✓ Opportunity Board created (crm_opportunity_board) - hidden'

-- 6. Activities (Single menu - visible in sidebar)
PRINT '→ Creating Activities menu...'
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (NEWID(), NULL, @CrmModuleGUID, 60, 'Activities', '/crm/activities', 'sidebar', 0, 'Activity', 1, 'crm_activity_list', 0, 'CRM', NULL, 1);
PRINT '  ✓ Activities created (crm_activity_list)'

-- 7. Pipelines (Single menu - visible in sidebar)
PRINT '→ Creating Pipelines menu...'
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (NEWID(), NULL, @CrmModuleGUID, 70, 'Pipelines', '/crm/pipelines', 'sidebar', 0, 'GitBranch', 1, 'crm_pipeline_list', 0, 'CRM', NULL, 1);
PRINT '  ✓ Pipelines created (crm_pipeline_list)'

PRINT ''
PRINT '=============================================='
PRINT 'CRM Master Menu Installation Complete!'
PRINT '=============================================='
PRINT 'Summary:'
PRINT '  • Total Menus Created: 12'
PRINT '  • Visible in Sidebar: 7'
PRINT '  • Hidden Pages: 5'
PRINT ''
PRINT 'Sidebar Menus (in order):'
PRINT '  1. Dashboard'
PRINT '  2. Leads'
PRINT '  3. Contacts'
PRINT '  4. Accounts'
PRINT '  5. Opportunities'
PRINT '  6. Activities'
PRINT '  7. Pipelines'
PRINT ''
PRINT 'Hidden Pages:'
PRINT '  • Lead Form (/crm/leads/:id)'
PRINT '  • Contact Form (/crm/contacts/:id)'
PRINT '  • Account Form (/crm/accounts/:id)'
PRINT '  • Opportunity Form (/crm/opportunities/:id)'
PRINT '  • Opportunity Board (/crm/opportunities/board)'
PRINT '=============================================='
PRINT ''
PRINT 'Next Steps:'
PRINT '  1. Verify menus in database'
PRINT '  2. Assign rights to user roles (mstUserRights)'
PRINT '  3. Test frontend navigation'
PRINT '=============================================='
GO

-- =====================================================
-- Verification Query
-- =====================================================
PRINT 'Verification: Listing all created CRM menus...'
PRINT ''
SELECT
    strName AS MenuName,
    strMapKey AS MapKey,
    strPath AS Path,
    strMenuPosition AS Position,
    CASE WHEN bolIsSingleMenu = 1 THEN 'Yes' ELSE 'No' END AS IsSingleMenu,
    CASE WHEN bolHasSubMenu = 1 THEN 'Yes' ELSE 'No' END AS HasSubMenu,
    strIconName AS Icon,
    dblSeqNo AS SeqNo
FROM mstMasterMenu
WHERE strCategory = 'CRM'
ORDER BY dblSeqNo, strPath;
GO
