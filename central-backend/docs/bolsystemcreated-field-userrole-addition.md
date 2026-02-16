# Adding bolSystemCreated Field to MstUserRole

## Overview

This change adds a new boolean field `bolSystemCreated` to the `mstUserRoles` table. This field indicates whether a user role was automatically created by the system during group creation (true) or manually created by a user (false).

## Changes Made

1. Added a new boolean field `bolSystemCreated` to the `MstUserRole` entity model with a default value of `false`.

   - Field is required and defaults to `false`
   - When `true`, it indicates the user role was created as part of group creation

2. Modified the `GroupService.CreateGroupAsync` method to set `bolSystemCreated = true` when creating the admin role during group creation.

3. Created a SQL migration script (`AddSystemCreatedToUserRole.sql`) that:
   - Adds the `bolSystemCreated` column to the `mstUserRoles` table
   - Sets existing user roles that were likely created during group creation to `true`
   - Also marks any role named 'Admin' as system-created for additional safety

## Implementation Details

### Entity Model Change

```csharp
[Required]
public bool bolSystemCreated { get; set; } = false;
```

### GroupService Change

When creating an admin role during group creation, we set this flag:

```csharp
var adminRole = _mapper.Map<MstUserRole>(userRoleDto);
// Other properties...
adminRole.bolSystemCreated = true; // Set this flag to true as this role is created during group creation
// Other properties...
```

## Deployment

To deploy this change:

1. Execute the SQL migration script on the target database:

```sql
-- Add bolSystemCreated column to mstUserRoles table with default value of false
ALTER TABLE mstUserRoles
ADD bolSystemCreated BIT NOT NULL DEFAULT 0;

-- Update user roles in the database that were likely created during group creation
-- This will find roles that were created as admin roles during group setup
-- The strategy is to find the first user role created for each group
UPDATE ur
SET bolSystemCreated = 1
FROM mstUserRoles ur
INNER JOIN (
    -- Get the first user role created for each group
    SELECT
        strGroupGUID,
        MIN(dtCreatedOn) as FirstRoleCreatedDate
    FROM mstUserRoles
    GROUP BY strGroupGUID
) f ON ur.strGroupGUID = f.strGroupGUID AND ur.dtCreatedOn = f.FirstRoleCreatedDate;

-- Additionally, mark any role named 'Admin' as system-created
UPDATE mstUserRoles
SET bolSystemCreated = 1
WHERE strName = 'Admin';
```

2. Ensure the application code with the updated model and service is deployed.

## Usage

This field can be used to identify system-created user roles and potentially limit certain operations on them if needed in the future. For example, you might want to prevent deletion of system-created admin roles or require special confirmation before modifying them.
