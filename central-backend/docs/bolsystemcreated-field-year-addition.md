# Adding bolSystemCreated Field to MstYear

## Overview

This change adds a new boolean field `bolSystemCreated` to the `mstYear` table. This field indicates whether a year was automatically created by the system during group creation (true) or manually created by a user (false).

## Changes Made

1. Added a new boolean field `bolSystemCreated` to the `MstYear` entity model with a default value of `false`.

   - Field is required and defaults to `false`
   - When `true`, it indicates the year was created as part of group creation

2. Updated the `IYearService` interface to include the new parameter in the `CreateWithoutTransactionAsync` method.

3. Modified the `YearService.CreateWithoutTransactionAsync` method to accept and use the `isSystemCreated` parameter.

4. Updated the `GroupService.CreateGroupAsync` method to pass `true` for `isSystemCreated` when creating a year during group creation.

5. Created a SQL migration script (`AddSystemCreatedToYear.sql`) that:
   - Adds the `bolSystemCreated` column to the `mstYear` table
   - Sets existing years that were likely created during group creation to `true`

## Implementation Details

### Entity Model Change

```csharp
[Required]
public bool bolSystemCreated { get; set; } = false;
```

### Interface Change

```csharp
Task<YearResponseDto> CreateWithoutTransactionAsync(YearCreateDto createDto, Guid currentUserGuid, Guid groupGuid, Guid organizationGuid, bool isSystemCreated = false);
```

### YearService Change

```csharp
year.bolSystemCreated = isSystemCreated; // Set the system created flag based on the parameter
```

### GroupService Change

```csharp
var createdYear = await _yearService.CreateWithoutTransactionAsync(
    yearCreateDto,
    Guid.Parse(adminUser.strUserGUID),
    group.strGroupGUID,
    Guid.Parse(organization.strOrganizationGUID),
    true // Set isSystemCreated to true since this is created during group creation
);
```

## Deployment

To deploy this change:

1. Execute the SQL migration script on the target database:

```sql
-- Add bolSystemCreated column to mstYear table with default value of false
ALTER TABLE mstYear
ADD bolSystemCreated BIT NOT NULL DEFAULT 0;

-- Update years in the database that were likely created during group creation
-- Find years that were created during group setup (usually the first year for each organization)
UPDATE y
SET bolSystemCreated = 1
FROM mstYear y
INNER JOIN (
    -- Get the first year created for each organization
    SELECT
        strOrganizationGUID,
        MIN(dtCreatedOn) as FirstYearCreatedDate
    FROM mstYear
    GROUP BY strOrganizationGUID
) f ON y.strOrganizationGUID = f.strOrganizationGUID AND y.dtCreatedOn = f.FirstYearCreatedDate;
```

2. Ensure the application code with the updated model, interface, and services is deployed.

## Usage

This field can be used to identify system-created years and potentially limit certain operations on them if needed in the future.
