using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.UserRights
{
    public class UserRightsFilterDto : BaseFilterDto
    {
        public Guid? strUserRoleGUID { get; set; }
    }
} 