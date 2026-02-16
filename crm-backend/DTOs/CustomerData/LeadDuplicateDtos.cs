using crm_backend.DTOs.Common;

namespace crm_backend.DTOs.CustomerData;

public class DuplicatePairDto
{
    public Guid strDuplicateGUID { get; set; }
    public Guid strLeadGUID1 { get; set; }
    public string strLead1Name { get; set; } = string.Empty;
    public string strLead1Email { get; set; } = string.Empty;
    public Guid strLeadGUID2 { get; set; }
    public string strLead2Name { get; set; } = string.Empty;
    public string strLead2Email { get; set; } = string.Empty;
    public string strMatchType { get; set; } = string.Empty;
    public decimal dblConfidenceScore { get; set; }
    public string strStatus { get; set; } = string.Empty;
    public DateTime dtCreatedOn { get; set; }
}

public class LeadMergeRequestDto
{
    public Guid strSurvivorLeadGUID { get; set; }
    public Guid strMergedLeadGUID { get; set; }
    public MergeFieldSelectionDto? FieldSelection { get; set; }
}

public class MergeFieldSelectionDto
{
    public string strEmailFrom { get; set; } = "survivor";
    public string strPhoneFrom { get; set; } = "survivor";
    public string strCompanyNameFrom { get; set; } = "survivor";
    public string strJobTitleFrom { get; set; } = "survivor";
    public string strAddressFrom { get; set; } = "survivor";
    public string strNotesFrom { get; set; } = "merge";
}

public class LeadMergeResultDto
{
    public Guid strSurvivorLeadGUID { get; set; }
    public Guid strMergedLeadGUID { get; set; }
    public string strMessage { get; set; } = string.Empty;
}

public class MergeHistoryListDto
{
    public Guid strMergeHistoryGUID { get; set; }
    public Guid strSurvivorLeadGUID { get; set; }
    public Guid strMergedLeadGUID { get; set; }
    public Guid strMergedByGUID { get; set; }
    public DateTime dtMergedOn { get; set; }
}

public class DuplicateResolveDto
{
    public string strStatus { get; set; } = string.Empty;
}

public class DuplicateFilterParams : PagedRequestDto
{
    public string? strStatus { get; set; }
    public string? strMatchType { get; set; }
}
