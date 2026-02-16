using System.Collections.Generic;

namespace AuditSoftware.DTOs.UserRights
{
    public class UserRightsByRoleResponseDto
    {
        public Guid? strUserRoleGUID { get; set; }
        public string? strRoleName { get; set; }
        public List<MenuTreeDto> MenuTree { get; set; } = new List<MenuTreeDto>();
    }
}
