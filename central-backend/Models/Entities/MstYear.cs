using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstYear")]
    public class MstYear
    {
        [Key]
        public Guid strYearGUID { get; set; }
        
        public Guid strOrganizationGUID { get; set; }
        
        [Required]
        [StringLength(100)]
        public string strName { get; set; } = string.Empty;
        
        [Required]
        public DateTime dtStartDate { get; set; }
        
        [Required]
        public DateTime dtEndDate { get; set; }
        
        public bool bolIsActive { get; set; }
        
        [Required]
        public bool bolSystemCreated { get; set; } = false;
        
        public Guid? strPreviousYearGUID { get; set; }
        
        public Guid? strNextYearGUID { get; set; }
        
        public Guid strGroupGUID { get; set; }
        
        public Guid strCreatedByGUID { get; set; }
        
        public DateTime dtCreatedOn { get; set; }
        
        public DateTime? dtUpdatedOn { get; set; }
        
        public Guid? strUpdatedByGUID { get; set; }
    }
} 