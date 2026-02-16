using System;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.User
{
    public class UserFilterDto : BaseFilterDto
    {
        public Guid? GroupGUID { get; set; } // Changed from CompanyGUID for consistency
        
        /// <summary>
        /// Filter by active status: true, false, or null (both)
        /// </summary>
        public bool? bolIsActive { get; set; } // Filter for active/inactive users
        
        /// <summary>
        /// Filter by birth date range - from date (inclusive)
        /// </summary>
        public DateTime? dtBirthDateFrom { get; set; }
        
        /// <summary>
        /// Filter by birth date range - up to date (inclusive)
        /// </summary>
        public DateTime? dtBirthDateUpto { get; set; }
        
        /// <summary>
        /// Filter by created by users
        /// </summary>
        public List<Guid>? strGUIDsCreatedBy { get; set; }
        
        /// <summary>
        /// Filter by updated by users
        /// </summary>
        public List<Guid>? strGUIDsUpdatedBy { get; set; }

        /// <summary>
        /// Filter by designation GUIDs
        /// </summary>
        public List<Guid>? strDesignationGUIDs { get; set; }

        /// <summary>
        /// Filter by department GUIDs
        /// </summary>
        public List<Guid>? strDepartmentGUIDs { get; set; }
    }
} 