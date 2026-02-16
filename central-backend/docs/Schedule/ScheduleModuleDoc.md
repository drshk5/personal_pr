# Schedule Module Documentation

This document describes the implementation of the Schedule module (`mstSchedule`) in the EasyAudit software.

## Overview

The Schedule module allows users to manage schedules with various properties. The module supports full CRUD operations (Create, Read, Update, Delete) with role-based access control.

## Entity Structure

The `MstSchedule` entity contains the following fields:

- `strScheduleGUID`: Unique identifier (primary key)
- `code`: Integer code
- `strScheduleCode`: String code (max 50 chars)
- `dblRefNo`: Double reference number
- `strScheduleName`: Name of the schedule (max 100 chars)
- `strRemplateName`: Template name (max 100 chars)
- `strUnderCode`: Under code (max 50 chars)
- `strParentScheduleGUID`: Parent schedule's GUID
- `dblChartType`: Chart type value
- `strDefaultAccountTypeGUID`: Default account type GUID
- `bolIsActive`: Active status flag
- `bolIsEditable`: Editable status flag
- `strGroupGUID`: Group identifier
- `strCreatedByGUID`: Creator's identifier
- `dtCreatedOn`: Creation timestamp
- `strUpdatedByGUID`: Updater's identifier (nullable)
- `dtUpdatedOn`: Update timestamp (nullable)

## Authorization Rules

The Schedule module implements the following authorization rules:

1. **View Access**: All authenticated users with the appropriate permission can view schedules.
2. **Create/Edit/Delete Access**: Only users with the SuperAdmin role can create, edit, or delete schedules.

## API Endpoints

The following API endpoints are available:

### GET `/api/schedule`

Lists all schedules with pagination and filtering options.

Parameters:

- `pageNumber`: Page number (default: 1)
- `pageSize`: Items per page (default: 10)
- `search`: Search term for filtering
- `bolIsActive`: Filter by active status
- `createdByGUIDs`: Filter by creators
- `updatedByGUIDs`: Filter by updaters
- `sortBy`: Field to sort by
- `ascending`: Sort direction (true for ascending, false for descending)

### GET `/api/schedule/{guid}`

Retrieves a specific schedule by its GUID.

### POST `/api/schedule`

Creates a new schedule (SuperAdmin only).

### PUT `/api/schedule/{guid}`

Updates an existing schedule (SuperAdmin only).

### DELETE `/api/schedule/{guid}`

Deletes a schedule (SuperAdmin only).

### GET `/api/schedule/active`

Lists all active schedules in a simplified format.

### GET `/api/schedule/export`

Exports schedules in Excel or CSV format (SuperAdmin only).

Parameters:

- `format`: "excel" or "csv"

## Permission Configuration

To grant access to the Schedule module, the following permissions need to be configured in the menu system:

1. Add "schedule_list" and "schedule_form" to the `mstMenu` table with appropriate mapping.
2. Configure user rights in `mstUserRights` table based on roles:
   - For SuperAdmin: Grant all permissions
   - For other users: Grant only view permission

## Implementation Details

- The implementation follows a standard repository pattern with separation of concerns.
- DTOs are used to handle data transfer between the API and clients.
- Entity validation is performed in the service layer.
- Pagination, filtering and sorting are supported for list operations.
