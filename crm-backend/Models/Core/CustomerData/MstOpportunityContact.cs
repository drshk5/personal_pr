namespace crm_backend.Models.Core.CustomerData;

public class MstOpportunityContact
{
    public Guid strOpportunityContactGUID { get; set; }
    public Guid strOpportunityGUID { get; set; }
    public Guid strContactGUID { get; set; }
    public string strRole { get; set; } = "Stakeholder";
    public bool bolIsPrimary { get; set; }
    public DateTime dtCreatedOn { get; set; }

    // Navigation
    public MstOpportunity Opportunity { get; set; } = null!;
    public MstContact Contact { get; set; } = null!;
}
