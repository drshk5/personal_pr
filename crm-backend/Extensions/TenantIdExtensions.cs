namespace crm_backend.Extensions;

public static class TenantIdExtensions
{
    public static Guid GetTenantIdFromContext(this HttpContext context)
    {
        var tenantId = context.Items["TenantId"] as string;
        return tenantId != null ? Guid.Parse(tenantId) : Guid.Empty;
    }
}
