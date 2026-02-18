namespace crm_backend.Interfaces;

/// <summary>
/// Service for broadcasting real-time CRM data change notifications via SignalR.
/// All CRUD operations should call the appropriate method after successful persistence.
/// Broadcasts are scoped to the tenant group (strGroupGUID).
/// </summary>
public interface ICrmNotificationService
{
    // ── Leads ──────────────────────────────────────────────────
    Task NotifyLeadCreatedAsync(Guid groupGuid, Guid entityId, string performedBy);
    Task NotifyLeadUpdatedAsync(Guid groupGuid, Guid entityId, string performedBy);
    Task NotifyLeadDeletedAsync(Guid groupGuid, Guid entityId, string performedBy);
    Task NotifyLeadStatusChangedAsync(Guid groupGuid, Guid entityId, string newStatus, string performedBy);
    Task NotifyLeadsBulkUpdatedAsync(Guid groupGuid, string action, int count, string performedBy);

    // ── Accounts ───────────────────────────────────────────────
    Task NotifyAccountCreatedAsync(Guid groupGuid, Guid entityId, string performedBy);
    Task NotifyAccountUpdatedAsync(Guid groupGuid, Guid entityId, string performedBy);
    Task NotifyAccountDeletedAsync(Guid groupGuid, Guid entityId, string performedBy);

    // ── Contacts ───────────────────────────────────────────────
    Task NotifyContactCreatedAsync(Guid groupGuid, Guid entityId, string performedBy);
    Task NotifyContactUpdatedAsync(Guid groupGuid, Guid entityId, string performedBy);
    Task NotifyContactDeletedAsync(Guid groupGuid, Guid entityId, string performedBy);

    // ── Opportunities ──────────────────────────────────────────
    Task NotifyOpportunityCreatedAsync(Guid groupGuid, Guid entityId, string performedBy);
    Task NotifyOpportunityUpdatedAsync(Guid groupGuid, Guid entityId, string performedBy);
    Task NotifyOpportunityDeletedAsync(Guid groupGuid, Guid entityId, string performedBy);
    Task NotifyOpportunityStageChangedAsync(Guid groupGuid, Guid entityId, string newStage, string performedBy);
    Task NotifyOpportunityClosedAsync(Guid groupGuid, Guid entityId, string outcome, string performedBy);

    // ── Activities ─────────────────────────────────────────────
    Task NotifyActivityCreatedAsync(Guid groupGuid, Guid entityId, string performedBy);
    Task NotifyActivityUpdatedAsync(Guid groupGuid, Guid entityId, string performedBy);
    Task NotifyActivityDeletedAsync(Guid groupGuid, Guid entityId, string performedBy);
    Task NotifyActivityStatusChangedAsync(Guid groupGuid, Guid entityId, string newStatus, string performedBy);

    // ── Pipelines ──────────────────────────────────────────────
    Task NotifyPipelineChangedAsync(Guid groupGuid, Guid entityId, string action, string performedBy);

    // ── Dashboard ──────────────────────────────────────────────
    Task NotifyDashboardInvalidatedAsync(Guid groupGuid, string performedBy);

    // ── Generic ────────────────────────────────────────────────
    Task NotifyEntityChangedAsync(Guid groupGuid, string entityType, Guid entityId, string action, string performedBy);
}
