using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstDocType")]
    public class MstDocType
    {
        public MstDocType()
        {
            strDocTypeGUID = Guid.NewGuid();
            dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            bolIsActive = true; // Default to active
        }

        [Key]
        [Required]
        public Guid strDocTypeGUID { get; set; }

        [Required]
        [MaxLength(50)]
        public string strDocTypeCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string strDocTypeName { get; set; } = string.Empty;

        public bool bolIsActive { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }

        // Navigation properties for created/updated by users if needed
    }
}