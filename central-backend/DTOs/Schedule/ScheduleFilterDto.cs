using AuditSoftware.DTOs.Common;
using Microsoft.AspNetCore.Mvc;

namespace AuditSoftware.DTOs.Schedule
{
    public class ScheduleFilterDto : BaseFilterDto
    {
        public bool? bolIsActive { get; set; }
        
        /// <summary>
        /// Filter by parent schedule GUIDs (comma-separated list)
        /// </summary>
        [FromQuery(Name = "strParentScheduleGUIDs")]
        public string? ParentScheduleGUIDs { get; set; }
        
        /// <summary>
        /// Filter by default account type GUIDs (comma-separated list)
        /// </summary>
        [FromQuery(Name = "strDefaultAccountTypeGUIDs")]
        public string? DefaultAccountTypeGUIDs { get; set; }
        
        /// <summary>
        /// Filter by editable status
        /// </summary>
        public bool? bolIsEditable { get; set; }
    }
}
