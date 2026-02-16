using crm_backend.Models.Core;

namespace crm_backend.Models.Core.CustomerData;

public class MstWebFormField : ITenantEntity
{
    public Guid strWebFormFieldGUID { get; set; }
    public Guid strGroupGUID { get; set; }
    public Guid strWebFormGUID { get; set; }
    public string strFieldLabel { get; set; } = string.Empty;
    public string strFieldType { get; set; } = string.Empty; // Text, Email, Phone, Dropdown, TextArea, Hidden
    public string strMappedLeadField { get; set; } = string.Empty; // strFirstName, strEmail, etc.
    public bool bolIsRequired { get; set; }
    public string? strDefaultValue { get; set; }
    public string? strOptionsJson { get; set; } // For dropdowns: ["Option1","Option2"]
    public int intSortOrder { get; set; }
    public DateTime dtCreatedOn { get; set; } = DateTime.UtcNow;

    // Navigation
    public MstWebForm? WebForm { get; set; }
}
