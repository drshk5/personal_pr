using System;

namespace AuditSoftware.DTOs.User
{
    public class UserResponseDto
    {
        public Guid strUserGUID { get; set; }
        public string strName { get; set; } = string.Empty;
        public DateOnly? dtBirthDate { get; set; }
        public string strMobileNo { get; set; } = string.Empty;
        public string strEmailId { get; set; } = string.Empty;
        public bool bolIsActive { get; set; }
        public TimeSpan? dtWorkingStartTime { get; set; }
        public TimeSpan? dtWorkingEndTime { get; set; }
        public bool bolIsSuperAdmin { get; set; }
        public Guid strGroupGUID { get; set; }
        public Guid strCreatedByGUID { get; set; }
        public string strCreatedBy { get; set; } = string.Empty;
        public DateTime dtCreatedOn { get; set; }
        public Guid? strUpdatedByGUID { get; set; }
        public string strUpdatedBy { get; set; } = string.Empty;
        public DateTime? dtUpdatedOn { get; set; }
        public string? strLastOrganizationGUID { get; set; }
        public string? strProfileImg { get; set; }
        public string? strTimeZone { get; set; }
        public Guid? strDesignationGUID { get; set; }
        public string? strDesignationName { get; set; }
        public Guid? strDepartmentGUID { get; set; }
        public string? strDepartmentName { get; set; }
        public bool bolSystemCreated { get; set; }
    }
} 