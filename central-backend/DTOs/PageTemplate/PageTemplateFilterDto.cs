using AuditSoftware.DTOs.Common;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.PageTemplate
{
    public class PageTemplateFilterDto : BaseFilterDto
    {
        [FromQuery(Name = "bolIsActiveSearch")]
        public bool? BolIsActive { get; set; }
    }
}
