namespace crm_backend.Models.Core.CustomerData;

public class MstPipelineStage
{
    public Guid strStageGUID { get; set; }
    public Guid strPipelineGUID { get; set; }
    public string strStageName { get; set; } = string.Empty;
    public int intDisplayOrder { get; set; }
    public int intProbabilityPercent { get; set; }
    public string? strRequiredFields { get; set; }
    public string? strAllowedTransitions { get; set; }
    public int intDefaultDaysToRot { get; set; } = 30;
    public bool bolIsWonStage { get; set; }
    public bool bolIsLostStage { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
    public bool bolIsActive { get; set; } = true;

    // Navigation
    public MstPipeline Pipeline { get; set; } = null!;
}
