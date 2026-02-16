# User Role Organization Support Implementation

## Overview

Successfully implemented organization-level role management in the User Role module. Roles can now be assigned to specific organizations, allowing each organization to maintain its own independent set of roles within the same group.

## Changes Made

### 1. Database Changes

**File:** `Scripts/AddOrganizationGUIDToUserRoles.sql`

- Added `strOrganizationGUID` column (nullable UNIQUEIDENTIFIER) to `mstUserRoles` table
- Created foreign key constraint `FK_MstUserRole_MstOrganization` referencing `MstOrganization`
- Created index `IX_MstUserRoles_OrganizationGUID` on `strOrganizationGUID`
- Created composite index `IX_MstUserRoles_Group_Organization` for efficient filtering

**Migration Status:** ✅ Executed successfully

### 2. Entity Updates

**File:** `Models/Entities/MstUserRole.cs`

Added:

```csharp
public Guid? strOrganizationGUID { get; set; }

[ForeignKey("strOrganizationGUID")]
public MstOrganization? Organization { get; set; }
```

### 3. DTO Updates

#### UserRoleCreateDto.cs

Added: `public Guid? strOrganizationGUID { get; set; }`

#### UserRoleUpdateDto.cs

Added: `public Guid? strOrganizationGUID { get; set; }`

#### UserRoleResponseDto.cs

Added:

```csharp
public Guid? strOrganizationGUID { get; set; }
public string? strOrganizationName { get; set; }
```

### 4. Service Layer Updates

**File:** `Services/UserRoleService.cs`

#### CreateUserRoleAsync

- Added organization validation (exists and belongs to group)
- Changed duplicate check logic to be organization-specific
- Organization-level roles: Check for duplicates within the organization
- Group-level roles: Check for duplicates at group level (when no organization specified)
- Set `strOrganizationGUID` from DTO

#### UpdateUserRoleAsync

- Added organization validation
- Updated duplicate check to respect organization boundaries
- Allow changing organization assignment

#### GetAllUserRolesAsync

- Added `.Include(r => r.Organization)` to query
- Added organization name enrichment after mapping DTOs
- Returns organization name in response

#### GetUserRoleByIdAsync

- Added `.Include(r => r.Organization)` to query
- Map organization name to DTO after retrieving role

#### GetActiveUserRolesAsync

- Added `.Include(r => r.Organization)` to query
- Added organization name enrichment

#### SearchRolesAsync

- Added `.Include(r => r.Organization)` to query
- Added organization name enrichment

## Architecture Benefits

### Multi-Tenancy at Organization Level

- **Before:** Roles were group-level only, shared across all organizations in a group
- **After:** Each organization can define its own roles independently

### Flexibility

- **Group-level roles:** Set `strOrganizationGUID = NULL` for roles shared across all organizations
- **Organization-specific roles:** Set `strOrganizationGUID` to assign role to specific organization

### Data Integrity

- Foreign key constraint ensures organization exists
- Validation ensures organization belongs to the user's group
- Composite indexes optimize filtering by group and organization

## Usage Examples

### Creating Organization-Specific Role

```json
{
  "strName": "Accountant",
  "strDesc": "Handles accounting tasks for the organization",
  "bolIsActive": true,
  "strOrganizationGUID": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Creating Group-Level Role

```json
{
  "strName": "System Administrator",
  "strDesc": "Has access across all organizations",
  "bolIsActive": true,
  "strOrganizationGUID": null
}
```

## Validation Rules

1. **Organization Validation:**

   - If `strOrganizationGUID` is provided, organization must exist
   - Organization must belong to the user's group

2. **Duplicate Check:**

   - For organization-specific roles: Name must be unique within the organization
   - For group-level roles: Name must be unique at group level

3. **Module Association:** Module GUID validation remains unchanged

## Database Schema

```sql
-- User Role with Organization Support
mstUserRoles
├── strUserRoleGUID (PK)
├── strGroupGUID (FK) → Required
├── strOrganizationGUID (FK) → Optional (nullable)
├── strModuleGUID (FK) → Optional
├── strName
├── strDesc
├── bolIsActive
├── bolSystemCreated
└── Audit fields (CreatedBy, UpdatedBy, timestamps)

-- Indexes for Performance
- IX_MstUserRoles_OrganizationGUID
- IX_MstUserRoles_Group_Organization
```

## Testing Recommendations

1. **Create Organization-Specific Role:**

   - Verify role is created with correct organization assignment
   - Verify organization name appears in response
   - Test duplicate name within same organization (should fail)
   - Test duplicate name in different organization (should succeed)

2. **Create Group-Level Role:**

   - Verify role is created without organization (NULL)
   - Test duplicate name at group level (should fail)

3. **Update Role:**

   - Change organization assignment
   - Verify validation works correctly
   - Test moving from organization-specific to group-level (set NULL)

4. **List Roles:**

   - Verify organization names appear in list responses
   - Test filtering by organization
   - Verify group-level roles are returned

5. **Retrieve Single Role:**
   - Verify organization details are included
   - Test both org-specific and group-level roles

## Build Status

✅ **Build Successful** - No compilation errors
⚠️ **Note:** Build couldn't copy output file because Central Backend is running. Restart the backend to apply changes.

## Migration Notes

- Migration script is idempotent (can be run multiple times safely)
- Existing roles will have `strOrganizationGUID = NULL` (group-level)
- No data migration needed - new column is nullable

## Related Modules

This implementation aligns with other organization-centric features:

- Organization module with `strCountryGUID`
- MstOrgTaxConfig for organization-specific tax configuration
- Multi-tenant architecture with Group → Organization hierarchy

## Next Steps for Frontend

1. Add organization dropdown in role creation form
2. Display organization name in role list
3. Add filter by organization in role list
4. Show "Group-level" badge for roles without organization
5. Add organization selector in role update form

---

**Date:** 2025-01-16  
**Status:** ✅ Complete  
**Files Modified:** 6 (Entity, 3 DTOs, Service, SQL Script)  
**Database Tables Modified:** 1 (mstUserRoles)
