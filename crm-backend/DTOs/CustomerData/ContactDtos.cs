using crm_backend.DTOs.Common;

namespace crm_backend.DTOs.CustomerData;

public class CreateContactDto
{
    public Guid? strAccountGUID { get; set; }
    public string strFirstName { get; set; } = string.Empty;
    public string strLastName { get; set; } = string.Empty;
    public string strEmail { get; set; } = string.Empty;
    public string? strPhone { get; set; }
    public string? strMobilePhone { get; set; }
    public string? strJobTitle { get; set; }
    public string? strDepartment { get; set; }
    public string? strLifecycleStage { get; set; }
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strNotes { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}

public class UpdateContactDto : CreateContactDto { }

public class ContactListDto
{
    public Guid strContactGUID { get; set; }
    public string strFirstName { get; set; } = string.Empty;
    public string strLastName { get; set; } = string.Empty;
    public string strEmail { get; set; } = string.Empty;
    public string? strPhone { get; set; }
    public string? strJobTitle { get; set; }
    public string? strAccountName { get; set; }
    public string strLifecycleStage { get; set; } = string.Empty;
    public Guid? strAssignedToGUID { get; set; }
    public string? strAssignedToName { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public bool bolIsActive { get; set; }
}

public class ContactDetailDto : ContactListDto
{
    public Guid? strAccountGUID { get; set; }
    public string? strMobilePhone { get; set; }
    public string? strDepartment { get; set; }
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strNotes { get; set; }
    public DateTime? dtLastContactedOn { get; set; }
    public List<OpportunityListDto> Opportunities { get; set; } = new();
    public List<ActivityListDto> RecentActivities { get; set; } = new();
}

public class ContactBulkArchiveDto
{
    public List<Guid> Guids { get; set; } = new();
}

public class ContactFilterParams : PagedRequestDto
{
    public Guid? strAccountGUID { get; set; }
    public string? strLifecycleStage { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}
