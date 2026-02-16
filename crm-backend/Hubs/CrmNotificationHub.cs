using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace crm_backend.Hubs;

[Authorize]
public class CrmNotificationHub : Hub
{
    private readonly ILogger<CrmNotificationHub> _logger;

    public CrmNotificationHub(ILogger<CrmNotificationHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var groupGuid = Context.User?.FindFirst("strGroupGUID")?.Value;
        if (!string.IsNullOrEmpty(groupGuid))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupGuid);
            _logger.LogInformation("Client connected to CRM hub. Group: {GroupGUID}", groupGuid);
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var groupGuid = Context.User?.FindFirst("strGroupGUID")?.Value;
        if (!string.IsNullOrEmpty(groupGuid))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupGuid);
        }
        await base.OnDisconnectedAsync(exception);
    }
}
