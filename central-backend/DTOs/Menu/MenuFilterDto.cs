using System.ComponentModel.DataAnnotations;
using AuditSoftware.DTOs.Common;

namespace AuditSoftware.DTOs.Menu
{
    public class MenuFilterDto : BaseFilterDto
    {
        /// <summary>
        /// Filter by category
        /// </summary>
        public string? strCategory { get; set; }

        /// <summary>
        /// Filter by page template GUID
        /// </summary>
        public string? strPageTemplateGUID { get; set; }
        
        /// <summary>
        /// Default constructor to set default values
        /// </summary>
        public MenuFilterDto()
        {
            SortBy = "dblSeqNo";
            ascending = true;
        }
    }
} 