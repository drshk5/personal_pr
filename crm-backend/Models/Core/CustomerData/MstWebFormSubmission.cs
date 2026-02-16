using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstWebFormSubmission : ITenantEntity
{
    public Guid strSubmissionGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public Guid strWebFormGUID { get; set; }
    public string strSubmittedDataJson { get; set; } = string.Empty;
    public Guid? strLeadGUID { get; set; } // FK to created lead (null if failed)
    public string? strIpAddress { get; set; }
    public string? strUserAgent { get; set; }
    public string? strReferrerUrl { get; set; }
    public string? strUtmSource { get; set; }
    public string? strUtmMedium { get; set; }
    public string? strUtmCampaign { get; set; }
    public string? strUtmTerm { get; set; }
    public string? strUtmContent { get; set; }
    public string strStatus { get; set; } = "Processed"; // Processed, Failed, Duplicate
    public string? strErrorMessage { get; set; }
    public DateTime dtCreatedOn { get; set; } = DateTime.UtcNow;

    // Navigation
    public MstWebForm? WebForm { get; set; }
    public MstLead? Lead { get; set; }
}
