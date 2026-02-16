using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AuditSoftware.Models.Entities;

[Table("mstTaxCategory")]
public class MstTaxCategory
{
    public MstTaxCategory()
    {
        strTaxCategoryGUID = Guid.NewGuid();
        bolIsActive = true;
        dtCreatedOn = DateTime.UtcNow;
        decTotalTaxPercentage = 0;
    }

    [Key]
    public Guid strTaxCategoryGUID { get; set; }

    [Required]
    [ForeignKey(nameof(TaxType))]
    public Guid strTaxTypeGUID { get; set; }

    [Required]
    [MaxLength(50)]
    public string strCategoryCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string strCategoryName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? strDescription { get; set; }

    [Column(TypeName = "decimal(18, 4)")]
    public decimal decTotalTaxPercentage { get; set; }

    public bool bolIsActive { get; set; }

    [Required]
    [ForeignKey(nameof(CreatedBy))]
    public Guid strCreatedByGUID { get; set; }

    public DateTime dtCreatedOn { get; set; }

    [ForeignKey(nameof(UpdatedBy))]
    public Guid? strUpdatedByGUID { get; set; }

    public DateTime? dtUpdatedOn { get; set; }

    // Navigation properties
    public virtual MstTaxType? TaxType { get; set; }
    public virtual MstUser? CreatedBy { get; set; }
    public virtual MstUser? UpdatedBy { get; set; }
}
