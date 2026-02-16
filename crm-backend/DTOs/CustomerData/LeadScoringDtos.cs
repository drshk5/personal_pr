using crm_backend.DTOs.Common;

namespace crm_backend.DTOs.CustomerData;

public class CreateScoringRuleDto
{
    public string strRuleName { get; set; } = string.Empty;
    public string strRuleCategory { get; set; } = string.Empty;
    public string strConditionField { get; set; } = string.Empty;
    public string strConditionOperator { get; set; } = "Equals";
    public string? strConditionValue { get; set; }
    public int intScorePoints { get; set; }
    public int? intDecayDays { get; set; }
    public int intSortOrder { get; set; }
}

public class UpdateScoringRuleDto : CreateScoringRuleDto
{
    public bool bolIsActive { get; set; } = true;
}

public class ScoringRuleListDto
{
    public Guid strScoringRuleGUID { get; set; }
    public string strRuleName { get; set; } = string.Empty;
    public string strRuleCategory { get; set; } = string.Empty;
    public string strConditionField { get; set; } = string.Empty;
    public string strConditionOperator { get; set; } = string.Empty;
    public string? strConditionValue { get; set; }
    public int intScorePoints { get; set; }
    public int? intDecayDays { get; set; }
    public int intSortOrder { get; set; }
    public bool bolIsActive { get; set; }
    public DateTime dtCreatedOn { get; set; }
}

public class ScoreHistoryListDto
{
    public Guid strScoreHistoryGUID { get; set; }
    public Guid strLeadGUID { get; set; }
    public int intPreviousScore { get; set; }
    public int intNewScore { get; set; }
    public int intScoreChange { get; set; }
    public string strChangeReason { get; set; } = string.Empty;
    public Guid? strScoringRuleGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }
}

public class ScoreBreakdownDto
{
    public Guid strLeadGUID { get; set; }
    public int intTotalScore { get; set; }
    public List<ScoreBreakdownItemDto> Items { get; set; } = new();
}

public class ScoreBreakdownItemDto
{
    public string strRuleName { get; set; } = string.Empty;
    public string strRuleCategory { get; set; } = string.Empty;
    public string strConditionField { get; set; } = string.Empty;
    public int intPoints { get; set; }
    public bool bolApplied { get; set; }
}

public class ScoringRuleFilterParams : PagedRequestDto
{
    public string? strRuleCategory { get; set; }
    public new bool? bolIsActive { get; set; }
}
