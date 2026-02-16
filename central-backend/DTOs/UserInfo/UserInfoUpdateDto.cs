using System.ComponentModel.DataAnnotations;

namespace AuditSoftware.DTOs.UserInfo
{
    public class UserInfoUpdateDto
    {
        public Guid? strModuleGUID { get; set; }
        public Guid? strLastOrganizationGUID { get; set; }
        public Guid? strLastYearGUID { get; set; }
    }
}
