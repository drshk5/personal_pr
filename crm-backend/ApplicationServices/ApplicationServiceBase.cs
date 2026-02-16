using crm_backend.Data;
using crm_backend.DataAccess.Repositories;

namespace crm_backend.ApplicationServices;

public abstract class ApplicationServiceBase
{
    protected readonly IUnitOfWork _unitOfWork;
    protected readonly ITenantContextProvider _tenantContextProvider;
    protected readonly ILogger _logger;

    protected ApplicationServiceBase(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        ILogger logger)
    {
        _unitOfWork = unitOfWork;
        _tenantContextProvider = tenantContextProvider;
        _logger = logger;
    }

    protected Guid GetTenantId() => _tenantContextProvider.GetTenantId();
    protected Guid GetCurrentUserId() => _tenantContextProvider.GetCurrentUserId();
    protected string GetCurrentUserName() => _tenantContextProvider.GetCurrentUserName();
}
