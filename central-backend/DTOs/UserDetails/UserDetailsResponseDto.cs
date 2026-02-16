using System;

namespace AuditSoftware.DTOs.UserDetails
{
    public class UserDetailsResponseDto
    {
        public Guid strUserDetailGUID { get; set; }
        public Guid strUserGUID { get; set; }
        public Guid strOrganizationGUID { get; set; }
        public Guid strUserRoleGUID { get; set; }
        public Guid strGroupGUID { get; set; }
        public Guid? strYearGUID { get; set; }
        public Guid? strModuleGUID { get; set; }
        public bool bolIsActive { get; set; }
        public Guid strCreatedByGUID { get; set; }
        public string strCreatedBy { get; set; } = string.Empty;
        public DateTime dtCreatedOn { get; set; }
        public Guid? strUpdatedByGUID { get; set; }
        public string strUpdatedBy { get; set; } = string.Empty;
        public DateTime? dtUpdatedOn { get; set; }
        
        // Additional properties for display
        public string strUserName { get; set; } = string.Empty;
        public string strUserRoleName { get; set; } = string.Empty;
        public string strOrganizationName { get; set; } = string.Empty;
        public string? strYearName { get; set; }
    }
} 