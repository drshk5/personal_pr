using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Core
{
    [Table("mstUserActivityLog")]
    public class MstUserActivityLog
    {
        [Key]
        [Column("strActivityLogGUID")]
        public Guid ActivityLogGUID { get; set; } = Guid.NewGuid();

        [Required]
        [Column("strUserGUID")]
        public Guid UserGUID { get; set; }

        [Required]
        [Column("strGroupGUID")]
        public Guid GroupGUID { get; set; }

        [Column("strOrganizationGUID")]
        public Guid? OrganizationGUID { get; set; }

        [Column("strModuleGUID")]
        public Guid? ModuleGUID { get; set; }

        [Required]
        [Column("strActivityType")]
        [MaxLength(50)]
        public string ActivityType { get; set; } = string.Empty;

        [Column("strEntityType")]
        [MaxLength(100)]
        public string? EntityType { get; set; }

        [Column("strEntityGUID")]
        public Guid? EntityGUID { get; set; }

        [Column("strDetails")]
        public string? Details { get; set; }

        [Column("strIPAddress")]
        [MaxLength(50)]
        public string? IPAddress { get; set; }

        [Column("strUserAgent")]
        [MaxLength(500)]
        public string? UserAgent { get; set; }

        [Column("strOldValue")]
        public string? OldValue { get; set; }

        [Column("strNewValue")]
        public string? NewValue { get; set; }

        [Column("strYearGUID")]
        public Guid? YearGUID { get; set; }

        [Required]
        [Column("dtActivityTime")]
        public DateTime ActivityTime { get; set; } = DateTime.UtcNow;

        [Column("strSessionID")]
        [MaxLength(100)]
        public string? SessionID { get; set; }

        [Required]
        [Column("strCreatedByGUID")]
        public Guid CreatedByGUID { get; set; }

        [Required]
        [Column("dtCreatedOn")]
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    }
}