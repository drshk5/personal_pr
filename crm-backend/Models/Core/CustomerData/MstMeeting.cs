using System.ComponentModel.DataAnnotations;
using crm_backend.Constants;

namespace crm_backend.Models.Core.CustomerData;

/// <summary>
/// Meeting scheduler with calendar integration support
/// </summary>
public class MstMeeting : ITenantEntity
{
    [Key]
    public Guid strMeetingGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    
    // Meeting details
    public string strTitle { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public string? strLocation { get; set; }
    public string? strMeetingLink { get; set; } // Zoom, Teams, Google Meet link
    
    // Schedule
    public DateTime dtStartTime { get; set; }
    public DateTime dtEndTime { get; set; }
    public string? strTimeZone { get; set; }
    public bool bolIsAllDay { get; set; }
    
    // Attendees (stored as JSON array)
    public string? strAttendeeUserGUIDs { get; set; } // JSON array: ["guid1","guid2"]
    public string? strExternalAttendees { get; set; } // JSON array of email addresses
    
    // Related entities
    public Guid? strLeadGUID { get; set; }
    public Guid? strContactGUID { get; set; }
    public Guid? strAccountGUID { get; set; }
    public Guid? strOpportunityGUID { get; set; }
    
    // Recurrence (for future enhancement)
    public bool bolIsRecurring { get; set; }
    public string? strRecurrenceRule { get; set; } // iCal RRULE format
    public Guid? strParentMeetingGUID { get; set; } // For recurring instances
    
    // Status
    public string strStatus { get; set; } = MeetingStatusConstants.Scheduled;
    public string? strCancellationReason { get; set; }
    
    // Reminders (stored as JSON)
    public string? strReminders { get; set; } // JSON array: [{"minutes": 15, "type": "email"}]
    
    // Integration
    public string? strCalendarEventId { get; set; } // Google Calendar/Outlook event ID
    public string? strCalendarProvider { get; set; } // Google, Outlook, etc.
    
    // Metadata
    public Guid strOrganizerGUID { get; set; }
    public string? strOrganizerName { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsDeleted { get; set; }
    public DateTime? dtDeletedOn { get; set; }
    
    // Navigation
    public MstLead? Lead { get; set; }
    public MstContact? Contact { get; set; }
    public MstAccount? Account { get; set; }
    public MstOpportunity? Opportunity { get; set; }
}

/// <summary>
/// Meeting status constants
/// </summary>
public static class MeetingStatusConstants
{
    public const string Scheduled = "Scheduled";
    public const string InProgress = "InProgress";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
    public const string NoShow = "NoShow";
}
