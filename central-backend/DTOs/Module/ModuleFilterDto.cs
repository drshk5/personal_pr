using AuditSoftware.DTOs.Common;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.Module
{
    public class ModuleFilterDto : BaseFilterDto
    {
        [FromQuery(Name = "nameSearch")]
        public string? NameSearch { get; set; }
        public string? SqlFilePathSearch { get; set; }
        public bool? bolIsActive { get; set; }
    }
}
