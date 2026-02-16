using crm_backend.Constants;

namespace crm_backend.Models.Core.CustomerData;

public class MstLead : ITenantEntity
{
    public Guid strLeadGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strFirstName { get; set; } = string.Empty;
    public string strLastName { get; set; } = string.Empty;
    public string strEmail { get; set; } = string.Empty;
    public string? strPhone { get; set; }
    public string? strCompanyName { get; set; }
    public string? strJobTitle { get; set; }
    public string strSource { get; set; } = LeadSourceConstants.Other;
    public string strStatus { get; set; } = LeadStatusConstants.New;
    public int intLeadScore { get; set; }
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
    public Guid? strAssignedToGUID { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsActive { get; set; } = true;
    public bool bolIsDeleted { get; set; }
    public DateTime? dtDeletedOn { get; set; }

    // Navigation
    public MstAccount? ConvertedAccount { get; set; }
    public MstContact? ConvertedContact { get; set; }
    public MstOpportunity? ConvertedOpportunity { get; set; }
    public ICollection<MstActivityLink> ActivityLinks { get; set; } = new List<MstActivityLink>();
}
