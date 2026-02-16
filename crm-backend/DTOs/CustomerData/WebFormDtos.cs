using crm_backend.DTOs.Common;

namespace crm_backend.DTOs.CustomerData;

// --- CREATE WEB FORM ---
public class CreateWebFormDto
{
    public string strFormName { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public string? strRedirectUrl { get; set; }
    public string? strThankYouMessage { get; set; }
    public string strDefaultSource { get; set; } = "WebForm";
    public bool bolCaptchaEnabled { get; set; } = true;
    public List<CreateWebFormFieldDto> Fields { get; set; } = new();
}

// --- CREATE WEB FORM FIELD ---
public class CreateWebFormFieldDto
{
    public string strFieldLabel { get; set; } = string.Empty;
    public string strFieldType { get; set; } = string.Empty;
    public string? strMappedLeadField { get; set; }
    public bool bolIsRequired { get; set; }
    public string? strOptionsJson { get; set; }
    public int intSortOrder { get; set; }
}

// --- UPDATE WEB FORM ---
public class UpdateWebFormDto : CreateWebFormDto
{
    public bool bolIsActive { get; set; } = true;
}

// --- WEB FORM LIST ---
public class WebFormListDto
{
    public Guid strWebFormGUID { get; set; }
    public string strFormName { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public string strDefaultSource { get; set; } = string.Empty;
    public bool bolCaptchaEnabled { get; set; }
    public bool bolIsActive { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public int intFieldCount { get; set; }
    public int intSubmissionCount { get; set; }
}

// --- WEB FORM DETAIL ---
public class WebFormDetailDto : WebFormListDto
{
    public string? strRedirectUrl { get; set; }
    public string? strThankYouMessage { get; set; }
    public List<WebFormFieldDto> Fields { get; set; } = new();
}

// --- WEB FORM FIELD ---
public class WebFormFieldDto
{
    public Guid strWebFormFieldGUID { get; set; }
    public string strFieldLabel { get; set; } = string.Empty;
    public string strFieldType { get; set; } = string.Empty;
    public string? strMappedLeadField { get; set; }
    public bool bolIsRequired { get; set; }
    public string? strOptionsJson { get; set; }
    public int intSortOrder { get; set; }
}

// --- WEB FORM SUBMIT ---
public class WebFormSubmitDto
{
    public Dictionary<string, string> Fields { get; set; } = new();
    public string? strUtmSource { get; set; }
    public string? strUtmMedium { get; set; }
    public string? strUtmCampaign { get; set; }
    public string? strUtmTerm { get; set; }
    public string? strUtmContent { get; set; }
}

// --- WEB FORM SUBMISSION LIST ---
public class WebFormSubmissionListDto
{
    public Guid strWebFormSubmissionGUID { get; set; }
    public string strSubmittedDataJson { get; set; } = string.Empty;
    public Guid? strLeadGUID { get; set; }
    public string strStatus { get; set; } = string.Empty;
    public string? strIpAddress { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public string? strUtmSource { get; set; }
    public string? strUtmMedium { get; set; }
    public string? strUtmCampaign { get; set; }
}

// --- WEB FORM EMBED CODE ---
public class WebFormEmbedCodeDto
{
    public string strHtml { get; set; } = string.Empty;
    public string strFormUrl { get; set; } = string.Empty;
}

// --- WEB FORM FILTER PARAMS ---
public class WebFormFilterParams : PagedRequestDto
{
    public new bool? bolIsActive { get; set; }
}
