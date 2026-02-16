namespace AuditSoftware.DTOs.UserInfo
{
    public class UserInfoResponseDto
    {
        public Guid strUserInfoGUID { get; set; }
        public Guid strUserGUID { get; set; }
        public Guid? strModuleGUID { get; set; }
        public Guid? strLastOrganizationGUID { get; set; }
        public Guid? strLastYearGUID { get; set; }
        public DateTime dtCreatedOn { get; set; }
        public DateTime? dtUpdatedOn { get; set; }
    }
}
