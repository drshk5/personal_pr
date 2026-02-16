namespace AuditSoftware.DTOs.Group;

public class GroupResponseDto
{
    public Guid strGroupGUID { get; set; }
    public string strName { get; set; } = string.Empty;
    public string strLicenseNo { get; set; } = string.Empty;
    public string strPAN { get; set; } = string.Empty;
    public string strTAN { get; set; } = string.Empty;
    public string strCIN { get; set; } = string.Empty;
    public DateTime dtLicenseIssueDate { get; set; }
    public DateTime dtLicenseExpired { get; set; }
    public string? strLogo { get; set; }
    public string? strCreatedByGUID { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public string? strUpdatedByGUID { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
} 