using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstLeadDuplicate : ITenantEntity
{
    public Guid strDuplicateGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public Guid strLeadGUID1 { get; set; }
    public Guid strLeadGUID2 { get; set; }
    public string strMatchType { get; set; } = string.Empty; // Email, Phone, FuzzyName
    public decimal dblConfidenceScore { get; set; } // 0.00 to 100.00
    public string strStatus { get; set; } = "Pending"; // Pending, Confirmed, Dismissed, Merged
    public Guid? strResolvedByGUID { get; set; }
    public DateTime? dtResolvedOn { get; set; }
    public DateTime dtCreatedOn { get; set; } = DateTime.UtcNow;

    // Navigation
    public MstLead? Lead1 { get; set; }
    public MstLead? Lead2 { get; set; }
}
