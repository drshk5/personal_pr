namespace crm_backend.Models.Core.CustomerData;

public class MstPipeline : ITenantEntity
{
    public Guid strPipelineGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public string strPipelineName { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public bool bolIsDefault { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public Guid? strUpdatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsActive { get; set; } = true;
    public bool bolIsDeleted { get; set; }
    public DateTime? dtDeletedOn { get; set; }

    // Navigation
    public ICollection<MstPipelineStage> Stages { get; set; } = new List<MstPipelineStage>();
    public ICollection<MstOpportunity> Opportunities { get; set; } = new List<MstOpportunity>();
}
