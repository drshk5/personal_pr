# DateTime Handling Improvements in EasyAudit

## Overview

This document outlines the changes made to improve DateTime handling in the EasyAudit application, specifically changing from UTC to Indian Standard Time (IST) format consistently across the application.

## Changes Implemented

1. **DateTimeProvider Class**

   - Created a centralized provider for consistent IST time handling
   - Includes methods for current time, formatted displays, and offset calculations
   - Located in: `Helpers/DateTimeProvider.cs`

2. **ServiceBase Abstract Class**

   - All services now inherit from this base class
   - Provides consistent access to DateTime operations
   - Includes helper methods for formatting and time calculations
   - Located in: `Services/ServiceBase.cs`

3. **AppDbContext Modifications**

   - Added DateTime interception in SaveChanges to ensure consistent handling
   - Automatically handles DateTime conversions and formatting

4. **Response DTOs Enhancement**

   - Added formatted date string properties for frontend display
   - Format: `dd-MMM-yyyy hh:mm:ss tt` for timestamps
   - Format: `dd-MMM-yyyy` for dates

5. **Global DateTime Access**
   - Added DateTimeProvider to GlobalUsings.cs for easy access

## Usage Guidelines

### In Services

Services should:

1. Inherit from `ServiceBase`
2. Use `CurrentDateTime` instead of `DateTime.UtcNow`
3. Use `GetDateTimeWithOffset(minutes)` instead of `DateTime.UtcNow.AddMinutes()`
4. Use `GetDateTimeWithDaysOffset(days)` instead of `DateTime.UtcNow.AddDays()`

Example:

```csharp
// Good:
var now = CurrentDateTime;
var expiryDate = GetDateTimeWithOffset(30); // 30 minutes from now
var licenseEndDate = GetDateTimeWithDaysOffset(365); // 1 year from now

// Bad (don't use these anymore):
var now = DateTime.UtcNow;
var expiryDate = DateTime.UtcNow.AddMinutes(30);
var licenseEndDate = DateTime.UtcNow.AddDays(365);
```

### In DTOs

Response DTOs should include formatted string properties:

```csharp
// DateTime property
public DateTime dtCreatedOn { get; set; }

// Formatted string property for display
public string strFormattedCreatedOn => dtCreatedOn.ToString("dd-MMM-yyyy hh:mm:ss tt");
```

### In Frontend

Use the formatted string properties from DTOs for display:

```typescript
// Instead of formatting dates in the frontend
// <div>{formatDate(organization.dtCreatedOn)}</div>

// Use the pre-formatted string
<div>{organization.strFormattedCreatedOn}</div>
```

## PowerShell Script

A PowerShell script was created to help automate the update process for service classes:

- Location: `Scripts/UpdateDateTimeReferences.ps1`
- Usage: `.\Scripts\UpdateDateTimeReferences.ps1 -FilePath "path/to/service.cs"`
- Or process all services: `.\Scripts\UpdateDateTimeReferences.ps1`

## Future Improvements

- Consider using TimeZoneInfo for more robust time zone handling
- Add unit tests for DateTime conversions
- Consider adding client-side time zone detection for better user experience
