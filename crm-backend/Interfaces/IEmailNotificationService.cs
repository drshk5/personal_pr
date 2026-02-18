using crm_backend.DTOs.CustomerData;

namespace crm_backend.Interfaces;

/// <summary>
/// Email notification service for CRM activity notifications
/// Supports single and bulk email sending with queue processing
/// </summary>
public interface IEmailNotificationService
{
    /// <summary>
    /// Send activity assignment notification to a user
    /// </summary>
    Task SendActivityAssignedNotificationAsync(Guid activityId, Guid userId, string activitySubject);

    /// <summary>
    /// Send bulk activity assignment notifications (async queue processing)
    /// </summary>
    Task SendBulkActivityNotificationsAsync(List<Guid> activityIds, List<Guid> userIds);

    /// <summary>
    /// Send activity status change notification
    /// </summary>
    Task SendActivityStatusChangeNotificationAsync(Guid activityId, string oldStatus, string newStatus);

    /// <summary>
    /// Send activity reminder notification (for due activities)
    /// </summary>
    Task SendActivityReminderAsync(Guid activityId, Guid userId);

    /// <summary>
    /// Send custom email to activity participants
    /// </summary>
    Task SendCustomEmailAsync(EmailDto emailDto);

    /// <summary>
    /// Send bulk custom emails (for marketing/announcements)
    /// </summary>
    Task SendBulkCustomEmailsAsync(List<EmailDto> emails);

    /// <summary>
    /// Send bulk custom emails to activity participants with template support
    /// High-performance implementation with tenant isolation
    /// Returns the number of emails queued for sending
    /// </summary>
    Task<int> SendBulkActivityEmailsAsync(DTOs.CustomerData.ActivityBulkEmailDto dto, Guid tenantId);
}

/// <summary>
/// Email DTO for custom email sending
/// </summary>
public class EmailDto
{
    public string ToEmail { get; set; } = string.Empty;
    public string ToName { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsHtml { get; set; } = true;
    public Dictionary<string, string> Placeholders { get; set; } = new();
}
