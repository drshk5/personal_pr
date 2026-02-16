using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstUserDetails")]
    public class MstUserDetails
    {
    [Key]
    public Guid strUserDetailGUID { get; set; } = Guid.NewGuid();
        
    [Required]
    public Guid strUserGUID { get; set; }
        
    [Required]
    public Guid strOrganizationGUID { get; set; }
        
    [Required]
    public Guid strUserRoleGUID { get; set; }
        
    [Required]
    public Guid strGroupGUID { get; set; }
        
    [Required]
    public Guid strYearGUID { get; set; }
        
    public Guid? strModuleGUID { get; set; }
        
    [Required]
    public bool bolIsActive { get; set; } = true;
        
        [Required]
        public Guid strCreatedByGUID { get; set; }
        
        public DateTime dtCreatedOn { get; set; } = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
        
        public Guid? strUpdatedByGUID { get; set; }
        
        public DateTime? dtUpdatedOn { get; set; }
    }
} 