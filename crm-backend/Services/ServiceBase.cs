using crm_backend.Data;

namespace crm_backend.Services;

public abstract class ServiceBase
{
    protected readonly ITenantContextProvider _tenantContextProvider;
    protected readonly ILogger _logger;

    protected ServiceBase(ITenantContextProvider tenantContextProvider, ILogger logger)
    {
        _tenantContextProvider = tenantContextProvider;
        _logger = logger;
    }

    protected Guid GetTenantId() => _tenantContextProvider.GetTenantId();
    protected Guid GetCurrentUserId() => _tenantContextProvider.GetCurrentUserId();
    protected string GetCurrentUserName() => _tenantContextProvider.GetCurrentUserName();
}
