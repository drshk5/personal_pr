using System.ComponentModel.DataAnnotations;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.MasterMenu
{
    public class MasterMenuFilterDto : BaseFilterDto
    {
        /// <summary>
        /// Filter by active status
        /// </summary>
        public bool? bolIsActive { get; set; }

        /// <summary>
        /// Filter by category (supports comma-separated values)
        /// </summary>
        public string? strCategory { get; set; }

        /// <summary>
        /// Filter by page template GUID (supports comma-separated values)
        /// </summary>
        public string? strPageTemplateGUID { get; set; }

        /// <summary>
        /// Filter by parent menu GUID (supports comma-separated values)
        /// </summary>
        public string? strParentMenuGUID { get; set; }

        /// <summary>
        /// Filter by menu position (supports comma-separated values)
        /// </summary>
        public string? strPosition { get; set; }

        /// <summary>
        /// Filter by super admin access
        /// </summary>
        public bool? bolIsSuperadmin { get; set; }

        /// <summary>
        /// Default constructor to set default values
        /// </summary>
        public MasterMenuFilterDto()
        {
            SortBy = "dblSeqNo";
            ascending = true;
        }
    }
}
