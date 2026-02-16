# Schedule Import Documentation

## Overview

This document explains how to use the Schedule Import feature in the EasyAudit software.

## Import File Format

The import file should be an Excel spreadsheet (.xlsx or .xls) with the following columns:

1. **Code** - Numeric identifier for the schedule (e.g., 10001)
2. **UDFCode** - Text code for the schedule (e.g., 10001)
3. **RefNo** - Reference number (e.g., 1, 2, 3)
4. **Name** - Name of the schedule (e.g., ASSETS, LIABILITIES)
5. **TemplateCode** - Template code for the schedule (e.g., Accuri)
6. **UnderCode** - Code of the parent schedule (e.g., 0 for top level, or another Code value)
7. **ChartType** - Chart type number (e.g., 1, 2, 3)
8. **DefaultAccountTypeCode** - Default account type code
9. **IsActive** - 1 for active, 0 for inactive
10. **Editable** - 1 for editable, 0 for non-editable

## Parent-Child Relationships

The import process establishes parent-child relationships based on the UnderCode column:

- If UnderCode is 0 or empty, the item is a top-level schedule
- If UnderCode contains a Code value of another schedule, that schedule becomes the parent
- The parent-child relationship is established using the strParentScheduleGUID field

## Import Process

1. First, all schedules are imported into the database with new GUIDs
2. Then, a second pass updates all parent-child relationships based on the UnderCode values
3. Duplicate checks are performed based on the schedule code within the same group

## Error Handling

The import process reports:

- Total rows processed
- Successful imports
- Failed imports
- List of errors with row numbers
- List of duplicate schedules

## API Endpoint

```
POST /api/schedule/import
```

### Authorization

- Requires authentication
- Requires "SuperAdminOnly" policy

### Request

- Content-Type: multipart/form-data
- Body: form-data with key "file" containing the Excel file

### Response

```json
{
  "statusCode": 200,
  "message": "Import completed",
  "data": {
    "totalRows": 27,
    "successCount": 27,
    "failureCount": 0,
    "errorMessages": [],
    "duplicateSchedules": []
  }
}
```
