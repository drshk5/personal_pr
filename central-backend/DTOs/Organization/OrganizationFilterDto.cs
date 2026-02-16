using AuditSoftware.DTOs.Common;
using System;
using System.Collections.Generic;

namespace AuditSoftware.DTOs.Organization
{
    public class OrganizationFilterDto : BaseFilterDto
    {
        public bool? bolIsActive { get; set; }
        public Guid? GroupGUID { get; set; } // Changed from CompanyGUID for consistency
        
        // Dynamic filters
        public Guid? IndustryGUID { get; set; }
        public Guid? LegalStatusTypeGUID { get; set; }
        public Guid? ParentOrganizationGUID { get; set; } // Added parent organization filter
        
        /// <summary>
        /// Filter by created users
        /// </summary>
        public List<Guid>? CreatedByGUIDs { get; set; }
        
        /// <summary>
        /// Filter by updated users
        /// </summary>
        public List<Guid>? UpdatedByGUIDs { get; set; }
    }
} 