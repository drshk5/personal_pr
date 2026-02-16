using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using AuditSoftware.Data;
using AuditSoftware.Helpers;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace AuditSoftware.Attributes
{
    /// <summary>
    /// Permission types for menu actions
    /// </summary>
    public enum PermissionType
    {
        CanView,
        CanSave,
        CanDelete,
        CanPrint,
        CanExport,
        CanEdit,
        CanApprove
    }

    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
    public class AuthorizePermissionAttribute : TypeFilterAttribute
    {
        /// <summary>
        /// Authorizes access to an endpoint based on user's permissions
        /// </summary>
        /// <param name="mapKey">The key mapped to a menu in mstMenu table</param>
        /// <param name="permission">The type of permission required</param>
        /// <param name="resourceName">Optional name of the resource for more specific error messages</param>
        public AuthorizePermissionAttribute(string mapKey, PermissionType permission, string? resourceName = null) 
            : base(typeof(AuthorizePermissionFilter))
        {
            Arguments = new object[] { mapKey, permission, resourceName ?? string.Empty };
        }
        
        private class AuthorizePermissionFilter : IAsyncActionFilter
        {
            private readonly string _mapKey;
            private readonly PermissionType _permission;
            private readonly string _resourceName;
            private readonly ILogger<AuthorizePermissionFilter> _logger;
            private readonly AppDbContext _dbContext;
            
            public AuthorizePermissionFilter(
                string mapKey, 
                PermissionType permission,
                string resourceName,
                ILogger<AuthorizePermissionFilter> logger,
                AppDbContext dbContext)
            {
                _mapKey = mapKey;
                _permission = permission;
                _resourceName = string.IsNullOrEmpty(resourceName) ? "resource" : resourceName;
                _logger = logger;
                _dbContext = dbContext;
            }
            
            public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
            {
                _logger.LogInformation($"Checking permission: {_permission} for mapKey: {_mapKey}");
                
                // Step 1: Extract roleGUID and groupGUID from JWT token
                var user = context.HttpContext.User;
                if (user?.Identity == null || !user.Identity.IsAuthenticated)
                {
                    _logger.LogWarning("User is not authenticated");
                    context.Result = new UnauthorizedResult();
                    return;
                }
                
                var roleGuidClaim = user.Claims.FirstOrDefault(c => c.Type == "strRoleGUID");
                if (roleGuidClaim == null)
                {
                    _logger.LogWarning("Role GUID claim not found in token");
                    context.Result = new ForbidResult();
                    return;
                }
                
                // Extract groupGUID from JWT token
                var groupGuidClaim = user.Claims.FirstOrDefault(c => c.Type == "strGroupGUID");
                if (groupGuidClaim == null)
                {
                    _logger.LogWarning("Group GUID claim not found in token");
                    context.Result = new ForbidResult();
                    return;
                }
                
                string roleGuid = roleGuidClaim.Value;
                string groupGuid = groupGuidClaim.Value;
                _logger.LogInformation($"Found roleGUID: {roleGuid}, groupGUID: {groupGuid} in token");
                
                // Special case for superadmin - they have all permissions
                var isSuperAdmin = await _dbContext.MstUserRoles
                    .AnyAsync(r => r.strUserRoleGUID == GuidHelper.ToGuid(roleGuid) && r.strName.ToLower() == "superadmin");
                    
                if (isSuperAdmin)
                {
                    _logger.LogInformation("User is a superadmin, permission granted automatically");
                    await next();
                    return;
                }
                
                // Step 2: Get menuGUID by using the mapKey and groupGUID
                // Parse the groupGuid from string to Guid for comparison
                if (!Guid.TryParse(groupGuid, out Guid parsedGroupGuid))
                {
                    _logger.LogWarning($"Invalid group GUID format: {groupGuid}");
                    context.Result = new ObjectResult(new 
                    { 
                        statusCode = 403, 
                        message = "Invalid group identifier" 
                    })
                    {
                        StatusCode = 403
                    };
                    return;
                }
                
                var menu = await _dbContext.MstMenus
                    .Where(m => m.strMapKey == _mapKey && m.strGroupGUID == parsedGroupGuid)
                    .Select(m => new { m.strMenuGUID })
                    .FirstOrDefaultAsync();
                    
                if (menu == null)
                {
                    _logger.LogWarning($"No menu found with mapKey: {_mapKey} for group: {groupGuid}");
                    context.Result = new ObjectResult(new 
                    { 
                        statusCode = 403, 
                        message = "Required menu configuration not found for your group" 
                    })
                    {
                        StatusCode = 403
                    };
                    return;
                }
                
                string menuGuid = menu.strMenuGUID.ToString();
                _logger.LogInformation($"Found menuGUID: {menuGuid} for mapKey: {_mapKey} and group: {groupGuid}");
                
                // Step 3: Fetch permission from mstUserRights
                var userRights = await _dbContext.MstUserRights
                    .FirstOrDefaultAsync(ur => ur.strUserRoleGUID == GuidHelper.ToGuid(roleGuid) && ur.strMenuGUID.ToString() == menuGuid);
                    
                if (userRights == null)
                {
                    _logger.LogWarning($"No rights found for role {roleGuid} and menu {menuGuid}");
                    context.Result = new ObjectResult(new 
                    { 
                        statusCode = 403, 
                        message = "You don't have permission to perform this action" 
                    })
                    {
                        StatusCode = 403
                    };
                    return;
                }
                
                // Step 4: Check if user has the required permission
                bool hasPermission = false;
                
                switch (_permission)
                {
                    case PermissionType.CanView:
                        hasPermission = userRights.bolCanView;
                        break;
                    case PermissionType.CanSave:
                        hasPermission = userRights.bolCanSave;
                        break;
                    case PermissionType.CanDelete:
                        hasPermission = userRights.bolCanDelete;
                        break;
                    case PermissionType.CanPrint:
                        hasPermission = userRights.bolCanPrint;
                        break;
                    case PermissionType.CanExport:
                        hasPermission = userRights.bolCanExport;
                        break;
                    case PermissionType.CanEdit:
                        hasPermission = userRights.bolCanEdit;
                        break;
                    case PermissionType.CanApprove:
                        hasPermission = userRights.bolCanApprove;
                        break;
                }
                
                if (!hasPermission)
                {
                    _logger.LogWarning($"User with role {roleGuid} doesn't have {_permission} permission for menu {menuGuid}");
                    
                    // Create more specific error message based on the permission type and resource name
                    string action = _permission switch
                    {
                        PermissionType.CanView => "view",
                        PermissionType.CanSave => "save",
                        PermissionType.CanEdit => "edit",
                        PermissionType.CanDelete => "delete",
                        PermissionType.CanPrint => "print",
                        PermissionType.CanExport => "export",
                        PermissionType.CanApprove => "approve",
                        _ => _permission.ToString().ToLower().Substring(3)
                    };
                    
                    string errorMessage = $"You don't have rights to {action} {_resourceName}";
                    
                    context.Result = new ObjectResult(new 
                    { 
                        statusCode = 403, 
                        message = errorMessage
                    })
                    {
                        StatusCode = 403
                    };
                    return;
                }
                
                _logger.LogInformation($"Permission check passed for {_permission} on {_mapKey}");
                
                // User has permission, proceed with the action
                await next();
            }
        }
    }
}
