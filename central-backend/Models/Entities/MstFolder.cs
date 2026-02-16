using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstFolder")]
    public class MstFolder
    {
        [Key]
        public Guid strFolderGUID { get; set; }
        
        [Required]
        [StringLength(100)]
        public string strFolderName { get; set; } = string.Empty;
        
        public Guid strOrganizationGUID { get; set; }
        
        public Guid strYearGUID { get; set; }
        
        public Guid strGroupGUID { get; set; }
        
        [Required]
        public Guid strModuleGUID { get; set; }
        
        public Guid strCreatedByGUID { get; set; }
        
        public DateTime dtCreatedOn { get; set; }
        
        public DateTime? dtUpdatedOn { get; set; }
        
        public Guid? strUpdatedByGUID { get; set; }
        
        [StringLength(500)]
        public string strFolderPath { get; set; } = string.Empty;
    }
}