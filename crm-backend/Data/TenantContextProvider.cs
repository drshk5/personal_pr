namespace crm_backend.Data;

public interface ITenantContextProvider
{
    Guid GetTenantId();
    Guid GetCurrentUserId();
    string GetCurrentUserName();
    Guid GetOrganizationId();
    Guid GetModuleId();
}

public class TenantContextProvider : ITenantContextProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantContextProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid GetTenantId()
    {
        var tenantId = _httpContextAccessor.HttpContext?.Items["TenantId"] as string;
        return tenantId != null ? Guid.Parse(tenantId) : Guid.Empty;
    }

    public Guid GetOrganizationId()
    {
        var organizationGuid = _httpContextAccessor.HttpContext?.User?.FindFirst("strOrganizationGUID")?.Value;
        return organizationGuid != null ? Guid.Parse(organizationGuid) : Guid.Empty;
    }

    public Guid GetModuleId()
    {
        var moduleGuid = _httpContextAccessor.HttpContext?.User?.FindFirst("strModuleGUID")?.Value;
        return moduleGuid != null ? Guid.Parse(moduleGuid) : Guid.Empty;
    }

    public Guid GetCurrentUserId()
    {
        var userId = _httpContextAccessor.HttpContext?.User?.FindFirst("strUserGUID")?.Value;
        return userId != null ? Guid.Parse(userId) : Guid.Empty;
    }

    public string GetCurrentUserName()
    {
        return _httpContextAccessor.HttpContext?.User?.FindFirst("strName")?.Value ?? "System";
    }
}
