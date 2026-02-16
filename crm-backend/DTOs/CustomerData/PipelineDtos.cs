namespace crm_backend.DTOs.CustomerData;

public class CreatePipelineDto
{
    public string strPipelineName { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public bool bolIsDefault { get; set; }
    public List<CreatePipelineStageDto> Stages { get; set; } = new();
}

public class CreatePipelineStageDto
{
    public string strStageName { get; set; } = string.Empty;
    public int intDisplayOrder { get; set; }
    public int intProbabilityPercent { get; set; }
    public int intDefaultDaysToRot { get; set; } = 30;
    public bool bolIsWonStage { get; set; }
    public bool bolIsLostStage { get; set; }
}

public class PipelineListDto
{
    public Guid strPipelineGUID { get; set; }
    public string strPipelineName { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public bool bolIsDefault { get; set; }
    public int intStageCount { get; set; }
    public int intOpportunityCount { get; set; }
    public bool bolIsActive { get; set; }
}

public class PipelineDetailDto : PipelineListDto
{
    public List<PipelineStageDto> Stages { get; set; } = new();
}

public class PipelineStageDto
{
    public Guid strStageGUID { get; set; }
    public string strStageName { get; set; } = string.Empty;
    public int intDisplayOrder { get; set; }
    public int intProbabilityPercent { get; set; }
    public int intDefaultDaysToRot { get; set; }
    public bool bolIsWonStage { get; set; }
    public bool bolIsLostStage { get; set; }
    public int intOpportunityCount { get; set; }
}
