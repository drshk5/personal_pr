using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using AuditSoftware.Data;
using AuditSoftware.Helpers;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace AuditSoftware.Attributes
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false)]
    public class RequirePermissionAttribute : TypeFilterAttribute
    {
        /// <summary>
        /// Authorizes access to an endpoint based on specific role requirements
        /// </summary>
        /// <param name="requirement">The specific requirement needed (e.g., "SuperAdminOnly")</param>
        public RequirePermissionAttribute(string requirement) 
            : base(typeof(RequirePermissionFilter))
        {
            Arguments = new object[] { requirement };
        }
        
        private class RequirePermissionFilter : IAsyncActionFilter
        {
            private readonly string _requirement;
            private readonly ILogger<RequirePermissionFilter> _logger;
            private readonly AppDbContext _dbContext;
            
            public RequirePermissionFilter(
                string requirement,
                ILogger<RequirePermissionFilter> logger,
                AppDbContext dbContext)
            {
                _requirement = requirement;
                _logger = logger;
                _dbContext = dbContext;
            }
            
            public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
            {
                _logger.LogInformation($"Checking requirement: {_requirement}");
                
                // Extract user information from JWT token
                var user = context.HttpContext.User;
                if (user?.Identity == null || !user.Identity.IsAuthenticated)
                {
                    _logger.LogWarning("User is not authenticated");
                    context.Result = new UnauthorizedResult();
                    return;
                }
                
                // Handle the "SuperAdminOnly" requirement
                if (_requirement == "SuperAdminOnly")
                {
                    var roleGuidClaim = user.Claims.FirstOrDefault(c => c.Type == "strRoleGUID");
                    if (roleGuidClaim == null)
                    {
                        _logger.LogWarning("Role GUID claim not found in token");
                        context.Result = new ForbidResult();
                        return;
                    }
                    
                    string roleGuid = roleGuidClaim.Value;
                    
                    // Check if user is a superadmin
                    var isSuperAdmin = await _dbContext.MstUserRoles
                        .AnyAsync(r => r.strUserRoleGUID == GuidHelper.ToGuid(roleGuid) && r.strName.ToLower() == "superadmin");
                        
                    if (!isSuperAdmin)
                    {
                        _logger.LogWarning($"User with role {roleGuid} is not a superadmin");
                        context.Result = new ObjectResult(new 
                        { 
                            statusCode = 403, 
                            message = "This action requires Super Admin privileges" 
                        })
                        {
                            StatusCode = 403
                        };
                        return;
                    }
                    
                    _logger.LogInformation("User is a superadmin, access granted");
                }
                // Add other requirements handling here if needed
                else
                {
                    _logger.LogWarning($"Unknown requirement: {_requirement}");
                    context.Result = new ObjectResult(new 
                    { 
                        statusCode = 403, 
                        message = "Unknown permission requirement" 
                    })
                    {
                        StatusCode = 403
                    };
                    return;
                }
                
                // Requirement passed, proceed with the action
                await next();
            }
        }
    }
}
