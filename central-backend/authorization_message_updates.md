# Authorization Error Message Updates

## Summary of Changes

- Enhanced the `AuthorizePermissionAttribute` to include resource names in error messages
- Updated all controllers to use resource-specific permission messages
- Standardized error messages across all modules

## Error Messages by Module and Permission

### Year Module

- View Permission: "You don't have rights to view Year"
- Save Permission: "You don't have rights to save Year"
- Edit Permission: "You don't have rights to edit Year"
- Delete Permission: "You don't have rights to delete Year"

### Organization Module

- View Permission: "You don't have rights to view Organization"
- Save Permission: "You don't have rights to save Organization"
- Edit Permission: "You don't have rights to edit Organization"
- Delete Permission: "You don't have rights to delete Organization"

### User Module

- View Permission: "You don't have rights to view User"
- Save Permission: "You don't have rights to save User"
- Edit Permission: "You don't have rights to edit User"
- Delete Permission: "You don't have rights to delete User"

### UserRole Module

- View Permission: "You don't have rights to view UserRole"
- Save Permission: "You don't have rights to save UserRole"
- Edit Permission: "You don't have rights to edit UserRole"
- Delete Permission: "You don't have rights to delete UserRole"

### UserRights Module

- View Permission: "You don't have rights to view UserRights"
- Save Permission: "You don't have rights to save UserRights"
- Edit Permission: "You don't have rights to edit UserRights"
- Delete Permission: "You don't have rights to delete UserRights"

### PicklistValue Module

- View Permission: "You don't have rights to view PicklistValue"
- Save Permission: "You don't have rights to save PicklistValue"
- Edit Permission: "You don't have rights to edit PicklistValue"
- Delete Permission: "You don't have rights to delete PicklistValue"

## Implementation Details

1. Modified `AuthorizePermissionAttribute` to accept a resource name parameter:

```csharp
public AuthorizePermissionAttribute(string mapKey, PermissionType permission, string? resourceName = null)
    : base(typeof(AuthorizePermissionFilter))
{
    Arguments = new object[] { mapKey, permission, resourceName ?? string.Empty };
}
```

2. Updated the error message generation in `AuthorizePermissionFilter`:

```csharp
string action = _permission switch
{
    PermissionType.CanView => "view",
    PermissionType.CanSave => "save",
    PermissionType.CanEdit => "edit",
    PermissionType.CanDelete => "delete",
    PermissionType.CanPrint => "print",
    PermissionType.CanExport => "export",
    _ => _permission.ToString().ToLower().Substring(3)
};

string errorMessage = $"You don't have rights to {action} {_resourceName}";
```

3. Updated all controller endpoints with the new attribute format, for example:

```csharp
[HttpPost]
[AuthorizePermission("year_form", PermissionType.CanSave, "Year")]
public async Task<ActionResult<YearResponseDto>> Create([FromBody] YearCreateDto createDto)
```
