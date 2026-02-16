using System;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.Year
{
    public class YearFilterDto : BaseFilterDto
    {
        /// <summary>
        /// Filter by organization GUIDs
        /// </summary>
        public List<Guid>? OrganizationGUIDs { get; set; }
        
        /// <summary>
        /// Filter by active status: true, false, or null (both)
        /// </summary>
        public bool? bolIsActive { get; set; }
        
        /// <summary>
        /// Filter by created users
        /// </summary>
        public List<Guid>? CreatedByGUIDs { get; set; }
        
        /// <summary>
        /// Filter by updated users
        /// </summary>
        public List<Guid>? UpdatedByGUIDs { get; set; }
        
        /// <summary>
        /// Filter by group GUID
        /// </summary>
        public Guid? GroupGUID { get; set; }
    }
}
