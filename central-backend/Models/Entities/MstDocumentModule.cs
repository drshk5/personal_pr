using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstDocumentModule")]
    public class MstDocumentModule
    {
        public MstDocumentModule()
        {
            strDocumentModuleGUID = Guid.NewGuid();
            dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            bolIsActive = true;
        }

        [Key]
        [Required]
        public Guid strDocumentModuleGUID { get; set; }

        [Required]
        public Guid strModuleGUID { get; set; }

        [Required]
        [MaxLength(255)]
        public string strModuleName { get; set; } = string.Empty;

        [Required]
        public bool bolIsActive { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }
    }
}

