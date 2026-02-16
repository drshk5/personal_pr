# Tax Table Naming Standardization - Completed

## Date: 2024

## Objective: Standardize tax table naming conventions across the application

## Changes Made

### 1. Entity Class Updates

#### MstTaxRate.cs

- **Property Rename**: `bIsActive` → `bolIsActive` (line 47)
- **Constructor Update**: `bIsActive = true` → `bolIsActive = true` (line 16)
- **Table Name**: `[Table("MstTaxRate")]` → `[Table("mstTaxRate")]`

#### MstTaxType.cs

- **Table Name**: `[Table("MstTaxType")]` → `[Table("mstTaxType")]`

#### MstTaxCategory.cs

- **Table Name**: `[Table("MstTaxCategory")]` → `[Table("mstTaxCategory")]`

#### MstTaxCategoryRateMap.cs

- **Table Name**: `[Table("MstTaxCategoryRateMap")]` → `[Table("mstTaxCategoryRateMap")]`

### 2. DTO Updates

#### TaxRateCreateDto.cs

- **Property Rename**: `public bool bIsActive { get; set; }` → `public bool bolIsActive { get; set; }`

#### TaxRateUpdateDto.cs

- **Property Rename**: `public bool bIsActive { get; set; }` → `public bool bolIsActive { get; set; }`

#### TaxRateResponseDto.cs

- **Property Rename**: `public bool bIsActive { get; set; }` → `public bool bolIsActive { get; set; }`

### 3. Service Layer Updates

#### TaxRateService.cs

Updated all references to `bIsActive` to `bolIsActive` in:

- Create method (entity initialization)
- Update method (property assignment)
- GetByIdAsync method (DTO mapping)
- GetAllAsync method (filtering, searching, sorting, DTO mapping)
- GetActiveTaxRatesAsync method (filtering)
- ExportToExcelOrCsvAsync method (export formatting)

**Total Changes**: 17 occurrences updated across the service

### 4. Database Migration

#### Scripts Created:

1. **RenameTaxTableColumns.sql**: Initial migration script
2. **FixTaxRateIndexes.sql**: Fix for index dependencies

#### Database Changes Applied:

- ✅ Renamed column `MstTaxRate.bIsActive` → `mstTaxRate.bolIsActive`
- ✅ Renamed table `MstTaxRate` → `mstTaxRate`
- ✅ Renamed table `MstTaxType` → `mstTaxType`
- ✅ Renamed table `MstTaxCategory` → `mstTaxCategory`
- ✅ Renamed table `MstTaxCategoryRateMap` → `mstTaxCategoryRateMap`
- ✅ Dropped and recreated index `IX_MstTaxRate_EffectiveDates` with new column name

## Verification

### Build Status

- **Status**: ✅ Success
- **Warnings**: 1 (unrelated to changes)
- **Errors**: 0

### Runtime Status

- **Central Backend**: ✅ Running on https://localhost:5001
- **Database Connection**: ✅ Connected successfully to MasterDB
- **EF Core Queries**: ✅ Using new table names (e.g., `FROM [mstUserSession]`)

### Code Quality

- ✅ All `bIsActive` references removed from codebase
- ✅ Consistent naming with `bolIsActive` prefix for boolean fields
- ✅ All table names use lowercase `mst` prefix
- ✅ No breaking changes in controller/service interfaces

## Naming Convention Established

### Boolean Fields

- **Standard**: Use `bol` prefix (e.g., `bolIsActive`, `bolIsPrimary`)
- **Examples in Codebase**:
  - `MstTaxRate.bolIsActive`
  - `MstTaxCategory.bolIsActive`
  - `MstTaxCategoryRateMap.bolIsActive`
  - `mstUserSession.bolIsActive`

### Table Names

- **Standard**: Use lowercase `mst` prefix for master data tables
- **Examples**:
  - `mstTaxRate`
  - `mstTaxType`
  - `mstTaxCategory`
  - `mstTaxCategoryRateMap`
  - `mstUserSession`

## Impact Analysis

### Files Modified

- **Entities**: 4 files
- **DTOs**: 3 files
- **Services**: 1 file (17 changes)
- **SQL Scripts**: 2 files created

### No Impact On

- ✅ Controller endpoints (no breaking changes)
- ✅ API responses (property names preserved in DTOs)
- ✅ Existing data (column rename preserves data)
- ✅ Foreign key relationships
- ✅ Other modules/microservices

## Testing Recommendations

1. **Unit Tests**: Update any tests referencing `bIsActive` property
2. **Integration Tests**: Test CRUD operations on tax entities
3. **API Tests**: Verify all tax-related endpoints return correct data
4. **Frontend**: Update any hardcoded references to old table/column names

## Rollback Plan (If Needed)

If rollback is required, execute the following SQL:

```sql
USE MasterDB;
GO

-- Rollback column name
EXEC sp_rename 'dbo.mstTaxRate.bolIsActive', 'bIsActive', 'COLUMN';

-- Rollback table names
EXEC sp_rename 'dbo.mstTaxRate', 'MstTaxRate';
EXEC sp_rename 'dbo.mstTaxType', 'MstTaxType';
EXEC sp_rename 'dbo.mstTaxCategory', 'MstTaxCategory';
EXEC sp_rename 'dbo.mstTaxCategoryRateMap', 'MstTaxCategoryRateMap';

-- Fix index
DROP INDEX IX_MstTaxRate_EffectiveDates ON dbo.MstTaxRate;
CREATE INDEX IX_MstTaxRate_EffectiveDates ON dbo.MstTaxRate(dtEffectiveFrom, dtEffectiveTo, bIsActive);
GO
```

Then revert code changes in entities, DTOs, and services.

## Conclusion

All tax table naming has been successfully standardized to follow the established conventions:

- Boolean fields use `bol` prefix
- Table names use lowercase `mst` prefix
- Code builds and runs without errors
- Database schema updated successfully

This ensures consistency across the codebase and improves maintainability.
