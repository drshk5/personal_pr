using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace crm_backend.Attributes;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class AuthorizePermissionAttribute : Attribute, IAuthorizationFilter
{
    private readonly string _module;
    private readonly string _action;

    public AuthorizePermissionAttribute(string module, string action)
    {
        _module = module;
        _action = action;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        if (!user.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // Check permissions from JWT claims
        var permissions = user.FindFirst("permissions")?.Value;
        if (permissions != null)
        {
            var requiredPermission = $"{_module}:{_action}";
            if (!permissions.Contains(requiredPermission, StringComparison.OrdinalIgnoreCase))
            {
                context.Result = new ForbidResult();
                return;
            }
        }
    }
}
