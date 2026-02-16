using AuditSoftware.DTOs.Common;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.TaxCategory;

public class TaxCategoryFilterDto : BaseFilterDto
{
    [FromQuery(Name = "strTaxTypeGUID")]
    public string? strTaxTypeGUID { get; set; }
    
    [FromQuery(Name = "bolIsActive")]
    public bool? bolIsActive { get; set; }
    
    [FromQuery(Name = "minPercentage")]
    public decimal? minPercentage { get; set; }
    
    [FromQuery(Name = "maxPercentage")]
    public decimal? maxPercentage { get; set; }
}
