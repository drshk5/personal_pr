namespace crm_backend.Interfaces;

public interface IAuditLogService
{
    Task LogAsync(string entityType, Guid entityGuid, string action, string? changes, Guid performedByGuid);
}
