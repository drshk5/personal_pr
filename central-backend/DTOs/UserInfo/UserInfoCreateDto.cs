using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.UserInfo
{
    public class UserInfoCreateDto
    {
        [Required]
        public Guid strUserGUID { get; set; }

        public Guid? strModuleGUID { get; set; }
        
        public Guid? strLastOrganizationGUID { get; set; }
        
        public Guid? strLastYearGUID { get; set; }
    }
}
