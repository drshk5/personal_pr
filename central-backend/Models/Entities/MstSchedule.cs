using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstSchedule")]
    public class MstSchedule
    {
    public MstSchedule()
    {
        strScheduleGUID = Guid.NewGuid();
        bolIsActive = true; // Default to active
        bolIsEditable = true; // Default to editable
    }        [Key]
        [Required]
        public Guid strScheduleGUID { get; set; }

        public int code { get; set; }

        [Required]
        [MaxLength(50)]
        public string strScheduleCode { get; set; } = string.Empty;

        public string? strRefNo { get; set; }

        [Required]
        [MaxLength(100)]
        public string strScheduleName { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? strTemplateName { get; set; }

        [MaxLength(50)]
        public string? strUnderCode { get; set; }

        public Guid? strParentScheduleGUID { get; set; }

        public double? dblChartType { get; set; }

        public Guid? strDefaultAccountTypeGUID { get; set; }

        [Required]
        public bool bolIsActive { get; set; }

        [Required]
        public bool bolIsEditable { get; set; }

        // Navigation properties can be added if there are relationships with other entities
    }
}
