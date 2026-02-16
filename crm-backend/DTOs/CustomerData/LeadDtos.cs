using crm_backend.DTOs.Common;

namespace crm_backend.DTOs.CustomerData;

// --- CREATE ---
public class CreateLeadDto
{
    public string strFirstName { get; set; } = string.Empty;
    public string strLastName { get; set; } = string.Empty;
    public string strEmail { get; set; } = string.Empty;
    public string? strPhone { get; set; }
    public string? strCompanyName { get; set; }
    public string? strJobTitle { get; set; }
    public string strSource { get; set; } = "Other";
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strNotes { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}

// --- UPDATE ---
public class UpdateLeadDto
{
    public string strFirstName { get; set; } = string.Empty;
    public string strLastName { get; set; } = string.Empty;
    public string strEmail { get; set; } = string.Empty;
    public string? strPhone { get; set; }
    public string? strCompanyName { get; set; }
    public string? strJobTitle { get; set; }
    public string strSource { get; set; } = "Other";
    public string strStatus { get; set; } = "New";
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strNotes { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}

// --- LIST ---
public class LeadListDto
{
    public Guid strLeadGUID { get; set; }
    public string strFirstName { get; set; } = string.Empty;
    public string strLastName { get; set; } = string.Empty;
    public string strEmail { get; set; } = string.Empty;
    public string? strPhone { get; set; }
    public string? strCompanyName { get; set; }
    public string strSource { get; set; } = string.Empty;
    public string strStatus { get; set; } = string.Empty;
    public int intLeadScore { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public string? strAssignedToName { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public bool bolIsActive { get; set; }
}

// --- DETAIL ---
public class LeadDetailDto : LeadListDto
{
    public string? strJobTitle { get; set; }
    public string? strAddress { get; set; }
    public string? strCity { get; set; }
    public string? strState { get; set; }
    public string? strCountry { get; set; }
    public string? strPostalCode { get; set; }
    public string? strNotes { get; set; }
    public Guid? strConvertedAccountGUID { get; set; }
    public Guid? strConvertedContactGUID { get; set; }
    public Guid? strConvertedOpportunityGUID { get; set; }
    public DateTime? dtConvertedOn { get; set; }
    public string strCreatedByName { get; set; } = string.Empty;
    public DateTime? dtUpdatedOn { get; set; }
    public List<ActivityListDto> RecentActivities { get; set; } = new();
}

// --- FILTER PARAMS ---
public class LeadFilterParams : PagedRequestDto
{
    public string? strStatus { get; set; }
    public string? strSource { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public DateTime? dtFromDate { get; set; }
    public DateTime? dtToDate { get; set; }
    public int? intMinScore { get; set; }
    public int? intMaxScore { get; set; }
}

// --- BULK ARCHIVE ---
public class LeadBulkArchiveDto
{
    public List<Guid> Guids { get; set; } = new();
}

// --- STATUS CHANGE ---
public class LeadStatusChangeDto
{
    public string strStatus { get; set; } = string.Empty;
}
