using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities
{
    [Table("mstOrgTaxConfig")]
    public class MstOrgTaxConfig
    {
        public MstOrgTaxConfig()
        {
            strOrgTaxConfigGUID = Guid.NewGuid();
            bolIsActive = true;
            dtCreatedDate = AuditSoftware.Helpers.DateTimeHelper.GetCurrentUtcTime();
        }

        [Key]
        [Required]
        public Guid strOrgTaxConfigGUID { get; set; }

        [Required]
        public Guid strOrganizationGUID { get; set; }

        [Required]
        public Guid strTaxTypeGUID { get; set; }

        [MaxLength(50)]
        public string? strTaxRegNo { get; set; }

        public Guid? strStateGUID { get; set; }

        public DateTime? dtRegistrationDate { get; set; }

        [Required]
        public bool bolIsDefault { get; set; } = true;

        [Required]
        public bool bolIsActive { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? jsonSettings { get; set; }

        [Required]
        public Guid strCreatedByGUID { get; set; }

        [Required]
        public DateTime dtCreatedDate { get; set; }

        public Guid? strUpdatedByGUID { get; set; }

        public DateTime? dtUpdatedOn { get; set; }

        // Navigation Properties
        [ForeignKey("strOrganizationGUID")]
        public virtual MstOrganization? Organization { get; set; }

        [ForeignKey("strTaxTypeGUID")]
        public virtual MstTaxType? TaxType { get; set; }

        [ForeignKey("strStateGUID")]
        public virtual MstState? State { get; set; }
    }
}
