-- =====================================================
-- CRM Master Menu Insert Script
-- Table: mstMasterMenu
-- =====================================================
-- NOTE: strModuleGUID is left NULL here.
-- Replace NULL with the actual CRM Module GUID from your mstModule table if needed.
-- Example: SET @CrmModuleGUID = 'YOUR-CRM-MODULE-GUID-HERE';
-- =====================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Step 1: Declare CRM Module GUID variable (update this with your actual CRM module GUID)
DECLARE @CrmModuleGUID uniqueidentifier = NULL;

-- If CRM module already exists in mstModule, uncomment and use:
-- SELECT @CrmModuleGUID = strModuleGUID FROM mstModule WHERE strName = 'CRM';

-- =====================================================
-- Step 2: Parent Menu - CRM (Top-level sidebar group)
-- =====================================================
DECLARE @CrmParentGUID uniqueidentifier = NEWID();

INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (@CrmParentGUID, NULL, @CrmModuleGUID, 100, 'CRM', '/crm', 'sidebar', 1, 'UsersRound', 1, 'crm', 0, 'CRM', NULL, 0);

-- =====================================================
-- Step 3: CRM Sub-Menus (Children of CRM parent)
-- =====================================================

-- 3.1 Leads (List page - shown in sidebar)
DECLARE @LeadListGUID uniqueidentifier = NEWID();
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (@LeadListGUID, @CrmParentGUID, @CrmModuleGUID, 1, 'Leads', '/crm/leads', 'sidebar', 0, 'Target', 1, 'crm_lead_list', 0, 'CRM', NULL, 0);

-- 3.2 Lead Form (Hidden - accessed via lead list)
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (NEWID(), @LeadListGUID, @CrmModuleGUID, 1, 'Lead Form', '/crm/leads/:id', 'hidden', 0, 'Target', 1, 'crm_lead_form', 0, 'CRM', NULL, 0);

-- 3.3 Contacts (List page - shown in sidebar)
DECLARE @ContactListGUID uniqueidentifier = NEWID();
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (@ContactListGUID, @CrmParentGUID, @CrmModuleGUID, 2, 'Contacts', '/crm/contacts', 'sidebar', 0, 'Contact', 1, 'crm_contact_list', 0, 'CRM', NULL, 0);

-- 3.4 Contact Form (Hidden - accessed via contact list)
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (NEWID(), @ContactListGUID, @CrmModuleGUID, 1, 'Contact Form', '/crm/contacts/:id', 'hidden', 0, 'Contact', 1, 'crm_contact_form', 0, 'CRM', NULL, 0);

-- 3.5 Accounts (List page - shown in sidebar)
DECLARE @AccountListGUID uniqueidentifier = NEWID();
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (@AccountListGUID, @CrmParentGUID, @CrmModuleGUID, 3, 'Accounts', '/crm/accounts', 'sidebar', 0, 'Building2', 1, 'crm_account_list', 0, 'CRM', NULL, 0);

-- 3.6 Account Form (Hidden - accessed via account list)
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (NEWID(), @AccountListGUID, @CrmModuleGUID, 1, 'Account Form', '/crm/accounts/:id', 'hidden', 0, 'Building2', 1, 'crm_account_form', 0, 'CRM', NULL, 0);

-- 3.7 Opportunities (List page - shown in sidebar)
DECLARE @OpportunityListGUID uniqueidentifier = NEWID();
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (@OpportunityListGUID, @CrmParentGUID, @CrmModuleGUID, 4, 'Opportunities', '/crm/opportunities', 'sidebar', 0, 'TrendingUp', 1, 'crm_opportunity_list', 0, 'CRM', NULL, 0);

-- 3.8 Opportunity Form (Hidden - accessed via opportunity list)
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (NEWID(), @OpportunityListGUID, @CrmModuleGUID, 1, 'Opportunity Form', '/crm/opportunities/:id', 'hidden', 0, 'TrendingUp', 1, 'crm_opportunity_form', 0, 'CRM', NULL, 0);

-- 3.9 Opportunity Board (Hidden - accessed via opportunity list/button)
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (NEWID(), @OpportunityListGUID, @CrmModuleGUID, 2, 'Opportunity Board', '/crm/opportunities/board', 'hidden', 0, 'Kanban', 1, 'crm_opportunity_board', 0, 'CRM', NULL, 0);

-- 3.10 Activities (List page - shown in sidebar)
INSERT INTO [mstMasterMenu]
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (NEWID(), @CrmParentGUID, @CrmModuleGUID, 5, 'Activities', '/crm/activities', 'sidebar', 0, 'Activity', 1, 'crm_activity_list', 0, 'CRM', NULL, 0);


-- =====================================================
-- SUMMARY OF MAP KEYS (for reference):
-- =====================================================
-- crm                    -> CRM Parent Menu (sidebar group)
-- crm_lead_list          -> Leads List Page
-- crm_lead_form          -> Lead Create/Edit Form (hidden)
-- crm_contact_list       -> Contacts List Page
-- crm_contact_form       -> Contact Create/Edit Form (hidden)
-- crm_account_list       -> Accounts List Page
-- crm_account_form       -> Account Create/Edit Form (hidden)
-- crm_opportunity_list   -> Opportunities List Page
-- crm_opportunity_form   -> Opportunity Create/Edit Form (hidden)
-- crm_opportunity_board  -> Opportunity Kanban Board (hidden)
-- crm_activity_list      -> Activities Timeline Page
-- =====================================================

-- =====================================================
-- MENU HIERARCHY:
-- =====================================================
-- CRM (parent, sidebar)
--   |-- Leads (sidebar)
--   |     |-- Lead Form (hidden)
--   |-- Contacts (sidebar)
--   |     |-- Contact Form (hidden)
--   |-- Accounts (sidebar)
--   |     |-- Account Form (hidden)
--   |-- Opportunities (sidebar)
--   |     |-- Opportunity Form (hidden)
--   |     |-- Opportunity Board (hidden)
--   |-- Activities (sidebar)
-- =====================================================
