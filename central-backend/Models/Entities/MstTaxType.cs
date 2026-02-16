using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstTaxType")]
    public class MstTaxType
    {
        public MstTaxType()
        {
            strTaxTypeGUID = Guid.NewGuid();
            dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            strTaxTypeCode = string.Empty;
            strTaxTypeName = string.Empty;
            strDescription = string.Empty;
            bolIsCompound = false;
            bolIsActive = true;
            strCreatedByGUID = Guid.Empty;
        }

        [Key]
        [Required]
        public Guid strTaxTypeGUID { get; set; }

        [Required]
        [MaxLength(50)]
        public string strTaxTypeCode { get; set; }

        [Required]
        [MaxLength(100)]
        public string strTaxTypeName { get; set; }

        [MaxLength(500)]
        public string? strDescription { get; set; }

        [Required]
        public Guid strCountryGUID { get; set; }

        public bool bolIsCompound { get; set; }

        public bool bolIsActive { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }

        // Navigation property
        [ForeignKey("strCountryGUID")]
        public virtual MstCountry? Country { get; set; }

        [ForeignKey("strCreatedByGUID")]
        public virtual MstUser? CreatedBy { get; set; }

        [ForeignKey("strUpdatedByGUID")]
        public virtual MstUser? UpdatedBy { get; set; }
    }
}
