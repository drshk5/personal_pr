namespace crm_backend.Middleware;

public class TenantContextMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantContextMiddleware> _logger;

    public TenantContextMiddleware(RequestDelegate next, ILogger<TenantContextMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip for health check and swagger
        var path = context.Request.Path.Value?.ToLower() ?? "";
        if (path.Contains("/status") || path.Contains("/swagger"))
        {
            await _next(context);
            return;
        }

        // Extract strGroupGUID from JWT claims
        var groupGuidClaim = context.User?.FindFirst("strGroupGUID")?.Value;
        if (!string.IsNullOrEmpty(groupGuidClaim))
        {
            context.Items["TenantId"] = groupGuidClaim;
            _logger.LogDebug("Tenant context set: {TenantId}", groupGuidClaim);
        }

        await _next(context);
    }
}
