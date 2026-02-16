using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstUserInfo")]
    public class MstUserInfo
    {
        [Key]
        public Guid strUserInfoGUID { get; set; } = Guid.NewGuid();
        
        [Required]
        public Guid strUserGUID { get; set; }

        public Guid? strModuleGUID { get; set; }
        
        public Guid? strLastOrganizationGUID { get; set; }
        
        public Guid? strLastYearGUID { get; set; }
        
        [Required]
        public Guid strCreatedByGUID { get; set; }
        
        public DateTime dtCreatedOn { get; set; } = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
        
        public Guid? strUpdatedByGUID { get; set; }
        
        public DateTime? dtUpdatedOn { get; set; }

        // Navigation property for User
        [ForeignKey("strUserGUID")]
        public virtual MstUser? User { get; set; }
    }
}
