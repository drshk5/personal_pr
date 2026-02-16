# CRM Complete Seed Data Guide

## 📋 Overview

Yeh **single comprehensive script** hai jo **complete CRM module** ko setup karta hai. Sab kuch ek hi jagah - no field name mismatch, no table name error, perfect alignment!

---

## 🎯 What This Script Creates

### 1. **Module Entry** (mstModule)
| Field | Value |
|-------|-------|
| strName | `CRM` |
| strDesc | Customer Relationship Management - Manage leads, contacts, accounts, opportunities and activities |
| strSQlfilePath | `/crm/schema.sql` |
| strImagePath | `/assets/modules/crm-icon.png` |
| bolIsActive | `true` |

### 2. **Page Templates** (mstPageTemplate)
| Template Name | Save | View | Edit | Delete | Print | Export |
|--------------|------|------|------|--------|-------|--------|
| **CRM_List_Template** | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **CRM_Form_Template** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **CRM_Dashboard_Template** | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |

**Total:** 3 page templates

### 3. **Picklist Types** (mstPicklistType)
| Type Name | Description | Values Count |
|-----------|-------------|--------------|
| **Lead_Status** | Lead lifecycle status | 5 |
| **Lead_Source** | Lead source channel | 7 |
| **Contact_Status** | Contact status | 4 |
| **Contact_Lifecycle_Stage** | Contact lifecycle | 7 |
| **Opportunity_Stage** | Opportunity pipeline stage | 6 |
| **Activity_Type** | Activity type | 6 |

**Total:** 6 picklist types

### 4. **Picklist Values** (mstPickListValue)

#### Lead Status (5 values)
- ✅ New
- ✅ Contacted
- ✅ Qualified
- ✅ Unqualified
- ✅ Converted

#### Lead Source (7 values)
- ✅ Website
- ✅ Referral
- ✅ LinkedIn
- ✅ ColdCall
- ✅ Advertisement
- ✅ TradeShow
- ✅ Other

#### Contact Status (4 values)
- ✅ Active
- ✅ Inactive
- ✅ Bounced
- ✅ Unsubscribed

#### Contact Lifecycle Stage (7 values)
- ✅ Subscriber
- ✅ Lead
- ✅ MQL (Marketing Qualified Lead)
- ✅ SQL (Sales Qualified Lead)
- ✅ Opportunity
- ✅ Customer
- ✅ Evangelist

#### Opportunity Stage (6 values)
- ✅ Prospecting
- ✅ Qualification
- ✅ Proposal
- ✅ Negotiation
- ✅ Closed Won
- ✅ Closed Lost

#### Activity Type (6 values)
- ✅ Call
- ✅ Email
- ✅ Meeting
- ✅ Note
- ✅ Task
- ✅ FollowUp

**Total:** 35 picklist values

### 5. **Master Menus** (mstMasterMenu)

#### Sidebar Menus (7 visible)
| Menu | Map Key | Path | Template | Icon |
|------|---------|------|----------|------|
| Dashboard | `crm_dashboard` | `/crm/dashboard` | Dashboard Template | LayoutDashboard |
| Leads | `crm_lead_list` | `/crm/leads` | List Template | Target |
| Contacts | `crm_contact_list` | `/crm/contacts` | List Template | Contact |
| Accounts | `crm_account_list` | `/crm/accounts` | List Template | Building2 |
| Opportunities | `crm_opportunity_list` | `/crm/opportunities` | List Template | TrendingUp |
| Activities | `crm_activity_list` | `/crm/activities` | List Template | Activity |
| Pipelines | `crm_pipeline_list` | `/crm/pipelines` | List Template | GitBranch |

#### Hidden Menus (5 hidden)
| Menu | Map Key | Path | Template | Parent |
|------|---------|------|----------|--------|
| Lead Form | `crm_lead_form` | `/crm/leads/:id` | Form Template | Leads |
| Contact Form | `crm_contact_form` | `/crm/contacts/:id` | Form Template | Contacts |
| Account Form | `crm_account_form` | `/crm/accounts/:id` | Form Template | Accounts |
| Opportunity Form | `crm_opportunity_form` | `/crm/opportunities/:id` | Form Template | Opportunities |
| Opportunity Board | `crm_opportunity_board` | `/crm/opportunities/board` | List Template | Opportunities |

**Total:** 12 master menus

---

## 📊 Grand Total

```
✅ 1 Module Entry
✅ 3 Page Templates
✅ 6 Picklist Types
✅ 35 Picklist Values
✅ 12 Master Menus
━━━━━━━━━━━━━━━━━━━
✅ 57 Total Records
```

---

## 🚀 Installation Steps

### Step 1: Update Variables

Script ke top par 2 variables update karo:

```sql
-- System User GUID (Update this with your system/admin user GUID)
DECLARE @SystemUserGUID uniqueidentifier = '00000000-0000-0000-0000-000000000001';

-- Group GUID (Update this with your group GUID)
DECLARE @GroupGUID uniqueidentifier = NULL;
```

**System User kaise dhoondhein:**
```sql
SELECT strUserGUID, strName, strEmailId FROM mstUser WHERE bolIsSuperAdmin = 1;
```

**Group GUID auto-fetch hoga** pehla active group. Manual set karna ho toh:
```sql
DECLARE @GroupGUID uniqueidentifier = 'YOUR-GROUP-GUID-HERE';
```

### Step 2: Run Script

SQL Server Management Studio ya Azure Data Studio mein:
```
1. Open: CRM_Complete_Seed_Script.sql
2. Press F5 or click Execute
3. Check output messages
```

### Step 3: Verify Installation

Script automatically verification queries run karega. Manual check:

```sql
-- All created data dekho
SELECT 'Module' AS TableName, COUNT(*) AS Count FROM mstModule WHERE strName = 'CRM'
UNION ALL
SELECT 'Page Templates', COUNT(*) FROM mstPageTemplate WHERE strPageTemplateName LIKE 'CRM%'
UNION ALL
SELECT 'Picklist Types', COUNT(*) FROM mstPicklistType WHERE strType IN ('Lead_Status', 'Lead_Source', 'Contact_Status', 'Contact_Lifecycle_Stage', 'Opportunity_Stage', 'Activity_Type')
UNION ALL
SELECT 'Picklist Values', COUNT(*) FROM mstPickListValue WHERE strPicklistTypeGUID IN (SELECT strPicklistTypeGUID FROM mstPicklistType WHERE strType LIKE '%Lead%' OR strType LIKE '%Contact%' OR strType LIKE '%Opportunity%' OR strType LIKE '%Activity%')
UNION ALL
SELECT 'Master Menus', COUNT(*) FROM mstMasterMenu WHERE strCategory = 'CRM';
```

---

## 🔄 CRM Flow

Yeh seed data **complete CRM lifecycle** ko support karta hai:

```
┌─────────────────────────────────────────────────────────────┐
│                    CRM LIFECYCLE FLOW                        │
└─────────────────────────────────────────────────────────────┘

1. LEAD CAPTURE
   ↓
   Lead Status: New → Contacted → Qualified
   Lead Source: Website, Referral, LinkedIn, etc.

2. LEAD TO CONTACT CONVERSION
   ↓
   Contact Lifecycle: Subscriber → Lead → MQL → SQL
   Contact Status: Active

3. OPPORTUNITY CREATION
   ↓
   Opportunity Stage: Prospecting → Qualification → Proposal → Negotiation

4. DEAL CLOSURE
   ↓
   Opportunity Stage: Closed Won ✅ or Closed Lost ❌

5. CUSTOMER RELATIONSHIP
   ↓
   Contact Lifecycle: Customer → Evangelist
   Activities: Call, Email, Meeting, Note, Task, FollowUp

6. ACCOUNT MANAGEMENT
   ↓
   Account tracking with multiple contacts
   All interactions logged as Activities
```

---

## ✅ Field Name Accuracy

Sab field names **exactly match** karte hain entity models se:

### mstModule
```csharp
strModuleGUID      ✅ Guid
strName            ✅ string
strDesc            ✅ string
strSQlfilePath     ✅ string
strImagePath       ✅ string
bolIsActive        ✅ bool
strCreatedByGUID   ✅ Guid
dtCreatedOn        ✅ DateTime
```

### mstPageTemplate
```csharp
strPageTemplateGUID    ✅ Guid
strPageTemplateName    ✅ string
bolIsSave              ✅ bool
bolIsView              ✅ bool
bolIsEdit              ✅ bool
bolIsDelete            ✅ bool
bolIsPrint             ✅ bool
bolIsExport            ✅ bool
bolIsImport            ✅ bool
bolIsApprove           ✅ bool
strCreatedByGUID       ✅ Guid?
dtCreated              ✅ DateTime?
bolIsSystemCreated     ✅ bool?
```

### mstPicklistType
```csharp
strPicklistTypeGUID    ✅ Guid
strType                ✅ string
strDescription         ✅ string
bolIsActive            ✅ bool
strCreatedByGUID       ✅ Guid
dtCreatedOn            ✅ DateTime
```

### mstPickListValue
```csharp
strPickListValueGUID   ✅ Guid
strValue               ✅ string
strPicklistTypeGUID    ✅ Guid
bolIsActive            ✅ bool
strGroupGUID           ✅ Guid
strCreatedByGUID       ✅ Guid
dtCreatedOn            ✅ DateTime
```

### mstMasterMenu
```csharp
strMasterMenuGUID      ✅ Guid
strParentMenuGUID      ✅ Guid?
strModuleGUID          ✅ Guid?
dblSeqNo               ✅ double
strName                ✅ string
strPath                ✅ string
strMenuPosition        ✅ string
bolHasSubMenu          ✅ bool
strIconName            ✅ string
bolIsActive            ✅ bool
strMapKey              ✅ string
bolSuperAdminAccess    ✅ bool
strCategory            ✅ string
strPageTemplateGUID    ✅ Guid?
bolIsSingleMenu        ✅ bool
```

---

## 🔧 Customization

### Add New Picklist Value

```sql
-- Example: Add new Lead Source "Instagram"
DECLARE @LeadSourceTypeGUID uniqueidentifier;
DECLARE @GroupGUID uniqueidentifier = 'YOUR-GROUP-GUID';
DECLARE @SystemUserGUID uniqueidentifier = 'YOUR-USER-GUID';

SELECT @LeadSourceTypeGUID = strPicklistTypeGUID
FROM mstPicklistType WHERE strType = 'Lead_Source';

INSERT INTO mstPickListValue
    ([strPickListValueGUID], [strValue], [strPicklistTypeGUID], [bolIsActive], [strGroupGUID], [strCreatedByGUID], [dtCreatedOn])
VALUES
    (NEWID(), 'Instagram', @LeadSourceTypeGUID, 1, @GroupGUID, @SystemUserGUID, GETUTCDATE());
```

### Add New Menu

```sql
-- Example: Add "Reports" menu
DECLARE @CrmModuleGUID uniqueidentifier;
SELECT @CrmModuleGUID = strModuleGUID FROM mstModule WHERE strName = 'CRM';

INSERT INTO mstMasterMenu
    ([strMasterMenuGUID], [strParentMenuGUID], [strModuleGUID], [dblSeqNo], [strName], [strPath], [strMenuPosition], [bolHasSubMenu], [strIconName], [bolIsActive], [strMapKey], [bolSuperAdminAccess], [strCategory], [strPageTemplateGUID], [bolIsSingleMenu])
VALUES
    (NEWID(), NULL, @CrmModuleGUID, 80, 'Reports', '/crm/reports', 'sidebar', 0, 'BarChart3', 1, 'crm_reports', 0, 'CRM', NULL, 1);
```

---

## 🐛 Troubleshooting

### Error: "Cannot insert duplicate key"
**Cause:** Script already run ho chuka hai
**Solution:** Script me built-in `IF NOT EXISTS` checks hain, so yeh error nahi aana chahiye. Agar aa raha hai toh:
```sql
-- Specific tables clear karo (CAREFUL!)
DELETE FROM mstMasterMenu WHERE strCategory = 'CRM';
DELETE FROM mstPickListValue WHERE strPicklistTypeGUID IN (SELECT strPicklistTypeGUID FROM mstPicklistType WHERE strType LIKE '%Lead%' OR strType LIKE '%Contact%');
-- Then re-run script
```

### Error: "Foreign key constraint"
**Cause:** Group GUID ya User GUID invalid hai
**Solution:**
```sql
-- Valid GUIDs check karo
SELECT strGroupGUID, strName FROM mstGroup;
SELECT strUserGUID, strName FROM mstUser WHERE bolIsSuperAdmin = 1;
```

### Error: "Module already exists"
**Solution:** Script automatically detect kar lega aur existing module ka GUID use karega. Koi tension nahi!

---

## 📁 Related Files

| File | Purpose |
|------|---------|
| `CRM_Complete_Seed_Script.sql` | Main seed script (this one) |
| `CRM_MasterMenu_Final.sql` | Only menus script |
| `CRM_Seed_Data_Guide.md` | This documentation |
| `central-backend/Models/Entities/*.cs` | Entity definitions |
| `crm-backend/Constants/*.cs` | CRM constants |
| `audit-frontend/src/routes/crm-routes.tsx` | Frontend routes |

---

## 📞 Quick Reference

### View All Picklist Values by Type
```sql
SELECT
    pt.strType AS PicklistType,
    pv.strValue AS Value,
    pv.bolIsActive AS IsActive
FROM mstPickListValue pv
JOIN mstPicklistType pt ON pv.strPicklistTypeGUID = pt.strPicklistTypeGUID
WHERE pt.strType LIKE '%Lead%' OR pt.strType LIKE '%Contact%' OR pt.strType LIKE '%Opportunity%'
ORDER BY pt.strType, pv.strValue;
```

### View Menu Hierarchy
```sql
WITH MenuHierarchy AS (
    SELECT
        strMasterMenuGUID,
        strParentMenuGUID,
        strName,
        strMapKey,
        strPath,
        strMenuPosition,
        dblSeqNo,
        CAST(strName AS NVARCHAR(500)) AS Hierarchy,
        0 AS Level
    FROM mstMasterMenu
    WHERE strCategory = 'CRM' AND strParentMenuGUID IS NULL

    UNION ALL

    SELECT
        m.strMasterMenuGUID,
        m.strParentMenuGUID,
        m.strName,
        m.strMapKey,
        m.strPath,
        m.strMenuPosition,
        m.dblSeqNo,
        CAST(mh.Hierarchy + ' > ' + m.strName AS NVARCHAR(500)),
        mh.Level + 1
    FROM mstMasterMenu m
    INNER JOIN MenuHierarchy mh ON m.strParentMenuGUID = mh.strMasterMenuGUID
)
SELECT
    REPLICATE('  ', Level) + strName AS MenuName,
    strMapKey,
    strPath,
    strMenuPosition
FROM MenuHierarchy
ORDER BY Hierarchy;
```

### Count Records by Table
```sql
SELECT
    'Module' AS TableName,
    COUNT(*) AS Count
FROM mstModule
WHERE strName = 'CRM'
UNION ALL
SELECT 'Page Templates', COUNT(*) FROM mstPageTemplate WHERE strPageTemplateName LIKE 'CRM%'
UNION ALL
SELECT 'Picklist Types', COUNT(*) FROM mstPicklistType WHERE strType IN ('Lead_Status', 'Lead_Source', 'Contact_Status', 'Contact_Lifecycle_Stage', 'Opportunity_Stage', 'Activity_Type')
UNION ALL
SELECT 'Picklist Values', COUNT(*) FROM mstPickListValue pv WHERE EXISTS (SELECT 1 FROM mstPicklistType pt WHERE pt.strPicklistTypeGUID = pv.strPicklistTypeGUID AND pt.strType IN ('Lead_Status', 'Lead_Source', 'Contact_Status', 'Contact_Lifecycle_Stage', 'Opportunity_Stage', 'Activity_Type'))
UNION ALL
SELECT 'Master Menus', COUNT(*) FROM mstMasterMenu WHERE strCategory = 'CRM';
```

---

## ✨ Features

✅ **Idempotent** - Multiple baar run kar sakte ho, duplicates nahi banenge
✅ **Auto-Detection** - Existing data ko detect karke skip kar deta hai
✅ **Field Name Perfect** - Sab field names entity models se exactly match
✅ **Complete Flow** - Lead → Contact → Opportunity → Customer
✅ **Template Linkage** - Menus linked with proper page templates
✅ **Verification Built-in** - Script end mein verification queries run karta hai

---

**Version:** 1.0
**Last Updated:** February 2026
**Total Records Created:** 57
**Database:** SQL Server
**Compatible With:** EF Core 9.0+
