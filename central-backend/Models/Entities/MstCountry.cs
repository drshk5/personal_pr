using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstCountry")]
    public class MstCountry
    {
        public MstCountry()
        {
            strCountryGUID = Guid.NewGuid();
            dtCreatedOn = DateTime.UtcNow;
            dtUpdatedOn = DateTime.UtcNow;
            bolIsActive = true;
        }

        [Key]
        public Guid strCountryGUID { get; set; }

        [Required]
        [StringLength(100)]
        public string strName { get; set; }

        [StringLength(10)]
        public string? strCountryCode { get; set; }

        [StringLength(10)]
        public string? strDialCode { get; set; }

        public int? intPhoneMinLength { get; set; }

        public int? intPhoneMaxLength { get; set; }

        public bool bolIsActive { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime dtUpdatedOn { get; set; }
    }
}
