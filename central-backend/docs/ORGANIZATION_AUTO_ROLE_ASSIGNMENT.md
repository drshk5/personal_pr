# Automatic Role Assignment for Organization Creator

## Overview

When a user creates a new organization, the system now automatically assigns them the same role they have in their current organization for the newly created organization.

## Implementation Details

### Logic Flow

1. **Extract Token Claims**

   - User GUID (`strUserGUID`)
   - Current Organization GUID (`strOrganizationGUID`)
   - Module GUID (`strModuleGUID`)
   - Group GUID (`strGroupGUID`)
   - Year GUID (`strYearGUID`)

2. **Find Current Role**

   - Query `MstUserDetails` table for the user's role in their current organization
   - Use the combination: User + Current Organization + Module

3. **Create New Entry**
   - Create a new `MstUserDetails` record with:
     - Same user GUID
     - **New organization GUID** (the one just created)
     - **Same role GUID** (from current organization)
     - Same module GUID
     - Same group GUID
     - **New year GUID** (from the newly created year)

### Example Scenario

**Before Creating Organization:**

- User: John Doe (`UserGUID: ABC-123`)
- Current Org: Org 1 (`OrgGUID: ORG-001`)
- Role: Admin (`RoleGUID: ADMIN-789`)
- Module: Central (`ModuleGUID: MOD-001`)

**After Creating Organization 2:**

- A new `MstUserDetails` entry is created:
  - `strUserGUID`: ABC-123 (same user)
  - `strOrganizationGUID`: ORG-002 (new org)
  - `strUserRoleGUID`: ADMIN-789 (same role)
  - `strModuleGUID`: MOD-001 (same module)
  - `strGroupGUID`: GROUP-001 (same group)
  - `strYearGUID`: YEAR-002 (new year for new org)

Result: John Doe now has "Admin" role in both Org 1 and Org 2.

## Code Location

**File:** `OrganizationService.cs`
**Method:** `CreateOrganizationAsync()`
**Lines:** ~935-1010

## Key Features

### 1. Token-Based Detection

Uses `IHttpContextAccessor` to access the authenticated user's token claims without requiring additional parameters.

### 2. Role Preservation

The user gets the **exact same role** they have in their source organization:

- If they're an Admin in Org 1 → Admin in Org 2
- If they're a Viewer in Org 1 → Viewer in Org 2

### 3. Module Context

The role is assigned for the **same module** the user is currently working in when they create the organization.

### 4. Duplicate Prevention

Checks if a `UserDetails` entry already exists before creating to avoid duplicate entries.

### 5. Error Handling

- Wrapped in try-catch block
- Logs detailed information at each step
- **Does not fail organization creation** if user details creation fails
- Provides clear warning messages when claims are missing

## Database Table

### MstUserDetails Structure

```sql
strUserDetailGUID        UNIQUEIDENTIFIER PRIMARY KEY
strUserGUID             UNIQUEIDENTIFIER NOT NULL
strOrganizationGUID     UNIQUEIDENTIFIER NOT NULL
strUserRoleGUID         UNIQUEIDENTIFIER NOT NULL
strGroupGUID            UNIQUEIDENTIFIER NOT NULL
strYearGUID             UNIQUEIDENTIFIER NOT NULL
strModuleGUID           UNIQUEIDENTIFIER NOT NULL
bolIsActive             BIT NOT NULL DEFAULT 1
dtCreatedOn             DATETIME NOT NULL
dtUpdatedOn             DATETIME NOT NULL
strCreatedByGUID        UNIQUEIDENTIFIER NOT NULL
strUpdatedByGUID        UNIQUEIDENTIFIER NOT NULL
```

## Logging

The implementation includes comprehensive logging:

```
Creating user details for user {UserGUID} who created organization {OrgGUID}
Found existing user details with role: {RoleGUID}
Successfully created user details for user {UserGUID} in new organization {OrgGUID} with role {RoleGUID}
```

Or warnings when appropriate:

```
No existing user details found for user {UserGUID} in organization {OrgGUID}
Required claims not found in token for automatic role assignment
User not authenticated or HttpContext not available
```

## Benefits

1. **Seamless Access** - Users can immediately access the organizations they create
2. **Role Continuity** - Maintains consistent permissions across organizations
3. **Zero Configuration** - Automatic, no additional API calls needed
4. **Module-Specific** - Respects module boundaries
5. **Safe** - Won't break organization creation if it fails

## Edge Cases Handled

| Scenario                   | Behavior                                 |
| -------------------------- | ---------------------------------------- |
| User has no existing role  | Logs warning, organization still created |
| Token claims missing       | Logs warning, organization still created |
| User details already exist | Skips creation, logs info message        |
| Multiple modules           | Each module gets its own entry           |
| Error during creation      | Logs error, organization still created   |

## Testing Checklist

- [x] User with Admin role creates org → Gets Admin in new org
- [x] User with custom role creates org → Gets same role in new org
- [x] Multiple organizations created by same user
- [x] User details already exist scenario
- [x] Missing token claims scenario
- [x] Error during user details creation
- [x] Organization creation succeeds even if user details fails

## Future Enhancements

Potential improvements:

1. Support for multiple module assignments in one operation
2. Role mapping configuration (e.g., Admin in Org1 → Viewer in new orgs)
3. Notification to user about their new role assignment
4. Audit log entry for role assignment
