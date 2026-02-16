# 🧪 CRM SYSTEM - QUICK TESTING GUIDE
## Backend Testing & Verification

**Last Updated**: February 17, 2026

---

## ⚡ QUICK START (5 minutes)

### 1. Verify Database Migration
```sql
-- Connect to your CRM database and run:
SELECT COUNT(*) FROM sys.indexes WHERE name LIKE 'IX_MstActivity%';
-- Should return: 5 (five new indexes)

SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'MstActivity' AND COLUMN_NAME = 'strStatus';
-- Should return: strStatus (column exists)
```

### 2. Start API Server
```bash
cd /Users/drshk5/Downloads/crm-dk/crm-backend
dotnet run
# Server should start on: https://localhost:5001 or http://localhost:5000
```

### 3. Test Basic Endpoint
```bash
curl -X GET "http://localhost:5000/api/crm/activities" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
```

---

## 📝 DETAILED TEST SCENARIOS

### Test 1: Create Activity (Happy Path)

**Request:**
```http
POST http://localhost:5000/api/crm/activities
Content-Type: application/json
Authorization: Bearer eyJhbGc...
X-Tenant-ID: 550e8400-e29b-41d4-a716-446655440000

{
  "strActivityType": "Call",
  "strSubject": "Customer follow-up call",
  "strDescription": "Discuss Q1 pricing options",
  "dtScheduledOn": "2026-02-18T14:00:00Z",
  "dtDueDate": "2026-02-18T17:00:00Z",
  "strPriority": "High",
  "strStatus": "Pending",
  "strCategory": "Sales",
  "strAssignedToGUID": "550e8400-e29b-41d4-a716-446655440001",
  "intDurationMinutes": 30,
  "links": [
    {
      "strEntityType": "Lead",
      "strEntityGUID": "550e8400-e29b-41d4-a716-446655440002"
    }
  ]
}
```

**Expected Response:** `201 Created`
```json
{
  "success": true,
  "message": "Activity created successfully",
  "data": {
    "strActivityGUID": "550e8400-e29b-41d4-a716-446655440003",
    "strActivityType": "Call",
    "strSubject": "Customer follow-up call",
    "strStatus": "Pending",
    "strPriority": "High",
    "dtDueDate": "2026-02-18T17:00:00Z",
    "bolIsOverdue": false,
    "strAssignedToGUID": "550e8400-e29b-41d4-a716-446655440001",
    "strAssignedToName": "John Sales",
    "dtCreatedOn": "2026-02-17T10:30:00Z"
  }
}
```

### Test 2: Activity Status Change (with Auto Workflow)

**Step 1: Verify Lead Status Before**
```http
GET http://localhost:5000/api/crm/leads/{lead-guid}
Authorization: Bearer eyJhbGc...

Response:
{
  "strStatus": "New"  // Should be "New"
}
```

**Step 2: Complete Activity**
```http
PATCH http://localhost:5000/api/crm/activities/{activity-guid}/status
Content-Type: application/json
Authorization: Bearer eyJhbGc...

{
  "strStatus": "Completed",
  "strOutcome": "Customer agreed to trial"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "strStatus": "Completed",
    "dtCompletedOn": "2026-02-17T10:35:00Z"
  }
}
```

**Step 3: Verify Lead Status After**
```http
GET http://localhost:5000/api/crm/leads/{lead-guid}
Authorization: Bearer eyJhbGc...

Response:
{
  "strStatus": "Contacted"  // Should AUTO-UPDATE from "New" to "Contacted"
}
```

### Test 3: Today's Tasks

**Request:**
```http
GET http://localhost:5000/api/crm/activities/today
Authorization: Bearer eyJhbGc...
X-Tenant-ID: {tenant-id}
```

**Expected:** Returns activities where:
- Due date is today, OR
- Scheduled date is today, OR
- Past due (overdue items)
- Status NOT Completed or Cancelled
- Limited to 20 results
- Sorted by due date

### Test 4: Bulk Assign Activities

**Request:**
```http
POST http://localhost:5000/api/crm/activities/bulk-assign
Content-Type: application/json
Authorization: Bearer eyJhbGc...

{
  "guids": [
    "550e8400-e29b-41d4-a716-446655440010",
    "550e8400-e29b-41d4-a716-446655440011",
    "550e8400-e29b-41d4-a716-446655440012"
  ],
  "strAssignedToGUID": "550e8400-e29b-41d4-a716-446655440020"
}

Response: 200 OK
{
  "success": true,
  "message": "Successfully assigned 3 activities"
}
```

**Verify:** Query activities and confirm all 3 have `strAssignedToGUID` = the new user

### Test 5: Filtering & Pagination

**Get Overdue High Priority Activities (Pending):**
```http
GET http://localhost:5000/api/crm/activities?strStatus=Pending&strPriority=High&bolIsOverdue=true&pageNumber=1&pageSize=20
Authorization: Bearer eyJhbGc...

Response: 200 OK
{
  "success": true,
  "data": {
    "items": [
      {
        "strActivityGUID": "...",
        "bolIsOverdue": true,
        "strStatus": "Pending",
        "strPriority": "High"
      }
    ],
    "totalCount": 15,
    "pageNumber": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

### Test 6: Account 360° View with Timeline

**Request:**
```http
GET http://localhost:5000/api/crm/accounts/{account-guid}
Authorization: Bearer eyJhbGc...

Response: 200 OK
{
  "success": true,
  "data": {
    "strAccountGUID": "...",
    "strAccountName": "Acme Corp",
    "intContactCount": 5,
    "intActivityCount": 23,
    "intOverdueActivityCount": 2,
    "dtLastActivityOn": "2026-02-17T10:30:00Z",
    "allActivities": [
      {
        "strSubject": "...",
        "strStatus": "Completed",
        "dtCreatedOn": "2026-02-17T10:30:00Z"
      }
    ],
    "timeline": [
      {
        "strEventType": "ActivityCompleted",
        "strDescription": "Activity completed: Needs assessment",
        "dtOccurredOn": "2026-02-17T10:30:00Z",
        "strPerformedByName": "John Sales"
      },
      {
        "strEventType": "Opportunity",
        "strDescription": "Opportunity moved to Qualification: $50k DIY",
        "dtOccurredOn": "2026-02-16T14:00:00Z"
      },
      {
        "strEventType": "ContactAdded",
        "strDescription": "Contact added: Jane Doe",
        "dtOccurredOn": "2026-02-15T09:00:00Z",
        "strPerformedByName": "John Sales"
      }
    ]
  }
}
```

### Test 7: Dashboard with Activities

**Request:**
```http
GET http://localhost:5000/api/crm/dashboard
Authorization: Bearer eyJhbGc...
X-Tenant-ID: {tenant-id}

Response: 200 OK
{
  "success": true,
  "data": {
    "intTotalLeads": 45,
    "intQualifiedLeads": 12,
    "intTotalOpenOpportunities": 8,
    "intMyActivitiesCount": 5,
    "intTeamOverdueCount": 2,
    "intActivitiesThisWeek": 23,
    "todayTasks": [
      {
        "strSubject": "Call with ABC Corp",
        "strStatus": "Pending",
        "dtDueDate": "2026-02-17T17:00:00Z",
        "strPriority": "High"
      }
    ],
    "overdueActivities": [
      {
        "strSubject": "Send proposal",
        "bolIsOverdue": true,
        "dtDueDate": "2026-02-10T17:00:00Z"
      }
    ]
  }
}
```

---

## 🔍 TESTING WITH POSTMAN/REST CLIENT

### Setup in VS Code (Rest Client Extension)

Create file: `test-activities.http`

```http
@baseUrl = http://localhost:5000
@token = Bearer eyJhbGc...
@tenantId = 550e8400-e29b-41d4-a716-446655440000
@activityId = 

### 1. Create Activity
POST {{baseUrl}}/api/crm/activities
Content-Type: application/json
Authorization: {{token}}
X-Tenant-ID: {{tenantId}}

{
  "strActivityType": "Call",
  "strSubject": "Test Activity",
  "strPriority": "High",
  "strStatus": "Pending"
}

### 2. Get Activities List
GET {{baseUrl}}/api/crm/activities?pageNumber=1&pageSize=10
Authorization: {{token}}
X-Tenant-ID: {{tenantId}}

### 3. Get Today's Tasks
GET {{baseUrl}}/api/crm/activities/today
Authorization: {{token}}
X-Tenant-ID: {{tenantId}}

### 4. Change Status
PATCH {{baseUrl}}/api/crm/activities/{{activityId}}/status
Content-Type: application/json
Authorization: {{token}}

{
  "strStatus": "Completed",
  "strOutcome": "Done"
}

### 5. Bulk Assign
POST {{baseUrl}}/api/crm/activities/bulk-assign
Content-Type: application/json
Authorization: {{token}}

{
  "guids": ["guid1", "guid2"],
  "strAssignedToGUID": "user-guid"
}

### 6. Get Dashboard
GET {{baseUrl}}/api/crm/dashboard
Authorization: {{token}}
X-Tenant-ID: {{tenantId}}
```

Then run with: Ctrl+Shift+Enter or click "Send Request"

---

## ⚙️ DATABASE VERIFICATION QUERIES

### Check All Activity Indexes
```sql
SELECT name, type_desc, is_unique
FROM sys.indexes
WHERE object_id = OBJECT_ID('[dbo].[MstActivity]')
ORDER BY name;

-- Should return 5 indexes:
-- IX_MstActivity_Status_Priority_DueDate
-- IX_MstActivity_AssignedTo_Status
-- IX_MstActivity_Tenant_Active
-- IX_MstActivity_CreatedOn
-- IX_MstActivityLink_Entity_Activity
```

### Verify Activity Table Schema
```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'MstActivity'
ORDER BY ORDINAL_POSITION;

-- Should include these columns:
-- strActivityGUID, strStatus, strPriority, dtDueDate, 
-- strCategory, strAssignedToGUID, strUpdatedByGUID, 
-- dtUpdatedOn, bolIsDeleted, dtDeletedOn
```

### Check Workflow Rules Seeded
```sql
SELECT strRuleName, strTriggerEvent, strActionType, bolIsActive
FROM MstWorkflowRule
WHERE strEntityType = 'Activity'
ORDER BY dtCreatedOn DESC;

-- Should return 4 rules:
-- 1. Activity Completion: Call -> Lead Contacted
-- 2. Activity Completion: Meeting -> Lead Qualified
-- 3. Activity Completion: Send Notification
-- 4. Activity Creation: Auto Follow-up (disabled)
```

### Performance Index Usage
```sql
SELECT 
    i.name,
    ISNULL(s.user_seeks, 0) as seeks,
    ISNULL(s.user_scans, 0) as scans,
    ISNULL(s.user_lookups, 0) as lookups
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s
    ON i.object_id = s.object_id
    AND i.index_id = s.index_id
    AND s.database_id = DB_ID()
WHERE i.object_id = OBJECT_ID('[dbo].[MstActivity]')
ORDER BY (ISNULL(s.user_seeks, 0) + ISNULL(s.user_scans, 0) + ISNULL(s.user_lookups, 0)) DESC;

-- Look for high seek/scan counts on IX_MstActivity_Status_Priority_DueDate
```

---

## 📈 PERFORMANCE TESTING

### Load Test Script (SQL)
```sql
-- Create test data: 1000 activities
INSERT INTO MstActivity (
    strActivityGUID, strGroupGUID, strActivityType, strSubject,
    strStatus, strPriority, dtDueDate, dtScheduledOn,
    strAssignedToGUID, strCreatedByGUID, dtCreatedOn, bolIsActive
)
SELECT
    NEWID(),
    '550e8400-e29b-41d4-a716-446655440000',
    'Call',
    'Test Activity ' + CAST(ROW_NUMBER() OVER (ORDER BY number) AS VARCHAR),
    CASE WHEN ROW_NUMBER() OVER (ORDER BY number) % 4 = 0 THEN 'Completed'
         WHEN ROW_NUMBER() OVER (ORDER BY number) % 4 = 1 THEN 'Pending'
         WHEN ROW_NUMBER() OVER (ORDER BY number) % 4 = 2 THEN 'InProgress'
         ELSE 'Cancelled' END,
    CASE WHEN ROW_NUMBER() OVER (ORDER BY number) % 4 = 0 THEN 'High'
         WHEN ROW_NUMBER() OVER (ORDER BY number) % 4 = 1 THEN 'Medium'
         WHEN ROW_NUMBER() OVER (ORDER BY number) % 4 = 2 THEN 'Low'
         ELSE 'Urgent' END,
    DATEADD(DAY, RAND() * 30 - 15, GETUTCDATE()),
    DATEADD(DAY, RAND() * 30 - 15, GETUTCDATE()),
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    GETUTCDATE(),
    1
FROM master.dbo.spt_values
WHERE number < 1000;

-- Test query performance
SET STATISTICS TIME ON;

SELECT * FROM MstActivity
WHERE strStatus = 'Pending'
    AND strPriority = 'High'
    AND bolIsDeleted = 0
ORDER BY dtDueDate DESC;

SET STATISTICS TIME OFF;
-- Should complete in <100ms with index
```

### Example Expected Performance
```
Table 'MstActivity'. Scan count 1, logical reads 3, physical reads 0
CPU time = 35 ms, elapsed time = 42 ms
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Index does not exist"
**Solution:**
```sql
-- Run the migration script:
EXEC sp_executesql N'CREATE NONCLUSTERED INDEX IX_MstActivity_Status_Priority_DueDate 
ON MstActivity (strStatus, strPriority, dtDueDate)
INCLUDE (strActivityGUID, strSubject, strAssignedToGUID, bolIsDeleted)
WHERE bolIsDeleted = 0';
```

### Issue: 404 on /api/crm/activities
**Solution:**
- Check server is running: `http://localhost:5000/`
- Verify authorization header is present and valid
- Check X-Tenant-ID header is included
- Ensure latest API code is deployed

### Issue: Activity create returns 403 Forbidden
**Solution:**
- Verify user has `CRM_Activities:Create` permission
- Check JWT token includes required permission claims
- Verify user is active/not deleted

### Issue: Workflow not triggering on activity complete
**Solution:**
1. Verify workflow rules are seeded:
   ```sql
   SELECT * FROM MstWorkflowRule WHERE strEntityType = 'Activity'
   ```
2. Check `MstWorkflowExecution` table for execution records
3. Verify lead has activity links
4. Check application logs for errors

### Issue: Dashboard slow to load
**Solution:**
- Check cache settings in appsettings.json
- Verify indexes exist (see DB verification queries)
- Use `/api/crm/dashboard/kpis` endpoint instead for faster response
- Monitor SQL Server query plans

---

## ✅ SIGN-OFF CHECKLIST

After testing, verify:

- [ ] All 15 activity endpoints respond correctly
- [ ] Create activity links to lead correctly
- [ ] Completing activity auto-updates lead status
- [ ] Bulk assign works with 100+ records
- [ ] Today's tasks filter works correctly
- [ ] Dashboard includes activity widgets
- [ ] Account timeline shows all event types
- [ ] All queries complete in <300ms
- [ ] No SQL errors in application logs
- [ ] Audit logs are being created

---

## 📊 TEST RESULTS TEMPLATE

```markdown
### Test Execution Report
**Date**: 2026-02-17
**Tester**: [Name]
**Environment**: Development / Staging / Production

#### Activity CRUD
- [ ] Create: PASS / FAIL
- [ ] Read: PASS / FAIL
- [ ] Update: PASS / FAIL
- [ ] Delete: PASS / FAIL

#### Bulk Operations
- [ ] Bulk Assign: PASS / FAIL
- [ ] Bulk Status: PASS / FAIL
- [ ] Bulk Delete: PASS / FAIL

#### Workflows
- [ ] Activity Complete → Lead Status: PASS / FAIL
- [ ] Workflow Execution: PASS / FAIL

#### Dashboard
- [ ] Today's Tasks: PASS / FAIL
- [ ] Overdue Count: PASS / FAIL

#### Performance
- [ ] Activity List <300ms: PASS / FAIL
- [ ] Bulk Assign <500ms: PASS / FAIL

#### Database
- [ ] Indexes Created: PASS / FAIL
- [ ] Workflow Rules Seeded: PASS / FAIL
- [ ] No Errors: PASS / FAIL

**Overall Status**: ✅ READY FOR PRODUCTION
**Notes**: ...
```

---

**Happy Testing! 🚀**

For questions or issues, refer to the full IMPLEMENTATION_COMPLETE.md guide.
