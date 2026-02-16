-- =====================================================
-- CRM SEED DATA VERIFICATION SCRIPT
-- =====================================================
-- Run this script after executing CRM_Complete_Seed_Script.sql
-- to verify all data has been created correctly
-- =====================================================

SET NOCOUNT ON;
GO

PRINT '=============================================='
PRINT 'CRM Seed Data Verification'
PRINT '=============================================='
PRINT ''

-- =====================================================
-- 1. MODULE VERIFICATION
-- =====================================================
PRINT '→ STEP 1: Verifying Module...'
DECLARE @ModuleCount INT;
SELECT @ModuleCount = COUNT(*) FROM mstModule WHERE strName = 'CRM';

IF @ModuleCount = 1
BEGIN
    PRINT '  ✅ CRM Module exists'
    SELECT
        '  GUID: ' + CAST(strModuleGUID AS VARCHAR(36)) AS Info,
        '  Active: ' + CASE WHEN bolIsActive = 1 THEN 'Yes' ELSE 'No' END AS Status
    FROM mstModule WHERE strName = 'CRM';
END
ELSE IF @ModuleCount = 0
BEGIN
    PRINT '  ❌ ERROR: CRM Module NOT found!'
END
ELSE
BEGIN
    PRINT '  ⚠️  WARNING: Multiple CRM modules found (' + CAST(@ModuleCount AS VARCHAR(10)) + ')'
END
PRINT ''

-- =====================================================
-- 2. PAGE TEMPLATES VERIFICATION
-- =====================================================
PRINT '→ STEP 2: Verifying Page Templates...'
SELECT
    strPageTemplateName AS [Template Name],
    CASE WHEN bolIsSave = 1 THEN '✅' ELSE '❌' END AS [Save],
    CASE WHEN bolIsView = 1 THEN '✅' ELSE '❌' END AS [View],
    CASE WHEN bolIsEdit = 1 THEN '✅' ELSE '❌' END AS [Edit],
    CASE WHEN bolIsDelete = 1 THEN '✅' ELSE '❌' END AS [Delete],
    CASE WHEN bolIsPrint = 1 THEN '✅' ELSE '❌' END AS [Print],
    CASE WHEN bolIsExport = 1 THEN '✅' ELSE '❌' END AS [Export]
FROM mstPageTemplate
WHERE strPageTemplateName LIKE 'CRM%'
ORDER BY strPageTemplateName;

DECLARE @TemplateCount INT;
SELECT @TemplateCount = COUNT(*) FROM mstPageTemplate WHERE strPageTemplateName LIKE 'CRM%';
PRINT '  Total Templates: ' + CAST(@TemplateCount AS VARCHAR(10)) + ' (Expected: 3)'

IF @TemplateCount = 3
    PRINT '  ✅ All page templates created'
ELSE
    PRINT '  ⚠️  WARNING: Expected 3 templates, found ' + CAST(@TemplateCount AS VARCHAR(10))
PRINT ''

-- =====================================================
-- 3. PICKLIST TYPES VERIFICATION
-- =====================================================
PRINT '→ STEP 3: Verifying Picklist Types...'
SELECT
    strType AS [Picklist Type],
    strDescription AS [Description],
    (SELECT COUNT(*) FROM mstPickListValue WHERE strPicklistTypeGUID = pt.strPicklistTypeGUID) AS [Values Count],
    CASE WHEN bolIsActive = 1 THEN '✅ Active' ELSE '❌ Inactive' END AS [Status]
FROM mstPicklistType pt
WHERE strType IN ('Lead_Status', 'Lead_Source', 'Contact_Status', 'Contact_Lifecycle_Stage', 'Opportunity_Stage', 'Activity_Type')
ORDER BY strType;

DECLARE @PicklistTypeCount INT;
SELECT @PicklistTypeCount = COUNT(*) FROM mstPicklistType
WHERE strType IN ('Lead_Status', 'Lead_Source', 'Contact_Status', 'Contact_Lifecycle_Stage', 'Opportunity_Stage', 'Activity_Type');

PRINT '  Total Picklist Types: ' + CAST(@PicklistTypeCount AS VARCHAR(10)) + ' (Expected: 6)'

IF @PicklistTypeCount = 6
    PRINT '  ✅ All picklist types created'
ELSE
    PRINT '  ⚠️  WARNING: Expected 6 picklist types, found ' + CAST(@PicklistTypeCount AS VARCHAR(10))
PRINT ''

-- =====================================================
-- 4. PICKLIST VALUES VERIFICATION
-- =====================================================
PRINT '→ STEP 4: Verifying Picklist Values...'

-- Lead Status
PRINT '  Lead Status Values:'
SELECT '    ' + strValue AS [Value]
FROM mstPickListValue pv
JOIN mstPicklistType pt ON pv.strPicklistTypeGUID = pt.strPicklistTypeGUID
WHERE pt.strType = 'Lead_Status' AND pv.bolIsActive = 1
ORDER BY strValue;

-- Lead Source
PRINT '  Lead Source Values:'
SELECT '    ' + strValue AS [Value]
FROM mstPickListValue pv
JOIN mstPicklistType pt ON pv.strPicklistTypeGUID = pt.strPicklistTypeGUID
WHERE pt.strType = 'Lead_Source' AND pv.bolIsActive = 1
ORDER BY strValue;

-- Contact Status
PRINT '  Contact Status Values:'
SELECT '    ' + strValue AS [Value]
FROM mstPickListValue pv
JOIN mstPicklistType pt ON pv.strPicklistTypeGUID = pt.strPicklistTypeGUID
WHERE pt.strType = 'Contact_Status' AND pv.bolIsActive = 1
ORDER BY strValue;

-- Contact Lifecycle Stage
PRINT '  Contact Lifecycle Stage Values:'
SELECT '    ' + strValue AS [Value]
FROM mstPickListValue pv
JOIN mstPicklistType pt ON pv.strPicklistTypeGUID = pt.strPicklistTypeGUID
WHERE pt.strType = 'Contact_Lifecycle_Stage' AND pv.bolIsActive = 1
ORDER BY strValue;

-- Opportunity Stage
PRINT '  Opportunity Stage Values:'
SELECT '    ' + strValue AS [Value]
FROM mstPickListValue pv
JOIN mstPicklistType pt ON pv.strPicklistTypeGUID = pt.strPicklistTypeGUID
WHERE pt.strType = 'Opportunity_Stage' AND pv.bolIsActive = 1
ORDER BY strValue;

-- Activity Type
PRINT '  Activity Type Values:'
SELECT '    ' + strValue AS [Value]
FROM mstPickListValue pv
JOIN mstPicklistType pt ON pv.strPicklistTypeGUID = pt.strPicklistTypeGUID
WHERE pt.strType = 'Activity_Type' AND pv.bolIsActive = 1
ORDER BY strValue;

DECLARE @PicklistValueCount INT;
SELECT @PicklistValueCount = COUNT(*)
FROM mstPickListValue pv
JOIN mstPicklistType pt ON pv.strPicklistTypeGUID = pt.strPicklistTypeGUID
WHERE pt.strType IN ('Lead_Status', 'Lead_Source', 'Contact_Status', 'Contact_Lifecycle_Stage', 'Opportunity_Stage', 'Activity_Type');

PRINT ''
PRINT '  Total Picklist Values: ' + CAST(@PicklistValueCount AS VARCHAR(10)) + ' (Expected: 35)'

IF @PicklistValueCount >= 35
    PRINT '  ✅ All picklist values created'
ELSE
    PRINT '  ⚠️  WARNING: Expected 35+ picklist values, found ' + CAST(@PicklistValueCount AS VARCHAR(10))
PRINT ''

-- =====================================================
-- 5. MASTER MENUS VERIFICATION
-- =====================================================
PRINT '→ STEP 5: Verifying Master Menus...'

-- Sidebar Menus
PRINT '  Sidebar Menus (Visible):'
SELECT
    '    ' + CAST(dblSeqNo AS VARCHAR(10)) + '. ' + strName AS [Menu],
    strMapKey AS [Map Key],
    strPath AS [Path],
    strIconName AS [Icon]
FROM mstMasterMenu
WHERE strCategory = 'CRM' AND strMenuPosition = 'sidebar'
ORDER BY dblSeqNo;

-- Hidden Menus
PRINT ''
PRINT '  Hidden Menus:'
SELECT
    '    ' + strName AS [Menu],
    strMapKey AS [Map Key],
    strPath AS [Path],
    pm.strName AS [Parent Menu]
FROM mstMasterMenu m
LEFT JOIN mstMasterMenu pm ON m.strParentMenuGUID = pm.strMasterMenuGUID
WHERE m.strCategory = 'CRM' AND m.strMenuPosition = 'hidden'
ORDER BY m.strName;

DECLARE @MenuCount INT, @VisibleMenuCount INT, @HiddenMenuCount INT;
SELECT @MenuCount = COUNT(*) FROM mstMasterMenu WHERE strCategory = 'CRM';
SELECT @VisibleMenuCount = COUNT(*) FROM mstMasterMenu WHERE strCategory = 'CRM' AND strMenuPosition = 'sidebar';
SELECT @HiddenMenuCount = COUNT(*) FROM mstMasterMenu WHERE strCategory = 'CRM' AND strMenuPosition = 'hidden';

PRINT ''
PRINT '  Total Menus: ' + CAST(@MenuCount AS VARCHAR(10)) + ' (Expected: 12)'
PRINT '  Visible: ' + CAST(@VisibleMenuCount AS VARCHAR(10)) + ' (Expected: 7)'
PRINT '  Hidden: ' + CAST(@HiddenMenuCount AS VARCHAR(10)) + ' (Expected: 5)'

IF @MenuCount = 12 AND @VisibleMenuCount = 7 AND @HiddenMenuCount = 5
    PRINT '  ✅ All master menus created correctly'
ELSE
    PRINT '  ⚠️  WARNING: Menu counts do not match expected values'
PRINT ''

-- =====================================================
-- 6. TEMPLATE LINKAGE VERIFICATION
-- =====================================================
PRINT '→ STEP 6: Verifying Menu-Template Linkage...'
SELECT
    m.strName AS [Menu Name],
    m.strMapKey AS [Map Key],
    CASE WHEN m.strPageTemplateGUID IS NOT NULL THEN '✅ Linked' ELSE '⚠️  Not Linked' END AS [Template Status],
    pt.strPageTemplateName AS [Template Name]
FROM mstMasterMenu m
LEFT JOIN mstPageTemplate pt ON m.strPageTemplateGUID = pt.strPageTemplateGUID
WHERE m.strCategory = 'CRM' AND m.strMenuPosition = 'sidebar'
ORDER BY m.dblSeqNo;

DECLARE @LinkedMenuCount INT;
SELECT @LinkedMenuCount = COUNT(*)
FROM mstMasterMenu
WHERE strCategory = 'CRM' AND strPageTemplateGUID IS NOT NULL;

PRINT '  Linked Menus: ' + CAST(@LinkedMenuCount AS VARCHAR(10))
PRINT ''

-- =====================================================
-- 7. ORPHAN CHECK (Menus without valid parent)
-- =====================================================
PRINT '→ STEP 7: Checking for Orphan Menus...'
DECLARE @OrphanCount INT;
SELECT @OrphanCount = COUNT(*)
FROM mstMasterMenu m
WHERE m.strCategory = 'CRM'
  AND m.strParentMenuGUID IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM mstMasterMenu p
      WHERE p.strMasterMenuGUID = m.strParentMenuGUID
  );

IF @OrphanCount = 0
    PRINT '  ✅ No orphan menus found'
ELSE
BEGIN
    PRINT '  ❌ ERROR: Found ' + CAST(@OrphanCount AS VARCHAR(10)) + ' orphan menu(s)!'
    SELECT
        strName AS [Orphan Menu],
        strMapKey AS [Map Key],
        CAST(strParentMenuGUID AS VARCHAR(36)) AS [Invalid Parent GUID]
    FROM mstMasterMenu m
    WHERE m.strCategory = 'CRM'
      AND m.strParentMenuGUID IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM mstMasterMenu p
          WHERE p.strMasterMenuGUID = m.strParentMenuGUID
      );
END
PRINT ''

-- =====================================================
-- FINAL SUMMARY
-- =====================================================
PRINT '=============================================='
PRINT 'FINAL SUMMARY'
PRINT '=============================================='

-- Count all records
DECLARE @TotalRecords INT = 0;
DECLARE @ExpectedRecords INT = 57; -- 1 module + 3 templates + 6 types + 35 values + 12 menus

SELECT @TotalRecords =
    (SELECT COUNT(*) FROM mstModule WHERE strName = 'CRM') +
    (SELECT COUNT(*) FROM mstPageTemplate WHERE strPageTemplateName LIKE 'CRM%') +
    (SELECT COUNT(*) FROM mstPicklistType WHERE strType IN ('Lead_Status', 'Lead_Source', 'Contact_Status', 'Contact_Lifecycle_Stage', 'Opportunity_Stage', 'Activity_Type')) +
    (SELECT COUNT(*) FROM mstPickListValue pv JOIN mstPicklistType pt ON pv.strPicklistTypeGUID = pt.strPicklistTypeGUID WHERE pt.strType IN ('Lead_Status', 'Lead_Source', 'Contact_Status', 'Contact_Lifecycle_Stage', 'Opportunity_Stage', 'Activity_Type')) +
    (SELECT COUNT(*) FROM mstMasterMenu WHERE strCategory = 'CRM');

PRINT 'Total Records Created: ' + CAST(@TotalRecords AS VARCHAR(10))
PRINT 'Expected Records: ' + CAST(@ExpectedRecords AS VARCHAR(10))
PRINT ''

-- Status check
DECLARE @AllChecksPass BIT = 1;

IF @ModuleCount <> 1 SET @AllChecksPass = 0;
IF @TemplateCount <> 3 SET @AllChecksPass = 0;
IF @PicklistTypeCount <> 6 SET @AllChecksPass = 0;
IF @PicklistValueCount < 35 SET @AllChecksPass = 0;
IF @MenuCount <> 12 SET @AllChecksPass = 0;
IF @OrphanCount > 0 SET @AllChecksPass = 0;

IF @AllChecksPass = 1
BEGIN
    PRINT '✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅'
    PRINT '✅  ALL CHECKS PASSED!              ✅'
    PRINT '✅  CRM Seed Data is PERFECT!       ✅'
    PRINT '✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅'
END
ELSE
BEGIN
    PRINT '⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️'
    PRINT '⚠️   SOME CHECKS FAILED!           ⚠️'
    PRINT '⚠️   Review errors above            ⚠️'
    PRINT '⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️'
END

PRINT '=============================================='
GO
