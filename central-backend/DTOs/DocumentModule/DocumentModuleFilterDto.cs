using Microsoft.AspNetCore.Mvc;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.DocumentModule
{
    public class DocumentModuleFilterDto : BaseFilterDto
    {
        [FromQuery(Name = "search")]
        public string? Search { get; set; }

        [FromQuery(Name = "bolIsActive")]
        public bool? bolIsActive { get; set; }
    }
}

