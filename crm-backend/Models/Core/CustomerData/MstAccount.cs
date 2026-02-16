namespace crm_backend.Models.Core.CustomerData;

public class MstAccount : ITenantEntity
{
    public Guid strAccountGUID { get; set; }
    public Guid strGroupGUID { get; set; }
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
    public Guid strCreatedByGUID { get; set; }
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsActive { get; set; } = true;
    public bool bolIsDeleted { get; set; }
    public DateTime? dtDeletedOn { get; set; }

    // Navigation
    public ICollection<MstContact> Contacts { get; set; } = new List<MstContact>();
    public ICollection<MstOpportunity> Opportunities { get; set; } = new List<MstOpportunity>();
    public ICollection<MstActivityLink> ActivityLinks { get; set; } = new List<MstActivityLink>();
}
