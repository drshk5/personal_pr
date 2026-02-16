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
    public Guid? strAssignedToGUID { get; set; }
    [JsonPropertyName("links")]
    public List<ActivityLinkDto> Links { get; set; } = new();
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
    public Guid? strAssignedToGUID { get; set; }
    public string? strAssignedToName { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public string strCreatedByName { get; set; } = string.Empty;
    public DateTime dtCreatedOn { get; set; }
    public bool bolIsActive { get; set; }
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
}
