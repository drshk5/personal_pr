using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstPickListValue")]
    public class MstPickListValue
    {
        [Key]
        public Guid strPickListValueGUID { get; set; }

        [Required]
        public string strValue { get; set; } = string.Empty;

        [Required]
        public Guid strPicklistTypeGUID { get; set; }

        [Required]
        public bool bolIsActive { get; set; }

        [Required]
        public Guid strGroupGUID { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; } = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }

        // Navigation properties
        [ForeignKey("strPicklistTypeGUID")]
        public virtual MstPicklistType PicklistType { get; set; } = null!;

        [ForeignKey("strGroupGUID")]
        public virtual MstGroup Group { get; set; } = null!;
    }
} 