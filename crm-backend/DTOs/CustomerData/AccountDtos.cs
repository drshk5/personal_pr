using crm_backend.DTOs.Common;

namespace crm_backend.DTOs.CustomerData;

public class CreateAccountDto
{
    public string strAccountName { get; set; } = string.Empty;
    public string? strIndustry { get; set; }
    public string? strWebsite { get; set; }
    public string? strPhone { get; set; }
    public string? strEmail { get; set; }
    public int? intEmployeeCount { get; set; }
    public decimal? dblAnnualRevenue { get; set; }
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strDescription { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}

public class UpdateAccountDto : CreateAccountDto { }

public class AccountListDto
{
    public Guid strAccountGUID { get; set; }
    public string strAccountName { get; set; } = string.Empty;
    public string? strIndustry { get; set; }
    public string? strPhone { get; set; }
    public string? strEmail { get; set; }
    public int intContactCount { get; set; }
    public int intOpenOpportunityCount { get; set; }
    public int intTotalOpportunityCount { get; set; }
    public decimal dblTotalOpportunityValue { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public string? strAssignedToName { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public bool bolIsActive { get; set; }
}

public class AccountDetailDto : AccountListDto
{
    public string? strWebsite { get; set; }
    public int? intEmployeeCount { get; set; }
    public decimal? dblAnnualRevenue { get; set; }
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strDescription { get; set; }
    public int intActivityCount { get; set; }
    public int intOverdueActivityCount { get; set; }
    public DateTime? dtLastActivityOn { get; set; }
    public List<ContactListDto> Contacts { get; set; } = new();
    public List<OpportunityListDto> Opportunities { get; set; } = new();
    public List<ActivityListDto> AllActivities { get; set; } = new();
    public List<ActivityListDto> RecentActivities { get; set; } = new();
    public List<AccountTimelineEntryDto> Timeline { get; set; } = new();
}

public class AccountTimelineEntryDto
{
    public string strEventType { get; set; } = string.Empty;
    public string strDescription { get; set; } = string.Empty;
    public DateTime dtOccurredOn { get; set; }
    public Guid? strPerformedByGUID { get; set; }
    public string? strPerformedByName { get; set; }
}

public class AccountBulkArchiveDto
{
    public List<Guid> Guids { get; set; } = new();
}

public class BulkAssignDto
{
    public List<Guid> Guids { get; set; } = new();
    public Guid strAssignedToGUID { get; set; }
}

public class AccountFilterParams : PagedRequestDto
{
    public string? strIndustry { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}
