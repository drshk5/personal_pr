using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace crm_backend.Attributes;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequireTenantIdAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var tenantId = context.HttpContext.Items["TenantId"] as string;
        if (string.IsNullOrEmpty(tenantId) || !Guid.TryParse(tenantId, out _))
        {
            context.Result = new BadRequestObjectResult(new
            {
                statusCode = 400,
                message = "Tenant ID (strGroupGUID) is required"
            });
        }
    }
}
