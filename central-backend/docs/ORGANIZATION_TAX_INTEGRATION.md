# Organization Tax Configuration Integration

## Overview

Tax configuration has been integrated into the Organization module. Tax settings can now be managed directly when creating or updating organizations, eliminating the need for separate tax configuration endpoints.

## Database Changes

### 1. MstOrganization Table

**New Column Added:**

- `strCountryGUID` (UNIQUEIDENTIFIER, nullable) - Links organization to a country for tax purposes
- Foreign key to `mstCountry` table
- Indexed for performance

### 2. MstOrgTaxConfig Table

**Updated Structure:**

- `strStateGUID` (UNIQUEIDENTIFIER, nullable) - Changed from strStateCode to GUID
- `bolIsDefault` (BIT, required, default: 1) - Marks default tax configuration
- `bolIsActive` (BIT, required, default: 1) - Renamed from bIsActive for consistency
- `strUpdatedByGUID` (UNIQUEIDENTIFIER, nullable) - Tracks who updated the config
- `dtUpdatedOn` (DATETIME2, nullable) - Tracks when the config was updated
- Foreign key to `mstState` table for strStateGUID

## Code Changes

### 1. Entity Updates

#### MstOrganization.cs

```csharp
public Guid? strCountryGUID { get; set; }
```

#### MstOrgTaxConfig.cs

```csharp
public bool bolIsDefault { get; set; } = true;
public Guid? strUpdatedByGUID { get; set; }
public DateTime? dtUpdatedOn { get; set; }
```

### 2. DTO Updates

#### OrganizationCreateDto.cs

**New Fields:**

```csharp
// Country for tax configuration
public Guid? strCountryGUID { get; set; }

// Tax Configuration fields (optional)
public Guid? strTaxTypeGUID { get; set; }
public string? strTaxRegNo { get; set; }
public Guid? strStateGUID { get; set; }
public DateTime? dtRegistrationDate { get; set; }
public bool bolIsDefaultTaxConfig { get; set; } = true;
public string? jsonTaxSettings { get; set; }
```

#### OrganizationUpdateDto.cs

**Same fields as CreateDto added**

### 3. Service Logic

#### OrganizationService - CreateOrganizationAsync

When creating an organization:

1. Organization record is created with `strCountryGUID`
2. If `strTaxTypeGUID` and `strTaxRegNo` are provided:
   - A `MstOrgTaxConfig` record is automatically created
   - Tax config is linked to the new organization
   - `bolIsDefault` flag is set from `bolIsDefaultTaxConfig`
   - All audit fields are populated

#### OrganizationService - UpdateOrganizationAsync

When updating an organization:

1. Organization's `strCountryGUID` is updated
2. If `strTaxTypeGUID` and `strTaxRegNo` are provided:
   - **Existing config**: Updates the tax config for that organization + tax type
   - **New config**: Creates a new `MstOrgTaxConfig` record
   - Updates `strUpdatedByGUID` and `dtUpdatedOn` fields

## API Usage

### Creating Organization with Tax Configuration

**Request:**

```json
POST /api/Organization
{
  "strOrganizationName": "TechCorp India Pvt Ltd",
  "strDescription": "Technology company in Mumbai",
  "strPAN": "AABCT1234F",
  "strCountryGUID": "guid-of-india",

  // Tax Configuration (optional)
  "strTaxTypeGUID": "guid-of-gst-india",
  "strTaxRegNo": "27AABCT1234F1Z5",
  "strStateGUID": "guid-of-maharashtra",
  "dtRegistrationDate": "2023-01-01",
  "bolIsDefaultTaxConfig": true,
  "jsonTaxSettings": "{\"EInvoiceEnabled\":true,\"CompositionScheme\":false,\"TurnoverLimit\":50000000}",

  // Year details (required)
  "dtStartDate": "2024-04-01",
  "dtEndDate": "2025-03-31",
  "strYearName": "FY 2024-25"
}
```

### Updating Organization Tax Configuration

**Request:**

```json
PUT /api/Organization/{guid}
{
  "strOrganizationName": "TechCorp India Pvt Ltd",
  "strCountryGUID": "guid-of-india",

  // Update tax config
  "strTaxTypeGUID": "guid-of-gst-india",
  "strTaxRegNo": "27AABCT1234F1Z5",
  "strStateGUID": "guid-of-karnataka",  // State changed
  "dtRegistrationDate": "2023-01-01",
  "bolIsDefaultTaxConfig": true,
  "jsonTaxSettings": "{\"EInvoiceEnabled\":true,\"CompositionScheme\":false}"
}
```

## Authorization

Tax configuration uses the same authorization as the Organization module:

- Permission: `organization_list`
- Permission Types:
  - `CanView` - View organizations and their tax configs
  - `CanSave` - Create/update organizations and tax configs
  - `CanDelete` - Delete organizations (cascades to tax configs)

## Migration Script

Execute the migration script to update existing database:

```sql
-- File: Scripts/AddCountryGUIDToOrganization.sql
-- Run against MasterDB
```

**What it does:**

1. Adds `strCountryGUID` to `mstOrganization`
2. Creates foreign key to `mstCountry`
3. Updates `mstOrgTaxConfig` structure (renames, adds columns)
4. Adds foreign key to `mstState`
5. Creates performance indexes

## Benefits

1. **Simplified Workflow**: Create organization and configure taxes in one API call
2. **Data Consistency**: Tax configuration is tied to organization lifecycle
3. **Authorization Alignment**: Tax config uses organization permissions
4. **Reduced Complexity**: No separate endpoints needed for basic tax setup
5. **Backward Compatible**: Tax fields are optional - existing organization creation still works

## Notes

- Tax configuration fields are **optional** when creating/updating organizations
- Multiple tax configurations per organization are supported (different tax types)
- The `bolIsDefault` flag helps identify the primary tax configuration
- `jsonSettings` allows storing country-specific tax settings as JSON
- Updates are idempotent - updating with same tax type updates existing config

## Testing Checklist

- [ ] Create organization without tax config (should work)
- [ ] Create organization with complete tax config
- [ ] Update organization to add tax config
- [ ] Update organization to modify existing tax config
- [ ] Create organization with multiple tax types (call API twice with different tax types)
- [ ] Verify foreign key constraints work correctly
- [ ] Test authorization with users having different permissions
- [ ] Verify audit fields are populated correctly (Created/Updated By/Date)

## Example Scenarios

### Scenario 1: Indian Company with GST

```json
{
  "strCountryGUID": "<India GUID>",
  "strTaxTypeGUID": "<GST India GUID>",
  "strTaxRegNo": "27AABCT1234F1Z5",
  "strStateGUID": "<Maharashtra GUID>",
  "dtRegistrationDate": "2023-01-01",
  "jsonTaxSettings": "{\"EInvoiceEnabled\":true,\"CompositionScheme\":false}"
}
```

### Scenario 2: UK Company with VAT

```json
{
  "strCountryGUID": "<UK GUID>",
  "strTaxTypeGUID": "<VAT UK GUID>",
  "strTaxRegNo": "GB123456789",
  "strStateGUID": null,
  "dtRegistrationDate": "2023-01-01",
  "jsonTaxSettings": "{\"MTDEnabled\":true,\"VATScheme\":\"Standard\"}"
}
```

### Scenario 3: US Company with Sales Tax

```json
{
  "strCountryGUID": "<USA GUID>",
  "strTaxTypeGUID": "<Sales Tax GUID>",
  "strTaxRegNo": "CA-987654321",
  "strStateGUID": "<California GUID>",
  "dtRegistrationDate": "2023-01-01",
  "jsonTaxSettings": "{\"NexusStates\":[\"CA\",\"NY\"],\"EconomicNexusEnabled\":true}"
}
```
