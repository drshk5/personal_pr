using System;
using System.Collections.Generic;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.User
{
    public class UserFilterByOrgModuleDto : BaseFilterDto
    {
        public string CurrentUserGUID { get; set; } = string.Empty;
        public string ModuleGUID { get; set; } = string.Empty;
        public bool? bolIsActive { get; set; }
        
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
