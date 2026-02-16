using AuditSoftware.DTOs.Common;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.PicklistType
{
    public class PicklistTypeFilterDto : BaseFilterDto
    {
        /// <summary>
        /// Filter by active status (null = all, true = only active, false = only inactive)
        /// </summary>
        public bool? bolIsActive { get; set; }
        
        /// <summary>
        /// Search specifically by type
        /// </summary>
        [FromQuery(Name = "typeSearch")]
        public string? TypeSearch { get; set; }
        
        /// <summary>
        /// Search specifically by description
        /// </summary>
        [FromQuery(Name = "descriptionSearch")]
        public string? DescriptionSearch { get; set; }
    }
} 