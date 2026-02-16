using crm_backend.Data;
using crm_backend.DataAccess.Repositories;
using crm_backend.Interfaces;
using crm_backend.Models.Core.CustomerData;

namespace crm_backend.Services.CustomerData;

public class MstAuditLogService : ServiceBase, IAuditLogService
{
    private readonly IUnitOfWork _unitOfWork;

    public MstAuditLogService(
        IUnitOfWork unitOfWork,
        ITenantContextProvider tenantContextProvider,
        ILogger<MstAuditLogService> logger)
        : base(tenantContextProvider, logger)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task LogAsync(string entityType, Guid entityGuid, string action, string? changes, Guid performedByGuid)
    {
        var auditLog = new MstAuditLog
        {
            strAuditLogGUID = Guid.NewGuid(),
            strGroupGUID = GetTenantId(),
            strEntityType = entityType,
            strEntityGUID = entityGuid,
            strAction = action,
            strChanges = changes,
            strPerformedByGUID = performedByGuid,
            dtPerformedOn = DateTime.UtcNow
        };

        await _unitOfWork.AuditLogs.AddAsync(auditLog);
        await _unitOfWork.SaveChangesAsync();
    }
}
