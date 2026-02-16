namespace AuditSoftware.DTOs.UserRights
{
    public class UserRightsResponseDto
    {
        public Guid strUserRightGUID { get; set; }
        public Guid strUserRoleGUID { get; set; }
        public Guid strMenuGUID { get; set; }
        public bool bolCanView { get; set; }
        public bool bolCanEdit { get; set; }
        public bool bolCanSave { get; set; }
        public bool bolCanDelete { get; set; }
        public bool bolCanPrint { get; set; }
        public bool bolCanExport { get; set; }
        public bool bolCanImport { get; set; }
        public bool bolCanApprove { get; set; }

        // Navigation properties
        public string? strUserRoleName { get; set; }
        public string? strMenuName { get; set; }
    }
} 