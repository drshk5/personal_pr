using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstModule")]
    public class MstModule
    {
        public MstModule()
        {
            strModuleGUID = Guid.NewGuid();
            dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            strName = string.Empty;
            strDesc = string.Empty; // Initialize the description field
            strSQlfilePath = string.Empty; // Initialize the new field
            strImagePath = string.Empty; // Initialize the image path field
            bolIsActive = true; // Default to active
            strCreatedByGUID = Guid.Empty; // This will be set when saving
        }

        [Key]
        [Required]
        public Guid strModuleGUID { get; set; }

        [Required]
        [MaxLength(450)]
        public string strName { get; set; }
        
        [MaxLength(1000)]
        public string strDesc { get; set; }

        public string strSQlfilePath { get; set; }
        
        public string strImagePath { get; set; }

        public bool bolIsActive { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }
    }
}
