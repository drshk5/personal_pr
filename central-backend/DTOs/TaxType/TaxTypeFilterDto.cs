using AuditSoftware.DTOs.Common;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.TaxType
{
    public class TaxTypeFilterDto : BaseFilterDto
    {
        [FromQuery(Name = "bolIsActive")]
        public bool? bolIsActive { get; set; }
        
        [FromQuery(Name = "strCountryGUID")]
        public string? strCountryGUID { get; set; }
        
        [FromQuery(Name = "bolIsCompound")]
        public bool? bolIsCompound { get; set; }
    }
}
