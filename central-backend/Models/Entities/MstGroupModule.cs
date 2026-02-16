using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstGroupModule")]
    public class MstGroupModule
    {
        public MstGroupModule()
        {
            strGroupModuleGUID = Guid.NewGuid();
            dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            intVersion = 1; // Default version starts at 1
        }

        [Key]
        [Required]
        public Guid strGroupModuleGUID { get; set; }

        [Required]
        public Guid strGroupGUID { get; set; }

        [Required]
        public Guid strModuleGUID { get; set; }

        [Required]
        public int intVersion { get; set; }

        [MaxLength(500)]
        public string strConnectionString { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }

        // Navigation properties
        [ForeignKey("strGroupGUID")]
        public virtual MstGroup Group { get; set; }

        [ForeignKey("strModuleGUID")]
        public virtual MstModule Module { get; set; }
    }
}
