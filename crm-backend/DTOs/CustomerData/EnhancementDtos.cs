using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using crm_backend.DTOs.Common;

namespace crm_backend.DTOs.CustomerData;

// ===== Notification DTOs =====

public class NotificationListDto
{
    public Guid NotificationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public string? EntityName { get; set; }
    
    public string? ActionUrl { get; set; }
    public string? ActionText { get; set; }
    
    public Guid? ActorUserId { get; set; }
    public string? ActorUserName { get; set; }
    
    public bool IsRead { get; set; }
    public DateTime? ReadOn { get; set; }
    public bool IsArchived { get; set; }
    
    public DateTime CreatedOn { get; set; }
    public string TimeAgo { get; set; } = string.Empty;
}

public class NotificationFilterParams : PagedRequestDto
{
    public bool? IsRead { get; set; }
    public bool? IsArchived { get; set; }
    public string? Category { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

public class MarkNotificationsDto
{
    public List<Guid> NotificationIds { get; set; } = new();
    public bool IsRead { get; set; }
}

public class NotificationSummaryDto
{
    public int UnreadCount { get; set; }
    public int TodayCount { get; set; }
    public List<NotificationListDto> RecentNotifications { get; set; } = new();
}


// ===== Note DTOs =====

public class CreateNoteDto
{
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsPrivate { get; set; }
    public bool IsPinned { get; set; }
    public List<Guid> MentionedUserIds { get; set; } = new();
}

public class UpdateNoteDto
{
    public string Content { get; set; } = string.Empty;
    public bool IsPrivate { get; set; }
    public bool IsPinned { get; set; }
    public List<Guid> MentionedUserIds { get; set; } = new();
}

public class NoteListDto
{
    public Guid NoteId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Content { get; set; } = string.Empty;
    public bool IsPrivate { get; set; }
    public bool IsPinned { get; set; }
    
    public List<Guid> MentionedUserIds { get; set; } = new();
    public List<string> MentionedUserNames { get; set; } = new();
    
    public Guid CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; }
    public DateTime? UpdatedOn { get; set; }
    public string TimeAgo { get; set; } = string.Empty;
}

public class NoteFilterParams : PagedRequestDto
{
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public bool? IsPinned { get; set; }
}


// ===== Saved View DTOs =====

public class CreateSavedViewDto
{
    public string ViewName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string FilterJson { get; set; } = "{}";
    public string? SortField { get; set; }
    public string? SortDirection { get; set; }
    public List<string>? VisibleColumns { get; set; }
    public bool IsShared { get; set; }
    public bool IsDefault { get; set; }
    public string? IconName { get; set; }
    public string? ColorHex { get; set; }
}

public class UpdateSavedViewDto : CreateSavedViewDto
{
}

public class SavedViewListDto
{
    public Guid SavedViewId { get; set; }
    public string ViewName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string FilterJson { get; set; } = "{}";
    public string? SortField { get; set; }
    public string? SortDirection { get; set; }
    public List<string>? VisibleColumns { get; set; }
    public bool IsShared { get; set; }
    public bool IsDefault { get; set; }
    public string? IconName { get; set; }
    public string? ColorHex { get; set; }
    
    public Guid CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; }
    public int UsageCount { get; set; }
    public DateTime? LastUsedOn { get; set; }
}

public class SavedViewFilterParams : PagedRequestDto
{
    public string? EntityType { get; set; }
    public bool? IsShared { get; set; }
}


// ===== Meeting DTOs =====

public class CreateMeetingDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
    
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? TimeZone { get; set; }
    public bool IsAllDay { get; set; }
    
    public List<Guid> AttendeeUserIds { get; set; } = new();
    public List<string>? ExternalAttendees { get; set; }
    
    public Guid? LeadId { get; set; }
    public Guid? ContactId { get; set; }
    public Guid? AccountId { get; set; }
    public Guid? OpportunityId { get; set; }
    
    public List<MeetingReminderDto>? Reminders { get; set; }
}

public class UpdateMeetingDto : CreateMeetingDto
{
    public string Status { get; set; } = string.Empty;
    public string? CancellationReason { get; set; }
}

public class MeetingListDto
{
    public Guid MeetingId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public string? MeetingLink { get; set; }
    
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? TimeZone { get; set; }
    public bool IsAllDay { get; set; }
    public int DurationMinutes { get; set; }
    
    public List<Guid> AttendeeUserIds { get; set; } = new();
    public List<string> AttendeeUserNames { get; set; } = new();
    public List<string>? ExternalAttendees { get; set; }
    
    public Guid? LeadId { get; set; }
    public string? LeadName { get; set; }
    public Guid? ContactId { get; set; }
    public string? ContactName { get; set; }
    public Guid? AccountId { get; set; }
    public string? AccountName { get; set; }
    public Guid? OpportunityId { get; set; }
    public string? OpportunityName { get; set; }
    
    public string Status { get; set; } = string.Empty;
    public string? CancellationReason { get; set; }
    
    public Guid OrganizerUserId { get; set; }
    public string OrganizerName { get; set; } = string.Empty;
    public DateTime CreatedOn { get; set; }
}

public class MeetingDetailDto : MeetingListDto
{
    public bool IsRecurring { get; set; }
    public string? RecurrenceRule { get; set; }
    public List<MeetingReminderDto>? Reminders { get; set; }
    public string? CalendarEventId { get; set; }
    public string? CalendarProvider { get; set; }
}

public class MeetingReminderDto
{
    public int MinutesBefore { get; set; }
    public string Type { get; set; } = "email"; // email, notification, sms
}

public class MeetingFilterParams : PagedRequestDto
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? Status { get; set; }
    public Guid? OrganizerUserId { get; set; }
    public Guid? AttendeeUserId { get; set; }
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
}


// ===== Document DTOs =====

public class UploadDocumentDto
{
    [Required(ErrorMessage = "File is required")]
    public IFormFile? File { get; set; }
    
    [Required(ErrorMessage = "EntityType is required")]
    public string EntityType { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "EntityId is required")]
    public Guid EntityId { get; set; }
    
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public bool IsConfidential { get; set; }
}

public class UploadDocumentVersionDto
{
    [Required(ErrorMessage = "File is required")]
    public IFormFile? File { get; set; }
}

public class CreateDocumentDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public List<string>? Tags { get; set; }
    
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    
    public bool IsConfidential { get; set; }
    public string AccessLevel { get; set; } = "Team";
    public bool RequiresSignature { get; set; }
}

public class UpdateDocumentDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public List<string>? Tags { get; set; }
    public bool? IsConfidential { get; set; }
    public string? AccessLevel { get; set; }
}

public class DocumentListDto
{
    public Guid DocumentId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public long FileSize { get; set; }
    public string FileSizeFormatted { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string? FileExtension { get; set; }
    
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public List<string>? Tags { get; set; }
    
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string? EntityName { get; set; }
    
    public int Version { get; set; }
    public bool IsLatestVersion { get; set; }
    
    public bool IsConfidential { get; set; }
    public string AccessLevel { get; set; } = string.Empty;
    
    public bool RequiresSignature { get; set; }
    public string? SignatureStatus { get; set; }
    
    public Guid UploadedByUserId { get; set; }
    public string UploadedByName { get; set; } = string.Empty;
    public DateTime UploadedOn { get; set; }
    public int DownloadCount { get; set; }
}

public class DocumentFilterParams : PagedRequestDto
{
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public string? Category { get; set; }
    public string? Tag { get; set; }
    public bool? IsConfidential { get; set; }
    public bool? RequiresSignature { get; set; }
}


// ===== Global Search DTOs =====

public class GlobalSearchDto
{
    public string Query { get; set; } = string.Empty;
    public List<string>? EntityTypes { get; set; } // Filter by entity types
    public int MaxResults { get; set; } = 50;
}

public class GlobalSearchResultDto
{
    public List<SearchResultItem> Results { get; set; } = new();
    public int TotalCount { get; set; }
    public Dictionary<string, int> ResultsByType { get; set; } = new();
}

public class SearchResultItem
{
    public Guid Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? Description { get; set; }
    public string? IconName { get; set; }
    public string Url { get; set; } = string.Empty;
    public float RelevanceScore { get; set; }
    public Dictionary<string, string> Metadata { get; set; } = new();
}
