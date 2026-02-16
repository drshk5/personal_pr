using crm_backend.DTOs.Common;
using System.Text.Json.Serialization;

namespace crm_backend.DTOs.CustomerData;

public class CreateActivityDto
{
    public string strActivityType { get; set; } = string.Empty;
    public string strSubject { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public DateTime? dtScheduledOn { get; set; }
    public DateTime? dtCompletedOn { get; set; }
    public int? intDurationMinutes { get; set; }
    public string? strOutcome { get; set; }
    public string? strStatus { get; set; }
    public string? strPriority { get; set; }
    public DateTime? dtDueDate { get; set; }
    public string? strCategory { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    [JsonPropertyName("links")]
    public List<ActivityLinkDto> Links { get; set; } = new();
}

public class UpdateActivityDto
{
    public string strActivityType { get; set; } = string.Empty;
    public string strSubject { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public DateTime? dtScheduledOn { get; set; }
    public DateTime? dtCompletedOn { get; set; }
    public int? intDurationMinutes { get; set; }
    public string? strOutcome { get; set; }
    public string? strStatus { get; set; }
    public string? strPriority { get; set; }
    public DateTime? dtDueDate { get; set; }
    public string? strCategory { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    [JsonPropertyName("links")]
    public List<ActivityLinkDto>? Links { get; set; }
}

public class ActivityLinkDto
{
    public string strEntityType { get; set; } = string.Empty;
    public Guid strEntityGUID { get; set; }
}

public class ActivityListDto
{
    public Guid strActivityGUID { get; set; }
    public string strActivityType { get; set; } = string.Empty;
    public string strSubject { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public DateTime? dtScheduledOn { get; set; }
    public DateTime? dtCompletedOn { get; set; }
    public int? intDurationMinutes { get; set; }
    public string? strOutcome { get; set; }
    public string strStatus { get; set; } = string.Empty;
    public string strPriority { get; set; } = string.Empty;
    public DateTime? dtDueDate { get; set; }
    public string? strCategory { get; set; }
    public bool bolIsOverdue { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public string? strAssignedToName { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public string strCreatedByName { get; set; } = string.Empty;
    public DateTime dtCreatedOn { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsActive { get; set; }
    [JsonPropertyName("links")]
    public List<ActivityLinkDto> Links { get; set; } = new();
}

public class ActivityDetailDto : ActivityListDto
{
    public List<ActivityLinkedEntityDto> LinkedEntities { get; set; } = new();
}

public class ActivityLinkedEntityDto
{
    public string strEntityType { get; set; } = string.Empty;
    public Guid strEntityGUID { get; set; }
    public string strEntityName { get; set; } = string.Empty;
}

public class ActivityStatusChangeDto
{
    public string strStatus { get; set; } = string.Empty;
    public string? strOutcome { get; set; }
}

public class ActivityAssignDto
{
    public Guid strAssignedToGUID { get; set; }
}

public class ActivityBulkAssignDto
{
    public List<Guid> Guids { get; set; } = new();
    public Guid strAssignedToGUID { get; set; }
}

public class ActivityBulkStatusDto
{
    public List<Guid> Guids { get; set; } = new();
    public string strStatus { get; set; } = string.Empty;
    public string? strOutcome { get; set; }
}

public class ActivityBulkDeleteDto
{
    public List<Guid> Guids { get; set; } = new();
}

public class UpcomingActivityDto
{
    public Guid strActivityGUID { get; set; }
    public string strActivityType { get; set; } = string.Empty;
    public string strSubject { get; set; } = string.Empty;
    public string strStatus { get; set; } = string.Empty;
    public string strPriority { get; set; } = string.Empty;
    public DateTime? dtScheduledOn { get; set; }
    public DateTime? dtDueDate { get; set; }
    public bool bolIsOverdue { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public string? strAssignedToName { get; set; }
    public string? strCategory { get; set; }
    [JsonPropertyName("links")]
    public List<ActivityLinkDto> Links { get; set; } = new();
}

public class ActivityFilterParams : PagedRequestDto
{
    public string? strActivityType { get; set; }
    public string? strEntityType { get; set; }
    public Guid? strEntityGUID { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public DateTime? dtFromDate { get; set; }
    public DateTime? dtToDate { get; set; }
    public bool? bolIsCompleted { get; set; }
    public string? strStatus { get; set; }
    public string? strPriority { get; set; }
    public string? strCategory { get; set; }
    public DateTime? dtDueBefore { get; set; }
    public DateTime? dtDueAfter { get; set; }
    public bool? bolIsOverdue { get; set; }
}
