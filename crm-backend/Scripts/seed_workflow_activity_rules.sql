-- Workflow Rules Seed Data
-- Initializes default workflow rules for activity completion automation
-- Date: 2026-02-17

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

BEGIN TRANSACTION;

-- ========================================
-- 1. SEED WORKFLOW RULES FOR ACTIVITY COMPLETION
-- ========================================

-- Example: When a Call activity is completed, update linked Lead from "New" to "Contacted"
INSERT INTO MstWorkflowRule (
    strWorkflowRuleGUID,
    strGroupGUID,
    strRuleName,
    strDescription,
    strEntityType,
    strTriggerEvent,
    strConditions,
    strActionType,
    strActionConfig,
    intExecutionOrder,
    intExecutionOrder,
    bolIsActive,
    bolIsDeleted,
    strCreatedByGUID,
    dtCreatedOn
)
SELECT 
    NEWID(),
    g.strGroupGUID,
    'Activity Completion: Call -> Lead Contacted',
    'When a Call activity is completed, mark linked lead as Contacted',
    'Activity',
    'ActivityCompleted',
    JSON_QUERY('{"strActivityType":"Call"}'),
    'UpdateEntityStatus',
    JSON_QUERY('{"status":"Contacted"}'),
    0,
    1,
    1,
    0,
    '00000000-0000-0000-0000-000000000001',
    GETUTCDATE()
FROM (SELECT DISTINCT strGroupGUID FROM MstGroup) g
WHERE NOT EXISTS (
    SELECT 1 FROM MstWorkflowRule 
    WHERE strRuleName = 'Activity Completion: Call -> Lead Contacted'
    AND strEntityType = 'Activity'
);

-- Example: When a Meeting activity is completed, update linked Lead from "Contacted" to "Qualified"
INSERT INTO MstWorkflowRule (
    strWorkflowRuleGUID,
    strGroupGUID,
    strRuleName,
    strDescription,
    strEntityType,
    strTriggerEvent,
    strConditions,
    strActionType,
    strActionConfig,
    intExecutionOrder,
    intExecutionOrder,
    bolIsActive,
    bolIsDeleted,
    strCreatedByGUID,
    dtCreatedOn
)
SELECT 
    NEWID(),
    g.strGroupGUID,
    'Activity Completion: Meeting -> Lead Qualified',
    'When a Meeting activity is completed, mark linked lead as Qualified',
    'Activity',
    'ActivityCompleted',
    JSON_QUERY('{"strActivityType":"Meeting"}'),
    'UpdateEntityStatus',
    JSON_QUERY('{"status":"Qualified"}'),
    0,
    2,
    1,
    0,
    '00000000-0000-0000-0000-000000000001',
    GETUTCDATE()
FROM (SELECT DISTINCT strGroupGUID FROM MstGroup) g
WHERE NOT EXISTS (
    SELECT 1 FROM MstWorkflowRule 
    WHERE strRuleName = 'Activity Completion: Meeting -> Lead Qualified'
    AND strEntityType = 'Activity'
);

-- Example: When any activity is completed, send notification
INSERT INTO MstWorkflowRule (
    strWorkflowRuleGUID,
    strGroupGUID,
    strRuleName,
    strDescription,
    strEntityType,
    strTriggerEvent,
    strConditions,
    strActionType,
    strActionConfig,
    intExecutionOrder,
    intExecutionOrder,
    bolIsActive,
    bolIsDeleted,
    strCreatedByGUID,
    dtCreatedOn
)
SELECT 
    NEWID(),
    g.strGroupGUID,
    'Activity Completion: Send Notification',
    'When any activity is completed, send notification to assigned user',
    'Activity',
    'ActivityCompleted',
    NULL,
    'SendNotification',
    JSON_QUERY('{"title":"Activity Completed","message":"An activity has been successfully completed"}'),
    0,
    3,
    1,
    0,
    '00000000-0000-0000-0000-000000000001',
    GETUTCDATE()
FROM (SELECT DISTINCT strGroupGUID FROM MstGroup) g
WHERE NOT EXISTS (
    SELECT 1 FROM MstWorkflowRule 
    WHERE strRuleName = 'Activity Completion: Send Notification'
    AND strEntityType = 'Activity'
);

-- Example: When activity is created, auto-create follow-up for 3 days later
INSERT INTO MstWorkflowRule (
    strWorkflowRuleGUID,
    strGroupGUID,
    strRuleName,
    strDescription,
    strEntityType,
    strTriggerEvent,
    strConditions,
    strActionType,
    strActionConfig,
    intExecutionOrder,
    intExecutionOrder,
    bolIsActive,
    bolIsDeleted,
    strCreatedByGUID,
    dtCreatedOn
)
SELECT 
    NEWID(),
    g.strGroupGUID,
    'Activity Creation: Auto Follow-up',
    'When any activity is created, automatically schedule a follow-up activity 3 days later',
    'Activity',
    'ActivityCreated',
    NULL,
    'CreateFollowUp',
    JSON_QUERY('{"subject":"Follow-up Activity","description":"Auto-created follow-up","daysAfter":3}'),
    0,
    1,
    0,  -- Disabled by default, enable as needed
    0,
    '00000000-0000-0000-0000-000000000001',
    GETUTCDATE()
FROM (SELECT DISTINCT strGroupGUID FROM MstGroup) g
WHERE NOT EXISTS (
    SELECT 1 FROM MstWorkflowRule 
    WHERE strRuleName = 'Activity Creation: Auto Follow-up'
    AND strEntityType = 'Activity'
);

-- ========================================
-- 2. VERIFICATION QUERIES
-- ========================================

SELECT 
    strWorkflowRuleGUID,
    strRuleName,
    strEntityType,
    strTriggerEvent,
    strActionType,
    bolIsActive
FROM MstWorkflowRule
WHERE strEntityType = 'Activity'
ORDER BY dtCreatedOn DESC;

COMMIT TRANSACTION;

PRINT 'Workflow Rules seed data completed successfully!';
