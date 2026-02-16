using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace AuditSoftware.Models.Entities
{
    [Table("mstPicklistType")]
    public class MstPicklistType
    {
        public MstPicklistType()
        {
            strPicklistTypeGUID = Guid.NewGuid();
            dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            strType = string.Empty;
            strDescription = string.Empty;
            bolIsActive = true; // Default to active
            PicklistValues = new List<MstPickListValue>();
            strCreatedByGUID = Guid.Empty; // This will be set when saving
        }

        [Key]
        [Required]
        public Guid strPicklistTypeGUID { get; set; }

        [Required]
        [MaxLength(450)]
        public string strType { get; set; }

        public string? strDescription { get; set; }

        public bool bolIsActive { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }

        // Navigation property
        public virtual ICollection<MstPickListValue> PicklistValues { get; set; }
    }
} 