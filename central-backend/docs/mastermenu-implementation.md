# MasterMenu Implementation

## Overview
This document describes the implementation of the MasterMenu functionality based on the existing Menu structure, excluding the `searchPages` endpoint as requested.

## What Was Created

### 1. Entity Model
- **File**: `Models/Entities/MstMasterMenu.cs`
- **Description**: Entity model for master menu items with the same structure as MstMenu
- **Key Properties**:
  - `strMasterMenuGUID` (Primary Key)
  - `strParentMasterMenuGUID` (Foreign Key to self for hierarchical structure)
  - `strName`, `strPath`, `strMenuPosition`, `strMapKey`
  - `dblSeqNo`, `bolHasSubMenu`, `bolIsActive`, `bolSuperAdminAccess`
  - `strIconName` (optional)

### 2. DTOs (Data Transfer Objects)
- **File**: `DTOs/MasterMenu/MasterMenuCreateDto.cs`
  - Used for creating and updating master menu items
  - Includes validation attributes for required fields
  
- **File**: `DTOs/MasterMenu/MasterMenuResponseDto.cs`
  - Used for returning master menu data
  - Includes parent menu information
  
- **File**: `DTOs/MasterMenu/MasterMenuFilterDto.cs`
  - Used for filtering and pagination in list operations
  - Inherits from BaseFilterDto

### 3. Service Interface
- **File**: `Interfaces/IMasterMenuService.cs`
  - Defines contract for master menu operations
  - Includes CRUD operations and export functionality

### 4. Service Implementation
- **File**: `Services/MasterMenuService.cs`
  - Implements all master menu business logic
  - Includes validation for duplicate names, paths, and map keys
  - Supports hierarchical menu structure
  - Includes Excel and CSV export functionality

### 5. Controller
- **File**: `Controllers/MasterMenuController.cs`
  - RESTful API endpoints for master menu operations
  - Inherits from BaseDeletionController for consistent deletion behavior
  - Includes all endpoints except `searchPages` as requested

## API Endpoints

### 1. GET `/api/MasterMenu/{guid}`
- **Purpose**: Retrieve a specific master menu by GUID
- **Authentication**: Required
- **Response**: Master menu details with parent information

### 2. POST `/api/MasterMenu`
- **Purpose**: Create a new master menu item
- **Authentication**: Required
- **Body**: MasterMenuCreateDto
- **Response**: Created master menu with generated GUID

### 3. PUT `/api/MasterMenu/{guid}`
- **Purpose**: Update an existing master menu item
- **Authentication**: Required
- **Body**: MasterMenuCreateDto
- **Response**: Updated master menu details

### 4. DELETE `/api/MasterMenu/{guid}`
- **Purpose**: Delete a master menu item
- **Authentication**: Required
- **Response**: Success/failure message

### 5. GET `/api/MasterMenu`
- **Purpose**: Get paginated list of master menus
- **Authentication**: Required
- **Query Parameters**: pageNumber, pageSize, sortBy, ascending, search
- **Response**: Paged list of master menus

### 6. GET `/api/MasterMenu/parent-menu`
- **Purpose**: Get available parent master menus (excluding current item)
- **Authentication**: Required
- **Query Parameters**: masterMenuGUID, search (optional)
- **Response**: List of available parent menus

### 7. GET `/api/MasterMenu/export`
- **Purpose**: Export master menus to Excel or CSV format
- **Authentication**: Required (SuperAdminOnly policy)
- **Query Parameters**: format (excel or csv)
- **Response**: File download

## Database Changes

### 1. AppDbContext
- Added `DbSet<MstMasterMenu> MstMasterMenus` property
- Entity will be automatically discovered by Entity Framework

### 2. Dependencies
- Added `IMasterMenuService` to dependency injection container
- Added AutoMapper mappings for MasterMenu entities and DTOs

## AutoMapper Configuration

The following mappings were added to `AutoMapperProfile.cs`:

```csharp
// MasterMenu mappings
CreateMap<MasterMenuCreateDto, MstMasterMenu>();
CreateMap<MstMasterMenu, MasterMenuResponseDto>()
    .ForMember(dest => dest.strMasterMenuGUID, 
        opt => opt.MapFrom(src => src.strMasterMenuGUID.ToString()))
    .ForMember(dest => dest.strParentMasterMenuGUID, 
        opt => opt.MapFrom(src => src.strParentMasterMenuGUID.HasValue ? src.strParentMasterMenuGUID.Value.ToString() : null))
    .ForMember(dest => dest.strParentMasterMenuName,
        opt => opt.MapFrom(src => src.ParentMasterMenu != null ? src.ParentMasterMenu.strName : null));
```

## Testing

### 1. Unit Tests
- **File**: `Tests/MasterMenuTest.cs`
- **Coverage**: DTO validation and property access
- **Tests**:
  - MasterMenuCreateDto validation (success case)
  - MasterMenuCreateDto validation (failure case for required fields)
  - MasterMenuResponseDto property access

## Key Features

### 1. Hierarchical Structure
- Supports parent-child relationships between master menus
- Prevents circular references
- Maintains referential integrity

### 2. Validation
- Duplicate name prevention within same parent
- Duplicate path prevention across all menus
- Duplicate map key prevention
- Required field validation

### 3. Export Functionality
- Excel export with formatted headers and data
- CSV export with proper escaping
- SuperAdmin access restriction

### 4. Security
- JWT authentication required for all endpoints
- SuperAdmin policy for export functionality
- Proper authorization middleware integration

## Usage Examples

### Creating a Root Master Menu
```json
POST /api/MasterMenu
{
  "strName": "Main Menu",
  "strPath": "/main",
  "strMenuPosition": "left",
  "strMapKey": "main_menu",
  "dblSeqNo": 1.0,
  "bolHasSubMenu": true,
  "bolIsActive": true,
  "bolSuperAdminAccess": false
}
```

### Creating a Child Master Menu
```json
POST /api/MasterMenu
{
  "strParentMasterMenuGUID": "parent-guid-here",
  "strName": "Sub Menu",
  "strPath": "/main/sub",
  "strMenuPosition": "left",
  "strMapKey": "sub_menu",
  "dblSeqNo": 1.0,
  "bolHasSubMenu": false,
  "bolIsActive": true,
  "bolSuperAdminAccess": false
}
```

## Notes

1. **Excluded Endpoint**: The `searchPages` endpoint was intentionally excluded as requested
2. **Naming Convention**: All properties follow the existing naming convention (e.g., `strMasterMenuGUID`)
3. **Inheritance**: Controller inherits from BaseDeletionController for consistent deletion behavior
4. **Validation**: Uses the same validation patterns as the existing Menu implementation
5. **Export**: Supports both Excel and CSV formats with proper formatting

## Next Steps

1. **Database Migration**: Create and run Entity Framework migration for the new table
2. **Frontend Integration**: Implement frontend components to consume the new API
3. **Testing**: Perform integration testing with the database
4. **Documentation**: Update API documentation (Swagger) to include new endpoints
