namespace AuditSoftware.DTOs.TaxCategory;

public class TaxCategoryResponseDto
{
    public string strTaxCategoryGUID { get; set; } = string.Empty;
    public string strTaxTypeGUID { get; set; } = string.Empty;
    public string strTaxTypeName { get; set; } = string.Empty;
    public string strCategoryCode { get; set; } = string.Empty;
    public string strCategoryName { get; set; } = string.Empty;
    public string? strDescription { get; set; }
    public decimal decTotalTaxPercentage { get; set; }
    public bool bolIsActive { get; set; }
    public string strCreatedByGUID { get; set; } = string.Empty;
    public string? strCreatedByName { get; set; }
    public DateTime dtCreatedOn { get; set; }
    public string? strUpdatedByGUID { get; set; }
    public string? strUpdatedByName { get; set; }
    public DateTime? dtUpdatedOn { get; set; }
}
