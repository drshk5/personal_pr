using System.Collections.Generic;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.PicklistValue
{
    public class PicklistValueFilterDto : BaseFilterDto
    {
        public List<string>? PicklistTypeGUIDs { get; set; }
        public string? strGroupGUID { get; set; }
        
        /// <summary>
        /// Filter by active status: true, false, or null (both)
        /// </summary>
        public bool? bolIsActive { get; set; }
        
        /// <summary>
        /// Filter by created users
        /// </summary>
        public List<string>? CreatedByGUIDs { get; set; }
        
        /// <summary>
        /// Filter by updated users
        /// </summary>
        public List<string>? UpdatedByGUIDs { get; set; }

        /// <summary>
        /// Search specifically by value
        /// </summary>
        public string? ValueSearch { get; set; }
        
        /// <summary>
        /// Search specifically by description
        /// </summary>
        public string? DescriptionSearch { get; set; }
    }
} 