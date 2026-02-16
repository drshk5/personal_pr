namespace AuditSoftware.DTOs.UserRole;

public class UserRoleResponseDto
{
    public Guid strUserRoleGUID { get; set; }
    public string strName { get; set; } = string.Empty;
    public string? strDesc { get; set; }
    public bool bolIsActive { get; set; }
    public Guid? strModuleGUID { get; set; }
    public string? strModuleName { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public Guid strCreatedByGUID { get; set; }
    public string strCreatedBy { get; set; } = string.Empty;
    public DateTime? dtUpdatedOn { get; set; }
    public Guid? strUpdatedByGUID { get; set; }
    public string strUpdatedBy { get; set; } = string.Empty;
    public bool bolSystemCreated { get; set; }
} 