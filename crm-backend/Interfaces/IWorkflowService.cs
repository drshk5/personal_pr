namespace crm_backend.Interfaces;

public interface IWorkflowService
{
    Task TriggerWorkflowsAsync(string entityType, Guid entityGuid, string triggerEvent, Guid tenantId, Guid performedByGuid, string? contextJson = null);
    Task ProcessPendingExecutionsAsync();
}
