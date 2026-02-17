using crm_backend.DTOs.Common;
using System.Text.Json.Serialization;

namespace crm_backend.DTOs.CustomerData;

public class CreateOpportunityDto
{
    public string strOpportunityName { get; set; } = string.Empty;
    public Guid? strAccountGUID { get; set; }
    public Guid strPipelineGUID { get; set; }
    public Guid strStageGUID { get; set; }
    public decimal? dblAmount { get; set; }
    public string strCurrency { get; set; } = "INR";
    public DateTime? dtExpectedCloseDate { get; set; }
    public string? strDescription { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public List<OpportunityContactDto>? Contacts { get; set; }
}

public class UpdateOpportunityDto
{
    public string strOpportunityName { get; set; } = string.Empty;
    public Guid? strAccountGUID { get; set; }
    public Guid strStageGUID { get; set; }
    public decimal? dblAmount { get; set; }
    public string strCurrency { get; set; } = "INR";
    public DateTime? dtExpectedCloseDate { get; set; }
    public string? strDescription { get; set; }
    public Guid? strAssignedToGUID { get; set; }
}

public class OpportunityListDto
{
    public Guid strOpportunityGUID { get; set; }
    public string strOpportunityName { get; set; } = string.Empty;
    public string? strAccountName { get; set; }
    public string strStageName { get; set; } = string.Empty;
    public string strStatus { get; set; } = string.Empty;
    public decimal? dblAmount { get; set; }
    public string strCurrency { get; set; } = string.Empty;
    public int intProbability { get; set; }
    public DateTime? dtExpectedCloseDate { get; set; }
    public bool bolIsRotting { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public string? strAssignedToName { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public bool bolIsActive { get; set; }
}

public class OpportunityDetailDto : OpportunityListDto
{
    public Guid? strAccountGUID { get; set; }
    public Guid strPipelineGUID { get; set; }
    public string strPipelineName { get; set; } = string.Empty;
    public Guid strStageGUID { get; set; }
    public DateTime? dtActualCloseDate { get; set; }
    public string? strLossReason { get; set; }
    public string? strDescription { get; set; }
    public DateTime dtStageEnteredOn { get; set; }
    public DateTime? dtLastActivityOn { get; set; }
    public int intDaysInStage { get; set; }
    public List<OpportunityContactDto> Contacts { get; set; } = new();
    public List<ActivityListDto> RecentActivities { get; set; } = new();
}

public class OpportunityContactDto
{
    public Guid strContactGUID { get; set; }
    public string? strContactName { get; set; }
    public string strRole { get; set; } = "Stakeholder";
    public bool bolIsPrimary { get; set; }
}

public class CloseOpportunityDto
{
    public string strStatus { get; set; } = string.Empty;
    public string? strLossReason { get; set; }
    public DateTime? dtActualCloseDate { get; set; }
}

public class OpportunityFilterParams : PagedRequestDto
{
    public string? strStatus { get; set; }
    public Guid? strPipelineGUID { get; set; }
    public Guid? strStageGUID { get; set; }
    public Guid? strAccountGUID { get; set; }
    public Guid? strAssignedToGUID { get; set; }
    public decimal? dblMinAmount { get; set; }
    public decimal? dblMaxAmount { get; set; }
    public DateTime? dtFromDate { get; set; }
    public DateTime? dtToDate { get; set; }
    public bool? bolIsRotting { get; set; }
}

public class MoveStageDto
{
    public Guid strStageGUID { get; set; }
    public string? strLossReason { get; set; }
}

public class AddOpportunityContactDto
{
    public Guid strContactGUID { get; set; }
    public string strRole { get; set; } = "Stakeholder";
    public bool bolIsPrimary { get; set; }
}

public class OpportunityBulkArchiveDto
{
    public List<Guid> Guids { get; set; } = new();
}

public class OpportunityBoardColumnDto
{
    public Guid strStageGUID { get; set; }
    public string strStageName { get; set; } = string.Empty;
    public int intDisplayOrder { get; set; }
    public int intProbabilityPercent { get; set; }
    public bool bolIsWonStage { get; set; }
    public bool bolIsLostStage { get; set; }
    [JsonPropertyName("opportunities")]
    public List<OpportunityListDto> Opportunities { get; set; } = new();
    public decimal dblTotalValue { get; set; }
    public int intCount { get; set; }
}
