namespace AuditSoftware.DTOs.TaxCategory;

public class TaxCategorySimpleDto
{
    public string strTaxCategoryGUID { get; set; } = string.Empty;
    public string strCategoryCode { get; set; } = string.Empty;
    public string strCategoryName { get; set; } = string.Empty;
    public decimal decTotalTaxPercentage { get; set; }
}
