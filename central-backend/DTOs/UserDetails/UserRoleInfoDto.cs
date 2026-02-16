namespace AuditSoftware.DTOs.UserDetails
{
    public class UserRoleInfoDto
    {
        public Guid strUserRoleGUID { get; set; }
        public string strRoleName { get; set; } = string.Empty;
        public bool bolIsActive { get; set; }
    }
}