using AuditSoftware.DTOs.Common;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.TaxRate
{
    public class TaxRateFilterDto : BaseFilterDto
    {
        [FromQuery(Name = "bolIsActive")]
        public bool? bolIsActive { get; set; }
        
        [FromQuery(Name = "strTaxTypeGUID")]
        public string? strTaxTypeGUID { get; set; }
        
        [FromQuery(Name = "strTaxCategoryGUID")]
        public string? strTaxCategoryGUID { get; set; }
        
        [FromQuery(Name = "strScheduleGUID")]
        public string? strScheduleGUID { get; set; }
        
        [FromQuery(Name = "strStateGUID")]
        public string? strStateGUID { get; set; }
    }
}
