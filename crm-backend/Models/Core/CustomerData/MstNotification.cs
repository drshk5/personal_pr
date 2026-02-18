using System.ComponentModel.DataAnnotations;
using crm_backend.Constants;

namespace crm_backend.Models.Core.CustomerData;

/// <summary>
/// Real-time notification system for user alerts
/// </summary>
public class MstNotification : ITenantEntity
{
    [Key]
    public Guid strNotificationGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    
    // User who receives the notification
    public Guid strRecipientUserGUID { get; set; }
    
    // Notification content
    public string strTitle { get; set; } = string.Empty;
    public string strMessage { get; set; } = string.Empty;
    public string strType { get; set; } = NotificationTypeConstants.Info; // Info, Success, Warning, Error
    public string strCategory { get; set; } = string.Empty; // LeadAssignment, StatusChange, TaskDue, Mention, etc.
    
    // Related entity (optional)
    public string? strEntityType { get; set; } // Lead, Contact, Account, Opportunity, Activity
    public Guid? strEntityGUID { get; set; }
    public string? strEntityName { get; set; } // Cached entity name for quick display
    
    // Action link (optional)
    public string? strActionUrl { get; set; }
    public string? strActionText { get; set; }
    
    // Actor (who triggered the notification)
    public Guid? strActorUserGUID { get; set; }
    public string? strActorUserName { get; set; }
    
    // Status
    public bool bolIsRead { get; set; }
    public DateTime? dtReadOn { get; set; }
    public bool bolIsArchived { get; set; }
    public DateTime? dtArchivedOn { get; set; }
    
    // Metadata
    public DateTime dtCreatedOn { get; set; }
    public DateTime? dtExpiresOn { get; set; } // Optional expiry
}

/// <summary>
/// Notification type constants
/// </summary>
public static class NotificationTypeConstants
{
    public const string Info = "Info";
    public const string Success = "Success";
    public const string Warning = "Warning";
    public const string Error = "Error";
}

/// <summary>
/// Notification category constants
/// </summary>
public static class NotificationCategoryConstants
{
    public const string LeadAssignment = "LeadAssignment";
    public const string LeadStatusChange = "LeadStatusChange";
    public const string OpportunityUpdate = "OpportunityUpdate";
    public const string TaskDue = "TaskDue";
    public const string TaskOverdue = "TaskOverdue";
    public const string Mention = "Mention";
    public const string WorkflowExecution = "WorkflowExecution";
    public const string LeadScoreChange = "LeadScoreChange";
    public const string MeetingReminder = "MeetingReminder";
    public const string ImportComplete = "ImportComplete";
}
