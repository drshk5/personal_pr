namespace crm_backend.DTOs.CustomerData;

public class ConvertLeadDto
{
    public Guid strLeadGUID { get; set; }
    public bool bolCreateAccount { get; set; } = true;
    public bool bolCreateOpportunity { get; set; } = true;
    public Guid? strExistingAccountGUID { get; set; }
    public string? strOpportunityName { get; set; }
    public Guid? strPipelineGUID { get; set; }
    public decimal? dblAmount { get; set; }
}

public class LeadConversionResultDto
{
    public Guid strLeadGUID { get; set; }
    public Guid strContactGUID { get; set; }
    public Guid? strAccountGUID { get; set; }
    public Guid? strOpportunityGUID { get; set; }
    public string strMessage { get; set; } = string.Empty;
}
