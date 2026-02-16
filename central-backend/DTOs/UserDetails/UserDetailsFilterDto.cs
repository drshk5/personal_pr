using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.UserDetails
{
    public class UserDetailsFilterDto : BaseFilterDto
    {
        public string? strGroupGUID { get; set; }
        public string? strOrganizationGUID { get; set; }
        public string? strModuleGUID { get; set; }
        
        /// <summary>
        /// User Role GUID filter, can be comma-separated for multiple values
        /// </summary>
        public string? strUserRoleGUID { get; set; }
        
        /// <summary>
        /// User GUID filter, can be comma-separated for multiple values
        /// </summary>
        public string? strUserGUID { get; set; }
        
        /// <summary>
        /// Year GUID filter, can be comma-separated for multiple values
        /// </summary>
        public string? strYearGUID { get; set; }
        
        public bool? bolIsActive { get; set; }
    }
} 