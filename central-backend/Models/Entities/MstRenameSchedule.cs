using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstRenameSchedule")]
    public class MstRenameSchedule
    {
        public MstRenameSchedule()
        {
            strRenameScheduleGUID = Guid.NewGuid();
        }

        [Key]
        [Required]
        public Guid strRenameScheduleGUID { get; set; }

        [Required]
        [MaxLength(100)]
        public string strRenameScheduleName { get; set; } = string.Empty;

        [Required]
        public Guid strScheduleGUID { get; set; }

        [Required]
        public Guid strGroupGUID { get; set; }

        // Common audit fields
        public DateTime? dteCreatedOn { get; set; }
        public string? strCreatedByGUID { get; set; }
        public DateTime? dteModifiedOn { get; set; }
        public string? strModifiedByGUID { get; set; }
    }
}