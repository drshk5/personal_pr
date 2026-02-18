using crm_backend.Hubs;
using crm_backend.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace crm_backend.Services;

/// <summary>
/// Broadcasts real-time CRM data change events to all connected clients
/// within the same tenant group via SignalR.
/// 
/// Event payload format sent to clients:
/// {
///   "entityType": "Lead" | "Account" | "Contact" | "Opportunity" | "Activity" | "Pipeline" | "Dashboard",
///   "action": "Created" | "Updated" | "Deleted" | "StatusChanged" | "StageChanged" | "Closed" | "BulkUpdated" | "Invalidated",
///   "entityId": "guid-string" | null,
///   "performedBy": "username",
///   "timestamp": "2026-02-18T...",
///   "extra": { ... } // optional additional data
/// }
/// </summary>
public class CrmNotificationService : ICrmNotificationService
{
    private readonly IHubContext<CrmNotificationHub> _hubContext;
    private readonly ILogger<CrmNotificationService> _logger;

    public CrmNotificationService(
        IHubContext<CrmNotificationHub> hubContext,
        ILogger<CrmNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    // ── Leads ──────────────────────────────────────────────────

    public Task NotifyLeadCreatedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Lead", "Created", entityId, performedBy);

    public Task NotifyLeadUpdatedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Lead", "Updated", entityId, performedBy);

    public Task NotifyLeadDeletedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Lead", "Deleted", entityId, performedBy);

    public Task NotifyLeadStatusChangedAsync(Guid groupGuid, Guid entityId, string newStatus, string performedBy)
        => BroadcastAsync(groupGuid, "Lead", "StatusChanged", entityId, performedBy, new { newStatus });

    public Task NotifyLeadsBulkUpdatedAsync(Guid groupGuid, string action, int count, string performedBy)
        => BroadcastAsync(groupGuid, "Lead", "BulkUpdated", null, performedBy, new { bulkAction = action, count });

    // ── Accounts ───────────────────────────────────────────────

    public Task NotifyAccountCreatedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Account", "Created", entityId, performedBy);

    public Task NotifyAccountUpdatedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Account", "Updated", entityId, performedBy);

    public Task NotifyAccountDeletedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Account", "Deleted", entityId, performedBy);

    // ── Contacts ───────────────────────────────────────────────

    public Task NotifyContactCreatedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Contact", "Created", entityId, performedBy);

    public Task NotifyContactUpdatedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Contact", "Updated", entityId, performedBy);

    public Task NotifyContactDeletedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Contact", "Deleted", entityId, performedBy);

    // ── Opportunities ──────────────────────────────────────────

    public Task NotifyOpportunityCreatedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Opportunity", "Created", entityId, performedBy);

    public Task NotifyOpportunityUpdatedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Opportunity", "Updated", entityId, performedBy);

    public Task NotifyOpportunityDeletedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Opportunity", "Deleted", entityId, performedBy);

    public Task NotifyOpportunityStageChangedAsync(Guid groupGuid, Guid entityId, string newStage, string performedBy)
        => BroadcastAsync(groupGuid, "Opportunity", "StageChanged", entityId, performedBy, new { newStage });

    public Task NotifyOpportunityClosedAsync(Guid groupGuid, Guid entityId, string outcome, string performedBy)
        => BroadcastAsync(groupGuid, "Opportunity", "Closed", entityId, performedBy, new { outcome });

    // ── Activities ─────────────────────────────────────────────

    public Task NotifyActivityCreatedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Activity", "Created", entityId, performedBy);

    public Task NotifyActivityUpdatedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Activity", "Updated", entityId, performedBy);

    public Task NotifyActivityDeletedAsync(Guid groupGuid, Guid entityId, string performedBy)
        => BroadcastAsync(groupGuid, "Activity", "Deleted", entityId, performedBy);

    public Task NotifyActivityStatusChangedAsync(Guid groupGuid, Guid entityId, string newStatus, string performedBy)
        => BroadcastAsync(groupGuid, "Activity", "StatusChanged", entityId, performedBy, new { newStatus });

    // ── Pipelines ──────────────────────────────────────────────

    public Task NotifyPipelineChangedAsync(Guid groupGuid, Guid entityId, string action, string performedBy)
        => BroadcastAsync(groupGuid, "Pipeline", action, entityId, performedBy);

    // ── Dashboard ──────────────────────────────────────────────

    public Task NotifyDashboardInvalidatedAsync(Guid groupGuid, string performedBy)
        => BroadcastAsync(groupGuid, "Dashboard", "Invalidated", null, performedBy);

    // ── Generic ────────────────────────────────────────────────

    public Task NotifyEntityChangedAsync(Guid groupGuid, string entityType, Guid entityId, string action, string performedBy)
        => BroadcastAsync(groupGuid, entityType, action, entityId, performedBy);

    // ── Core Broadcast ─────────────────────────────────────────

    private async Task BroadcastAsync(Guid groupGuid, string entityType, string action, Guid? entityId, string performedBy, object? extra = null)
    {
        try
        {
            var payload = new
            {
                entityType,
                action,
                entityId = entityId?.ToString(),
                performedBy,
                timestamp = DateTime.UtcNow.ToString("o"),
                extra
            };

            await _hubContext.Clients
                .Group(groupGuid.ToString())
                .SendAsync("CrmDataChanged", payload);

            _logger.LogDebug(
                "CRM SignalR broadcast: {EntityType}.{Action} id={EntityId} group={GroupGuid}",
                entityType, action, entityId, groupGuid);
        }
        catch (Exception ex)
        {
            // Never let SignalR failures break CRUD operations
            _logger.LogWarning(ex,
                "Failed to broadcast CRM notification: {EntityType}.{Action} id={EntityId}",
                entityType, action, entityId);
        }
    }
}
