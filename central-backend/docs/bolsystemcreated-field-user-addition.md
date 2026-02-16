# Adding bolSystemCreated Field to MstUser

## Overview

This change adds a new boolean field `bolSystemCreated` to the `mstUser` table. This field indicates whether a user was automatically created by the system during group creation (true) or manually created by a user (false).

## Changes Made

1. Added a new boolean field `bolSystemCreated` to the `MstUser` entity model with a default value of `false`.

   - Field is required and defaults to `false`
   - When `true`, it indicates the user was created as part of group creation or as a super admin

2. Modified the `GroupService.CreateGroupAsync` method to set `bolSystemCreated = true` when creating the admin user during group creation.

3. Created a SQL migration script (`AddSystemCreatedToUser.sql`) that:
   - Adds the `bolSystemCreated` column to the `mstUser` table
   - Sets existing users that were likely created during group creation to `true`
   - Sets all super admin users to `true` as they are also system-created

## Implementation Details

### Entity Model Change

```csharp
[Required]
public bool bolSystemCreated { get; set; } = false;
```

### GroupService Change

When creating an admin user during group creation, we set this flag:

```csharp
var adminUser = new MstUser
{
    // Other properties...
    bolSystemCreated = true, // Set this flag to true as this user is created during group creation
    // Other properties...
};
```

## Deployment

To deploy this change:

1. Execute the SQL migration script on the target database:

```sql
-- Add bolSystemCreated column to mstUser table with default value of false
ALTER TABLE mstUser
ADD bolSystemCreated BIT NOT NULL DEFAULT 0;

-- Update users in the database that were likely created during group creation
-- This will find users who are admin users created with each group
-- The strategy is to find the first user created for each group with a matching group GUID
UPDATE u
SET bolSystemCreated = 1
FROM mstUser u
INNER JOIN (
    -- Get the first user created for each group
    SELECT
        strGroupGUID,
        MIN(dtCreatedOn) as FirstUserCreatedDate
    FROM mstUser
    WHERE strGroupGUID IS NOT NULL
    AND bolIsSuperAdmin = 0 -- Exclude super admins
    GROUP BY strGroupGUID
) f ON u.strGroupGUID = f.strGroupGUID AND u.dtCreatedOn = f.FirstUserCreatedDate;

-- Super admin users are also system-created
UPDATE mstUser
SET bolSystemCreated = 1
WHERE bolIsSuperAdmin = 1;
```

2. Ensure the application code with the updated model and service is deployed.

## Usage

This field can be used to identify system-created users and potentially limit certain operations on them if needed in the future. For example, you might want to prevent deletion of system-created admin users or require special confirmation before modifying them.
