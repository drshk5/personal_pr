using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstIndustryType")]
    public class MstIndustry
    {
        public MstIndustry()
        {
            strIndustryGUID = Guid.NewGuid();
            dtCreatedOn = DateTime.UtcNow;
            strName = string.Empty;
            bolIsActive = true; // Default to active
            strCreatedByGUID = Guid.Empty; // This will be set when saving
        }

        [Key]
        [Required]
        public Guid strIndustryGUID { get; set; }

        [Required]
        [MaxLength(450)]
        public string strName { get; set; }

        public bool bolIsActive { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }
    }
}
