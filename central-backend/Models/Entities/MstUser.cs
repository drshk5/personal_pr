using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstUser")]
    public class MstUser
    {
    [Key]
    public Guid strUserGUID { get; set; } = Guid.NewGuid();
        
        [Required]
        public string strName { get; set; } = string.Empty;
        
        public DateTime? dtBirthDate { get; set; }
        
        [Required]
        public string strMobileNo { get; set; } = string.Empty;
        
        [Required]
        public string strPassword { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string strEmailId { get; set; } = string.Empty;
        
        [StringLength(6)]
        public string? strOTP { get; set; }
        
        public DateTime? dtOTPExpiry { get; set; }
        
        public bool bolIsActive { get; set; }
        
        [Required]
        public bool bolSystemCreated { get; set; } = false;
        
        public TimeSpan? dtWorkingStartTime { get; set; }
        
    // Session management fields removed in favor of mstUserSession table
        
        public TimeSpan? dtWorkingEndTime { get; set; }
        
        public bool bolIsSuperAdmin { get; set; }
        
    public Guid? strGroupGUID { get; set; }

            // New fields requested: link to designation and department
            public Guid? strDesignationGUID { get; set; }

            public Guid? strDepartmentGUID { get; set; }
        
        [Required]
        public Guid strCreatedByGUID { get; set; }
        
        public DateTime dtCreatedOn { get; set; } = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
        
        public Guid? strUpdatedByGUID { get; set; }
        
        public DateTime? dtUpdatedOn { get; set; }
        
    public Guid? strLastModuleGUID { get; set; }
    
    [MaxLength(255)]
    public string? strProfileImg { get; set; }

    [MaxLength(50)]
    public string strTimeZone { get; set; } = "Asia/Kolkata";
    }
} 