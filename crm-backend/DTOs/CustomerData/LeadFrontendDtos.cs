namespace crm_backend.DTOs.CustomerData;

// DTOs that match the CRM frontend expectations where backend routes aggregate data.
// Keep property names aligned with the frontend TypeScript models.

public class LeadListAnalyticsDto
{
    public List<LeadFunnelStageDto> funnel { get; set; } = new();
    public double dblConversionRate { get; set; }
    public double dblAvgTimeToConversionDays { get; set; }
    public int intNewThisWeek { get; set; }
    public int intConvertedThisMonth { get; set; }
    public List<LeadSourceBreakdownDto> sourceBreakdown { get; set; } = new();
    public List<LeadRepPerformanceDto> repPerformance { get; set; } = new();
}

public class LeadFunnelStageDto
{
    public string strStatus { get; set; } = string.Empty;
    public int intCount { get; set; }
    public double dblPercentage { get; set; }
}

public class LeadSourceBreakdownDto
{
    public string strSource { get; set; } = string.Empty;
    public int intCount { get; set; }
    public int intConverted { get; set; }
}

public class LeadRepPerformanceDto
{
    public string strRepName { get; set; } = string.Empty;
    public int intTotal { get; set; }
    public int intConverted { get; set; }
    public double dblConversionRate { get; set; }
}

public class LeadAssignmentRuleDto
{
    public Guid strRuleGUID { get; set; }
    public string strStrategy { get; set; } = string.Empty;
    public string strRuleName { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public string? strTerritoryField { get; set; }
    public List<string>? strTerritoryValues { get; set; }
    public Guid? strAssignToGUID { get; set; }
    public string? strAssignToName { get; set; }
    public int? intMaxCapacity { get; set; }
    public int? intCurrentCount { get; set; }
    public bool bolIsActive { get; set; }
    public int intPriority { get; set; }
}

public class LeadSlaConfigDto
{
    public int intNewMaxHours { get; set; }
    public int intContactedFollowUpHours { get; set; }
    public int intQualifiedConvertMaxDays { get; set; }
    public int intStaleLeadDays { get; set; }
}

public class LeadScoringRuleDto
{
    public Guid strRuleGUID { get; set; }
    public string strRuleName { get; set; } = string.Empty;
    public string strConditionField { get; set; } = string.Empty;
    public string strConditionOperator { get; set; } = string.Empty;
    public string strConditionValue { get; set; } = string.Empty;
    public int intPoints { get; set; }
    public string strCategory { get; set; } = string.Empty;
    public bool bolIsActive { get; set; }
    public int intDisplayOrder { get; set; }
}

public class LeadScoringRuleUpsertDto
{
    public string strRuleName { get; set; } = string.Empty;
    public string strConditionField { get; set; } = string.Empty;
    public string strConditionOperator { get; set; } = string.Empty;
    public string strConditionValue { get; set; } = string.Empty;
    public int intPoints { get; set; }
    public string strCategory { get; set; } = string.Empty;
    public bool bolIsActive { get; set; } = true;
    public int intDisplayOrder { get; set; }
}

public class DuplicateCheckResultDto
{
    public bool bolHasDuplicates { get; set; }
    public List<LeadDuplicateDto> duplicates { get; set; } = new();
}

public class LeadDuplicateDto
{
    public Guid strLeadGUID { get; set; }
    public string strFirstName { get; set; } = string.Empty;
    public string strLastName { get; set; } = string.Empty;
    public string strEmail { get; set; } = string.Empty;
    public string? strCompanyName { get; set; }
    public string strStatus { get; set; } = string.Empty;
    public double dblMatchScore { get; set; }
    public string strMatchReason { get; set; } = string.Empty;
}

public class LeadMergeFrontendDto
{
    public Guid strPrimaryLeadGUID { get; set; }
    public List<Guid> strDuplicateLeadGUIDs { get; set; } = new();
    public Dictionary<string, string>? fieldOverrides { get; set; }
}

public class LeadMergeFrontendResultDto
{
    public Guid strMergedLeadGUID { get; set; }
    public int intActivitiesMerged { get; set; }
    public int intDuplicatesArchived { get; set; }
    public string strMessage { get; set; } = string.Empty;
}

public class LeadBulkAssignDto
{
    public List<Guid> guids { get; set; } = new();
    public Guid strAssignedToGUID { get; set; }
}

public class LeadAutoAssignRequestDto
{
    public List<Guid> guids { get; set; } = new();
}

public class LeadAutoAssignResultDto
{
    public int intAssigned { get; set; }
    public List<LeadAutoAssignItemDto> assignments { get; set; } = new();
}

public class LeadAutoAssignItemDto
{
    public Guid strLeadGUID { get; set; }
    public Guid strAssignedToGUID { get; set; }
    public string strAssignedToName { get; set; } = string.Empty;
}

public class LeadImportMappingDto
{
    public string strCsvColumn { get; set; } = string.Empty;
    public string strLeadField { get; set; } = string.Empty;
}

public class LeadImportResultDto
{
    public Guid? strImportJobGUID { get; set; }
    public int intTotalRows { get; set; }
    public int intCreated { get; set; }
    public int intSkippedDuplicate { get; set; }
    public int intFailed { get; set; }
    public List<LeadImportErrorDto> errors { get; set; } = new();
}

public class LeadImportErrorDto
{
    public int intRowNumber { get; set; }
    public string strField { get; set; } = string.Empty;
    public string strMessage { get; set; } = string.Empty;
}
