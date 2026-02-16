namespace crm_backend.Models.Core.CustomerData;

public class MstOpportunity : ITenantEntity
{
    public Guid strOpportunityGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strOpportunityName { get; set; } = string.Empty;
    public Guid? strAccountGUID { get; set; }
    public Guid strPipelineGUID { get; set; }
    public Guid strStageGUID { get; set; }
    public string strStatus { get; set; } = "Open";
    public decimal? dblAmount { get; set; }
    public string strCurrency { get; set; } = "INR";
    public DateTime? dtExpectedCloseDate { get; set; }
    public DateTime? dtActualCloseDate { get; set; }
    public int intProbability { get; set; }
    public string? strLossReason { get; set; }
    public string? strDescription { get; set; }
    public DateTime dtStageEnteredOn { get; set; }
    public DateTime? dtLastActivityOn { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsActive { get; set; } = true;
    public bool bolIsDeleted { get; set; }
    public DateTime? dtDeletedOn { get; set; }

    // Navigation
    public MstAccount? Account { get; set; }
    public MstPipeline Pipeline { get; set; } = null!;
    public MstPipelineStage Stage { get; set; } = null!;
    public ICollection<MstOpportunityContact> OpportunityContacts { get; set; } = new List<MstOpportunityContact>();
    public ICollection<MstActivityLink> ActivityLinks { get; set; } = new List<MstActivityLink>();
}
