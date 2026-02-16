# Adding bolSystemCreated Field to MstOrganization

## Overview

This change adds a new boolean field `bolSystemCreated` to the `mstOrganization` table. This field indicates whether an organization was automatically created by the system during group creation (true) or manually created by a user (false).

## Changes Made

1. Added a new boolean field `bolSystemCreated` to the `MstOrganization` entity model with a default value of `false`.

   - Field is required and defaults to `false`
   - When `true`, it indicates the organization was created as part of group creation

2. Modified the `GroupService.CreateGroupAsync` method to set `bolSystemCreated = true` when creating the default organization for a new group.

3. Created a SQL migration script (`AddSystemCreatedToOrganization.sql`) that:
   - Adds the `bolSystemCreated` column to the `mstOrganization` table
   - Sets existing organizations that were created during group creation to `true`

## Implementation Details

### Entity Model Change

```csharp
[Required]
public bool bolSystemCreated { get; set; } = false;
```

### GroupService Change

When creating an organization during group creation, we set this flag:

```csharp
organization.bolSystemCreated = true; // Set this flag to true as this organization is created during group creation
```

## Deployment

To deploy this change:

1. Execute the SQL migration script on the target database:

```sql
-- Add bolSystemCreated column to mstOrganization table with default value of false
ALTER TABLE mstOrganization
ADD bolSystemCreated BIT NOT NULL DEFAULT 0;

-- Update existing organizations created during group creation to true
UPDATE mstOrganization
SET bolSystemCreated = 1
WHERE strDescription LIKE 'Default organization for %';
```

2. Ensure the application code with the updated model and service is deployed.

## Usage

This field can be used to identify system-created organizations and potentially limit certain operations on them if needed in the future.
