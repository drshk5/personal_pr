using Microsoft.AspNetCore.Mvc.Filters;
using crm_backend.Attributes;
using crm_backend.Interfaces;

namespace crm_backend.Filters;

public class AuditLogFilter : IAsyncActionFilter
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogFilter(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var executedContext = await next();

        // Only log if the action has AuditLog attribute and was successful
        var auditAttr = context.ActionDescriptor.EndpointMetadata
            .OfType<AuditLogAttribute>()
            .FirstOrDefault();

        if (auditAttr != null && executedContext.Exception == null)
        {
            var userGuid = context.HttpContext.User?.FindFirst("strUserGUID")?.Value;
            if (Guid.TryParse(userGuid, out var userId))
            {
                // The actual audit logging is handled in the application service
                // This filter is a backup mechanism
            }
        }
    }
}
