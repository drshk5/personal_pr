using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstCurrencyType")]
    public class MstCurrencyType
    {
        public MstCurrencyType()
        {
            strCurrencyTypeGUID = Guid.NewGuid();
            dtCreatedOn = DateTime.UtcNow;
            strName = string.Empty;
            bolIsActive = true; // Default to active
            strCreatedByGUID = Guid.Empty; // This will be set when saving
        }

        [Key]
        [Required]
        public Guid strCurrencyTypeGUID { get; set; }

        [Required]
        [MaxLength(450)]
        public string strName { get; set; }

        public Guid? strCountryGUID { get; set; }

        [ForeignKey("strCountryGUID")]
        public virtual MstCountry? Country { get; set; }

        public bool bolIsActive { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }
    }
}
