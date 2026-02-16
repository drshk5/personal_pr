using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstTaxRate")]
    public class MstTaxRate
    {
        public MstTaxRate()
        {
            strTaxRateGUID = Guid.NewGuid();
            dtCreatedOn = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
            strTaxRateName = string.Empty;
            strTaxRateCode = string.Empty;
            bolIsActive = true;
            strCreatedByGUID = Guid.Empty;
            intDisplayOrder = 0;
        }

        [Key]
        [Required]
        public Guid strTaxRateGUID { get; set; }

        [Required]
        public Guid strTaxTypeGUID { get; set; }

        [Required]
        public Guid strTaxCategoryGUID { get; set; }

        [Required]
        public Guid strScheduleGUID { get; set; }

        [Required]
        [MaxLength(100)]
        public string strTaxRateName { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,4)")]
        public decimal decTaxPercentage { get; set; }

        [Required]
        [MaxLength(50)]
        public string strTaxRateCode { get; set; }

        public Guid? strStateGUID { get; set; }

        public int intDisplayOrder { get; set; }

        public DateTime? dtEffectiveFrom { get; set; }

        public DateTime? dtEffectiveTo { get; set; }

        public bool bolIsActive { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedOn { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }

        // Navigation properties
        [ForeignKey("strTaxTypeGUID")]
        public virtual MstTaxType? TaxType { get; set; }

        [ForeignKey("strTaxCategoryGUID")]
        public virtual MstTaxCategory? TaxCategory { get; set; }

        [ForeignKey("strScheduleGUID")]
        public virtual MstSchedule? Schedule { get; set; }

        [ForeignKey("strStateGUID")]
        public virtual MstState? State { get; set; }

        [ForeignKey("strCreatedByGUID")]
        public virtual MstUser? CreatedBy { get; set; }

        [ForeignKey("strUpdatedByGUID")]
        public virtual MstUser? UpdatedBy { get; set; }
    }
}
